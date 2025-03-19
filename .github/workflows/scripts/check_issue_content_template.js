module.exports = async ({ github, context }) => {
    const issue = context.payload.issue;
    const body = issue.body;
    let commentBody = "";
  
    // Check Label
    const highPriorityLabels = ["bug-priority:high", "bug-priority:very-high", "type:regression"];
    const hasHighPriorityLabel = issue.labels.find(label =>
      highPriorityLabels.includes(label.name.toLowerCase())
    );
  
    // Check placeholders in specified sections
    function validateSection(body, start, middle, end, isRCA) {
      const regex = end ? new RegExp(`${start}[\\s\\S]*?${middle}[\\s\\S]*?${end}`) : new RegExp(`${start}[\\s\\S]*?${middle}`);
      if (!body.match(regex)) {
        commentBody += `✅ No placeholder found in "${start}"\n`;
      }
      else if (isRCA) {
        commentBody += `❌ Placeholder found in "${start}"\n`
      }
    }
  
    // Check the sections in the main body
    function checkIssueBody() {
  
      commentBody += "### Issue Body\n";
      // Define sections and iterate through them
      const sections = [
        {
          start: "Source \\(User Story/ TBI/ Customer case Link/ Internal incident link/ E2E/ others\\)",
          middle: "_link_",
          end: "Description"
        },
        { start: "Description", middle: "{placeholder}", end: "Steps to Reproduce" },
        { start: "Steps to Reproduce", middle: "Go to '...'", end: "Expected results" },
      ];
  
      const sectionHeadings = [
        "Expected results",
        "Actual results",
        "Screenshots",
        "Fiori tools component/version",
        "Project Files",
        "OS/Browser/Environment"
      ];
  
      // Add section checks
      sections.forEach(({ start, middle, end }) => validateSection(body, start, middle, end));
  
      // Iterate through section headings for sequential checks
      for (let i = 0; i < sectionHeadings.length - 1; i++) {
        validateSection(body, sectionHeadings[i], "{placeholder}", sectionHeadings[i + 1]);
      }
  
      // Checking OS/Browser/Environment
      validateCheckmarksSection(body, "OS:", "[x]", "Browser:");
      validateCheckmarksSection(body, "Browser:", "[x]", "Environment:");
      validateCheckmarksSection(body, "Environment:", "[x]", "---");
  
      function validateCheckmarksSection(body, start, middle, end) {
  
        const regex = end ? new RegExp(`${start}[\\s\\S]*?${middle}[\\s\\S]*?${end}`) : new RegExp(`${start}[\\s\\S]*?${middle}`);
        if (body.match(regex)) {
          commentBody += `✅  Box checked in "${start}"\n`;
        }
      }
    }
  
    // Check sections in Root Cause Analysis
    function checkRootCauseAnalysis() {
      const sections = [
        { start: "Problem", middle: "{describe the problem}", end: "Fix" },
        { start: "Fix", middle: "{describe the fix}", end: "Why was it missed" },
        { start: "Why was it missed", middle: "{Some explanation why this issue was missed during normal development/testing cycle}", end: "How can we avoid this" },
        { start: "How can we avoid this", middle: "{if we don’t want to see this type of issues anymore what we should do to prevent}" },
      ]
      sections.forEach(({ start, middle, end }) => validateSection(body, start, middle, end, true));
    }
  
    // Call body checker
    checkIssueBody();
  
    // If we have the correct label we can check RCA, reopen issue and create a comment
    if (hasHighPriorityLabel) {
      commentBody += "### Root Cause Analysis\n"
      checkRootCauseAnalysis();
  
      // Reopen the issue
      await github.rest.issues.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issue.number,
        state: "open"
      });
  
      // Add a comment explaining why it was reopened
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issue.number,
        body: commentBody
      });
    }
  };