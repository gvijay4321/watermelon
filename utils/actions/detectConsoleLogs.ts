const { Configuration, OpenAIApi } = require("openai");
import { App } from "@octokit/app";
import { successPosthogTracking } from "../../utils/api/posthogTracking";
import {
  failedToFetchResponse,
  missingParamsResponse,
} from "../../utils/api/responses";
import validateParams from "../../utils/api/validateParams";
import { Octokit } from "octokit";

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});
const openai = new OpenAIApi(configuration);

const app = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_PRIVATE_KEY!,
});

function getAdditions(filePatch: string) {
  const additions: string[] = [];

  // Split the patch into lines
  const lines = filePatch.split("\n");

  // Track if we are in a deletion block
  let inDeletionBlock = false;

  // Loop through lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if entering a deletion block
    if (line.startsWith("-")) {
      inDeletionBlock = true;
      continue;
    }

    // Check if exiting a deletion block
    if (line.startsWith("+") && inDeletionBlock) {
      inDeletionBlock = false;
      continue;
    }

    // If not in a deletion block, add lines starting with +
    if (!inDeletionBlock && line.startsWith("+")) {
      additions.push(line);
    }

    // Delete the pluses
    lines[i] = line.replace("+", "");

    // Trim the line to delete leading spaces
    lines[i] = lines[i].trim();

    // If the line is a comment, remove it
    if (
      lines[i].startsWith("#") ||
      lines[i].startsWith("//") ||
      lines[i].startsWith("/*")
    ) {
      lines.splice(i, 1);
      i--;
    }
  }

  return lines.join("\n");
}

function getConsoleLogPosition(filePatchAndIndividualLine: any) {
  let positionInDiff = 1;
  const { filePatch, individualLine } = filePatchAndIndividualLine;

  // get the position of the indiviudalLine in th filePatch
  const lines = filePatch.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(individualLine)) {
      positionInDiff = i + 1;
      break;
    }
  }

  return positionInDiff;
}

export default async function detectConsoleLogs({
  installationId,
  owner,
  repo,
  issue_number,
  reqUrl,
  reqEmail,
}: {
  prTitle?: string;
  businessLogicSummary?: string;
  installationId: number;
  owner: string;
  repo: string;
  issue_number: number;
  reqUrl: string;
  reqEmail: string;
}) {
  const octokit = await app.getInstallationOctokit(installationId);

  // get the diffs
  const { data: diffFiles } = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
    {
      owner,
      repo,
      pull_number: issue_number,
    }
  );

  const commentPromises = diffFiles.map(async (file) => {
    const additions = getAdditions(file.patch ?? "");

    const consoleLogDetectionPrompt = `This is a list of code additions. Identify 
    if there's a console log or its equivalent in another programming language 
    (console.log(), println(), System.out.println(), print(), fmt.Println(), etc.). 
    If the console log or its equivalent in another language is in a code comment, don't
    count it as a detected console log. For example JavaScript comments start with // or /*, 
    Python comments start with #.
    Other console functions such as console.info() shouldn't be counted as console logs.
    Ignore code comments from this analysis. 
    If there is a console log, return "true", else return "false".
    If you return true, return a string that that has 2 values: result (true) and the line of code.
    The line value, is the actual line in the file that contains the console log.
    For example: true,console.log("hello world");`;

    // detect if the additions contain console logs or not
    try {
      return await openai
        .createChatCompletion({
          model: "gpt-3.5-turbo-16k",
          messages: [
            {
              role: "system",
              content: `${consoleLogDetectionPrompt} \n ${additions}`,
            },
          ],
        })
        .then((result) => {
          const openAIResult = result.data.choices[0].message.content.split(",");

          const addtionsHaveConsoleLog = openAIResult[0];
          const individualLine = openAIResult[1];

          if (addtionsHaveConsoleLog === "true") {
            const commentFileDiff = () => {
              return octokit
                .request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
                  owner,
                  repo,
                  pull_number: issue_number,
                })
                .then((result) => {
                  const latestCommitHash = result.data.head.sha;

                  return octokit.request(
                    "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
                    {
                      owner,
                      repo,
                      pull_number: issue_number,
                      commit_id: latestCommitHash,
                      event: "REQUEST_CHANGES",
                      path: file.filename,
                      comments: [
                        {
                          path: file.filename,
                          position: getConsoleLogPosition({
                            filePatch: file.patch ?? "",
                            individualLine
                          }) || 1, // comment at the beggining of the file by default
                          body: "getConsoleLogPosition - This file contains at least one console log. Please remove any present.",
                        },
                      ],
                    }
                  );
                });
            };

            commentFileDiff();
          }
        });
    } catch {}
  });
  try {
    await Promise.allSettled(commentPromises);
  } catch {}
}
