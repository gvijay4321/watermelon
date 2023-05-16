import executeRequest from "../azuredb";

export default async function updateUserSettings(
  user,
  userSettings
): Promise<any> {
  console.log(userSettings);
  console.log(user);
  try {
    let data = await executeRequest(
      `EXEC dbo.update_userSettings @watermelon_user = '${user}', @AISummary='${userSettings.AISummary}',@JiraTickets='${userSettings.JiraTickets}',@SlackMessages='${userSettings.SlackMessages}',@GitHubPRs='${userSettings.GitHubPRs}', `
    );
    return data;
  } catch (err) {
    console.error(err);
    return err;
  }
}
