# 🧪 Test du Migration Planner - Guide Rapide

## ✅ Ce Qui Fonctionne Maintenant

Le **Migration Planner** reçoit maintenant:
- ✅ Code source backend complet
- ✅ Code source frontend complet
- ✅ Analyse du code
- ✅ Crée une stratégie de migration complète et documentée

---

## 🚀 Test en 3 Étapes

### Étape 1: Créer une Migration

```bash
curl -X POST http://localhost:4000/api/repo-migration/analyze-and-generate \
  -H "Content-Type: application/json" \
  -d '{
    "repoPath": "/home/hbaqa/Desktop/Banque app 2/banque-app-transformed"
  }' | jq .
```

**Résultat attendu**:
```json
{
  "migrationId": "xxx-xxx-xxx",
  "status": "pending",
  "message": "Migration started"
}
```

**💾 Sauvegardez le migrationId!**

---

### Étape 2: Surveiller le Progrès

#### Option A: Via Dashboard (Visual) ✨
1. Ouvrir: **http://localhost:3000**
2. Voir les agents s'exécuter en temps réel
3. Attendre que **Migration Planner** termine (✅)

#### Option B: Via API
```bash
# Remplacez {MIGRATION_ID} par votre ID
curl -s http://localhost:4000/api/migrations/{MIGRATION_ID} | jq '.progress'
```

**Attendez de voir**:
```json
[
  {"agent": "code-analyzer", "status": "completed"},
  {"agent": "migration-planner", "status": "completed"}, // ← CECI!
  ...
]
```

---

### Étape 3: Voir la Stratégie de Migration

#### Sur le Dashboard:
1. Cliquer sur la carte **BLEUE** "Migration Planner"
2. Voir la stratégie complète et documentée
3. Sections visibles:
   - Executive Summary
   - Microservices détaillés
   - Micro-frontends
   - Migration Sequence
   - Testing Strategy
   - etc.

#### Via API:
```bash
curl -s http://localhost:4000/api/migrations/{MIGRATION_ID} | jq '.progress[] | select(.agent=="migration-planner") | .output' | jq -r . | jq .
```

---

## 🔍 Vérifier que Migration Planner Reçoit le Code Source

### Logs Backend
```bash
tail -f /tmp/backend-final.log | grep -E "PLANNER|Complete Backend Source Code|Complete Frontend Source Code"
```

**Vous devriez voir**:
```
📐 [MIGRATION PLANNER] Analyzing source code for migration strategy
🔍 Complete Backend Source Code: X files
🔍 Complete Frontend Source Code: Y files
🤖 Calling ARK migration-planner agent
✅ [MIGRATION PLANNER] Complete
```

---

## 📊 Structure de l'Output

Le Migration Planner retourne maintenant un JSON avec:

```json
{
  "executiveSummary": {
    "currentApp": "Description de l'app actuelle",
    "migrationObjectives": ["Objectif 1", "Objectif 2"],
    "timeline": "7 semaines",
    "benefits": ["Bénéfice 1", "Bénéfice 2"]
  },
  "microservices": [
    {
      "name": "auth-service",
      "port": 8081,
      "responsibility": "Authentication et autorisation",
      "entities": ["User", "Role", "Permission"],
      "database": "auth_db",
      "endpoints": [
        {
          "method": "POST",
          "path": "/api/auth/login",
          "description": "Authentifier et retourner JWT"
        }
      ],
      "dependencies": ["client-service"],
      "techStack": ["Spring Boot 3.2", "PostgreSQL", "Redis"]
    },
    {
      "name": "client-service",
      "port": 8082,
      ...
    }
  ],
  "microFrontends": [
    {
      "name": "shell",
      "port": 4200,
      "type": "host",
      "routes": ["/"],
      "components": ["AppComponent", "HeaderComponent"],
      "apiIntegrations": [],
      "moduleFederation": {...}
    }
  ],
  "decompositionStrategy": {
    "domainBoundaries": "Explication DDD",
    "entityMapping": {
      "auth-service": ["User", "Role"],
      "client-service": ["Client", "Address"]
    }
  },
  "migrationSequence": {
    "phase1": {
      "name": "Infrastructure Setup",
      "duration": "1 semaine",
      "tasks": ["Setup API Gateway", ...]
    },
    "phase2": {...},
    ...
  },
  "testingStrategy": {
    "unit": "JUnit 5 + Mockito",
    "integration": "Spring Boot Test",
    "e2e": "Cypress"
  },
  "risks": [
    {
      "risk": "Data consistency",
      "mitigation": "Implement Saga pattern"
    }
  ],
  "arkRawOutput": "..." // Output complet de l'agent ARK
}
```

---

## 🎨 Affichage sur le Dashboard

Quand vous cliquez sur **Migration Planner**:

### Avant (Ancien):
- Simple liste de services
- Ports basiques
- Pas de détails

### Maintenant (Nouveau):
- ✅ **Executive Summary** avec timeline
- ✅ **Services détaillés** avec:
  - Responsabilité claire
  - Entités mappées
  - Base de données dédiée
  - API endpoints complets
  - Dépendances inter-services
- ✅ **Micro-frontends** avec:
  - Routes mappées
  - Composants listés
  - Intégrations API
  - Config Module Federation
- ✅ **Migration Sequence** étape par étape
- ✅ **Testing Strategy** complète
- ✅ **Risks & Mitigation**

---

## 🐛 Troubleshooting

### "Not working"

**Vérifiez**:
1. Backend actif: `curl http://localhost:4000/health`
2. Frontend actif: `curl http://localhost:3000`
3. ARK agent déployé: `kubectl get agent migration-planner`

**Redémarrez si nécessaire**:
```bash
# Backend
cd platform/backend && pkill -f ts-node-dev && npm run dev > /tmp/backend.log 2>&1 &

# Frontend
cd platform/frontend && pkill -f "next dev" && npm run dev > /tmp/frontend.log 2>&1 &
```

### Migration reste en "analyzing"

**C'est normal!** Le code analyzer peut prendre 1-3 minutes car il:
- Lit tous les fichiers backend
- Lit tous les fichiers frontend
- Appelle l'agent ARK pour analyse complète

**Attendez** ou vérifiez les logs:
```bash
tail -f /tmp/backend.log | grep -E "CODE ANALYZER|PLANNER"
```

### "Repository path is required"

Utilisez `repoPath` (pas `repoUrl`):
```json
{
  "repoPath": "/home/hbaqa/Desktop/Banque app 2/banque-app-transformed"
}
```

---

## ✅ Checklist de Test

- [ ] Backend running (port 4000)
- [ ] Frontend running (port 3000)
- [ ] ARK agent déployé (`kubectl get agent migration-planner`)
- [ ] Migration créée (`POST /api/repo-migration/analyze-and-generate`)
- [ ] Code Analyzer terminé (✅)
- [ ] Migration Planner terminé (✅)
- [ ] Dashboard ouvert (http://localhost:3000)
- [ ] Carte Migration Planner cliquée
- [ ] Stratégie complète visible avec tous les détails
- [ ] Entités mappées aux services
- [ ] API endpoints documentés
- [ ] Migration sequence visible

---

## 🎯 Test Rapide Maintenant

```bash
# 1. Créer migration
MIGRATION_ID=$(curl -s -X POST http://localhost:4000/api/repo-migration/analyze-and-generate \
  -H "Content-Type: application/json" \
  -d '{"repoPath": "/home/hbaqa/Desktop/Banque app 2/banque-app-transformed"}' \
  | jq -r '.migrationId')

echo "Migration ID: $MIGRATION_ID"

# 2. Attendre 2-3 minutes...
sleep 120

# 3. Vérifier status
curl -s http://localhost:4000/api/migrations/$MIGRATION_ID | jq -r '.progress[] | "\(.agent): \(.status)"'

# 4. Voir la stratégie
curl -s http://localhost:4000/api/migrations/$MIGRATION_ID | jq '.progress[] | select(.agent=="migration-planner") | .output' | jq -r . | jq . | head -100

# 5. Ouvrir dashboard
echo "Ouvrez: http://localhost:3000"
echo "Cliquez sur Migration Planner (carte bleue)"
```

---

## 📋 Résumé

**Le Migration Planner maintenant**:
1. ✅ Reçoit le code source COMPLET (frontend + backend)
2. ✅ Analyse les vraies entités, endpoints, services
3. ✅ Crée une stratégie de migration COMPLÈTE
4. ✅ Documente en 12 sections professionnelles
5. ✅ Fournit des timelines réalistes
6. ✅ Mappe les entités aux services
7. ✅ Documente tous les API endpoints
8. ✅ Inclut testing strategy
9. ✅ Évalue les risques
10. ✅ Prêt pour présentation stakeholders

**Endpoint**: `POST /api/repo-migration/analyze-and-generate`
**Payload**: `{"repoPath": "/path/to/repo"}`
**Output**: Stratégie complète en JSON avec arkRawOutput

🎉 **C'EST PRÊT!**
