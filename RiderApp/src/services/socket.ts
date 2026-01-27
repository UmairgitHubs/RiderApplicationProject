import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const COMPUTER_IP = "192.168.100.232";

const getSocketUrl = () => {
    // For both Android and iOS, the computer IP is more reliable for physical devices
    // and works for emulators if the IP is correct and network permits.
    return `http://${COMPUTER_IP}:3000`;
};

class SocketService {
    private socket: Socket | null = null;

    async connect() {
        if (this.socket?.connected) return this.socket;

        const token = await AsyncStorage.getItem('@auth_token');
        if (!token) {
            console.error('❌ SocketService: No auth token found! Cannot connect.');
            return null;
        }
        console.log('🔑 SocketService: Token found, proceeding to connect...');

        const url = getSocketUrl();
        console.log(`🔌 Attempting socket connection to: ${url}`);

        this.socket = io(url, {
            auth: { token },
            transports: ['polling', 'websocket'], // Try polling first for reliability, then upgrade to websocket
            forceNew: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            timeout: 20000, 
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket connected');
        });

        this.socket.on('connect_error', (err) => {
            console.log('❌ Socket connection error:', err.message);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket() {
        return this.socket;
    }
}

export const socketService = new SocketService();
