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
          const fullPath = path.join(basePath, serviceOrMfeName, block.filepath);

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
    while ((match = codeBlockPattern.exec(markdown)) !== null) {
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

    // Match patterns like:
    // ### 1. auth-service
    // ## auth-service
    // ### auth-service
    const headerPattern = /##+ (?:\d+\.\s+)?([a-z]+-service)/gi;

    let match;
    while ((match = headerPattern.exec(arkOutput)) !== null) {
      const serviceName = match[1].toLowerCase();
      if (!serviceNames.includes(serviceName)) {
        serviceNames.push(serviceName);
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
