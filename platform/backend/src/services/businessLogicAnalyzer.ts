import fs from 'fs-extra';
import path from 'path';
import logger from '../utils/logger';

/**
 * Business Logic Analyzer
 *
 * Deep analysis of source code to extract:
 * - Complex business rules and validations
 * - Calculations and algorithms
 * - Workflow logic
 * - Security rules
 * - Database queries and constraints
 * - API integrations
 * - State management logic
 */

interface BusinessLogicAnalysis {
  validations: ValidationRule[];
  calculations: Calculation[];
  workflows: Workflow[];
  securityRules: SecurityRule[];
  databaseLogic: DatabaseLogic[];
  apiIntegrations: ApiIntegration[];
  businessRules: BusinessRule[];
  constants: Constant[];
  enums: EnumDefinition[];
  summary: AnalysisSummary;
}

interface ValidationRule {
  type: 'field' | 'business' | 'security';
  location: string;
  field?: string;
  rule: string;
  errorMessage?: string;
  condition: string;
}

interface Calculation {
  name: string;
  location: string;
  formula: string;
  inputs: string[];
  output: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

interface Workflow {
  name: string;
  location: string;
  steps: WorkflowStep[];
  conditions: string[];
  startState: string;
  endStates: string[];
}

interface WorkflowStep {
  order: number;
  action: string;
  condition?: string;
  nextStep?: string;
}

interface SecurityRule {
  type: 'authentication' | 'authorization' | 'validation' | 'encryption';
  location: string;
  rule: string;
  scope: string;
}

interface DatabaseLogic {
  type: 'query' | 'constraint' | 'trigger' | 'transaction';
  location: string;
  sql?: string;
  entities: string[];
  purpose: string;
}

interface ApiIntegration {
  name: string;
  location: string;
  url?: string;
  method: string;
  headers?: string[];
  authentication?: string;
  requestFormat?: string;
  responseFormat?: string;
}

interface BusinessRule {
  name: string;
  location: string;
  description: string;
  condition: string;
  action: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface Constant {
  name: string;
  value: string;
  type: string;
  location: string;
  usage: string;
}

interface EnumDefinition {
  name: string;
  location: string;
  values: string[];
  usage: string;
}

interface AnalysisSummary {
  totalValidations: number;
  totalCalculations: number;
  totalWorkflows: number;
  totalSecurityRules: number;
  totalBusinessRules: number;
  complexityScore: number;
  criticalLogic: string[];
}

export class BusinessLogicAnalyzer {

  /**
   * Analyze repository for business logic
   */
  async analyzeBusinessLogic(repoPath: string): Promise<BusinessLogicAnalysis> {
    logger.info('🔍 Starting deep business logic analysis', { repoPath });

    const analysis: BusinessLogicAnalysis = {
      validations: [],
      calculations: [],
      workflows: [],
      securityRules: [],
      databaseLogic: [],
      apiIntegrations: [],
      businessRules: [],
      constants: [],
      enums: [],
      summary: {
        totalValidations: 0,
        totalCalculations: 0,
        totalWorkflows: 0,
        totalSecurityRules: 0,
        totalBusinessRules: 0,
        complexityScore: 0,
        criticalLogic: []
      }
    };

    try {
      // Scan backend files
      const backendFiles = await this.findBackendFiles(repoPath);
      logger.info(`Found ${backendFiles.length} backend files to analyze`);

      for (const filePath of backendFiles) {
        const content = await fs.readFile(filePath, 'utf-8');
        const relativePath = path.relative(repoPath, filePath);

        // Extract different types of logic
        analysis.validations.push(...this.extractValidations(content, relativePath));
        analysis.calculations.push(...this.extractCalculations(content, relativePath));
        analysis.workflows.push(...this.extractWorkflows(content, relativePath));
        analysis.securityRules.push(...this.extractSecurityRules(content, relativePath));
        analysis.databaseLogic.push(...this.extractDatabaseLogic(content, relativePath));
        analysis.apiIntegrations.push(...this.extractApiIntegrations(content, relativePath));
        analysis.businessRules.push(...this.extractBusinessRules(content, relativePath));
        analysis.constants.push(...this.extractConstants(content, relativePath));
        analysis.enums.push(...this.extractEnums(content, relativePath));
      }

      // Generate summary
      analysis.summary = this.generateSummary(analysis);

      logger.info('✅ Business logic analysis complete', {
        validations: analysis.validations.length,
        calculations: analysis.calculations.length,
        workflows: analysis.workflows.length,
        businessRules: analysis.businessRules.length
      });

      return analysis;

    } catch (error: any) {
      logger.error('Failed to analyze business logic', { error: error.message });
      throw error;
    }
  }

  /**
   * Find backend source files
   */
  private async findBackendFiles(repoPath: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.java', '.cs', '.ts', '.js'];

    const scan = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip common non-source directories
        if (entry.isDirectory()) {
          if (!['node_modules', 'dist', 'build', 'target', 'bin', 'obj', '.git'].includes(entry.name)) {
            await scan(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    await scan(repoPath);
    return files;
  }

  /**
   * Extract validation rules
   */
  private extractValidations(content: string, location: string): ValidationRule[] {
    const validations: ValidationRule[] = [];

    // Java/Spring annotations
    const annotationPatterns = [
      /@NotNull/g,
      /@NotEmpty/g,
      /@NotBlank/g,
      /@Size\(([^)]+)\)/g,
      /@Min\(([^)]+)\)/g,
      /@Max\(([^)]+)\)/g,
      /@Email/g,
      /@Pattern\(([^)]+)\)/g,
      /@Valid/g,
      /@Past/g,
      /@Future/g
    ];

    annotationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        validations.push({
          type: 'field',
          location,
          rule: match[0],
          condition: match[1] || match[0]
        });
      }
    });

    // C# data annotations
    const csharpPatterns = [
      /\[Required\]/g,
      /\[StringLength\(([^)]+)\)\]/g,
      /\[Range\(([^)]+)\)\]/g,
      /\[EmailAddress\]/g,
      /\[RegularExpression\(([^)]+)\)\]/g
    ];

    csharpPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        validations.push({
          type: 'field',
          location,
          rule: match[0],
          condition: match[1] || match[0]
        });
      }
    });

    // Custom validation methods
    const customValidationPattern = /(?:validate|check|verify|ensure)(\w+)\s*\([^)]*\)\s*\{([^}]+)\}/gi;
    let match;
    while ((match = customValidationPattern.exec(content)) !== null) {
      validations.push({
        type: 'business',
        location,
        rule: `validate${match[1]}`,
        condition: match[2].trim().substring(0, 200)
      });
    }

    // if-throw patterns (validation logic)
    const throwPattern = /if\s*\(([^)]+)\)\s*\{?\s*throw\s+new\s+\w+Exception\(['"](.*?)['"]/g;
    while ((match = throwPattern.exec(content)) !== null) {
      validations.push({
        type: 'business',
        location,
        rule: 'conditional-validation',
        condition: match[1].trim(),
        errorMessage: match[2]
      });
    }

    return validations;
  }

  /**
   * Extract calculations and formulas
   */
  private extractCalculations(content: string, location: string): Calculation[] {
    const calculations: Calculation[] = [];

    // Math operations with multiple steps
    const complexMathPattern = /(\w+)\s*=\s*([^;]+(?:[+\-*\/]\s*[^;]+){2,});/g;
    let match;
    while ((match = complexMathPattern.exec(content)) !== null) {
      const formula = match[2].trim();
      const inputs = this.extractVariablesFromFormula(formula);

      calculations.push({
        name: match[1],
        location,
        formula,
        inputs,
        output: match[1],
        complexity: inputs.length > 5 ? 'complex' : inputs.length > 2 ? 'moderate' : 'simple'
      });
    }

    // Method names suggesting calculations
    const calcMethodPattern = /(?:calculate|compute|determine|evaluate)(\w+)\s*\([^)]*\)\s*\{([^}]{20,500})\}/gi;
    while ((match = calcMethodPattern.exec(content)) !== null) {
      const methodBody = match[2];
      const variables = this.extractVariablesFromFormula(methodBody);

      calculations.push({
        name: `calculate${match[1]}`,
        location,
        formula: methodBody.trim().substring(0, 200),
        inputs: variables,
        output: match[1],
        complexity: methodBody.length > 300 ? 'complex' : methodBody.length > 150 ? 'moderate' : 'simple'
      });
    }

    return calculations;
  }

  /**
   * Extract workflow logic
   */
  private extractWorkflows(content: string, location: string): Workflow[] {
    const workflows: Workflow[] = [];

    // State machine patterns
    const stateMachinePattern = /(?:enum|class)\s+(\w+State)\s*\{([^}]+)\}/g;
    let match;
    while ((match = stateMachinePattern.exec(content)) !== null) {
      const states = match[2].split(',').map(s => s.trim()).filter(s => s);

      workflows.push({
        name: match[1],
        location,
        steps: states.map((state, idx) => ({
          order: idx,
          action: state,
        })),
        conditions: [],
        startState: states[0] || 'INITIAL',
        endStates: [states[states.length - 1] || 'FINAL']
      });
    }

    // Process/workflow methods
    const processPattern = /(?:process|execute|handle|perform)(\w+)\s*\([^)]*\)\s*\{([^}]{50,1000})\}/gi;
    while ((match = processPattern.exec(content)) !== null) {
      const methodBody = match[2];
      const steps = this.extractWorkflowSteps(methodBody);

      if (steps.length > 2) {
        workflows.push({
          name: `process${match[1]}`,
          location,
          steps,
          conditions: this.extractConditions(methodBody),
          startState: 'START',
          endStates: ['COMPLETED']
        });
      }
    }

    return workflows;
  }

  /**
   * Extract security rules
   */
  private extractSecurityRules(content: string, location: string): SecurityRule[] {
    const rules: SecurityRule[] = [];

    // Spring Security annotations
    const securityAnnotations = [
      /@PreAuthorize\(['"](.*?)['"]\)/g,
      /@Secured\(['"](.*?)['"]\)/g,
      /@RolesAllowed\(['"](.*?)['"]\)/g
    ];

    securityAnnotations.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        rules.push({
          type: 'authorization',
          location,
          rule: match[0],
          scope: match[1]
        });
      }
    });

    // Password/encryption logic
    const encryptionPattern = /(?:encrypt|hash|bcrypt|sha256|md5)[\w\s]*\(/gi;
    let match;
    while ((match = encryptionPattern.exec(content)) !== null) {
      rules.push({
        type: 'encryption',
        location,
        rule: match[0],
        scope: 'data-protection'
      });
    }

    // JWT/Token validation
    const tokenPattern = /(?:validateToken|verifyToken|checkToken)[\w\s]*\([^)]*\)/gi;
    while ((match = tokenPattern.exec(content)) !== null) {
      rules.push({
        type: 'authentication',
        location,
        rule: match[0],
        scope: 'token-validation'
      });
    }

    return rules;
  }

  /**
   * Extract database logic
   */
  private extractDatabaseLogic(content: string, location: string): DatabaseLogic[] {
    const logic: DatabaseLogic[] = [];

    // SQL queries
    const sqlPattern = /(SELECT|INSERT|UPDATE|DELETE|WITH)[\s\S]*?(?:FROM|INTO|SET|WHERE)[\s\S]*?[;'"]/gi;
    let match;
    while ((match = sqlPattern.exec(content)) !== null) {
      const sql = match[0];
      logic.push({
        type: 'query',
        location,
        sql: sql.substring(0, 500),
        entities: this.extractTableNames(sql),
        purpose: this.inferQueryPurpose(sql)
      });
    }

    // JPA queries
    const jpqlPattern = /@Query\(['"](.*?)['"]\)/g;
    while ((match = jpqlPattern.exec(content)) !== null) {
      logic.push({
        type: 'query',
        location,
        sql: match[1],
        entities: this.extractTableNames(match[1]),
        purpose: this.inferQueryPurpose(match[1])
      });
    }

    // Transactions
    const transactionPattern = /@Transactional/g;
    while ((match = transactionPattern.exec(content)) !== null) {
      logic.push({
        type: 'transaction',
        location,
        entities: [],
        purpose: 'transactional-operation'
      });
    }

    return logic;
  }

  /**
   * Extract API integrations
   */
  private extractApiIntegrations(content: string, location: string): ApiIntegration[] {
    const integrations: ApiIntegration[] = [];

    // HTTP client calls
    const httpPattern = /(?:get|post|put|delete|patch)\s*\(\s*['"](.*?)['"]/gi;
    let match;
    while ((match = httpPattern.exec(content)) !== null) {
      integrations.push({
        name: 'http-call',
        location,
        url: match[1],
        method: match[0].split('(')[0].toUpperCase()
      });
    }

    // RestTemplate patterns
    const restTemplatePattern = /restTemplate\.(getForObject|postForObject|exchange)\s*\(/gi;
    while ((match = restTemplatePattern.exec(content)) !== null) {
      integrations.push({
        name: 'rest-template-call',
        location,
        method: match[1]
      });
    }

    return integrations;
  }

  /**
   * Extract business rules
   */
  private extractBusinessRules(content: string, location: string): BusinessRule[] {
    const rules: BusinessRule[] = [];

    // Complex if-conditions
    const complexIfPattern = /if\s*\(([^)]{30,200})\)\s*\{([^}]{20,300})\}/g;
    let match;
    while ((match = complexIfPattern.exec(content)) !== null) {
      rules.push({
        name: 'conditional-rule',
        location,
        description: 'Complex business condition',
        condition: match[1].trim(),
        action: match[2].trim().substring(0, 100),
        priority: match[1].includes('critical') || match[1].includes('mandatory') ? 'critical' : 'medium'
      });
    }

    // Switch/case statements
    const switchPattern = /switch\s*\((\w+)\)\s*\{([\s\S]*?)\}/g;
    while ((match = switchPattern.exec(content)) !== null) {
      const cases = match[2].match(/case\s+[\w'"]+:/g) || [];
      if (cases.length > 3) {
        rules.push({
          name: 'multi-case-rule',
          location,
          description: `Business rule with ${cases.length} cases`,
          condition: `switch(${match[1]})`,
          action: `${cases.length} different actions`,
          priority: 'high'
        });
      }
    }

    return rules;
  }

  /**
   * Extract constants
   */
  private extractConstants(content: string, location: string): Constant[] {
    const constants: Constant[] = [];

    // Java constants
    const javaConstPattern = /(?:public|private|protected)?\s*static\s+final\s+(\w+)\s+(\w+)\s*=\s*([^;]+);/g;
    let match;
    while ((match = javaConstPattern.exec(content)) !== null) {
      constants.push({
        name: match[2],
        value: match[3].trim(),
        type: match[1],
        location,
        usage: 'application-constant'
      });
    }

    // C# constants
    const csharpConstPattern = /(?:public|private|protected)?\s*const\s+(\w+)\s+(\w+)\s*=\s*([^;]+);/g;
    while ((match = csharpConstPattern.exec(content)) !== null) {
      constants.push({
        name: match[2],
        value: match[3].trim(),
        type: match[1],
        location,
        usage: 'application-constant'
      });
    }

    return constants;
  }

  /**
   * Extract enum definitions
   */
  private extractEnums(content: string, location: string): EnumDefinition[] {
    const enums: EnumDefinition[] = [];

    const enumPattern = /enum\s+(\w+)\s*\{([^}]+)\}/g;
    let match;
    while ((match = enumPattern.exec(content)) !== null) {
      const values = match[2].split(',').map(v => v.trim()).filter(v => v);
      enums.push({
        name: match[1],
        location,
        values,
        usage: 'business-domain'
      });
    }

    return enums;
  }

  /**
   * Helper: Extract variables from formula
   */
  private extractVariablesFromFormula(formula: string): string[] {
    const variablePattern = /\b([a-zA-Z_]\w*)\b/g;
    const variables = new Set<string>();
    let match;

    while ((match = variablePattern.exec(formula)) !== null) {
      const variable = match[1];
      // Filter out keywords
      if (!['if', 'else', 'return', 'new', 'this', 'true', 'false', 'null'].includes(variable)) {
        variables.add(variable);
      }
    }

    return Array.from(variables);
  }

  /**
   * Helper: Extract workflow steps
   */
  private extractWorkflowSteps(methodBody: string): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    const lines = methodBody.split('\n');

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.length > 10 && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
        steps.push({
          order: idx,
          action: trimmed.substring(0, 100)
        });
      }
    });

    return steps;
  }

  /**
   * Helper: Extract conditions
   */
  private extractConditions(text: string): string[] {
    const conditions: string[] = [];
    const ifPattern = /if\s*\(([^)]+)\)/g;
    let match;

    while ((match = ifPattern.exec(text)) !== null) {
      conditions.push(match[1].trim());
    }

    return conditions;
  }

  /**
   * Helper: Extract table names from SQL
   */
  private extractTableNames(sql: string): string[] {
    const tables = new Set<string>();
    const fromPattern = /FROM\s+(\w+)/gi;
    const joinPattern = /JOIN\s+(\w+)/gi;
    const intoPattern = /INTO\s+(\w+)/gi;

    let match;
    while ((match = fromPattern.exec(sql)) !== null) tables.add(match[1]);
    while ((match = joinPattern.exec(sql)) !== null) tables.add(match[1]);
    while ((match = intoPattern.exec(sql)) !== null) tables.add(match[1]);

    return Array.from(tables);
  }

  /**
   * Helper: Infer query purpose
   */
  private inferQueryPurpose(sql: string): string {
    if (sql.toUpperCase().includes('SELECT')) return 'data-retrieval';
    if (sql.toUpperCase().includes('INSERT')) return 'data-creation';
    if (sql.toUpperCase().includes('UPDATE')) return 'data-modification';
    if (sql.toUpperCase().includes('DELETE')) return 'data-deletion';
    return 'unknown';
  }

  /**
   * Generate analysis summary
   */
  private generateSummary(analysis: BusinessLogicAnalysis): AnalysisSummary {
    const summary: AnalysisSummary = {
      totalValidations: analysis.validations.length,
      totalCalculations: analysis.calculations.length,
      totalWorkflows: analysis.workflows.length,
      totalSecurityRules: analysis.securityRules.length,
      totalBusinessRules: analysis.businessRules.length,
      complexityScore: 0,
      criticalLogic: []
    };

    // Calculate complexity score
    summary.complexityScore =
      (analysis.validations.length * 1) +
      (analysis.calculations.length * 3) +
      (analysis.workflows.length * 5) +
      (analysis.securityRules.length * 4) +
      (analysis.businessRules.length * 3);

    // Identify critical logic
    if (analysis.calculations.filter(c => c.complexity === 'complex').length > 0) {
      summary.criticalLogic.push('Complex calculations detected');
    }
    if (analysis.workflows.length > 3) {
      summary.criticalLogic.push('Multiple workflows present');
    }
    if (analysis.securityRules.length > 5) {
      summary.criticalLogic.push('Complex security requirements');
    }
    if (analysis.businessRules.filter(r => r.priority === 'critical').length > 0) {
      summary.criticalLogic.push('Critical business rules present');
    }

    return summary;
  }

  /**
   * Format analysis for agent prompts
   */
  formatForAgentPrompt(analysis: BusinessLogicAnalysis): string {
    return `
## BUSINESS LOGIC TO REPLICATE

### Critical Requirements
${analysis.summary.criticalLogic.map(logic => `- ${logic}`).join('\n')}

### Validations (${analysis.validations.length})
${analysis.validations.slice(0, 20).map(v =>
  `- **${v.type}**: ${v.rule} at ${v.location}`
).join('\n')}

### Calculations (${analysis.calculations.length})
${analysis.calculations.slice(0, 10).map(c =>
  `- **${c.name}**: ${c.formula.substring(0, 100)} [${c.complexity}]`
).join('\n')}

### Workflows (${analysis.workflows.length})
${analysis.workflows.slice(0, 5).map(w =>
  `- **${w.name}**: ${w.steps.length} steps from ${w.startState} to ${w.endStates.join(',')}`
).join('\n')}

### Security Rules (${analysis.securityRules.length})
${analysis.securityRules.slice(0, 10).map(r =>
  `- **${r.type}**: ${r.rule} [${r.scope}]`
).join('\n')}

### Business Rules (${analysis.businessRules.length})
${analysis.businessRules.slice(0, 15).map(r =>
  `- **[${r.priority.toUpperCase()}]** ${r.name}: ${r.condition.substring(0, 80)}`
).join('\n')}

### Constants & Enums
- **Constants**: ${analysis.constants.length}
- **Enums**: ${analysis.enums.length} (${analysis.enums.map(e => e.name).join(', ')})

**IMPORTANT**: The generated code MUST implement ALL of these business logic patterns with the same behavior as the source code.
`;
  }
}

export default new BusinessLogicAnalyzer();
