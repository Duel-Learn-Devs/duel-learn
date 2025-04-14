import { io, Socket } from "socket.io-client";

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private userId: string | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private eventListeners: Map<string, Set<Function>> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(userId: string): Socket {
    this.logSocketStatus(); // Log before connecting
    
    // If we have a valid connection, return it
    if (this.socket?.connected && this.userId === userId) {
      console.log("Reusing existing socket connection:", this.socket.id);
      return this.socket;
    }

    // If we're already trying to connect, return the socket
    if (this.isConnecting) {
      console.log("Socket connection in progress, please wait");
      return this.socket as Socket;
    }

    // Reset reconnect attempts if we have a new user
    if (this.userId !== userId) {
      this.reconnectAttempts = 0;
    }

    // Disconnect any existing socket
    this.disconnect();

    console.log("Creating new socket connection for user:", userId);
    this.userId = userId;
    this.isConnecting = true;

    this.socket = io(`${import.meta.env.VITE_BACKEND_URL}`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      query: { userId }
    });

    this.setupSocketListeners();
    return this.socket;
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Socket connected with ID:", this.socket?.id);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Log detailed connection info
      console.log(`✅ Socket connected successfully:
        - Socket ID: ${this.socket?.id}
        - User ID: ${this.userId}
        - Connected: ${this.socket?.connected}
      `);
      
      // Important: Setup user's room immediately
      this.socket?.emit("setup", this.userId);
      console.log("Setup message sent for user:", this.userId);
      
      // Re-attach all event listeners
      this.reattachEventListeners();
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.isConnecting = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
        console.error("Max reconnection attempts reached");
        this.disconnect();
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      this.isConnecting = false;
      
      // If the disconnect was not initiated by us, attempt to reconnect
      if (reason !== "io client disconnect" && this.userId) {
        this.attemptReconnect();
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS && this.userId) {
      console.log(`Attempting reconnection (${this.reconnectAttempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);
      setTimeout(() => {
        this.connect(this.userId!);
      }, Math.min(1000 * Math.pow(2, this.reconnectAttempts), 5000));
    }
  }

  private reattachEventListeners() {
    if (!this.socket) return;
    
    // Re-attach all stored event listeners
    this.eventListeners.forEach((listeners, event) => {
      listeners.forEach(listener => {
        console.log(`Re-attaching listener for event: ${event}`);
        this.socket?.on(event, listener as (...args: any[]) => void);
      });
    });
  }

  public on(event: string, callback: (data: any) => void) {
    console.log(`Setting up listener for ${event}`);
    
    const wrappedCallback = (data: any) => {
      if (event === 'battle_invitation') {
        console.group(`📩 BATTLE INVITATION RECEIVED`);
        console.log(`Raw data:`, JSON.stringify(data));
        console.log(`Data type: ${typeof data}`);
        console.log(`Keys: ${Object.keys(data).join(', ')}`);
        
        // Check for specific fields
        console.log(`senderId: ${data.senderId || 'MISSING'}`);
        console.log(`lobbyCode: ${data.lobbyCode || 'MISSING'}`);
        console.log(`senderName: ${data.senderName || 'MISSING'}`);
        console.groupEnd();
        
        // Add validation before calling the callback
        if (!data.senderId || !data.lobbyCode) {
          console.error("⚠️ Received incomplete battle invitation data:", data);
        }
      }
      
      callback(data);
    };
    
    this.socket?.on(event, wrappedCallback);
    return () => this.socket?.off(event, wrappedCallback);
  }

  public off(event: string, listener: Function) {
    if (!this.socket) return;
    
    // Remove the listener
    this.socket.off(event, listener as any);
    
    // Remove from storage
    this.eventListeners.get(event)?.delete(listener);
    if (this.eventListeners.get(event)?.size === 0) {
      this.eventListeners.delete(event);
    }
    
    console.log(`Removed listener for event: ${event}`);
  }

  public disconnect(): void {
    if (this.socket) {
      console.log("Disconnecting socket:", this.socket.id);
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public sendBattleInvitation(data: {
    senderId: string;
    senderName: string;
    receiverId: string;
    lobbyCode: string;
  }): void {
    if (!this.socket) {
      console.error("Cannot send invitation: No active socket connection");
      return;
    }

    // Enhanced logging
    console.log("Sending battle invitation via socket:", {
      ...data,
      socketId: this.socket.id,
      connected: this.socket.connected,
    });
    
    this.socket.emit("notify_battle_invitation", {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  private logSocketStatus(): void {
    if (this.socket) {
      console.log(`Socket status check:
        - ID: ${this.socket.id || 'undefined'}
        - Connected: ${this.socket.connected}
        - User ID: ${this.userId || "Not set"}
        - Reconnect Attempts: ${this.reconnectAttempts}
      `);
    } else {
      console.log("Socket status: Not initialized");
    }
  }
}

export default SocketService; 