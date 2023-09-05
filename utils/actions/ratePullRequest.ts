import { StandardProcessedDataArray } from "../../types/watermelon";

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});
const openai = new OpenAIApi(configuration);
export default async function flagPullRequest({
  prTitle, 
  businessLogicSummary
}: {
  prTitle?: string;
  businessLogicSummary?: string;
}) {

  const prompt = `The goal of this PR is to: ${prTitle}. \n The information related to this PR is: ${businessLogicSummary}. \n On a scale of 1(very different)-10(very similar), how similar the PR's goal and the PR's related information are? Take into account semantics. Don't explain your reasoning, just print the rating. Don't give a range for the rating, print a single value.`

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content:
            prompt,
        },
        { role: "user", content: prompt },
      ],
    });
    console.log("pr title: " + prTitle);
    console.log("business logic summary: " + businessLogicSummary);
    console.log("OpenAI Rating: " + completion.data.choices[0].message.content);
    return completion.data.choices[0].message.content;
  } catch (error) {
    console.log(error);
    return "Error" + error;
  }
}