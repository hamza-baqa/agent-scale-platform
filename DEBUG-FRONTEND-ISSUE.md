# 🔍 Debug: Pourquoi le Frontend n'est pas analysé?

## Étape 1: Vérifier que le Repository Contient des Fichiers Frontend

```bash
# Remplacez par votre chemin de repository
REPO_PATH="/path/to/your/repo"

# Chercher les fichiers frontend
echo "TypeScript files:"
find "$REPO_PATH" -name "*.ts" -not -path "*/node_modules/*" -not -name "*.spec.ts" -not -name "*.d.ts" | head -10

echo "TSX files:"
find "$REPO_PATH" -name "*.tsx" -not -path "*/node_modules/*" | head -10

echo "JavaScript files:"
find "$REPO_PATH" -name "*.js" -not -path "*/node_modules/*" -not -path "*/dist/*" | head -10
```

**Si aucun fichier n'est trouvé** → Le repository ne contient pas de frontend!

## Étape 2: Lancer une Migration et Observer les Logs

### 2a. Démarrer une Migration
1. Allez sur http://localhost:3000
2. Entrez le chemin du repository
3. Cliquez "Start Migration Now"

### 2b. Observer les Logs Backend en Temps Réel

```bash
tail -f ~/Desktop/Banque\ app\ 2/banque-app-transformed/.run-pids/backend.log
```

**Cherchez ces lignes:**

```
📁 Found X source files in repository
backend: { java: Y, csharp: Z, total: N }
frontend: { typescript: A, tsx: B, javascript: C, total: M }
```

**Questions à vérifier:**
- ✅ `frontend.total` est > 0 ?
- ✅ Vous voyez des chemins de fichiers `.ts`, `.tsx`, `.js` ?

Si `frontend.total = 0` → Les fichiers frontend ne sont **PAS trouvés** par le glob!

## Étape 3: Vérifier les Fichiers Envoyés à l'Agent

Dans les logs, cherchez:

```
📊 Files being sent to agent:
totalFiles: 50
backendFilesSent: 23
frontendFilesSent: 27
frontendFilePaths: ["app/page.tsx", "components/Header.tsx", ...]
```

**Questions:**
- ✅ `frontendFilesSent` est > 0 ?
- ✅ Vous voyez des chemins frontend dans `frontendFilePaths` ?

Si `frontendFilesSent = 0` → Les fichiers frontend ne sont **PAS envoyés** à l'agent!

## Étape 4: Vérifier le Message Utilisateur

Dans les logs, vous devriez voir:

```
Calling ARK code-analyzer agent
messageLength: 245678
sampleFrontendFiles: ["app/page.tsx", "components/Header.tsx", ...]
```

Si pas de `sampleFrontendFiles` → Problème dans la construction du message!

## Étape 5: Inspecter le Résultat de l'Agent

1. Allez sur http://localhost:3000/dashboard?id=MIGRATION_ID
2. Cliquez sur "Code Analyzer" dans le workflow
3. Regardez le panneau de droite - le rapport complet

**Cherchez ces sections:**
- ✅ "## Architecture Frontend"
- ✅ "### Framework et Stack Technologique"
- ✅ "### Structure des Composants"

**Si ces sections sont absentes ou vides** → L'agent ignore le frontend malgré les instructions!

## Test Rapide avec le Frontend de la Plateforme

```bash
cd ~/Desktop/Banque\ app\ 2/banque-app-transformed
./test-frontend-analysis.sh
```

Ce script va:
1. Analyser le frontend de la plateforme elle-même (15 fichiers .ts/.tsx)
2. Afficher les logs en temps réel
3. Vous donner le lien de migration

Vous DEVEZ voir:
```
📁 Found 15 source files in repository
frontend: { typescript: 4, tsx: 11, total: 15 }
✅ Sending 15 frontend files to agent
```

## Problèmes Courants

### Problème 1: `frontend.total = 0`

**Cause**: Les fichiers ne sont pas trouvés par glob

**Solutions**:
1. Vérifiez le chemin du repository (absolu, pas relatif)
2. Vérifiez que les fichiers ne sont pas dans `node_modules/`
3. Vérifiez les extensions: `.ts`, `.tsx`, `.js`, `.jsx`, `.vue`, `.razor`

### Problème 2: `frontendFilesSent = 0` mais `frontend.total > 0`

**Cause**: Les fichiers sont trouvés mais pas lus/envoyés

**Solutions**:
1. Vérifiez la limite de 50 fichiers (ligne 520 dans arkChatService.ts)
2. Vérifiez les permissions de lecture des fichiers
3. Regardez les erreurs dans les logs

### Problème 3: Frontend envoyé mais pas dans le rapport

**Cause**: L'agent ignore les instructions

**Solutions**:
1. Vérifiez le prompt de l'agent:
```bash
kubectl get agent code-analyzer -n default -o jsonpath='{.spec.prompt}' | grep -i "frontend"
```

Vous devez voir:
```
IMPORTANT: Vous DEVEZ analyser le BACKEND ET le FRONTEND
CRITIQUE: Cette section est OBLIGATOIRE
```

2. Si le prompt est correct, le modèle OpenAI peut avoir des limitations
3. Essayez avec un modèle plus puissant (GPT-4)

## Étape 6: Vérifier le Prompt Système de l'Agent

```bash
kubectl get agent code-analyzer -n default -o yaml | grep -A 200 "prompt:"
```

Le prompt doit contenir:
- ✅ "IMPORTANT: Vous DEVEZ analyser à la fois le BACKEND ET le FRONTEND"
- ✅ "## Architecture Frontend"
- ✅ "CRITIQUE: Cette section est OBLIGATOIRE"
- ✅ "RAPPEL IMPORTANT: Si vous recevez des fichiers TypeScript"

Si ces éléments sont absents → L'agent a l'ancien prompt!

**Solution**: Recréer l'agent
```bash
kubectl delete agent code-analyzer -n default
cd ~/Desktop/Banque\ app\ 2/banque-app-transformed
./RUN-SIMPLE.sh
```

## Étape 7: Test Manuel avec ARK CLI

```bash
# Test direct avec l'agent
ark chat agent/code-analyzer

# Puis tapez:
Analysez ce composant React:

--- FILE: Button.tsx ---
import React from 'react';
export const Button = ({ children, onClick }) => {
  return <button onClick={onClick}>{children}</button>;
};
```

L'agent doit répondre avec une analyse du composant React.

Si l'agent répond "Je ne peux pas analyser" → Problème avec le modèle ou la config!

## Checklist Complète

- [ ] Repository contient des fichiers frontend (vérification manuelle avec `find`)
- [ ] Logs montrent `frontend.total > 0`
- [ ] Logs montrent `frontendFilesSent > 0`
- [ ] Logs montrent `sampleFrontendFiles` avec des chemins
- [ ] Prompt agent contient les sections frontend obligatoires
- [ ] Rapport agent contient la section "## Architecture Frontend"
- [ ] Rapport agent liste les composants frontend trouvés

## Besoin d'Aide?

1. Partagez les logs backend (lignes avec "Found X source files" et "Files being sent")
2. Partagez le résultat de `kubectl get agent code-analyzer -n default -o yaml`
3. Partagez le rapport de l'agent (section frontend si présente)

Cela permettra de diagnostiquer précisément où le problème se situe!
