import refreshTokens from "../../../utils/jira/refreshTokens";
export default async function handler(req, res) {
  let { user } = req.body;

  if (!user) {
    return res.send({ error: "getToken.ts - no user" });
  }
  return await refreshTokens({ user });
}
