const notionMarkdown = ({
  NotionPages,
  notionValue,
  userLogin,
}: {
  NotionPages: number;
  notionValue: any;
  userLogin: string;
}) => {
  let markdown = "";
  markdown += `\n`;
  markdown += "### Notion Pages";
  markdown += `\n`;

  if (NotionPages) {
    if (notionValue?.error === "no notion token") {
      markdown += `\n [Click here to login to Notion](https://app.watermelontools.com)`;
    } else {
      if (notionValue?.length) {
        for (let index = 0; index < notionValue.length; index++) {
          const element = notionValue[index];
          console.log("element", {
            icon: element?.icon,
            title: element?.properties.title,
            url: element?.url,
          });
          markdown += `\n - [${
            element?.icon.type === "external"
              ? `<img src="${element?.icon.external.url}" alt="Page icon" width="20" height="20" />`
              : element?.icon.type === "emoji"
              ? `<img src="${element?.icon.emoji}" alt="Page icon" width="20" height="20" />`
              : ""
          } ${element.properties.title.title.plain_text}](${element.url})`;
          markdown += `\n`;
        }
      } else {
        markdown += `\n No results found :(`;
      }
    }
  } else {
    markdown += `Notion Pages deactivated by ${userLogin}`;

    markdown += `\n`;
  }
  return markdown;
};
export default notionMarkdown;