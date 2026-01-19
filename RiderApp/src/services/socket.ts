import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const COMPUTER_IP = "192.168.100.223";

const getSocketUrl = () => {
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000';
    }
    return `http://${COMPUTER_IP}:3000`;
};

class SocketService {
    private socket: Socket | null = null;

    async connect() {
        if (this.socket?.connected) return this.socket;

        const token = await AsyncStorage.getItem('@auth_token');
        if (!token) return null;

        this.socket = io(getSocketUrl(), {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket connected');
        });

        this.socket.on('connect_error', (err) => {
            console.log('❌ Socket connection error:', err.message);
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
