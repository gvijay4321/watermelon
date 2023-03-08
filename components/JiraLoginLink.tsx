import Link from "next/link";

const JiraLoginLink = ({ userEmail }) => (
  <div>
      <Link
        href={`https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=VUngRAClu8ZE56vxXCFBocTxCTLEUQTT&scope=read:jira-user%20read:jira-work%20write:jira-work%20offline_access&redirect_uri=https://app.watermelontools.com/jira&state=${userEmail}&response_type=code&prompt=consent`}
        className="button block"
      >
        <div className="Box d-flex flex-items-center flex-justify-start p-2">
          <img className="avatar avatar-8" src="/logos/jira.svg" />
          <div className="p-2">
            <h2>Login to Jira</h2>
            <p>View your Most Relevant Ticket and Active Tickets</p>
          </div>
        </div>
      </Link>
  </div>
);
export default JiraLoginLink;
