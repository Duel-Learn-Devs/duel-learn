import { useMemo } from 'react';

// Generic interface for any friend object that has a firebase_uid
interface FriendWithId {
  firebase_uid: string;
  [key: string]: any;
}

// Friend status information including online, game, and lobby status
interface FriendStatus {
  isOnline: boolean;
  isInGame: boolean;
  isInLobby: boolean;
  // Include gameMode for additional information
  gameMode?: string | null;
}

/**
 * Custom hook to sort friends by their status:
 * 1. Online (available) friends first
 * 2. Busy (in game or in lobby) friends next
 * 3. Offline friends last
 * 
 * @param friends Array of friend objects with firebase_uid property
 * @param statusMap Map of friend IDs to their status information
 * @returns Sorted array of friends
 */
export function useSortedFriends<T extends FriendWithId>(
  friends: T[],
  statusMap: Map<string, FriendStatus>
): T[] {
  // Sort the friends using the provided status map
  return useMemo(() => {
    return [...friends].sort((a, b) => {
      const statusA = statusMap.get(a.firebase_uid);
      const statusB = statusMap.get(b.firebase_uid);
      
      if (!statusA || !statusB) return 0;
      
      // Helper function to get sort priority
      const getPriority = (status: FriendStatus) => {
        if (!status.isOnline) return 3; // Offline - lowest priority
        if (status.isInGame || status.isInLobby) return 2; // Busy - middle priority
        return 1; // Online and available - highest priority
      };
      
      const priorityA = getPriority(statusA);
      const priorityB = getPriority(statusB);
      
      return priorityA - priorityB;
    });
  }, [friends, statusMap]);
} 