import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { chatApi } from "../../services/api";

interface Message {
  id: string;
  text: string;
  sender: "user" | "support";
  timestamp: string;
  isRead: boolean;
  createdAt?: string;
}

export default function ChatSupportScreen({ navigation }: any) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSupportTyping, setIsSupportTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load conversation and messages on mount
  useEffect(() => {
    loadConversation();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isSupportTyping]);

  const loadConversation = async () => {
    try {
      setIsLoading(true);

      // Try to get or create support conversation
      try {
        const conversationResponse = await chatApi.getSupportConversation();
        if (conversationResponse?.data?.id) {
          setConversationId(conversationResponse.data.id);

          // Load messages
          const messagesResponse = await chatApi.getMessages(
            conversationResponse.data.id,
            { limit: 50 }
          );

          if (messagesResponse?.data?.messages) {
            const formattedMessages = messagesResponse.data.messages.map(
              (msg: any) => ({
                id: msg.id,
                text: msg.text || msg.content,
                sender:
                  msg.senderId === "support" || msg.senderRole === "support"
                    ? "support"
                    : "user",
                timestamp: formatTime(msg.createdAt || msg.timestamp),
                isRead: msg.isRead || false,
                createdAt: msg.createdAt,
              })
            );
            setMessages(formattedMessages);
          }
        }
      } catch (apiError: any) {
        // If API fails, use default welcome message
        console.log("API not available, using offline mode:", apiError.message);
        setMessages([
          {
            id: "1",
            text: "Hello! How can I help you today?",
            sender: "support",
            timestamp: formatTime(new Date().toISOString()),
            isRead: true,
          },
        ]);
      }
    } catch (error: any) {
      console.error("Error loading conversation:", error);
      // Set default welcome message on error
      setMessages([
        {
          id: "1",
          text: "Hello! How can I help you today?",
          sender: "support",
          timestamp: formatTime(new Date().toISOString()),
          isRead: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString)
      return new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // If message is from today, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    // If message is from yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
    }

    // If message is older, show date and time
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText("");
    setIsSending(true);

    // Add user message immediately (optimistic update)
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      sender: "user",
      timestamp: formatTime(new Date().toISOString()),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Try to send via API
      try {
        const response = await chatApi.sendMessage({
          text: messageText,
          conversationId: conversationId || undefined,
        });

        // Update message with server ID if provided
        if (response?.data?.message?.id) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === userMessage.id
                ? { ...msg, id: response.data.message.id }
                : msg
            )
          );
        }

        // Update conversation ID if provided
        if (response?.data?.conversationId) {
          setConversationId(response.data.conversationId);
        }

        // Simulate support typing indicator
        setIsSupportTyping(true);
        setTimeout(() => {
          setIsSupportTyping(false);

          // Simulate support response (in real app, this would come from WebSocket or polling)
          setTimeout(() => {
            const supportResponse: Message = {
              id: `support-${Date.now()}`,
              text: generateSupportResponse(messageText),
              sender: "support",
              timestamp: formatTime(new Date().toISOString()),
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, supportResponse]);
          }, 1000);
        }, 1500);
      } catch (apiError: any) {
        // If API fails, still show the message and simulate response
        console.log("API send failed, using offline mode:", apiError.message);

        setIsSupportTyping(true);
        setTimeout(() => {
          setIsSupportTyping(false);

          setTimeout(() => {
            const supportResponse: Message = {
              id: `support-${Date.now()}`,
              text: "Thank you for your message. Our support team will get back to you shortly. In the meantime, feel free to ask any questions!",
              sender: "support",
              timestamp: formatTime(new Date().toISOString()),
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, supportResponse]);
          }, 1000);
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Simple response generator (in production, this would be handled by backend/AI)
  const generateSupportResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("shipment") || lowerMessage.includes("track")) {
      return "I can help you with shipment tracking! Please provide your tracking number or shipment ID, and I'll look it up for you.";
    } else if (
      lowerMessage.includes("payment") ||
      lowerMessage.includes("refund")
    ) {
      return "For payment and refund inquiries, I can assist you. Could you please provide more details about your specific issue?";
    } else if (
      lowerMessage.includes("cancel") ||
      lowerMessage.includes("canceled")
    ) {
      return "I understand you'd like to cancel a shipment. Please share the tracking number, and I'll help you with the cancellation process.";
    } else if (
      lowerMessage.includes("delivery") ||
      lowerMessage.includes("deliver")
    ) {
      return "I can help with delivery-related questions. What specific information do you need about your delivery?";
    } else if (
      lowerMessage.includes("problem") ||
      lowerMessage.includes("issue") ||
      lowerMessage.includes("help")
    ) {
      return "I'm here to help! Could you please provide more details about the issue you're experiencing?";
    } else {
      return "Thank you for reaching out! I've received your message and will assist you. Could you please provide more details about what you need help with?";
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="headset" size={24} color={colors.textWhite} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Live Chat Support</Text>
            <Text style={styles.headerSubtitle}>
              {isSupportTyping
                ? "Support is typing..."
                : "Online • Usually replies in minutes"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            // Could implement call functionality here
            Alert.alert("Call Support", "Calling support team...");
          }}
        >
          <Ionicons name="call-outline" size={24} color={colors.textWhite} />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="chatbubbles-outline"
                size={64}
                color={colors.textLight}
              />
              <Text style={styles.emptyText}>Start a conversation</Text>
              <Text style={styles.emptySubtext}>
                Send a message to get help from our support team
              </Text>
            </View>
          ) : (
            <>
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageWrapper,
                    message.sender === "user" && styles.messageWrapperUser,
                  ]}
                >
                  {message.sender === "support" && (
                    <View style={styles.supportAvatar}>
                      <Ionicons
                        name="headset"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      message.sender === "user"
                        ? styles.messageBubbleUser
                        : styles.messageBubbleSupport,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.sender === "user"
                          ? styles.messageTextUser
                          : styles.messageTextSupport,
                      ]}
                    >
                      {message.text}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        message.sender === "user"
                          ? styles.messageTimeUser
                          : styles.messageTimeSupport,
                      ]}
                    >
                      {message.timestamp}
                    </Text>
                  </View>

                  {message.sender === "user" && (
                    <View style={styles.userAvatar}>
                      <Ionicons
                        name="person"
                        size={20}
                        color={colors.textWhite}
                      />
                    </View>
                  )}
                </View>
              ))}

              {/* Typing Indicator */}
              {isSupportTyping && (
                <View style={[styles.messageWrapper, styles.typingWrapper]}>
                  <View style={styles.supportAvatar}>
                    <Ionicons name="headset" size={20} color={colors.primary} />
                  </View>
                  <View
                    style={[styles.messageBubble, styles.messageBubbleSupport]}
                  >
                    <View style={styles.typingIndicator}>
                      <View style={[styles.typingDot, styles.typingDot1]} />
                      <View style={[styles.typingDot, styles.typingDot2]} />
                      <View style={[styles.typingDot, styles.typingDot3]} />
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => {
            Alert.alert("Attach File", "File attachment feature coming soon!");
          }}
        >
          <Ionicons name="attach" size={24} color={colors.textLight} />
        </TouchableOpacity>

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

        {isSending ? (
          <View style={styles.sendButton}>
            <ActivityIndicator size="small" color={colors.textWhite} />
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? colors.textWhite : colors.textLight}
            />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing["3xl"],
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: spacing.md,
  },
  messageWrapperUser: {
    justifyContent: "flex-end",
  },
  typingWrapper: {
    marginTop: spacing.xs,
  },
  supportAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  messageBubble: {
    maxWidth: "75%",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  messageBubbleSupport: {
    backgroundColor: colors.background,
    borderBottomLeftRadius: borderRadius.xs,
  },
  messageBubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.xs,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  messageTextSupport: {
    color: colors.text,
  },
  messageTextUser: {
    color: colors.textWhite,
  },
  messageTime: {
    fontSize: typography.fontSize.xs,
    alignSelf: "flex-end",
  },
  messageTimeSupport: {
    color: colors.textLight,
  },
  messageTimeUser: {
    color: colors.textWhite,
    opacity: 0.8,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textLight,
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.md,
    paddingBottom: Platform.OS === "ios" ? spacing.lg : spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.backgroundLight,
  },
});
