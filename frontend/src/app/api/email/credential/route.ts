import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, body } = await request.json();

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.warn('SMTP credentials are not set. Email not sent.');
      return NextResponse.json({ error: 'SMTP credentials are not configured' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this if using another provider
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"CertifyVal" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      text: body,
    };

    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json({ data: info });
  } catch (error) {
    console.error('Failed to send email via Nodemailer:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
