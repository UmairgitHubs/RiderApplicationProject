import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// API Base URL Configuration
// For web: use localhost:3000
// For Android Emulator: use 10.0.2.2:3000 (special IP for Android emulator to access host)
// For iOS Simulator: use localhost:3000
// For Physical Device: use your computer's IP address

// Your computer's IP address (update if changed)
// Found: 192.168.100.223
const COMPUTER_IP = "192.168.100.223"; // Update this if your IP changes

// Detect platform and set appropriate URL
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Check Platform.OS FIRST (more reliable than window check)
    const platform = Platform.OS as string;
    console.log("📱 Platform.OS:", platform);
    console.log("🌐 typeof window:", typeof window);

    // For Android - Try computer's IP first, fallback to 10.0.2.2
    if (platform === "android") {
      // Use your computer's IP address (works for both emulator and physical device)
      const url = `http://${COMPUTER_IP}:3000/api/v1`;
      console.log("🤖 Android detected - Using computer IP:", url);
      console.log("💡 If this doesn't work, try: http://10.0.2.2:3000/api/v1");
      return url;
    }

    // For iOS
    if (platform === "ios") {
      const url = "http://localhost:3000/api/v1";
      console.log("🍎 iOS detected, using:", url);
      return url;
    }

    // For web - only if Platform.OS is 'web' (not just if window exists)
    // Note: TypeScript might complain about checks that seem impossible on some platforms
    // but in React Native we need these runtime checks.
    if (
      platform === "web" ||
      (typeof window !== "undefined" &&
        platform !== "android" &&
        platform !== "ios")
    ) {
      const url = "http://localhost:3000/api/v1";
      console.log("🌐 Web detected, using:", url);
      return url;
    }

    // Default fallback - use Android emulator URL as safe default
    const url = "http://10.0.2.2:3000/api/v1";
    console.log(
      "⚠️ Unknown platform, defaulting to Android emulator URL:",
      url
    );
    return url;
  }
  return "https://your-production-api.com/api/v1";
};

const API_BASE_URL = getApiBaseUrl();

// Log the final API URL being used
console.log("✅ Final API Base URL:", API_BASE_URL);
console.log("🔧 Platform:", Platform.OS);

// Get auth token from storage
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem("@auth_token");
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// API Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await getAuthToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${this.baseURL}${endpoint}`;

    console.log("API Request:", url, options.method || "GET"); // Debug log

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout (increased for Android)

      console.log("🌐 Making request to:", url);
      console.log("📋 Request options:", {
        method: options.method || "GET",
        headers,
      });

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(
        "✅ Response received:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          errorData.error?.message ||
          `HTTP error! status: ${response.status}`;
        console.error("API Error Response:", response.status, errorMessage);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      console.error("API Request Error:", error);

      // Better error messages
      if (error.name === "AbortError") {
        throw new Error(
          "Request timeout. Please check your connection and try again."
        );
      } else if (
        error.message.includes("Network request failed") ||
        error.message.includes("Failed to fetch")
      ) {
        throw new Error(
          "Network error. Please check:\n1. Backend is running\n2. Correct API URL\n3. Android Emulator can reach host"
        );
      }

      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Create API instance
export const api = new ApiClient(API_BASE_URL);

// Shipment API
export const shipmentApi = {
  create: async (data: {
    recipientName: string;
    recipientPhone: string;
    recipientEmail?: string;
    pickupAddress: string;
    pickupLatitude?: number;
    pickupLongitude?: number;
    deliveryAddress: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    packages: Array<{
      packageType: string;
      packageWeight?: string;
      packageValue?: string;
      packageSize: string;
      description?: string;
    }>;
    specialInstructions?: string;
    scheduledPickupTime?: string;
    scheduledDeliveryTime?: string;
    codAmount?: number;
    paymentMethod?: string;
  }) => {
    return api.post("/shipments", data);
  },

  getAll: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryString = params
      ? "?" + new URLSearchParams(params as any).toString()
      : "";
    return api.get(`/shipments${queryString}`);
  },

  getById: async (id: string) => {
    return api.get(`/shipments/${id}`);
  },

  track: async (trackingNumber: string) => {
    return api.get(`/shipments/track/${trackingNumber}`);
  },

  getStats: async () => {
    return api.get('/shipments/stats');
  },
};

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post<any>("/auth/login", { email, password });
    // Store token and user data
    if (response.success && response.data?.token) {
      await AsyncStorage.setItem("@auth_token", response.data.token);
      if (response.data.refreshToken) {
        await AsyncStorage.setItem(
          "@refresh_token",
          response.data.refreshToken
        );
      }
      if (response.data.user) {
        await AsyncStorage.setItem(
          "@user_data",
          JSON.stringify(response.data.user)
        );
      }
    }
    return response;
  },

  register: async (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role: "merchant" | "rider";
    businessName?: string;
  }) => {
    const response = await api.post<any>("/auth/register", data);
    // Store token if provided
    if (response.success && response.data?.token) {
      await AsyncStorage.setItem("@auth_token", response.data.token);
      if (response.data.refreshToken) {
        await AsyncStorage.setItem(
          "@refresh_token",
          response.data.refreshToken
        );
      }
      if (response.data.user) {
        await AsyncStorage.setItem(
          "@user_data",
          JSON.stringify(response.data.user)
        );
      }
    }
    return response;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response;
  },

  verifyOTP: async (email: string, code: string) => {
    const response = await api.post("/auth/verify-otp", { email, code });
    return response;
  },

  resetPassword: async (email: string, code: string, newPassword: string) => {
    const response = await api.post("/auth/reset-password", {
      email,
      code,
      newPassword,
    });
    return response;
  },

  logout: async () => {
    await AsyncStorage.multiRemove([
      "@auth_token",
      "@refresh_token",
      "@user_data",
    ]);
  },

  // Get stored user data
  getStoredUser: async () => {
    try {
      const userData = await AsyncStorage.getItem("@user_data");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error getting stored user:", error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem("@auth_token");
      return !!token;
    } catch (error) {
      return false;
    }
  },
};

// Profile API
export const profileApi = {
  getProfile: async () => {
    return api.get("/profile");
  },

  updateProfile: async (data: {
    fullName?: string;
    phone?: string;
    businessName?: string;
    address?: string;
    city?: string;
    country?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  }) => {
    return api.patch("/profile", data);
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return api.post("/profile/change-password", {
      currentPassword,
      newPassword,
    });
  },
};

// Delivered Orders API
export const deliveredOrdersApi = {
  getDeliveredOrders: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const queryString = params
      ? "?" +
        new URLSearchParams({
          status: "delivered",
          ...(params.page && { page: params.page.toString() }),
          ...(params.limit && { limit: params.limit.toString() }),
          ...(params.search && { search: params.search }),
        } as any).toString()
      : "?status=delivered";
    return api.get(`/shipments${queryString}`);
  },
};

// Address API
export const addressApi = {
  getAddresses: async () => {
    return api.get("/profile/addresses");
  },

  addAddress: async (data: {
    label?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }) => {
    return api.post("/profile/addresses", data);
  },

  updateAddress: async (
    id: string,
    data: {
      label?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      isDefault?: boolean;
    }
  ) => {
    return api.patch(`/profile/addresses/${id}`, data);
  },

  deleteAddress: async (id: string) => {
    return api.delete(`/profile/addresses/${id}`);
  },
};

// Chat API
export const chatApi = {
  // Get or create support conversation
  getSupportConversation: async () => {
    return api.get("/chat/support/conversation");
  },

  // Get messages for a conversation
  getMessages: async (
    conversationId: string,
    params?: { page?: number; limit?: number }
  ) => {
    const queryString = params
      ? "?" + new URLSearchParams(params as any).toString()
      : "";
    return api.get(
      `/chat/conversations/${conversationId}/messages${queryString}`
    );
  },

  // Send message to support
  sendMessage: async (data: { text: string; conversationId?: string }) => {
    return api.post("/chat/support/messages", data);
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return api.put('/notifications/mark-all-read', {});
  },

  // Shipment specific methods
  getShipmentMessages: async (shipmentId: string) => {
    return api.get<{ success: boolean; data: any[] }>(`/chat/conversations/${shipmentId}`);
  },

  sendShipmentMessage: async (data: { shipmentId: string; content: string; recipientId?: string }) => {
    return api.post(`/chat/messages`, data);
  },

  markShipmentRead: async (shipmentId: string) => {
    return api.patch(`/chat/conversations/${shipmentId}/read`, {});
  }
};

// Rider API
export const riderApi = {
  // Get available orders
  getAvailableOrders: async (params?: {
    latitude?: number;
    longitude?: number;
    radius?: number;
  }) => {
    const queryString = params
      ? "?" + new URLSearchParams(params as any).toString()
      : "";
    return api.get(`/rider/available-orders${queryString}`);
  },

  // Accept an order
  acceptOrder: async (shipmentId: string) => {
    return api.post("/rider/accept-order", { shipmentId });
  },

  // Get active orders
  getActiveOrders: async () => {
    return api.get("/rider/active-orders");
  },

  // Complete delivery
  completeDelivery: async (data: {
    shipmentId: string;
    codAmount?: number;
    notes?: string;
  }) => {
    return api.post("/rider/complete-delivery", data);
  },

  // Update location
  updateLocation: async (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    shipmentId?: string;
  }) => {
    return api.post("/rider/update-location", data);
  },

  // Toggle online status
  toggleOnlineStatus: async (isOnline: boolean) => {
    return api.post("/rider/toggle-online", { isOnline });
  },

  // Get earnings
  getEarnings: async (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const queryString = params
      ? "?" + new URLSearchParams(params as any).toString()
      : "";
    return api.get(`/rider/earnings${queryString}`);
  },

  // Get completed orders (recent deliveries)
  getCompletedOrders: async (params?: {
    page?: number;
    limit?: number;
  }) => {
    const queryString = params
      ? "?" + new URLSearchParams(params as any).toString()
      : "";
    return api.get(`/rider/completed-orders${queryString}`);
  },
};

// Notifications API
export const notificationsApi = {
  // Get notifications
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) => {
    const queryString = params
      ? "?" + new URLSearchParams(params as any).toString()
      : "";
    return api.get(`/notifications${queryString}`);
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    return api.patch(`/notifications/${notificationId}/read`, {});
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return api.patch("/notifications/read-all", {});
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    return api.delete(`/notifications/${notificationId}`);
  },
};

export default api;
