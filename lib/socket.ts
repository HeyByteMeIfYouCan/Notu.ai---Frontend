import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// Connection state listeners
const connectionListeners: Set<(connected: boolean) => void> = new Set();

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket?.id);
            reconnectAttempts = 0;
            notifyConnectionListeners(true);
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            notifyConnectionListeners(false);
        });

        socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error.message);
            reconnectAttempts++;
            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                console.error('[Socket] Max reconnection attempts reached');
            }
        });

        socket.on('reconnect', (attempt) => {
            console.log('[Socket] Reconnected after', attempt, 'attempts');
            reconnectAttempts = 0;
            notifyConnectionListeners(true);
        });

        socket.on('reconnect_failed', () => {
            console.error('[Socket] Reconnection failed');
            notifyConnectionListeners(false);
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        reconnectAttempts = 0;
    }
};

export const isSocketConnected = () => {
    return socket?.connected ?? false;
};

// Authenticate socket with user info for presence
export const authenticateSocket = (userData: { id: string; name: string; image?: string }) => {
    const s = getSocket();
    s.emit('authenticate', userData);
};

// Subscribe to connection state changes
export const onConnectionChange = (callback: (connected: boolean) => void) => {
    connectionListeners.add(callback);
    // Immediately call with current state
    callback(isSocketConnected());
    
    // Return unsubscribe function
    return () => {
        connectionListeners.delete(callback);
    };
};

function notifyConnectionListeners(connected: boolean) {
    connectionListeners.forEach(cb => cb(connected));
}

// Presence helpers
export const getPresence = (roomId: string): Promise<any[]> => {
    return new Promise((resolve) => {
        const s = getSocket();
        s.emit('get_presence', roomId);
        s.once('presence_update', (data: { roomId: string; users: any[] }) => {
            if (data.roomId === roomId) {
                resolve(data.users);
            }
        });
        // Timeout fallback
        setTimeout(() => resolve([]), 3000);
    });
};
