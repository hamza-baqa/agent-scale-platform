import type { Socket } from 'socket.io-client';
import { WebSocketEvent } from '@/types/migration.types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private ioInstance: any = null;

  /**
   * Dynamically import socket.io-client only in browser
   */
  private async loadSocketIO() {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!this.ioInstance) {
      try {
        const socketIO = await import('socket.io-client');
        this.ioInstance = socketIO.io;
      } catch (error) {
        console.error('Failed to load socket.io-client:', error);
        return null;
      }
    }
    return this.ioInstance;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    // Only run in browser
    if (typeof window === 'undefined') {
      return;
    }

    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const io = await this.loadSocketIO();
    if (!io) return;

    return new Promise((resolve) => {
      this.socket = io(WS_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected successfully');
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      this.socket.on('subscribed', (data) => {
        console.log('✅ Subscribed to migration:', data);
      });

      // Set up event listeners
      this.socket.on('agent-started', (data) => {
        console.log('🚀 Agent started:', data);
        this.emit('agent-started', data);
      });
      this.socket.on('agent-progress', (data) => {
        console.log('⚙️ Agent progress:', data);
        this.emit('agent-progress', data);
      });
      this.socket.on('agent-completed', (data) => {
        console.log('✅ Agent completed:', data);
        this.emit('agent-completed', data);
      });
      this.socket.on('migration-completed', (data) => {
        console.log('🎉 Migration completed:', data);
        this.emit('migration-completed', data);
      });
      this.socket.on('deployment-progress', (data) => {
        console.log('🚀 Deployment progress:', data);
        this.emit('deployment-progress', data);
      });
      this.socket.on('deployment-completed', (data) => {
        console.log('✅ Deployment completed:', data);
        this.emit('deployment-completed', data);
      });
      this.socket.on('deployment-failed', (data) => {
        console.log('❌ Deployment failed:', data);
        this.emit('deployment-failed', data);
      });
      this.socket.on('error', (data) => this.emit('error', data));
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to migration updates
   */
  subscribeMigration(migrationId: string): void {
    if (this.socket && this.socket.connected) {
      console.log('📡 Subscribing to migration:', migrationId);
      this.socket.emit('subscribe', { migrationId });
    } else {
      console.error('❌ Cannot subscribe - socket not connected');
    }
  }

  /**
   * Unsubscribe from migration updates
   */
  unsubscribeMigration(migrationId: string): void {
    if (this.socket) {
      this.socket.emit('unsubscribe', { migrationId });
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Lazy singleton - only create instance in browser
let instance: WebSocketService | null = null;

function getWebSocketService(): WebSocketService {
  if (typeof window === 'undefined') {
    // Return a mock service for SSR
    return {
      connect: async () => {},
      disconnect: () => {},
      subscribeMigration: () => {},
      unsubscribeMigration: () => {},
      on: () => {},
      off: () => {},
      isConnected: () => false,
    } as any;
  }

  if (!instance) {
    instance = new WebSocketService();
  }
  return instance;
}

export default getWebSocketService();
