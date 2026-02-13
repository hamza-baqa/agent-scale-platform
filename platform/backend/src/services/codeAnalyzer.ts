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
  annotations?: string[];  // @Entity, @Table, etc.
  tableName?: string;      // Database table name
  relationships?: RelationshipInfo[];  // Foreign keys, joins
  javadoc?: string;        // Documentation comments
  packageName?: string;    // Java package
}

interface PropertyInfo {
  name: string;
  type: string;
  isRequired?: boolean;
  isUnique?: boolean;
  annotations?: string[];  // @Column, @Id, @GeneratedValue, etc.
  columnName?: string;     // Database column name
  length?: number;         // Max length for strings
  nullable?: boolean;      // Can be null
  defaultValue?: string;   // Default value
  javadoc?: string;        // Property documentation
}

interface RelationshipInfo {
  type: 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany';
  targetEntity: string;
  fieldName: string;
  mappedBy?: string;
  fetchType?: 'LAZY' | 'EAGER';
  cascade?: string[];
}

interface ControllerInfo {
  name: string;
  filePath: string;
  endpoints: EndpointInfo[];
  baseMapping?: string;         // @RequestMapping base path
  annotations?: string[];       // @RestController, @CrossOrigin, etc.
  securityAnnotations?: string[];  // @Secured, @PreAuthorize, etc.
  javadoc?: string;             // Controller documentation
  packageName?: string;         // Java package
}

interface EndpointInfo {
  method: string;               // GET, POST, PUT, DELETE, PATCH
  path: string;                 // Full endpoint path
  action: string;               // Method name
  parameters?: ParameterInfo[]; // Method parameters
  returnType?: string;          // Return type
  requestBody?: string;         // Request body type
  pathVariables?: string[];     // Path variables
  queryParams?: string[];       // Query parameters
  annotations?: string[];       // Method annotations
  javadoc?: string;             // Method documentation
  produces?: string;            // @Produces media type
  consumes?: string;            // @Consumes media type
}

interface ParameterInfo {
  name: string;
  type: string;
  annotation?: string;  // @RequestBody, @PathVariable, @RequestParam
  required?: boolean;
  defaultValue?: string;
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
  methods: MethodInfo[];
  annotations?: string[];       // @Service, @Transactional, etc.
  dependencies?: DependencyInfo[];  // Injected services/repositories
  javadoc?: string;             // Service documentation
  packageName?: string;         // Java package
}

interface MethodInfo {
  name: string;
  returnType?: string;
  parameters?: ParameterInfo[];
  annotations?: string[];       // @Transactional, @Async, etc.
  javadoc?: string;             // Method documentation
  visibility?: 'public' | 'private' | 'protected';
}

interface DependencyInfo {
  type: string;                 // Class name
  fieldName: string;            // Field name
  injectionType: 'Constructor' | 'Field' | 'Setter';
}

export class CodeAnalyzer {

  /**
   * Get the AI prompt for exhaustive code analysis
   */
  getAnalysisPrompt(repoPath: string, framework: string): string {
    return `You are an expert code analyzer. Analyze the codebase at: ${repoPath}

**Framework Detected:** ${framework}

**YOUR TASK: Perform EXHAUSTIVE analysis and extract ALL details**

Extract the following with MAXIMUM detail:

## 1. ENTITIES (Domain Models)
For EACH entity, extract:
- Entity name and file path
- Package name
- ALL annotations (@Entity, @Table, @Id, @GeneratedValue, @Column, etc.)
- Table name (from @Table or default)
- ALL properties with:
  * Property name, type, annotations
  * Column name, nullable, unique, length, default value
  * Javadoc comments explaining the field
- ALL relationships:
  * Type (@OneToMany, @ManyToOne, @OneToOne, @ManyToMany)
  * Target entity, mapped by, fetch type, cascade operations
- Class-level Javadoc explaining what this entity represents
- Business purpose (what does this entity represent in the domain?)

## 2. CONTROLLERS (REST APIs)
For EACH controller, extract:
- Controller name and file path
- Package name
- ALL class annotations (@RestController, @RequestMapping, @CrossOrigin, etc.)
- Security annotations (@Secured, @PreAuthorize, @RolesAllowed)
- Base mapping path
- Class Javadoc
- For EACH endpoint:
  * HTTP method (GET, POST, PUT, DELETE, PATCH)
  * Full path (base + endpoint path)
  * Method name
  * ALL parameters (@RequestBody, @PathVariable, @RequestParam) with types
  * Return type
  * Request body type
  * Path variables and query parameters
  * Method annotations
  * Produces/Consumes media types
  * Javadoc explaining what the endpoint does

## 3. SERVICES (Business Logic)
For EACH service, extract:
- Service name and file path
- Package name
- ALL annotations (@Service, @Component, @Transactional, etc.)
- ALL injected dependencies (@Autowired fields) with types
- Class Javadoc
- For EACH public method:
  * Method name, return type, parameters
  * Method annotations (@Transactional, @Async, @Cacheable, etc.)
  * Javadoc explaining the business logic
  * What business operations does this perform?

## 4. REPOSITORIES (Data Access)
- Repository names, interfaces they extend
- Custom query methods
- @Query annotations

## 5. CONFIGURATION
- application.properties/yml settings
- Bean configurations
- Security configurations

## 6. API SUMMARY
Generate accurate counts:
- Total entities: [count]
- Total controllers: [count]
- Total endpoints: [count] (sum of all endpoints across all controllers)
- Total services: [count]
- Total repositories: [count]

**OUTPUT FORMAT:** Return structured JSON with all details above.

**IMPORTANT:**
- Be EXHAUSTIVE - extract EVERY annotation, EVERY field, EVERY method
- Include ALL Javadoc comments
- Explain business purpose, not just technical details
- Be accurate with counts and relationships

Start your analysis now.`;
  }

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

    // LOG THE AI PROMPT (so user can see it)
    const aiPrompt = this.getAnalysisPrompt(repoPath, framework);
    logger.info('='.repeat(80));
    logger.info('AI ANALYSIS PROMPT:');
    logger.info(aiPrompt);
    logger.info('='.repeat(80));

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
      pages: result.pages.length,
      services: result.services.length,
      totalEndpoints: result.controllers.reduce((sum, c) => sum + c.endpoints.length, 0)
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

    // Find services
    const serviceFiles1 = await this.findFiles(repoPath, '**/*Service.java');
    const serviceFiles2 = await this.findFiles(repoPath, '**/service/**/*.java');
    const serviceFiles3 = await this.findFiles(repoPath, '**/services/**/*.java');

    for (const file of [...serviceFiles1, ...serviceFiles2, ...serviceFiles3]) {
      try {
        // Skip interfaces and impl files for now, focus on concrete services
        const content = await fs.readFile(file, 'utf-8');
        if (!content.includes('interface ')) {
          const service = await this.extractJavaService(file);
          if (service) {
            result.services.push(service);
          }
        }
      } catch (error) {
        logger.warn('Failed to parse Java service', { file, error });
      }
    }
  }

  /**
   * Extract Java service with business logic details
   */
  private async extractJavaService(filePath: string): Promise<ServiceInfo | null> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.java');

    // Extract package
    const packageMatch = content.match(/package\s+([\w.]+);/);
    const packageName = packageMatch ? packageMatch[1] : undefined;

    // Extract class annotations
    const annotations: string[] = [];
    const annotationRegex = /@(Service|Component|Transactional|Repository|Configuration)(?:\([^)]*\))?/g;
    let match;
    while ((match = annotationRegex.exec(content)) !== null) {
      annotations.push(match[0]);
    }

    // Extract dependencies (injected fields)
    const dependencies: DependencyInfo[] = [];
    const fieldRegex = /@(Autowired|Inject)\s+private\s+(\w+)\s+(\w+);/g;
    while ((match = fieldRegex.exec(content)) !== null) {
      dependencies.push({
        type: match[2],
        fieldName: match[3],
        injectionType: 'Field'
      });
    }

    // Extract methods
    const methods: MethodInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Match method declarations
      const methodMatch = line.match(/(public|private|protected)\s+(\S+)\s+(\w+)\s*\(([^)]*)\)/);
      if (methodMatch) {
        const visibility = methodMatch[1] as any;
        const returnType = methodMatch[2];
        const methodName = methodMatch[3];
        const paramsString = methodMatch[4];

        // Skip constructors and standard methods
        if (methodName === fileName || methodName === 'toString' || methodName === 'equals' || methodName === 'hashCode') {
          continue;
        }

        // Extract parameters
        const parameters: ParameterInfo[] = [];
        if (paramsString.trim()) {
          const paramParts = paramsString.split(',');
          for (const param of paramParts) {
            const paramMatch = param.trim().match(/(?:@(\w+)(?:\([^)]*\))?\s+)?(?:final\s+)?(\S+)\s+(\w+)/);
            if (paramMatch) {
              parameters.push({
                name: paramMatch[3],
                type: paramMatch[2],
                annotation: paramMatch[1]
              });
            }
          }
        }

        // Extract method annotations
        const methodAnnotations: string[] = [];
        let methodJavadoc: string | undefined;

        for (let j = i - 1; j >= 0 && j >= i - 10; j--) {
          const prevLine = lines[j].trim();

          if (prevLine.startsWith('@')) {
            methodAnnotations.unshift(prevLine);
          }

          if (prevLine.includes('/**')) {
            let docStart = j;
            while (docStart < i && !lines[docStart].includes('*/')) {
              docStart++;
            }
            methodJavadoc = lines.slice(j, docStart + 1)
              .map(l => l.trim().replace(/^\/\*\*|\*\/|\*\s?/g, ''))
              .filter(l => l.length > 0)
              .join(' ');
            break;
          }

          if (prevLine.includes('public ') || prevLine.includes('private ') || prevLine.includes('}')) {
            break;
          }
        }

        methods.push({
          name: methodName,
          returnType,
          parameters: parameters.length > 0 ? parameters : undefined,
          annotations: methodAnnotations.length > 0 ? methodAnnotations : undefined,
          javadoc: methodJavadoc,
          visibility
        });
      }
    }

    if (methods.length === 0) {
      return null;
    }

    return {
      name: fileName,
      filePath,
      methods,
      annotations: annotations.length > 0 ? annotations : undefined,
      dependencies: dependencies.length > 0 ? dependencies : undefined,
      packageName
    };
  }

  /**
   * Extract Java entity with EXHAUSTIVE details
   */
  private async extractJavaEntity(filePath: string): Promise<EntityInfo | null> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.java');

    // Extract package name
    const packageMatch = content.match(/package\s+([\w.]+);/);
    const packageName = packageMatch ? packageMatch[1] : undefined;

    // Extract class-level annotations
    const annotations: string[] = [];
    const classStart = content.indexOf(`class ${fileName}`);
    if (classStart !== -1) {
      const beforeClass = content.substring(0, classStart);
      const annotationRegex = /@(\w+)(?:\([^)]*\))?/g;
      let match;
      // Only get annotations close to class declaration (last 500 chars)
      const relevantSection = beforeClass.substring(Math.max(0, beforeClass.length - 500));
      while ((match = annotationRegex.exec(relevantSection)) !== null) {
        annotations.push(match[0]);
      }
    }

    // Extract table name from @Table annotation
    let tableName = fileName.toLowerCase();
    const tableMatch = content.match(/@Table\s*\(\s*name\s*=\s*"([^"]+)"/);
    if (tableMatch) {
      tableName = tableMatch[1];
    }

    // Extract Javadoc for class
    let javadoc: string | undefined;
    const javadocMatch = content.match(/\/\*\*([\s\S]*?)\*\/\s*(?:@[\w\s()="]*\s*)*class\s+/);
    if (javadocMatch) {
      javadoc = javadocMatch[1]
        .split('\n')
        .map(line => line.trim().replace(/^\*\s?/, ''))
        .filter(line => line.length > 0)
        .join(' ')
        .trim();
    }

    // Extract properties with FULL details
    const properties: PropertyInfo[] = [];

    // Enhanced regex to capture annotations before properties
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if this is a private field declaration
      const fieldMatch = line.match(/private\s+(\w+(?:<[^>]+>)?)\s+(\w+)\s*;/);
      if (fieldMatch) {
        const type = fieldMatch[1];
        const name = fieldMatch[2];

        // Look backwards for annotations
        const propAnnotations: string[] = [];
        let columnName: string | undefined;
        let length: number | undefined;
        let nullable: boolean | undefined;
        let javadocText: string | undefined;

        for (let j = i - 1; j >= 0 && j >= i - 10; j--) {
          const prevLine = lines[j].trim();

          // Stop if we hit another field or method
          if (prevLine.includes('private ') || prevLine.includes('public ') || prevLine.includes('protected ')) {
            if (!prevLine.includes('@')) break;
          }

          // Capture annotations
          if (prevLine.startsWith('@')) {
            propAnnotations.unshift(prevLine);

            // Extract column details
            if (prevLine.includes('@Column')) {
              const colNameMatch = prevLine.match(/name\s*=\s*"([^"]+)"/);
              if (colNameMatch) columnName = colNameMatch[1];

              const lengthMatch = prevLine.match(/length\s*=\s*(\d+)/);
              if (lengthMatch) length = parseInt(lengthMatch[1]);

              const nullableMatch = prevLine.match(/nullable\s*=\s*(true|false)/);
              if (nullableMatch) nullable = nullableMatch[1] === 'true';
            }
          }

          // Capture Javadoc
          if (prevLine.includes('/**') || prevLine.includes('*/')) {
            let docStart = j;
            while (docStart > 0 && !lines[docStart].includes('/**')) {
              docStart--;
            }
            javadocText = lines.slice(docStart, j + 1)
              .map(l => l.trim().replace(/^\/\*\*|\*\/|\*\s?/g, ''))
              .filter(l => l.length > 0)
              .join(' ');
            break;
          }
        }

        properties.push({
          name,
          type,
          annotations: propAnnotations.length > 0 ? propAnnotations : undefined,
          columnName,
          length,
          nullable,
          javadoc: javadocText
        });
      }
    }

    // Extract relationships
    const relationships: RelationshipInfo[] = [];
    const relationshipTypes = ['OneToOne', 'OneToMany', 'ManyToOne', 'ManyToMany'];

    for (const relType of relationshipTypes) {
      const relRegex = new RegExp(`@${relType}\\s*\\(([^)]*)\\)\\s*(?:@[\\w()=",\\s]*\\s*)*private\\s+(\\w+(?:<[^>]+>)?)\\s+(\\w+)`, 'g');
      let match;

      while ((match = relRegex.exec(content)) !== null) {
        const params = match[1];
        const targetType = match[2].replace(/^(List|Set|Collection)<(.+)>$/, '$2');
        const fieldName = match[3];

        const mappedByMatch = params.match(/mappedBy\s*=\s*"([^"]+)"/);
        const fetchMatch = params.match(/fetch\s*=\s*FetchType\.(\w+)/);
        const cascadeMatch = params.match(/cascade\s*=\s*\{([^}]+)\}/);

        relationships.push({
          type: relType as any,
          targetEntity: targetType,
          fieldName,
          mappedBy: mappedByMatch ? mappedByMatch[1] : undefined,
          fetchType: fetchMatch ? (fetchMatch[1] as any) : undefined,
          cascade: cascadeMatch ? cascadeMatch[1].split(',').map(c => c.trim()) : undefined
        });
      }
    }

    if (properties.length === 0 && relationships.length === 0) {
      return null;
    }

    return {
      name: fileName,
      filePath,
      properties,
      annotations: annotations.length > 0 ? annotations : undefined,
      tableName,
      relationships: relationships.length > 0 ? relationships : undefined,
      javadoc,
      packageName
    };
  }

  /**
   * Extract Java controller with EXHAUSTIVE endpoint details
   */
  private async extractJavaController(filePath: string): Promise<ControllerInfo | null> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.java').replace('Controller', '');

    // Extract package name
    const packageMatch = content.match(/package\s+([\w.]+);/);
    const packageName = packageMatch ? packageMatch[1] : undefined;

    // Extract class-level annotations
    const annotations: string[] = [];
    const securityAnnotations: string[] = [];
    const classStart = content.indexOf(`class `);
    if (classStart !== -1) {
      const beforeClass = content.substring(0, classStart);
      const relevantSection = beforeClass.substring(Math.max(0, beforeClass.length - 800));
      const annotationRegex = /@(\w+)(?:\([^)]*\))?/g;
      let match;

      while ((match = annotationRegex.exec(relevantSection)) !== null) {
        const annotation = match[0];
        annotations.push(annotation);

        // Capture security annotations separately
        if (annotation.includes('@Secured') || annotation.includes('@PreAuthorize') || annotation.includes('@RolesAllowed')) {
          securityAnnotations.push(annotation);
        }
      }
    }

    // Extract base mapping
    let baseMapping = '';
    const baseMappingMatch = content.match(/@RequestMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/);
    if (baseMappingMatch) {
      baseMapping = baseMappingMatch[1];
    }

    // Extract controller Javadoc
    let javadoc: string | undefined;
    const javadocMatch = content.match(/\/\*\*([\s\S]*?)\*\/\s*(?:@[\w\s()="',]*\s*)*(?:public\s+)?class\s+/);
    if (javadocMatch) {
      javadoc = javadocMatch[1]
        .split('\n')
        .map(line => line.trim().replace(/^\*\s?/, ''))
        .filter(line => line.length > 0)
        .join(' ')
        .trim();
    }

    // Extract endpoints with FULL details
    const endpoints: EndpointInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Match mapping annotations
      const mappingMatch = line.match(/@(Get|Post|Put|Delete|Patch|Request)Mapping\s*\(([^)]*)\)/);
      if (mappingMatch) {
        const httpMethod = mappingMatch[1] === 'Request' ? 'REQUEST' : mappingMatch[1].toUpperCase();
        const mappingParams = mappingMatch[2];

        // Extract path
        let routePath = '';
        const pathMatch = mappingParams.match(/(?:value\s*=\s*)?["']([^"']+)["']/);
        if (pathMatch) {
          routePath = pathMatch[1];
        }

        // Extract produces/consumes
        const producesMatch = mappingParams.match(/produces\s*=\s*["']([^"']+)["']/);
        const consumesMatch = mappingParams.match(/consumes\s*=\s*["']([^"']+)["']/);

        // Find the method declaration
        let methodLine = i + 1;
        while (methodLine < lines.length && !lines[methodLine].includes('public ')) {
          methodLine++;
        }

        if (methodLine < lines.length) {
          const methodDeclaration = lines[methodLine].trim();
          const methodDeclMatch = methodDeclaration.match(/public\s+(\S+)\s+(\w+)\s*\(([^)]*)\)/);

          if (methodDeclMatch) {
            const returnType = methodDeclMatch[1];
            const methodName = methodDeclMatch[2];
            const paramsString = methodDeclMatch[3];

            // Extract parameters
            const parameters: ParameterInfo[] = [];
            if (paramsString.trim()) {
              const paramParts = paramsString.split(',');
              for (const param of paramParts) {
                const paramMatch = param.trim().match(/(?:@(\w+)(?:\([^)]*\))?\s+)?(?:final\s+)?(\S+)\s+(\w+)/);
                if (paramMatch) {
                  parameters.push({
                    name: paramMatch[3],
                    type: paramMatch[2],
                    annotation: paramMatch[1]
                  });
                }
              }
            }

            // Extract method annotations (look backward)
            const methodAnnotations: string[] = [];
            let endpointJavadoc: string | undefined;

            for (let j = i - 1; j >= 0 && j >= i - 15; j--) {
              const prevLine = lines[j].trim();

              if (prevLine.startsWith('@') && !prevLine.includes('Mapping')) {
                methodAnnotations.unshift(prevLine);
              }

              if (prevLine.includes('/**')) {
                let docStart = j;
                while (docStart < i && !lines[docStart].includes('*/')) {
                  docStart++;
                }
                endpointJavadoc = lines.slice(j, docStart + 1)
                  .map(l => l.trim().replace(/^\/\*\*|\*\/|\*\s?/g, ''))
                  .filter(l => l.length > 0)
                  .join(' ');
                break;
              }

              if (prevLine.includes('public ') || prevLine.includes('private ')) {
                break;
              }
            }

            // Identify request body, path variables, query params
            let requestBody: string | undefined;
            const pathVariables: string[] = [];
            const queryParams: string[] = [];

            for (const param of parameters) {
              if (param.annotation === 'RequestBody') {
                requestBody = param.type;
              } else if (param.annotation === 'PathVariable') {
                pathVariables.push(param.name);
              } else if (param.annotation === 'RequestParam') {
                queryParams.push(param.name);
              }
            }

            // Build full path
            let fullPath = baseMapping + (routePath.startsWith('/') ? routePath : '/' + routePath);
            if (!fullPath.startsWith('/')) {
              fullPath = '/' + fileName.toLowerCase() + fullPath;
            }

            endpoints.push({
              method: httpMethod,
              path: fullPath,
              action: methodName,
              returnType,
              parameters: parameters.length > 0 ? parameters : undefined,
              requestBody,
              pathVariables: pathVariables.length > 0 ? pathVariables : undefined,
              queryParams: queryParams.length > 0 ? queryParams : undefined,
              annotations: methodAnnotations.length > 0 ? methodAnnotations : undefined,
              javadoc: endpointJavadoc,
              produces: producesMatch ? producesMatch[1] : undefined,
              consumes: consumesMatch ? consumesMatch[1] : undefined
            });
          }
        }
      }
    }

    if (endpoints.length === 0) {
      return null;
    }

    return {
      name: fileName,
      filePath,
      endpoints,
      baseMapping: baseMapping || undefined,
      annotations: annotations.length > 0 ? annotations : undefined,
      securityAnnotations: securityAnnotations.length > 0 ? securityAnnotations : undefined,
      javadoc,
      packageName
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
