import axios from 'axios';
import logger from '../utils/logger';

/**
 * ARK Chat Service - Uses ARK agents instead of direct Anthropic API
 * Calls the migration-planner agent through ARK for intelligent chat
 */
class ArkChatService {
  private arkApiUrl: string;
  private arkNamespace: string;
  private agentName = 'migration-planner';

  constructor() {
    this.arkApiUrl = process.env.ARK_API_URL || 'http://localhost:8080';
    this.arkNamespace = process.env.ARK_NAMESPACE || 'default';  // Changed from 'banque-migration' to 'default'

    logger.info('ARK Chat Service initialized', {
      arkUrl: this.arkApiUrl,
      namespace: this.arkNamespace,
      agent: this.agentName
    });
  }

  /**
   * Process migration plan chat message through ARK
   */
  async processPlanChat(
    message: string,
    currentPlan: any,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<{
    response: string;
    updatedPlan: any | null;
    planModified: boolean;
    suggestedActions?: string[];
  }> {
    try {
      // Build the prompt for the ARK agent
      const prompt = this.buildChatPrompt(message, currentPlan, conversationHistory);

      logger.info('Sending request to ARK agent', {
        agent: this.agentName,
        messageLength: message.length,
        historyLength: conversationHistory.length
      });

      // Call ARK API using OpenAI-compatible endpoint
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
          metadata: {
            currentPlan,
            conversationHistory,
            userMessage: message,
            task: 'plan-chat'
          }
        },
        {
          timeout: 60000, // 60 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const agentOutput = response.data.choices?.[0]?.message?.content || '';

      logger.info('Received response from ARK agent', {
        responseLength: agentOutput.length,
        status: response.status
      });

      // Check if the agent suggests plan modifications
      const planModification = this.extractPlanModification(agentOutput, currentPlan);

      return {
        response: agentOutput,
        updatedPlan: planModification.updatedPlan,
        planModified: planModification.modified,
        suggestedActions: planModification.actions
      };

    } catch (error: any) {
      logger.error('ARK Chat Service error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data
      });

      // Check if ARK is not running
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return {
          response: `**ARK System Not Available**\n\nThe ARK agent system at ${this.arkApiUrl} is not responding.\n\nPlease ensure:\n1. ARK is running: Check if the ARK service is started\n2. Correct URL: Verify ARK_API_URL in .env\n3. Agent exists: migration-planner agent should be deployed\n\nFor now, I can provide basic information about your plan using pattern matching.`,
          updatedPlan: null,
          planModified: false
        };
      }

      // Return helpful error message
      return {
        response: `I encountered an error communicating with the ARK agent system: ${error.message}\n\nPlease check:\n- ARK service is running\n- migration-planner agent is deployed\n- Network connectivity to ${this.arkApiUrl}`,
        updatedPlan: null,
        planModified: false
      };
    }
  }

  /**
   * Build comprehensive prompt for ARK agent
   */
  private buildChatPrompt(
    message: string,
    currentPlan: any,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): string {
    const microservices = currentPlan.microservices || [];
    const microFrontends = currentPlan.microFrontends || [];

    let prompt = `You are assisting with migration planning chat. The user has a question or request about their migration plan.\n\n`;

    // Add current plan context
    prompt += `**Current Migration Plan:**\n\n`;
    prompt += `**Microservices (${microservices.length}):**\n`;
    microservices.forEach((svc: any, idx: number) => {
      prompt += `${idx + 1}. ${svc.name || svc.displayName} (Port ${svc.port})\n`;
      prompt += `   - Database: ${svc.database}\n`;
      if (svc.entities && svc.entities.length > 0) {
        prompt += `   - Entities: ${svc.entities.join(', ')}\n`;
      }
      if (svc.endpoints && svc.endpoints.length > 0) {
        prompt += `   - Endpoints: ${svc.endpoints.length} APIs\n`;
      }
    });

    prompt += `\n**Micro-Frontends (${microFrontends.length}):**\n`;
    microFrontends.forEach((mfe: any, idx: number) => {
      prompt += `${idx + 1}. ${mfe.name} (Port ${mfe.port})`;
      if (mfe.isHost) prompt += ` [Host/Shell]`;
      prompt += `\n`;
    });

    // Add conversation history if exists
    if (conversationHistory.length > 0) {
      prompt += `\n**Previous Conversation:**\n`;
      conversationHistory.slice(-3).forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 200)}...\n`;
      });
    }

    // Add current user message
    prompt += `\n**Current User Message:**\n${message}\n\n`;

    // Add instructions for the agent
    prompt += `**Instructions:**\n`;
    prompt += `1. Provide a helpful, professional response to the user's message\n`;
    prompt += `2. If the user requests changes to the plan (combine, split, modify services), explain the implications\n`;
    prompt += `3. If you recommend plan modifications, wrap the updated plan in <PLAN_UPDATE> tags with JSON format\n`;
    prompt += `4. Be conversational but professional - no emojis\n`;
    prompt += `5. Provide specific, actionable advice\n\n`;

    prompt += `**Example Plan Update Format:**\n`;
    prompt += `<PLAN_UPDATE>\n`;
    prompt += `{\n`;
    prompt += `  "microservices": [...updated services...],\n`;
    prompt += `  "microFrontends": [...updated frontends...],\n`;
    prompt += `  "changes": ["Description of changes made"]\n`;
    prompt += `}\n`;
    prompt += `</PLAN_UPDATE>\n\n`;

    prompt += `Now respond to the user's message.`;

    return prompt;
  }

  /**
   * Extract plan modifications from agent response
   */
  private extractPlanModification(agentOutput: string, currentPlan: any): {
    modified: boolean;
    updatedPlan: any | null;
    actions: string[];
  } {
    // Check if response contains plan update
    const planUpdateMatch = agentOutput.match(/<PLAN_UPDATE>([\s\S]*?)<\/PLAN_UPDATE>/);

    if (planUpdateMatch) {
      try {
        const planUpdate = JSON.parse(planUpdateMatch[1].trim());

        return {
          modified: true,
          updatedPlan: {
            ...currentPlan,
            ...planUpdate,
            updatedAt: new Date().toISOString()
          },
          actions: planUpdate.changes || []
        };
      } catch (error) {
        logger.error('Failed to parse plan update from ARK agent response', error);
      }
    }

    return {
      modified: false,
      updatedPlan: null,
      actions: []
    };
  }

  /**
   * Fallback response when ARK is not available (simple pattern matching)
   */
  fallbackResponse(message: string, plan: any): {
    response: string;
    updatedPlan: any | null;
    planModified: boolean;
  } {
    const lowerMessage = message.toLowerCase();

    // Basic pattern matching for common questions
    if (lowerMessage.includes('how many') && lowerMessage.includes('service')) {
      const count = plan.microservices?.length || 0;
      return {
        response: `The migration plan includes **${count} microservices**.\n\n**Note:** For intelligent AI assistance, ensure the ARK agent system is running at ${this.arkApiUrl}.`,
        updatedPlan: null,
        planModified: false
      };
    }

    if (lowerMessage.includes('micro-frontend') || lowerMessage.includes('mfe')) {
      const count = plan.microFrontends?.length || 0;
      return {
        response: `The plan includes **${count} micro-frontends** using Module Federation.\n\n**Note:** For detailed architecture discussions, ensure ARK is running.`,
        updatedPlan: null,
        planModified: false
      };
    }

    return {
      response: `**ARK Agent System Required**\n\nTo use intelligent migration planning chat:\n\n1. Ensure ARK is running at: ${this.arkApiUrl}\n2. Verify migration-planner agent is deployed\n3. Check ARK_API_URL and ARK_NAMESPACE in .env\n\nFor now, I can provide basic plan information. The current plan has ${plan.microservices?.length || 0} microservices and ${plan.microFrontends?.length || 0} micro-frontends.`,
      updatedPlan: null,
      planModified: false
    };
  }

  /**
   * Check if ARK is available
   */
  async isArkAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.arkApiUrl}/health`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Process code analyzer chat - Answer ANY technical question about uploaded code
   */
  async processCodeChat(
    message: string,
    codeAnalysis: any,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<{
    response: string;
    error?: string;
  }> {
    try {
      // Build comprehensive prompt with ALL code details
      const prompt = this.buildCodeAnalysisPrompt(message, codeAnalysis, conversationHistory);

      logger.info('Sending code analysis chat request to ARK', {
        agent: 'code-documentation',
        messageLength: message.length,
        historyLength: conversationHistory.length,
        hasCodeAnalysis: !!codeAnalysis
      });

      // Call ARK API with code-documentation agent
      const response = await axios.post(
        `${this.arkApiUrl}/api/v1/agents/${this.arkNamespace}/code-documentation/invoke`,
        {
          input: prompt,
          context: {
            codeAnalysis,
            conversationHistory,
            userMessage: message,
            task: 'code-chat'
          }
        },
        {
          timeout: 180000, // 3 minute timeout for large code analysis
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const agentOutput = response.data.output || response.data.result || '';

      logger.info('Received code analysis response from ARK', {
        responseLength: agentOutput.length,
        status: response.status
      });

      return {
        response: agentOutput
      };

    } catch (error: any) {
      logger.error('Code Analyzer Chat error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data
      });

      // Check if ARK is not running
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return {
          response: `**ARK System Not Available**\n\nThe ARK agent system at ${this.arkApiUrl} is not responding.\n\nFor code analysis chat to work, please ensure:\n1. ARK is running\n2. code-documentation agent is deployed\n\nIn the meantime, I can provide basic information about your code based on the analysis summary.`,
          error: 'ARK_NOT_AVAILABLE'
        };
      }

      return {
        response: `I encountered an error: ${error.message}\n\nPlease check that the ARK service is running and accessible.`,
        error: error.message
      };
    }
  }

  /**
   * Build comprehensive code analysis prompt with FULL code context
   */
  private buildCodeAnalysisPrompt(
    message: string,
    codeAnalysis: any,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): string {
    let prompt = `You are an expert code analysis assistant. You have deep knowledge of the user's codebase and can answer ANY technical question about it.\n\n`;

    prompt += `**YOUR ROLE:**\n`;
    prompt += `- Answer technical questions about the codebase with precision\n`;
    prompt += `- Explain code structure, patterns, and architecture\n`;
    prompt += `- Provide code examples when relevant\n`;
    prompt += `- Be thorough but concise\n`;
    prompt += `- No emojis, professional tone\n\n`;

    // Add FULL code context
    prompt += `**COMPLETE CODEBASE ANALYSIS:**\n\n`;

    // Detailed Entities
    if (codeAnalysis.detailedAnalysis?.entities?.length > 0) {
      prompt += `**ENTITIES (${codeAnalysis.detailedAnalysis.entities.length}):**\n\n`;
      codeAnalysis.detailedAnalysis.entities.forEach((entity: any) => {
        prompt += `**${entity.name}**\n`;
        prompt += `File: ${entity.filePath}\n`;
        if (entity.properties && entity.properties.length > 0) {
          prompt += `Properties:\n`;
          entity.properties.forEach((prop: any) => {
            prompt += `  - ${prop.name}: ${prop.type}\n`;
          });
        }
        if (entity.annotations) {
          prompt += `Annotations: ${entity.annotations.join(', ')}\n`;
        }
        prompt += `\n`;
      });
    }

    // Detailed Controllers
    if (codeAnalysis.detailedAnalysis?.controllers?.length > 0) {
      prompt += `**CONTROLLERS (${codeAnalysis.detailedAnalysis.controllers.length}):**\n\n`;
      codeAnalysis.detailedAnalysis.controllers.forEach((controller: any) => {
        prompt += `**${controller.name}**\n`;
        prompt += `File: ${controller.filePath}\n`;
        if (controller.endpoints && controller.endpoints.length > 0) {
          prompt += `Endpoints:\n`;
          controller.endpoints.forEach((endpoint: any) => {
            prompt += `  - ${endpoint.method} ${endpoint.path} → ${endpoint.methodName}\n`;
          });
        }
        prompt += `\n`;
      });
    }

    // Services
    if (codeAnalysis.detailedAnalysis?.services?.length > 0) {
      prompt += `**SERVICES (${codeAnalysis.detailedAnalysis.services.length}):**\n\n`;
      codeAnalysis.detailedAnalysis.services.forEach((service: any) => {
        prompt += `**${service.name}**\n`;
        prompt += `File: ${service.filePath}\n`;
        if (service.methods) {
          prompt += `Methods: ${service.methods.join(', ')}\n`;
        }
        prompt += `\n`;
      });
    }

    // Architecture Summary
    if (codeAnalysis.summary) {
      prompt += `**ARCHITECTURE SUMMARY:**\n`;
      prompt += `Framework: ${codeAnalysis.framework || 'N/A'}\n`;
      prompt += `Controllers: ${codeAnalysis.controllers || 0}\n`;
      prompt += `Entities: ${codeAnalysis.entities?.length || 0}\n`;
      prompt += `Total Endpoints: ${codeAnalysis.totalEndpoints || 0}\n\n`;
    }

    // Add conversation history
    if (conversationHistory.length > 0) {
      prompt += `**PREVIOUS CONVERSATION:**\n`;
      conversationHistory.slice(-5).forEach(msg => {
        const content = msg.content.length > 300 ? msg.content.substring(0, 300) + '...' : msg.content;
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${content}\n`;
      });
      prompt += `\n`;
    }

    // Current question
    prompt += `**CURRENT USER QUESTION:**\n${message}\n\n`;

    prompt += `**INSTRUCTIONS:**\n`;
    prompt += `1. Answer the user's question with precision using the code analysis data above\n`;
    prompt += `2. Reference specific files, classes, methods when relevant\n`;
    prompt += `3. If asking about a specific entity/controller/service, provide complete details\n`;
    prompt += `4. If the question is about code patterns or architecture, explain with examples from the codebase\n`;
    prompt += `5. If you don't have enough information to answer, say so clearly\n`;
    prompt += `6. Be professional, no emojis\n`;
    prompt += `7. Format code snippets in markdown code blocks when showing examples\n\n`;

    prompt += `Now provide a comprehensive answer to the user's question based on the codebase analysis above.`;

    return prompt;
  }

  /**
   * Analyze repository code using ARK code-analyzer agent
   * Instead of local parsing, uses AI to intelligently analyze the codebase
   */
  async analyzeRepositoryWithARK(
    repoPath: string,
    framework?: string
  ): Promise<{
    success: boolean;
    analysis?: any;
    error?: string;
  }> {
    try {
      logger.info('Starting ARK-powered code analysis', {
        repoPath,
        framework,
        agent: 'code-analyzer'
      });

      // Import fs and path for file reading
      const fs = require('fs-extra');
      const path = require('path');
      const glob = require('glob');

      logger.info(`🔍 Scanning repository for source files`, {
        repoPath,
        absolutePath: path.resolve(repoPath)
      });

      // Find all relevant source files - BACKEND AND FRONTEND
      const javaFiles = glob.sync(`${repoPath}/**/*.java`, { ignore: '**/node_modules/**' });
      const csFiles = glob.sync(`${repoPath}/**/*.cs`, { ignore: '**/node_modules/**' });

      // Frontend files - JavaScript/TypeScript frameworks
      const tsFiles = glob.sync(`${repoPath}/**/*.ts`, { ignore: ['**/node_modules/**', '**/*.spec.ts', '**/*.d.ts'] });
      const tsxFiles = glob.sync(`${repoPath}/**/*.tsx`, { ignore: '**/node_modules/**' });
      const jsFiles = glob.sync(`${repoPath}/**/*.js`, { ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'] });
      const jsxFiles = glob.sync(`${repoPath}/**/*.jsx`, { ignore: '**/node_modules/**' });
      const vueFiles = glob.sync(`${repoPath}/**/*.vue`, { ignore: '**/node_modules/**' });

      // .NET Frontend files
      const razorFiles = glob.sync(`${repoPath}/**/*.razor`, { ignore: '**/node_modules/**' });
      const cshtmlFiles = glob.sync(`${repoPath}/**/*.cshtml`, { ignore: '**/node_modules/**' });
      const aspxFiles = glob.sync(`${repoPath}/**/*.aspx`, { ignore: '**/node_modules/**' });
      const ascxFiles = glob.sync(`${repoPath}/**/*.ascx`, { ignore: '**/node_modules/**' });

      // Angular-specific files (already counted in tsFiles)
      const angularComponentFiles = glob.sync(`${repoPath}/**/*.component.ts`, { ignore: '**/node_modules/**' });
      const angularServiceFiles = glob.sync(`${repoPath}/**/*.service.ts`, { ignore: '**/node_modules/**' });
      const angularModuleFiles = glob.sync(`${repoPath}/**/*.module.ts`, { ignore: '**/node_modules/**' });

      const allFiles = [
        ...javaFiles,
        ...csFiles,
        ...tsFiles,
        ...tsxFiles,
        ...jsFiles,
        ...jsxFiles,
        ...vueFiles,
        ...razorFiles,
        ...cshtmlFiles,
        ...aspxFiles,
        ...ascxFiles
      ];

      const totalFrontendFiles = tsFiles.length + tsxFiles.length + jsFiles.length + jsxFiles.length + vueFiles.length + razorFiles.length + cshtmlFiles.length + aspxFiles.length + ascxFiles.length;
      const totalBackendFiles = javaFiles.length + csFiles.length;

      logger.info(`📁 Found ${allFiles.length} source files in repository`, {
        backend: {
          java: javaFiles.length,
          csharp: csFiles.length,
          total: totalBackendFiles
        },
        frontend: {
          typescript: tsFiles.length,
          tsx: tsxFiles.length,
          javascript: jsFiles.length,
          jsx: jsxFiles.length,
          vue: vueFiles.length,
          dotnet: {
            razor: razorFiles.length,
            cshtml: cshtmlFiles.length,
            aspx: aspxFiles.length,
            ascx: ascxFiles.length
          },
          total: totalFrontendFiles
        },
        totalFiles: allFiles.length,
        sampleFrontendPaths: [
          ...tsFiles.slice(0, 2),
          ...tsxFiles.slice(0, 2),
          ...razorFiles.slice(0, 2),
          ...cshtmlFiles.slice(0, 2)
        ],
        repoPath
      });

      if (totalFrontendFiles === 0) {
        logger.warn(`⚠️ No frontend files found in repository: ${repoPath}`);
        logger.warn('   Make sure the repository contains .ts, .tsx, .js, .jsx, .vue, or .razor files');
      }

      // ENVOYER TOUS LES FICHIERS - pas de limite!
      const frontendFilesArray = [
        ...razorFiles, ...cshtmlFiles, ...aspxFiles, ...ascxFiles,
        ...tsFiles, ...tsxFiles, ...jsFiles, ...jsxFiles, ...vueFiles
      ];
      const backendFilesArray = [...javaFiles, ...csFiles];

      // Stratégie: Tous les fichiers frontend d'abord, puis tous les fichiers backend
      const filesToAnalyze = [
        ...frontendFilesArray,  // TOUS les fichiers frontend
        ...backendFilesArray     // TOUS les fichiers backend
      ];  // SANS LIMITE!

      logger.info(`📋 Files selected for analysis (ALL FILES)`, {
        totalSelected: filesToAnalyze.length,
        frontendSelected: frontendFilesArray.length,
        backendSelected: backendFilesArray.length
      });

      // Read file contents - TOUS les fichiers
      const fileContents = await Promise.all(
        filesToAnalyze.map(async (filePath) => {
          const content = await fs.readFile(filePath, 'utf-8');
          const relativePath = path.relative(repoPath, filePath);
          return {
            path: relativePath,
            content: content.substring(0, 10000) // 10k chars per file
          };
        })
      );

      // Build USER message - agent will use its configured system prompt for formatting
      let userMessage = `ANALYSE OBLIGATOIRE: Vous DEVEZ analyser à la fois le BACKEND ET le FRONTEND dans votre rapport.\n\n`;
      userMessage += `**Repository Path:** ${repoPath}\n`;
      if (framework) {
        userMessage += `**Framework Detected:** ${framework}\n`;
      }
      userMessage += `**Total Files Analyzed:** ${fileContents.length}\n`;

      // Count backend vs frontend files
      const backendFiles = fileContents.filter(f =>
        f.path.endsWith('.java') || f.path.endsWith('.cs')
      ).length;
      const frontendFiles = fileContents.filter(f =>
        f.path.endsWith('.ts') || f.path.endsWith('.tsx') ||
        f.path.endsWith('.js') || f.path.endsWith('.jsx') ||
        f.path.endsWith('.vue') || f.path.endsWith('.razor') ||
        f.path.endsWith('.cshtml') || f.path.endsWith('.aspx') || f.path.endsWith('.ascx')
      ).length;

      userMessage += `**Backend Files:** ${backendFiles} (Java, C#)\n`;
      userMessage += `**Frontend Files:** ${frontendFiles} (TypeScript, JavaScript, Angular, React, Vue, Blazor, ASP.NET Razor, CSHTML)\n\n`;

      if (frontendFiles > 0) {
        userMessage += `🔴 CRITIQUE: ${frontendFiles} fichiers FRONTEND sont inclus ci-dessous. Vous DEVEZ analyser le frontend en détail dans votre rapport!\n\n`;
        userMessage += `Types de fichiers frontend inclus:\n`;
        userMessage += `- .razor (Blazor)\n`;
        userMessage += `- .cshtml (ASP.NET MVC Razor Pages)\n`;
        userMessage += `- .aspx (ASP.NET Web Forms)\n`;
        userMessage += `- .ts/.tsx (TypeScript/React/Angular)\n`;
        userMessage += `- .js/.jsx (JavaScript/React)\n`;
        userMessage += `- .vue (Vue.js)\n\n`;
        userMessage += `Sections OBLIGATOIRES pour le frontend:\n`;
        userMessage += `- Framework et Stack Technologique Frontend (Blazor, ASP.NET MVC, Angular, React, etc.)\n`;
        userMessage += `- Structure des Composants/Pages/Vues (listez TOUS les composants/pages trouvés)\n`;
        userMessage += `- Configuration du Routing\n`;
        userMessage += `- Services et Intégration API\n`;
        userMessage += `- Composants UI identifiés\n\n`;
      }

      userMessage += `**IMPORTANT:** Analyze BOTH backend architecture (entities, APIs, services) AND frontend architecture (components, routing, state management, UI).\n\n`;

      // Log which files are being sent (to verify frontend files are included)
      const sentBackendFiles = fileContents.filter(f =>
        f.path.endsWith('.java') || f.path.endsWith('.cs')
      );
      const sentFrontendFiles = fileContents.filter(f =>
        f.path.endsWith('.ts') || f.path.endsWith('.tsx') ||
        f.path.endsWith('.js') || f.path.endsWith('.jsx') ||
        f.path.endsWith('.vue') || f.path.endsWith('.razor') ||
        f.path.endsWith('.cshtml') || f.path.endsWith('.aspx') || f.path.endsWith('.ascx')
      );

      logger.info('📊 Files being sent to agent:', {
        totalFiles: fileContents.length,
        backendFilesSent: sentBackendFiles.length,
        frontendFilesSent: sentFrontendFiles.length,
        allFilePaths: fileContents.map(f => f.path),
        frontendFilePaths: sentFrontendFiles.map(f => f.path)
      });

      if (sentFrontendFiles.length === 0 && sentBackendFiles.length === 0) {
        logger.warn('⚠️ WARNING: No backend or frontend files found! This might be an issue.');
      }

      if (sentFrontendFiles.length === 0) {
        logger.warn('⚠️ WARNING: No frontend files are being sent to the agent!');
      } else {
        logger.info(`✅ Sending ${sentFrontendFiles.length} frontend files to agent`);
      }

      userMessage += `**SOURCE CODE FILES:**\n\n`;
      fileContents.forEach(file => {
        const fileType = sentFrontendFiles.find(f => f.path === file.path) ? '[FRONTEND]' : '[BACKEND]';
        userMessage += `--- FILE: ${file.path} ${fileType} ---\n`;
        userMessage += `${file.content}\n\n`;
      });

      // Save the user message to a file for debugging
      const debugMessagePath = `/tmp/ark-user-message-${Date.now()}.txt`;
      await fs.writeFile(debugMessagePath, userMessage);

      logger.info('Calling ARK code-analyzer agent (using agent\'s configured system prompt)', {
        filesIncluded: fileContents.length,
        backendFilesSent: sentBackendFiles.length,
        frontendFilesSent: sentFrontendFiles.length,
        messageLength: userMessage.length,
        messagePreview: userMessage.substring(0, 500),
        sampleBackendFiles: sentBackendFiles.slice(0, 3).map(f => f.path),
        sampleFrontendFiles: sentFrontendFiles.slice(0, 5).map(f => f.path),
        debugMessageSavedTo: debugMessagePath
      });

      if (sentFrontendFiles.length > 0) {
        logger.info(`✅ VERIFICATION: ${sentFrontendFiles.length} frontend files ARE in the message`);
        logger.info(`First 3 frontend file paths in message: ${sentFrontendFiles.slice(0, 3).map(f => f.path).join(', ')}`);
      }

      // Call ARK API using OpenAI-compatible endpoint
      // The agent's system prompt (configured in ARK Dashboard) will be used automatically
      const response = await axios.post(
        `${this.arkApiUrl}/openai/v1/chat/completions`,
        {
          model: 'agent/code-analyzer',
          messages: [
            {
              role: 'user',
              content: userMessage
            }
          ],
          metadata: {
            repoPath,
            framework,
            fileCount: allFiles.length,
            task: 'analyze-repository'
          }
        },
        {
          timeout: 300000, // 5 minute timeout for large codebases
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const agentOutput = response.data.choices?.[0]?.message?.content || '';

      logger.info('Received analysis from ARK agent', {
        responseLength: agentOutput.length
      });

      // The agent returns beautifully formatted markdown
      // Parse basic structure from it for metadata, but keep the markdown for display
      const analysis = this.parseMarkdownAnalysis(agentOutput);

      logger.info('Successfully processed analysis from ARK agent', {
        entities: analysis.entities?.length || 0,
        controllers: analysis.controllers?.length || 0,
        framework: analysis.framework,
        hasMarkdown: !!agentOutput
      });

      return {
        success: true,
        analysis,
        rawOutput: agentOutput // Beautiful markdown output for frontend display
      };

    } catch (error: any) {
      logger.error('ARK code analysis failed', {
        message: error.message,
        code: error.code
      });

      // Check if ARK is not running
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return {
          success: false,
          error: `ARK system not available at ${this.arkApiUrl}. Please ensure ARK is running.`
        };
      }

      return {
        success: false,
        error: `Code analysis failed: ${error.message}`
      };
    }
  }

  /**
   * Parse markdown analysis output to extract basic structure
   * Returns minimal structure with counts for compatibility with the rest of the system
   */
  private parseMarkdownAnalysis(markdown: string): any {
    // Extract basic counts from markdown sections
    const entityMatches = markdown.match(/###?\s+([A-Z][a-zA-Z]+(?:Entity)?)/g) || [];
    const endpointMatches = markdown.match(/(?:GET|POST|PUT|DELETE|PATCH)\s+\/[^\s]+/g) || [];

    // Try to detect framework
    let framework = 'Unknown';
    if (markdown.includes('Spring Boot') || markdown.includes('@RestController')) {
      framework = 'Spring Boot';
    } else if (markdown.includes('ASP.NET') || markdown.includes('.NET Core')) {
      framework = 'ASP.NET Core';
    } else if (markdown.includes('Angular') || markdown.includes('TypeScript')) {
      framework = 'Angular';
    } else if (markdown.includes('Blazor')) {
      framework = 'Blazor';
    }

    // Extract entity names from markdown headers
    const entities = Array.from(new Set(entityMatches))
      .map(match => {
        const name = match.replace(/^###?\s+/, '').trim();
        return {
          name,
          filePath: '',
          properties: []
        };
      });

    // Extract endpoints
    const endpoints = endpointMatches.map(match => {
      const [method, path] = match.split(' ');
      return {
        method,
        path: path || '/',
        methodName: ''
      };
    });

    return {
      framework,
      entities,
      controllers: [],
      services: [],
      pages: [],
      summary: {
        totalEntities: entities.length,
        totalControllers: 0,
        totalEndpoints: endpoints.length,
        totalServices: 0,
        note: 'Parsed from markdown output'
      }
    };
  }

  /**
   * Build prompt for ARK code-analyzer agent
   */
  private buildCodeAnalysisPromptForARK(
    repoPath: string,
    fileContents: Array<{ path: string; content: string }>,
    framework?: string
  ): string {
    let prompt = `You are an expert code analyzer. Analyze the provided codebase and extract comprehensive details.\n\n`;

    prompt += `**Repository Path:** ${repoPath}\n`;
    if (framework) {
      prompt += `**Framework Detected:** ${framework}\n`;
    }
    prompt += `**Files Analyzed:** ${fileContents.length}\n\n`;

    prompt += `**YOUR TASK: Perform EXHAUSTIVE analysis and return structured JSON**\n\n`;

    // Add all file contents
    prompt += `**SOURCE CODE FILES:**\n\n`;
    fileContents.forEach(file => {
      prompt += `--- FILE: ${file.path} ---\n`;
      prompt += `${file.content}\n\n`;
    });

    prompt += `\n**ANALYSIS REQUIREMENTS:**\n\n`;
    prompt += `Extract the following with MAXIMUM detail and return as valid JSON:\n\n`;

    prompt += `## 1. ENTITIES (Domain Models)\n`;
    prompt += `For EACH entity, extract:\n`;
    prompt += `- name: Entity class name\n`;
    prompt += `- filePath: Relative file path\n`;
    prompt += `- packageName: Package/namespace\n`;
    prompt += `- annotations: Array of all annotations (@Entity, @Table, etc.)\n`;
    prompt += `- tableName: Database table name\n`;
    prompt += `- properties: Array of property objects with:\n`;
    prompt += `  * name, type, annotations, columnName, nullable, length, defaultValue, javadoc\n`;
    prompt += `- relationships: Array of relationship objects (@OneToMany, @ManyToOne, etc.)\n`;
    prompt += `- javadoc: Class-level documentation\n\n`;

    prompt += `## 2. CONTROLLERS (REST APIs)\n`;
    prompt += `For EACH controller, extract:\n`;
    prompt += `- name: Controller class name\n`;
    prompt += `- filePath: Relative file path\n`;
    prompt += `- packageName: Package/namespace\n`;
    prompt += `- baseMapping: Base URL path\n`;
    prompt += `- annotations: Array of class annotations\n`;
    prompt += `- endpoints: Array of endpoint objects with:\n`;
    prompt += `  * method: HTTP method (GET, POST, PUT, DELETE, PATCH)\n`;
    prompt += `  * path: Full endpoint path\n`;
    prompt += `  * methodName: Java/C# method name\n`;
    prompt += `  * parameters: Array of parameter objects\n`;
    prompt += `  * returnType: Return type\n`;
    prompt += `  * annotations: Method annotations\n`;
    prompt += `  * javadoc: Method documentation\n\n`;

    prompt += `## 3. SERVICES (Business Logic)\n`;
    prompt += `For EACH service, extract:\n`;
    prompt += `- name: Service class name\n`;
    prompt += `- filePath: Relative file path\n`;
    prompt += `- packageName: Package/namespace\n`;
    prompt += `- annotations: Array of annotations (@Service, @Transactional, etc.)\n`;
    prompt += `- methods: Array of method names\n`;
    prompt += `- dependencies: Array of injected dependencies\n\n`;

    prompt += `## 4. PAGES (Frontend - if applicable)\n`;
    prompt += `For EACH page/component:\n`;
    prompt += `- name, filePath, route\n\n`;

    prompt += `**OUTPUT FORMAT:**\n`;
    prompt += `Return ONLY valid JSON in this exact structure:\n`;
    prompt += `\`\`\`json\n`;
    prompt += `{\n`;
    prompt += `  "framework": "Spring Boot" | "ASP.NET Core" | "Angular" | etc,\n`;
    prompt += `  "entities": [/* array of entity objects */],\n`;
    prompt += `  "controllers": [/* array of controller objects */],\n`;
    prompt += `  "services": [/* array of service objects */],\n`;
    prompt += `  "pages": [/* array of page objects */],\n`;
    prompt += `  "summary": {\n`;
    prompt += `    "totalEntities": number,\n`;
    prompt += `    "totalControllers": number,\n`;
    prompt += `    "totalEndpoints": number,\n`;
    prompt += `    "totalServices": number\n`;
    prompt += `  }\n`;
    prompt += `}\n`;
    prompt += `\`\`\`\n\n`;

    prompt += `**CRITICAL RULES:**\n`;
    prompt += `1. Return ONLY the JSON structure above, wrapped in \`\`\`json code block\n`;
    prompt += `2. Be EXHAUSTIVE - extract EVERY entity, controller, service, endpoint\n`;
    prompt += `3. Include ALL annotations, properties, methods\n`;
    prompt += `4. Ensure STRICT valid JSON syntax:\n`;
    prompt += `   - NO trailing commas in arrays or objects\n`;
    prompt += `   - Use double quotes for all strings\n`;
    prompt += `   - NO comments\n`;
    prompt += `   - Properly close all brackets and braces\n`;
    prompt += `5. If a field is not present, use empty array [] or null\n`;
    prompt += `6. Test your JSON is valid before returning\n\n`;

    prompt += `Start your analysis now and return the valid JSON structure.`;

    return prompt;
  }

  /**
   * BULLETPROOF JSON sanitizer - Removes ALL problematic characters
   * Handles control characters, trailing commas, malformed strings, etc.
   */
  private fixCommonJSONErrors(jsonStr: string): string {
    try {
      // STEP 1: Remove ALL control characters (except \n, \r, \t in proper escape sequences)
      // This fixes "Bad control character" errors
      jsonStr = jsonStr.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');

      // STEP 2: Remove comments
      jsonStr = jsonStr.replace(/\/\/[^\n]*/g, '');
      jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');

      // STEP 3: Fix strings with unescaped newlines/tabs
      // Replace literal newlines inside strings with escaped \n
      jsonStr = jsonStr.replace(/"([^"]*?)\n([^"]*?)"/g, '"$1\\n$2"');
      jsonStr = jsonStr.replace(/"([^"]*?)\r([^"]*?)"/g, '"$1\\r$2"');
      jsonStr = jsonStr.replace(/"([^"]*?)\t([^"]*?)"/g, '"$1\\t$2"');

      // STEP 4: Remove trailing commas (most common JSON error)
      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
      jsonStr = jsonStr.replace(/,\s*\]/g, ']');
      jsonStr = jsonStr.replace(/,\s*\}/g, '}');

      // STEP 5: Fix multiple consecutive commas
      jsonStr = jsonStr.replace(/,\s*,+/g, ',');

      // STEP 6: Fix missing commas between elements
      jsonStr = jsonStr.replace(/\}(\s*)\{/g, '},$1{');
      jsonStr = jsonStr.replace(/\](\s*)\{/g, '],$1{');
      jsonStr = jsonStr.replace(/\}(\s*)\[/g, '},$1[');
      jsonStr = jsonStr.replace(/\](\s*)\[/g, '],$1[');
      jsonStr = jsonStr.replace(/"(\s+)"/g, '",$1"');

      // STEP 7: Fix single quotes to double quotes
      jsonStr = jsonStr.replace(/'/g, '"');

      // STEP 8: Remove any remaining control chars that might be in strings
      jsonStr = jsonStr.split('\n').map(line => {
        // If line is inside a string value, clean it more aggressively
        if (line.includes('":')) {
          return line.replace(/[\x00-\x1F\x7F]/g, '');
        }
        return line;
      }).join('\n');

      // STEP 9: Fix truncated JSON (add missing closing brackets)
      const openBraces = (jsonStr.match(/\{/g) || []).length;
      const closeBraces = (jsonStr.match(/\}/g) || []).length;
      const openBrackets = (jsonStr.match(/\[/g) || []).length;
      const closeBrackets = (jsonStr.match(/\]/g) || []).length;

      if (openBrackets > closeBrackets) {
        jsonStr += ']'.repeat(openBrackets - closeBrackets);
      }
      if (openBraces > closeBraces) {
        jsonStr += '}'.repeat(openBraces - closeBraces);
      }

      // STEP 10: Final cleanup - remove any remaining problematic characters
      jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

      return jsonStr;
    } catch (error) {
      logger.warn('Error while sanitizing JSON, returning original', { error });
      return jsonStr;
    }
  }

  /**
   * Get the code analysis prompt template (without actual file contents)
   * Useful for understanding what instructions the AI receives
   */
  getCodeAnalysisPromptTemplate(): string {
    let prompt = `You are an expert code analyzer. Analyze the provided codebase and extract comprehensive details.\n\n`;

    prompt += `**Repository Path:** [REPO_PATH]\n`;
    prompt += `**Framework Detected:** [FRAMEWORK]\n`;
    prompt += `**Files Analyzed:** [FILE_COUNT]\n\n`;

    prompt += `**YOUR TASK: Perform EXHAUSTIVE analysis and return structured JSON**\n\n`;

    prompt += `**SOURCE CODE FILES:**\n`;
    prompt += `[Source files will be provided here...]\n\n`;

    prompt += `**ANALYSIS REQUIREMENTS:**\n\n`;
    prompt += `Extract the following with MAXIMUM detail and return as valid JSON:\n\n`;

    prompt += `## 1. ENTITIES (Domain Models)\n`;
    prompt += `For EACH entity, extract:\n`;
    prompt += `- name: Entity class name\n`;
    prompt += `- filePath: Relative file path\n`;
    prompt += `- packageName: Package/namespace\n`;
    prompt += `- annotations: Array of all annotations (@Entity, @Table, etc.)\n`;
    prompt += `- tableName: Database table name\n`;
    prompt += `- properties: Array of property objects with:\n`;
    prompt += `  * name, type, annotations, columnName, nullable, length, defaultValue, javadoc\n`;
    prompt += `- relationships: Array of relationship objects (@OneToMany, @ManyToOne, etc.)\n`;
    prompt += `- javadoc: Class-level documentation\n\n`;

    prompt += `## 2. CONTROLLERS (REST APIs)\n`;
    prompt += `For EACH controller, extract:\n`;
    prompt += `- name: Controller class name\n`;
    prompt += `- filePath: Relative file path\n`;
    prompt += `- packageName: Package/namespace\n`;
    prompt += `- baseMapping: Base URL path\n`;
    prompt += `- annotations: Array of class annotations\n`;
    prompt += `- endpoints: Array of endpoint objects with:\n`;
    prompt += `  * method: HTTP method (GET, POST, PUT, DELETE, PATCH)\n`;
    prompt += `  * path: Full endpoint path\n`;
    prompt += `  * methodName: Java/C# method name\n`;
    prompt += `  * parameters: Array of parameter objects\n`;
    prompt += `  * returnType: Return type\n`;
    prompt += `  * annotations: Method annotations\n`;
    prompt += `  * javadoc: Method documentation\n\n`;

    prompt += `## 3. SERVICES (Business Logic)\n`;
    prompt += `For EACH service, extract:\n`;
    prompt += `- name: Service class name\n`;
    prompt += `- filePath: Relative file path\n`;
    prompt += `- packageName: Package/namespace\n`;
    prompt += `- annotations: Array of annotations (@Service, @Transactional, etc.)\n`;
    prompt += `- methods: Array of method names\n`;
    prompt += `- dependencies: Array of injected dependencies\n\n`;

    prompt += `## 4. PAGES (Frontend - if applicable)\n`;
    prompt += `For EACH page/component:\n`;
    prompt += `- name, filePath, route\n\n`;

    prompt += `**OUTPUT FORMAT:**\n`;
    prompt += `Return ONLY valid JSON in this exact structure:\n`;
    prompt += `\`\`\`json\n`;
    prompt += `{\n`;
    prompt += `  "framework": "Spring Boot" | "ASP.NET Core" | "Angular" | etc,\n`;
    prompt += `  "entities": [/* array of entity objects */],\n`;
    prompt += `  "controllers": [/* array of controller objects */],\n`;
    prompt += `  "services": [/* array of service objects */],\n`;
    prompt += `  "pages": [/* array of page objects */],\n`;
    prompt += `  "summary": {\n`;
    prompt += `    "totalEntities": number,\n`;
    prompt += `    "totalControllers": number,\n`;
    prompt += `    "totalEndpoints": number,\n`;
    prompt += `    "totalServices": number\n`;
    prompt += `  }\n`;
    prompt += `}\n`;
    prompt += `\`\`\`\n\n`;

    prompt += `**CRITICAL RULES:**\n`;
    prompt += `1. Return ONLY the JSON structure above, wrapped in \`\`\`json code block\n`;
    prompt += `2. Be EXHAUSTIVE - extract EVERY entity, controller, service, endpoint\n`;
    prompt += `3. Include ALL annotations, properties, methods\n`;
    prompt += `4. Ensure STRICT valid JSON syntax:\n`;
    prompt += `   - NO trailing commas in arrays or objects\n`;
    prompt += `   - Use double quotes for all strings\n`;
    prompt += `   - NO comments\n`;
    prompt += `   - Properly close all brackets and braces\n`;
    prompt += `5. If a field is not present, use empty array [] or null\n`;
    prompt += `6. Test your JSON is valid before returning\n\n`;

    prompt += `Start your analysis now and return the valid JSON structure.`;

    return prompt;
  }

  /**
   * Create migration plan using ARK migration-planner agent
   */
  async createMigrationPlanWithARK(
    analysis: any,
    repoPath: string
  ): Promise<{
    success: boolean;
    migrationPlan?: any;
    rawOutput?: string;
    error?: string;
  }> {
    try {
      logger.info('Starting ARK-powered migration planning', {
        repoPath,
        agent: 'migration-planner',
        entities: analysis.entities?.length || 0,
        endpoints: analysis.controllers?.flatMap((c: any) => c.endpoints || []).length || 0
      });

      // Build comprehensive prompt for migration-planner
      let userMessage = `**MIGRATION PLANNING REQUEST**\n\n`;
      userMessage += `**Repository Path:** ${repoPath}\n`;
      userMessage += `**Framework:** ${analysis.framework || 'Unknown'}\n\n`;

      // Add code analysis summary
      userMessage += `## CODE ANALYSIS RESULTS\n\n`;

      // Entities
      if (analysis.entities && analysis.entities.length > 0) {
        userMessage += `### Domain Entities (${analysis.entities.length})\n\n`;
        analysis.entities.forEach((entity: any) => {
          userMessage += `**${entity.name}**\n`;
          if (entity.properties && entity.properties.length > 0) {
            userMessage += `Properties:\n`;
            entity.properties.forEach((prop: any) => {
              userMessage += `- ${prop.name}: ${prop.type}\n`;
            });
          }
          userMessage += `\n`;
        });
      }

      // Controllers/Endpoints
      if (analysis.controllers && analysis.controllers.length > 0) {
        userMessage += `### REST Controllers (${analysis.controllers.length})\n\n`;
        analysis.controllers.forEach((controller: any) => {
          userMessage += `**${controller.name}**\n`;
          userMessage += `Base Path: ${controller.baseMapping || '/'}\n`;
          if (controller.endpoints && controller.endpoints.length > 0) {
            userMessage += `Endpoints:\n`;
            controller.endpoints.forEach((endpoint: any) => {
              userMessage += `- ${endpoint.method} ${endpoint.path}\n`;
            });
          }
          userMessage += `\n`;
        });
      }

      // Services
      if (analysis.services && analysis.services.length > 0) {
        userMessage += `### Business Services (${analysis.services.length})\n\n`;
        analysis.services.forEach((service: any) => {
          userMessage += `- ${service.name}\n`;
        });
        userMessage += `\n`;
      }

      // Frontend Pages
      if (analysis.pages && analysis.pages.length > 0) {
        userMessage += `### Frontend Pages/Components (${analysis.pages.length})\n\n`;
        analysis.pages.forEach((page: any) => {
          userMessage += `- ${page.name}\n`;
          if (page.route) {
            userMessage += `  Route: ${page.route}\n`;
          }
        });
        userMessage += `\n`;
      }

      userMessage += `\n**YOUR TASK:** Based on this code analysis, create a comprehensive migration strategy to transform this monolithic application into a modern microservices architecture with micro-frontends. Follow your configured system prompt to provide world-class architectural guidance.\n`;

      logger.info('Calling ARK migration-planner agent', {
        messageLength: userMessage.length,
        messagePreview: userMessage.substring(0, 300)
      });

      // Call ARK API using OpenAI-compatible endpoint
      // The agent's system prompt (configured in migration-planner.yaml) will be used automatically
      const response = await axios.post(
        `${this.arkApiUrl}/openai/v1/chat/completions`,
        {
          model: 'agent/migration-planner',
          messages: [
            {
              role: 'user',
              content: userMessage
            }
          ],
          metadata: {
            repoPath,
            framework: analysis.framework,
            entityCount: analysis.entities?.length || 0,
            endpointCount: analysis.controllers?.flatMap((c: any) => c.endpoints || []).length || 0,
            task: 'create-migration-plan'
          }
        },
        {
          timeout: 300000, // 5 minute timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const agentOutput = response.data.choices?.[0]?.message?.content || '';

      logger.info('Received migration plan from ARK agent', {
        responseLength: agentOutput.length
      });

      // Parse the markdown to extract basic structure for compatibility
      const migrationPlan = this.parseMigrationPlanMarkdown(agentOutput, analysis);

      logger.info('Successfully processed migration plan from ARK agent', {
        microservices: migrationPlan.microservices?.length || 0,
        microFrontends: migrationPlan.microFrontends?.length || 0,
        hasMarkdown: !!agentOutput
      });

      return {
        success: true,
        migrationPlan,
        rawOutput: agentOutput // Beautiful markdown output for frontend display
      };

    } catch (error: any) {
      logger.error('ARK migration planning failed', {
        message: error.message,
        code: error.code
      });

      // Check if ARK is not running
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return {
          success: false,
          error: `ARK system not available at ${this.arkApiUrl}. Please ensure ARK is running.`
        };
      }

      return {
        success: false,
        error: `Migration planning failed: ${error.message}`
      };
    }
  }

  /**
   * Parse migration plan markdown to extract basic structure
   */
  private parseMigrationPlanMarkdown(markdown: string, analysis: any): any {
    // Extract microservice names from markdown sections
    const serviceMatches = markdown.match(/\*\*Service Name\*\*:\s*([a-z-]+)/gi) || [];
    const microservices = serviceMatches.map((match: string) => {
      const name = match.replace(/\*\*Service Name\*\*:\s*/i, '').trim();
      return {
        name,
        port: 8080, // Default, will be extracted if in markdown
        entities: [],
        endpoints: []
      };
    });

    // Extract micro-frontend names
    const mfeMatches = markdown.match(/\*\*Module Name\*\*:\s*([a-z-]+)/gi) || [];
    const microFrontends = mfeMatches.map((match: string) => {
      const name = match.replace(/\*\*Module Name\*\*:\s*/i, '').trim();
      return {
        name,
        port: 4200, // Default
        routes: [],
        components: []
      };
    });

    return {
      strategy: markdown,
      microservices: microservices.length > 0 ? microservices : [
        { name: 'auth-service', port: 8081, entities: [], endpoints: [] },
        { name: 'client-service', port: 8082, entities: [], endpoints: [] }
      ],
      microFrontends: microFrontends.length > 0 ? microFrontends : [
        { name: 'shell', port: 4200, routes: [], components: [] },
        { name: 'auth-mfe', port: 4201, routes: [], components: [] }
      ],
      phases: [],
      dependencies: [],
      risks: []
    };
  }

  /**
   * Generate microservices code using ARK service-generator agent
   */
  async generateServicesWithARK(
    migrationPlan: any,
    repoPath: string,
    businessLogicPrompt?: string
  ): Promise<{
    success: boolean;
    generatedCode?: any;
    rawOutput?: string;
    error?: string;
  }> {
    try {
      logger.info('Starting ARK-powered service generation', {
        repoPath,
        agent: 'service-generator',
        microservices: migrationPlan.microservices?.length || 0,
        hasBusinessLogic: !!businessLogicPrompt
      });

      // Build comprehensive prompt for service-generator
      let userMessage = `**MICROSERVICES CODE GENERATION REQUEST**\n\n`;
      userMessage += `**Repository Path:** ${repoPath}\n\n`;

      // Add business logic requirements if available
      if (businessLogicPrompt) {
        userMessage += businessLogicPrompt;
        userMessage += `\n\n`;
      }

      // Add migration plan details
      userMessage += `## MIGRATION PLAN\n\n`;

      if (migrationPlan.microservices && migrationPlan.microservices.length > 0) {
        userMessage += `### Microservices to Generate (${migrationPlan.microservices.length})\n\n`;

        migrationPlan.microservices.forEach((service: any) => {
          userMessage += `#### ${service.name}\n`;
          userMessage += `- **Port:** ${service.port}\n`;
          userMessage += `- **Database:** ${service.database || service.name.replace('-service', '_db')}\n`;

          if (service.entities && service.entities.length > 0) {
            userMessage += `- **Entities:** ${service.entities.map((e: any) => e.name || e).join(', ')}\n`;
          }

          if (service.endpoints && service.endpoints.length > 0) {
            userMessage += `- **Endpoints:**\n`;
            service.endpoints.forEach((endpoint: any) => {
              userMessage += `  - ${endpoint.method} ${endpoint.path}\n`;
            });
          }

          userMessage += `\n`;
        });
      }

      userMessage += `\n**YOUR TASK:** Generate COMPLETE, PRODUCTION-READY Spring Boot microservices code for each service above. Include all files: pom.xml, entities, repositories, services, controllers, configuration, tests, Dockerfile. Return as markdown report with code blocks.\n`;

      logger.info('Calling ARK service-generator agent', {
        messageLength: userMessage.length,
        microservices: migrationPlan.microservices?.length || 0
      });

      // Call ARK API
      const response = await axios.post(
        `${this.arkApiUrl}/openai/v1/chat/completions`,
        {
          model: 'agent/service-generator',
          messages: [
            {
              role: 'user',
              content: userMessage
            }
          ],
          metadata: {
            repoPath,
            microserviceCount: migrationPlan.microservices?.length || 0,
            task: 'generate-services'
          }
        },
        {
          timeout: 300000, // 5 minutes
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const agentOutput = response.data.choices?.[0]?.message?.content || '';

      logger.info('Received service code from ARK agent', {
        responseLength: agentOutput.length
      });

      return {
        success: true,
        generatedCode: { services: migrationPlan.microservices || [] },
        rawOutput: agentOutput // Markdown with complete code
      };

    } catch (error: any) {
      logger.error('ARK service generation failed', {
        message: error.message,
        code: error.code
      });

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return {
          success: false,
          error: `ARK system not available at ${this.arkApiUrl}`
        };
      }

      return {
        success: false,
        error: `Service generation failed: ${error.message}`
      };
    }
  }

  /**
   * Generate micro-frontends code using ARK frontend-migrator agent
   */
  async generateFrontendsWithARK(
    migrationPlan: any,
    repoPath: string,
    businessLogicPrompt?: string
  ): Promise<{
    success: boolean;
    generatedCode?: any;
    rawOutput?: string;
    error?: string;
  }> {
    try {
      logger.info('Starting ARK-powered frontend generation', {
        repoPath,
        agent: 'frontend-migrator',
        microFrontends: migrationPlan.microFrontends?.length || 0,
        hasBusinessLogic: !!businessLogicPrompt
      });

      // Build comprehensive prompt for frontend-migrator
      let userMessage = `**MICRO-FRONTENDS CODE GENERATION REQUEST**\n\n`;
      userMessage += `**Repository Path:** ${repoPath}\n\n`;

      // Add business logic requirements if available
      if (businessLogicPrompt) {
        userMessage += businessLogicPrompt;
        userMessage += `\n\n`;
      }

      // Add migration plan details
      userMessage += `## MIGRATION PLAN\n\n`;

      if (migrationPlan.microFrontends && migrationPlan.microFrontends.length > 0) {
        userMessage += `### Micro-Frontends to Generate (${migrationPlan.microFrontends.length})\n\n`;

        migrationPlan.microFrontends.forEach((mfe: any) => {
          userMessage += `#### ${mfe.name}\n`;
          userMessage += `- **Port:** ${mfe.port}\n`;
          userMessage += `- **Type:** ${mfe.isHost ? 'Host (Shell)' : 'Remote'}\n`;

          if (mfe.routes && mfe.routes.length > 0) {
            userMessage += `- **Routes:** ${mfe.routes.join(', ')}\n`;
          }

          if (mfe.components && mfe.components.length > 0) {
            userMessage += `- **Components:** ${mfe.components.join(', ')}\n`;
          }

          userMessage += `\n`;
        });
      }

      userMessage += `\n**YOUR TASK:** Generate COMPLETE, PRODUCTION-READY Angular micro-frontends with Module Federation. Include all files: package.json, webpack.config.js, components, services, routing, configuration, Dockerfile. Return as markdown report with code blocks.\n`;

      logger.info('Calling ARK frontend-migrator agent', {
        messageLength: userMessage.length,
        microFrontends: migrationPlan.microFrontends?.length || 0
      });

      // Call ARK API
      const response = await axios.post(
        `${this.arkApiUrl}/openai/v1/chat/completions`,
        {
          model: 'agent/frontend-migrator',
          messages: [
            {
              role: 'user',
              content: userMessage
            }
          ],
          metadata: {
            repoPath,
            microFrontendCount: migrationPlan.microFrontends?.length || 0,
            task: 'generate-frontends'
          }
        },
        {
          timeout: 300000, // 5 minutes
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const agentOutput = response.data.choices?.[0]?.message?.content || '';

      logger.info('Received frontend code from ARK agent', {
        responseLength: agentOutput.length
      });

      return {
        success: true,
        generatedCode: { microFrontends: migrationPlan.microFrontends || [] },
        rawOutput: agentOutput // Markdown with complete code
      };

    } catch (error: any) {
      logger.error('ARK frontend generation failed', {
        message: error.message,
        code: error.code
      });

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return {
          success: false,
          error: `ARK system not available at ${this.arkApiUrl}`
        };
      }

      return {
        success: false,
        error: `Frontend generation failed: ${error.message}`
      };
    }
  }

  /**
   * Get agent information
   */
  getAgentInfo(): { agent: string; namespace: string; arkUrl: string } {
    return {
      agent: this.agentName,
      namespace: this.arkNamespace,
      arkUrl: this.arkApiUrl
    };
  }

  /**
   * Generate monolithic backend with ARK monolithic-backend-generator agent
   */
  async generateMonolithicBackendWithARK(
    migrationPlan: any,
    repoPath: string,
    businessLogicPrompt?: string
  ): Promise<{
    success: boolean;
    rawOutput?: string;
    error?: string;
  }> {
    try {
      logger.info(`🔧 Calling ARK monolithic-backend-generator agent`);

      let prompt = `Based on this migration plan and business logic analysis, generate a COMPLETE Spring Boot monolithic application.

**Migration Plan:**
${JSON.stringify(migrationPlan, null, 2)}

**Repository Path:** ${repoPath}

**Domain Models:** ${migrationPlan.entities?.map((e: any) => e.name).join(', ') || 'Unknown'}
**Endpoints:** ${migrationPlan.controllers?.flatMap((c: any) => c.endpoints || []).length || 0} REST endpoints

Generate a complete Spring Boot application following the structure defined in your instructions.
`;

      if (businessLogicPrompt) {
        prompt += `\n\n**Business Logic Requirements:**\n${businessLogicPrompt}`;
      }

      const result = await this.callArkAgent('monolithic-backend-generator', prompt);
      return result;

    } catch (error: any) {
      logger.error('Failed to generate monolithic backend with ARK:', error);

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return {
          success: false,
          error: `ARK system not available at ${this.arkApiUrl}`
        };
      }

      return {
        success: false,
        error: `Backend generation failed: ${error.message}`
      };
    }
  }

  /**
   * Generate monolithic frontend with ARK monolithic-frontend-generator agent
   */
  async generateMonolithicFrontendWithARK(
    migrationPlan: any,
    repoPath: string,
    businessLogicPrompt?: string
  ): Promise<{
    success: boolean;
    rawOutput?: string;
    error?: string;
  }> {
    try {
      logger.info(`🎨 Calling ARK monolithic-frontend-generator agent`);

      let prompt = `Based on this migration plan and business logic analysis, generate a COMPLETE Angular monolithic application.

**Migration Plan:**
${JSON.stringify(migrationPlan, null, 2)}

**Repository Path:** ${repoPath}

**Frontend Components:** Login, Register, Dashboard, Accounts, Transactions, Cards, Transfers
**API Endpoints:** All endpoints from the backend REST API

Generate a complete Angular application following the structure defined in your instructions.
`;

      if (businessLogicPrompt) {
        prompt += `\n\n**Business Logic Requirements:**\n${businessLogicPrompt}`;
      }

      const result = await this.callArkAgent('monolithic-frontend-generator', prompt);
      return result;

    } catch (error: any) {
      logger.error('Failed to generate monolithic frontend with ARK:', error);

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return {
          success: false,
          error: `ARK system not available at ${this.arkApiUrl}`
        };
      }

      return {
        success: false,
        error: `Frontend generation failed: ${error.message}`
      };
    }
  }

  /**
   * Generic method to call any ARK agent with a custom prompt
   */
  async callArkAgent(
    agentName: string,
    prompt: string,
    context?: any
  ): Promise<{
    success: boolean;
    rawOutput?: string;
    error?: string;
  }> {
    try {
      logger.info(`📡 Calling ARK agent: ${agentName}`);

      const response = await axios.post(
        `${this.arkApiUrl}/agent/${agentName}`,
        {
          input: prompt,
          context: context || {}
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 300000 // 5 minutes
        }
      );

      if (response.data && response.data.output) {
        logger.info(`✅ ARK agent ${agentName} completed successfully`);
        return {
          success: true,
          rawOutput: response.data.output
        };
      }

      return {
        success: false,
        error: 'No output from ARK agent'
      };
    } catch (error: any) {
      logger.error(`❌ ARK agent ${agentName} failed:`, error.message);
      return {
        success: false,
        error: error.message,
        rawOutput: `Error calling ARK agent: ${error.message}`
      };
    }
  }
}

// Export singleton instance
export default new ArkChatService();
