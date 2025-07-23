// Base repository class with common CRUD operations
import { Database } from './database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected db: Database;
  protected tableName: string;

  constructor(db: Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  // Generate new UUID
  protected generateId(): string {
    return uuidv4();
  }

  // Convert database row to entity
  protected abstract mapRowToEntity(row: any): T;

  // Convert entity to database row
  protected abstract mapEntityToRow(entity: Partial<T>): any;

  // Create a new entity
  async create(entity: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    try {
      const id = this.generateId();
      const now = new Date();
      
      const fullEntity = {
        ...entity,
        id,
        created_at: now,
        updated_at: now,
      } as T;

      const row = this.mapEntityToRow(fullEntity);
      const columns = Object.keys(row).join(', ');
      const placeholders = Object.keys(row).map(() => '?').join(', ');
      const values = Object.values(row);

      const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
      await this.db.run(sql, values);

      logger.info(`Created ${this.tableName} with id: ${id}`);
      return fullEntity;
    } catch (error) {
      logger.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }

  // Find entity by ID
  async findById(id: string): Promise<T | null> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const row = await this.db.get(sql, [id]);
      
      if (!row) {
        return null;
      }

      return this.mapRowToEntity(row);
    } catch (error) {
      logger.error(`Error finding ${this.tableName} by id ${id}:`, error);
      throw error;
    }
  }

  // Find all entities with optional pagination
  async findAll(options?: PaginationOptions): Promise<PaginatedResult<T>> {
    try {
      const { page = 1, limit = 25, sortBy = 'created_at', sortOrder = 'DESC' } = options || {};
      const offset = (page - 1) * limit;

      // Get total count
      const countSql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
      const countResult = await this.db.get(countSql);
      const total = countResult.total;

      // Get paginated data
      const dataSql = `
        SELECT * FROM ${this.tableName} 
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;
      const rows = await this.db.all(dataSql, [limit, offset]);

      const data = rows.map(row => this.mapRowToEntity(row));
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error(`Error finding all ${this.tableName}:`, error);
      throw error;
    }
  }

  // Update entity by ID
  async update(id: string, updates: Partial<Omit<T, 'id' | 'created_at'>>): Promise<T | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const updatedEntity = {
        ...existing,
        ...updates,
        updated_at: new Date(),
      };

      const row = this.mapEntityToRow(updatedEntity);
      const setClause = Object.keys(row)
        .filter(key => key !== 'id' && key !== 'created_at')
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = Object.keys(row)
        .filter(key => key !== 'id' && key !== 'created_at')
        .map(key => row[key]);

      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
      await this.db.run(sql, [...values, id]);

      logger.info(`Updated ${this.tableName} with id: ${id}`);
      return updatedEntity;
    } catch (error) {
      logger.error(`Error updating ${this.tableName} with id ${id}:`, error);
      throw error;
    }
  }

  // Delete entity by ID
  async delete(id: string): Promise<boolean> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const result = await this.db.run(sql, [id]);
      
      const deleted = result.changes > 0;
      if (deleted) {
        logger.info(`Deleted ${this.tableName} with id: ${id}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error(`Error deleting ${this.tableName} with id ${id}:`, error);
      throw error;
    }
  }

  // Check if entity exists
  async exists(id: string): Promise<boolean> {
    try {
      const sql = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
      const result = await this.db.get(sql, [id]);
      return !!result;
    } catch (error) {
      logger.error(`Error checking existence of ${this.tableName} with id ${id}:`, error);
      throw error;
    }
  }

  // Count entities
  async count(whereClause?: string, params?: any[]): Promise<number> {
    try {
      const sql = whereClause 
        ? `SELECT COUNT(*) as total FROM ${this.tableName} WHERE ${whereClause}`
        : `SELECT COUNT(*) as total FROM ${this.tableName}`;
      
      const result = await this.db.get(sql, params);
      return result.total;
    } catch (error) {
      logger.error(`Error counting ${this.tableName}:`, error);
      throw error;
    }
  }

  // Find entities with custom WHERE clause
  async findWhere(
    whereClause: string, 
    params: any[], 
    options?: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    try {
      const { page = 1, limit = 25, sortBy = 'created_at', sortOrder = 'DESC' } = options || {};
      const offset = (page - 1) * limit;

      // Get total count
      const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE ${whereClause}`;
      const countResult = await this.db.get(countSql, params);
      const total = countResult.total;

      // Get paginated data
      const dataSql = `
        SELECT * FROM ${this.tableName} 
        WHERE ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;
      const rows = await this.db.all(dataSql, [...params, limit, offset]);

      const data = rows.map(row => this.mapRowToEntity(row));
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error(`Error finding ${this.tableName} with where clause:`, error);
      throw error;
    }
  }
}