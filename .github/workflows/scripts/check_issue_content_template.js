async function checkIssueContent({ github, context }) {
  const issue = context.payload.issue;
  const body = issue.body;
  let commentBody = "";
  let reopenIssue = false;

  // Label Checker
  const highPriorityLabels = ["bug-priority:high", "bug-priority:very-high", "type:regression"];
  const hasHighPriorityLabel = issue.labels.find(label =>
    highPriorityLabels.includes(label.name.toLowerCase())
  );

  // Check Root Cause Analysis sections
  function checkRootCauseAnalysis() {
    commentBody += "This issue was reopened because it is labelled **" + hasHighPriorityLabel.name + "** and the following sections have not been filled out:\n\n**Root Cause Analysis**\n";

    const sections = [
      { start: "Problem", middle: "{describe the problem}", end: "Fix" },
      { start: "Fix", middle: "{describe the fix}", end: "Why was it missed" },
      {
        start: "Why was it missed",
        middle: "{Some explanation why this issue was missed during normal development/testing cycle}",
        end: "How can we avoid this",
      },
      {
        start: "How can we avoid this",
        middle: "{if we don’t want to see this type of issues anymore what we should do to prevent}",
      },
    ];
    for (const section of sections) {
      if (!body.includes(section.start)) {
        commentBody += `❌ **${section.start}** heading is missing from the issue.\n`;
        reopenIssue = true;
      }
      else if (validateSection(body, section.start, section.middle, section.end) || validateSection(body, section.start, "\n{3,}", section.end)) {
        commentBody += `❌ **${section.start}** section is missing from the issue.\n`;
        reopenIssue = true;
      }
    }
  }

  // Label & Root Cause Analysis check 
  if (hasHighPriorityLabel) {
    checkRootCauseAnalysis();
    commentBody += "\nPlease fill out the required sections before closing the issue.";
    if (reopenIssue) {
      // Reopen the issue
      await github.rest.issues.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issue.number,
        state: "open",
      });

      // Add a comment explaining why it was reopened
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issue.number,
        body: commentBody,
      });
    }
  }
};

// Section validator
function validateSection(body, start, middle, end) {
  const regex = end ? new RegExp(`${start}[\\s\\S]*?${middle}[\\s\\S]*?${end}`) : new RegExp(`${start}[\\s\\S]*?${middle}`);
  return regex.test(body);
}
module.exports = { checkIssueContent, validateSection };