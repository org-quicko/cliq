import { Logger } from '@nestjs/common';

export class ConnectionMonitor {
  private logger = new Logger(ConnectionMonitor.name);
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnected = true;
  private lastHeartbeat = Date.now();
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    private response: any,
    private onDisconnect?: () => void
  ) {}

  startHeartbeat(intervalMs: number = 1000) {
    this.logger.debug('Starting ultra-aggressive connection heartbeat');
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && !this.response.writableEnded) {
        try {
          // Send frequent heartbeat with timestamp to prevent timeouts
          const timestamp = new Date().toISOString();
          this.response.write(`# Heartbeat - ${timestamp} - Connection alive\n`);
          this.lastHeartbeat = Date.now();
          this.logger.debug('Aggressive heartbeat sent');
        } catch (err) {
          this.logger.warn('Heartbeat failed, connection may be lost');
          this.handleDisconnection();
        }
      }
    }, intervalMs);

    // Start connection monitoring
    this.startConnectionMonitoring();
  }

  private startConnectionMonitoring() {
    this.connectionCheckInterval = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
      
      // If no heartbeat for 5 seconds, consider connection lost (ultra-aggressive monitoring)
      if (timeSinceLastHeartbeat > 5000) {
        this.logger.warn('No heartbeat for 5 seconds, connection may be lost');
        this.handleDisconnection();
      }
    }, 1000); // Check every 1 second for ultra-fast detection
  }

  private handleDisconnection() {
    if (this.isConnected) {
      this.isConnected = false;
      this.logger.warn('Connection lost, stopping heartbeat');
      
      if (this.onDisconnect) {
        this.onDisconnect();
      }
    }
  }

  stopHeartbeat() {
    this.logger.debug('Stopping connection heartbeat');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  isConnectionAlive(): boolean {
    return this.isConnected && !this.response.writableEnded;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      lastHeartbeat: this.lastHeartbeat,
      timeSinceLastHeartbeat: Date.now() - this.lastHeartbeat,
      responseEnded: this.response.writableEnded
    };
  }
}
