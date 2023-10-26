import validateParams from "../../../../utils/api/validateParams";
import {
  failedToFetchResponse,
  missingParamsResponse,
  successResponse,
} from "../../../../utils/api/responses";
import getOpenAISummary from "../../../../utils/actions/getOpenAISummary";
import { StandardProcessedDataArray } from "../../../../types/watermelon";
import getAllServices from "../../../../utils/actions/getAllServices";

function replaceSpecialChars(inputString) {
  const specialChars = /[!"#$%&/()=?_"{}¨*]/g; // Edit this list to include or exclude characters
  return inputString.toLowerCase().replace(specialChars, " ");
}

export async function POST(request: Request) {
  const req = await request.json();
  const { email, repo, owner, commitList } = req;

  const { missingParams } = validateParams(req, [
    "email",
    "repo",
    "owner",
    "commitList",
  ]);

  if (missingParams.length > 0) {
    return missingParamsResponse({ url: request.url, missingParams });
  }
  let searchStringSet;
  if (Array.isArray(commitList)) {
    searchStringSet = commitList.join(" ");
  } else {
    searchStringSet = Array.from(new Set(commitList.split(","))).join(" ");
  }
  // select six random words from the search string
  const randomWords = searchStringSet
    .split(" ")
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);

  const serviceAnswers = await getAllServices({
    email,
    repo,
    owner,
    randomWords,
    url: request.url,
  });
  const { error, github, jira, confluence, slack, notion, linear, asana } =
    serviceAnswers;
  if (error) {
    return failedToFetchResponse({
      url: request.url,
      error: error.message,
      email: req.email,
    });
  }
  const WatermelonAISummary = await getOpenAISummary({
    commitList: searchStringSet.replace(/\r?\n|\r/g, "").split(","),
    values: {
      github: github?.data,
      jira: jira?.data,
      confluence: confluence?.data,
      slack: slack?.data,
      notion: notion?.data,
      linear: linear?.data,
      asana: asana?.data,
    },
  });
  const standardWatermelonAISummary: StandardProcessedDataArray = [
    {
      title: "WatermelonAISummary",
      body: WatermelonAISummary,
      link: "https://app.watermelontools.com",
    },
  ];

  return successResponse({
    url: request.url,
    email: req.email,
    data: {
      github: github?.error || github?.fullData,
      jira: jira?.error || jira?.fullData,
      confluence: confluence?.error || confluence?.fullData,
      slack: slack?.error || slack?.fullData,
      notion: notion?.error || notion?.fullData,
      linear: linear?.error || linear?.fullData,
      asana: asana?.error || asana?.fullData,
      watermelonSummary: standardWatermelonAISummary,
    },
  });
}
