#!/bin/bash

echo "=========================================="
echo "TEST DIRECT - Restart Endpoint"
echo "=========================================="
echo ""

# Get all migrations
echo "1. Récupération des migrations existantes..."
MIGRATIONS=$(curl -s http://localhost:4000/api/migrations 2>/dev/null || echo "{}")
echo "$MIGRATIONS" | jq '.' 2>/dev/null || echo "$MIGRATIONS"
echo ""

# Extract first migration ID
MIGRATION_ID=$(echo "$MIGRATIONS" | jq -r '.[0].id' 2>/dev/null)

if [ "$MIGRATION_ID" == "null" ] || [ -z "$MIGRATION_ID" ]; then
  echo "❌ Aucune migration trouvée!"
  echo "   Créez d'abord une migration sur http://localhost:3000"
  exit 1
fi

echo "2. Migration ID trouvé: $MIGRATION_ID"
echo ""

echo "3. Test du endpoint restart..."
echo "   URL: http://localhost:4000/api/repo-migration/$MIGRATION_ID/restart"
echo ""

RESPONSE=$(curl -s -X POST \
  "http://localhost:4000/api/repo-migration/$MIGRATION_ID/restart" \
  -H "Content-Type: application/json" \
  2>&1)

echo "4. Réponse du serveur:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "5. Vérifier les logs backend:"
echo "   tail -f /tmp/backend.log"
echo ""
echo "=========================================="
