#!/bin/bash

echo "🔍 DEBUG: Quel est le problème?"
echo "=================================================================="
echo ""

# Nettoyer les anciens fichiers de debug
rm -f /tmp/ark-user-message-*.txt 2>/dev/null

# Demander le chemin du repository
echo "Entrez le chemin COMPLET de votre repository .NET:"
read REPO_PATH

if [ ! -d "$REPO_PATH" ]; then
  echo "❌ Ce chemin n'existe pas: $REPO_PATH"
  exit 1
fi

echo ""
echo "📂 Repository: $REPO_PATH"
echo ""

# Vérifier les fichiers .NET frontend
echo "🔎 Recherche de fichiers frontend .NET dans le repository..."
echo ""

RAZOR_COUNT=$(find "$REPO_PATH" -name "*.razor" -not -path "*/node_modules/*" -not -path "*/bin/*" -not -path "*/obj/*" 2>/dev/null | wc -l)
CSHTML_COUNT=$(find "$REPO_PATH" -name "*.cshtml" -not -path "*/node_modules/*" -not -path "*/bin/*" -not -path "*/obj/*" 2>/dev/null | wc -l)
ASPX_COUNT=$(find "$REPO_PATH" -name "*.aspx" -not -path "*/node_modules/*" -not -path "*/bin/*" -not -path "*/obj/*" 2>/dev/null | wc -l)

echo "Fichiers Blazor (.razor):         $RAZOR_COUNT"
echo "Fichiers ASP.NET MVC (.cshtml):   $CSHTML_COUNT"
echo "Fichiers Web Forms (.aspx):       $ASPX_COUNT"
echo ""

TOTAL_FRONTEND=$((RAZOR_COUNT + CSHTML_COUNT + ASPX_COUNT))

if [ "$TOTAL_FRONTEND" -eq 0 ]; then
  echo "❌ AUCUN fichier frontend .NET trouvé dans ce repository!"
  echo ""
  echo "Vérifications:"
  echo "1. Le chemin est-il correct?"
  echo "2. Le frontend est-il dans un repository séparé?"
  echo "3. Les fichiers sont-ils dans bin/ ou obj/ (ignorés)?"
  echo ""
  echo "Exemples de fichiers trouvés:"
  find "$REPO_PATH" -type f -name "*.cs" 2>/dev/null | head -5
  exit 1
fi

echo "✅ $TOTAL_FRONTEND fichiers frontend trouvés!"
echo ""
echo "Exemples:"
find "$REPO_PATH" -name "*.razor" -o -name "*.cshtml" -o -name "*.aspx" 2>/dev/null | head -10
echo ""

# Lancer l'analyse
echo "=================================================================="
echo "📡 Lancement de l'analyse via l'API backend..."
echo "=================================================================="
echo ""

RESPONSE=$(curl -s -X POST http://localhost:4000/api/repo-migration \
  -H "Content-Type: application/json" \
  -d "{
    \"repoUrl\": \"$REPO_PATH\",
    \"options\": {
      \"includeDocs\": true,
      \"includeTests\": false
    }
  }")

MIGRATION_ID=$(echo "$RESPONSE" | jq -r '.migrationId // .id // "ERROR"')

if [ "$MIGRATION_ID" = "ERROR" ] || [ -z "$MIGRATION_ID" ]; then
  echo "❌ Erreur lors du démarrage de la migration"
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

echo "✅ Migration démarrée: $MIGRATION_ID"
echo ""
echo "⏳ Attente de 10 secondes pour l'analyse..."
sleep 10
echo ""

# Vérifier les logs
echo "=================================================================="
echo "📊 LOGS BACKEND:"
echo "=================================================================="
echo ""

LOG_FILE="/home/hbaqa/Desktop/Banque app 2/banque-app-transformed/.run-pids/backend.log"

echo "1️⃣ Fichiers trouvés par le backend:"
tail -200 "$LOG_FILE" | grep -A 20 "Found.*source files" | tail -25
echo ""

echo "2️⃣ Fichiers envoyés à l'agent:"
tail -200 "$LOG_FILE" | grep -A 15 "Files being sent" | tail -20
echo ""

# Chercher le message de debug
DEBUG_FILE=$(ls -t /tmp/ark-user-message-*.txt 2>/dev/null | head -1)

if [ -n "$DEBUG_FILE" ]; then
  echo "3️⃣ Message envoyé à l'agent (aperçu):"
  echo "Fichier: $DEBUG_FILE"
  head -50 "$DEBUG_FILE"
  echo ""
  echo "..."
  echo ""
  
  # Compter les fichiers frontend
  RAZOR_IN_MSG=$(grep -c "\.razor \[FRONTEND\]" "$DEBUG_FILE" 2>/dev/null || echo 0)
  CSHTML_IN_MSG=$(grep -c "\.cshtml \[FRONTEND\]" "$DEBUG_FILE" 2>/dev/null || echo 0)
  ASPX_IN_MSG=$(grep -c "\.aspx \[FRONTEND\]" "$DEBUG_FILE" 2>/dev/null || echo 0)
  
  echo "Fichiers frontend dans le message:"
  echo "  .razor: $RAZOR_IN_MSG"
  echo "  .cshtml: $CSHTML_IN_MSG"
  echo "  .aspx: $ASPX_IN_MSG"
  echo ""
  
  if [ $((RAZOR_IN_MSG + CSHTML_IN_MSG + ASPX_IN_MSG)) -eq 0 ]; then
    echo "❌ PROBLÈME: Aucun fichier frontend dans le message envoyé à l'agent!"
    echo "   Les fichiers sont trouvés mais pas envoyés!"
  else
    echo "✅ Des fichiers frontend SONT dans le message!"
    echo ""
    echo "Si l'agent dit 'pas de frontend', c'est un problème avec le modèle OpenAI."
  fi
fi

echo ""
echo "=================================================================="
echo "🔗 Voir le résultat complet:"
echo "   http://localhost:3000/dashboard?id=$MIGRATION_ID"
echo "=================================================================="
