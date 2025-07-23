// Load testing service using Artillery.js
import { spawn, ChildProcess } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as yaml from 'js-yaml';
import { LoadTestConfig } from '../types/loadTest';
import { getWebSocketService } from './WebSocketService';
import { logger } from '../utils/logger';

export interface LoadTestOptions {
  outputDir?: string;
  keepArtifacts?: boolean;
}

export class LoadTestService {
  private static instance: LoadTestService;
  private runningTests: Map<string, ChildProcess> = new Map();
  private testConfigs: Map<string, LoadTestConfig> = new Map();

  public static getInstance(): LoadTestService {
    if (!LoadTestService.instance) {
      LoadTestService.instance = new LoadTestService();
    }
    return LoadTestService.instance;
  }

  // Start a load test
  async startLoadTest(
    config: LoadTestConfig,
    options: LoadTestOptions = {}
  ): Promise<{ testId: string; execution: any }> {
    const testId = uuidv4();
    const { outputDir = './temp', keepArtifacts = false } = options;

    try {
      // Validate configuration
      this.validateConfig(config);

      // Store test configuration
      this.testConfigs.set(testId, config);

      // Create Artillery configuration
      const artilleryConfig = this.createArtilleryConfig(config, testId);
      const configPath = join(outputDir, `artillery-${testId}.yml`);

      // Ensure output directory exists
      if (!existsSync(outputDir)) {
        require('fs').mkdirSync(outputDir, { recursive: true });
      }

      // Write Artillery config file
      writeFileSync(configPath, artilleryConfig);

      // Create test execution record
      const execution = {
        id: testId,
        name: config.name || `Load Test ${testId}`,
        type: 'load' as const,
        status: 'running' as const,
        config_data: config,
        started_at: new Date(),
        metrics: {
          summary: {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            successRate: 0,
            averageResponseTime: 0,
            maxResponseTime: 0,
            minResponseTime: 0,
            requestsPerSecond: 0,
            bytesReceived: 0,
            bytesSent: 0,
          },
          timeSeries: [],
          percentiles: {
            p50: 0,
            p75: 0,
            p90: 0,
            p95: 0,
            p99: 0,
            p99_9: 0,
          },
          errors: [],
        },
        logs: [],
      };

      // Start Artillery process
      const artilleryProcess = this.spawnArtilleryProcess(configPath, testId, outputDir);
      this.runningTests.set(testId, artilleryProcess);

      // Set up process event handlers
      this.setupProcessHandlers(artilleryProcess, testId, configPath, keepArtifacts);

      // Broadcast test start
      const wsService = getWebSocketService();
      wsService.broadcastStatusUpdate({
        testId,
        status: 'running',
        message: 'Load test started',
        timestamp: new Date(),
      });

      logger.info(`Load test started: ${testId}`);
      return { testId, execution };

    } catch (error: any) {
      logger.error(`Failed to start load test: ${error.message}`);
      
      // Broadcast error
      const wsService = getWebSocketService();
      wsService.broadcastStatusUpdate({
        testId,
        status: 'failed',
        error: error.message,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  // Stop a running load test
  async stopLoadTest(testId: string): Promise<boolean> {
    const process = this.runningTests.get(testId);
    
    if (!process) {
      logger.warn(`Attempted to stop non-existent test: ${testId}`);
      return false;
    }

    try {
      // Send SIGTERM to gracefully stop the process
      process.kill('SIGTERM');
      
      // If process doesn't stop within 5 seconds, force kill
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGKILL');
        }
      }, 5000);

      // Broadcast stop status
      const wsService = getWebSocketService();
      wsService.broadcastStatusUpdate({
        testId,
        status: 'stopped',
        message: 'Load test stopped by user',
        timestamp: new Date(),
      });

      logger.info(`Load test stopped: ${testId}`);
      return true;

    } catch (error: any) {
      logger.error(`Failed to stop load test ${testId}: ${error.message}`);
      return false;
    }
  }

  // Get status of a running test
  getTestStatus(testId: string): 'running' | 'stopped' | 'completed' | 'failed' | 'idle' {
    const process = this.runningTests.get(testId);
    
    if (!process) {
      return 'idle';
    }

    if (process.killed) {
      return 'stopped';
    }

    return 'running';
  }

  // Get list of running tests
  getRunningTests(): string[] {
    return Array.from(this.runningTests.keys());
  }

  // Validate load test configuration
  private validateConfig(config: LoadTestConfig): void {
    if (!config.target?.url) {
      throw new Error('Target URL is required');
    }

    if (!config.load?.virtualUsers || config.load.virtualUsers < 1) {
      throw new Error('Virtual users must be at least 1');
    }

    if (config.load.virtualUsers > 10000) {
      throw new Error('Virtual users cannot exceed 10,000');
    }

    if (!config.load?.duration || config.load.duration < 1) {
      throw new Error('Test duration must be at least 1 second');
    }

    if (config.load.duration > 3600) {
      throw new Error('Test duration cannot exceed 3600 seconds (1 hour)');
    }

    // Validate duration based on virtual users
    if (!this.validateTestDurationByUsers(config.load.virtualUsers, config.load.duration)) {
      throw new Error('Test duration too long for the number of virtual users');
    }
  }

  // Validate test duration based on virtual users
  private validateTestDurationByUsers(virtualUsers: number, duration: number): boolean {
    const maxDurationByUsers = [
      { userLimit: 1000, timeLimit: 3600 },   // 1 hour for up to 1k users
      { userLimit: 5000, timeLimit: 1800 },   // 30 min for up to 5k users
      { userLimit: 10000, timeLimit: 900 },   // 15 min for up to 10k users
    ];

    for (const { userLimit, timeLimit } of maxDurationByUsers) {
      if (virtualUsers <= userLimit) {
        return duration <= timeLimit;
      }
    }

    return false;
  }

  // Create Artillery configuration YAML
  private createArtilleryConfig(config: LoadTestConfig, _testId: string): string {
    const { target, load, authentication, options } = config;

    // Build Artillery config object
    const artilleryConfig = {
      config: {
        target: target.url,
        phases: [
          {
            duration: load.rampUpTime || 0,
            arrivalRate: Math.ceil(load.virtualUsers / (load.rampUpTime || 1)),
            name: 'Ramp up',
          },
          {
            duration: load.duration,
            arrivalRate: load.requestRate || Math.ceil(load.virtualUsers / 10),
            name: 'Sustained load',
          },
        ],
        timeout: options?.timeout || 30000,
        defaults: {
          headers: {
            ...target.headers,
            'User-Agent': 'Artillery Load Tester',
          },
        },
      },
      scenarios: [
        {
          name: 'Load test scenario',
          weight: 100,
          flow: [
            {
              [target.method.toLowerCase()]: {
                url: target.url,
                ...(target.body && { json: this.parseRequestBody(target.body) }),
                ...(Object.keys(target.headers).length > 0 && { headers: target.headers }),
              },
            },
          ],
        },
      ],
    };

    // Add authentication if configured
    if (authentication.type !== 'none') {
      this.addAuthenticationToConfig(artilleryConfig, authentication);
    }

    // Convert to YAML
    return yaml.dump(artilleryConfig, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
  }

  // Parse request body
  private parseRequestBody(body: string): any {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  // Add authentication to Artillery config
  private addAuthenticationToConfig(config: any, auth: any): void {
    switch (auth.type) {
      case 'bearer':
        config.config.defaults.headers['Authorization'] = `Bearer ${auth.token}`;
        break;
      case 'apikey':
        config.config.defaults.headers[auth.apiKeyHeader] = auth.apiKey;
        break;
      case 'basic':
        const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
        config.config.defaults.headers['Authorization'] = `Basic ${credentials}`;
        break;
    }
  }



  // Spawn Artillery process
  private spawnArtilleryProcess(configPath: string, testId: string, outputDir: string): ChildProcess {
    const outputFile = join(outputDir, `artillery-output-${testId}.json`);
    
    const args = [
      'run',
      '--output', outputFile,
      configPath,
    ];

    const childProcess = spawn('npx', ['artillery', ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'production' },
    });

    return childProcess;
  }

  // Set up process event handlers
  private setupProcessHandlers(
    process: ChildProcess,
    testId: string,
    configPath: string,
    keepArtifacts: boolean
  ): void {
    const wsService = getWebSocketService();

    process.stdout?.on('data', (data) => {
      const output = data.toString();
      logger.debug(`Artillery stdout [${testId}]: ${output}`);
      
      // Parse Artillery output for real-time metrics
      this.parseArtilleryOutput(output, testId);
    });

    process.stderr?.on('data', (data) => {
      const error = data.toString();
      logger.error(`Artillery stderr [${testId}]: ${error}`);
      
      wsService.broadcastLogEntry({
        testId,
        timestamp: new Date(),
        level: 'error',
        message: error.trim(),
      });
    });

    process.on('close', (code) => {
      logger.info(`Artillery process [${testId}] exited with code ${code}`);
      
      // Clean up
      this.runningTests.delete(testId);
      this.testConfigs.delete(testId);
      
      if (!keepArtifacts) {
        try {
          unlinkSync(configPath);
        } catch (error) {
          logger.warn(`Failed to clean up config file: ${configPath}`);
        }
      }

      // Broadcast completion
      const status = code === 0 ? 'completed' : 'failed';
      wsService.broadcastStatusUpdate({
        testId,
        status,
        message: `Test ${status} with exit code ${code}`,
        timestamp: new Date(),
      });

      if (status === 'completed') {
        wsService.broadcastTestComplete(testId, {
          exitCode: code,
          completedAt: new Date().toISOString(),
        });
      }
    });

    process.on('error', (error) => {
      logger.error(`Artillery process error [${testId}]: ${error.message}`);
      
      this.runningTests.delete(testId);
      this.testConfigs.delete(testId);
      
      wsService.broadcastStatusUpdate({
        testId,
        status: 'failed',
        error: error.message,
        timestamp: new Date(),
      });
    });
  }

  // Parse Artillery output for real-time metrics
  private parseArtilleryOutput(output: string, testId: string): void {
    const wsService = getWebSocketService();
    
    // This is a simplified parser - in production, you'd want more robust parsing
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('Summary report')) {
        // Parse summary metrics
        // TODO: Implement detailed Artillery output parsing
        
        wsService.broadcastMetricsUpdate({
          testId,
          timestamp: new Date(),
          currentUsers: 0, // Parse from Artillery output
          requestsPerSecond: 0,
          errorsPerSecond: 0,
          averageResponseTime: 0,
          p95ResponseTime: 0,
          successRate: 0,
          totalRequests: 0,
          elapsedTime: 0,
        });
      }
      
      if (line.includes('http.request_rate')) {
        // Parse request rate
        wsService.broadcastLogEntry({
          testId,
          timestamp: new Date(),
          level: 'info',
          message: line.trim(),
        });
      }
    }
  }
}