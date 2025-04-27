import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface PasswordValidationTooltipProps {
  password: string;
  isVisible: boolean;
}

const PasswordValidationTooltip: React.FC<PasswordValidationTooltipProps> = ({ 
  password, 
  isVisible 
}) => {
  // Check each password requirement
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  // Check if all requirements are met
  const allRequirementsMet = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  
  // If all requirements are met and the component is set to be invisible, don't render
  if (!isVisible && allRequirementsMet) {
    return null;
  }

  return (
    <div className={`password-validation-tooltip bg-[#2A2538] text-white p-4 rounded-lg shadow-lg absolute left-0 z-10 mt-2 w-full max-w-md transition-all duration-300 ${isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'}`} style={{ top: '100%' }}>
      <h3 className="text-[#E2DDF3] font-semibold mb-2">Password must contain:</h3>
      <ul className="space-y-2">
        <li className="flex items-center gap-2">
          {hasMinLength ? (
            <CheckCircleIcon className="text-green-500" fontSize="small" />
          ) : (
            <CancelIcon className="text-red-500" fontSize="small" />
          )}
          <span className={hasMinLength ? "text-green-500" : "text-[#9F9BAE]"}>
            At least 8 characters
          </span>
        </li>
        <li className="flex items-center gap-2">
          {hasUppercase ? (
            <CheckCircleIcon className="text-green-500" fontSize="small" />
          ) : (
            <CancelIcon className="text-red-500" fontSize="small" />
          )}
          <span className={hasUppercase ? "text-green-500" : "text-[#9F9BAE]"}>
            At least one uppercase letter
          </span>
        </li>
        <li className="flex items-center gap-2">
          {hasLowercase ? (
            <CheckCircleIcon className="text-green-500" fontSize="small" />
          ) : (
            <CancelIcon className="text-red-500" fontSize="small" />
          )}
          <span className={hasLowercase ? "text-green-500" : "text-[#9F9BAE]"}>
            At least one lowercase letter
          </span>
        </li>
        <li className="flex items-center gap-2">
          {hasNumber ? (
            <CheckCircleIcon className="text-green-500" fontSize="small" />
          ) : (
            <CancelIcon className="text-red-500" fontSize="small" />
          )}
          <span className={hasNumber ? "text-green-500" : "text-[#9F9BAE]"}>
            At least one number
          </span>
        </li>
        <li className="flex items-center gap-2">
          {hasSpecialChar ? (
            <CheckCircleIcon className="text-green-500" fontSize="small" />
          ) : (
            <CancelIcon className="text-red-500" fontSize="small" />
          )}
          <span className={hasSpecialChar ? "text-green-500" : "text-[#9F9BAE]"}>
            At least one special character (!@#$%^&*(),.?":{}|&lt;&gt;)
          </span>
        </li>
      </ul>
    </div>
  );
};

export default PasswordValidationTooltip; 