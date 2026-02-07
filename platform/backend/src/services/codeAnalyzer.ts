import fs from 'fs-extra';
import path from 'path';
import logger from '../utils/logger';

interface AnalysisResult {
  projectName: string;
  framework: string;
  entities: EntityInfo[];
  controllers: ControllerInfo[];
  pages: PageInfo[];
  services: ServiceInfo[];
}

interface EntityInfo {
  name: string;
  filePath: string;
  properties: PropertyInfo[];
}

interface PropertyInfo {
  name: string;
  type: string;
  isRequired?: boolean;
  isUnique?: boolean;
}

interface ControllerInfo {
  name: string;
  filePath: string;
  endpoints: EndpointInfo[];
}

interface EndpointInfo {
  method: string;
  path: string;
  action: string;
}

interface PageInfo {
  name: string;
  filePath: string;
  route?: string;
  components: string[];
  template?: string;
  styles?: string;
}

interface ServiceInfo {
  name: string;
  filePath: string;
  methods: string[];
}

export class CodeAnalyzer {

  /**
   * Analyze a repository to extract structure and components
   */
  async analyzeRepository(repoPath: string): Promise<AnalysisResult> {
    logger.info('Analyzing repository', { repoPath });

    if (!await fs.pathExists(repoPath)) {
      throw new Error(`Repository path does not exist: ${repoPath}`);
    }

    const projectName = path.basename(repoPath);

    // Detect framework
    const framework = await this.detectFramework(repoPath);
    logger.info('Detected framework', { framework });

    const result: AnalysisResult = {
      projectName,
      framework,
      entities: [],
      controllers: [],
      pages: [],
      services: []
    };

    // Analyze based on framework
    // For monorepo, analyze all detected frameworks
    if (framework.includes('Blazor') || framework.includes('ASP.NET') || framework.includes('C# .NET')) {
      await this.analyzeDotNetProject(repoPath, result);
    }
    if (framework.includes('Spring Boot') || framework.includes('Java')) {
      await this.analyzeSpringBootProject(repoPath, result);
    }
    if (framework.includes('Angular')) {
      await this.analyzeAngularProject(repoPath, result);
    }
    if (framework === 'Unknown') {
      // Generic analysis
      await this.analyzeGenericProject(repoPath, result);
    }

    logger.info('Analysis complete', {
      entities: result.entities.length,
      controllers: result.controllers.length,
      pages: result.pages.length
    });

    return result;
  }

  /**
   * Detect project framework
   */
  private async detectFramework(repoPath: string): Promise<string> {
    const frameworks: string[] = [];

    // Check for .csproj files (search in subdirectories too)
    const csprojFiles = await this.findFiles(repoPath, '**/*.csproj', 3);
    if (csprojFiles.length > 0) {
      const content = await fs.readFile(csprojFiles[0], 'utf-8');
      if (content.includes('Microsoft.AspNetCore.Components.WebAssembly')) {
        frameworks.push('Blazor WebAssembly');
      } else if (content.includes('Microsoft.AspNetCore')) {
        frameworks.push('ASP.NET Core');
      } else {
        frameworks.push('C# .NET');
      }
    }

    // Check for pom.xml (at root and in subdirectories)
    const pomFiles = await this.findFiles(repoPath, '**/pom.xml', 3);
    if (pomFiles.length > 0) {
      const content = await fs.readFile(pomFiles[0], 'utf-8');
      if (content.includes('spring-boot')) {
        frameworks.push('Spring Boot');
      } else {
        frameworks.push('Java Maven');
      }
    }

    // Check for package.json
    const packageFiles = await this.findFiles(repoPath, '**/package.json', 3);
    if (packageFiles.length > 0) {
      const content = await fs.readFile(packageFiles[0], 'utf-8');
      const pkg = JSON.parse(content);
      if (pkg.dependencies && pkg.dependencies['@angular/core']) {
        frameworks.push('Angular');
      } else if (pkg.dependencies && pkg.dependencies['react']) {
        frameworks.push('React');
      } else {
        frameworks.push('Node.js');
      }
    }

    if (frameworks.length > 0) {
      return frameworks.join(' + ');
    }

    return 'Unknown';
  }

  /**
   * Analyze .NET/Blazor project
   */
  private async analyzeDotNetProject(repoPath: string, result: AnalysisResult): Promise<void> {
    // Find Models/Entities (both shallow and deep nesting)
    const modelFiles1 = await this.findFiles(repoPath, '**/Models/**/*.cs');
    const modelFiles2 = await this.findFiles(repoPath, '**/Models/*.cs');
    const entityFiles1 = await this.findFiles(repoPath, '**/Entities/**/*.cs');
    const entityFiles2 = await this.findFiles(repoPath, '**/Entities/*.cs');
    const allEntityFiles = [...modelFiles1, ...modelFiles2, ...entityFiles1, ...entityFiles2];

    for (const file of allEntityFiles) {
      try {
        const entity = await this.extractCSharpEntity(file);
        if (entity) {
          result.entities.push(entity);
        }
      } catch (error) {
        logger.warn('Failed to parse entity', { file, error });
      }
    }

    // Find Controllers
    const controllerFiles = await this.findFiles(repoPath, '**/*Controller.cs');
    for (const file of controllerFiles) {
      try {
        const controller = await this.extractCSharpController(file);
        if (controller) {
          result.controllers.push(controller);
        }
      } catch (error) {
        logger.warn('Failed to parse controller', { file, error });
      }
    }

    // Find Blazor Pages
    const razorFiles = await this.findFiles(repoPath, '**/*.razor');
    for (const file of razorFiles) {
      try {
        const page = await this.extractBlazorPage(file);
        if (page) {
          result.pages.push(page);
        }
      } catch (error) {
        logger.warn('Failed to parse page', { file, error });
      }
    }
  }

  /**
   * Extract C# entity information
   */
  private async extractCSharpEntity(filePath: string): Promise<EntityInfo | null> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.cs');

    // Skip if not a class
    if (!content.includes('class ' + fileName)) {
      return null;
    }

    const properties: PropertyInfo[] = [];

    // Extract properties using regex
    const propRegex = /public\s+(\w+\??)\s+(\w+)\s*{\s*get;\s*set;\s*}/g;
    let match;

    while ((match = propRegex.exec(content)) !== null) {
      const type = match[1].replace('?', '');
      const name = match[2];

      properties.push({
        name,
        type: this.mapCSharpTypeToJava(type),
        isRequired: !match[1].includes('?')
      });
    }

    if (properties.length === 0) {
      return null;
    }

    return {
      name: fileName,
      filePath,
      properties
    };
  }

  /**
   * Extract controller endpoints
   */
  private async extractCSharpController(filePath: string): Promise<ControllerInfo | null> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.cs').replace('Controller', '');

    const endpoints: EndpointInfo[] = [];

    // Extract HTTP methods
    const methodRegex = /\[(Http(Get|Post|Put|Delete|Patch))\(?"?([^"\)]*)"?\)?\]\s*public\s+\w+\s+(\w+)/g;
    let match;

    while ((match = methodRegex.exec(content)) !== null) {
      const method = match[2].toUpperCase();
      const routePath = match[3] || '';
      const action = match[4];

      endpoints.push({
        method,
        path: `/${fileName.toLowerCase()}${routePath ? '/' + routePath : ''}`,
        action
      });
    }

    if (endpoints.length === 0) {
      return null;
    }

    return {
      name: fileName,
      filePath,
      endpoints
    };
  }

  /**
   * Extract Blazor page information
   */
  private async extractBlazorPage(filePath: string): Promise<PageInfo | null> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.razor');

    // Extract route
    const routeMatch = content.match(/@page\s+"([^"]+)"/);
    const route = routeMatch ? routeMatch[1] : undefined;

    // Extract component references
    const components: string[] = [];
    const componentRegex = /<([A-Z]\w+)/g;
    let match;

    while ((match = componentRegex.exec(content)) !== null) {
      if (!components.includes(match[1])) {
        components.push(match[1]);
      }
    }

    // Extract HTML template (everything before @code block)
    let template = content;
    const codeBlockIndex = content.indexOf('@code');
    if (codeBlockIndex !== -1) {
      template = content.substring(0, codeBlockIndex).trim();
    }

    // Remove Blazor directives and convert to Angular-like syntax
    template = this.convertBlazorToAngular(template);

    // Try to find associated CSS file
    const cssPath = filePath.replace('.razor', '.razor.css');
    let styles = '';
    if (await fs.pathExists(cssPath)) {
      styles = await fs.readFile(cssPath, 'utf-8');
    }

    return {
      name: fileName,
      filePath,
      route,
      components,
      template,
      styles
    };
  }

  /**
   * Convert Blazor Razor syntax to Angular-compatible HTML
   */
  private convertBlazorToAngular(template: string): string {
    let converted = template;

    // Remove @page, @layout, @inject directives
    converted = converted.replace(/@page\s+"[^"]+"\n?/g, '');
    converted = converted.replace(/@layout\s+\w+\n?/g, '');
    converted = converted.replace(/@inject\s+.*\n?/g, '');

    // Convert Blazor components to Angular components first
    converted = converted.replace(/<EditForm/g, '<form');
    converted = converted.replace(/<\/EditForm>/g, '</form>');
    converted = converted.replace(/<InputText\s+type="([^"]+)"\s+/g, '<input type="$1" ');
    converted = converted.replace(/<InputText\s+/g, '<input type="text" ');
    converted = converted.replace(/<PageTitle>([^<]+)<\/PageTitle>/g, '<!-- Title: $1 -->');
    converted = converted.replace(/<DataAnnotationsValidator\s*\/>/g, '');
    converted = converted.replace(/<ValidationMessage[^>]*>/g, '<span class="text-danger"></span>');

    // Convert @bind-Value to [(ngModel)]
    converted = converted.replace(/@bind-Value="([^"]+)"/g, '[(ngModel)]="$1"');

    // Convert @onclick to (click)
    converted = converted.replace(/@onclick="([^"]+)"/g, '(click)="$1"');

    // Convert @if blocks to Angular *ngIf
    converted = converted.replace(/@if\s*\(([^)]+)\)\s*\{/g, '<ng-container *ngIf="$1">');
    converted = converted.replace(/\s*\}\s*else\s*\{/g, '</ng-container><ng-container *ngIf="!($1)">');
    converted = converted.replace(/\s*\}(?=\s*<)/g, '</ng-container>');

    // Remove Model and OnValidSubmit attributes (handle in component)
    converted = converted.replace(/Model="[^"]+"\s*/g, '');
    converted = converted.replace(/OnValidSubmit="[^"]+"\s*/g, '(ngSubmit)="onSubmit()" ');

    // Convert @(expression) to {{expression}}
    converted = converted.replace(/@\(([^)]+)\)/g, '{{$1}}');

    // Convert disabled="@variable" to [disabled]="variable"
    converted = converted.replace(/disabled="@(\w+)"/g, '[disabled]="$1"');

    // Remove any remaining single @ symbols before variables
    converted = converted.replace(/@(\w+)/g, '{{$1}}');

    // Clean up C# specific syntax
    converted = converted.replace(/string\.IsNullOrEmpty\(([^)]+)\)/g, '!$1');
    converted = converted.replace(/!string\.IsNullOrEmpty\(([^)]+)\)/g, '$1');

    return converted.trim();
  }

  /**
   * Analyze Spring Boot project
   */
  private async analyzeSpringBootProject(repoPath: string, result: AnalysisResult): Promise<void> {
    // Find entities (both shallow and deep nesting)
    const entityFiles1 = await this.findFiles(repoPath, '**/entity/**/*.java');
    const entityFiles2 = await this.findFiles(repoPath, '**/entity/*.java');
    const modelFiles1 = await this.findFiles(repoPath, '**/model/**/*.java');
    const modelFiles2 = await this.findFiles(repoPath, '**/model/*.java');

    for (const file of [...entityFiles1, ...entityFiles2, ...modelFiles1, ...modelFiles2]) {
      try {
        const entity = await this.extractJavaEntity(file);
        if (entity) {
          result.entities.push(entity);
        }
      } catch (error) {
        logger.warn('Failed to parse Java entity', { file, error });
      }
    }

    // Find controllers
    const controllerFiles = await this.findFiles(repoPath, '**/*Controller.java');
    for (const file of controllerFiles) {
      try {
        const controller = await this.extractJavaController(file);
        if (controller) {
          result.controllers.push(controller);
        }
      } catch (error) {
        logger.warn('Failed to parse Java controller', { file, error });
      }
    }
  }

  /**
   * Extract Java entity
   */
  private async extractJavaEntity(filePath: string): Promise<EntityInfo | null> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.java');

    const properties: PropertyInfo[] = [];
    const propRegex = /private\s+(\w+)\s+(\w+);/g;
    let match;

    while ((match = propRegex.exec(content)) !== null) {
      properties.push({
        name: match[2],
        type: match[1]
      });
    }

    if (properties.length === 0) {
      return null;
    }

    return {
      name: fileName,
      filePath,
      properties
    };
  }

  /**
   * Extract Java controller
   */
  private async extractJavaController(filePath: string): Promise<ControllerInfo | null> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.java').replace('Controller', '');

    const endpoints: EndpointInfo[] = [];
    // Match @XMapping annotations with optional path
    const methodRegex = /@(Get|Post|Put|Delete|Patch)Mapping(?:\("([^"]*)"\)|\(\))?/g;
    let match;

    while ((match = methodRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      let routePath = match[2] || '';

      // Extract method name - look for the next public method after this mapping
      const afterMapping = content.substring(match.index);
      const publicMethodMatch = afterMapping.match(/public\s+\S+\s+(\w+)\s*\(/);
      const methodName = publicMethodMatch ? publicMethodMatch[1] : 'unknown';

      // Build full path
      let fullPath = routePath;
      if (!fullPath.startsWith('/')) {
        fullPath = '/' + fileName.toLowerCase() + (fullPath ? '/' + fullPath : '');
      }

      endpoints.push({
        method,
        path: fullPath,
        action: methodName
      });
    }

    if (endpoints.length === 0) {
      return null;
    }

    return {
      name: fileName,
      filePath,
      endpoints
    };
  }

  /**
   * Analyze Angular project
   */
  private async analyzeAngularProject(repoPath: string, result: AnalysisResult): Promise<void> {
    // Find components
    const componentFiles = await this.findFiles(repoPath, '**/*.component.ts');

    for (const file of componentFiles) {
      const fileName = path.basename(file, '.component.ts');
      result.pages.push({
        name: fileName,
        filePath: file,
        components: []
      });
    }
  }

  /**
   * Generic project analysis
   */
  private async analyzeGenericProject(repoPath: string, result: AnalysisResult): Promise<void> {
    logger.info('Performing generic analysis');
    // Basic file structure analysis
  }

  /**
   * Find files matching pattern
   */
  private async findFiles(basePath: string, pattern: string, maxDepth: number = 10): Promise<string[]> {
    const results: string[] = [];

    const search = async (dir: string, depth: number) => {
      if (depth > maxDepth) return;

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'bin' && entry.name !== 'obj') {
              await search(fullPath, depth + 1);
            }
          } else if (entry.isFile()) {
            // Match against relative path from basePath
            const relativePath = path.relative(basePath, fullPath);
            if (this.matchPattern(relativePath, pattern)) {
              results.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };

    await search(basePath, 0);
    return results;
  }

  /**
   * Simple pattern matching
   */
  private matchPattern(filename: string, pattern: string): boolean {
    // Replace ** with .* (matches anything including /)
    // Replace * with [^/]* (matches anything except /)
    // Escape dots
    const regex = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '___DOUBLESTAR___')
      .replace(/\*/g, '[^/\\\\]*')
      .replace(/___DOUBLESTAR___/g, '.*');
    return new RegExp(`^${regex}$`).test(filename.replace(/\\/g, '/'));
  }

  /**
   * Map C# types to Java types
   */
  private mapCSharpTypeToJava(csharpType: string): string {
    const typeMap: Record<string, string> = {
      'int': 'Integer',
      'long': 'Long',
      'double': 'Double',
      'float': 'Float',
      'bool': 'Boolean',
      'string': 'String',
      'DateTime': 'LocalDateTime',
      'decimal': 'BigDecimal',
      'Guid': 'UUID'
    };

    return typeMap[csharpType] || csharpType;
  }
}

export default new CodeAnalyzer();
