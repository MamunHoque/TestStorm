// Repository for test executions
import { BaseRepository, PaginatedResult } from './BaseRepository';
import { Database } from './database';

export interface TestExecution {
  id: string;
  config_id?: string;
  name: string;
  type: 'api' | 'load';
  status: 'idle' | 'running' | 'completed' | 'failed' | 'stopped';
  config_data: any; // JSON object
  started_at?: Date;
  completed_at?: Date;
  duration?: number; // seconds
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TestExecutionFilter {
  type?: 'api' | 'load';
  status?: 'idle' | 'running' | 'completed' | 'failed' | 'stopped';
  config_id?: string;
  date_range?: {
    start: Date;
    end: Date;
  };
}

export class TestExecutionRepository extends BaseRepository<TestExecution> {
  constructor(db: Database) {
    super(db, 'test_executions');
  }

  protected mapRowToEntity(row: any): TestExecution {
    return {
      id: row.id,
      config_id: row.config_id,
      name: row.name,
      type: row.type,
      status: row.status,
      config_data: JSON.parse(row.config_data),
      started_at: row.started_at ? new Date(row.started_at) : undefined,
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
      duration: row.duration,
      error_message: row.error_message,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  protected mapEntityToRow(entity: Partial<TestExecution>): any {
    return {
      id: entity.id,
      config_id: entity.config_id,
      name: entity.name,
      type: entity.type,
      status: entity.status,
      config_data: JSON.stringify(entity.config_data),
      started_at: entity.started_at?.toISOString(),
      completed_at: entity.completed_at?.toISOString(),
      duration: entity.duration,
      error_message: entity.error_message,
      created_at: entity.created_at?.toISOString(),
      updated_at: entity.updated_at?.toISOString(),
    };
  }

  // Find executions with filters
  async findWithFilters(
    filters: TestExecutionFilter,
    options?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }
  ): Promise<PaginatedResult<TestExecution>> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.config_id) {
      conditions.push('config_id = ?');
      params.push(filters.config_id);
    }

    if (filters.date_range) {
      conditions.push('created_at BETWEEN ? AND ?');
      params.push(filters.date_range.start.toISOString(), filters.date_range.end.toISOString());
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
    const defaultOptions = {
      page: options?.page || 1,
      limit: options?.limit || 25,
      sortBy: options?.sortBy || 'created_at',
      sortOrder: options?.sortOrder || 'DESC' as const
    };
    return this.findWhere(whereClause, params, defaultOptions);
  }

  // Update execution status
  async updateStatus(
    id: string, 
    status: TestExecution['status'], 
    error_message?: string
  ): Promise<TestExecution | null> {
    try {
      const updates: Partial<TestExecution> = { status };

      if (status === 'running' && !await this.hasStartTime(id)) {
        updates.started_at = new Date();
      }

      if (status === 'completed' || status === 'failed' || status === 'stopped') {
        const execution = await this.findById(id);
        if (execution && execution.started_at) {
          updates.completed_at = new Date();
          updates.duration = Math.floor((updates.completed_at.getTime() - execution.started_at.getTime()) / 1000);
        }
      }

      if (error_message) {
        updates.error_message = error_message;
      }

      return this.update(id, updates);
    } catch (error) {
      throw error;
    }
  }

  // Check if execution has start time
  private async hasStartTime(id: string): Promise<boolean> {
    try {
      const sql = `SELECT started_at FROM ${this.tableName} WHERE id = ?`;
      const result = await this.db.get(sql, [id]);
      return !!(result && result.started_at);
    } catch (error) {
      throw error;
    }
  }

  // Get running executions
  async getRunningExecutions(): Promise<TestExecution[]> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE status = 'running' ORDER BY started_at ASC`;
      const rows = await this.db.all(sql);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      throw error;
    }
  }

  // Get recent executions
  async getRecentExecutions(limit: number = 10): Promise<TestExecution[]> {
    try {
      const sql = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT ?`;
      const rows = await this.db.all(sql, [limit]);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      throw error;
    }
  }

  // Get execution statistics
  async getExecutionStats(days: number = 30): Promise<any> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const sql = `
        SELECT 
          type,
          status,
          COUNT(*) as count,
          AVG(duration) as avg_duration,
          MIN(duration) as min_duration,
          MAX(duration) as max_duration
        FROM ${this.tableName} 
        WHERE created_at >= ?
        GROUP BY type, status
      `;

      const rows = await this.db.all(sql, [since.toISOString()]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Clean up old executions
  async cleanupOldExecutions(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const sql = `DELETE FROM ${this.tableName} WHERE created_at < ? AND status IN ('completed', 'failed', 'stopped')`;
      const result = await this.db.run(sql, [cutoffDate.toISOString()]);
      
      return result.changes || 0;
    } catch (error) {
      throw error;
    }
  }
}