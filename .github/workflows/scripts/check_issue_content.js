module.exports = async ({ github, context }) => {
    const issue = context.payload.issue;
    let commentBody = "";
    let reopenIssue = false;
    // All sections from issue form. This list must be kept up-to-date!
    const sections = [
        'Source','Customer case', 'Internal incident', 'Description', 'Steps to reproduce', 'Expected results',
        'Actual results', 'Screenshots', 'Add fiori tools component/version','Project Files', 'Operating System',
        'Browser', 'Environment', 'Problem', 'Why was it missed?', 'How can we avoid this'
    ]
    // Required Root Cause Analysis Sections
    const rca_sections = [
        'Problem', 'Why was it missed?', 'How can we avoid this'
    ]

    // Check all issue sections and test if a response was given
    for (let i=0; i<sections.length - 1; i++) {
        if (isBetween(issue.body, sections[i], "_No response_", sections[i+1])) {
            commentBody += `❌ ${sections[i]} section is missing from the issue.\n`
        } else {
            commentBody += `✅ ${sections[i]} section was included with the issue.\n`
        }
    }

    // Reopen issue if required RCA section is missing
    for (let i=0; i<rca_sections.length - 1; i++) {
        if (isBetween(issue.body, rca_sections[i], "_No response_", rca_sections[i+1])) {
            reopenIssue = true;
        }
    }

    if (reopenIssue) {
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
    let regexStr = String.raw`${start}[\s\S]*?${between}[\s\S]*?${end}`;
    const regex = new RegExp(regexStr)
    return regex.test(text)
}
