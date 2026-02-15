import fs from 'fs-extra';
import path from 'path';
import logger from '../utils/logger';

/**
 * Extracts and writes code files from ARK agent markdown output
 *
 * ARK agents generate complete code in markdown code blocks like:
 * **filename.java:**
 * ```java
 * [code here]
 * ```
 */
export class ArkCodeExtractor {

  /**
   * Extract all code blocks from ARK markdown output and write to disk
   */
  async extractAndWriteCode(
    arkMarkdown: string,
    basePath: string,
    serviceOrMfeName: string
  ): Promise<{ filesWritten: string[], errors: string[] }> {
    logger.info(`📦 Extracting code from ARK output for ${serviceOrMfeName}`);

    const filesWritten: string[] = [];
    const errors: string[] = [];

    try {
      // Parse markdown to find code blocks with filenames
      const codeBlocks = this.parseCodeBlocks(arkMarkdown);

      logger.info(`Found ${codeBlocks.length} code blocks in ARK output`);

      for (const block of codeBlocks) {
        try {
          // Check if filepath already includes service/MFE name to avoid duplication
          // e.g., "auth-service/pom.xml" should not become "auth-service/auth-service/pom.xml"
          let fullPath: string;
          if (block.filepath.startsWith(serviceOrMfeName + '/')) {
            // Filepath already has service name prefix
            fullPath = path.join(basePath, block.filepath);
          } else {
            // Filepath is relative, add service name
            fullPath = path.join(basePath, serviceOrMfeName, block.filepath);
          }

          // Ensure directory exists
          await fs.ensureDir(path.dirname(fullPath));

          // Write file
          await fs.writeFile(fullPath, block.code, 'utf-8');

          filesWritten.push(fullPath);
          logger.info(`✅ Wrote ${block.filepath} (${block.code.length} bytes)`);

        } catch (fileError: any) {
          const error = `Failed to write ${block.filepath}: ${fileError.message}`;
          logger.error(error);
          errors.push(error);
        }
      }

      logger.info(`✅ Wrote ${filesWritten.length} files for ${serviceOrMfeName}`);

      return { filesWritten, errors };

    } catch (error: any) {
      logger.error(`Failed to extract code for ${serviceOrMfeName}:`, error);
      throw error;
    }
  }

  /**
   * Parse ARK markdown to extract code blocks with their filenames
   *
   * Format:
   * **src/main/java/com/example/Service.java:**
   * ```java
   * package com.example;
   * public class Service { }
   * ```
   */
  private parseCodeBlocks(markdown: string): Array<{ filepath: string, language: string, code: string }> {
    const blocks: Array<{ filepath: string, language: string, code: string }> = [];

    // Regex to match:
    // **filepath:** (optional newlines)
    // ```language
    // code
    // ```
    const codeBlockPattern = /\*\*([^*]+?):\*\*\s*\n+```(\w+)\n([\s\S]*?)```/g;

    let match;
    let matchCount = 0;
    while ((match = codeBlockPattern.exec(markdown)) !== null) {
      matchCount++;
      const filepath = match[1].trim();
      const language = match[2];
      const code = match[3];

      // Clean up filepath (remove leading ./ or /)
      const cleanFilepath = filepath.replace(/^\.?\//, '');

      blocks.push({
        filepath: cleanFilepath,
        language,
        code: code.trim()
      });

      if (matchCount <= 5) {
        logger.info(`  📄 Found code block #${matchCount}: ${cleanFilepath} (${language}, ${code.length} bytes)`);
      }
    }

    if (matchCount === 0) {
      logger.warn('⚠️ NO code blocks matched the expected pattern!');
      logger.warn('   Expected format: **filepath:**\\n```language\\ncode\\n```');
      logger.warn(`   Markdown preview (first 500 chars): ${markdown.substring(0, 500)}`);
    } else {
      logger.info(`✅ Total code blocks found: ${matchCount}`);
    }

    return blocks;
  }

  /**
   * Extract complete microservice structure from ARK service-generator output
   */
  async extractMicroservice(
    arkOutput: string,
    outputDir: string,
    serviceName: string
  ): Promise<{ success: boolean, filesWritten: number, errors: string[] }> {
    logger.info(`🔧 Extracting microservice: ${serviceName}`);

    try {
      const result = await this.extractAndWriteCode(arkOutput, outputDir, serviceName);

      return {
        success: result.errors.length === 0,
        filesWritten: result.filesWritten.length,
        errors: result.errors
      };

    } catch (error: any) {
      logger.error(`Failed to extract microservice ${serviceName}:`, error);
      return {
        success: false,
        filesWritten: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Extract monolithic backend from ARK monolithic-backend-generator output
   * Files are prefixed with "backend/" in the markdown
   */
  async extractMonolithicBackend(
    arkOutput: string,
    outputDir: string
  ): Promise<{ success: boolean, filesWritten: number, errors: string[] }> {
    logger.info(`🔧 Extracting monolithic backend`);

    try {
      // Extract with empty service name since paths already include "backend/"
      const result = await this.extractAndWriteCode(arkOutput, outputDir, '');

      return {
        success: result.errors.length === 0,
        filesWritten: result.filesWritten.length,
        errors: result.errors
      };

    } catch (error: any) {
      logger.error(`Failed to extract monolithic backend:`, error);
      return {
        success: false,
        filesWritten: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Extract monolithic frontend from ARK monolithic-frontend-generator output
   * Files are prefixed with "frontend/" in the markdown
   */
  async extractMonolithicFrontend(
    arkOutput: string,
    outputDir: string
  ): Promise<{ success: boolean, filesWritten: number, errors: string[] }> {
    logger.info(`🎨 Extracting monolithic frontend`);

    try {
      // Extract with empty service name since paths already include "frontend/"
      const result = await this.extractAndWriteCode(arkOutput, outputDir, '');

      return {
        success: result.errors.length === 0,
        filesWritten: result.filesWritten.length,
        errors: result.errors
      };

    } catch (error: any) {
      logger.error(`Failed to extract monolithic frontend:`, error);
      return {
        success: false,
        filesWritten: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Extract complete micro-frontend structure from ARK frontend-migrator output
   */
  async extractMicroFrontend(
    arkOutput: string,
    outputDir: string,
    mfeName: string
  ): Promise<{ success: boolean, filesWritten: number, errors: string[] }> {
    logger.info(`🎨 Extracting micro-frontend: ${mfeName}`);

    try {
      const result = await this.extractAndWriteCode(arkOutput, outputDir, mfeName);

      return {
        success: result.errors.length === 0,
        filesWritten: result.filesWritten.length,
        errors: result.errors
      };

    } catch (error: any) {
      logger.error(`Failed to extract micro-frontend ${mfeName}:`, error);
      return {
        success: false,
        filesWritten: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Parse service names from ARK output
   * Looks for headers like "### 1. auth-service" or "## auth-service"
   */
  parseServiceNames(arkOutput: string): string[] {
    const serviceNames: string[] = [];

    // Pattern 1: Markdown headers with service names
    // ### 1. auth-service, ## auth-service, ### auth-service
    const headerPattern1 = /##+ (?:\d+\.\s+)?([a-z]+-service)/gi;

    // Pattern 2: Bold text with service names
    // **auth-service**, **1. auth-service**
    const headerPattern2 = /\*\*(?:\d+\.\s+)?([a-z]+-service)\*\*/gi;

    // Pattern 3: Service names in code block filenames
    // **auth-service/pom.xml:**
    const filepathPattern = /\*\*([a-z]+-service)\/[^*]+:\*\*/gi;

    // Pattern 4: Any word ending in -service (case insensitive)
    // Auth-Service, AUTH-SERVICE, auth-service
    const anyServicePattern = /\b([a-z]+-service)\b/gi;

    let match;

    // Try Pattern 1
    while ((match = headerPattern1.exec(arkOutput)) !== null) {
      const serviceName = match[1].toLowerCase();
      if (!serviceNames.includes(serviceName)) {
        serviceNames.push(serviceName);
        logger.info(`Found service (Pattern 1 - header): ${serviceName}`);
      }
    }

    // Try Pattern 2
    headerPattern2.lastIndex = 0;
    while ((match = headerPattern2.exec(arkOutput)) !== null) {
      const serviceName = match[1].toLowerCase();
      if (!serviceNames.includes(serviceName)) {
        serviceNames.push(serviceName);
        logger.info(`Found service (Pattern 2 - bold): ${serviceName}`);
      }
    }

    // Try Pattern 3 (most reliable - from actual code blocks)
    filepathPattern.lastIndex = 0;
    while ((match = filepathPattern.exec(arkOutput)) !== null) {
      const serviceName = match[1].toLowerCase();
      if (!serviceNames.includes(serviceName)) {
        serviceNames.push(serviceName);
        logger.info(`Found service (Pattern 3 - filepath): ${serviceName}`);
      }
    }

    // Try Pattern 4 as fallback
    if (serviceNames.length === 0) {
      logger.warn('⚠️ No services found with patterns 1-3, trying fallback pattern');
      anyServicePattern.lastIndex = 0;
      while ((match = anyServicePattern.exec(arkOutput)) !== null) {
        const serviceName = match[1].toLowerCase();
        if (!serviceNames.includes(serviceName)) {
          serviceNames.push(serviceName);
          logger.info(`Found service (Pattern 4 - fallback): ${serviceName}`);
        }
      }
    }

    return serviceNames;
  }

  /**
   * Parse micro-frontend names from ARK output
   */
  parseMfes(arkOutput: string): string[] {
    const mfeNames: string[] = [];

    // Pattern 1: Explicit mfe/shell/app names (e.g., "## shell-app", "## auth-mfe")
    const pattern1 = /##+ (?:\d+\.\s+)?([a-z]+-(?:mfe|shell|app))/gi;

    // Pattern 2: "Shell Application" → "shell-app"
    const pattern2 = /##+ (?:\d+\.\s+)?Shell Application/gi;

    // Pattern 3: "Auth MFE" → "auth-mfe"
    const pattern3 = /##+ (?:\d+\.\s+)?(\w+)\s+MFE/gi;

    // Pattern 4: "Dashboard Micro-Frontend" → "dashboard-mfe"
    const pattern4 = /##+ (?:\d+\.\s+)?(\w+)\s+Micro-?Frontend/gi;

    let match;

    // Try Pattern 1
    while ((match = pattern1.exec(arkOutput)) !== null) {
      const mfeName = match[1].toLowerCase();
      if (!mfeNames.includes(mfeName)) {
        mfeNames.push(mfeName);
      }
    }

    // Try Pattern 2
    if (arkOutput.match(pattern2)) {
      if (!mfeNames.includes('shell-app')) {
        mfeNames.push('shell-app');
      }
    }

    // Try Pattern 3
    pattern3.lastIndex = 0;
    while ((match = pattern3.exec(arkOutput)) !== null) {
      const mfeName = `${match[1].toLowerCase()}-mfe`;
      if (!mfeNames.includes(mfeName)) {
        mfeNames.push(mfeName);
      }
    }

    // Try Pattern 4
    pattern4.lastIndex = 0;
    while ((match = pattern4.exec(arkOutput)) !== null) {
      const mfeName = `${match[1].toLowerCase()}-mfe`;
      if (!mfeNames.includes(mfeName)) {
        mfeNames.push(mfeName);
      }
    }

    return mfeNames;
  }
}

export default new ArkCodeExtractor();
