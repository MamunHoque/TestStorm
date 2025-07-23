// Database connection and initialization
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

// Enable verbose mode for development
const sqlite = sqlite3.verbose();

export class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || process.env.DATABASE_PATH || './data/database.sqlite';
  }

  async connect(): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite.Database(this.dbPath);

      // Promisify database methods
      (this.db as any).run = promisify(this.db.run.bind(this.db));
      (this.db as any).get = promisify(this.db.get.bind(this.db));
      (this.db as any).all = promisify(this.db.all.bind(this.db));

      // Enable foreign keys
      await this.run('PRAGMA foreign_keys = ON');
      
      // Initialize schema
      await this.initializeSchema();
      
      logger.info(`Database connected: ${this.dbPath}`);
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      await new Promise<void>((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            logger.error('Database disconnect error:', err);
            reject(err);
          } else {
            logger.info('Database disconnected');
            resolve();
          }
        });
      });
      this.db = null;
    }
  }

  async run(sql: string, params?: any[]): Promise<sqlite3.RunResult> {
    if (!this.db) throw new Error('Database not connected');
    return (this.db.run as any)(sql, params);
  }

  async get<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not connected');
    return (this.db.get as any)(sql, params);
  }

  async all<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.db) throw new Error('Database not connected');
    return (this.db.all as any)(sql, params);
  }

  private async initializeSchema(): Promise<void> {
    const schema = `
      -- Test configurations table
      CREATE TABLE IF NOT EXISTS test_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('api', 'load')),
        description TEXT,
        config_data TEXT NOT NULL, -- JSON string
        tags TEXT, -- JSON array of strings
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Test executions table
      CREATE TABLE IF NOT EXISTS test_executions (
        id TEXT PRIMARY KEY,
        config_id TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('api', 'load')),
        status TEXT NOT NULL CHECK (status IN ('idle', 'running', 'completed', 'failed', 'stopped')),
        config_data TEXT NOT NULL, -- JSON string of test configuration
        started_at DATETIME,
        completed_at DATETIME,
        duration INTEGER, -- seconds
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (config_id) REFERENCES test_configs(id) ON DELETE SET NULL
      );

      -- Test results table
      CREATE TABLE IF NOT EXISTS test_results (
        id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        result_data TEXT NOT NULL, -- JSON string of results
        metrics_data TEXT NOT NULL, -- JSON string of metrics
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (execution_id) REFERENCES test_executions(id) ON DELETE CASCADE
      );

      -- Test logs table
      CREATE TABLE IF NOT EXISTS test_logs (
        id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
        message TEXT NOT NULL,
        method TEXT,
        url TEXT,
        status_code INTEGER,
        response_time INTEGER,
        user_id TEXT, -- virtual user ID for load tests
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (execution_id) REFERENCES test_executions(id) ON DELETE CASCADE
      );

      -- Test metrics time series table
      CREATE TABLE IF NOT EXISTS test_metrics (
        id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        metric_type TEXT NOT NULL, -- 'response_time', 'requests_per_second', etc.
        value REAL NOT NULL,
        metadata TEXT, -- JSON string for additional data
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (execution_id) REFERENCES test_executions(id) ON DELETE CASCADE
      );

      -- Generated reports table
      CREATE TABLE IF NOT EXISTS generated_reports (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        execution_ids TEXT NOT NULL, -- JSON array of execution IDs
        format TEXT NOT NULL CHECK (format IN ('json', 'csv', 'pdf')),
        file_path TEXT,
        file_size INTEGER,
        status TEXT NOT NULL CHECK (status IN ('generating', 'completed', 'failed')),
        config_data TEXT, -- JSON string of report configuration
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- User preferences table (for future use)
      CREATE TABLE IF NOT EXISTS user_preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        preferences TEXT NOT NULL, -- JSON string
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_test_executions_type ON test_executions(type);
      CREATE INDEX IF NOT EXISTS idx_test_executions_status ON test_executions(status);
      CREATE INDEX IF NOT EXISTS idx_test_executions_created_at ON test_executions(created_at);
      CREATE INDEX IF NOT EXISTS idx_test_logs_execution_id ON test_logs(execution_id);
      CREATE INDEX IF NOT EXISTS idx_test_logs_timestamp ON test_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_test_metrics_execution_id ON test_metrics(execution_id);
      CREATE INDEX IF NOT EXISTS idx_test_metrics_timestamp ON test_metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_test_configs_type ON test_configs(type);
      CREATE INDEX IF NOT EXISTS idx_test_configs_created_at ON test_configs(created_at);

      -- Triggers for updated_at timestamps
      CREATE TRIGGER IF NOT EXISTS update_test_configs_updated_at
        AFTER UPDATE ON test_configs
        BEGIN
          UPDATE test_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;

      CREATE TRIGGER IF NOT EXISTS update_test_executions_updated_at
        AFTER UPDATE ON test_executions
        BEGIN
          UPDATE test_executions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;

      CREATE TRIGGER IF NOT EXISTS update_generated_reports_updated_at
        AFTER UPDATE ON generated_reports
        BEGIN
          UPDATE generated_reports SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;

      CREATE TRIGGER IF NOT EXISTS update_user_preferences_updated_at
        AFTER UPDATE ON user_preferences
        BEGIN
          UPDATE user_preferences SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
    `;

    // Split schema by semicolons, but handle triggers properly
    const statements: string[] = [];
    let currentStatement = '';
    let inTrigger = false;

    const lines = schema.split('\n');
    for (const line of lines) {
      currentStatement += line + '\n';

      if (line.trim().toUpperCase().includes('CREATE TRIGGER')) {
        inTrigger = true;
      }

      if (line.trim() === 'END;' && inTrigger) {
        statements.push(currentStatement.trim());
        currentStatement = '';
        inTrigger = false;
      } else if (line.trim().endsWith(';') && !inTrigger) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    for (const statement of statements) {
      if (statement.trim()) {
        await this.run(statement);
      }
    }

    logger.info('Database schema initialized');
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  // Get database info
  async getInfo(): Promise<any> {
    const tables = await this.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    const info = {
      path: this.dbPath,
      tables: tables.map(t => t.name),
      version: await this.get('SELECT sqlite_version() as version'),
    };

    return info;
  }
}

// Singleton instance
let dbInstance: Database | null = null;

export function getDatabase(): Database {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
}

export async function initializeDatabase(): Promise<Database> {
  const db = getDatabase();
  await db.connect();
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.disconnect();
    dbInstance = null;
  }
}