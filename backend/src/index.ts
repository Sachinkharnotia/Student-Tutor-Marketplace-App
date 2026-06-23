import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';
import paymentRoutes from './routes/payment';
import marketplaceRoutes from './routes/marketplace';
import bookingRoutes from './routes/booking';
import reviewRoutes from './routes/review';
import availabilityRoutes from './routes/availability';
import disputeRoutes from './routes/dispute';
import chatRoutes from './routes/chat';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // TODO: restrict in production
    methods: ['GET', 'POST']
  }
});

export const prisma = new PrismaClient();

app.use(helmet());
app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/dispute', disputeRoutes);
app.use('/api/chat', chatRoutes);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Realtime Chat Setup
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Join a booking-specific room
  socket.on('join_room', async (bookingId) => {
    socket.join(bookingId);
    console.log(`User with ID: ${socket.id} joined room: ${bookingId}`);
    try {
      const messages = await prisma.message.findMany({
        where: { roomId: bookingId },
        orderBy: { createdAt: 'asc' },
      });

      socket.emit('room_history', {
        roomId: bookingId,
        messages: messages.map((message) => ({
          ...message,
          room: message.roomId,
          message: message.content,
        })),
      });
    } catch (error) {
      console.error('Failed to load chat history:', error);
      socket.emit('chat_error', { error: 'Failed to load chat history' });
    }
  });

  // Send message to a specific room
  socket.on('send_message', async (data) => {
    const targetRoom = data.room || data.bookingId;
    const content = data.content || data.message;

    if (targetRoom && data.senderId && content) {
      try {
        const savedMessage = await prisma.message.create({
          data: {
            roomId: targetRoom,
            senderId: data.senderId,
            content,
          },
        });

        io.to(targetRoom).emit('receive_message', {
          ...savedMessage,
          room: savedMessage.roomId,
          message: savedMessage.content,
        });
      } catch (error) {
        console.error('Failed to save chat message:', error);
        socket.emit('chat_error', { error: 'Failed to send message' });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Express Unhandled Error:", err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
