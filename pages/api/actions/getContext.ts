import executeRequest from "../../../utils/db/azuredb";
import getGitHub from "../../../utils/actions/getGitHub";
import getSlack from "../../../utils/actions/getSlack";
import getJira from "../../../utils/actions/getJira";
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  const { user, title, body, repo, owner, number, commitList } = req.body;
  if (!user) {
    return res.send({ error: "no user" });
  }
  if (!title) {
    return res.send({ error: "no title" });
  }
  if (!repo) {
    return res.send({ error: "no repo" });
  }
  if (!owner) {
    return res.send({ error: "no owner" });
  }
  if (!number) {
    return res.send({ error: "no number" });
  }
  if (!commitList) {
    return res.send({ error: "no commitList" });
  }
  const query = `EXEC dbo.get_all_tokens_from_gh_username @github_user='${user}'`;
  const resp = await executeRequest(query);
  const {
    github_token,
    jira_token,
    jira_refresh_token,
    slack_token,
    cloudId,
    user_email,
  } = resp;
  const commitSet = new Set(commitList.split(","));
  const stopwords = [
    "a",
    "about",
    "add comments",
    "add",
    "all",
    "an",
    "and",
    "as",
    "at",
    "better",
    "build",
    "bump dependencies",
    "bump version",
    "but",
    "by",
    "call",
    "cd",
    "change",
    "changed",
    "changes",
    "changing",
    "chore",
    "ci",
    "cleanup",
    "code review",
    "comment out",
    "commit",
    "commits",
    "config",
    "config",
    "create",
    "critical",
    "debug",
    "delete",
    "dependency update",
    "deploy",
    "docs",
    "documentation",
    "eslint",
    "feat",
    "feature",
    "fix",
    "fix",
    "fixed",
    "fixes",
    "fixing",
    "for",
    "from",
    "get",
    "github",
    "gitignore",
    "hack",
    "he",
    "hotfix",
    "husky",
    "if",
    "ignore",
    "improve",
    "improved",
    "improvement",
    "improvements",
    "improves",
    "improving",
    "in",
    "init",
    "is",
    "lint-staged",
    "lint",
    "linting",
    "list",
    "log",
    "logging",
    "logs",
    "major",
    "merge conflict",
    "merge",
    "minor",
    "npm",
    "of",
    "on",
    "oops",
    "or",
    "package-lock.json",
    "package.json",
    "prettier",
    "print",
    "quickfix",
    "refactor",
    "refactored",
    "refactoring",
    "refactors",
    "release",
    "remove comments",
    "remove console",
    "remove",
    "remove",
    "removed",
    "removes",
    "removing",
    "revert",
    "security",
    "setup",
    "squash",
    "start",
    "style",
    "stylelint",
    "temp",
    "test",
    "tested",
    "testing",
    "tests",
    "the",
    "to",
    "try",
    "typo",
    "up",
    "update dependencies",
    "update",
    "updated",
    "updates",
    "updating",
    "use",
    "version",
    "was",
    "wip",
    "with",
    "yarn.lock",
    "master",
    "main",
    "dev",
    "development",
    "prod",
    "production",
    "staging",
    "stage",
    "[",
    "]",
    "!",
    "{",
    "}",
    "(",
    ")",
    "''",
    '"',
    "``",
    "-",
    "_",
    ":",
    ";",
    ",",
    ".",
    "?",
    "/",
    "|",
    "&",
    "*",
    "^",
    "%",
    "$",
    "#",
    "##",
    "###",
    "####",
    "#####",
    "######",
    "#######",
    "@",
    "\n",
    "\t",
    "\r",
    "<!--",
    "-->",
    "/*",
    "*/",
    "[x]",
    "[]",
    "[ ]",
  ];
  // create a string from the commitlist set and remove stopwords in lowercase

  const searchStringSet = Array.from(commitSet).join(" ");

  // add the title and body to the search string, remove stopwords and remove duplicates
  const searchStringSetWTitleABody = Array.from(
    new Set(
      searchStringSet
        .concat(` ${title.split("/").join(" ")}`)
        .concat(` ${body}`.split("\n").join(" "))
        .split("\n")
        .flatMap((line) => line.split(","))
        .map((commit: string) => commit.toLowerCase())
        .filter((commit) => !stopwords.includes(commit))
        .join(" ")
        .split(" ")
    )
  ).join(" ");
  // select six random words from the search string
  const randomWords = searchStringSetWTitleABody
    .split(" ")
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);
  const [ghValue, jiraValue, slackValue] = await Promise.all([
    getGitHub({
      repo,
      owner,
      github_token,
      randomWords,
    }),
    getJira({
      user: user_email,
      title,
      body,
      jira_token,
      jira_refresh_token,
      randomWords,
    }),
    getSlack({ title, body, slack_token, randomWords }),
  ]);

  const businessLogicSummary = await openai
    .createCompletion({
      model: "text-davinci-003",
      prompt: `PR 1 title: ${ghValue[0].title || ""} \n PR 1 body: ${
        ghValue[0].body || ""
      } \n PR 2 title: ${ghValue[1].title || ""} \n PR 2 body: ${
        ghValue[1].body || ""
      } \n PR 3 title: ${ghValue[2].title || ""} \n PR 3 body: ${
        ghValue[2].body || ""
      } \n ${
        commitList || ""
      } \n Summarize what the 3 PRs and the commit list are about. What are these 3 PRs and the commit list tell us about the business logic? Don't summarize each PR and commit separately, combine them. Don't say "these PRs", instead say "related PRs".`,
      max_tokens: 512,
      temperature: 0.7,
    })
    .then((res) => res.data.choices[0].text.trim())
    .catch((err) => res.send("error: ", err.message));

  return res.send({
    ghValue: ghValue ?? { error: "no value" },
    jiraValue: jiraValue ?? { error: "no value" },
    slackValue: slackValue ?? { error: "no value" },
    businessLogicSummary: businessLogicSummary ?? { error: "no value" },
  });
}
