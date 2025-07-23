// Authentication and authorization types

export type AuthType = 'none' | 'bearer' | 'apikey' | 'basic';

export interface AuthConfig {
  type: AuthType;
  token?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  username?: string;
  password?: string;
}

export interface BearerTokenAuth {
  type: 'bearer';
  token: string;
}

export interface ApiKeyAuth {
  type: 'apikey';
  apiKey: string;
  apiKeyHeader: string; // e.g., 'X-API-Key', 'Authorization'
}

export interface BasicAuth {
  type: 'basic';
  username: string;
  password: string;
}

export interface NoAuth {
  type: 'none';
}

export type AuthenticationConfig = NoAuth | BearerTokenAuth | ApiKeyAuth | BasicAuth;

// User management types (for future enterprise features)
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

export type UserRole = 'admin' | 'team_lead' | 'developer' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: WorkspaceMember[];
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: string;
  role: UserRole;
  joinedAt: Date;
}

export interface WorkspaceSettings {
  maxVirtualUsers: number;
  maxTestDuration: number;
  allowedDomains?: string[];
  retentionDays: number;
}