import './env';
import nodemailer from 'nodemailer';

const smtpUser = import.meta.env.SMTP_USER || process.env.SMTP_USER || 'tech@flexformfitness.com';
const smtpPass = import.meta.env.SMTP_PASS || process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for port 465 (SSL)
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  attachmentUrl?: string | null;
}

export async function sendEmail({ to, subject, html, attachmentUrl }: SendEmailParams) {
  const fromEmail = smtpUser;
  
  const mailOptions: nodemailer.SendMailOptions = {
    from: `"FlexForm Fitness" <${fromEmail}>`,
    to,
    subject,
    html,
  };

  if (attachmentUrl) {
    mailOptions.attachments = [
      {
        filename: 'factura.pdf',
        path: attachmentUrl,
      },
    ];
  }

  return transporter.sendMail(mailOptions);
}
