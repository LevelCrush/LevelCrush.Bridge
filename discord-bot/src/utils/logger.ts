import { config } from '../config/config.js';

export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
}

const logLevels: Record<LogLevel, number> = {
  [LogLevel.Debug]: 0,
  [LogLevel.Info]: 1,
  [LogLevel.Warn]: 2,
  [LogLevel.Error]: 3,
};

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = (config.logging.level as LogLevel) || LogLevel.Info;
  }

  private shouldLog(level: LogLevel): boolean {
    return logLevels[level] >= logLevels[this.level];
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    let formatted = `[${timestamp}] [${levelStr}] ${message}`;
    
    if (meta) {
      formatted += ` ${JSON.stringify(meta)}`;
    }
    
    return formatted;
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.Debug)) {
      console.debug(this.formatMessage(LogLevel.Debug, message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.Info)) {
      console.info(this.formatMessage(LogLevel.Info, message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.Warn)) {
      console.warn(this.formatMessage(LogLevel.Warn, message, meta));
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog(LogLevel.Error)) {
      const meta = error instanceof Error ? { 
        message: error.message, 
        stack: error.stack 
      } : error;
      console.error(this.formatMessage(LogLevel.Error, message, meta));
    }
  }
}

export const logger = new Logger();