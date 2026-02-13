import fs from 'fs-extra';
import path from 'path';
import logger from '../utils/logger';

/**
 * Code Extractor Service
 *
 * Parses markdown output from ARK agents and extracts code blocks to create actual files.
 * Handles file paths, directory structures, and multiple code formats.
 */

interface ExtractedFile {
  path: string;
  content: string;
  language: string;
}

interface ExtractionResult {
  filesCreated: number;
  directoriesCreated: number;
  files: ExtractedFile[];
  errors: string[];
}

export class CodeExtractorService {

  /**
   * Extract code from agent markdown output and write to file system
   */
  async extractAndWriteCode(
    markdownContent: string,
    outputBasePath: string,
    agentType: 'backend' | 'frontend'
  ): Promise<ExtractionResult> {
    logger.info(`Extracting code from ${agentType} agent output to ${outputBasePath}`);

    const result: ExtractionResult = {
      filesCreated: 0,
      directoriesCreated: 0,
      files: [],
      errors: []
    };

    try {
      // Ensure base output directory exists
      await fs.ensureDir(outputBasePath);

      // Extract code blocks from markdown
      const extractedFiles = this.parseMarkdownCodeBlocks(markdownContent, agentType);

      logger.info(`Found ${extractedFiles.length} code blocks in agent output`);

      // Write each file to disk
      for (const file of extractedFiles) {
        try {
          const fullPath = path.join(outputBasePath, file.path);
          const fileDir = path.dirname(fullPath);

          // Create directory if it doesn't exist
          if (!await fs.pathExists(fileDir)) {
            await fs.ensureDir(fileDir);
            result.directoriesCreated++;
          }

          // Write file content
          await fs.writeFile(fullPath, file.content, 'utf-8');
          result.filesCreated++;
          result.files.push(file);

          logger.info(`Created file: ${file.path}`);
        } catch (error) {
          const errorMsg = `Failed to write file ${file.path}: ${error.message}`;
          logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      logger.info(`Code extraction complete: ${result.filesCreated} files, ${result.directoriesCreated} directories`);

    } catch (error) {
      logger.error(`Code extraction failed: ${error.message}`);
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Parse markdown and extract code blocks with file paths
   */
  private parseMarkdownCodeBlocks(markdown: string, agentType: 'backend' | 'frontend'): ExtractedFile[] {
    const files: ExtractedFile[] = [];

    // Pattern 1: Explicit file path headers (most common in agent output)
    // Example: ### pom.xml
    //          ```xml
    const pattern1Regex = /###?\s+(?:File:\s*)?(.+?)\s*\n```(\w+)?\n([\s\S]+?)\n```/g;

    // Pattern 2: File path in code block header
    // Example: ```java:src/main/java/Application.java
    const pattern2Regex = /```(\w+):(.+?)\n([\s\S]+?)\n```/g;

    // Pattern 3: Inline file markers
    // Example: **pom.xml:**
    //          ```xml
    const pattern3Regex = /\*\*(.+?):\*\*\s*\n```(\w+)?\n([\s\S]+?)\n```/g;

    // Try Pattern 1
    let match;
    while ((match = pattern1Regex.exec(markdown)) !== null) {
      const filePath = this.cleanFilePath(match[1]);
      const language = match[2] || this.detectLanguage(filePath);
      const content = this.cleanCodeContent(match[3]);

      if (this.isValidFile(filePath, content)) {
        files.push({ path: filePath, content, language });
      }
    }

    // Try Pattern 2
    pattern2Regex.lastIndex = 0;
    while ((match = pattern2Regex.exec(markdown)) !== null) {
      const language = match[1];
      const filePath = this.cleanFilePath(match[2]);
      const content = this.cleanCodeContent(match[3]);

      if (this.isValidFile(filePath, content)) {
        files.push({ path: filePath, content, language });
      }
    }

    // Try Pattern 3
    pattern3Regex.lastIndex = 0;
    while ((match = pattern3Regex.exec(markdown)) !== null) {
      const filePath = this.cleanFilePath(match[1]);
      const language = match[2] || this.detectLanguage(filePath);
      const content = this.cleanCodeContent(match[3]);

      if (this.isValidFile(filePath, content)) {
        files.push({ path: filePath, content, language });
      }
    }

    // If no files found with patterns, try structured extraction based on agent type
    if (files.length === 0) {
      logger.warn('No files found with standard patterns, trying structured extraction');
      return this.extractByAgentStructure(markdown, agentType);
    }

    // Remove duplicates (keep last occurrence)
    const uniqueFiles = new Map<string, ExtractedFile>();
    files.forEach(file => uniqueFiles.set(file.path, file));

    return Array.from(uniqueFiles.values());
  }

  /**
   * Extract code by parsing agent-specific structure
   */
  private extractByAgentStructure(markdown: string, agentType: 'backend' | 'frontend'): ExtractedFile[] {
    const files: ExtractedFile[] = [];

    if (agentType === 'backend') {
      // Look for Spring Boot service structure
      const serviceNameMatch = markdown.match(/###?\s+(?:\d+\.\s+)?(.+?-service)/i);
      const serviceName = serviceNameMatch ? serviceNameMatch[1] : 'service';

      // Extract all code blocks and infer file paths
      const codeBlocks = this.extractAllCodeBlocks(markdown);

      codeBlocks.forEach((block, index) => {
        const inferredPath = this.inferBackendFilePath(block, serviceName, index);
        if (inferredPath) {
          files.push({
            path: inferredPath,
            content: block.content,
            language: block.language
          });
        }
      });
    } else {
      // Frontend: Look for MFE structure
      const mfeNameMatch = markdown.match(/###?\s+(.+?-mfe|Shell Application)/i);
      const mfeName = mfeNameMatch ? mfeNameMatch[1].toLowerCase().replace(/\s+/g, '-') : 'mfe';

      const codeBlocks = this.extractAllCodeBlocks(markdown);

      codeBlocks.forEach((block, index) => {
        const inferredPath = this.inferFrontendFilePath(block, mfeName, index);
        if (inferredPath) {
          files.push({
            path: inferredPath,
            content: block.content,
            language: block.language
          });
        }
      });
    }

    return files;
  }

  /**
   * Extract all code blocks from markdown
   */
  private extractAllCodeBlocks(markdown: string): Array<{ content: string; language: string }> {
    const blocks: Array<{ content: string; language: string }> = [];
    const regex = /```(\w+)?\n([\s\S]+?)\n```/g;

    let match;
    while ((match = regex.exec(markdown)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        content: this.cleanCodeContent(match[2])
      });
    }

    return blocks;
  }

  /**
   * Infer backend file path from code content
   */
  private inferBackendFilePath(block: { content: string; language: string }, serviceName: string, index: number): string | null {
    const { content, language } = block;

    // POM file
    if (language === 'xml' && content.includes('<project')) {
      return `${serviceName}/pom.xml`;
    }

    // Dockerfile
    if (language === 'dockerfile' || content.includes('FROM maven') || content.includes('FROM eclipse-temurin')) {
      return `${serviceName}/Dockerfile`;
    }

    // Application properties/yaml
    if ((language === 'yaml' || language === 'yml') && content.includes('spring:')) {
      if (content.includes('profiles:') || content.includes('active:')) {
        return `${serviceName}/src/main/resources/application.yml`;
      } else if (content.includes('docker')) {
        return `${serviceName}/src/main/resources/application-docker.yml`;
      } else {
        return `${serviceName}/src/main/resources/application-dev.yml`;
      }
    }

    // Java files
    if (language === 'java') {
      // Extract package and class name
      const packageMatch = content.match(/package\s+([\w.]+);/);
      const classMatch = content.match(/(?:public\s+)?(?:class|interface|enum)\s+(\w+)/);

      if (packageMatch && classMatch) {
        const packagePath = packageMatch[1].replace(/\./g, '/');
        const className = classMatch[1];
        return `${serviceName}/src/main/java/${packagePath}/${className}.java`;
      }
    }

    return null;
  }

  /**
   * Infer frontend file path from code content
   */
  private inferFrontendFilePath(block: { content: string; language: string }, mfeName: string, index: number): string | null {
    const { content, language } = block;

    // package.json
    if (language === 'json' && content.includes('"name"') && content.includes('"dependencies"')) {
      return `${mfeName}/package.json`;
    }

    // Angular.json
    if (language === 'json' && content.includes('"$schema"') && content.includes('angular')) {
      return `${mfeName}/angular.json`;
    }

    // tsconfig.json
    if (language === 'json' && content.includes('"compilerOptions"')) {
      return `${mfeName}/tsconfig.json`;
    }

    // webpack.config.js
    if (language === 'javascript' && content.includes('ModuleFederationPlugin')) {
      return `${mfeName}/webpack.config.js`;
    }

    // Dockerfile
    if (language === 'dockerfile' || content.includes('FROM node')) {
      return `${mfeName}/Dockerfile`;
    }

    // nginx.conf
    if (content.includes('server {') && content.includes('listen 80')) {
      return `${mfeName}/nginx.conf`;
    }

    // TypeScript/HTML/CSS files
    if (language === 'typescript') {
      if (content.includes('@Component')) {
        const selectorMatch = content.match(/selector:\s*['"]app-(\w+)['"]/);
        const componentName = selectorMatch ? selectorMatch[1] : `component-${index}`;
        return `${mfeName}/src/app/components/${componentName}/${componentName}.component.ts`;
      } else if (content.includes('@Injectable')) {
        const classMatch = content.match(/export\s+class\s+(\w+)/);
        const serviceName = classMatch ? this.toKebabCase(classMatch[1]) : `service-${index}`;
        return `${mfeName}/src/app/services/${serviceName}.ts`;
      } else if (content.includes('export const routes')) {
        return `${mfeName}/src/app/app.routes.ts`;
      }
    }

    if (language === 'html') {
      return `${mfeName}/src/index.html`;
    }

    if (language === 'css' || language === 'scss') {
      return `${mfeName}/src/styles.${language}`;
    }

    return null;
  }

  /**
   * Clean file path from markdown formatting
   */
  private cleanFilePath(filePath: string): string {
    return filePath
      .trim()
      .replace(/^\*\*|\*\*$/g, '') // Remove bold markers
      .replace(/^File:\s*/i, '') // Remove "File:" prefix
      .replace(/^`|`$/g, '') // Remove backticks
      .replace(/^\//, ''); // Remove leading slash
  }

  /**
   * Clean code content (remove extra spaces, normalize line endings)
   */
  private cleanCodeContent(content: string): string {
    return content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .trimEnd() + '\n'; // Ensure file ends with newline
  }

  /**
   * Detect language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.java': 'java',
      '.xml': 'xml',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.ts': 'typescript',
      '.js': 'javascript',
      '.json': 'json',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.md': 'markdown',
      '.sh': 'bash'
    };

    return languageMap[ext] || 'text';
  }

  /**
   * Validate if extracted file is valid
   */
  private isValidFile(filePath: string, content: string): boolean {
    // Must have file path
    if (!filePath || filePath.length === 0) return false;

    // Must have content
    if (!content || content.trim().length === 0) return false;

    // File path should not contain markdown symbols
    if (filePath.includes('*') || filePath.includes('#')) return false;

    // Should have file extension
    if (!path.extname(filePath)) return false;

    return true;
  }

  /**
   * Convert PascalCase to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }

  /**
   * Generate file tree summary
   */
  generateFileTree(files: ExtractedFile[]): string {
    const tree: Record<string, any> = {};

    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = 'file';
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      });
    });

    return this.renderTree(tree, '');
  }

  private renderTree(node: any, prefix: string): string {
    let result = '';
    const entries = Object.entries(node);

    entries.forEach(([key, value], index) => {
      const isLast = index === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = isLast ? '    ' : '│   ';

      result += `${prefix}${connector}${key}\n`;

      if (typeof value === 'object') {
        result += this.renderTree(value, prefix + childPrefix);
      }
    });

    return result;
  }
}

export default new CodeExtractorService();
