import React, { createContext, useState, useContext, useCallback } from 'react';
import { auth } from '../services/firebase';
import axios, { AxiosError } from 'axios';

// Define the shape of a user in the admin context
export interface AdminUserData {
  firebase_uid: string;
  username: string | null;
  email: string | null;
  display_picture: string | null;
  full_name: string | null;
  email_verified: boolean;
  isSSO: boolean;
  account_type: "free" | "premium" | "admin";
  level?: number;
  exp?: number;
  mana?: number;
  coins?: number;
  created_at?: string;
  updated_at?: string;
  existInSQL?: boolean;
  existInFirebaseAuth?: boolean;
  existInFirestore?: boolean;
}

interface AdminContextState {
  users: AdminUserData[];
  loading: boolean;
  error: string | null;
  selectedUsers: string[];
}

interface AdminContextValue extends AdminContextState {
  fetchUsers: () => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  deleteSelectedUsers: (userIds: string[]) => Promise<void>;
  toggleUserSelection: (userId: string) => void;
  clearSelectedUsers: () => void;
  selectAllUsers: () => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AdminContextState>({
    users: [],
    loading: false,
    error: null,
    selectedUsers: [],
  });

  const fetchUsers = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await axios.get('/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (Array.isArray(response.data.users)) {
        setState(prev => ({
          ...prev,
          users: response.data.users,
          loading: false
        }));
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.status === 401 || axiosError.response?.status === 403
        ? 'Authentication failed. Please ensure you are logged in as an admin.'
        : `Error: ${axiosError.message || 'Unknown error'}`;
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
    }
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      await axios.delete(`/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setState(prev => ({
        ...prev,
        users: prev.users.filter(user => user.firebase_uid !== userId),
        selectedUsers: prev.selectedUsers.filter(id => id !== userId),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting user:', error);
      const axiosError = error as AxiosError;
      setState(prev => ({
        ...prev,
        error: `Failed to delete user: ${axiosError.message || 'Unknown error'}`,
        loading: false
      }));
    }
  }, []);

  const deleteSelectedUsers = useCallback(async (userIds: string[]) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      await Promise.all(
        userIds.map(userId =>
          axios.delete(`/admin/users/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        )
      );

      setState(prev => ({
        ...prev,
        users: prev.users.filter(user => !userIds.includes(user.firebase_uid)),
        selectedUsers: [],
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting users:', error);
      const axiosError = error as AxiosError;
      setState(prev => ({
        ...prev,
        error: `Failed to delete users: ${axiosError.message || 'Unknown error'}`,
        loading: false
      }));
    }
  }, []);

  const toggleUserSelection = useCallback((userId: string) => {
    setState(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }));
  }, []);

  const clearSelectedUsers = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedUsers: []
    }));
  }, []);

  const selectAllUsers = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedUsers: prev.users.map(user => user.firebase_uid)
    }));
  }, []);

  return (
    <AdminContext.Provider
      value={{
        ...state,
        fetchUsers,
        deleteUser,
        deleteSelectedUsers,
        toggleUserSelection,
        clearSelectedUsers,
        selectAllUsers,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextValue => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}; 