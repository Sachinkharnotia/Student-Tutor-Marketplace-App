import nodemailer from 'nodemailer';

let cachedTransporter: any = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  try {
    const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER || 'tre.reichel@ethereal.email';
    const pass = process.env.SMTP_PASS || '7Rj7b2vD12Kz7n8VdD';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });
    await transporter.verify();
    cachedTransporter = transporter;
    return transporter;
  } catch (err) {
    console.warn('SMTP configuration failed, creating dynamic test account...', err);
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    cachedTransporter = transporter;
    return transporter;
  }
}

const FROM_ADDRESS = `"Educator Hub" <${process.env.SMTP_USER || 'no-reply@educatorhub.com'}>`;

const emailWrapper = (body: string) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #F26522; margin: 0; font-size: 28px; font-weight: 800;">Educator Hub</h1>
    </div>
    <hr style="border: none; border-top: 1px solid #f0f0f0; margin-bottom: 24px;" />
    <div style="font-size: 15px; color: #333333; line-height: 1.7;">
      ${body}
    </div>
    <hr style="border: none; border-top: 1px solid #f0f0f0; margin-top: 30px; margin-bottom: 20px;" />
    <div style="text-align: center; font-size: 12px; color: #999999;">
      <p>&copy; 2026 Educator Hub. All rights reserved.</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
`;

export async function sendBookingConfirmationEmail(
  studentEmail: string,
  studentName: string,
  tutorName: string,
  startTime: Date,
  amount: number
) {
  try {
    const formattedDate = startTime.toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });

    const html = emailWrapper(`
      <p>Hi <strong>${studentName}</strong>,</p>
      <p>Your booking has been <strong style="color: #22c55e;">confirmed</strong>! 🎉</p>
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #F26522;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #666666; width: 40%;">Tutor</td>
            <td style="padding: 6px 0; font-weight: 600;">${tutorName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666666;">Session Date &amp; Time</td>
            <td style="padding: 6px 0; font-weight: 600;">${formattedDate} IST</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666666;">Amount Paid</td>
            <td style="padding: 6px 0; font-weight: 600;">₹${amount}</td>
          </tr>
        </table>
      </div>
      <p>Please be ready a few minutes before your session starts. If you have any questions, contact us through the platform.</p>
      <p>Happy learning! 📚</p>
    `);

    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to: studentEmail,
      subject: '✅ Booking Confirmed – Educator Hub',
      text: `Hi ${studentName}, your booking with ${tutorName} on ${formattedDate} for ₹${amount} has been confirmed.`,
      html
    });
    console.log('Booking confirmation email sent. Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
  }
}

export async function sendBookingCancellationEmail(
  studentEmail: string,
  studentName: string,
  tutorName: string,
  startTime: Date
) {
  try {
    const formattedDate = startTime.toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });

    const html = emailWrapper(`
      <p>Hi <strong>${studentName}</strong>,</p>
      <p>Your booking has been <strong style="color: #ef4444;">cancelled</strong>.</p>
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #666666; width: 40%;">Tutor</td>
            <td style="padding: 6px 0; font-weight: 600;">${tutorName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666666;">Cancelled Session</td>
            <td style="padding: 6px 0; font-weight: 600;">${formattedDate} IST</td>
          </tr>
        </table>
      </div>
      <p>If a refund is applicable (cancelled more than 24 hours in advance), it will be processed within 5–7 business days to your original payment method.</p>
      <p>You can browse other available tutors on the platform and book a new session anytime.</p>
    `);

    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to: studentEmail,
      subject: '❌ Booking Cancelled – Educator Hub',
      text: `Hi ${studentName}, your booking with ${tutorName} on ${formattedDate} has been cancelled.`,
      html
    });
    console.log('Booking cancellation email sent. Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Failed to send booking cancellation email:', error);
  }
}

export async function sendKycStatusEmail(
  tutorEmail: string,
  tutorName: string,
  status: 'APPROVED' | 'REJECTED'
) {
  try {
    const isApproved = status === 'APPROVED';

    const html = emailWrapper(`
      <p>Hi <strong>${tutorName}</strong>,</p>
      <p>We have reviewed your KYC submission and your tutor profile has been
        <strong style="color: ${isApproved ? '#22c55e' : '#ef4444'};">
          ${isApproved ? 'Approved ✅' : 'Rejected ❌'}
        </strong>.
      </p>
      ${isApproved
        ? `<div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #22c55e;">
             <p style="margin: 0; font-weight: 600;">🎉 Congratulations!</p>
             <p style="margin: 8px 0 0 0;">Your profile is now live on Educator Hub. Students can discover and book sessions with you. Make sure your availability is up-to-date to start receiving bookings.</p>
           </div>`
        : `<div style="background-color: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
             <p style="margin: 0; font-weight: 600;">What to do next?</p>
             <p style="margin: 8px 0 0 0;">Your submission did not meet our verification requirements. Please review your documents and resubmit your KYC through the platform. If you need assistance, please contact our support team.</p>
           </div>`
      }
      <p>Thank you for being part of Educator Hub.</p>
    `);

    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to: tutorEmail,
      subject: `KYC ${isApproved ? 'Approved ✅' : 'Rejected ❌'} – Educator Hub`,
      text: `Hi ${tutorName}, your KYC verification status is: ${status}.`,
      html
    });
    console.log('KYC status email sent. Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Failed to send KYC status email:', error);
  }
}
