// WebSocket service for real-time communication
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';

export interface LoadTestMetricsUpdate {
  testId: string;
  timestamp: Date;
  currentUsers: number;
  requestsPerSecond: number;
  errorsPerSecond: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  successRate: number;
  totalRequests: number;
  elapsedTime: number;
}

export interface LoadTestStatusUpdate {
  testId: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'stopped';
  message?: string;
  error?: string;
  timestamp: Date;
}

export interface LoadTestLogEntry {
  testId: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  userId?: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedClients: Map<string, Socket> = new Map();
  private testSubscriptions: Map<string, Set<string>> = new Map(); // testId -> Set of socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    logger.info('WebSocket service initialized');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, socket);

      // Handle client events
      socket.on('subscribe-test', (testId: string) => {
        this.subscribeToTest(socket.id, testId);
      });

      socket.on('unsubscribe-test', (testId: string) => {
        this.unsubscribeFromTest(socket.id, testId);
      });

      socket.on('get-test-status', (testId: string) => {
        this.sendTestStatus(socket.id, testId);
      });

      socket.on('disconnect', (reason: string) => {
        logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
        this.handleClientDisconnect(socket.id);
      });

      socket.on('error', (error: Error) => {
        logger.error(`Socket error for client ${socket.id}:`, error);
      });

      // Send initial connection confirmation
      socket.emit('connected', {
        socketId: socket.id,
        timestamp: new Date().toISOString(),
        message: 'Connected to load testing server'
      });
    });
  }

  // Subscribe client to test updates
  private subscribeToTest(socketId: string, testId: string): void {
    if (!this.testSubscriptions.has(testId)) {
      this.testSubscriptions.set(testId, new Set());
    }
    
    this.testSubscriptions.get(testId)!.add(socketId);
    
    const socket = this.connectedClients.get(socketId);
    if (socket) {
      socket.join(`test-${testId}`);
      socket.emit('subscribed', { testId, timestamp: new Date().toISOString() });
      logger.info(`Client ${socketId} subscribed to test ${testId}`);
    }
  }

  // Unsubscribe client from test updates
  private unsubscribeFromTest(socketId: string, testId: string): void {
    const subscribers = this.testSubscriptions.get(testId);
    if (subscribers) {
      subscribers.delete(socketId);
      if (subscribers.size === 0) {
        this.testSubscriptions.delete(testId);
      }
    }

    const socket = this.connectedClients.get(socketId);
    if (socket) {
      socket.leave(`test-${testId}`);
      socket.emit('unsubscribed', { testId, timestamp: new Date().toISOString() });
      logger.info(`Client ${socketId} unsubscribed from test ${testId}`);
    }
  }

  // Handle client disconnect
  private handleClientDisconnect(socketId: string): void {
    // Remove from all test subscriptions
    for (const [testId, subscribers] of this.testSubscriptions.entries()) {
      subscribers.delete(socketId);
      if (subscribers.size === 0) {
        this.testSubscriptions.delete(testId);
      }
    }

    this.connectedClients.delete(socketId);
  }

  // Send test status to specific client
  private async sendTestStatus(socketId: string, testId: string): Promise<void> {
    const socket = this.connectedClients.get(socketId);
    if (!socket) return;

    try {
      // TODO: Get actual test status from database/service
      const status: LoadTestStatusUpdate = {
        testId,
        status: 'idle', // This should come from actual test service
        timestamp: new Date(),
      };

      socket.emit('test-status', status);
    } catch (error) {
      logger.error(`Error sending test status for ${testId}:`, error);
      socket.emit('error', {
        message: 'Failed to get test status',
        testId,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Broadcast metrics update to all subscribers of a test
  public broadcastMetricsUpdate(metrics: LoadTestMetricsUpdate): void {
    const room = `test-${metrics.testId}`;
    this.io.to(room).emit('metrics-update', metrics);
    
    logger.debug(`Broadcasted metrics update for test ${metrics.testId} to room ${room}`);
  }

  // Broadcast status update to all subscribers of a test
  public broadcastStatusUpdate(status: LoadTestStatusUpdate): void {
    const room = `test-${status.testId}`;
    this.io.to(room).emit('status-update', status);
    
    logger.info(`Broadcasted status update for test ${status.testId}: ${status.status}`);
  }

  // Broadcast log entry to all subscribers of a test
  public broadcastLogEntry(logEntry: LoadTestLogEntry): void {
    const room = `test-${logEntry.testId}`;
    this.io.to(room).emit('log-entry', logEntry);
    
    if (logEntry.level === 'error') {
      logger.debug(`Broadcasted error log for test ${logEntry.testId}: ${logEntry.message}`);
    }
  }

  // Broadcast test completion
  public broadcastTestComplete(testId: string, summary: any): void {
    const room = `test-${testId}`;
    this.io.to(room).emit('test-complete', {
      testId,
      summary,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`Broadcasted test completion for test ${testId}`);
  }

  // Send message to specific client
  public sendToClient(socketId: string, event: string, data: any): void {
    const socket = this.connectedClients.get(socketId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  // Broadcast to all connected clients
  public broadcastToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  // Get connection statistics
  public getConnectionStats(): {
    connectedClients: number;
    activeTests: number;
    totalSubscriptions: number;
  } {
    let totalSubscriptions = 0;
    for (const subscribers of this.testSubscriptions.values()) {
      totalSubscriptions += subscribers.size;
    }

    return {
      connectedClients: this.connectedClients.size,
      activeTests: this.testSubscriptions.size,
      totalSubscriptions
    };
  }

  // Cleanup and shutdown
  public async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket service...');
    
    // Notify all clients about shutdown
    this.broadcastToAll('server-shutdown', {
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    });

    // Close all connections
    this.io.close();
    
    // Clear internal state
    this.connectedClients.clear();
    this.testSubscriptions.clear();
    
    logger.info('WebSocket service shutdown complete');
  }
}

// Singleton instance
let wsServiceInstance: WebSocketService | null = null;

export function initializeWebSocketService(server: HTTPServer): WebSocketService {
  if (!wsServiceInstance) {
    wsServiceInstance = new WebSocketService(server);
  }
  return wsServiceInstance;
}

export function getWebSocketService(): WebSocketService {
  if (!wsServiceInstance) {
    throw new Error('WebSocket service not initialized. Call initializeWebSocketService first.');
  }
  return wsServiceInstance;
}