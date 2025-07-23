// Repository for test configurations
import { BaseRepository, PaginatedResult } from './BaseRepository';
import { Database } from './database';

export interface TestConfig {
  id: string;
  name: string;
  type: 'api' | 'load';
  description?: string;
  config_data: any; // JSON object
  tags: string[];
  is_favorite: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TestConfigFilter {
  type?: 'api' | 'load';
  tags?: string[];
  is_favorite?: boolean;
  search?: string;
}

export class TestConfigRepository extends BaseRepository<TestConfig> {
  constructor(db: Database) {
    super(db, 'test_configs');
  }

  protected mapRowToEntity(row: any): TestConfig {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      config_data: JSON.parse(row.config_data),
      tags: row.tags ? JSON.parse(row.tags) : [],
      is_favorite: Boolean(row.is_favorite),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  protected mapEntityToRow(entity: Partial<TestConfig>): any {
    return {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      description: entity.description,
      config_data: JSON.stringify(entity.config_data),
      tags: JSON.stringify(entity.tags || []),
      is_favorite: entity.is_favorite ? 1 : 0,
      created_at: entity.created_at?.toISOString(),
      updated_at: entity.updated_at?.toISOString(),
    };
  }

  // Find configs with filters
  async findWithFilters(
    filters: TestConfigFilter,
    options?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }
  ): Promise<PaginatedResult<TestConfig>> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }

    if (filters.is_favorite !== undefined) {
      conditions.push('is_favorite = ?');
      params.push(filters.is_favorite ? 1 : 0);
    }

    if (filters.search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(() => 'tags LIKE ?').join(' OR ');
      conditions.push(`(${tagConditions})`);
      filters.tags.forEach(tag => params.push(`%"${tag}"%`));
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
    return this.findWhere(whereClause, params, options);
  }

  // Find by name
  async findByName(name: string): Promise<TestConfig | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE name = ?`;
      const row = await this.db.get(sql, [name]);
      return row ? this.mapRowToEntity(row) : null;
    } catch (error) {
      throw error;
    }
  }

  // Get favorites
  async getFavorites(type?: 'api' | 'load'): Promise<TestConfig[]> {
    try {
      let sql = `SELECT * FROM ${this.tableName} WHERE is_favorite = 1`;
      const params: any[] = [];

      if (type) {
        sql += ' AND type = ?';
        params.push(type);
      }

      sql += ' ORDER BY updated_at DESC';
      const rows = await this.db.all(sql, params);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      throw error;
    }
  }

  // Toggle favorite status
  async toggleFavorite(id: string): Promise<TestConfig | null> {
    try {
      const config = await this.findById(id);
      if (!config) return null;

      return this.update(id, { is_favorite: !config.is_favorite });
    } catch (error) {
      throw error;
    }
  }

  // Get configs by tags
  async findByTags(tags: string[]): Promise<TestConfig[]> {
    try {
      if (tags.length === 0) return [];

      const tagConditions = tags.map(() => 'tags LIKE ?').join(' OR ');
      const sql = `SELECT * FROM ${this.tableName} WHERE ${tagConditions} ORDER BY updated_at DESC`;
      const params = tags.map(tag => `%"${tag}"%`);

      const rows = await this.db.all(sql, params);
      return rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      throw error;
    }
  }

  // Get all unique tags
  async getAllTags(): Promise<string[]> {
    try {
      const sql = `SELECT DISTINCT tags FROM ${this.tableName} WHERE tags IS NOT NULL AND tags != '[]'`;
      const rows = await this.db.all(sql);
      
      const allTags = new Set<string>();
      rows.forEach(row => {
        if (row.tags) {
          const tags = JSON.parse(row.tags);
          tags.forEach((tag: string) => allTags.add(tag));
        }
      });

      return Array.from(allTags).sort();
    } catch (error) {
      throw error;
    }
  }
}