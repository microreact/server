import getUser from "cgps-application-server/middleware/get-user";

import { sendEmailMessage } from "../../../services/email-messages";
import serverRuntimeConfig from "../../../utils/server-runtime-config";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "16mb",
    },
  },
};

export default async function (req, res) {
  const user = await getUser(req, res);

  const { feedbackText, emailAddress, screenshotImage } = req.body;

  const attachments = [];
  if (screenshotImage) {
    attachments.push({
      path: screenshotImage,
      filename: "Screenshot.png",
    });
  }

  const emailText = [];
  emailText.push(feedbackText);
  emailText.push("");
  emailText.push(`Email address: ${emailAddress}`);
  if (user) {
    emailText.push(`User: ${user.id} (${user.email})`);
  }
  for (const key of [ "accept-language", "referer", "user-agent" ]) {
    emailText.push(`${key}: ${req.headers[key]}`);
  }

  const replyToAddress = emailAddress || (user?.email) || undefined;
  await sendEmailMessage(
    serverRuntimeConfig.helpDesk.email,
    {
      subject: `Microreact.org Feedback from ${replyToAddress}`,
      text: emailText.join(" \\\n"),
      html: null /* html */,
    },
    attachments,
    replyToAddress,
  );

  res.status(200).send();
}
