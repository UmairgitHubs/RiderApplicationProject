import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  senderRole?: string;
  createdAt: string;
  isRead?: boolean;
}

interface ShipmentChatProps {
  shipmentId: string;
  merchantId: string;
  riderId?: string; // Optional, as rider might not be assigned yet
  currentUser: {
    id: string;
    role: string;
    name: string;
  };
}

export default function ShipmentChat({ shipmentId, merchantId, riderId, currentUser }: ShipmentChatProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial Fetch & Socket Setup
  useEffect(() => {
    let newSocket: Socket | null = null;

    const initChat = async () => {
      try {
        setIsLoading(true);
        
        // 1. Fetch History via API
        // NOTE: You'll need to ensure this API endpoint exists and is accessible
        const token = Cookies.get('token'); // Adjust cookie name if needed
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
        
        const res = await fetch(`${apiUrl}/chat/conversations/${shipmentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            const formatted = data.data.map((m: any) => ({
                id: m.id,
                text: m.content || m.text,
                senderId: m.sender_id || m.senderId,
                senderName: m.sender?.full_name,
                senderRole: m.sender?.role,
                createdAt: m.created_at,
                isRead: m.is_read
            }));
            setMessages(formatted);
        }

        // 2. Connect Socket
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
        newSocket = io(socketUrl, {
          auth: { token },
          transports: ['polling', 'websocket'],
        });

        newSocket.on('connect', () => {
          console.log('✅ Dashboard Chat: Connected');
          setIsConnected(true);
          newSocket?.emit('join_order', { orderId: shipmentId });
        });

        newSocket.on('chat:new-message', (data: any) => {
           // Strict filter
           if (data.orderId === shipmentId || data.shipmentId === shipmentId) {
               const m = data.message;
               setMessages(prev => {
                   if (prev.some(msg => msg.id === m.id)) return prev;
                   return [...prev, {
                       id: m.id,
                       text: m.content || m.text,
                       senderId: m.senderId || m.sender_id,
                       senderName: m.senderName || m.sender?.full_name, // Backend should send this
                       senderRole: m.senderRole,
                       createdAt: m.createdAt || m.created_at,
                       isRead: false
                   }];
               });
           }
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket error:', err);
            setIsConnected(false);
        });

        setSocket(newSocket);
      } catch (err) {
        console.error('Chat init error:', err);
        toast.error('Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    };

    initChat();

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [shipmentId]);

  const handleSend = async () => {
    if (!inputText.trim() || !socket) return;
    
    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const text = inputText.trim();
    setInputText('');
    
    setMessages(prev => [...prev, {
        id: tempId,
        text,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        createdAt: new Date().toISOString(),
        isRead: false
    }]);

    try {
        // Emit logic mirroring mobile app
        // Determine recipient: if I am merchant, recipient is rider. If I am admin, logic might vary.
        // The backend handles 'orderId' room emission, so recipientId is mostly for push notifs.
        const recipientIdToSend = riderId || merchantId; // Fallback

        socket.emit('send_message', {
            orderId: shipmentId,
            content: text,
            recipientId: recipientIdToSend 
        });
    } catch (err) {
        console.error('Send error:', err);
        toast.error('Failed to send message');
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
        <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" />
                {riderId ? 'Rider Chat' : 'Waiting for Rider...'}
            </h3>
            <p className="text-xs text-gray-500">
                {isConnected ? 'Real-time connection active' : 'Connecting...'}
            </p>
        </div>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-400'} animate-pulse`} />
      </div>

        // Messages Area
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
        ) : messages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-gray-400">
                <p className="text-sm">No messages yet.</p>
                <p className="text-xs">Start the conversation about this order.</p>
            </div>
        ) : (
            messages.map((msg, idx) => {
                // Robust comparison handling string/number types
                const isMe = String(msg.senderId) === String(currentUser.id);
                
                return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                            isMe 
                            ? 'bg-orange-500 text-white rounded-br-none' 
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                        }`}>
                            {!isMe && msg.senderRole && (
                                <p className="text-[10px] font-bold opacity-70 mb-0.5 uppercase tracking-wide">
                                    {msg.senderRole}
                                </p>
                            )}
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-orange-100' : 'text-gray-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                    </div>
                );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 border-t border-gray-200">
        <div className="flex gap-2 relative">
            <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={riderId ? "Type a message..." : "Rider not assigned yet"}
                disabled={!riderId}
                className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button 
                onClick={handleSend}
                disabled={!inputText.trim() || !riderId}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
}
