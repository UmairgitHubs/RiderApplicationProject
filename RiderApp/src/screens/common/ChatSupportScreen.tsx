import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { chatApi, settingsApi } from "../../services/api";
import { socketService } from "../../services/socket";

interface Message {
  id: string;
  text: string;
  sender: "user" | "support";
  timestamp: string;
  isRead: boolean;
  createdAt?: string;
}

export default function ChatSupportScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSupportTyping, setIsSupportTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const [supportPhone, setSupportPhone] = useState("+1 800-COD-EXPRESS");
  const [companyName, setCompanyName] = useState("Live Chat Support");
  const flatListRef = useRef<FlatList>(null);

  // Sync ref with state
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Load conversation and messages on mount
  useEffect(() => {
    loadConversation();
    loadSystemInfo();
    setupSocket();

    return () => {
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('support:new-message');
      }
    };
  }, []);

  const setupSocket = async () => {
    const socket = await socketService.connect();
    if (socket) {
      socket.on('support:new-message', (data: any) => {
        const currentConvId = conversationIdRef.current;
        if (data.ticketId === currentConvId || (data.message && data.message.ticket_id === currentConvId)) {
          const newMsg = data.message;
          setMessages((prev) => {
            const exists = prev.some(m => m.id === newMsg.id);
            if (exists) return prev;
            
            return [{
              id: newMsg.id,
              text: newMsg.message || newMsg.text,
              sender: "support",
              timestamp: formatTime(newMsg.created_at || newMsg.createdAt),
              isRead: false,
              createdAt: newMsg.created_at || newMsg.createdAt
            }, ...prev];
          });
        }
      });
    }
  };

  const loadSystemInfo = async () => {
    try {
      const response = await settingsApi.getSystemInfo();
      if (response?.data?.company_phone) {
        setSupportPhone(response.data.company_phone);
      }
      if (response?.data?.company_name) {
        setCompanyName(`${response.data.company_name} Support`);
      }
    } catch (error) {
      console.log("Failed to load support phone:", error);
    }
  };

  const handleCall = async () => {
    try {
      const cleanNumber = supportPhone.replace(/[\s-]/g, "");
      const url = `tel:${cleanNumber}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Call Support", `Please dial: ${supportPhone}`);
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  const loadConversation = async () => {
    try {
      setIsLoading(true);
      try {
        const conversationResponse = await chatApi.getSupportConversation();
        if (conversationResponse?.data?.id) {
          setConversationId(conversationResponse.data.id);
          const messagesResponse = await chatApi.getMessages(conversationResponse.data.id, { limit: 50 });

          if (messagesResponse?.data?.messages) {
            const formattedMessages = messagesResponse.data.messages.map((msg: any) => ({
              id: msg.id,
              text: msg.text || msg.content,
              sender: msg.senderId === "support" || msg.senderRole === "support" ? "support" : "user",
              timestamp: formatTime(msg.createdAt || msg.timestamp),
              isRead: msg.isRead || false,
              createdAt: msg.createdAt,
            }));
            // Sort for inverted list (newest first)
            setMessages(formattedMessages.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }
        }
      } catch (apiError: any) {
        setMessages([{
          id: "1",
          text: "Hello! How can I help you today?",
          sender: "support",
          timestamp: formatTime(new Date().toISOString()),
          isRead: true,
        }]);
      }
    } catch (error: any) {
      console.error("Error loading conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText("");
    setIsSending(true);

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      sender: "user",
      timestamp: formatTime(new Date().toISOString()),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [userMessage, ...prev]);

    try {
      const response = await chatApi.sendMessage({
        text: messageText,
        conversationId: conversationId || undefined,
      });

      if (response?.data?.message?.id) {
        setMessages((prev) => prev.map((msg) => msg.id === userMessage.id ? { ...msg, id: response.data.message.id } : msg));
      }

      if (response?.data?.conversationId) {
        setConversationId(response.data.conversationId);
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageWrapper, item.sender === "user" && styles.messageWrapperUser]}>
      {item.sender === "support" && (
        <View style={styles.supportAvatar}>
          <Ionicons name="headset" size={20} color={colors.primary} />
        </View>
      )}

      <View style={[styles.messageBubble, item.sender === "user" ? styles.messageBubbleUser : styles.messageBubbleSupport]}>
        <Text style={[styles.messageText, item.sender === "user" ? styles.messageTextUser : styles.messageTextSupport]}>
          {item.text}
        </Text>
        <Text style={[styles.messageTime, item.sender === "user" ? styles.messageTimeUser : styles.messageTimeSupport]}>
          {item.timestamp}
        </Text>
      </View>

      {item.sender === "user" && (
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={20} color={colors.textWhite} />
        </View>
      )}
    </View>
  );

  const HEADER_HEIGHT = 80 + insets.top;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 10 : 20) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="headset" size={24} color={colors.textWhite} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{companyName}</Text>
            <Text style={styles.headerSubtitle}>
              {isSupportTyping ? "Support is typing..." : "Online • Replies in minutes"}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleCall}>
          <Ionicons name="call-outline" size={24} color={colors.textWhite} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? HEADER_HEIGHT : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            inverted
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={colors.textLight} />
                <Text style={styles.emptyText}>Start a conversation</Text>
              </View>
            }
          />
        )}

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 15) }]}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => Alert.alert("Attach", "Feature coming soon!")}
          >
            <Ionicons name="attach" size={24} color={colors.textLight} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor={colors.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isSending}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.textWhite} />
            ) : (
              <Ionicons name="send" size={20} color={inputText.trim() ? colors.textWhite : colors.textLight} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  flex1: { flex: 1 },
  header: {
    backgroundColor: colors.primary,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: { marginRight: spacing.md },
  headerInfo: { flex: 1, flexDirection: "row", alignItems: "center" },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: colors.textWhite },
  headerSubtitle: { fontSize: 12, color: colors.textWhite, opacity: 0.9 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  messagesContainer: { flex: 1 },
  messagesContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  emptyText: { fontSize: 16, color: colors.textLight, marginTop: spacing.md },
  messageWrapper: { flexDirection: "row", alignItems: "flex-end", marginBottom: spacing.md },
  messageWrapperUser: { justifyContent: "flex-end" },
  supportAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#E1F5FE", justifyContent: "center", alignItems: "center", marginRight: spacing.sm },
  userAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginLeft: spacing.sm },
  messageBubble: { maxWidth: "75%", padding: spacing.md, borderRadius: 20 },
  messageBubbleSupport: { backgroundColor: colors.background, borderBottomLeftRadius: 4 },
  messageBubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageTextSupport: { color: colors.text },
  messageTextUser: { color: colors.textWhite },
  messageTime: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  messageTimeSupport: { color: colors.textLight },
  messageTimeUser: { color: "rgba(255,255,255,0.7)" },
  inputContainer: { flexDirection: "row", alignItems: "center", padding: spacing.md, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  attachButton: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  inputWrapper: { flex: 1, backgroundColor: colors.backgroundLight, borderRadius: 22, paddingHorizontal: 16, marginHorizontal: 8, paddingVertical: Platform.OS === 'ios' ? 8 : 2 },
  input: { fontSize: 15, color: colors.text, maxHeight: 100 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  sendButtonDisabled: { backgroundColor: colors.backgroundLight },
});
