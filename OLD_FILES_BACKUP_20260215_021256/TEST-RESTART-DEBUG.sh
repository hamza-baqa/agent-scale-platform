#!/bin/bash

echo "=========================================="
echo "🔍 TEST RESTART MIGRATION - DEBUG MODE"
echo "=========================================="
echo ""
echo "Instructions:"
echo "1. Ouvrir http://localhost:3000 dans votre navigateur"
echo "2. Créer ou ouvrir une migration existante"
echo "3. Cliquer sur 'Restart Migration' dans la sidebar"
echo "4. Observer les logs ci-dessous"
echo ""
echo "=========================================="
echo "📊 LOGS BACKEND EN TEMPS RÉEL:"
echo "=========================================="
echo ""

# Follow backend logs
tail -f /tmp/backend.log | grep --line-buffered -E "Restart|processMigrationAsync|Migration|CODE ANALYZER|agent-started|workflow"
