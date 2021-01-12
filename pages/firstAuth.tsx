import { useRouter } from "next/router";
import { useEffect } from "react";

const FirstAuth = ({}) => {
  let router = useRouter();
  let code = router.query.code;
  console.log(code);
  console.log(process.env.SLACK_CLIENT_ID);
  console.log(process.env.SLACK_CLIENT_SECRET);
  useEffect(() => {
    fetch(
      `https://slack.com/api/oauth.v2.access?client_id=${process.env.SLACK_CLIENT_ID}&client_secret=${process.env.SLACK_CLIENT_SECRET}&code=${code}`
    )
      .then((response) => response.json())
      .then((data) => console.log(data));
  });
  return (
    <div>
      <h1>Welcome to watermelon</h1>
      <p>Please install the app on your workspace</p>
      <a href="https://slack.com/oauth/v2/authorize?client_id=1471534976662.1575212081829&scope=chat:write,team:read,channels:manage,commands,users:read.email,users:read,dnd:read&user_scope=">
        <img
          alt="Add to Slack"
          height="40"
          width="139"
          src="https://platform.slack-edge.com/img/add_to_slack.png"
          srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
        />
      </a>
    </div>
  );
};
export default FirstAuth;
