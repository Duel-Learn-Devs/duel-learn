import { validate, Joi } from 'express-validation';

// Define the validation schema for storing users
const storeUserValidation = validate({
  body: Joi.object({
    username: Joi.string()
      .required()
      .min(2)
      .max(20)
      .pattern(/^[a-zA-Z0-9_]+$/)
      .messages({
        'string.empty': 'Username is required.',
        'string.min': 'Username must be at least 2 characters.',
        'string.max': 'Username cannot exceed 20 characters.',
        'string.pattern.base': 'Username can only contain alphanumeric characters and underscores.',
      }),
    account_type: Joi.string()
      .required()
      .valid('free', 'premium', 'admin')
      .messages({
        'string.empty': 'Account type is required.',
        'string.valid': 'Invalid account type.',
      }),
    email: Joi.string()
      .required()
      .email()
      .messages({
        'string.empty': 'Email is required.',
        'string.email': 'Please enter a valid email address.',
      }),
    password: Joi.string()
      .required()
      .min(8)
      .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])/)
      .messages({
        'string.empty': 'Password is required.',
        'string.min': 'Password must be at least 8 characters.',
        'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character.',
      }),
  }),
});

export default storeUserValidation;