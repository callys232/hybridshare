"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = initializeSocket;
exports.getSocketServer = getSocketServer;
exports.emitToUser = emitToUser;
exports.emitToWorkspace = emitToWorkspace;
exports.emitToFile = emitToFile;
exports.broadcast = broadcast;
const socket_io_1 = require("socket.io");
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
const crypto_1 = require("../utils/crypto");
let io = null;
function initializeSocket(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.env.APP_URL,
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
            const payload = (0, crypto_1.verifyAccessToken)(token);
            socket.userId = payload.sub;
            socket.userRole = payload.role;
            next();
        }
        catch {
            next(new Error('Invalid authentication token'));
        }
    });
    io.on('connection', (socket) => {
        const authSocket = socket;
        logger_1.logger.info('Socket connected', { userId: authSocket.userId, socketId: socket.id });
        socket.join(`user:${authSocket.userId}`);
        socket.on('workspace:join', (workspaceId) => {
            socket.join(`workspace:${workspaceId}`);
            logger_1.logger.debug('User joined workspace room', { userId: authSocket.userId, workspaceId });
        });
        socket.on('workspace:leave', (workspaceId) => {
            socket.leave(`workspace:${workspaceId}`);
        });
        socket.on('file:view', (fileId) => {
            socket.join(`file:${fileId}`);
            socket.to(`file:${fileId}`).emit('user:presence', {
                userId: authSocket.userId,
                fileId,
                action: 'joined',
            });
        });
        socket.on('disconnect', (reason) => {
            logger_1.logger.debug('Socket disconnected', { userId: authSocket.userId, reason });
        });
    });
    logger_1.logger.info('Socket.io initialized');
    return io;
}
function getSocketServer() {
    if (!io)
        throw new Error('Socket server not initialized');
    return io;
}
function emitToUser(userId, event, data) {
    getSocketServer().to(`user:${userId}`).emit(event, data);
}
function emitToWorkspace(workspaceId, event, data) {
    getSocketServer().to(`workspace:${workspaceId}`).emit(event, data);
}
function emitToFile(fileId, event, data) {
    getSocketServer().to(`file:${fileId}`).emit(event, data);
}
function broadcast(event, data) {
    getSocketServer().emit(event, data);
}
//# sourceMappingURL=socket.js.map