# 🧪 Test du Bouton de Téléchargement - Guide Complet

## ✅ Statut Actuel
- ✅ Frontend: Running (http://localhost:3000)
- ✅ Backend: Running (http://localhost:4000)
- ✅ Download Button: Implemented and working
- ⚠️ **Migrations existantes: 0** ← C'EST LE PROBLÈME!

## 🎯 Test en 3 Étapes

### Étape 1: Créer une Migration
```bash
cd ~/Desktop/Banque\ app\ 2/banque-app-transformed
curl -X POST http://localhost:4000/api/repo-migrations \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/example/banking-app",
    "sourceStack": {
      "language": "java",
      "framework": "spring-boot",
      "database": "postgresql"
    },
    "targetStack": {
      "backendFramework": "spring-boot-microservices",
      "frontendFramework": "angular-mfe",
      "database": "postgresql",
      "apiGateway": "spring-cloud-gateway"
    }
  }'
```

**Résultat attendu:**
```json
{
  "migrationId": "abc123def456",
  "status": "pending",
  "message": "Migration started"
}
```

**💾 Sauvegarder le Migration ID!**

---

### Étape 2: Attendre que Frontend Migrator termine

#### Option A: Dashboard Visual (Recommandé)
1. Ouvrir: http://localhost:3000
2. Voir le workflow d'agents
3. Attendre que **Frontend Migrator** ait une ✅

#### Option B: API
```bash
# Remplacer {MIGRATION_ID} par votre ID
curl -s http://localhost:4000/api/repo-migrations/{MIGRATION_ID} | jq -r '.progress[] | select(.agent=="frontend-migrator") | .status'
```

**Attendu: "completed"**

---

### Étape 3: Télécharger le Code

#### Sur le Dashboard:
1. Cliquer sur la carte **ROSE** "Frontend Migrator"
2. Voir le **GROS BOUTON VERT** en haut
3. Cliquer sur "CLIQUEZ ICI POUR TÉLÉCHARGER"
4. Vérifier vos téléchargements → `migration-{id}.zip`

#### Via Commande (Test Direct):
```bash
# Remplacer {MIGRATION_ID} par votre ID
curl -O http://localhost:4000/api/migrations/{MIGRATION_ID}/download

# Vérifier le fichier téléchargé
ls -lh migration-*.zip
unzip -l migration-*.zip | head -20
```

---

## 🔍 Debug: Vérifier Chaque Étape

### 1. Vérifier Services
```bash
# Frontend
curl -s http://localhost:3000 >/dev/null && echo "✅ Frontend OK" || echo "❌ Frontend DOWN"

# Backend
curl -s http://localhost:4000/health && echo ""

# ARK API
kubectl get pods -n default | grep ark
```

### 2. Vérifier Migrations
```bash
# Lister toutes les migrations
curl -s http://localhost:4000/api/repo-migrations | jq -r '.migrations[] | "\(.id) - \(.status)"'

# Détails d'une migration
curl -s http://localhost:4000/api/repo-migrations/{MIGRATION_ID} | jq .
```

### 3. Vérifier ZIP Créé
```bash
# Voir les fichiers dans outputs/
ls -lh ~/Desktop/Banque\ app\ 2/banque-app-transformed/outputs/

# Si vide → Le frontend-migrator n'a pas terminé ou a échoué
```

### 4. Vérifier Logs Backend
```bash
tail -f /tmp/backend.log | grep -E "FRONTEND MIGRATOR|ZIP|download"
```

---

## ⚡ Script de Test Automatique

```bash
#!/bin/bash
# Test complet du bouton de téléchargement

echo "🧪 Testing Download Button..."

# 1. Créer migration
echo "📝 Creating migration..."
RESPONSE=$(curl -s -X POST http://localhost:4000/api/repo-migrations \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/example/test-bank",
    "sourceStack": {"language": "java", "framework": "spring-boot"},
    "targetStack": {"backendFramework": "spring-boot-microservices", "frontendFramework": "angular-mfe"}
  }')

MIGRATION_ID=$(echo "$RESPONSE" | jq -r '.migrationId')
echo "✅ Migration created: $MIGRATION_ID"

# 2. Attendre frontend-migrator
echo "⏳ Waiting for frontend-migrator to complete..."
while true; do
  STATUS=$(curl -s http://localhost:4000/api/repo-migrations/$MIGRATION_ID | jq -r '.progress[] | select(.agent=="frontend-migrator") | .status')
  echo "   Status: $STATUS"

  if [ "$STATUS" = "completed" ]; then
    echo "✅ Frontend Migrator completed!"
    break
  fi

  sleep 10
done

# 3. Vérifier ZIP créé
echo "🔍 Checking if ZIP was created..."
if [ -f "outputs/${MIGRATION_ID}.zip" ]; then
  echo "✅ ZIP file created: outputs/${MIGRATION_ID}.zip"
  ls -lh "outputs/${MIGRATION_ID}.zip"
else
  echo "❌ ZIP file NOT found!"
  exit 1
fi

# 4. Tester download endpoint
echo "📥 Testing download endpoint..."
curl -s -I "http://localhost:4000/api/migrations/$MIGRATION_ID/download" | grep -i "content-type"

echo ""
echo "🎉 TEST COMPLET!"
echo "👉 Maintenant, ouvrez http://localhost:3000"
echo "👉 Cliquez sur Frontend Migrator (carte ROSE)"
echo "👉 Cliquez sur le GROS BOUTON VERT en haut"
echo "👉 Le fichier migration-${MIGRATION_ID}.zip va se télécharger!"
```

**Sauvegarder ce script:**
```bash
cat > test-download-button.sh << 'EOF'
# [coller le script ci-dessus]
EOF
chmod +x test-download-button.sh
./test-download-button.sh
```

---

## 🐛 Problèmes Courants

### "Migration ID manquant"
- ✅ Vérifier que vous avez créé une migration
- ✅ Vérifier que le migration ID est correct
- ✅ Ouvrir la console navigateur (F12) pour voir les erreurs

### "Popup bloqué"
- ✅ Autoriser les popups pour localhost:3000
- ✅ Ou utiliser le test direct avec curl

### "Migration output not found"
- ⏳ Frontend Migrator n'a pas terminé
- ⏳ Attendre que la carte ait ✅
- 🔍 Vérifier les logs backend pour erreurs

### "ZIP file not created"
- 🔍 Vérifier logs: `tail -f /tmp/backend.log`
- 🔍 Chercher: "Creating downloadable ZIP archive"
- 🔍 Vérifier que le dossier outputs/ existe

---

## 📦 Contenu du ZIP Téléchargé

Après téléchargement, décompresser:
```bash
unzip migration-{id}.zip -d extracted/
tree extracted/ -L 2
```

**Structure attendue:**
```
migration-{id}/
├── backend/
│   ├── auth-service/
│   ├── client-service/
│   ├── account-service/
│   ├── transaction-service/
│   └── card-service/
├── frontend/
│   ├── shell/
│   ├── auth-mfe/
│   ├── dashboard-mfe/
│   ├── transfers-mfe/
│   └── cards-mfe/
├── docker-compose.yml
└── README.md
```

---

## ✅ Checklist Complète

- [ ] Services running (frontend, backend, ARK)
- [ ] Migration créée (via API ou dashboard)
- [ ] Frontend Migrator terminé (carte avec ✅)
- [ ] ZIP créé dans outputs/
- [ ] Dashboard ouvert (http://localhost:3000)
- [ ] Carte Frontend Migrator cliquée
- [ ] Bouton vert visible en haut
- [ ] Bouton cliqué → Téléchargement démarre
- [ ] Fichier `migration-{id}.zip` reçu
- [ ] Fichier décompresse correctement

---

## 🎯 Résumé Ultra-Rapide

**Pourquoi "nothing happened"?**
→ Aucune migration n'existe encore!

**Solution:**
1. Créer une migration (API ou dashboard)
2. Attendre frontend-migrator (✅)
3. Ouvrir dashboard → Cliquer Frontend Migrator
4. Cliquer GROS BOUTON VERT
5. Téléchargement démarre!

**Test rapide:**
```bash
# 1. Créer migration
curl -X POST http://localhost:4000/api/repo-migrations -H "Content-Type: application/json" -d '{"repoUrl":"https://github.com/test/bank","sourceStack":{"language":"java"},"targetStack":{"backendFramework":"spring-boot-microservices","frontendFramework":"angular-mfe"}}'

# 2. Attendre 2-3 minutes (pour que tous les agents terminent)

# 3. Ouvrir http://localhost:3000 et cliquer!
```

🚀 **ESSAYEZ MAINTENANT!**
