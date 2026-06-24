import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { prisma } from '../index';
import { validate } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateUserSchema,
  submitKycSchema
} from '../validations/auth.validation';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Ethereal Email Transporter with dynamic fallback for OTP Testing
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
      secure: port === 465, // true for 465, false for other ports
      auth: {
          user,
          pass
      }
    });
    await transporter.verify();
    cachedTransporter = transporter;
    return transporter;
  } catch (err) {
    console.warn("SMTP configuration failed, creating dynamic test account...", err);
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

router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isVerified: false,
        otp,
        otpExpiry
      },
    });

    // Create profile based on role
    if (role === 'STUDENT') {
      await prisma.studentProfile.create({ data: { userId: user.id } });
    } else if (role === 'TUTOR') {
      await prisma.tutorProfile.create({ data: { userId: user.id } });
    }

    // Send OTP Email
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #F26522; margin: 0; font-size: 28px; font-weight: 800;">Educator Hub</h1>
          <p style="color: #666666; font-size: 14px; margin-top: 5px;">Your Verification Code</p>
        </div>
        <hr style="border: none; border-top: 1px solid #f0f0f0; margin-bottom: 30px;" />
        <div style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 30px;">
          <p>Hello,</p>
          <p>Thank you for registering at <b>Educator Hub</b>. To complete your registration and verify your email address, please use the following one-time password (OTP):</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #F26522; background-color: #FFF5F0; padding: 12px 30px; border-radius: 8px; border: 1px solid #FFD8C2; display: inline-block;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #666666;">This code is valid for <b>10 minutes</b>. If you did not request this code, you can safely ignore this email.</p>
        </div>
        <hr style="border: none; border-top: 1px solid #f0f0f0; margin-top: 30px; margin-bottom: 20px;" />
        <div style="text-align: center; font-size: 12px; color: #999999;">
          <p>&copy; 2026 Educator Hub. All rights reserved.</p>
          <p>This is an automated security message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    const mailTransporter = await getTransporter();
    const info = await mailTransporter.sendMail({
      from: `"Educator Hub" <${process.env.SMTP_USER || 'no-reply@marketplace.com'}>`,
      to: email,
      subject: "Verify Your Account - Educator Hub OTP",
      text: `Your OTP for registration is ${otp}. It expires in 10 minutes.`,
      html: htmlContent
    });
    console.log("OTP Email sent. Preview URL: %s", nodemailer.getTestMessageUrl(info));
    console.log(`[DEV] OTP for ${email}: ${otp}`);

    res.status(201).json({ message: 'User registered successfully. OTP sent.', email });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-otp', validate(verifyOtpSchema), async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'User already verified' });
    if (!user.otp) return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    if (!user.otpExpiry || user.otpExpiry < new Date()) return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otp: null, otpExpiry: null },
      include: { studentProfile: true, tutorProfile: true }
    });

    const token = jwt.sign(
      { id: user.id, role: user.role, isVerified: true },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ message: 'OTP Verified successfully', token, user: updatedUser });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/resend-otp', validate(resendOtpSchema), async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'User is already verified' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry }
    });

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #F26522; margin: 0; font-size: 28px; font-weight: 800;">Educator Hub</h1>
          <p style="color: #666666; font-size: 14px; margin-top: 5px;">Your New Verification Code</p>
        </div>
        <hr style="border: none; border-top: 1px solid #f0f0f0; margin-bottom: 30px;" />
        <div style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 30px;">
          <p>Hello,</p>
          <p>Here is your new one-time password (OTP) for <b>Educator Hub</b>:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #F26522; background-color: #FFF5F0; padding: 12px 30px; border-radius: 8px; border: 1px solid #FFD8C2; display: inline-block;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #666666;">This code is valid for <b>10 minutes</b>. If you did not request this code, you can safely ignore this email.</p>
        </div>
        <hr style="border: none; border-top: 1px solid #f0f0f0; margin-top: 30px; margin-bottom: 20px;" />
        <div style="text-align: center; font-size: 12px; color: #999999;">
          <p>&copy; 2026 Educator Hub. All rights reserved.</p>
        </div>
      </div>
    `;

    const mailTransporter = await getTransporter();
    const info = await mailTransporter.sendMail({
      from: `"Educator Hub" <${process.env.SMTP_USER || 'no-reply@marketplace.com'}>`,
      to: email,
      subject: "Your New OTP - Educator Hub",
      text: `Your new OTP is ${otp}. It expires in 10 minutes.`,
      html: htmlContent
    });
    console.log("Resend OTP Email sent. Preview URL: %s", nodemailer.getTestMessageUrl(info));
    console.log(`[DEV] Resent OTP for ${email}: ${otp}`);

    res.json({ message: 'New OTP sent successfully.' });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetOtpHash = await bcrypt.hash(otp, 10);
    const resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetOtpHash, resetOtpExpiry },
    });

    const mailTransporter = await getTransporter();
    const info = await mailTransporter.sendMail({
      from: `"Educator Hub" <${process.env.SMTP_USER || 'no-reply@marketplace.com'}>`,
      to: email,
      subject: 'Reset Your Password - Educator Hub OTP',
      text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #f0f0f0; border-radius: 12px;">
          <h1 style="color:#F26522;margin:0 0 8px;">Educator Hub</h1>
          <p style="color:#333;">Use this one-time password to reset your account password.</p>
          <div style="font-size:30px;font-weight:800;letter-spacing:5px;color:#F26522;background:#FFF5F0;padding:12px 24px;border-radius:8px;text-align:center;margin:24px 0;">${otp}</div>
          <p style="color:#666;font-size:13px;">This code expires in 10 minutes. If you did not request it, ignore this email.</p>
        </div>
      `,
    });

    console.log("Password reset OTP Email sent. Preview URL: %s", nodemailer.getTestMessageUrl(info));
    console.log(`[DEV] Password reset OTP for ${email}: ${otp}`);

    res.json({ message: 'Password reset OTP sent successfully.' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reset-password', validate(resetPasswordSchema), async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetOtpHash || !user.resetOtpExpiry) {
      return res.status(400).json({ error: 'Invalid or expired reset request' });
    }

    if (user.resetOtpExpiry < new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetOtpHash: null, resetOtpExpiry: null },
      });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    const isOtpValid = await bcrypt.compare(String(otp).trim(), user.resetOtpHash);
    if (!isOtpValid) return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetOtpHash: null,
        resetOtpExpiry: null,
      },
    });

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { studentProfile: true, tutorProfile: true }
    });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // If user hasn't verified their email, resend OTP and ask them to verify
    if (!user.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { otp, otpExpiry }
      });

      try {
        const mailTransporter = await getTransporter();
        await mailTransporter.sendMail({
          from: `"Educator Hub" <${process.env.SMTP_USER || 'no-reply@marketplace.com'}>`,
          to: email,
          subject: "Verify Your Account - Educator Hub OTP",
          text: `Your OTP for verification is ${otp}. It expires in 10 minutes.`,
        });
        console.log(`[DEV] Login-resent OTP for ${email}: ${otp}`);
      } catch (mailErr) {
        console.error('Failed to send OTP email on login:', mailErr);
      }

      return res.status(403).json({ 
        error: 'Email not verified. A new OTP has been sent to your email.',
        requiresOtp: true,
        email: user.email
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, isVerified: user.isVerified },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        isVerified: user.isVerified,
        avatar: user.avatar,
        studentProfile: user.studentProfile,
        tutorProfile: user.tutorProfile
      } 
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

import { authenticate } from '../middleware/auth';

router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { tutorProfile: true, studentProfile: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    console.log(`API [GET /me] called by User: ${user.name} (${user.email}) - ID: ${user.id}`);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified, avatar: user.avatar, tutorProfile: user.tutorProfile, studentProfile: user.studentProfile } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/update', authenticate, validate(updateUserSchema), async (req: any, res) => {
  try {
    const { name, email, avatar } = req.body;
    
    // Check if email is already taken by someone else
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { 
        name, 
        email,
        ...(avatar !== undefined ? { avatar } : {})
      },
      include: { studentProfile: true, tutorProfile: true }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/submit-kyc', authenticate, validate(submitKycSchema), async (req: any, res) => {
  try {
    const { phone, kycDocument, subjects, hourlyRate } = req.body;
    
    if (req.user.role !== 'TUTOR') {
      return res.status(403).json({ error: 'Only tutors can submit KYC' });
    }

    if (!kycDocument) {
      return res.status(400).json({ error: 'KYC ID Proof Document is compulsory.' });
    }

    const docUrlLower = kycDocument.toLowerCase();
    if (!docUrlLower.endsWith('.pdf') && !docUrlLower.includes('.pdf?')) {
      return res.status(400).json({ error: 'Only PDF files are accepted for KYC verification.' });
    }

    const updateData: any = {
      phone,
      subjects,
      hourlyRate,
      kycDocument,
      kycStatus: 'PENDING'
    };

    const updatedProfile = await prisma.tutorProfile.update({
      where: { userId: req.user.id },
      data: updateData
    });

    res.json({ message: 'KYC submitted successfully', profile: updatedProfile });
  } catch (error) {
    console.error('KYC Submission Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
