const getDiscordInfo = async (userEmail: string) => {
  const data = await fetch("/api/discord/getUser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: userEmail,
    }),
  })
    .then((res) => res.json())
    .catch((err) => console.log(err));
  return data;
};
export default getDiscordInfo;