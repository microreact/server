const nodemailer = require("nodemailer");
const path = require("path");
const EmailTemplates = require("email-templates");

const serverRuntimeConfig = require("../utils/server-runtime-config");
const publicRuntimeConfig = require("../utils/public-runtime-config");

async function sendSmtpMessage(messageData) {
  const transporter = nodemailer.createTransport(
    serverRuntimeConfig.smtp
  );

  messageData.from = serverRuntimeConfig.smtp.from;

  const info = await transporter.sendMail(messageData);

  return info;
}

module.exports.sendEmailMessage = async function sendEmailMessage(
  toAddress,
  message,
  attachments,
  replyToAddress,
)
{
  const smtpRequest = {
    text: message.text,
    to: Array.isArray(toAddress) ? toAddress.join(", ") : toAddress,
    subject: message.subject,
    attachment: [],
  };

  if (replyToAddress) {
    smtpRequest.replyTo = replyToAddress;
  }

  if (message.html) {
    smtpRequest.html = message.html;
  }

  if (Array.isArray(attachments)) {
    smtpRequest.attachments = attachments;
  }

  const smtpResponse = await sendSmtpMessage(smtpRequest);

  return smtpResponse;
};

module.exports.renderEmailMessage = async function renderEmailMessage(templateName, data) {
  const email = new EmailTemplates({
    views: {
      root: path.resolve(".", "views", "emails"),
      options: {
        extension: "ejs",
      },
    },
  });

  const globalData = {
    baseUrl: publicRuntimeConfig.baseUrl.endsWith("/") ? publicRuntimeConfig.baseUrl : `${publicRuntimeConfig.baseUrl}/`, // Ensure the base URL ends with a slash
  };

  const rendered = await email.renderAll(
    templateName,
    { ...globalData, ...data }
  );

  const { html, text, subject } = rendered;

  return { html, text, subject };
};
