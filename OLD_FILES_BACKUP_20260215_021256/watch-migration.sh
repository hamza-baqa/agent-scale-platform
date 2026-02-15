#!/bin/bash

echo "=========================================="
echo "🔍 MIGRATION LOGS MONITOR"
echo "=========================================="
echo ""
echo "Surveillance des logs backend..."
echo "Appuyez sur Ctrl+C pour arrêter"
echo ""
echo "=========================================="
echo ""

# Monitor backend logs with color highlighting
tail -f /tmp/backend.log | grep --line-buffered --color=always -E "CODE ANALYZER|code-analyzer|ARK|PROMPT|CUSTOM|⚡|🎯|agent-started|agent-completed|🔍|✅|❌"
