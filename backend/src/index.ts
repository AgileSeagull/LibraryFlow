import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import qrRoutes from './routes/qr.routes';
import occupancyRoutes from './routes/occupancy.routes';
import libraryStatusRoutes from './routes/libraryStatus.routes';
import adminOccupancyRoutes from './routes/adminOccupancy.routes';
import logsRoutes from './routes/logs.routes';
import analyticsRoutes from './routes/analytics.routes';
import setupRoutes from './routes/setup.routes';
import { SocketService } from './services/socket.service';
import { checkAutoSchedule } from './controllers/libraryStatus.controller';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Make io accessible to routes
app.set('io', io);

// Initialize Socket service
const socketService = new SocketService(io);
app.set('socketService', socketService);

// Set up auto-scheduling for library status
setInterval(checkAutoSchedule, 60000); // Check every minute

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'LibraryFlow Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/occupancy', occupancyRoutes);
app.use('/api/library-status', libraryStatusRoutes);
app.use('/api/admin/occupancy', adminOccupancyRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/setup', setupRoutes);

// Socket.IO connection handling is now managed by SocketService

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 LibraryFlow Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Make io globally available for auto-scheduling
(global as any).io = io;

export { io };
