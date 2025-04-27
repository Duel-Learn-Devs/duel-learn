import { useState } from "react";

const passwordValidation = (value: string) => {
  if (!value) {
    return "Password is required.";
  } else if (value.length < 8) {
    return "Password must be at least 10 characters.";
  } else if (!/[A-Z]/.test(value)) {
    return "Password must contain at least one uppercase letter.";
  } else if (!/[a-z]/.test(value)) {
    return "Password must contain at least one lowercase letter.";
  } else if (!/[0-9]/.test(value)) {
    return "Password must contain at least one number.";
  } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    return "Password must contain at least one special character.";
  }
  return "";
};

const confirmPasswordValidation = (value: string, formData: any, passwordField: string) => {
  if (!value) {
    return "Please confirm your password.";
  } else if (value !== formData[passwordField]) {
    return "Passwords do not match.";
  }
  return "";
};

const usePasswordValidation = () => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validatePassword = (field: string, value: string, formData: any = {}, passwordField: string = "password") => {
    let error = "";   

    switch (field) {
      case "password":
      case "newpassword":
        error = passwordValidation(value);
        break;
      case "confirmPassword":
        error = confirmPasswordValidation(value, formData, passwordField);
        break;
      default:
        break;
    }

    setErrors((prevErrors) => ({ ...prevErrors, [field]: error }));
    return error;
  };

  const validatePasswordForm = (fields: { [key: string]: string }, passwordField: string = "password") => {
    let valid = true;
    for (const field in fields) {
      const error = validatePassword(field, fields[field], fields, passwordField);
      if (error) valid = false;
    }
    return valid;
  };

  return { errors, validatePassword, validatePasswordForm };
};

export default usePasswordValidation;
