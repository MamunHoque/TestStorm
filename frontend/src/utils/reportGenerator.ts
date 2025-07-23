// Report generation utilities for load test results

interface TestResult {
  id: string;
  name: string;
  url: string;
  method: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  virtualUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  status: 'completed' | 'failed' | 'stopped';
  tags?: string[];
}

interface MetricsData {
  timestamp: number;
  requestsPerSecond: number;
  errorRate: number;
  avgResponseTime: number;
  p50ResponseTime: number;
  p90ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  activeUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

export class ReportGenerator {
  static generateCSV(results: TestResult[]): string {
    if (results.length === 0) return '';

    const headers = [
      'ID',
      'Name',
      'URL',
      'Method',
      'Start Time',
      'End Time',
      'Duration (ms)',
      'Virtual Users',
      'Total Requests',
      'Successful Requests',
      'Failed Requests',
      'Avg Response Time (ms)',
      'Max Response Time (ms)',
      'Requests Per Second',
      'Error Rate (%)',
      'Status',
      'Tags'
    ];

    const csvRows = results.map(result => [
      result.id,
      `"${result.name}"`,
      `"${result.url}"`,
      result.method,
      result.startTime.toISOString(),
      result.endTime.toISOString(),
      result.duration,
      result.virtualUsers,
      result.totalRequests,
      result.successfulRequests,
      result.failedRequests,
      result.avgResponseTime.toFixed(2),
      result.maxResponseTime.toFixed(2),
      result.requestsPerSecond.toFixed(2),
      (result.errorRate * 100).toFixed(2),
      result.status,
      `"${(result.tags || []).join(', ')}"`
    ]);

    return [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  }

  static generateJSON(results: TestResult[]): string {
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalResults: results.length,
        version: '1.0.0',
        generator: 'API Load Testing & Monitoring SPA'
      },
      summary: this.generateSummary(results),
      results: results
    };

    return JSON.stringify(report, null, 2);
  }

  static generatePDFContent(results: TestResult[]): string {
    const summary = this.generateSummary(results);
    
    let content = `
# Load Test Results Report

**Generated:** ${new Date().toLocaleString()}  
**Total Tests:** ${results.length}  
**Report Version:** 1.0.0  

---

## Executive Summary

### Overall Statistics
- **Total Tests Executed:** ${summary.totalTests}
- **Successful Tests:** ${summary.successfulTests}
- **Failed Tests:** ${summary.failedTests}
- **Average Success Rate:** ${(summary.avgSuccessRate * 100).toFixed(1)}%
- **Total Requests Processed:** ${summary.totalRequests.toLocaleString()}
- **Average Response Time:** ${summary.avgResponseTime.toFixed(0)}ms

### Performance Metrics
- **Best Response Time:** ${summary.bestResponseTime.toFixed(0)}ms
- **Worst Response Time:** ${summary.worstResponseTime.toFixed(0)}ms
- **Highest Throughput:** ${summary.highestThroughput.toFixed(0)} req/s
- **Lowest Error Rate:** ${(summary.lowestErrorRate * 100).toFixed(2)}%
- **Highest Error Rate:** ${(summary.highestErrorRate * 100).toFixed(2)}%

---

## Detailed Test Results

`;

    results.forEach((result, index) => {
      content += `
### ${index + 1}. ${result.name}

**Test Configuration:**
- **URL:** ${result.url}
- **Method:** ${result.method}
- **Virtual Users:** ${result.virtualUsers}
- **Duration:** ${this.formatDuration(result.duration)}
- **Status:** ${result.status.toUpperCase()}

**Performance Metrics:**
- **Total Requests:** ${result.totalRequests.toLocaleString()}
- **Successful Requests:** ${result.successfulRequests.toLocaleString()}
- **Failed Requests:** ${result.failedRequests.toLocaleString()}
- **Success Rate:** ${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%
- **Average Response Time:** ${result.avgResponseTime.toFixed(0)}ms
- **Maximum Response Time:** ${result.maxResponseTime.toFixed(0)}ms
- **Throughput:** ${result.requestsPerSecond.toFixed(1)} requests/second
- **Error Rate:** ${(result.errorRate * 100).toFixed(2)}%

**Timeline:**
- **Started:** ${result.startTime.toLocaleString()}
- **Completed:** ${result.endTime.toLocaleString()}
- **Duration:** ${this.formatDuration(result.duration)}

${result.tags && result.tags.length > 0 ? `**Tags:** ${result.tags.join(', ')}` : ''}

---
`;
    });

    content += `
## Recommendations

Based on the test results analysis:

### Performance Optimization
- Monitor endpoints with response times > 1000ms
- Investigate error rates > 5%
- Consider caching for frequently accessed endpoints
- Optimize database queries for slow responses

### Capacity Planning
- Current peak throughput: ${summary.highestThroughput.toFixed(0)} req/s
- Recommended monitoring thresholds:
  - Response Time: < 500ms (P95)
  - Error Rate: < 1%
  - Throughput: > ${(summary.avgThroughput * 0.8).toFixed(0)} req/s

### Next Steps
1. Address high error rate endpoints
2. Implement performance monitoring alerts
3. Schedule regular load testing
4. Review and optimize slow endpoints

---

*Report generated by API Load Testing & Monitoring SPA v1.0.0*
`;

    return content;
  }

  private static generateSummary(results: TestResult[]) {
    if (results.length === 0) {
      return {
        totalTests: 0,
        successfulTests: 0,
        failedTests: 0,
        avgSuccessRate: 0,
        totalRequests: 0,
        avgResponseTime: 0,
        bestResponseTime: 0,
        worstResponseTime: 0,
        highestThroughput: 0,
        avgThroughput: 0,
        lowestErrorRate: 0,
        highestErrorRate: 0,
      };
    }

    const totalTests = results.length;
    const successfulTests = results.filter(r => r.status === 'completed').length;
    const failedTests = totalTests - successfulTests;
    
    const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalSuccessful = results.reduce((sum, r) => sum + r.successfulRequests, 0);
    const avgSuccessRate = totalSuccessful / totalRequests;
    
    const avgResponseTime = results.reduce((sum, r) => sum + r.avgResponseTime, 0) / totalTests;
    const bestResponseTime = Math.min(...results.map(r => r.avgResponseTime));
    const worstResponseTime = Math.max(...results.map(r => r.maxResponseTime));
    
    const highestThroughput = Math.max(...results.map(r => r.requestsPerSecond));
    const avgThroughput = results.reduce((sum, r) => sum + r.requestsPerSecond, 0) / totalTests;
    
    const lowestErrorRate = Math.min(...results.map(r => r.errorRate));
    const highestErrorRate = Math.max(...results.map(r => r.errorRate));

    return {
      totalTests,
      successfulTests,
      failedTests,
      avgSuccessRate,
      totalRequests,
      avgResponseTime,
      bestResponseTime,
      worstResponseTime,
      highestThroughput,
      avgThroughput,
      lowestErrorRate,
      highestErrorRate,
    };
  }

  private static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  static async downloadReport(
    results: TestResult[], 
    format: 'csv' | 'json' | 'pdf', 
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    onProgress?.(10);

    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case 'csv':
        content = this.generateCSV(results);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case 'json':
        content = this.generateJSON(results);
        mimeType = 'application/json';
        extension = 'json';
        break;
      case 'pdf':
        content = this.generatePDFContent(results);
        mimeType = 'text/plain'; // Simple text for now, could be enhanced with actual PDF generation
        extension = 'txt'; // Would be 'pdf' with proper PDF library
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    onProgress?.(50);

    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    onProgress?.(80);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onProgress?.(100);
  }
}