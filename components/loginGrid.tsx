import { useEffect, useState } from "react";

import InfoPanel from "../components/dashboard/InfoPanel";
import JiraLoginLink from "../components/JiraLoginLink";
import SlackLoginLink from "../components/SlackLoginLink";
import GitHubLoginLink from "../components/GitHubLoginLink";
import GitLabLoginLink from "../components/GitLabLoginLink";
import BitbucketLoginLink from "../components/BitbucketLoginLink";
import DiscordLoginLink from "./DiscordLoginLink";

import getAllUserData from "../utils/api/getAllUserData";
import getPaymentInfo from "../utils/api/getPaymentInfo";

function LoginGrid({ userEmail }) {
  const [jiraUserData, setJiraUserData] = useState(null);
  const [githubUserData, setGithubUserData] = useState(null);
  const [bitbucketUserData, setBitbucketUserData] = useState(null);
  const [gitlabUserData, setGitlabUserData] = useState(null);
  const [slackUserData, setSlackUserData] = useState(null);
  const [discordUserData, setDiscordUserData] = useState(null);
  const [hasPaid, setHasPaid] = useState(false);

  useEffect(() => {
    if (userEmail) {
      getAllUserData(userEmail).then((data) => {
        setGithubUserData(JSON.parse(data.github_data));
        setBitbucketUserData(JSON.parse(data.bitbucket_data));
        setGitlabUserData(JSON.parse(data.gitlab_data));
        setSlackUserData(JSON.parse(data.slack_data));
        setJiraUserData(JSON.parse(data.jira_data));
        setDiscordUserData(JSON.parse(data.discord_data));
      });

      // use getByEmail to check if user has paid
      // TODO: As stated on Jira ticket WM-66, we'll refactor this later in order to not block render
      // and have a perfect self-serve experience
      getPaymentInfo(userEmail).then((data) => {
        setHasPaid(data);
      });
    }
  }, [userEmail]);
  return (
    <div
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
      }}
    >
      {userEmail && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            }}
          >
            <div className="p-3">
              {githubUserData?.user_displayname ? (
                <InfoPanel
                  info={{
                    ...githubUserData,
                    service_name: "GitHub",
                  }}
                />
              ) : (
                <GitHubLoginLink userEmail={userEmail} />
              )}
            </div>

            <div className="p-3">
              {bitbucketUserData?.user_displayname ? (
                <InfoPanel
                  info={{
                    ...bitbucketUserData,
                    service_name: "Bitbucket",
                  }}
                />
              ) : (
                <BitbucketLoginLink userEmail={userEmail} />
              )}
            </div>

            <div className="p-3">
              {gitlabUserData?.user_displayname ? (
                <InfoPanel
                  info={{
                    ...gitlabUserData,
                    service_name: "GitLab",
                  }}
                />
              ) : (
                <GitLabLoginLink userEmail={userEmail} />
              )}
            </div>
            <div className="p-3">
              {jiraUserData?.user_displayname ? (
                <InfoPanel
                  info={{
                    ...jiraUserData,
                    service_name: "Jira",
                  }}
                />
              ) : (
                <JiraLoginLink userEmail={userEmail} />
              )}
            </div>
            <div className="p-3">
              {slackUserData?.user_displayname ? (
                <InfoPanel
                  info={{
                    ...slackUserData,
                    service_name: "Slack",
                  }}
                />
              ) : (
                <SlackLoginLink userEmail={userEmail} />
              )}
            </div>
            <div className="p-3">
              {discordUserData?.user_displayname ? (
                <InfoPanel
                  info={{
                    user_avatar_url: `https://cdn.discordapp.com/avatars/${discordUserData.id}/${discordUserData.avatar_url}`,
                    ...discordUserData,
                    service_name: "Discord",
                  }}
                />
              ) : (
                <DiscordLoginLink userEmail={userEmail} />
              )}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            }}
          ></div>
        </div>
      )}
    </div>
  );
}
export default LoginGrid;