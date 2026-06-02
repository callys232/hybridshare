import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let manualDisconnect = false;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.3,
    });

    socket.on('connect', () => {
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    });

    socket.on('disconnect', (reason) => {
      if (manualDisconnect) return;
      // Socket.io handles reconnect automatically; only log server-initiated disconnects
      if (reason === 'io server disconnect') {
        // Server forced disconnect — re-auth may be needed; attempt reconnect after delay
        reconnectTimer = setTimeout(() => {
          const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
          if (token && socket) {
            socket.auth = { token };
            socket.connect();
          }
        }, 2000);
      }
    });

    socket.on('connect_error', () => {
      // Silent — socket.io will retry via reconnectionAttempts
    });
  }
  return socket;
}

export function connectSocket(accessToken: string): void {
  manualDisconnect = false;
  const s = getSocket();
  s.auth = { token: accessToken };
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  manualDisconnect = true;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
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
