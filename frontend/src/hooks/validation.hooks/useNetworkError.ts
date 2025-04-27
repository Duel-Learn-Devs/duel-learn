import { useState } from "react";

const useNetworkError = () => {
  const [error, setError] = useState(""); // State for handling errors

  const handleNetworkError = (error: any) => {
    console.error("Network error:", error);

    const errorMessages: { [key: string]: string } = {
      "ERR_CONNECTION_REFUSED": "Connection refused. Please try again later.",
      "ERR_BLOCKED_BY_CLIENT": "Request blocked by client. Check your settings.",
      "ERR_NETWORK_CHANGED": "Network changed. Please check your connection.",
      "ERR_INTERNET_DISCONNECTED": "Internet disconnected. Please check your connection.",
      "ERR_NAME_NOT_RESOLVED": "Name not resolved. Please check your connection.",
    };

    // Set a friendly error message or fallback to default message
    setError(
      errorMessages[error.code] ||
        "A network error occurred. Please try again."
    );
  };

  return { error, handleNetworkError, setError };
};

export default useNetworkError;
