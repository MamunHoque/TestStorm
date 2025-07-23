// Repository for test logs
import { BaseRepository, PaginatedResult } from './BaseRepository';
import { Database } from './database';

export interface TestLog {
  id: string;
  execution_id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  method?: string;
  url?: string;
  status_code?: number;
  response_time?: number;
  user_id?: string; // virtual user ID for load tests
  created_at: Date;
}

export interface TestLogFilter {
  execution_id?: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
  method?: string;
  status_code?: number;
  user_id?: string;
  timestamp_range?: {
    start: Date;
    end: Date;
  };
}

export class TestLogRepository extends BaseRepository<TestLog> {
  constructor(db: Database) {
    super(db, 'test_logs');
  }

  protected mapRowToEntity(row: any): TestLog {
    return {
      id: row.id,
      execution_id: row.execution_id,
      timestamp: new Date(row.timestamp),
      level: row.level,
      message: row.message,
      method: row.method,
      url: row.url,
      status_code: row.status_code,
      response_time: row.response_time,
      user_id: row.user_id,
      created_at: new Date(row.created_at),
    };
  }

  protected mapEntityToRow(entity: Partial<TestLog>): any {
    return {
      id: entity.id,
      execution_id: entity.execution_id,
      timestamp: entity.timestamp?.toISOString(),
      level: entity.level,
      message: entity.message,
      method: entity.method,
      url: entity.url,
      status_code: entity.status_code,
      response_time: entity.response_time,
      user_id: entity.user_id,
      created_at: entity.created_at?.toISOString(),
    };
  }

  // Find logs with filters
  async findWithFilters(
    filters: TestLogFilter,
    options?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }
  ): Promise<PaginatedResult<TestLog>> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.execution_id) {
      conditions.push('execution_id = ?');
      params.push(filters.execution_id);
    }

    if (filters.level) {
      conditions.push('level = ?');
      params.push(filters.level);
    }

    if (filters.method) {
      conditions.push('method = ?');
      params.push(filters.method);
    }

    if (filters.status_code) {
      conditions.push('status_code = ?');
      params.push(filters.status_code);
    }

    if (filters.user_id) {
      conditions.push('user_id = ?');
      params.push(filters.user_id);
    }

    if (filters.timestamp_range) {
      conditions.push('timestamp BETWEEN ? AND ?');
      params.push(
        filters.timestamp_range.start.toISOString(),
        filters.timestamp_range.end.toISOString()
      );
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
    const defaultOptions = { sortBy: 'timestamp', sortOrder: 'ASC' as const, ...options };
    return this.findWhere(whereClause, params, defaultOptions);
  }

  // Get logs for execution
  async getLogsForExecution(
    executionId: string,
    options?: { page?: number; limit?: number; level?: string }
  ): Promise<PaginatedResult<TestLog>> {
    const filters: TestLogFilter = { execution_id: executionId };
    if (options?.level) {
      filters.level = options.level as any;
    }

    return this.findWithFilters(filters, {
      page: options?.page,
      limit: options?.limit,
      sortBy: 'timestamp',
      sortOrder: 'ASC',
    });
  }

  // Get error logs for execution
  async getErrorLogs(executionId: string): Promise<TestLog[]> {
    try {
      const sql = `
        SELECT * FROM ${this.tableName} 
        WHERE execution_id = ? AND level = 'error'
        ORDER BY timestamp ASC
      `;
      const rows = await this.db.all(sql, [executionId]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      throw error;
    }
  }

  // Get log statistics for execution
  async getLogStats(executionId: string): Promise<any> {
    try {
      const sql = `
        SELECT 
          level,
          COUNT(*) as count,
          MIN(timestamp) as first_log,
          MAX(timestamp) as last_log
        FROM ${this.tableName} 
        WHERE execution_id = ?
        GROUP BY level
      `;
      const rows = await this.db.all(sql, [executionId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Bulk insert logs (for performance during load tests)
  async bulkInsert(logs: Omit<TestLog, 'id' | 'created_at'>[]): Promise<void> {
    try {
      if (logs.length === 0) return;

      const sql = `
        INSERT INTO ${this.tableName} 
        (id, execution_id, timestamp, level, message, method, url, status_code, response_time, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Use transaction for better performance
      await this.db.run('BEGIN TRANSACTION');

      try {
        for (const log of logs) {
          const id = this.generateId();
          const now = new Date();
          const row = this.mapEntityToRow({
            ...log,
            id,
            created_at: now,
          });

          await this.db.run(sql, [
            row.id,
            row.execution_id,
            row.timestamp,
            row.level,
            row.message,
            row.method,
            row.url,
            row.status_code,
            row.response_time,
            row.user_id,
            row.created_at,
          ]);
        }

        await this.db.run('COMMIT');
      } catch (error) {
        await this.db.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  // Delete logs by execution ID
  async deleteByExecutionId(executionId: string): Promise<number> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE execution_id = ?`;
      const result = await this.db.run(sql, [executionId]);
      return result.changes || 0;
    } catch (error) {
      throw error;
    }
  }

  // Clean up old logs
  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const sql = `DELETE FROM ${this.tableName} WHERE created_at < ?`;
      const result = await this.db.run(sql, [cutoffDate.toISOString()]);
      
      return result.changes || 0;
    } catch (error) {
      throw error;
    }
  }
}