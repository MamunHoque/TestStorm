import { z } from 'zod';

// GraphQL operation types
export const GraphQLOperationTypeSchema = z.enum(['query', 'mutation', 'subscription']);
export type GraphQLOperationType = z.infer<typeof GraphQLOperationTypeSchema>;

// GraphQL request schema and interface
export const GraphQLRequestSchema = z.object({
  operationType: GraphQLOperationTypeSchema,
  operationName: z.string().optional(),
  query: z.string().min(1, 'GraphQL query is required'),
  variables: z.record(z.string(), z.any()).optional(),
});
export interface GraphQLRequest extends z.infer<typeof GraphQLRequestSchema> {}

// GraphQL response schema and interface
export const GraphQLResponseSchema = z.object({
  data: z.record(z.string(), z.any()).nullable(),
  errors: z.array(
    z.object({
      message: z.string(),
      locations: z.array(
        z.object({
          line: z.number(),
          column: z.number(),
        })
      ).optional(),
      path: z.array(z.union([z.string(), z.number()])).optional(),
      extensions: z.record(z.string(), z.any()).optional(),
    })
  ).optional(),
  extensions: z.record(z.string(), z.any()).optional(),
});
export interface GraphQLResponse extends z.infer<typeof GraphQLResponseSchema> {}

// GraphQL validation utilities
export class GraphQLValidationUtils {
  // Validate GraphQL query syntax (basic validation)
  static validateGraphQLQuery(query: string): { isValid: boolean; error?: string } {
    // Basic validation - check for required keywords and balanced braces
    if (!query.trim()) {
      return { isValid: false, error: 'GraphQL query cannot be empty' };
    }

    // Check for query or mutation keyword
    const hasQueryKeyword = /query\s*(\w+)?\s*(\([^)]*\))?\s*\{/.test(query) || /\{\s*\w+/.test(query);
    const hasMutationKeyword = /mutation\s*(\w+)?\s*(\([^)]*\))?\s*\{/.test(query);
    
    if (!hasQueryKeyword && !hasMutationKeyword) {
      return { 
        isValid: false, 
        error: 'GraphQL query must start with "query" or "mutation" keyword or a selection set' 
      };
    }

    // Check for balanced braces
    let braceCount = 0;
    for (const char of query) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (braceCount < 0) {
        return { isValid: false, error: 'Unbalanced braces in GraphQL query' };
      }
    }

    if (braceCount !== 0) {
      return { isValid: false, error: 'Unbalanced braces in GraphQL query' };
    }

    return { isValid: true };
  }

  // Parse variables from JSON string
  static parseGraphQLVariables(variablesStr: string): { isValid: boolean; variables?: Record<string, any>; error?: string } {
    if (!variablesStr.trim()) {
      return { isValid: true, variables: {} };
    }

    try {
      const variables = JSON.parse(variablesStr);
      if (typeof variables !== 'object' || variables === null || Array.isArray(variables)) {
        return { 
          isValid: false, 
          error: 'GraphQL variables must be a JSON object' 
        };
      }
      return { isValid: true, variables };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Invalid JSON format for GraphQL variables' 
      };
    }
  }

  // Detect operation type from query string
  static detectOperationType(query: string): GraphQLOperationType {
    if (query.trim().startsWith('mutation')) {
      return 'mutation';
    } else if (query.trim().startsWith('subscription')) {
      return 'subscription';
    } else {
      return 'query'; // Default to query for both explicit "query" keyword and shorthand syntax
    }
  }

  // Extract operation name from query string
  static extractOperationName(query: string): string | undefined {
    // Match "query OperationName" or "mutation OperationName" patterns
    const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/);
    return match ? match[1] : undefined;
  }
}