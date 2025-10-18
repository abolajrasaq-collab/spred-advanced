/**
 * WebSocket Client for Real-time Monitoring
 * Connects to monitoring server for real-time updates
 */

import { Platform } from 'react-native';
import logger from '../utils/logger';

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  timeout: number;
}

export interface WebSocketMessage {
  type: 'metrics' | 'alert' | 'alert_resolved' | 'pong' | 'error';
  data: any;
  timestamp: number;
}

export interface WebSocketClientOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectOnClose?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private options: WebSocketClientOptions;
  private reconnectAttempts = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private isConnecting = false;
  private isConnected = false;
  private messageQueue: WebSocketMessage[] = [];

  constructor(options: WebSocketClientOptions = {}) {
    this.options = {
      url: 'ws://localhost:8080',
      autoConnect: true,
      reconnectOnClose: true,
      ...options,
    };

    this.config = {
      url: this.options.url!,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      timeout: 10000,
    };

    if (this.options.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || this.isConnected) {
        resolve();
        return;
      }

      this.isConnecting = true;
      logger.info(`🔌 Connecting to WebSocket server: ${this.config.url}`);

      try {
        this.ws = new WebSocket(this.config.url);

        const connectTimeout = setTimeout(() => {
          if (!this.isConnected) {
            this.ws?.close();
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, this.config.timeout);

        this.ws.onopen = () => {
          clearTimeout(connectTimeout);
          this.isConnecting = false;
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          logger.info('✅ WebSocket connected');
          
          // Send queued messages
          this.flushMessageQueue();
          
          // Start heartbeat
          this.startHeartbeat();
          
          // Notify listeners
          this.options.onConnect?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            logger.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectTimeout);
          this.isConnecting = false;
          this.isConnected = false;
          
          logger.warn(`🔌 WebSocket disconnected: ${event.code} ${event.reason}`);
          
          // Stop heartbeat
          this.stopHeartbeat();
          
          // Notify listeners
          this.options.onDisconnect?.();
          
          // Attempt reconnection
          if (this.options.reconnectOnClose && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectTimeout);
          this.isConnecting = false;
          
          logger.error('WebSocket error:', error);
          this.options.onError?.(new Error('WebSocket connection failed'));
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        logger.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    logger.info('🔌 Disconnecting WebSocket');
    
    this.options.reconnectOnClose = false;
    this.stopHeartbeat();
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
  }

  /**
   * Send message to server
   */
  public send(message: Partial<WebSocketMessage>): void {
    const fullMessage: WebSocketMessage = {
      type: message.type || 'error',
      data: message.data || {},
      timestamp: Date.now(),
    };

    if (this.isConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(fullMessage));
      } catch (error) {
        logger.error('Failed to send WebSocket message:', error);
        this.queueMessage(fullMessage);
      }
    } else {
      this.queueMessage(fullMessage);
    }
  }

  /**
   * Send ping to server
   */
  public ping(): void {
    this.send({ type: 'ping', data: {} });
  }

  /**
   * Request current metrics
   */
  public requestMetrics(): void {
    this.send({ type: 'get_metrics', data: {} });
  }

  /**
   * Request current alerts
   */
  public requestAlerts(): void {
    this.send({ type: 'get_alerts', data: {} });
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): void {
    this.send({ type: 'resolve_alert', data: { alertId } });
  }

  /**
   * Clear all data
   */
  public clearData(): void {
    this.send({ type: 'clear_data', data: {} });
  }

  /**
   * Get connection status
   */
  public getStatus(): {
    isConnected: boolean;
    isConnecting: boolean;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.url && newConfig.url !== this.config.url) {
      // Reconnect with new URL
      this.disconnect();
      this.connect();
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    logger.debug(`📨 WebSocket message received: ${message.type}`);
    
    switch (message.type) {
      case 'metrics':
        this.options.onMessage?.(message);
        break;
      case 'alert':
        this.options.onMessage?.(message);
        break;
      case 'alert_resolved':
        this.options.onMessage?.(message);
        break;
      case 'pong':
        // Heartbeat response
        break;
      case 'error':
        logger.error('Server error:', message.data);
        break;
      default:
        logger.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.info(`🔄 Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect().catch(error => {
        logger.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.ping();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message);
    
    // Keep only last 100 messages
    if (this.messageQueue.length > 100) {
      this.messageQueue = this.messageQueue.slice(-100);
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) {
      return;
    }

    logger.info(`📤 Flushing ${this.messageQueue.length} queued messages`);
    
    this.messageQueue.forEach(message => {
      try {
        this.ws?.send(JSON.stringify(message));
      } catch (error) {
        logger.error('Failed to send queued message:', error);
      }
    });
    
    this.messageQueue = [];
  }

  /**
   * Destroy client
   */
  public destroy(): void {
    this.disconnect();
    this.clearReconnectTimer();
    this.stopHeartbeat();
    this.messageQueue = [];
  }
}

export default WebSocketClient;
