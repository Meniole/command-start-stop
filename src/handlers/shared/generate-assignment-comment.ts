import { Context } from "../../types/context";
import { calculateDurations } from "../../utils/shared";

export const options: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  timeZone: "UTC",
  timeZoneName: "short",
};

export function getDeadline(issue: Context["payload"]["issue"]) {
  if (!issue?.labels) {
    throw new Error("No labels are set.");
  }
  const startTime = new Date().getTime();
  const duration: number = calculateDurations(issue.labels).shift() ?? 0;
  const endTime = new Date(startTime + duration * 1000);
  return endTime.toLocaleString("en-US", options);
}

export async function generateAssignmentComment(context: Context, issueCreatedAt: string, issueNumber: number, senderId: number, deadline: string) {
  const startTime = new Date().getTime();

  return {
    daysElapsedSinceTaskCreation: Math.floor((startTime - new Date(issueCreatedAt).getTime()) / 1000 / 60 / 60 / 24),
    deadline: duration > 0 ? deadline : null,
    registeredWallet:
      (await context.adapters.supabase.user.getWalletByUserId(senderId, issueNumber)) ||
      "Register your wallet address using the following slash command: `/wallet 0x0000...0000`",
    tips: `<h6>Tips:</h6>
    <ul>
    <li>Use <code>/wallet 0x0000...0000</code> if you want to update your registered payment wallet address.</li>
    <li>Be sure to open a draft pull request as soon as possible to communicate updates on your progress.</li>
    <li>Be sure to provide timely updates to us when requested, or you will be automatically unassigned from the task.</li>
    <ul>`,
  };
}
