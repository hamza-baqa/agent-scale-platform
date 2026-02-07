'use client';

import CodeDocumentationWithChat from '@/components/CodeDocumentationWithChat';

// Test data
const testData = {
  type: 'documentation',
  title: 'Test Banking Application',
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  overview: {
    description: 'A comprehensive banking application for testing the chat feature.'
  },
  summary: {
    entities: 5,
    controllers: 8,
    pages: 12,
    framework: 'Spring Boot + React'
  },
  architecture: {
    description: 'Layered architecture with clear separation of concerns',
    diagram: `graph TB
    Frontend[Frontend Layer] --> Backend[Backend Layer]
    Backend --> Database[Database Layer]`
  },
  entities: {
    diagram: `erDiagram
    USER {
        Long id
        String username
        String email
    }
    CLIENT {
        Long id
        String firstName
        String lastName
    }`,
    list: [
      { name: 'User', fields: 5, relationships: 2, description: 'System user entity' },
      { name: 'Client', fields: 8, relationships: 3, description: 'Bank client entity' }
    ]
  },
  apiEndpoints: {
    diagram: `graph LR
    Auth[Authentication API]
    Users[Users API]
    Accounts[Accounts API]`,
    summary: {
      total: 25,
      controllers: 8
    }
  },
  features: {
    authentication: {
      title: '🔐 Authentication',
      items: ['JWT tokens', 'Role-based access']
    },
    accounts: {
      title: '💰 Account Management',
      items: ['Create accounts', 'View balances']
    }
  },
  techStack: {
    backend: {
      framework: 'Spring Boot',
      language: 'Java 11'
    }
  }
};

export default function TestChatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 mb-6">
          <h1 className="text-2xl font-bold text-yellow-900 mb-2">
            🧪 Chat Feature Test Page
          </h1>
          <p className="text-yellow-800">
            This page tests the chat feature independently. Look for the <strong>purple chat button with a pulsing green dot</strong> in the bottom-right corner.
          </p>
        </div>

        <CodeDocumentationWithChat
          data={testData}
          migrationId="test-123"
        />
      </div>
    </div>
  );
}
