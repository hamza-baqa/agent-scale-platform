import { Router, Request, Response } from 'express';
import logger from '../utils/logger';

const router = Router();

/**
 * Chat endpoint for documentation Q&A
 */
router.post('/migrations/:migrationId/chat', async (req: Request, res: Response) => {
  try {
    const { migrationId } = req.params;
    const { message, context } = req.body;

    logger.info('Chat request received', { migrationId, message });

    // Generate intelligent response based on the message and context
    const response = generateDocumentationResponse(message, context);

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Chat error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate response',
      message: error.message
    });
  }
});

/**
 * Generate intelligent responses based on documentation context
 * Includes both technical AND business/functional explanations
 */
function generateDocumentationResponse(message: string, context: any): string {
  const lowerMessage = message.toLowerCase();

  // PRIORITY: Business/Functional explanation questions (check FIRST!)
  // These keywords indicate the user wants business context, not just technical details
  const businessKeywords = [
    'what does', 'what is the purpose', 'why do we need', 'why do i need',
    'business perspective', 'business problem', 'business value', 'business',
    'workflow', 'process', 'flow', 'user journey',
    'from a user', 'for users', 'user can do',
    'customer', 'client perspective', 'end user',
    'solve', 'enable', 'functionality', 'purpose of'
  ];

  const isBusinessQuestion = businessKeywords.some(keyword => lowerMessage.includes(keyword));

  if (isBusinessQuestion) {
    return generateBusinessExplanation(message, context);
  }

  // Architecture questions
  if (lowerMessage.includes('architecture') || lowerMessage.includes('structure') || lowerMessage.includes('design') || lowerMessage.includes('pattern')) {
    const archDesc = context.architecture?.description || 'layered architecture pattern';
    const entityNames = context.entityNames || [];

    let response = `**${context.projectName || 'The application'}** follows a **${archDesc}** using ${context.framework || 'modern web technologies'}.\n\n`;

    response += `📐 **Architecture Overview:**\n\n`;
    response += `**Frontend Layer (Presentation):**\n`;
    response += `- User interface and interactions\n`;
    response += `- Component-based architecture\n`;
    response += `- HTTP client for API communication\n`;
    response += `- State management\n\n`;

    response += `**Backend Layer (Business Logic):**\n`;
    response += `- **${context.controllers || 0} REST Controllers**: Handle HTTP requests\n`;
    response += `- **Service Layer**: Business logic and transactions\n`;
    response += `- **Repository Layer**: Data access abstraction\n`;
    response += `- **Security**: JWT authentication & authorization\n\n`;

    response += `**Data Layer (Persistence):**\n`;
    response += `- **${entityNames.length} Entities**: ${entityNames.join(', ')}\n`;
    response += `- ORM (JPA/Hibernate)\n`;
    response += `- Database connection pooling\n`;
    response += `- Transaction management\n\n`;

    response += `**Design Patterns:**\n`;
    response += `✓ **MVC** (Model-View-Controller)\n`;
    response += `✓ **Repository Pattern**: Data access abstraction\n`;
    response += `✓ **Service Layer Pattern**: Business logic isolation\n`;
    response += `✓ **DTO Pattern**: Data transfer objects\n`;
    response += `✓ **Dependency Injection**: Loose coupling\n\n`;

    response += `**Architecture Benefits:**\n`;
    response += `✓ Clear separation of concerns\n`;
    response += `✓ Easy to test and maintain\n`;
    response += `✓ Scalable and extensible\n`;
    response += `✓ Technology independence\n`;
    response += `✓ Team parallel development`;

    return response;
  }

  // Entity/Model questions
  if (lowerMessage.includes('entity') || lowerMessage.includes('entities') || lowerMessage.includes('model') || lowerMessage.includes('database') || lowerMessage.includes('table')) {
    const entities = context.entities || [];
    const entityNames = context.entityNames || [];
    const detailedEntities = context.detailedAnalysis?.entities || [];

    if (detailedEntities.length > 0) {
      // Use ACTUAL entity data with real properties
      let response = `The **${context.projectName || 'system'}** has **${detailedEntities.length} entities** that form the core domain model:\n\n`;

      for (const entity of detailedEntities.slice(0, 10)) { // Show first 10
        response += `**${entity.name}**\n`;
        response += `- File: \`${entity.filePath}\`\n`;
        response += `- Properties (${entity.propertyCount}): ${entity.propertyNames || 'No properties found'}\n\n`;
      }

      if (detailedEntities.length > 10) {
        response += `... and ${detailedEntities.length - 10} more entities\n\n`;
      }

      response += `**Database Design:**\n`;
      response += `- Total entities: ${detailedEntities.length}\n`;
      response += `- Each entity maps to a database table\n`;
      response += `- Uses ${context.framework || 'ORM framework'} for persistence\n`;
      response += `- All properties are typed and validated\n\n`;

      response += `**Common Property Types:**\n`;
      const allProps = detailedEntities.flatMap((e: any) => e.properties || []);
      const types = [...new Set(allProps.map((p: any) => p.type))];
      response += types.slice(0, 10).map((t: string) => `- ${t}`).join('\n');

      return response;
    } else if (entities.length > 0) {
      const entityList = entities.map((e: any) => {
        const desc = e.description || `Domain entity for ${e.name.toLowerCase()}`;
        return `- **${e.name}**: ${e.fields || 0} properties\n  ${desc}`;
      }).join('\n');

      return `The **${context.projectName || 'system'}** has **${entities.length} entities**:\n\n${entityList}\n\n**Entity Names**: ${entityNames.join(', ')}`;
    }
    return `The system uses a relational database with ${entityNames.length} entities: ${entityNames.join(', ')}.`;
  }

  // API questions
  if (lowerMessage.includes('api') || lowerMessage.includes('endpoint') || lowerMessage.includes('rest') || lowerMessage.includes('controller')) {
    const apiSummary = context.apiEndpoints || {};
    const detailedControllers = context.detailedAnalysis?.controllers || [];

    if (detailedControllers.length > 0) {
      // Use ACTUAL controller and endpoint data
      let response = `**${context.projectName || 'The'} API** follows **RESTful principles**:\n\n`;
      response += `📊 **API Statistics:**\n`;
      response += `- **Controllers**: ${detailedControllers.length}\n`;
      const totalEndpoints = detailedControllers.reduce((sum: number, c: any) => sum + (c.endpointCount || 0), 0);
      response += `- **Total Endpoints**: ${totalEndpoints}\n\n`;

      response += `**Controllers & Endpoints:**\n\n`;
      for (const controller of detailedControllers.slice(0, 8)) { // Show first 8
        response += `**${controller.name}**\n`;
        response += `- File: \`${controller.filePath}\`\n`;
        response += `- Endpoints (${controller.endpointCount}):\n`;

        const endpoints = controller.endpoints || [];
        for (const endpoint of endpoints.slice(0, 10)) {
          response += `  • \`${endpoint.method} ${endpoint.path}\` → ${endpoint.methodName}\n`;
        }
        if (endpoints.length > 10) {
          response += `  ... and ${endpoints.length - 10} more endpoints\n`;
        }
        response += '\n';
      }

      if (detailedControllers.length > 8) {
        response += `... and ${detailedControllers.length - 8} more controllers\n\n`;
      }

      response += `**API Standards:**\n`;
      response += `✓ RESTful conventions (GET, POST, PUT, DELETE, PATCH)\n`;
      response += `✓ JSON request/response format\n`;
      response += `✓ HTTP status codes\n`;
      response += `✓ JWT-based authentication\n`;
      response += `✓ Error handling middleware\n`;

      return response;
    } else {
      // Fallback to summary data
      const totalEndpoints = context.totalEndpoints || apiSummary.total || 0;
      const entityNames = context.entityNames || [];

      let response = `**${context.projectName || 'The'} API** has ${context.controllers || 0} controllers with ${totalEndpoints} endpoints.\n\n`;
      response += `**Resources**: ${entityNames.join(', ')}\n\n`;
      response += `The API follows RESTful principles with standard HTTP methods and JSON format.`;
      return response;
    }
  }

  // Feature questions
  if (lowerMessage.includes('feature') || lowerMessage.includes('functionality') || lowerMessage.includes('capability') || lowerMessage.includes('what can') || lowerMessage.includes('what does')) {
    const features = context.features || {};
    const featureList = context.featureList || [];

    if (Object.keys(features).length > 0) {
      let response = `**${context.projectName || 'The system'}** provides **${Object.keys(features).length} main feature areas**:\n\n`;

      for (const [key, feature] of Object.entries(features)) {
        const f = feature as any;
        response += `**${f.title}**\n`;
        if (f.items && f.items.length > 0) {
          response += f.items.map((item: string) => `  ✓ ${item}`).join('\n') + '\n\n';
        }
      }

      response += `\n**Feature Highlights:**\n`;
      response += `- Total feature domains: ${Object.keys(features).length}\n`;
      response += `- Comprehensive business logic\n`;
      response += `- Full CRUD operations\n`;
      response += `- Security-first design\n`;
      response += `- RESTful API integration\n`;

      return response;
    }

    if (featureList.length > 0) {
      return `The system includes these capabilities:\n\n${featureList.map((f: string) => `• ${f}`).join('\n')}\n\nEach feature is fully implemented with UI, business logic, and data persistence.`;
    }

    return `The system provides comprehensive business functionality including user management, data operations, transaction processing, and reporting capabilities.`;
  }

  // Technology stack questions
  if (lowerMessage.includes('tech') || lowerMessage.includes('technology') || lowerMessage.includes('stack') || lowerMessage.includes('framework')) {
    return `**Technology Stack:**\n\n**Framework**: ${context.framework || 'Modern web framework'}\n**Controllers**: ${context.controllers || 0} REST controllers\n**Entities**: ${context.entities?.length || 0} domain entities\n\nThe stack is chosen for:\n✓ Developer productivity\n✓ Performance and scalability\n✓ Strong community support\n✓ Enterprise-grade reliability\n✓ Rich ecosystem of libraries`;
  }

  // Security questions
  if (lowerMessage.includes('security') || lowerMessage.includes('authentication') || lowerMessage.includes('authorization') || lowerMessage.includes('secure')) {
    return `**Security Implementation:**\n\n**Authentication:**\n- JWT (JSON Web Tokens) for stateless authentication\n- Secure password hashing (BCrypt)\n- Token refresh mechanism\n- Session management\n\n**Authorization:**\n- Role-Based Access Control (RBAC)\n- Permission-based resource access\n- API endpoint protection\n\n**Best Practices:**\n✓ HTTPS/TLS encryption\n✓ Input validation\n✓ SQL injection prevention\n✓ XSS protection\n✓ CSRF tokens\n✓ Rate limiting`;
  }

  // Testing questions
  if (lowerMessage.includes('test') || lowerMessage.includes('testing') || lowerMessage.includes('quality')) {
    return `**Testing Strategy:**\n\n**Unit Tests:**\n- Individual component testing\n- Service layer validation\n- Mock external dependencies\n\n**Integration Tests:**\n- API endpoint testing\n- Database interactions\n- Component integration\n\n**Coverage:**\n- Target: 70%+ code coverage\n- Automated test execution\n- Continuous integration\n\n**Quality Assurance:**\n✓ Code reviews\n✓ Static analysis\n✓ Security scanning\n✓ Performance testing`;
  }

  // Performance questions
  if (lowerMessage.includes('performance') || lowerMessage.includes('scalability') || lowerMessage.includes('optimize')) {
    return `**Performance Optimizations:**\n\n**Backend:**\n- Database connection pooling\n- Query optimization and indexing\n- Caching strategies (Redis/Memcached)\n- Async processing for heavy operations\n\n**Frontend:**\n- Code splitting and lazy loading\n- Asset optimization (minification, compression)\n- CDN for static resources\n- Client-side caching\n\n**Scalability:**\n✓ Horizontal scaling ready\n✓ Stateless architecture\n✓ Load balancing capable\n✓ Microservices-friendly design`;
  }

  // Deployment questions
  if (lowerMessage.includes('deploy') || lowerMessage.includes('deployment') || lowerMessage.includes('docker') || lowerMessage.includes('kubernetes')) {
    return `**Deployment Strategy:**\n\n**Containerization:**\n- Docker images for all components\n- Multi-stage builds for optimization\n- Environment-specific configurations\n\n**Orchestration:**\n- Kubernetes deployments\n- Service meshes for communication\n- Auto-scaling policies\n- Rolling updates\n\n**CI/CD:**\n✓ Automated builds\n✓ Test execution\n✓ Security scanning\n✓ Deployment automation\n✓ Rollback capabilities\n\n**Environments:**\n- Development\n- Staging\n- Production`;
  }

  // Migration questions
  if (lowerMessage.includes('migration') || lowerMessage.includes('modernize') || lowerMessage.includes('transform')) {
    return `**Modernization Approach:**\n\n**Current State:**\n- ${context.controllers || 0} controllers to migrate\n- ${context.entities?.length || 0} entities to transform\n- ${context.framework || 'Legacy framework'} technology\n\n**Target Architecture:**\n- **Microservices**: Decompose into independent services\n- **Micro-frontends**: Module Federation architecture\n- **Cloud-native**: Containerized, scalable deployment\n\n**Migration Strategy:**\n1. **Reverse-engineer**: Analyze current codebase\n2. **Shape**: Design new architecture\n3. **Modernize**: Transform code incrementally\n4. **Validate**: Test and ensure quality\n\n**Benefits:**\n✓ Better scalability\n✓ Independent deployment\n✓ Technology flexibility\n✓ Team autonomy`;
  }

  // How-to questions
  if (lowerMessage.includes('how to') || lowerMessage.includes('how do')) {
    return `I can help you understand various aspects of the system! Here are some things I can explain:\n\n**Architecture & Design:**\n- Overall system architecture\n- Layer separation and responsibilities\n- Design patterns used\n\n**Development:**\n- How to add new features\n- API endpoint structure\n- Database entity relationships\n\n**Operations:**\n- Deployment procedures\n- Configuration management\n- Monitoring and logging\n\nPlease ask a specific question about any of these topics, and I'll provide detailed guidance!`;
  }

  // Count/number questions
  if (lowerMessage.includes('how many') || lowerMessage.includes('count')) {
    return `**System Metrics:**\n\n📊 **Code Statistics:**\n- **Controllers**: ${context.controllers || 0}\n- **Entities**: ${context.entities?.length || 0}\n- **Framework**: ${context.framework || 'N/A'}\n\nThese metrics give you an overview of the application's size and complexity. Would you like to know more about any specific component?`;
  }

  // Specific entity questions
  if (lowerMessage.includes('user') || lowerMessage.includes('client') || lowerMessage.includes('account') || lowerMessage.includes('transaction') || lowerMessage.includes('card') || lowerMessage.includes('compte') || lowerMessage.includes('carte') || lowerMessage.includes('virement')) {
    const entityNames = context.entityNames || [];
    const detailedEntities = context.detailedAnalysis?.entities || [];
    const matchedEntity = entityNames.find((e: string) => lowerMessage.includes(e.toLowerCase()));

    if (matchedEntity) {
      // Find in detailed analysis first
      const detailedEntity = detailedEntities.find((e: any) => e.name.toLowerCase() === matchedEntity.toLowerCase());

      if (detailedEntity && detailedEntity.properties && detailedEntity.properties.length > 0) {
        let response = `**${detailedEntity.name} Entity** - Complete Details:\n\n`;
        response += `📁 **File**: \`${detailedEntity.filePath}\`\n\n`;
        response += `📊 **Properties (${detailedEntity.propertyCount}):**\n`;

        for (const prop of detailedEntity.properties) {
          response += `- **${prop.name}**: \`${prop.type}\`\n`;
        }

        response += `\n**Database Mapping:**\n`;
        response += `- Table name: ${detailedEntity.name.toUpperCase()}\n`;
        response += `- ORM: JPA/Hibernate annotations\n`;
        response += `- Primary key: Usually \`id\` field\n`;
        response += `- Framework: ${context.framework || 'N/A'}\n\n`;

        response += `**Related API Endpoints:**\n`;
        const entityLower = detailedEntity.name.toLowerCase();
        response += `- \`GET /${entityLower}s\` - List all ${detailedEntity.name}s\n`;
        response += `- \`GET /${entityLower}s/:id\` - Get specific ${detailedEntity.name}\n`;
        response += `- \`POST /${entityLower}s\` - Create new ${detailedEntity.name}\n`;
        response += `- \`PUT /${entityLower}s/:id\` - Update ${detailedEntity.name}\n`;
        response += `- \`DELETE /${entityLower}s/:id\` - Delete ${detailedEntity.name}\n`;

        return response;
      }

      // Fallback to basic entity info
      const entity = (context.entities || []).find((e: any) => e.name === matchedEntity);
      if (entity) {
        return `**${matchedEntity} Entity:**\n\n**Properties**: ${entity.fields || 0} fields\n**Description**: ${entity.description || `Core domain entity for ${matchedEntity.toLowerCase()}`}\n\nThis entity is part of the ${context.framework || 'application'} domain model.`;
      }
    }
  }

  // List/show questions
  if (lowerMessage.includes('list') || lowerMessage.includes('show me') || lowerMessage.includes('what are')) {
    const entityNames = context.entityNames || [];
    const featureList = context.featureList || [];

    return `**${context.projectName || 'System'} Components:**\n\n**📦 Entities (${entityNames.length}):**\n${entityNames.map((e: string) => `- ${e}`).join('\n')}\n\n**✨ Features (${featureList.length}):**\n${featureList.map((f: string) => `- ${f}`).join('\n')}\n\n**🔌 API Statistics:**\n- Controllers: ${context.controllers || 0}\n- Total Endpoints: ${context.totalEndpoints || 0}\n\n**💻 Technology:**\n- Framework: ${context.framework || 'N/A'}\n\nAsk me about any specific component for more details!`;
  }

  // Default response with suggestions
  return `I'm here to help you understand **${context.projectName || 'the codebase'}**! I can provide detailed information about:\n\n**🏗️ Architecture**: System design, layers, and patterns\n**💾 Database**: Entity models, relationships (${context.entityNames?.length || 0} entities)\n**🔌 APIs**: Endpoints, request/response (${context.totalEndpoints || 0} endpoints)\n**✨ Features**: Functionality and capabilities (${context.featureList?.length || 0} domains)\n**🛠️ Technology**: ${context.framework || 'Frameworks'}, libraries, and tools\n**🔒 Security**: Authentication, authorization, best practices\n**🚀 Deployment**: Docker, Kubernetes, CI/CD\n**⚡ Performance**: Optimizations and scalability\n\n**Current System Summary:**\n- **Entities**: ${(context.entityNames || []).join(', ') || 'N/A'}\n- **Controllers**: ${context.controllers || 0}\n- **Framework**: ${context.framework || 'N/A'}\n- **Total Endpoints**: ${context.totalEndpoints || 0}\n\n**Try asking:**\n- "Explain the architecture"\n- "What entities exist?"\n- "Tell me about the User entity"\n- "What are the main features?"\n- "How many API endpoints?"\n\nWhat would you like to know?`;
}

/**
 * Chat endpoint for migration plan discussion and adjustments
 */
router.post('/migrations/:migrationId/plan-chat', async (req: Request, res: Response) => {
  try {
    const { migrationId } = req.params;
    const { message, plan } = req.body;

    logger.info('Plan chat request received', { migrationId, message });

    // Generate intelligent response and check if plan should be updated
    const result = generatePlanResponseWithUpdates(message, plan);

    res.json({
      success: true,
      response: result.response,
      updatedPlan: result.updatedPlan, // Return updated plan if modified
      planModified: result.planModified, // Flag indicating if plan changed
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Plan chat error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate response',
      message: error.message
    });
  }
});

/**
 * Generate business and functional explanations
 */
function generateBusinessExplanation(message: string, context: any): string {
  const lowerMessage = message.toLowerCase();
  const detailedEntities = context.detailedAnalysis?.entities || [];
  const detailedControllers = context.detailedAnalysis?.controllers || [];
  const features = context.features || {};
  const projectName = context.projectName || 'The application';

  // Check if asking about a specific entity from business perspective
  const entityNames = context.entityNames || [];

  // More flexible entity detection - check for entity name OR common references
  let mentionedEntity = entityNames.find((e: string) => lowerMessage.includes(e.toLowerCase()));

  // If no exact match, try common variations
  if (!mentionedEntity) {
    const entityPatterns: any = {
      'User': ['user', 'users', 'authentication', 'login', 'account holder'],
      'Client': ['client', 'customer', 'customers'],
      'Account': ['account', 'accounts', 'balance', 'savings', 'checking'],
      'Transaction': ['transaction', 'transactions', 'transfer', 'payment', 'virement'],
      'Card': ['card', 'cards', 'credit card', 'debit card', 'carte']
    };

    for (const [entityName, patterns] of Object.entries(entityPatterns)) {
      if (patterns.some((pattern: string) => lowerMessage.includes(pattern))) {
        if (entityNames.includes(entityName)) {
          mentionedEntity = entityName;
          break;
        }
      }
    }
  }

  if (mentionedEntity) {
    const entity = detailedEntities.find((e: any) => e.name.toLowerCase() === mentionedEntity.toLowerCase());
    if (entity) {
      return generateEntityBusinessExplanation(entity, context);
    }
  }

  // Check if asking about a specific feature/domain
  const featureKeywords: any = {
    'authentication': ['auth', 'login', 'sign in', 'password', 'security'],
    'client': ['client', 'customer', 'customer management'],
    'account': ['account', 'balance', 'savings', 'checking'],
    'transaction': ['transaction', 'transfer', 'payment', 'virement'],
    'card': ['card', 'credit card', 'debit card', 'carte']
  };

  for (const [feature, keywords] of Object.entries(featureKeywords)) {
    if (keywords.some((kw: string) => lowerMessage.includes(kw))) {
      return generateFeatureBusinessExplanation(feature, context);
    }
  }

  // General workflow question
  if (lowerMessage.includes('workflow') || lowerMessage.includes('flow') || lowerMessage.includes('process')) {
    return generateWorkflowExplanation(context);
  }

  // General business overview
  return `**${projectName} - Business Overview**\n\n` +
    `**🎯 Business Purpose:**\n` +
    `${projectName} is a comprehensive banking system that enables:\n\n` +
    `**For Bank Customers:**\n` +
    `- Access and manage their accounts 24/7\n` +
    `- View real-time account balances and transaction history\n` +
    `- Transfer money between accounts or to other customers\n` +
    `- Manage debit/credit cards (activate, block, set limits)\n` +
    `- Update personal information and contact details\n\n` +
    `**For Bank Employees:**\n` +
    `- Create and manage customer profiles\n` +
    `- Open new accounts for clients\n` +
    `- Process transactions and handle exceptions\n` +
    `- Issue and manage cards\n` +
    `- Monitor account activities for compliance\n\n` +
    `**Key Business Capabilities:**\n` +
    Object.entries(features).map(([key, val]: [string, any]) => `- ${val.title}\n`).join('') +
    `\n**Business Value:**\n` +
    `✓ **Digital Transformation**: Move from branch-based to online banking\n` +
    `✓ **Customer Self-Service**: Reduce operational costs\n` +
    `✓ **24/7 Availability**: Serve customers anytime, anywhere\n` +
    `✓ **Data-Driven Decisions**: Track customer behavior and preferences\n` +
    `✓ **Compliance**: Audit trail for all transactions\n` +
    `✓ **Scalability**: Handle growing customer base\n\n` +
    `**Ask me about specific features, entities, or workflows for detailed explanations!**`;
}

/**
 * Generate business explanation for a specific entity
 */
function generateEntityBusinessExplanation(entity: any, context: any): string {
  const entityName = entity.name;
  const properties = entity.properties || [];

  // Business context based on entity name
  const businessContext: any = {
    'User': {
      purpose: 'Represents a system user who can log in and access the application',
      businessRole: 'Enables authentication and authorization for different user types (customers, employees, admins)',
      workflows: [
        '**Registration**: New user signs up with credentials',
        '**Login**: User authenticates to access their account',
        '**Profile Management**: User updates their information',
        '**Security**: Password resets, account lockouts'
      ],
      dataUsage: 'User data is used for authentication, personalization, and audit trails'
    },
    'Client': {
      purpose: 'Represents a bank customer who owns accounts and uses banking services',
      businessRole: 'Central entity for customer relationship management (CRM)',
      workflows: [
        '**Onboarding**: New client registration with KYC verification',
        '**Account Opening**: Client can open multiple accounts (savings, checking)',
        '**Profile Updates**: Client maintains current contact and personal info',
        '**Customer Service**: Bank employees access client data to assist'
      ],
      dataUsage: 'Client data is used for KYC compliance, marketing, and personalized services'
    },
    'Account': {
      purpose: 'Represents a bank account (checking, savings, etc.) that holds money',
      businessRole: 'Core entity for all financial operations',
      workflows: [
        '**Account Creation**: Client opens account with initial deposit',
        '**Deposits**: Money is added to the account',
        '**Withdrawals**: Money is removed from the account',
        '**Transfers**: Money moves between accounts',
        '**Balance Inquiries**: Client checks available balance',
        '**Statement Generation**: Monthly/quarterly account statements'
      ],
      dataUsage: 'Account data is used for financial reporting, compliance, and customer dashboards'
    },
    'Transaction': {
      purpose: 'Represents a financial operation that moves or records money',
      businessRole: 'Audit trail for all financial activities',
      workflows: [
        '**Money Transfer**: Client sends money to another account',
        '**Bill Payment**: Client pays utility bills or services',
        '**Deposit**: Cash or check deposited to account',
        '**Withdrawal**: Cash withdrawn from account',
        '**Transaction History**: Client reviews past transactions',
        '**Reconciliation**: Bank matches transactions with account balances'
      ],
      dataUsage: 'Transaction data is critical for auditing, fraud detection, and financial reporting'
    },
    'Card': {
      purpose: 'Represents a debit or credit card linked to an account',
      businessRole: 'Enables card-based payments and withdrawals',
      workflows: [
        '**Card Issuance**: Client requests a new card',
        '**Card Activation**: Client activates card before first use',
        '**Purchase**: Client uses card for online/offline purchases',
        '**ATM Withdrawal**: Client withdraws cash using card',
        '**Card Blocking**: Client blocks lost/stolen card',
        '**Limit Management**: Client sets spending limits'
      ],
      dataUsage: 'Card data is used for payment processing, fraud prevention, and customer analytics'
    }
  };

  const bizContext = businessContext[entityName] || {
    purpose: `Represents a ${entityName.toLowerCase()} in the business domain`,
    businessRole: `Manages ${entityName.toLowerCase()} data and relationships`,
    workflows: ['Data creation, retrieval, update, and deletion operations'],
    dataUsage: `${entityName} data is used for business operations and reporting`
  };

  let response = `**${entityName} - Business & Functional Explanation**\n\n`;
  response += `📋 **Business Purpose:**\n${bizContext.purpose}\n\n`;
  response += `🎯 **Business Role:**\n${bizContext.businessRole}\n\n`;

  response += `**📊 Business Data (${properties.length} fields):**\n`;
  properties.forEach((prop: any) => {
    const businessMeaning = getBusinessMeaning(prop.name, entityName);
    response += `- **${prop.name}** (\`${prop.type}\`): ${businessMeaning}\n`;
  });

  response += `\n**🔄 Business Workflows:**\n`;
  bizContext.workflows.forEach((wf: string) => {
    response += `${wf}\n`;
  });

  response += `\n**💼 Data Usage:**\n${bizContext.dataUsage}\n\n`;

  response += `**🔗 Related Business Processes:**\n`;
  if (entityName === 'User' || entityName === 'Client') {
    response += `- Authentication and authorization\n- Profile management\n- Customer service\n`;
  }
  if (entityName === 'Account' || entityName === 'Transaction') {
    response += `- Financial operations\n- Reporting and analytics\n- Compliance and auditing\n`;
  }
  if (entityName === 'Card') {
    response += `- Payment processing\n- Fraud detection\n- Customer convenience\n`;
  }

  response += `\n**🎓 Business Rules:**\n`;
  response += getBusinessRules(entityName);

  return response;
}

/**
 * Get business meaning of a property
 */
function getBusinessMeaning(propName: string, entityName: string): string {
  const meanings: any = {
    'id': 'Unique identifier for database and system tracking',
    'username': 'User\'s login name for authentication',
    'email': 'Contact email for communications and notifications',
    'password': 'Encrypted credential for secure authentication',
    'role': 'User\'s access level (admin, employee, customer)',
    'enabled': 'Whether the user account is active',
    'firstName': 'Customer\'s first name for personalization',
    'lastName': 'Customer\'s last name for official records',
    'phone': 'Contact phone for SMS notifications and verification',
    'address': 'Physical address for correspondence and legal purposes',
    'birthDate': 'Date of birth for age verification and KYC compliance',
    'accountNumber': 'Unique account identifier for transactions',
    'accountType': 'Type of account (checking, savings) determines features',
    'balance': 'Current amount of money in the account',
    'status': 'Account state (active, frozen, closed)',
    'amount': 'Transaction value in currency',
    'type': 'Category of operation (deposit, withdrawal, transfer)',
    'timestamp': 'When the transaction occurred for audit trail',
    'cardNumber': 'Unique card identifier for payments',
    'expiryDate': 'When card expires and needs renewal',
    'limit': 'Maximum spending allowed per transaction/day',
    'createdAt': 'Record creation timestamp for audit',
    'updatedAt': 'Last modification timestamp for tracking changes'
  };

  return meanings[propName] || `${propName} data for ${entityName} management`;
}

/**
 * Get business rules for an entity
 */
function getBusinessRules(entityName: string): string {
  const rules: any = {
    'User': '- Unique username required\n- Strong password policy enforced\n- Email must be verified\n- Account can be disabled for security',
    'Client': '- One client can have multiple accounts\n- KYC documentation required\n- Minimum age requirement (usually 18+)\n- Contact information must be current',
    'Account': '- Cannot have negative balance (or overdraft rules apply)\n- Transactions logged for audit\n- Interest calculated based on account type\n- Minimum balance requirements may apply',
    'Transaction': '- Must reference valid source and destination accounts\n- Amount must be positive\n- Cannot exceed available balance (for withdrawals)\n- Immutable once completed (audit requirement)',
    'Card': '- Must be linked to an active account\n- Daily/monthly spending limits enforced\n- Requires activation before use\n- Can be temporarily blocked by customer'
  };

  return rules[entityName] || '- Standard data validation rules apply\n- Referential integrity maintained\n- Audit trail captured';
}

/**
 * Generate feature business explanation
 */
function generateFeatureBusinessExplanation(feature: string, context: any): string {
  const explanations: any = {
    'authentication': `**🔐 Authentication & Security - Business Explanation**\n\n` +
      `**Business Need:**\nSecure access control is critical for protecting customer data and preventing unauthorized transactions.\n\n` +
      `**User Journey:**\n` +
      `1. **Registration**: New user creates account with email and password\n` +
      `2. **Login**: User enters credentials to access the system\n` +
      `3. **Session**: User stays logged in for convenience\n` +
      `4. **Logout**: User ends session securely\n` +
      `5. **Password Recovery**: User resets forgotten password via email\n\n` +
      `**Business Value:**\n` +
      `✓ **Security**: Prevents unauthorized access to accounts\n` +
      `✓ **Compliance**: Meets regulatory requirements (PCI-DSS, GDPR)\n` +
      `✓ **Trust**: Customers feel safe using the platform\n` +
      `✓ **Audit**: Track who accessed what and when\n\n` +
      `**Role-Based Access:**\n` +
      `- **Admin**: Full system access, user management\n` +
      `- **Employee**: Access to customer data, transaction processing\n` +
      `- **Customer**: Access only to own accounts and data`,

    'client': `**👤 Client Management - Business Explanation**\n\n` +
      `**Business Need:**\nEffective customer relationship management drives retention and enables personalized service.\n\n` +
      `**Customer Lifecycle:**\n` +
      `1. **Acquisition**: New client signs up or is registered by employee\n` +
      `2. **Onboarding**: KYC verification, initial account opening\n` +
      `3. **Engagement**: Client uses banking services regularly\n` +
      `4. **Retention**: Bank maintains relationship through quality service\n` +
      `5. **Offboarding**: Client closes accounts (if needed)\n\n` +
      `**Business Operations:**\n` +
      `- **Customer Service**: Quick access to client profiles\n` +
      `- **Marketing**: Segment clients for targeted campaigns\n` +
      `- **Compliance**: Maintain current KYC documentation\n` +
      `- **Analytics**: Understand customer behavior patterns\n\n` +
      `**Business Value:**\n` +
      `✓ **Personalization**: Tailor services to client needs\n` +
      `✓ **Efficiency**: Fast client lookup and updates\n` +
      `✓ **Cross-selling**: Identify opportunities for additional products\n` +
      `✓ **Satisfaction**: Better service through complete data`,

    'account': `**💰 Account Management - Business Explanation**\n\n` +
      `**Business Need:**\nAccounts are the foundation of banking - they hold customer money and enable all financial operations.\n\n` +
      `**Account Lifecycle:**\n` +
      `1. **Opening**: Client requests new account (savings/checking)\n` +
      `2. **Activation**: Initial deposit activates the account\n` +
      `3. **Active Use**: Regular deposits, withdrawals, transfers\n` +
      `4. **Maintenance**: Interest calculations, fee processing\n` +
      `5. **Closure**: Client closes account, final balance disbursed\n\n` +
      `**Daily Operations:**\n` +
      `- **Balance Inquiries**: Customers check available funds\n` +
      `- **Transaction Processing**: Debits and credits update balance\n` +
      `- **Statement Generation**: Monthly summaries for customers\n` +
      `- **Overdraft Management**: Handle insufficient funds situations\n\n` +
      `**Account Types:**\n` +
      `- **Checking**: Day-to-day transactions, debit card access\n` +
      `- **Savings**: Higher interest, limited withdrawals\n` +
      `- **Joint Accounts**: Shared by multiple clients\n\n` +
      `**Business Value:**\n` +
      `✓ **Revenue**: Interest spreads, account fees\n` +
      `✓ **Customer Deposits**: Source of funds for lending\n` +
      `✓ **Relationship**: Primary touchpoint with customers\n` +
      `✓ **Data**: Transaction patterns for analytics`,

    'transaction': `**💸 Transaction Processing - Business Explanation**\n\n` +
      `**Business Need:**\nTransactions are the lifeblood of banking - they represent money movement and must be fast, secure, and accurate.\n\n` +
      `**Transaction Types:**\n` +
      `1. **Transfers**: Money moves between accounts\n` +
      `2. **Deposits**: Money added to account (cash, check, wire)\n` +
      `3. **Withdrawals**: Money removed from account\n` +
      `4. **Payments**: Bills paid to merchants/utilities\n` +
      `5. **Card Purchases**: Payments via debit/credit card\n\n` +
      `**Transaction Flow:**\n` +
      `1. **Initiation**: Customer or system initiates transaction\n` +
      `2. **Validation**: Check sufficient funds, account status\n` +
      `3. **Authorization**: Security checks pass\n` +
      `4. **Execution**: Debit source, credit destination\n` +
      `5. **Confirmation**: Notify customer, update balances\n` +
      `6. **Recording**: Create audit trail\n\n` +
      `**Business Critical:**\n` +
      `- **Accuracy**: No money lost or created incorrectly\n` +
      `- **Speed**: Real-time or near-real-time processing\n` +
      `- **Security**: Prevent fraud and unauthorized transactions\n` +
      `- **Audit**: Complete trail for compliance and disputes\n\n` +
      `**Business Value:**\n` +
      `✓ **Customer Convenience**: Easy money movement\n` +
      `✓ **Fee Revenue**: Transaction fees for certain operations\n` +
      `✓ **Fraud Detection**: Monitor patterns for suspicious activity\n` +
      `✓ **Reporting**: Track bank's transaction volume and health`,

    'card': `**💳 Card Management - Business Explanation**\n\n` +
      `**Business Need:**\nCards provide convenient payment methods and reduce cash handling, while generating fee revenue.\n\n` +
      `**Card Lifecycle:**\n` +
      `1. **Request**: Customer applies for debit/credit card\n` +
      `2. **Issuance**: Bank produces and ships physical card\n` +
      `3. **Activation**: Customer activates card before use\n` +
      `4. **Active Use**: Card used for purchases, withdrawals\n` +
      `5. **Renewal**: Card renewed before expiration\n` +
      `6. **Cancellation**: Card blocked/closed when needed\n\n` +
      `**Card Operations:**\n` +
      `- **POS Purchases**: Customer buys at stores\n` +
      `- **Online Payments**: E-commerce transactions\n` +
      `- **ATM Withdrawals**: Cash dispensed at ATMs\n` +
      `- **Contactless Payments**: Tap-to-pay convenience\n` +
      `- **Limit Management**: Daily/monthly spending caps\n` +
      `- **Card Blocking**: Security feature for lost cards\n\n` +
      `**Card Types:**\n` +
      `- **Debit Card**: Linked to checking account, instant debit\n` +
      `- **Credit Card**: Revolving credit line, monthly billing\n` +
      `- **Prepaid Card**: Preloaded with fixed amount\n\n` +
      `**Business Value:**\n` +
      `✓ **Convenience**: Customers prefer cards to cash\n` +
      `✓ **Revenue**: Interchange fees, annual fees, interest\n` +
      `✓ **Data**: Purchase patterns for marketing insights\n` +
      `✓ **Loyalty**: Cards increase customer stickiness`
  };

  return explanations[feature] || `**${feature} Feature:**\n\nThis feature provides essential business functionality for banking operations.`;
}

/**
 * Generate workflow explanation
 */
function generateWorkflowExplanation(context: any): string {
  return `**🔄 Key Business Workflows in ${context.projectName || 'the System'}**\n\n` +
    `## 1️⃣ Customer Onboarding Workflow\n` +
    `**Goal**: Convert new prospect into active banking customer\n\n` +
    `**Steps:**\n` +
    `1. Customer visits bank or website\n` +
    `2. Employee creates Client profile\n` +
    `3. KYC verification (ID, address proof)\n` +
    `4. Client opens first account (checking/savings)\n` +
    `5. Initial deposit made\n` +
    `6. Debit card issued\n` +
    `7. Online banking credentials provided\n` +
    `8. Customer activated and can start using services\n\n` +
    `**Business Impact**: Quick onboarding = better customer experience\n\n` +
    `---\n\n` +
    `## 2️⃣ Money Transfer Workflow\n` +
    `**Goal**: Move money between accounts safely and quickly\n\n` +
    `**Steps:**\n` +
    `1. Customer logs in to banking app\n` +
    `2. Selects "Transfer" option\n` +
    `3. Enters destination account number\n` +
    `4. Specifies amount and reason\n` +
    `5. System validates: sufficient balance, valid account, limits\n` +
    `6. Customer confirms transaction\n` +
    `7. System debits source account\n` +
    `8. System credits destination account\n` +
    `9. Transaction recorded for audit\n` +
    `10. Both customers receive confirmation notifications\n\n` +
    `**Business Impact**: Reliable transfers = customer trust and satisfaction\n\n` +
    `---\n\n` +
    `## 3️⃣ Card Payment Workflow\n` +
    `**Goal**: Process card purchase at merchant\n\n` +
    `**Steps:**\n` +
    `1. Customer presents card at POS terminal\n` +
    `2. Terminal reads card number\n` +
    `3. Merchant submits authorization request\n` +
    `4. Bank validates: card active, not expired, sufficient balance\n` +
    `5. Bank checks transaction against fraud patterns\n` +
    `6. Bank authorizes or declines transaction\n` +
    `7. If approved, amount reserved on account\n` +
    `8. Transaction settles within 24-48 hours\n` +
    `9. Final debit appears on account statement\n\n` +
    `**Business Impact**: Fast authorization = better customer experience\n\n` +
    `---\n\n` +
    `## 4️⃣ Account Statement Workflow\n` +
    `**Goal**: Provide customers with transaction history\n\n` +
    `**Steps:**\n` +
    `1. System runs monthly batch job\n` +
    `2. Collects all transactions for each account\n` +
    `3. Calculates: starting balance, transactions, fees, interest, ending balance\n` +
    `4. Generates PDF statement\n` +
    `5. Statement emailed to customer\n` +
    `6. Statement also available in online banking\n` +
    `7. Customer can download anytime\n\n` +
    `**Business Impact**: Transparency builds trust and compliance\n\n` +
    `---\n\n` +
    `## 5️⃣ Fraud Detection Workflow\n` +
    `**Goal**: Identify and prevent fraudulent transactions\n\n` +
    `**Steps:**\n` +
    `1. Customer attempts transaction\n` +
    `2. System analyzes: location, amount, time, merchant\n` +
    `3. Compares to customer's normal patterns\n` +
    `4. Checks against fraud rule engine\n` +
    `5. If suspicious: transaction blocked, customer notified\n` +
    `6. Customer verifies if legitimate or fraud\n` +
    `7. If fraud: card blocked, new card issued\n` +
    `8. If legitimate: transaction allowed, pattern learned\n\n` +
    `**Business Impact**: Prevents losses, protects customers, reduces chargebacks\n\n` +
    `---\n\n` +
    `**💡 All workflows are designed to:**\n` +
    `- Maximize customer convenience\n` +
    `- Ensure security and compliance\n` +
    `- Provide audit trails\n` +
    `- Enable data-driven decisions\n\n` +
    `**Ask me about any specific workflow for more details!**`;
}

/**
 * Generate plan response with the ability to update the plan
 */
function generatePlanResponseWithUpdates(message: string, plan: any): { response: string; updatedPlan: any; planModified: boolean } {
  const lowerMessage = message.toLowerCase();
  let updatedPlan = JSON.parse(JSON.stringify(plan)); // Deep clone
  let planModified = false;
  let response = '';

  // COMBINE/MERGE SERVICES
  if (lowerMessage.includes('combine') || lowerMessage.includes('merge')) {
    const combineMatch = message.match(/combine\s+(?:the\s+)?([a-z-]+(?:-service)?)\s+and\s+([a-z-]+(?:-service)?)/i);

    if (combineMatch) {
      const service1Name = combineMatch[1].toLowerCase();
      const service2Name = combineMatch[2].toLowerCase();

      const service1 = updatedPlan.microservices?.find((s: any) => s.name.toLowerCase().includes(service1Name));
      const service2 = updatedPlan.microservices?.find((s: any) => s.name.toLowerCase().includes(service2Name));

      if (service1 && service2) {
        // Merge service2 into service1
        service1.entities = [...(service1.entities || []), ...(service2.entities || [])];
        service1.endpoints = [...(service1.endpoints || []), ...(service2.endpoints || [])];
        service1.name = `${service1Name.replace('-service', '')}-${service2Name.replace('-service', '')}-service`;

        // Remove service2
        updatedPlan.microservices = updatedPlan.microservices.filter((s: any) => s !== service2);

        planModified = true;
        response = `✅ **Plan Updated!**\n\n` +
          `I've combined **${service1.name}** and **${service2.name}** into a single service:\n\n` +
          `**New Service:** ${service1.name}\n` +
          `- Port: ${service1.port}\n` +
          `- Entities: ${service1.entities.length}\n` +
          `- Endpoints: ${service1.endpoints.length}\n\n` +
          `**Benefits:**\n` +
          `✓ Reduced operational complexity\n` +
          `✓ Shared database for related entities\n` +
          `✓ Simpler service mesh\n\n` +
          `**Total services now:** ${updatedPlan.microservices.length}`;
      } else {
        response = `❌ Could not find services matching "${service1Name}" and "${service2Name}". Available services:\n` +
          updatedPlan.microservices?.map((s: any) => `- ${s.name}`).join('\n');
      }
    } else {
      response = `To combine services, please specify which ones:\n\n**Example:** "Combine the user-service and auth-service"`;
    }
  }

  // SPLIT SERVICE
  else if (lowerMessage.includes('split') || lowerMessage.includes('divide')) {
    const splitMatch = message.match(/split\s+(?:the\s+)?([a-z-]+(?:-service)?)\s+into\s+([a-z-]+(?:-service)?)\s+and\s+([a-z-]+(?:-service)?)/i);

    if (splitMatch) {
      const originalName = splitMatch[1].toLowerCase();
      const newService1Name = splitMatch[2].toLowerCase().replace(/\s+/g, '-') + '-service';
      const newService2Name = splitMatch[3].toLowerCase().replace(/\s+/g, '-') + '-service';

      const originalService = updatedPlan.microservices?.find((s: any) => s.name.toLowerCase().includes(originalName));

      if (originalService) {
        const entities = originalService.entities || [];
        const endpoints = originalService.endpoints || [];

        // Split entities roughly in half
        const midpoint = Math.ceil(entities.length / 2);

        const newService1 = {
          name: newService1Name,
          port: originalService.port,
          entities: entities.slice(0, midpoint),
          endpoints: endpoints.slice(0, Math.ceil(endpoints.length / 2))
        };

        const newService2 = {
          name: newService2Name,
          port: originalService.port + 1,
          entities: entities.slice(midpoint),
          endpoints: endpoints.slice(Math.ceil(endpoints.length / 2))
        };

        // Remove original, add new services
        updatedPlan.microservices = updatedPlan.microservices.filter((s: any) => s !== originalService);
        updatedPlan.microservices.push(newService1, newService2);

        planModified = true;
        response = `✅ **Plan Updated!**\n\n` +
          `I've split **${originalService.name}** into two services:\n\n` +
          `**${newService1.name}**\n` +
          `- Port: ${newService1.port}\n` +
          `- Entities: ${newService1.entities.length}\n` +
          `- Endpoints: ${newService1.endpoints.length}\n\n` +
          `**${newService2.name}**\n` +
          `- Port: ${newService2.port}\n` +
          `- Entities: ${newService2.entities.length}\n` +
          `- Endpoints: ${newService2.endpoints.length}\n\n` +
          `**Benefits:**\n` +
          `✓ Better isolation and independence\n` +
          `✓ More granular scaling\n` +
          `✓ Clearer boundaries\n\n` +
          `**Total services now:** ${updatedPlan.microservices.length}`;
      } else {
        response = `❌ Could not find service matching "${originalName}". Available services:\n` +
          updatedPlan.microservices?.map((s: any) => `- ${s.name}`).join('\n');
      }
    } else {
      response = `To split a service, please specify:\n\n**Example:** "Split the account-service into account-service and transaction-service"`;
    }
  }

  // CHANGE PORT
  else if (lowerMessage.includes('change') && lowerMessage.includes('port')) {
    const portMatch = message.match(/change\s+(?:the\s+)?([a-z-]+(?:-service|-mfe|shell)?)\s+port\s+to\s+(\d+)/i);

    if (portMatch) {
      const serviceName = portMatch[1].toLowerCase();
      const newPort = parseInt(portMatch[2]);

      // Check microservices
      let service = updatedPlan.microservices?.find((s: any) => s.name.toLowerCase().includes(serviceName));
      let serviceType = 'service';

      // Check micro-frontends if not found in services
      if (!service) {
        service = updatedPlan.microFrontends?.find((m: any) => m.name.toLowerCase().includes(serviceName));
        serviceType = 'micro-frontend';
      }

      if (service) {
        const oldPort = service.port;
        service.port = newPort;

        planModified = true;
        response = `✅ **Plan Updated!**\n\n` +
          `Changed **${service.name}** port:\n` +
          `- Old port: ${oldPort}\n` +
          `- New port: ${newPort}\n\n` +
          `**Note:** Make sure port ${newPort} is not used by another service!`;
      } else {
        response = `❌ Could not find "${serviceName}". Available:\n\n**Services:**\n` +
          updatedPlan.microservices?.map((s: any) => `- ${s.name} (port ${s.port})`).join('\n') +
          `\n\n**Micro-frontends:**\n` +
          updatedPlan.microFrontends?.map((m: any) => `- ${m.name} (port ${m.port})`).join('\n');
      }
    } else {
      response = `To change a port, please specify:\n\n**Example:** "Change the shell port to 3000"`;
    }
  }

  // RENAME SERVICE
  else if (lowerMessage.includes('rename')) {
    const renameMatch = message.match(/rename\s+(?:the\s+)?([a-z-]+(?:-service)?)\s+to\s+([a-z-]+(?:-service)?)/i);

    if (renameMatch) {
      const oldName = renameMatch[1].toLowerCase();
      const newName = renameMatch[2].toLowerCase();

      const service = updatedPlan.microservices?.find((s: any) => s.name.toLowerCase().includes(oldName));

      if (service) {
        const originalName = service.name;
        service.name = newName.includes('-service') ? newName : newName + '-service';

        planModified = true;
        response = `✅ **Plan Updated!**\n\n` +
          `Renamed service:\n` +
          `- Old name: ${originalName}\n` +
          `- New name: ${service.name}\n\n` +
          `All entities and endpoints remain the same.`;
      } else {
        response = `❌ Could not find service matching "${oldName}". Available services:\n` +
          updatedPlan.microservices?.map((s: any) => `- ${s.name}`).join('\n');
      }
    } else {
      response = `To rename a service, please specify:\n\n**Example:** "Rename the user-service to identity-service"`;
    }
  }

  // REMOVE/DELETE SERVICE
  else if (lowerMessage.includes('remove') || lowerMessage.includes('delete')) {
    const removeMatch = message.match(/(?:remove|delete)\s+(?:the\s+)?([a-z-]+(?:-service)?)/i);

    if (removeMatch) {
      const serviceName = removeMatch[1].toLowerCase();
      const service = updatedPlan.microservices?.find((s: any) => s.name.toLowerCase().includes(serviceName));

      if (service) {
        updatedPlan.microservices = updatedPlan.microservices.filter((s: any) => s !== service);

        planModified = true;
        response = `✅ **Plan Updated!**\n\n` +
          `Removed **${service.name}** from the plan.\n\n` +
          `**Warning:** Make sure its entities and endpoints are handled by other services!\n\n` +
          `**Total services now:** ${updatedPlan.microservices.length}`;
      } else {
        response = `❌ Could not find service matching "${serviceName}". Available services:\n` +
          updatedPlan.microservices?.map((s: any) => `- ${s.name}`).join('\n');
      }
    } else {
      response = `To remove a service, please specify:\n\n**Example:** "Remove the legacy-service"`;
    }
  }

  // No modification requested - just return normal response
  else {
    response = generatePlanResponse(message, plan);
  }

  return {
    response,
    updatedPlan: planModified ? updatedPlan : null,
    planModified
  };
}

/**
 * Generate intelligent responses for migration plan discussions
 */
function generatePlanResponse(message: string, plan: any): string {
  const lowerMessage = message.toLowerCase();
  const microservices = plan.microservices || [];
  const microFrontends = plan.microFrontends || [];

  // Service count and overview questions
  if (lowerMessage.includes('how many') && (lowerMessage.includes('service') || lowerMessage.includes('microservice'))) {
    let response = `The migration plan includes **${microservices.length} microservices**:\n\n`;
    microservices.forEach((svc: any, idx: number) => {
      response += `${idx + 1}. **${svc.name || svc.displayName}** (Port ${svc.port})\n`;
      response += `   - ${svc.entities?.length || 0} entities, ${svc.endpoints?.length || 0} endpoints\n`;
    });
    response += `\n**Architecture Pattern:** Database-per-service with independent deployments`;
    return response;
  }

  // Micro-frontend questions
  if (lowerMessage.includes('micro-frontend') || lowerMessage.includes('microfrontend') || lowerMessage.includes('mfe')) {
    let response = `The plan includes **${microFrontends.length} micro-frontends** using **Module Federation**:\n\n`;
    microFrontends.forEach((mfe: any, idx: number) => {
      response += `${idx + 1}. **${mfe.name}** (Port ${mfe.port})${mfe.isHost ? ' 🏠 **Shell/Host**' : ''}\n`;
      response += `   - ${mfe.routes?.length || 0} routes, ${mfe.components?.length || 0} components\n`;
    });
    response += `\n**Strategy:** Shell application loads remote micro-frontends dynamically at runtime`;
    return response;
  }

  // Port configuration questions
  if (lowerMessage.includes('port') && (lowerMessage.includes('what') || lowerMessage.includes('which') || lowerMessage.includes('list'))) {
    let response = `**Port Allocation:**\n\n`;
    response += `**Backend Services:**\n`;
    microservices.forEach((svc: any) => {
      response += `- **${svc.name}**: \`${svc.port}\`\n`;
    });
    response += `\n**Frontend Applications:**\n`;
    microFrontends.forEach((mfe: any) => {
      response += `- **${mfe.name}**: \`${mfe.port}\`${mfe.isHost ? ' (Shell)' : ''}\n`;
    });
    response += `\n💡 **Tip:** Ports are auto-assigned starting from 8081 (backend) and 4200 (frontend). You can request specific ports if needed!`;
    return response;
  }

  // Service grouping explanation
  if (lowerMessage.includes('why') && (lowerMessage.includes('group') || lowerMessage.includes('separate') || lowerMessage.includes('split'))) {
    return `**Service Grouping Strategy:**\n\n` +
      `Services are organized based on:\n\n` +
      `1. **Domain Boundaries:** Each service represents a distinct business domain\n` +
      `2. **Entity Ownership:** Related entities are grouped together\n` +
      `3. **API Cohesion:** Controllers managing similar resources are co-located\n` +
      `4. **Single Responsibility:** Each service has one clear purpose\n\n` +
      `**Benefits:**\n` +
      `✓ Independent deployment and scaling\n` +
      `✓ Team autonomy and parallel development\n` +
      `✓ Technology flexibility per service\n` +
      `✓ Fault isolation\n\n` +
      `**Want to change grouping?** Tell me which services to combine or split!`;
  }

  // Combine services request
  if (lowerMessage.includes('combine') || lowerMessage.includes('merge') || lowerMessage.includes('join')) {
    return `**Combining Services:**\n\n` +
      `I can help you combine related services! To merge services:\n\n` +
      `**Example:** "Combine the user-service and auth-service into an identity-service"\n\n` +
      `**Considerations:**\n` +
      `- ✓ Reduced operational complexity\n` +
      `- ✓ Shared database for related entities\n` +
      `- ✓ Simpler service mesh\n` +
      `- ⚠️ Less granular scaling\n` +
      `- ⚠️ Larger codebase per service\n\n` +
      `**Best for:** Tightly coupled domains with shared transactions\n\n` +
      `Which services would you like to combine?`;
  }

  // Split service request
  if (lowerMessage.includes('split') || lowerMessage.includes('separate') || lowerMessage.includes('divide')) {
    return `**Splitting Services:**\n\n` +
      `I can help you split a service into smaller ones! To divide a service:\n\n` +
      `**Example:** "Split the account-service into account-service and transaction-service"\n\n` +
      `**Considerations:**\n` +
      `- ✓ Better isolation and independence\n` +
      `- ✓ More granular scaling\n` +
      `- ✓ Clearer boundaries\n` +
      `- ⚠️ More services to manage\n` +
      `- ⚠️ Potential distributed transactions\n\n` +
      `**Best for:** Services with multiple distinct responsibilities\n\n` +
      `Which service would you like to split, and how?`;
  }

  // Port change request
  if (lowerMessage.includes('change port') || lowerMessage.includes('different port') || lowerMessage.includes('port conflict')) {
    return `**Changing Port Assignments:**\n\n` +
      `I can adjust port numbers for any service or micro-frontend.\n\n` +
      `**Current Ranges:**\n` +
      `- Backend services: 8081-${8081 + microservices.length - 1}\n` +
      `- Frontend apps: 4200-${4200 + microFrontends.length - 1}\n\n` +
      `**To change a port, specify:**\n` +
      `"Change user-service port to 9000"\n` +
      `"Move shell micro-frontend to port 3000"\n\n` +
      `**Tips:**\n` +
      `- Avoid common ports: 80, 443, 3000, 8080\n` +
      `- Use high ports (>1024) to avoid permission issues\n` +
      `- Ensure no conflicts with existing services\n\n` +
      `Which port would you like to change?`;
  }

  // Best practices and recommendations
  if (lowerMessage.includes('best practice') || lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('improve')) {
    return `**Architecture Best Practices & Recommendations:**\n\n` +
      `**✓ Current Strengths:**\n` +
      `- Database-per-service pattern ensures data independence\n` +
      `- Module Federation for efficient micro-frontend loading\n` +
      `- RESTful APIs with clear contracts\n` +
      `- JWT authentication for stateless security\n\n` +
      `**💡 Recommended Enhancements:**\n\n` +
      `1. **API Gateway**\n` +
      `   - Add Kong/NGINX for unified entry point\n` +
      `   - Centralized authentication and rate limiting\n\n` +
      `2. **Service Discovery**\n` +
      `   - Use Consul/Eureka for dynamic service registration\n` +
      `   - Enable client-side load balancing\n\n` +
      `3. **Event-Driven Communication**\n` +
      `   - Add Kafka/RabbitMQ for async events\n` +
      `   - Reduce coupling between services\n\n` +
      `4. **Observability**\n` +
      `   - Implement distributed tracing (Jaeger)\n` +
      `   - Centralized logging (ELK stack)\n` +
      `   - Metrics and monitoring (Prometheus/Grafana)\n\n` +
      `5. **Circuit Breakers**\n` +
      `   - Add Resilience4j for fault tolerance\n` +
      `   - Implement retry and fallback strategies\n\n` +
      `**Would you like to discuss any of these in detail?**`;
  }

  // Database strategy questions
  if (lowerMessage.includes('database') || lowerMessage.includes('data')) {
    return `**Database Strategy:**\n\n` +
      `**Pattern:** Database-per-Service\n\n` +
      `Each microservice has its own database instance:\n` +
      `${microservices.map((svc: any, idx: number) => `${idx + 1}. **${svc.name}** → ${svc.entities?.length || 0} entities`).join('\n')}\n\n` +
      `**Benefits:**\n` +
      `✓ **Loose Coupling:** Services don't share database schemas\n` +
      `✓ **Independent Scaling:** Scale databases based on service needs\n` +
      `✓ **Technology Choice:** Each service can use optimal database type\n` +
      `✓ **Resilience:** Database issues isolated to one service\n\n` +
      `**Challenges & Solutions:**\n` +
      `- **Data Consistency:** Use Saga pattern for distributed transactions\n` +
      `- **Cross-Service Queries:** Implement CQRS with read models\n` +
      `- **Data Duplication:** Accept bounded duplication for autonomy\n\n` +
      `**Alternative:** Shared database with schema-per-service (easier to start, limits autonomy)`;
  }

  // Deployment and DevOps questions
  if (lowerMessage.includes('deploy') || lowerMessage.includes('devops') || lowerMessage.includes('ci/cd') || lowerMessage.includes('docker') || lowerMessage.includes('kubernetes')) {
    return `**Deployment Strategy:**\n\n` +
      `**Containerization:**\n` +
      `- Each service gets a Dockerfile\n` +
      `- Multi-stage builds for optimization\n` +
      `- Base images: \`eclipse-temurin:17-jre\` (backend), \`nginx:alpine\` (frontend)\n\n` +
      `**Orchestration:**\n` +
      `- Kubernetes deployments with health checks\n` +
      `- ConfigMaps for environment configuration\n` +
      `- Secrets for sensitive data (DB passwords, JWT keys)\n` +
      `- Horizontal Pod Autoscaling (HPA)\n\n` +
      `**CI/CD Pipeline:**\n` +
      `1. **Build:** Maven/npm builds in parallel\n` +
      `2. **Test:** Unit and integration tests\n` +
      `3. **Scan:** Security and dependency scanning\n` +
      `4. **Package:** Docker image creation and push\n` +
      `5. **Deploy:** Rolling deployment to K8s\n\n` +
      `**Service Mesh:** Consider Istio for:\n` +
      `- Traffic management and routing\n` +
      `- Observability and tracing\n` +
      `- Security policies\n` +
      `- Blue-green deployments`;
  }

  // Testing strategy
  if (lowerMessage.includes('test') || lowerMessage.includes('quality')) {
    return `**Testing Strategy:**\n\n` +
      `**1. Unit Tests**\n` +
      `- Service layer: Business logic validation\n` +
      `- Component tests: Angular components\n` +
      `- Target coverage: 80%+\n\n` +
      `**2. Integration Tests**\n` +
      `- API endpoint tests with TestRestTemplate\n` +
      `- Database integration with @DataJpaTest\n` +
      `- Micro-frontend integration tests\n\n` +
      `**3. Contract Tests**\n` +
      `- Spring Cloud Contract for API contracts\n` +
      `- Ensure service compatibility\n` +
      `- Consumer-driven testing\n\n` +
      `**4. End-to-End Tests**\n` +
      `- Cypress/Playwright for user flows\n` +
      `- Test cross-service interactions\n` +
      `- Run in staging environment\n\n` +
      `**5. Performance Tests**\n` +
      `- JMeter/Gatling for load testing\n` +
      `- Establish baselines per service\n` +
      `- Monitor degradation\n\n` +
      `**Quality Gates:** All tests must pass before deployment`;
  }

  // Architecture overview
  if (lowerMessage.includes('architecture') || lowerMessage.includes('overview') || lowerMessage.includes('explain')) {
    return `**Migration Architecture Overview:**\n\n` +
      `**🎯 Target State:** Modern Microservices + Micro-Frontends\n\n` +
      `**Backend (${microservices.length} Microservices):**\n` +
      `- Spring Boot 3.2+ with Java 17\n` +
      `- RESTful APIs with OpenAPI documentation\n` +
      `- JPA/Hibernate for data persistence\n` +
      `- JWT-based authentication\n` +
      `- Docker containerized\n\n` +
      `**Frontend (${microFrontends.length} Micro-Frontends):**\n` +
      `- Angular 18 with standalone components\n` +
      `- Module Federation (Webpack 5)\n` +
      `- Shell architecture with dynamic loading\n` +
      `- Shared routing and state management\n\n` +
      `**Key Principles:**\n` +
      `1. **Domain-Driven Design:** Services aligned with business domains\n` +
      `2. **Decentralized Data:** Database-per-service pattern\n` +
      `3. **Independent Deployment:** Each service/MFE deploys separately\n` +
      `4. **API-First:** Clear contracts between services\n` +
      `5. **Cloud-Native:** Designed for Kubernetes deployment\n\n` +
      `**Ask me about specific aspects:** services, frontends, deployment, testing, or best practices!`;
  }

  // Service details
  const mentionedService = microservices.find((svc: any) =>
    lowerMessage.includes(svc.name?.toLowerCase()) || lowerMessage.includes(svc.displayName?.toLowerCase())
  );

  if (mentionedService) {
    let response = `**${mentionedService.name || mentionedService.displayName} Service:**\n\n`;
    response += `**Port:** ${mentionedService.port}\n`;
    response += `**Entities:** ${mentionedService.entities?.length || 0}\n`;
    response += `**Endpoints:** ${mentionedService.endpoints?.length || 0}\n\n`;

    if (mentionedService.entities && mentionedService.entities.length > 0) {
      response += `**Domain Entities:**\n`;
      mentionedService.entities.forEach((entity: any) => {
        response += `- ${entity.name || entity}\n`;
      });
    }

    response += `\n**Technology Stack:**\n`;
    response += `- Spring Boot 3.2.2\n`;
    response += `- Java 17\n`;
    response += `- Spring Data JPA\n`;
    response += `- Spring Security + JWT\n`;
    response += `- PostgreSQL/MySQL\n\n`;

    response += `**Features:**\n`;
    response += `✓ RESTful API endpoints\n`;
    response += `✓ OpenAPI/Swagger documentation\n`;
    response += `✓ Bean validation\n`;
    response += `✓ Exception handling\n`;
    response += `✓ Database migrations (Flyway)\n`;
    response += `✓ Docker containerization\n`;

    return response;
  }

  // Default helpful response
  return `I'm here to help you understand and adjust the migration plan!\n\n` +
    `**📊 Current Plan:**\n` +
    `- **${microservices.length} Microservices** (backend)\n` +
    `- **${microFrontends.length} Micro-Frontends** (frontend)\n\n` +
    `**💬 You can ask me:**\n` +
    `- "Why were services grouped this way?"\n` +
    `- "Can I combine the user and auth services?"\n` +
    `- "What ports are being used?"\n` +
    `- "Change the shell port to 3000"\n` +
    `- "Suggest improvements to this plan"\n` +
    `- "Explain the database strategy"\n` +
    `- "How do I deploy this?"\n\n` +
    `**🔧 I can help with:**\n` +
    `- Service grouping and boundaries\n` +
    `- Port assignments\n` +
    `- Architecture recommendations\n` +
    `- Best practices\n` +
    `- Deployment strategies\n\n` +
    `What would you like to know or adjust?`;
}

export default router;
