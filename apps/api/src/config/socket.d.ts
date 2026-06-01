import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
export interface AuthenticatedSocket extends Socket {
    userId: string;
    userRole: string;
}
export declare function initializeSocket(httpServer: HttpServer): SocketServer;
export declare function getSocketServer(): SocketServer;
export declare function emitToUser(userId: string, event: string, data: unknown): void;
export declare function emitToWorkspace(workspaceId: string, event: string, data: unknown): void;
export declare function emitToFile(fileId: string, event: string, data: unknown): void;
export declare function broadcast(event: string, data: unknown): void;
//# sourceMappingURL=socket.d.ts.map