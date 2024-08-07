import { Context } from "../types";
import { addCommentToIssue } from "../utils/issue";
import { start } from "./shared/start";
import { stop } from "./shared/stop";

export async function userStartStop(context: Context): Promise<{ output: string | null }> {
  const { payload, config } = context;
  const { issue, comment, sender, repository } = payload;
  const slashCommand = comment.body.split(" ")[0].replace("/", "");
  const { isEnabled } = config;

  if (!isEnabled) {
    const backTicks = "```";
    await addCommentToIssue(context, `${backTicks}diff\n! The /${slashCommand} command is disabled for this repository.\n${backTicks}`);
    throw new Error(`The '/${slashCommand}' command is disabled for this repository.`);
  }

  if (slashCommand === "stop") {
    return await stop(context, issue, sender, repository);
  } else if (slashCommand === "start") {
    return await start(context, issue, sender);
  }

  return { output: null };
}
