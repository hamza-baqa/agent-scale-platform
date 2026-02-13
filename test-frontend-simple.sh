#!/bin/bash

echo "🔍 Testing Frontend File Collection"
echo "===================================================================="

REPO_PATH="./platform/frontend/src"

echo ""
echo "📂 Repository: $REPO_PATH"
echo ""

# Count TypeScript files
TS_FILES=$(find "$REPO_PATH" -name "*.ts" -not -path "*/node_modules/*" -not -name "*.spec.ts" -not -name "*.d.ts" | wc -l)
TSX_FILES=$(find "$REPO_PATH" -name "*.tsx" -not -path "*/node_modules/*" | wc -l)
JS_FILES=$(find "$REPO_PATH" -name "*.js" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/build/*" | wc -l)
JSX_FILES=$(find "$REPO_PATH" -name "*.jsx" -not -path "*/node_modules/*" | wc -l)

# Count Java/C# files (should be 0)
JAVA_FILES=$(find "$REPO_PATH" -name "*.java" -not -path "*/node_modules/*" 2>/dev/null | wc -l)
CS_FILES=$(find "$REPO_PATH" -name "*.cs" -not -path "*/node_modules/*" 2>/dev/null | wc -l)

TOTAL_FRONTEND=$((TS_FILES + TSX_FILES + JS_FILES + JSX_FILES))
TOTAL_BACKEND=$((JAVA_FILES + CS_FILES))
TOTAL=$((TOTAL_FRONTEND + TOTAL_BACKEND))

echo "📊 File Counts:"
echo "--------------------------------------------------------------------"
echo "Backend Files:"
echo "  Java (.java):      $JAVA_FILES"
echo "  C# (.cs):          $CS_FILES"
echo "  Backend Subtotal:  $TOTAL_BACKEND"
echo ""
echo "Frontend Files:"
echo "  TypeScript (.ts):  $TS_FILES"
echo "  TSX (.tsx):        $TSX_FILES"
echo "  JavaScript (.js):  $JS_FILES"
echo "  JSX (.jsx):        $JSX_FILES"
echo "  Frontend Subtotal: $TOTAL_FRONTEND"
echo ""
echo "📦 Total Files:      $TOTAL"
echo "===================================================================="

# Show sample files
echo ""
echo "📝 Sample Frontend TypeScript Files (first 10):"
echo "--------------------------------------------------------------------"
find "$REPO_PATH" -name "*.ts" -not -path "*/node_modules/*" -not -name "*.spec.ts" -not -name "*.d.ts" | head -10 | nl

# Check for specific patterns
echo ""
echo "🎯 Component/Page Analysis:"
echo "--------------------------------------------------------------------"
COMPONENTS=$(find "$REPO_PATH" -name "*.tsx" -o -name "*Component.tsx" -o -name "*component.ts" | wc -l)
PAGES=$(find "$REPO_PATH" -name "page.tsx" -o -name "page.ts" 2>/dev/null | wc -l)
SERVICES=$(find "$REPO_PATH" -name "*Service.ts" -o -name "*service.ts" 2>/dev/null | wc -l)

echo "  React/Next Components: $COMPONENTS"
echo "  Page Files:            $PAGES"
echo "  Service Files:         $SERVICES"

echo ""
if [ "$TOTAL_FRONTEND" -gt 0 ]; then
  echo "✅ SUCCESS: Frontend files ARE being collected!"
  echo "   The agent will receive $TOTAL_FRONTEND frontend files for analysis."
else
  echo "❌ ERROR: No frontend files found!"
  exit 1
fi

