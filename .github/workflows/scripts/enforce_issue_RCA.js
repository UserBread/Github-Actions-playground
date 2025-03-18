module.exports = async ({ github, context }) => {
  // Stores issue data
  const issue = context.payload.issue;
  let commentBody = "";

  // Checks the labels of the issue for any specific ones
  const highPriorityLabels = ["bug-priority:high", "bug-priority:very-high", "type:regression"];
  const hasHighPriorityLabel = issue.labels.find(label =>
    highPriorityLabels.includes(label.name.toLowerCase())
  );
  if (hasHighPriorityLabel) {
    commentBody = `✅ The label applied is correct: ${hasHighPriorityLabel.name}.\n`;
  }

  // Check if the RCA is filled in
  const isIncompleteTemplate = (body) => {

    if (!body || body.trim() === "") {
      commentBody += "❌ The issue body is empty. Please fill out the Root Cause Analysis template.\n";
      return true;
    }

    // Required sections
    const requiredSections = [
      "## Root Cause Analysis",
      "### Problem",
      "### Fix",
      "### Why was it missed",
      "### How can we avoid this"
    ];

    // Check if all sections exist
    const missingSections = requiredSections.filter(section => !body.includes(section));
    if (missingSections.length === 0) {
      commentBody += "✅ All required Root Cause Analysis sections found in this issue.\n";
    } 
    else if (missingSections.length === requiredSections.length) {
      commentBody += "❌ No required Root Cause Analysis sections found in this issue.\n";
    } 
    else {
      missingSections.forEach(section => {
        commentBody += `⚠️ Missing required section: ${section}\n`;
      });
    }

    // Check if placeholders still exist
    const placeholders = [
      "{describe the problem}",
      "{describe the fix}",
      "{Some explanation why this issue was missed during normal development/testing cycle}",
      "{if we don’t want to see this type of issues anymore what we should do to prevent}"
    ];
    const presentPlaceholders = placeholders.filter(placeholder => body.includes(placeholder));
    if (presentPlaceholders.length === 0) {
      commentBody += "✅ No placeholders found in this issue\n";
    } 
    else if (presentPlaceholders.length === placeholders.length) {
      commentBody += "❌ No changes to placeholders found in this issue.\n";
    } 
    else {
      presentPlaceholders.forEach(placeholder => {
        commentBody += `⚠️ Placeholder found: ${placeholder}.\n`;
      });
    }

    // Returns true if the RCA is missing anything, else returns false
    return missingSections.length > 0 || presentPlaceholders.length > 0;
  };

  const needsReopening = isIncompleteTemplate(issue.body);

  if (issue.state === "closed" && hasHighPriorityLabel && needsReopening) {
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
