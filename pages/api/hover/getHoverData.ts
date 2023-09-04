import getUserTokens from "../../../utils/db/user/getUserTokens";
import { Octokit } from "octokit";
import { trackEvent } from "../../../utils/analytics/azureAppInsights";
import updateTokensFromJira from "../../../utils/jira/updateTokens";
import updateTokens from "../../../utils/db/jira/updateTokens";
import searchMessageByText from "../../../utils/slack/searchMessageByText";
import validateParams from "../../../utils/api/validateParams";
function replaceSpecialChars(inputString) {
  const specialChars = /[!"#$%&/()=?_"{}¨*]/g; // Edit this list to include or exclude characters
  return inputString.toLowerCase().replace(specialChars, " ");
}
function handleRejection(reason) {
  console.error(reason);
  return { error: reason };
}
export default async function handler(req, res) {
  const { user, gitSystem, repo, owner, commitTitle } = req.body;
  const { missingParams } = validateParams(req.body, [
    "user",
    "repo",
    "owner",
    "gitSystem",
    "commitTitle",
  ]);

  if (missingParams.length > 0) {
    return res.json({
      error: `Missing parameters: ${missingParams.join(", ")}`,
    });
  }

  let userTokens;
  try {
    userTokens = await getUserTokens({ email: user });
  } catch (error) {
    console.error(
      "An error occurred while getting user tokens:",
      error.message
    );
    return res.send({ error });
  }
  async function fetchGitHubIssues(userTokens, owner, repo) {
    const { github_token } = userTokens;

    const octokit = new Octokit({
      auth: github_token,
    });

    let q = `repo:${owner}/${repo}`;
    let issues;
    try {
      issues = await octokit.rest.search.issuesAndPullRequests({
        q,
        is: "pr",
        type: "pr",
        per_page: 1,
      });

      return issues?.data?.items;
    } catch (error) {
      console.error("An error occurred while getting issues:", error.message);
    }
    return issues?.data?.items;
  }
  async function fetchJiraTickets(userTokens, commitTitle) {
    const { jira_token, jira_refresh_token, cloudId, user } = userTokens;
    if (!jira_token || !jira_refresh_token) {
      return { error: "no jira token" };
    } else {
      const newAccessTokens = await updateTokensFromJira({
        refresh_token: jira_refresh_token,
      });
      if (!newAccessTokens?.access_token) {
        return { error: "no access_token" };
      }

      if (!cloudId) {
        return { error: "no Jira cloudId" };
      }
      await updateTokens({
        access_token: newAccessTokens.access_token,
        refresh_token: newAccessTokens.refresh_token,
        user: userTokens.user,
      });

      let jql = `(summary ~ "${commitTitle}") AND (description ~ "${commitTitle}") ORDER BY created DESC`;
      let returnVal = await fetch(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${newAccessTokens.access_token}`,
          },
          body: JSON.stringify({
            jql,
            expand: ["renderedFields"],
            maxResults: 1,
          }),
        }
      )
        .then((res) => res.json())
        .then((resJson) => resJson.issues)
        .catch((error) => {
          console.error(error);
        });

      return returnVal;
    }
  }
  async function fetchSlackConversations(userTokens, commitTitle) {
    let { slack_token } = userTokens;
    let slackValue = {};

    if (!slack_token) {
      slackValue = { error: "no slack token" };
    } else {
      let response = await searchMessageByText({
        text: commitTitle,
        user_token: slack_token,
        count: 1,
      });
      slackValue = response?.messages?.matches;
    }
    return slackValue;
  }
  const [githubResult, jiraResult, slackResult] = await Promise.allSettled([
    fetchGitHubIssues(userTokens, owner, repo),
    fetchJiraTickets(userTokens, commitTitle),
    fetchSlackConversations(userTokens, commitTitle),
  ]);

  const githubIssues =
    githubResult.status === "fulfilled"
      ? githubResult.value
      : handleRejection(githubResult.reason);
  const jiraTickets =
    jiraResult.status === "fulfilled"
      ? jiraResult.value
      : handleRejection(jiraResult.reason);
  const slackConversations =
    slackResult.status === "fulfilled"
      ? slackResult.value
      : handleRejection(slackResult.reason);

  trackEvent({
    name: "unifiedHoverData",
    properties: { user, gitSystem, repo, owner, commitTitle },
  });

  return res.send({
    github: githubIssues,
    jira: jiraTickets,
    slack: slackConversations,
  });
}