# Educator Hub: Student-Tutor Marketplace App

A comprehensive, role-based platform connecting students with verified tutors. This system manages everything from user onboarding and KYC verification to real-time chat, bookings, and payments.

## 🌟 Key Features

### 🎓 For Students
- **Browse & Search:** Find verified tutors by subject and hourly rate.
- **Seamless Booking:** Select available slots and book sessions instantly.
- **Secure Payments:** Integrated Razorpay checkout flow.
- **Real-Time Chat:** Message tutors and share files securely via AWS S3 once a booking is confirmed.
- **Rating System:** Rate and review tutors after session completion.

### 💼 For Tutors
- **Dedicated Dashboard:** Manage profile, subjects, and hourly rates.
- **KYC Verification:** Upload ID documents for admin approval before going live.
- **Manage Sessions:** Track active students, total sessions, and earnings.
- **Real-Time Chat:** Communicate directly with booked students and exchange files.

### 🛡️ For Admins
- **Verification Queue:** Review and approve/reject pending student and tutor KYC applications.
- **User Management:** Full ledger of all users with the ability to suspend/unsuspend access.
- **Financial Dashboard:** Track all platform payments and process refunds seamlessly.
- **Dispute Resolution:** Review and resolve user-reported issues.

## 🛠️ Technology Stack

- **Frontend:** React, Next.js, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express
- **Database:** PostgreSQL with Prisma ORM
- **Real-Time Communication:** Socket.io
- **File Storage:** AWS S3 / Cloudinary
- **Payments:** Razorpay API
- **Security:** JWT Authentication, bcrypt hashing, Role-Based Access Control (RBAC)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Razorpay Account
- AWS S3 / Cloudinary Bucket

### 1. Clone the Repository
```bash
git clone https://github.com/tannu005/Student-Tutor-Marketplace-App.git
cd Student-Tutor-Marketplace-App
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="your_postgres_connection_string"
JWT_SECRET="your_jwt_secret"
PORT=4000
AWS_ACCESS_KEY_ID="your_aws_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret"
AWS_REGION="your_aws_region"
S3_BUCKET_NAME="your_bucket_name"
```
Run database migrations and start the server:
```bash
npx prisma db push
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Start the Next.js development server:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

## 🔒 Security Architecture
- **Authentication:** Token-based authentication using JSON Web Tokens (JWT).
- **Authorization:** Strict RBAC limits API endpoints to specific user roles (`STUDENT`, `TUTOR`, `ADMIN`).
- **Data Protection:** Passwords securely hashed via bcrypt.
- **File Security:** AWS S3 configured for secure, signed uploads.

## 📝 License
This project is licensed under the MIT License.
