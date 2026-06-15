import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

dotenv.config();

import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';
import paymentRoutes from './routes/payment';
import marketplaceRoutes from './routes/marketplace';
import bookingRoutes from './routes/booking';
import reviewRoutes from './routes/review';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // TODO: restrict in production
    methods: ['GET', 'POST']
  }
});

export const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/review', reviewRoutes);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Realtime Chat Setup
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Join a booking-specific room
  socket.on('join_room', (bookingId) => {
    socket.join(bookingId);
    console.log(`User with ID: ${socket.id} joined room: ${bookingId}`);
  });

  // Send message to a specific room
  socket.on('send_message', (data) => {
    // data should contain { bookingId, message, senderId, senderName }
    socket.to(data.bookingId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
