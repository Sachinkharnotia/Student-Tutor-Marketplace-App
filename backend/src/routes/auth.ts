import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { prisma } from '../index';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Ethereal Email Transporter for OTP Testing
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
      user: 'tre.reichel@ethereal.email',
      pass: '7Rj7b2vD12Kz7n8VdD'
  }
});

router.post('/register', async (req, res) => {
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
    const info = await transporter.sendMail({
      from: '"Marketplace App" <no-reply@marketplace.com>',
      to: email,
      subject: "Verify Your Account - OTP",
      text: `Your OTP for registration is ${otp}. It expires in 10 minutes.`,
    });
    console.log("OTP Email sent. Preview URL: %s", nodemailer.getTestMessageUrl(info));

    res.status(201).json({ message: 'User registered successfully. OTP sent.', email });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'User already verified' });
    if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (!user.otpExpiry || user.otpExpiry < new Date()) return res.status(400).json({ error: 'OTP expired' });

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otp: null, otpExpiry: null }
    });

    const token = jwt.sign(
      { id: user.id, role: user.role, isVerified: true },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ message: 'OTP Verified successfully', token, user: { ...user, isVerified: true } });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, isVerified: user.isVerified },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } });
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
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified, tutorProfile: user.tutorProfile, studentProfile: user.studentProfile } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/update', authenticate, async (req: any, res) => {
  try {
    const { name, email } = req.body;
    
    // Check if email is already taken by someone else
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, email }
    });

    res.json({ user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, isVerified: updatedUser.isVerified } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
