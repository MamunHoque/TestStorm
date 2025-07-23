// Secure credential storage utility
// Note: In a production environment, consider using more secure storage methods
// like encrypted storage or secure key management services

interface StoredCredentials {
  bearerTokens: Record<string, string>;
  apiKeys: Record<string, { key: string; header: string }>;
  basicAuth: Record<string, { username: string; password: string }>;
}

const STORAGE_KEY = 'api-load-tester-credentials';
const STORAGE_VERSION = '1.0';

// Simple encryption/decryption using base64 (for demo purposes)
// In production, use proper encryption libraries
const encrypt = (data: string): string => {
  return btoa(encodeURIComponent(data));
};

const decrypt = (encryptedData: string): string => {
  try {
    return decodeURIComponent(atob(encryptedData));
  } catch {
    return '';
  }
};

export class CredentialStorage {
  private static getStorageData(): StoredCredentials {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return {
          bearerTokens: {},
          apiKeys: {},
          basicAuth: {},
        };
      }

      const decrypted = decrypt(stored);
      const parsed = JSON.parse(decrypted);
      
      // Validate storage version
      if (parsed.version !== STORAGE_VERSION) {
        console.warn('Credential storage version mismatch, clearing stored credentials');
        this.clearAll();
        return {
          bearerTokens: {},
          apiKeys: {},
          basicAuth: {},
        };
      }

      return parsed.data || {
        bearerTokens: {},
        apiKeys: {},
        basicAuth: {},
      };
    } catch (error) {
      console.error('Error reading stored credentials:', error);
      return {
        bearerTokens: {},
        apiKeys: {},
        basicAuth: {},
      };
    }
  }

  private static saveStorageData(data: StoredCredentials): void {
    try {
      const payload = {
        version: STORAGE_VERSION,
        data,
        timestamp: Date.now(),
      };
      
      const encrypted = encrypt(JSON.stringify(payload));
      localStorage.setItem(STORAGE_KEY, encrypted);
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  }

  // Bearer Token methods
  static saveBearerToken(url: string, token: string): void {
    if (!token.trim()) return;
    
    const data = this.getStorageData();
    const domain = this.extractDomain(url);
    data.bearerTokens[domain] = token;
    this.saveStorageData(data);
  }

  static getBearerToken(url: string): string | null {
    const data = this.getStorageData();
    const domain = this.extractDomain(url);
    return data.bearerTokens[domain] || null;
  }

  static getAllBearerTokens(): Record<string, string> {
    const data = this.getStorageData();
    return data.bearerTokens;
  }

  // API Key methods
  static saveApiKey(url: string, apiKey: string, header: string): void {
    if (!apiKey.trim() || !header.trim()) return;
    
    const data = this.getStorageData();
    const domain = this.extractDomain(url);
    data.apiKeys[domain] = { key: apiKey, header };
    this.saveStorageData(data);
  }

  static getApiKey(url: string): { key: string; header: string } | null {
    const data = this.getStorageData();
    const domain = this.extractDomain(url);
    return data.apiKeys[domain] || null;
  }

  static getAllApiKeys(): Record<string, { key: string; header: string }> {
    const data = this.getStorageData();
    return data.apiKeys;
  }

  // Basic Auth methods
  static saveBasicAuth(url: string, username: string, password: string): void {
    if (!username.trim() || !password.trim()) return;
    
    const data = this.getStorageData();
    const domain = this.extractDomain(url);
    data.basicAuth[domain] = { username, password };
    this.saveStorageData(data);
  }

  static getBasicAuth(url: string): { username: string; password: string } | null {
    const data = this.getStorageData();
    const domain = this.extractDomain(url);
    return data.basicAuth[domain] || null;
  }

  static getAllBasicAuth(): Record<string, { username: string; password: string }> {
    const data = this.getStorageData();
    return data.basicAuth;
  }

  // Utility methods
  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url; // Fallback to original URL if parsing fails
    }
  }

  static clearCredentialsForDomain(url: string): void {
    const data = this.getStorageData();
    const domain = this.extractDomain(url);
    
    delete data.bearerTokens[domain];
    delete data.apiKeys[domain];
    delete data.basicAuth[domain];
    
    this.saveStorageData(data);
  }

  static clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  static exportCredentials(): string {
    const data = this.getStorageData();
    return JSON.stringify(data, null, 2);
  }

  static importCredentials(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      
      // Validate structure
      if (
        typeof imported === 'object' &&
        imported.bearerTokens &&
        imported.apiKeys &&
        imported.basicAuth
      ) {
        this.saveStorageData(imported);
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  // Get suggested credentials for auto-fill
  static getSuggestedCredentials(url: string): {
    bearerToken?: string;
    apiKey?: { key: string; header: string };
    basicAuth?: { username: string; password: string };
  } {
    return {
      bearerToken: this.getBearerToken(url) || undefined,
      apiKey: this.getApiKey(url) || undefined,
      basicAuth: this.getBasicAuth(url) || undefined,
    };
  }
}