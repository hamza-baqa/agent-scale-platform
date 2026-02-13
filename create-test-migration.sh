#!/bin/bash
# Créer une migration de test qui fonctionne

echo "🚀 Creating working test migration..."
echo ""

# Créer une migration via repo-migrations (le bon endpoint!)
RESPONSE=$(curl -s -X POST http://localhost:4000/api/repo-migration \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/hamza-baqa/banque-app",
    "branch": "main",
    "sourceStack": {
      "language": "java",
      "framework": "spring-boot",
      "version": "3.0",
      "database": "oracle"
    },
    "targetStack": {
      "backendFramework": "spring-boot-microservices",
      "frontendFramework": "angular-mfe",
      "database": "postgresql",
      "containerPlatform": "docker",
      "apiGateway": "spring-cloud-gateway"
    }
  }')

echo "📝 Response:"
echo "$RESPONSE" | jq .

MIGRATION_ID=$(echo "$RESPONSE" | jq -r '.migrationId')

if [ "$MIGRATION_ID" = "null" ] || [ -z "$MIGRATION_ID" ]; then
  echo ""
  echo "❌ Failed to create migration"
  exit 1
fi

echo ""
echo "✅ Migration created successfully!"
echo "📋 Migration ID: $MIGRATION_ID"
echo ""
echo "⏳ The migration will now process..."
echo "   - Code Analyzer"
echo "   - Migration Planner"
echo "   - Service Generator"
echo "   - Frontend Migrator"
echo "   - Test Validators"
echo ""
echo "🌐 Open dashboard: http://localhost:3000"
echo "👁️  Watch progress in real-time!"
echo ""
echo "⏱️  Estimated time: 3-5 minutes"
echo ""
echo "💡 To check status:"
echo "   curl -s http://localhost:4000/api/repo-migrations/$MIGRATION_ID | jq -r '.progress[] | \"\\(.agent): \\(.status)\"'"
