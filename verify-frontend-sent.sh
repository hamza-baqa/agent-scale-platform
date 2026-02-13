#!/bin/bash

echo "🔍 Vérification: Les fichiers frontend sont-ils VRAIMENT envoyés?"
echo "=================================================================="
echo ""

# Nettoyer les anciens messages de debug
rm -f /tmp/ark-user-message-*.txt 2>/dev/null

# Test avec le frontend de la plateforme
TEST_REPO="/home/hbaqa/Desktop/Banque app 2/banque-app-transformed/platform/frontend"

echo "📂 Repository de test: $TEST_REPO"
echo ""
echo "Vérification préliminaire des fichiers frontend dans le repo:"
echo ""
find "$TEST_REPO" -name "*.tsx" -not -path "*/node_modules/*" | head -5
echo ""

# Démarrer l'analyse
echo "📡 Démarrage de l'analyse..."
echo ""

RESPONSE=$(curl -s -X POST http://localhost:4000/api/repo-migration \
  -H "Content-Type: application/json" \
  -d "{
    \"repoUrl\": \"$TEST_REPO\",
    \"options\": {
      \"includeDocs\": true,
      \"includeTests\": false
    }
  }")

MIGRATION_ID=$(echo "$RESPONSE" | jq -r '.migrationId // .id // "ERROR"')

if [ "$MIGRATION_ID" = "ERROR" ] || [ -z "$MIGRATION_ID" ]; then
  echo "❌ Erreur lors du démarrage de la migration"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Migration démarrée: $MIGRATION_ID"
echo ""
echo "⏳ Attente de 5 secondes pour que l'analyse commence..."
sleep 5
echo ""

# Vérifier les logs backend
echo "=================================================================="
echo "📊 LOGS BACKEND - Recherche de fichiers:"
echo "=================================================================="
echo ""
tail -100 /home/hbaqa/Desktop/Banque\ app\ 2/banque-app-transformed/.run-pids/backend.log | grep -A 5 "Scanning repository"
echo ""

echo "=================================================================="
echo "📊 LOGS BACKEND - Fichiers trouvés:"
echo "=================================================================="
echo ""
tail -100 /home/hbaqa/Desktop/Banque\ app\ 2/banque-app-transformed/.run-pids/backend.log | grep -A 15 "Found.*source files"
echo ""

echo "=================================================================="
echo "📊 LOGS BACKEND - Fichiers envoyés à l'agent:"
echo "=================================================================="
echo ""
tail -100 /home/hbaqa/Desktop/Banque\ app\ 2/banque-app-transformed/.run-pids/backend.log | grep -A 10 "Files being sent"
echo ""

echo "=================================================================="
echo "📊 LOGS BACKEND - Message à l'agent:"
echo "=================================================================="
echo ""
tail -100 /home/hbaqa/Desktop/Banque\ app\ 2/banque-app-transformed/.run-pids/backend.log | grep -A 10 "Calling ARK"
echo ""

# Trouver le fichier de debug du message
DEBUG_FILE=$(ls -t /tmp/ark-user-message-*.txt 2>/dev/null | head -1)

if [ -n "$DEBUG_FILE" ]; then
  echo "=================================================================="
  echo "📄 MESSAGE COMPLET ENVOYÉ À L'AGENT (100 premières lignes):"
  echo "=================================================================="
  echo ""
  echo "Fichier: $DEBUG_FILE"
  echo ""
  head -100 "$DEBUG_FILE"
  echo ""
  echo "..."
  echo ""
  echo "Nombre total de lignes: $(wc -l < "$DEBUG_FILE")"
  echo ""

  # Chercher les marqueurs [FRONTEND]
  FRONTEND_COUNT=$(grep -c "\[FRONTEND\]" "$DEBUG_FILE")
  echo "Nombre de fichiers marqués [FRONTEND]: $FRONTEND_COUNT"
  echo ""

  if [ "$FRONTEND_COUNT" -gt 0 ]; then
    echo "✅ Des fichiers FRONTEND sont présents dans le message!"
    echo ""
    echo "Exemples de fichiers frontend dans le message:"
    grep "\[FRONTEND\]" "$DEBUG_FILE" | head -5
  else
    echo "❌ AUCUN fichier [FRONTEND] trouvé dans le message!"
  fi

  echo ""
else
  echo "❌ Fichier de debug du message non trouvé!"
fi

echo ""
echo "=================================================================="
echo "🔗 Voir le résultat complet:"
echo "   http://localhost:3000/dashboard?id=$MIGRATION_ID"
echo "=================================================================="
echo ""
