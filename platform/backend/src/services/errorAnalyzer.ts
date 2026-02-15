import axios from 'axios';
import logger from '../utils/logger';

interface ValidationError {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  location: string;
  description: string;
  impact?: string;
}

interface ErrorAnalysisInput {
  migrationPlan: any;
  validationErrors: ValidationError[];
  generatedCodeIssues: string[];
  previousAttempts: number;
  previousAdjustments?: any[];
}

interface PromptAdjustments {
  additions: string[];
  emphasis: string[];
}

interface ErrorAnalysisResult {
  analysis: {
    summary: string;
    criticalIssues: Array<{
      category: string;
      description: string;
      impact: string;
      rootCause: string;
    }>;
  };
  adjustments: {
    serviceGeneratorPrompt: PromptAdjustments;
    frontendMigratorPrompt: PromptAdjustments;
    migrationPlanAdjustments: {
      services: Array<{ name: string; adjustments: string[] }>;
      microFrontends: Array<{ name: string; adjustments: string[] }>;
    };
  };
  retryStrategy: {
    shouldRetry: boolean;
    confidence: number;
    estimatedSuccessRate: 'High' | 'Medium' | 'Low';
    specificFixes: string[];
  };
}

class ErrorAnalyzerService {
  private arkApiUrl: string;
  private arkNamespace: string;
  private agentName = 'error-analyzer';

  constructor() {
    this.arkApiUrl = process.env.ARK_API_URL || 'http://localhost:8080';
    this.arkNamespace = process.env.ARK_NAMESPACE || 'default';

    logger.info('Error Analyzer Service initialized', {
      arkUrl: this.arkApiUrl,
      namespace: this.arkNamespace,
      agent: this.agentName
    });
  }

  /**
   * Extract critical errors from validator reports
   */
  extractCriticalErrors(validatorOutputs: any): ValidationError[] {
    const errors: ValidationError[] = [];

    try {
      // Parse validator outputs (they should be JSON or markdown with error tables)
      for (const output of validatorOutputs) {
        if (!output || !output.content) continue;

        // Try to parse as JSON first
        try {
          const parsed = typeof output.content === 'string'
            ? JSON.parse(output.content)
            : output.content;

          // Look for errors array
          if (parsed.errors && Array.isArray(parsed.errors)) {
            errors.push(...parsed.errors.filter((e: any) =>
              e.severity === 'CRITICAL' || e.severity === 'HIGH'
            ));
          }

          // Look for error report section
          if (parsed.errorReport && Array.isArray(parsed.errorReport)) {
            errors.push(...parsed.errorReport.filter((e: any) =>
              e.severity === 'CRITICAL' || e.severity === 'HIGH'
            ));
          }
        } catch (jsonError) {
          // If not JSON, try to extract from markdown
          const content = output.content;

          // Look for error tables in markdown
          const errorPattern = /\|\s*(ERR-\w+-\d+)\s*\|\s*(CRITICAL|HIGH)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/gi;
          let match;

          while ((match = errorPattern.exec(content)) !== null) {
            errors.push({
              id: match[1],
              severity: match[2] as 'CRITICAL' | 'HIGH',
              category: match[3].trim(),
              location: match[4].trim(),
              description: match[5].trim()
            });
          }

          // Look for error sections
          const criticalSection = content.match(/## Error Report[\s\S]*?(?=##|$)/i);
          if (criticalSection) {
            // Extract error descriptions
            const errorLines = criticalSection[0].split('\n').filter((line: string) =>
              line.includes('CRITICAL') || line.includes('HIGH')
            );

            errorLines.forEach((line: string, index: number) => {
              errors.push({
                id: `ERR-${index + 1}`,
                severity: line.includes('CRITICAL') ? 'CRITICAL' : 'HIGH',
                category: 'Unknown',
                location: 'Unknown',
                description: line.trim()
              });
            });
          }
        }
      }
    } catch (error: any) {
      logger.error('Failed to extract critical errors:', error);
    }

    logger.info(`Extracted ${errors.length} critical/high severity errors`);
    return errors;
  }

  /**
   * Analyze errors and get retry suggestions from ARK error-analyzer agent
   */
  async analyzeErrors(input: ErrorAnalysisInput): Promise<ErrorAnalysisResult | null> {
    try {
      logger.info('Analyzing errors with ARK error-analyzer agent', {
        criticalErrors: input.validationErrors.length,
        previousAttempts: input.previousAttempts
      });

      // Prepare prompt for error-analyzer agent
      const analysisPrompt = this.buildAnalysisPrompt(input);

      // Call ARK error-analyzer agent
      const response = await axios.post(
        `${this.arkApiUrl}/openai/v1/chat/completions`,
        {
          model: `agent/${this.agentName}`,
          messages: [
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.3, // Low temperature for more deterministic analysis
          max_tokens: 4000
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 120000 // 2 minutes
        }
      );

      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response from ARK error-analyzer agent');
      }

      const content = response.data.choices[0].message.content;

      // Parse JSON response
      const result = this.parseAnalysisResult(content);

      logger.info('Error analysis complete', {
        shouldRetry: result.retryStrategy.shouldRetry,
        confidence: result.retryStrategy.confidence,
        criticalIssues: result.analysis.criticalIssues.length
      });

      return result;

    } catch (error: any) {
      logger.error('Error analysis failed:', {
        error: error.message,
        agent: this.agentName
      });

      // Return fallback analysis if ARK fails
      return this.generateFallbackAnalysis(input);
    }
  }

  /**
   * Build analysis prompt for error-analyzer agent
   */
  private buildAnalysisPrompt(input: ErrorAnalysisInput): string {
    const { migrationPlan, validationErrors, generatedCodeIssues, previousAttempts, previousAdjustments } = input;

    return `
## ERROR ANALYSIS REQUEST

### Migration Context
- **Target Services**: ${migrationPlan.microservices?.length || 0} microservices
- **Target Frontend**: ${migrationPlan.microFrontends?.length || 0} micro-frontends
- **Attempt Number**: ${previousAttempts + 1}
${previousAttempts > 0 ? `- **Previous Adjustments**: ${JSON.stringify(previousAdjustments, null, 2)}` : ''}

### Services to Generate
${migrationPlan.microservices?.map((s: any) => `- ${s.name} (${s.entities?.join(', ') || 'N/A'})`).join('\n') || 'None'}

### Micro-Frontends to Generate
${migrationPlan.microFrontends?.map((m: any) => `- ${m.name}`).join('\n') || 'None'}

### Critical Validation Errors (${validationErrors.length})
${validationErrors.slice(0, 20).map(e => `
**${e.id}** - ${e.severity}
- **Category**: ${e.category}
- **Location**: ${e.location}
- **Description**: ${e.description}
${e.impact ? `- **Impact**: ${e.impact}` : ''}
`).join('\n')}

${validationErrors.length > 20 ? `\n(... and ${validationErrors.length - 20} more errors)` : ''}

### Code Generation Issues
${generatedCodeIssues.length > 0 ? generatedCodeIssues.join('\n') : 'None reported'}

---

**TASK**: Analyze these errors and provide:
1. Root cause analysis
2. Specific prompt adjustments for service-generator and frontend-migrator
3. Retry strategy with confidence score

**Return your analysis in the JSON format specified in your agent prompt.**
    `.trim();
  }

  /**
   * Parse analysis result from agent response
   */
  private parseAnalysisResult(content: string): ErrorAnalysisResult {
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;

      const result = JSON.parse(jsonString);

      // Validate required fields
      if (!result.analysis || !result.adjustments || !result.retryStrategy) {
        throw new Error('Missing required fields in analysis result');
      }

      return result;
    } catch (error: any) {
      logger.error('Failed to parse analysis result:', error);
      throw new Error(`Invalid JSON from error-analyzer: ${error.message}`);
    }
  }

  /**
   * Generate fallback analysis if ARK is unavailable
   */
  private generateFallbackAnalysis(input: ErrorAnalysisInput): ErrorAnalysisResult {
    logger.warn('Generating fallback error analysis');

    return {
      analysis: {
        summary: `Found ${input.validationErrors.length} critical errors requiring attention`,
        criticalIssues: input.validationErrors.slice(0, 5).map(e => ({
          category: e.category,
          description: e.description,
          impact: e.impact || 'Unknown impact',
          rootCause: 'Analysis unavailable - ARK error-analyzer agent not responding'
        }))
      },
      adjustments: {
        serviceGeneratorPrompt: {
          additions: [
            'Ensure all required dependencies are included in pom.xml',
            'Add proper error handling and validation',
            'Include complete configuration files (application.yml, application-docker.yml)'
          ],
          emphasis: [
            'CRITICAL: Generate complete, compilable code with NO placeholders',
            'CRITICAL: Include ALL required Spring Boot dependencies'
          ]
        },
        frontendMigratorPrompt: {
          additions: [
            'Ensure webpack Module Federation configuration is complete',
            'Include all required Angular dependencies',
            'Add proper routing and service integration'
          ],
          emphasis: [
            'CRITICAL: Generate complete Angular configuration',
            'CRITICAL: Ensure remoteEntry.js paths are correct'
          ]
        },
        migrationPlanAdjustments: {
          services: [],
          microFrontends: []
        }
      },
      retryStrategy: {
        shouldRetry: input.previousAttempts < 2, // Max 3 attempts
        confidence: 0.5, // Low confidence for fallback
        estimatedSuccessRate: 'Low',
        specificFixes: [
          'Review and fix missing dependencies',
          'Ensure all configuration files are complete',
          'Verify database and API configurations'
        ]
      }
    };
  }

  /**
   * Check if migration has critical issues that need retry
   */
  hasCriticalIssues(validatorOutputs: any): boolean {
    const errors = this.extractCriticalErrors(validatorOutputs);
    return errors.length > 0;
  }
}

export default new ErrorAnalyzerService();
