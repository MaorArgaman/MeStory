/**
 * Logger Utility
 * Provides configurable logging that can be disabled in production
 * BUG-055 FIX: Replace console.error with proper logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  prefix?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default configuration based on environment
const config: LoggerConfig = {
  enabled: import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGGING === 'true',
  minLevel: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'debug',
  prefix: '[MeStory]',
};

function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
}

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  return `${config.prefix} [${timestamp}] [${level.toUpperCase()}] ${message}`;
}

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message), ...args);
    }
  },

  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message), ...args);
    }
  },

  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message), ...args);
    }
  },

  error(message: string, ...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message), ...args);
    }
  },

  /**
   * Configure the logger at runtime
   */
  configure(newConfig: Partial<LoggerConfig>): void {
    Object.assign(config, newConfig);
  },

  /**
   * Disable all logging (useful for production)
   */
  disable(): void {
    config.enabled = false;
  },

  /**
   * Enable logging
   */
  enable(): void {
    config.enabled = true;
  },
};

export default logger;
