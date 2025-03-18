module.exports = async ({ github, context }) => {

    const issue = context.payload.issue;
    const commentBody = "";

    // Check Source

    // Check Description

    // Check Steps to Repoduce

    // Check Expected Results
    const expectedResultsTemplate = "### Expected results\n "
    if (!issue.body.includes(expectedResultsTemplate)) commentBody += "✅ Expected Results is filled out";

    // Check Actual Results

    // Check Screenshots

    // Check Fiori tools component/version

    // Check Project Files

    // Check OS/Browser/Environment
}