/**
 * Utility functions for user management
 */

import { Theme } from '@mui/material';

/**
 * Returns a Material UI color based on the account type
 * @param accountType Account type (free, premium, admin)
 * @returns Material UI color name
 */
export const getAccountTypeColor = (accountType: string | undefined) => {
  switch(accountType?.toLowerCase()) {
    case 'premium': 
      return 'warning';
    case 'admin': 
      return 'error';
    case 'free':
    default: 
      return 'default';
  }
};

/**
 * Returns a Material UI color based on the user status
 * @param status User status (active, inactive, suspended, pending)
 * @returns Material UI color name
 */
export const getStatusColor = (status: string | undefined) => {
  if (!status) return 'default';
  
  switch (status.toLowerCase()) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'default';
    case 'suspended':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
};

/**
 * Formats a date string to a locale format
 * @param dateString Date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};

/**
 * Returns the style object for dark theme card
 * @returns Style object for Material UI components
 */
export const getDarkThemeCardStyle = () => {
  return {
    backgroundColor: '#1E1A2B',
    borderRadius: 2,
    border: '1px solid #3B354D',
    color: '#E2DDF3',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
  };
}; 