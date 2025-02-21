import { useState } from "react";

const useValidation = () => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = (field: string, value: string, formData: any = {}) => {
    let error = "";

    switch (field) {
      case "username":
        if (!value) {
          error = "Username is required.";
        } else if (value.length < 8) {
          error = "Username must be at least 8 characters.";
        } else if (value.length > 20) {
          error = "Username cannot exceed 20 characters.";
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          error =
            "Username can only contain alphanumeric characters and underscores.";
        }
        break;
      case "email":
        if (!value) {
          error = "Email is required.";
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = "Please enter a valid email address.";
        }
        break;
      case "password":
        if (!value) {
          error = "Password is required.";
        } else if (value.length < 8) {
          error = "Password must be at least 8 characters.";
        } else if (!/[A-Z]/.test(value)) {
          error = "Password must contain at least one uppercase letter.";
        } else if (!/[a-z]/.test(value)) {
          error = "Password must contain at least one lowercase letter.";
        } else if (!/[0-9]/.test(value)) {
          error = "Password must contain at least one number.";
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
          error = "Password must contain at least one special character.";
        }
        break;
      case "confirmPassword":
        if (!value) {
          error = "Please confirm your password.";
        } else if (value !== formData.password) {
          error = "Passwords do not match.";
        }
        break;
      case "terms":
        if (!formData.terms) {
          error = "You must agree to the terms and conditions.";
        }
        break;
      default:
        break;
    }

    setErrors((prevErrors) => ({ ...prevErrors, [field]: error }));
    return error;
  };

  const validateForm = (fields: { [key: string]: string }) => {
    let valid = true;
    for (const field in fields) {
      const error = validate(field, fields[field], fields);
      if (error) valid = false;
    }
    return valid;
  };

  return { errors, validate, validateForm };
};

export default useValidation;
