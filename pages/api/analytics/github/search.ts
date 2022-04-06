import Airtable from "airtable";
Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: process.env.AIRTABLE_API_KEY,
});
const base = require("airtable").base("appDpKitgxjDIUwZ3");

export default async function handler(req, res) {
  const { searchType, owner, repo, localUser, userEmail } = req.body;
  let createdRecord = await base("Searches").create({
    Type: searchType,
    Owner: owner,
    Repo: repo,
    Username: localUser,
    Email: userEmail,
  });
  res.status(200).json(createdRecord.fields);
}
