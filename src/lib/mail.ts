import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for port 465 (SSL)
  auth: {
    user: process.env.SMTP_USER || 'tech@flexformfitness.com',
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  attachmentUrl?: string | null;
}

export async function sendEmail({ to, subject, html, attachmentUrl }: SendEmailParams) {
  const fromEmail = process.env.SMTP_USER || 'tech@flexformfitness.com';
  
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
