export default async function handler({
  channelId,
  ts,
  user_token,
}: {
  channelId: string;
  ts: string;
  user_token: string;
}) {
  if (!channelId) {
    return { error: "no channelId" };
  }
  if (!ts) {
    return { error: "no ts" };
  }
  if (!user_token) {
    return { error: "no user_token" };
  }
  try {
    return await fetch(`https://slack.com/api/conversations.replies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "deflate",
        Accept: "application/json",
        Authorization: `Bearer ${user_token}`,
      },
      body: `channel=${channelId}&ts=${ts}&include_all_metadata=true`,
    }).then((res) => res.json());
  } catch (error) {
    console.error(error);
    return error;
  }
}
