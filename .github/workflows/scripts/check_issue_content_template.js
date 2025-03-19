module.exports = async ({ github, context }) => {
  const issue = context.payload.issue;
  const body = issue.body;
  let commentBody = "";

  // Label Checker
  const highPriorityLabels = ["bug-priority:high", "bug-priority:very-high", "type:regression"];
  const hasHighPriorityLabel = issue.labels.find(label =>
    highPriorityLabels.includes(label.name.toLowerCase())
  );

  // General section validator
  function validateSection(body, start, middle, end, isRCA = false, checkmarksOnly = false) {
    const regex = end ? new RegExp(`${start}[\\s\\S]*?${middle}[\\s\\S]*?${end}`) : new RegExp(`${start}[\\s\\S]*?${middle}`);
    const matched = body.match(regex);

    if (checkmarksOnly) {
      if (matched) commentBody += `✅ Box checked in "${start}"\n`;
    } else if (!matched) {
      commentBody += `✅ No placeholder found in "${start}"\n`;
    } else if (isRCA) {
      commentBody += `❌ Placeholder found in "${start}"\n`;
    }
  }

  // Check the issue body sections
  function checkIssueBody() {
    commentBody += "### Issue Body\n";

    // Validate specific sections
    validateSection(body, "Source(US,TBI,E2E,etc)", "_link_", "Customer case");
    validateSection(body, "Customer case", "_link_", "Internal incident");
    validateSection(body, "Internal incident", "_link_", "Description");

    const sections = [
      { start: "Description", middle: "{placeholder}", end: "Steps to Reproduce" },
      { start: "Steps to Reproduce", middle: "Go to '...'", end: "Expected results" },
    ];
    sections.forEach(({ start, middle, end }) => validateSection(body, start, middle, end));

    const sectionHeadings = [
      "Expected results",
      "Actual results",
      "Screenshots",
      "Fiori tools component/version",
      "Project Files",
      "OS/Browser/Environment"
    ];
    for (let i = 0; i < sectionHeadings.length - 1; i++) {
      validateSection(body, sectionHeadings[i], "{placeholder}", sectionHeadings[i + 1]);
    }

    // Validate checkmark sections
    validateSection(body, "OS:", "[x]", "Browser:", false, true);
    validateSection(body, "Browser:", "[x]", "Environment:", false, true);
    validateSection(body, "Environment:", "[x]", "---", false, true);
  }

  // Check Root Cause Analysis sections
  function checkRootCauseAnalysis() {
    commentBody += "### Root Cause Analysis\n";

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
    sections.forEach(({ start, middle, end }) => validateSection(body, start, middle, end, true));
  }

  // Main body check
  checkIssueBody();

  // Label & Root Cause Analysis check 
  if (hasHighPriorityLabel) {
    checkRootCauseAnalysis();
    try {
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
    } catch (error) {
      console.error("Error updating issue or adding comment:", error);
    }
  }
};
