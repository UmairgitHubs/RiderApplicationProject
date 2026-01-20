import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Linking,
  FlatList,
  useWindowDimensions,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme';
import { chatApi } from '../../services/api';
import { socketService } from '../../services/socket';

/**
 * ChatScreen - Production Grade with Perfect Keyboard Handling
 * - Fully responsive across all devices
 * - Bulletproof keyboard behavior
 * - No white space issues
 */

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
  createdAt: string;
}

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  
  const { recipientName, recipientRole, shipmentId, recipientId, recipientPhone } = route.params || {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Responsive breakpoints
  const isSmallPhone = windowWidth < 360;
  const isPhone = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isLargeTablet = windowWidth >= 1024;
  
  const getContentWidth = () => {
    if (isLargeTablet) return 700;
    if (isTablet) return 600;
    return windowWidth;
  };
  
  const contentWidth = getContentWidth();
  const horizontalPadding = isPhone ? 16 : 24;
  const bubbleMaxWidth = isSmallPhone ? '90%' : '85%';

  const quickReplies = ['On my way', 'Arrived', '5 min away', 'Call me'];

  // Keyboard listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Initialize Data
  useEffect(() => {
    const init = async () => {
      try {
        const userData = await AsyncStorage.getItem('@user_data');
        let userId = currentUserId;
        
        if (userData) {
          const user = JSON.parse(userData);
          userId = user.id;
          setCurrentUserId(userId);
        }

        if (shipmentId) {
          const response = await chatApi.getShipmentMessages(shipmentId);
          if (response.success) {
            const formatted: Message[] = response.data.map((m: any) => ({
              id: m.id,
              text: m.content,
              sender: (m.sender_id === userId || m.senderId === userId) ? 'me' : 'other',
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              createdAt: m.created_at
            }));
            setMessages(formatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }
          await chatApi.markShipmentRead(shipmentId);
        }
      } catch (err) {
        console.error('Chat Init Error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [shipmentId]);

  // Socket setup
  useEffect(() => {
    let socket: any;
    const setupSocket = async () => {
      socket = await socketService.connect();
      if (socket) {
        socket.emit('join_order', { orderId: shipmentId });

        socket.on('chat:new-message', (data: any) => {
          if (data.orderId === shipmentId || data.shipmentId === shipmentId) {
            const m = data.message;
            setMessages(prev => {
              if (prev.some(msg => msg.id === m.id)) return prev;
              
              const newMessage: Message = {
                id: m.id,
                text: m.content || m.text,
                sender: (m.sender_id === currentUserId || m.senderId === currentUserId) ? 'me' : 'other',
                time: new Date(m.created_at || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: m.created_at || m.createdAt
              };
              return [newMessage, ...prev];
            });
          }
        });
      }
    };

    if (shipmentId && currentUserId) {
      setupSocket();
    }

    return () => {
      if (socket) {
        socket.off('chat:new-message');
      }
    };
  }, [shipmentId, currentUserId]);

  const handleSend = async (text: string = inputText) => {
    const trimmedText = text.trim();
    if (!trimmedText || !shipmentId) return;

    const socket = socketService.getSocket();
    
    if (socket && socket.connected) {
      const tempId = `temp-${Date.now()}`;
      const newMessage: Message = {
        id: tempId,
        text: trimmedText,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [newMessage, ...prev]);
      setInputText('');

      try {
        socket.emit('send_message', {
          orderId: shipmentId,
          content: trimmedText,
          recipientId: recipientId
        });
      } catch (err) {
        console.error('Send message error:', err);
      }
    } else {
      try {
        await chatApi.sendShipmentMessage({ shipmentId, content: trimmedText });
        setInputText('');
      } catch (err) {
        Alert.alert('Error', 'Failed to send message');
      }
    }
  };

  const handleCall = () => {
    const phone = recipientPhone || route.params?.phone || route.params?.riderPhone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Not Available', 'Contact number is not available for this user.');
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.messageWrapper, { width: isPhone ? windowWidth : contentWidth, alignSelf: 'center' }]}>
      <View style={[
        styles.messageRow, 
        { maxWidth: bubbleMaxWidth },
        item.sender === 'me' ? styles.messageRowMe : styles.messageRowOther
      ]}>
        <View style={[
          styles.bubble, 
          item.sender === 'me' ? styles.bubbleMe : styles.bubbleOther
        ]}>
          <Text style={[
            styles.messageText, 
            { fontSize: isSmallPhone ? 14 : 15 },
            item.sender === 'me' ? styles.messageTextMe : styles.messageTextOther
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.timeText, 
            item.sender === 'me' ? styles.timeTextMe : styles.timeTextOther
          ]}>
            {item.time}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, isSmallPhone ? 12 : 16) }]}>
        <View style={[styles.headerContent, { paddingHorizontal: horizontalPadding }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={[styles.avatar, { width: isSmallPhone ? 36 : 40, height: isSmallPhone ? 36 : 40 }]}>
              <Text style={[styles.avatarText, { fontSize: isSmallPhone ? 16 : 18 }]}>
                {recipientName?.charAt(0) || 'A'}
              </Text>
              <View style={styles.statusDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerName, { fontSize: isSmallPhone ? 15 : 16 }]} numberOfLines={1}>
                {recipientName}
              </Text>
              <Text style={[styles.headerRole, { fontSize: isSmallPhone ? 11 : 12 }]}>
                {recipientRole}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <View style={[styles.callIconBox, { width: isSmallPhone ? 36 : 40, height: isSmallPhone ? 36 : 40 }]}>
              <Ionicons name="call" size={isSmallPhone ? 18 : 20} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content with KeyboardAvoidingView */}
      <KeyboardAvoidingView 
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={[styles.messagesPadding, { paddingHorizontal: isPhone ? 16 : 0 }]}
          showsVerticalScrollIndicator={false}
          style={styles.flex1}
        />

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          {/* Quick Replies */}
          {(messages.length < 5 || !isSmallPhone) && keyboardHeight === 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.quickReplyList, { paddingHorizontal: horizontalPadding }]}
              style={styles.quickReplyContainer}
            >
              {quickReplies.map((item, idx) => (
                <TouchableOpacity 
                  key={idx}
                  style={[styles.quickReplyChip, { paddingHorizontal: isSmallPhone ? 12 : 16 }]}
                  onPress={() => handleSend(item)}
                >
                  <Text style={[styles.quickReplyText, { fontSize: isSmallPhone ? 12 : 13 }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={[styles.inputArea, { paddingHorizontal: isSmallPhone ? 8 : 12 }]}>
            <TouchableOpacity style={[styles.actionBtn, { width: isSmallPhone ? 36 : 40, height: isSmallPhone ? 36 : 40 }]}>
              <Ionicons name="add" size={isSmallPhone ? 24 : 28} color="#999" />
            </TouchableOpacity>
            
            <View style={[styles.inputWrapper, { marginHorizontal: isSmallPhone ? 6 : 8 }]}>
              <TextInput
                style={[styles.input, { fontSize: isSmallPhone ? 14 : 15 }]}
                placeholder="Type a message..."
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
            </View>

            <TouchableOpacity 
              style={[
                styles.sendBtn, 
                { width: isSmallPhone ? 40 : 44, height: isSmallPhone ? 40 : 44 },
                !inputText.trim() && styles.sendBtnDisabled
              ]}
              onPress={() => handleSend()}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={isSmallPhone ? 16 : 18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  flex1: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  avatar: {
    borderRadius: 20,
    backgroundColor: '#F37022',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  headerName: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerRole: {
    color: '#999',
    marginTop: 1,
  },
  callBtn: {
    marginLeft: 10,
  },
  callIconBox: {
    borderRadius: 20,
    backgroundColor: '#FFF9F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0CC',
  },
  messagesPadding: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginVertical: 4,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowMe: {
    alignSelf: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  messageText: {
    lineHeight: 22,
  },
  messageTextMe: {
    color: '#FFF',
  },
  messageTextOther: {
    color: '#1A1A1A',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeTextMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  timeTextOther: {
    color: '#999',
  },
  footer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  quickReplyContainer: {
    maxHeight: 60,
  },
  quickReplyList: {
    paddingVertical: 10,
  },
  quickReplyChip: {
    backgroundColor: '#F5F7FA',
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EDF1F7',
  },
  quickReplyText: {
    color: '#455A64',
    fontWeight: '600',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 100,
  },
  input: {
    color: '#1A1A1A',
  },
  sendBtn: {
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  sendBtnDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
});
