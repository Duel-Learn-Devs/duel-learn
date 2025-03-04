import { useState } from "react";

const useSQLError = () => {
  const [error, setError] = useState(""); // State for handling errors

  const handleSQLError = (error: any) => {
    console.error("SQL error:", error);

    const errorMessages: { [key: string]: string } = {
      "ER_DUP_ENTRY": "Duplicate entry. This record already exists.",
      "ER_BAD_FIELD_ERROR": "Invalid field. Please check your input.",
      "ER_PARSE_ERROR": "Parse error. Please check your query syntax.",
      "ER_NO_SUCH_TABLE": "Table not found. Please check your database.",
      "ER_LOCK_WAIT_TIMEOUT": "Lock wait timeout. Please try again later.",
    };

    // Set a friendly error message or fallback to default message
    setError(
      errorMessages[error.code] ||
        "A database error occurred. Please try again."
    );
  };

  return { error, handleSQLError, setError };
};

export default useSQLError;
