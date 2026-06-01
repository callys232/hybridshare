import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket(accessToken: string): void {
  const s = getSocket();
  s.auth = { token: accessToken };
  s.connect();
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function joinWorkspace(workspaceId: string): void {
  getSocket().emit('workspace:join', workspaceId);
}

export function leaveWorkspace(workspaceId: string): void {
  getSocket().emit('workspace:leave', workspaceId);
}

export function viewFile(fileId: string): void {
  getSocket().emit('file:view', fileId);
}

export function onFileUploaded(handler: (data: unknown) => void): () => void {
  const s = getSocket();
  s.on('file:uploaded', handler);
  return () => s.off('file:uploaded', handler);
}

export function onFileDeleted(handler: (data: unknown) => void): () => void {
  const s = getSocket();
  s.on('file:deleted', handler);
  return () => s.off('file:deleted', handler);
}

export function onNotification(handler: (data: unknown) => void): () => void {
  const s = getSocket();
  s.on('notification:new', handler);
  return () => s.off('notification:new', handler);
}

export function onConnectorSynced(handler: (data: unknown) => void): () => void {
  const s = getSocket();
  s.on('connector:synced', handler);
  return () => s.off('connector:synced', handler);
}

export function onSocialPosted(handler: (data: unknown) => void): () => void {
  const s = getSocket();
  s.on('social:posted', handler);
  return () => s.off('social:posted', handler);
}
