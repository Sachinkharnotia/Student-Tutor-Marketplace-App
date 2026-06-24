import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.string().trim().refine(
      (val) => ['STUDENT', 'TUTOR', 'ADMIN'].includes(val),
      { message: "Role must be 'STUDENT', 'TUTOR', or 'ADMIN'" }
    ),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email format'),
    otp: z.string().length(6, 'OTP must be exactly 6 characters long').regex(/^\d+$/, 'OTP must contain only digits'),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email format'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email format'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email format'),
    otp: z.string().length(6, 'OTP must be exactly 6 characters long').regex(/^\d+$/, 'OTP must contain only digits'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name cannot be empty').optional(),
    email: z.string().trim().email('Invalid email format').optional(),
    avatar: z.string().trim().optional().nullable(),
  }).refine(data => data.name !== undefined || data.email !== undefined || data.avatar !== undefined, {
    message: "At least one of name, email or avatar must be provided for update",
    path: ["name"]
  }),
});

export const submitKycSchema = z.object({
  body: z.object({
    phone: z.string().trim().min(10, 'Phone number must be at least 10 characters long').max(15, 'Phone number cannot exceed 15 characters').optional().or(z.literal('')),
    kycDocument: z.string().min(1, 'KYC ID Proof Document is compulsory.').refine(
      (val) => {
        const lowerVal = val.toLowerCase();
        return lowerVal.endsWith('.pdf') || lowerVal.includes('.pdf?');
      },
      { message: 'Only PDF files are accepted for KYC verification.' }
    ),
    subjects: z.array(z.string().trim().min(1, 'Subject name cannot be empty')).min(1, 'At least one subject must be specified'),
    hourlyRate: z.number().positive('Hourly rate must be a positive number'),
  }),
});
