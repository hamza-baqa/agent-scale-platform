import fs from 'fs-extra';
import path from 'path';
import logger from '../utils/logger';

interface ArchitectureNode {
  id: string;
  label: string;
  type: 'module' | 'component' | 'service' | 'database' | 'api';
  attributes: Record<string, string>;
}

interface ArchitectureEdge {
  from: string;
  to: string;
  label?: string;
  type?: string;
}

interface ParsedArchitecture {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  metadata: {
    appName?: string;
    framework?: string;
    database?: string;
  };
}

export class DotArchitectureParser {

  /**
   * Parse DOT file and extract architecture information
   */
  async parseDotFile(filePath: string): Promise<ParsedArchitecture> {
    logger.info('Parsing DOT architecture file', { filePath });

    const content = await fs.readFile(filePath, 'utf-8');

    const architecture: ParsedArchitecture = {
      nodes: [],
      edges: [],
      metadata: {}
    };

    // Extract graph metadata (app name, framework, etc.)
    const graphMatch = content.match(/digraph\s+(\w+)\s*{/);
    if (graphMatch) {
      architecture.metadata.appName = graphMatch[1];
    }

    // Parse label attributes for metadata
    const labelMatch = content.match(/label\s*=\s*"([^"]+)"/);
    if (labelMatch) {
      const labelParts = labelMatch[1].split('\\n');
      labelParts.forEach(part => {
        const [key, value] = part.split(':').map(s => s.trim());
        if (key && value) {
          architecture.metadata[key.toLowerCase()] = value;
        }
      });
    }

    // Parse nodes (modules, components, services)
    const nodeRegex = /(\w+)\s*\[([^\]]+)\]/g;
    let nodeMatch;

    while ((nodeMatch = nodeRegex.exec(content)) !== null) {
      const nodeId = nodeMatch[1];
      const attributesStr = nodeMatch[2];

      const node: ArchitectureNode = {
        id: nodeId,
        label: nodeId,
        type: 'module',
        attributes: {}
      };

      // Parse attributes
      const attrRegex = /(\w+)\s*=\s*"([^"]+)"/g;
      let attrMatch;

      while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
        const attrName = attrMatch[1];
        const attrValue = attrMatch[2];

        node.attributes[attrName] = attrValue;

        if (attrName === 'label') {
          node.label = attrValue;
        }

        // Determine node type based on attributes
        if (attrValue.toLowerCase().includes('database') || attrValue.toLowerCase().includes('db')) {
          node.type = 'database';
        } else if (attrValue.toLowerCase().includes('service') || attrValue.toLowerCase().includes('api')) {
          node.type = 'service';
        } else if (attrValue.toLowerCase().includes('component') || attrValue.toLowerCase().includes('ui')) {
          node.type = 'component';
        }
      }

      architecture.nodes.push(node);
    }

    // Parse edges (connections between nodes)
    const edgeRegex = /(\w+)\s*->\s*(\w+)(?:\s*\[([^\]]+)\])?/g;
    let edgeMatch;

    while ((edgeMatch = edgeRegex.exec(content)) !== null) {
      const edge: ArchitectureEdge = {
        from: edgeMatch[1],
        to: edgeMatch[2]
      };

      if (edgeMatch[3]) {
        const labelMatch = edgeMatch[3].match(/label\s*=\s*"([^"]+)"/);
        if (labelMatch) {
          edge.label = labelMatch[1];
        }
      }

      architecture.edges.push(edge);
    }

    logger.info('Architecture parsed successfully', {
      nodes: architecture.nodes.length,
      edges: architecture.edges.length,
      appName: architecture.metadata.appName
    });

    return architecture;
  }

  /**
   * Convert parsed architecture to migration plan
   */
  architectureToMigrationPlan(architecture: ParsedArchitecture): any {
    const plan = {
      appName: architecture.metadata.appName || 'BankingApp',
      framework: architecture.metadata.framework || 'Angular',
      microservices: [] as any[],
      microFrontends: [] as any[],
      databases: [] as any[]
    };

    // Group nodes by type
    const serviceNodes = architecture.nodes.filter(n => n.type === 'service');
    const componentNodes = architecture.nodes.filter(n => n.type === 'component');
    const databaseNodes = architecture.nodes.filter(n => n.type === 'database');

    // Map services to microservices
    serviceNodes.forEach((node, index) => {
      const service = {
        name: this.toKebabCase(node.label),
        displayName: node.label,
        port: 8081 + index,
        entities: this.extractEntities(node, architecture),
        endpoints: this.extractEndpoints(node, architecture),
        database: this.findRelatedDatabase(node, architecture)
      };
      plan.microservices.push(service);
    });

    // Map components to micro-frontends
    componentNodes.forEach((node, index) => {
      const mfe = {
        name: this.toKebabCase(node.label) + '-mfe',
        displayName: node.label,
        port: 4201 + index,
        routes: this.extractRoutes(node, architecture),
        components: this.extractComponents(node, architecture),
        services: this.findRelatedServices(node, architecture)
      };
      plan.microFrontends.push(mfe);
    });

    // Add shell/host MFE if not present
    if (plan.microFrontends.length > 0 && !plan.microFrontends.some(mfe => mfe.name === 'shell')) {
      plan.microFrontends.unshift({
        name: 'shell',
        displayName: 'Shell',
        port: 4200,
        isHost: true,
        routes: plan.microFrontends.map(mfe => ({
          path: '/' + mfe.name.replace('-mfe', ''),
          remote: mfe.name
        }))
      });
    }

    // Map databases
    databaseNodes.forEach(node => {
      plan.databases.push({
        name: this.toKebabCase(node.label),
        type: 'PostgreSQL',
        port: 5432
      });
    });

    return plan;
  }

  /**
   * Extract entities from service node based on edges
   */
  private extractEntities(node: ArchitectureNode, architecture: ParsedArchitecture): any[] {
    const entities: any[] = [];

    // Find edges pointing to this service
    const incomingEdges = architecture.edges.filter(e => e.to === node.id);

    incomingEdges.forEach(edge => {
      const sourceNode = architecture.nodes.find(n => n.id === edge.from);
      if (sourceNode && sourceNode.type === 'database') {
        // Extract entity names from edge labels or node attributes
        if (edge.label) {
          const entityNames = edge.label.split(',').map(e => e.trim());
          entities.push(...entityNames.map(name => ({
            name: this.toPascalCase(name),
            fields: this.generateDefaultFields(name)
          })));
        }
      }
    });

    // If no entities found, create a default one based on service name
    if (entities.length === 0) {
      const entityName = node.label.replace(/Service|API/gi, '').trim();
      entities.push({
        name: this.toPascalCase(entityName),
        fields: this.generateDefaultFields(entityName)
      });
    }

    return entities;
  }

  /**
   * Extract API endpoints from node attributes
   */
  private extractEndpoints(node: ArchitectureNode, architecture: ParsedArchitecture): any[] {
    const endpoints: any[] = [];

    // Check if node has endpoints attribute
    if (node.attributes.endpoints) {
      const endpointList = node.attributes.endpoints.split(',').map(e => e.trim());
      endpointList.forEach(endpoint => {
        const [method, path] = endpoint.split(' ');
        endpoints.push({
          method: method || 'GET',
          path: path || `/${this.toKebabCase(node.label)}`
        });
      });
    } else {
      // Generate default CRUD endpoints
      const basePath = `/${this.toKebabCase(node.label.replace(/Service|API/gi, ''))}`;
      endpoints.push(
        { method: 'GET', path: basePath },
        { method: 'GET', path: `${basePath}/:id` },
        { method: 'POST', path: basePath },
        { method: 'PUT', path: `${basePath}/:id` },
        { method: 'DELETE', path: `${basePath}/:id` }
      );
    }

    return endpoints;
  }

  /**
   * Find database related to a service
   */
  private findRelatedDatabase(node: ArchitectureNode, architecture: ParsedArchitecture): string | null {
    const dbEdge = architecture.edges.find(e =>
      e.from === node.id &&
      architecture.nodes.find(n => n.id === e.to && n.type === 'database')
    );

    if (dbEdge) {
      const dbNode = architecture.nodes.find(n => n.id === dbEdge.to);
      return dbNode ? this.toKebabCase(dbNode.label) : null;
    }

    return null;
  }

  /**
   * Extract routes for micro-frontend
   */
  private extractRoutes(node: ArchitectureNode, architecture: ParsedArchitecture): any[] {
    const routes: any[] = [];

    if (node.attributes.routes) {
      const routeList = node.attributes.routes.split(',').map(r => r.trim());
      routeList.forEach(route => {
        routes.push({
          path: route.startsWith('/') ? route : `/${route}`,
          component: this.toPascalCase(route.replace(/\//g, '')) + 'Component'
        });
      });
    } else {
      // Generate default route
      const basePath = this.toKebabCase(node.label.replace(/Component|UI|Module/gi, ''));
      routes.push({
        path: `/${basePath}`,
        component: this.toPascalCase(basePath) + 'Component'
      });
    }

    return routes;
  }

  /**
   * Extract components for micro-frontend
   */
  private extractComponents(node: ArchitectureNode, architecture: ParsedArchitecture): any[] {
    const components: any[] = [];

    if (node.attributes.components) {
      const componentList = node.attributes.components.split(',').map(c => c.trim());
      componentList.forEach(comp => {
        components.push({
          name: this.toPascalCase(comp),
          template: this.generateComponentTemplate(comp)
        });
      });
    }

    return components;
  }

  /**
   * Find services related to a component
   */
  private findRelatedServices(node: ArchitectureNode, architecture: ParsedArchitecture): string[] {
    const services: string[] = [];

    const edges = architecture.edges.filter(e => e.from === node.id);
    edges.forEach(edge => {
      const targetNode = architecture.nodes.find(n => n.id === edge.to);
      if (targetNode && targetNode.type === 'service') {
        services.push(this.toKebabCase(targetNode.label));
      }
    });

    return services;
  }

  /**
   * Generate default fields for an entity
   */
  private generateDefaultFields(entityName: string): any[] {
    const commonFields = [
      { name: 'id', type: 'Long', annotations: ['@Id', '@GeneratedValue'] },
      { name: 'createdAt', type: 'LocalDateTime' },
      { name: 'updatedAt', type: 'LocalDateTime' }
    ];

    // Add entity-specific fields based on common banking entities
    const specificFields: Record<string, any[]> = {
      user: [
        { name: 'username', type: 'String' },
        { name: 'email', type: 'String' },
        { name: 'firstName', type: 'String' },
        { name: 'lastName', type: 'String' }
      ],
      account: [
        { name: 'accountNumber', type: 'String' },
        { name: 'balance', type: 'BigDecimal' },
        { name: 'accountType', type: 'String' },
        { name: 'status', type: 'String' }
      ],
      transaction: [
        { name: 'amount', type: 'BigDecimal' },
        { name: 'transactionType', type: 'String' },
        { name: 'description', type: 'String' },
        { name: 'transactionDate', type: 'LocalDateTime' }
      ],
      card: [
        { name: 'cardNumber', type: 'String' },
        { name: 'cardType', type: 'String' },
        { name: 'expiryDate', type: 'LocalDate' },
        { name: 'cvv', type: 'String' }
      ],
      client: [
        { name: 'clientId', type: 'String' },
        { name: 'firstName', type: 'String' },
        { name: 'lastName', type: 'String' },
        { name: 'email', type: 'String' },
        { name: 'phone', type: 'String' }
      ]
    };

    const entityKey = entityName.toLowerCase().replace(/entity$/i, '');
    const fields = specificFields[entityKey] || [
      { name: 'name', type: 'String' },
      { name: 'description', type: 'String' }
    ];

    return [...commonFields, ...fields];
  }

  /**
   * Generate component template
   */
  private generateComponentTemplate(componentName: string): string {
    return `
<div class="component-container">
  <h2>${componentName}</h2>
  <div class="content">
    <!-- ${componentName} content goes here -->
  </div>
</div>
    `.trim();
  }

  /**
   * Utility: Convert string to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Utility: Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  }
}

export default new DotArchitectureParser();
