import axios from 'axios';
import logger from '../utils/logger';

/**
 * Retry Planner Service - Uses ARK retry-planner agent
 * to analyze validation errors and generate improved migration plans
 */
class RetryPlannerService {
  private arkApiUrl: string;
  private agentName = 'retry-planner';

  constructor() {
    this.arkApiUrl = process.env.ARK_API_URL || 'http://localhost:8080';
    logger.info('Retry Planner Service initialized', {
      arkUrl: this.arkApiUrl,
      agent: this.agentName
    });
  }

  /**
   * Analyze validation errors and generate improved migration plan
   */
  async analyzeAndImprove(params: {
    originalMigrationPlan: any;
    unitTestReport: string;
    integrationTestReport: string;
    e2eTestReport: string;
    currentAttempt: number;
    maxRetries: number;
  }): Promise<{
    analysis: {
      totalErrors: number;
      criticalErrors: number;
      errorsByCategory: Record<string, number>;
      rootCauses: string[];
    };
    adjustedMigrationPlannerPrompt: string;  // NEW: Complete adjusted prompt for migration-planner
    improvementStrategy: {
      approach: string;
      prioritizedFixes: Array<{
        priority: number;
        category: string;
        fix: string;
        impact: string;
      }>;
    };
    improvedMigrationPlan: {
      description: string;
      changes: string[];
      enhancedGuidance: {
        serviceGenerator: {
          criticalInstructions: string[];
          specificFixes: Array<{
            service: string;
            fixes: string[];
          }>;
        };
        frontendMigrator: {
          criticalInstructions: string[];
          specificFixes: Array<{
            mfe: string;
            fixes: string[];
          }>;
        };
      };
    };
    retryConfidence: {
      score: number;
      reasoning: string;
      estimatedSuccessRate: string;
      recommendRetry: boolean;
    };
  } | null> {
    try {
      const prompt = this.buildAnalysisPrompt(params);

      logger.info('🤖 [RETRY-PLANNER] Calling ARK agent for error analysis and plan improvement', {
        agent: this.agentName,
        attempt: params.currentAttempt,
        maxRetries: params.maxRetries
      });

      // Call ARK retry-planner agent
      const response = await axios.post(
        `${this.arkApiUrl}/openai/v1/chat/completions`,
        {
          model: `agent/${this.agentName}`,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3, // Lower temperature for more deterministic analysis
          max_tokens: 4000
        },
        {
          timeout: 120000, // 2 minute timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const agentOutput = response.data.choices?.[0]?.message?.content || '';

      logger.info('✅ [RETRY-PLANNER] Received analysis from ARK agent', {
        responseLength: agentOutput.length
      });

      // Parse JSON response
      const analysis = this.parseAgentResponse(agentOutput);

      if (!analysis) {
        logger.error('❌ [RETRY-PLANNER] Failed to parse agent response');
        return null;
      }

      logger.info('📊 [RETRY-PLANNER] Analysis Summary', {
        totalErrors: analysis.analysis.totalErrors,
        criticalErrors: analysis.analysis.criticalErrors,
        retryConfidence: analysis.retryConfidence.score,
        recommendRetry: analysis.retryConfidence.recommendRetry
      });

      return analysis;

    } catch (error: any) {
      logger.error('❌ [RETRY-PLANNER] Error calling ARK agent:', {
        message: error.message,
        code: error.code,
        response: error.response?.data
      });

      return null;
    }
  }

  /**
   * Build the prompt for the retry-planner agent
   */
  private buildAnalysisPrompt(params: {
    originalMigrationPlan: any;
    unitTestReport: string;
    integrationTestReport: string;
    e2eTestReport: string;
    currentAttempt: number;
    maxRetries: number;
  }): string {
    return `# RETRY ANALYSIS REQUEST

## Current Retry Attempt
Attempt ${params.currentAttempt + 1} of ${params.maxRetries}

## Original Migration Plan
\`\`\`
${JSON.stringify(params.originalMigrationPlan, null, 2)}
\`\`\`

## Validation Error Reports

### Unit Test Validation Report
\`\`\`
${params.unitTestReport}
\`\`\`

### Integration Test Validation Report
\`\`\`
${params.integrationTestReport}
\`\`\`

### E2E Test Validation Report
\`\`\`
${params.e2eTestReport}
\`\`\`

---

**YOUR TASK**: Analyze all validation errors above and generate an IMPROVED migration plan that fixes ALL identified issues. Return your analysis in the JSON format specified in your system prompt.

Focus on:
1. Identifying root causes (e.g., missing dependencies, config errors)
2. Prioritizing fixes by impact (fix errors that block the most other errors first)
3. Providing specific, actionable guidance for the service-generator and frontend-migrator agents
4. Assessing confidence in retry success (0.0-1.0 score)

Return ONLY the JSON object, no additional text or markdown.`;
  }

  /**
   * Parse the agent's JSON response
   */
  private parseAgentResponse(agentOutput: string): any {
    try {
      // Try to extract JSON if wrapped in markdown
      let jsonStr = agentOutput.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        const lines = jsonStr.split('\n');
        jsonStr = lines.slice(1, -1).join('\n');
        if (jsonStr.startsWith('json')) {
          jsonStr = jsonStr.substring(4).trim();
        }
      }

      const parsed = JSON.parse(jsonStr);

      // Log the parsed response for debugging
      logger.info('📊 [RETRY-PLANNER] Parsed response structure:', {
        hasAnalysis: !!parsed.analysis,
        hasAdjustedPrompt: !!parsed.adjustedMigrationPlannerPrompt,
        hasImprovementStrategy: !!parsed.improvementStrategy,
        hasImprovedPlan: !!parsed.improvedMigrationPlan,
        hasRetryConfidence: !!parsed.retryConfidence,
        topLevelKeys: Object.keys(parsed)
      });

      // Validate structure - make adjustedMigrationPlannerPrompt optional for now
      if (!parsed.analysis || !parsed.improvementStrategy || !parsed.improvedMigrationPlan || !parsed.retryConfidence) {
        logger.error('Invalid response structure from retry-planner agent - missing required fields');
        logger.debug('Missing fields check:', {
          hasAnalysis: !!parsed.analysis,
          hasAdjustedPrompt: !!parsed.adjustedMigrationPlannerPrompt,
          hasImprovementStrategy: !!parsed.improvementStrategy,
          hasImprovedPlan: !!parsed.improvedMigrationPlan,
          hasRetryConfidence: !!parsed.retryConfidence
        });
        return null;
      }

      // If adjustedMigrationPlannerPrompt is missing, create one from the improvement strategy
      if (!parsed.adjustedMigrationPlannerPrompt) {
        logger.warn('⚠️ [RETRY-PLANNER] adjustedMigrationPlannerPrompt missing, generating from improvement strategy');

        // Build adjusted prompt from the improvement strategy
        const fixesText = parsed.improvementStrategy.prioritizedFixes
          .map((fix: any, idx: number) => `${idx + 1}. **${fix.category}** (Priority ${fix.priority})\n   - ${fix.fix}\n   - Impact: ${fix.impact}`)
          .join('\n\n');

        parsed.adjustedMigrationPlannerPrompt = `**ADJUSTED MIGRATION PLANNING PROMPT - Retry Attempt**

You are creating a migration plan to fix validation errors from the previous attempt.

## CRITICAL FIXES REQUIRED

${fixesText}

## MANDATORY REQUIREMENTS

${parsed.improvedMigrationPlan.enhancedGuidance.serviceGenerator.criticalInstructions.map((inst: string, idx: number) => `${idx + 1}. ${inst}`).join('\n')}

Create a comprehensive migration plan that addresses ALL these requirements.`;
      }

      return parsed;

    } catch (error: any) {
      logger.error('Failed to parse retry-planner agent response:', error.message);
      logger.debug('Agent output:', agentOutput.substring(0, 500));
      return null;
    }
  }
}

export default new RetryPlannerService();
