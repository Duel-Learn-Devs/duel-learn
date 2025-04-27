import axios, { AxiosResponse, AxiosError } from "axios";

// Type definition for response with message
interface ApiResponse {
  success?: boolean;
  message?: string;
  severity?: "error" | "warning" | "info" | "success";
  [key: string]: any;
}

// Create this as a singleton that can be imported where needed
type SnackbarFunction = (
  message: string,
  severity?: "error" | "warning" | "info" | "success"
) => void;
let showSnackbarFunction: SnackbarFunction | null = null;

// Auth token management
let authToken: string | null = null;
let tokenUpdateCallback: ((token: string | null) => void) | null = null;

// Function to set the token from outside (to be called by AuthContext)
export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (tokenUpdateCallback) {
    tokenUpdateCallback(token);
  }
};

export const setTokenUpdateCallback = (
  callback: (token: string | null) => void
) => {
  tokenUpdateCallback = callback;
};

export const setSnackbarFunction = (fn: SnackbarFunction) => {
  showSnackbarFunction = fn;
};

// Create the API client
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL_API || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);

      // Use the stored token instead of directly accessing Firebase
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
        console.log(`Token attached: ${authToken.substring(0, 10)}...`);
      } else {
        console.warn("⚠️ No auth token available for request to:", config.url);
      }
    } catch (error) {
      console.error("❌ Error setting auth token in request:", error);
    }
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle middleware messages
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // If response has a message, show it in the snackbar
    if (response.data?.message && showSnackbarFunction) {
      showSnackbarFunction(
        response.data.message,
        response.data.severity || "info"
      );
    }
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    // Handle error responses
    let message = "An error occurred";
    let severity: "error" | "warning" = "error";

    console.log("API Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    });

    if (error.response?.data) {
      // Check for error message in various formats that the API might return
      if (error.response.data.error) {
        // Some endpoints return errors as { error: "message" }
        message = error.response.data.error;
      } else if (error.response.data.message) {
        // While others use { message: "message" }
        message = error.response.data.message;
      } else if (typeof error.response.data === "string") {
        // Handle case where the entire response is a string error
        message = error.response.data;
      }

      if (error.response.data.severity) {
        severity = error.response.data.severity as "error" | "warning";
      }
    }

    // Special case for network errors
    if (error.code === "ERR_NETWORK") {
      message = "Network error. Please check your connection.";
    }

    // Special case for timeout
    if (error.code === "ECONNABORTED") {
      message = "Request timed out. Please try again.";
    }

    // Special case for 401 Unauthorized
    if (error.response?.status === 401) {
      message = "Authentication required. Please make sure you are logged in.";
    }

    // Special case for 403 Forbidden
    if (error.response?.status === 403) {
      message =
        "You do not have permission to access this resource. Admin privileges required.";

      // Log details for debugging
      console.log("403 Forbidden Error - Request URL:", error.config?.url);
    }

    // Special case for 404 Not Found
    if (error.response?.status === 404) {
      // If there's no specific error message, use a default one based on context
      if (!error.response.data?.error && !error.response.data?.message) {
        // Extract the last part of the URL to identify what wasn't found
        const urlParts = error.config?.url?.split("/") || [];
        const resource = urlParts[urlParts.length - 1] || "resource";

        // Distinguish between user not found and other resources
        if (urlParts.includes("user") || urlParts.includes("users")) {
          message = `User not found. The account may not exist or may need to be registered.`;
        } else {
          message = `The requested ${resource} was not found.`;
        }
      }
    }

    // Display the error message
    if (showSnackbarFunction) {
      showSnackbarFunction(message, severity);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
