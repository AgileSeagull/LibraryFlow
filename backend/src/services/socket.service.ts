import { Server, Socket } from 'socket.io';

// Map to store user ID to socket connections
const userSocketMap = new Map<string, Set<string>>();

export class SocketService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);

      // Handle user authentication and socket association
      socket.on('user:authenticate', (userId: string) => {
        this.associateUserWithSocket(userId, socket.id);
        console.log(`User ${userId} associated with socket ${socket.id}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.removeSocketAssociation(socket.id);
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  /**
   * Associate a user ID with a socket connection
   */
  private associateUserWithSocket(userId: string, socketId: string) {
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId)!.add(socketId);
  }

  /**
   * Remove socket association when user disconnects
   */
  private removeSocketAssociation(socketId: string) {
    for (const [userId, socketIds] of userSocketMap.entries()) {
      if (socketIds.has(socketId)) {
        socketIds.delete(socketId);
        if (socketIds.size === 0) {
          userSocketMap.delete(userId);
        }
        break;
      }
    }
  }

  /**
   * Find all socket connections for a specific user
   */
  public findUserSockets(userId: string): Socket[] {
    const socketIds = userSocketMap.get(userId);
    if (!socketIds) return [];

    const sockets: Socket[] = [];
    for (const socketId of socketIds) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        sockets.push(socket);
      }
    }
    return sockets;
  }

  /**
   * Emit event to specific user
   */
  public emitToUser(userId: string, event: string, data: any) {
    const userSockets = this.findUserSockets(userId);
    userSockets.forEach(socket => {
      socket.emit(event, data);
    });
  }

  /**
   * Emit event to all connected clients
   */
  public emitToAll(event: string, data: any) {
    this.io.emit(event, data);
  }
}

// Export a function to find user sockets (for backward compatibility)
export const findUserSockets = (io: Server, userId: string): Socket[] => {
  const socketIds = userSocketMap.get(userId);
  if (!socketIds) return [];

  const sockets: Socket[] = [];
  for (const socketId of socketIds) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      sockets.push(socket);
    }
  }
  return sockets;
};
