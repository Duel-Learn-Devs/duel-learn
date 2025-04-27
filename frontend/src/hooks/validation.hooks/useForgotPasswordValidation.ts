import { useState } from "react";

const emailValidation = (value: string) => {
  if (!value) {
    return "Email is required.";
  } else if (!/\S+@\S+\.\S+/.test(value)) {
    return "Please enter a valid email address.";
  }
  return "";
};

const useForgotPasswordValidation = () => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = (field: string, value: string) => {
    let error = "";

    switch (field) {
      case "email":
        error = emailValidation(value);
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
      const error = validate(field, fields[field]);
      if (error) valid = false;
    }
    return valid;
  };

  return { errors, validate, validateForm };
};

export default useForgotPasswordValidation;
