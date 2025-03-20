module.exports = async ({ github, context }) => {
    const issue = context.payload.issue;   
    let reopenIssue = false;
    const placeholder = '_No response_'
    // All sections from issue form. This list must be kept up-to-date!
    const sections = [
        'Problem', 'Fix', 'Why was it missed?', 'How can we avoid this'
    ]

    const highPriorityLabels = ["bug-priority:high", "bug-priority:very-high", "type:regression"];
    // Reopen issue if required RCA section is missing for high priority issues
    const hasHighPriorityLabel = issue.labels.find(label =>
        highPriorityLabels.includes(label.name.toLowerCase())
    );

    let commentBody = `
    This issue  was reopened  because it is labelled ${hasHighPriorityLabel.name} and the following sections have not been filled out:

    **Root Cause Analysis**`;

    // Check all issue sections and test if a response was given
    for (let i=0; i<sections.length - 1; i++) {
        if (isBetween(issue.body, sections[i], placeholder, sections[i+1])) {
            commentBody += `❌ **${sections[i]}** section is missing from the issue.\n`
            reopenIssue = true;
        } else {
            commentBody += `✅ **${sections[i]}** section was included with the issue.\n`
        }
    }
    // Check last section in the list
    if (isBetween(issue.body, sections[sections.length - 1], placeholder)) {
        commentBody += `❌ **${sections[sections.length - 1]}** section is missing from the issue.\n`
        reopenIssue = true;
    } else {
        commentBody += `✅ **${sections[sections.length - 1]}** section was included with the issue.\n`
    }

    commentBody += "\nPlease fill out the required sections and close the issue.";

    if (reopenIssue && hasHighPriorityLabel) {
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
}

// Check if a string is between 2 others from text sample
function isBetween(text, start, between, end) {
    let regexStr = "";
    if (end !== undefined) {
        regexStr = String.raw`${start}[\s\S]*?${between}[\s\S]*?${end}`;
    } else {
        regexStr = String.raw`${start}[\s\S]*?${between}`;
    }
    const regex = new RegExp(regexStr)
    return regex.test(text)
}
