import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { env } from './env';
import { logger } from '../utils/logger';
import { verifyAccessToken } from '../utils/crypto';

let io: SocketServer | null = null;

export interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: string;
}

export function initializeSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.APP_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as AuthenticatedSocket).userId = payload.sub;
      (socket as AuthenticatedSocket).userRole = payload.role;
      next();
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    logger.info('Socket connected', { userId: authSocket.userId, socketId: socket.id });

    socket.join(`user:${authSocket.userId}`);

    socket.on('workspace:join', (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
      logger.debug('User joined workspace room', { userId: authSocket.userId, workspaceId });
    });

    socket.on('workspace:leave', (workspaceId: string) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    socket.on('file:view', (fileId: string) => {
      socket.join(`file:${fileId}`);
      socket.to(`file:${fileId}`).emit('user:presence', {
        userId: authSocket.userId,
        fileId,
        action: 'joined',
      });
    });

    socket.on('disconnect', (reason) => {
      logger.debug('Socket disconnected', { userId: authSocket.userId, reason });
    });
  });

  logger.info('Socket.io initialized');
  return io;
}

export function getSocketServer(): SocketServer {
  if (!io) throw new Error('Socket server not initialized');
  return io;
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  getSocketServer().to(`user:${userId}`).emit(event, data);
}

export function emitToWorkspace(workspaceId: string, event: string, data: unknown): void {
  getSocketServer().to(`workspace:${workspaceId}`).emit(event, data);
}

export function emitToFile(fileId: string, event: string, data: unknown): void {
  getSocketServer().to(`file:${fileId}`).emit(event, data);
}

export function broadcast(event: string, data: unknown): void {
  getSocketServer().emit(event, data);
}
