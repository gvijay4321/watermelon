import Link from "next/link";
import { getServerSession } from "next-auth";
//change this to import correctly
import saveUserInfo from "../../utils/db/bitbucket/saveUser";

import { authOptions } from "../api/auth/[...nextauth]/route";
import TimeToRedirect from "../../components/redirect";
import getAllPublicUserData from "../../utils/api/getAllUserPublicData";
// the recommended services should not be of the same category as the current one
import SlackLoginLink from "../../components/SlackLoginLink";
import NotionLoginLink from "../../components/NotionLoginLink";
import ConfluenceLoginLink from "../../components/ConfluenceLoginLink";
import JiraLoginLink from "../../components/JiraLoginLink";

export default async function ServicePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  const userName = session?.user?.name;
  const { code, state } = searchParams;
  let error = "";
  // change service name
  const serviceName = "Bitbucket";
  const [userData, serviceToken] = await Promise.all([
    getAllPublicUserData({ userEmail }).catch((e) => {
      console.error(e);
      return null;
    }),
    // change this fetch
    fetch(`https://bitbucket.org/site/oauth2/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=authorization_code&code=${context.query.code}&client_id=${process.env.BITBUCKET_CLIENT_ID}&client_secret=${process.env.BITBUCKET_CLIENT_SECRET}`,
    }),
  ]);

  // the recommended services should not be of the same category as the current one
  const services = [
    {
      name: "Jira",
      dataProp: "jira_data",
      loginComponent: <JiraLoginLink userEmail={userEmail} />,
    },
    {
      name: "Slack",
      dataProp: "slack_data",
      loginComponent: <SlackLoginLink userEmail={userEmail} />,
    },
    {
      name: "Confluence",
      dataProp: "confluence_data",
      loginComponent: <ConfluenceLoginLink userEmail={userEmail} />,
    },
    {
      name: "Notion",
      dataProp: "notion_data",
      loginComponent: <NotionLoginLink userEmail={userEmail} />,
    },
  ];
  const loginArray = services
    .map((service) =>
      userData?.[service.dataProp] ? null : service.loginComponent
    )
    .filter((component) => component !== null);

  const json = await serviceToken.json();
  if (json.error) {
    error = json.error;
  } else {
    // get user correctly
    const headers = {
      Authorization: `Bearer ${json.access_token}`,
    };

    const requests = [
      fetch(`https://api.bitbucket.org/2.0/user`, { headers }),
      fetch(`https://api.bitbucket.org/2.0/user/permissions/workspaces`, {
        headers,
      }),
      fetch(`https://api.bitbucket.org/2.0/user/emails`, { headers }),
    ];

    let [user, workspace, email] = await Promise.all(requests);

    let userJson = await user.json();
    let workspaceJson = await workspace.json();
    let emailJson = await email.json();
    // save user correctly
    await saveUserInfo({
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      id: userJson.account_id,
      avatar_url: userJson.links.avatar.href,
      watermelon_user: state,
      name: userJson.display_name,
      location: userJson.location,
      workspace: workspaceJson.values[0].workspace.slug,
      email: emailJson.values[0].email,
    });

    return (
      <div className="Box" style={{ maxWidth: "100ch", margin: "auto" }}>
        <div className="Subhead">
          <h2 className="Subhead-heading px-2">
            You have logged in with {serviceName} as{" "}
            {userJson.viewer.displayName} in the team{" "}
            {userJson.teams.nodes[0].name}
          </h2>
        </div>
        <img
          src={userJson.viewer.avatarUrl}
          alt="linear user image"
          className="avatar avatar-8"
        />
        <div>
          <TimeToRedirect url={"/"} />
          <p>
            If you are not redirected, please click <Link href="/">here</Link>
          </p>
          {loginArray.length ? (
            <div>
              <h3>You might also be interested: </h3>
              {loginArray.map((login) => (
                <>{login}</>
              ))}
            </div>
          ) : null}
          {error && <p>{error}</p>}
        </div>
      </div>
    );
  }
}