import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, jest } from "@jest/globals";
import { drop } from "@mswjs/data";
import { Repository } from "@octokit/graphql-schema";
import dotenv from "dotenv";
import { Context } from "../src/types";
import { db } from "./__mocks__/db";
import issueTemplate from "./__mocks__/issue-template";
import { server } from "./__mocks__/node";
import { createContext } from "./utils";

dotenv.config();

const userLogin = "ubiquity-os-author";

type Issue = Context<"issue_comment.created">["payload"]["issue"];
type PayloadSender = Context["payload"]["sender"];

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => server.close());

async function setupTests() {
  db.users.create({
    id: 1,
    login: "user1",
    role: "contributor",
  });
  db.issue.create({
    ...issueTemplate,
    labels: [{ name: "Priority: 1 (Normal)", description: "collaborator only" }, ...issueTemplate.labels],
  });
  db.repo.create({
    id: 1,
    html_url: "",
    name: "test-repo",
    owner: {
      login: "ubiquity",
      id: 1,
      type: "Organization",
    },
    issues: [],
  });
}

describe("Pull-request tests", () => {
  beforeEach(async () => {
    drop(db);
    jest.clearAllMocks();
    jest.resetModules();
    jest.resetAllMocks();
    await setupTests();
  });

  it("Should properly update the close status of a linked pull-request", async () => {
    const issue = db.issue.findFirst({ where: { id: { equals: 1 } } }) as unknown as Issue;
    const repo = db.repo.findFirst({ where: { id: { equals: 1 } } }) as unknown as Repository;
    issue.labels = [];
    const sender = db.users.findFirst({ where: { id: { equals: 1 } } }) as unknown as PayloadSender;

    const context = createContext(issue, sender, "") as Context<"pull_request.opened">;
    context.eventName = "pull_request.opened";
    context.payload.pull_request = {
      html_url: "https://github.com/ubiquity-os-marketplace/command-start-stop",
      number: 1,
      user: {
        id: 1,
        login: userLogin,
      },
    } as unknown as Context<"pull_request.edited">["payload"]["pull_request"];
    context.octokit = {
      rest: {
        pulls: {
          update: jest.fn(),
        },
      },
      graphql: {
        paginate: jest.fn(() =>
          Promise.resolve({
            repository: {
              pullRequest: {
                closingIssuesReferences: {
                  nodes: [
                    {
                      assignees: {
                        nodes: [],
                      },
                      repository: repo,
                    },
                  ],
                },
              },
            },
          })
        ),
      },
    } as unknown as Context<"pull_request.edited">["octokit"];
    jest.unstable_mockModule("@supabase/supabase-js", () => ({
      createClient: jest.fn(),
    }));
    jest.unstable_mockModule("../src/adapters", () => ({
      createAdapters: jest.fn(),
    }));
    jest.unstable_mockModule("@ubiquity-os/plugin-sdk/octokit", () => ({
      customOctokit: jest.fn().mockReturnValue({
        rest: {
          apps: {
            getRepoInstallation: jest.fn(() => Promise.resolve({ data: { id: 1 } })),
          },
          issues: {
            get: jest.fn(() => Promise.resolve({ data: { ...issue, labels: [{ name: "Time: <1 Hour" }] } })),
          },
          repos: {
            get: jest.fn(() => Promise.resolve({ data: repo })),
          },
          orgs: {
            get: jest.fn(() => Promise.resolve({ data: repo?.owner })),
          },
        },
      }),
    }));
    const { startStopTask } = await import("../src/plugin");
    await expect(startStopTask(context)).rejects.toMatchObject({
      logMessage: {
        raw: expect.stringContaining("No price label is set to calculate the duration"),
      },
    });
  });

  it("Should properly update the close status of a linked pull-request", async () => {
    const issue = db.issue.findFirst({ where: { id: { equals: 1 } } }) as unknown as Issue;
    const repo = db.repo.findFirst({ where: { id: { equals: 1 } } }) as unknown as Repository;
    issue.labels = [];
    const sender = db.users.findFirst({ where: { id: { equals: 1 } } }) as unknown as PayloadSender;

    const context = createContext(issue, sender, "") as Context<"pull_request.opened">;
    context.eventName = "pull_request.opened";
    context.payload.pull_request = {
      html_url: "https://github.com/ubiquity-os-marketplace/command-start-stop",
      number: 1,
      user: {
        id: 1,
        login: userLogin,
      },
    } as unknown as Context<"pull_request.edited">["payload"]["pull_request"];
    context.octokit = {
      rest: {
        pulls: {
          update: jest.fn(),
        },
      },
      graphql: {
        paginate: jest.fn(() =>
          Promise.resolve({
            repository: {
              pullRequest: {
                closingIssuesReferences: {
                  nodes: [
                    {
                      assignees: {
                        nodes: [],
                      },
                      repository: repo,
                    },
                  ],
                },
              },
            },
          })
        ),
      },
    } as unknown as Context<"pull_request.edited">["octokit"];
    jest.unstable_mockModule("@supabase/supabase-js", () => ({
      createClient: jest.fn(),
    }));
    jest.unstable_mockModule("../src/adapters", () => ({
      createAdapters: jest.fn(),
    }));
    jest.unstable_mockModule("@ubiquity-os/plugin-sdk/octokit", () => ({
      customOctokit: jest.fn().mockReturnValue({
        rest: {
          apps: {
            getRepoInstallation: jest.fn(() => Promise.resolve({ data: { id: 1 } })),
          },
          issues: {
            get: jest.fn(() => Promise.resolve({ data: { ...issue, labels: [{ name: "Time: <1 Hour" }] } })),
          },
          repos: {
            get: jest.fn(() => Promise.resolve({ data: repo })),
            getCollaboratorPermissionLevel: jest.fn(() => Promise.resolve({ data: { role_name: "admin" } })),
          },
          orgs: {
            get: jest.fn(() => Promise.resolve({ data: repo?.owner })),
            getMembershipForUser: jest.fn(() => ({ data: { role: "member" } })),
          },
        },
      }),
    }));
    const { startStopTask } = await import("../src/plugin");
    await expect(startStopTask(context)).rejects.toMatchObject({
      logMessage: {
        raw: "This task does not reflect a business priority at the moment.\nYou may start tasks with one of the following labels: `Priority: 1 (Normal)`, `Priority: 2 (Medium)`, `Priority: 3 (High)`, `Priority: 4 (Urgent)`, `Priority: 5 (Emergency)`",
      },
    });
  });
});
