// Repository for test results
import { BaseRepository } from './BaseRepository';
import { Database } from './database';

export interface TestResult {
  id: string;
  execution_id: string;
  result_data: any; // JSON object
  metrics_data: any; // JSON object
  created_at: Date;
  updated_at: Date;
}

export class TestResultRepository extends BaseRepository<TestResult> {
  constructor(db: Database) {
    super(db, 'test_results');
  }

  protected mapRowToEntity(row: any): TestResult {
    return {
      id: row.id,
      execution_id: row.execution_id,
      result_data: JSON.parse(row.result_data),
      metrics_data: JSON.parse(row.metrics_data),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  protected mapEntityToRow(entity: Partial<TestResult>): any {
    return {
      id: entity.id,
      execution_id: entity.execution_id,
      result_data: JSON.stringify(entity.result_data),
      metrics_data: JSON.stringify(entity.metrics_data),
      created_at: entity.created_at?.toISOString(),
    };
  }

  // Find result by execution ID
  async findByExecutionId(executionId: string): Promise<TestResult | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE execution_id = ?`;
      const row = await this.db.get(sql, [executionId]);
      return row ? this.mapRowToEntity(row) : null;
    } catch (error) {
      throw error;
    }
  }

  // Get results for multiple executions
  async findByExecutionIds(executionIds: string[]): Promise<TestResult[]> {
    try {
      if (executionIds.length === 0) return [];

      const placeholders = executionIds.map(() => '?').join(',');
      const sql = `SELECT * FROM ${this.tableName} WHERE execution_id IN (${placeholders}) ORDER BY created_at DESC`;
      const rows = await this.db.all(sql, executionIds);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      throw error;
    }
  }

  // Delete results by execution ID
  async deleteByExecutionId(executionId: string): Promise<boolean> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE execution_id = ?`;
      const result = await this.db.run(sql, [executionId]);
      return (result.changes || 0) > 0;
    } catch (error) {
      throw error;
    }
  }
}