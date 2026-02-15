# Restart Migration Feature

## ✅ Fonctionnalité Ajoutée

Un bouton **"Restart Migration"** a été ajouté dans le dashboard à http://localhost:3000

## 📍 Localisation

Le bouton se trouve dans la **barre latérale gauche** du dashboard:
- Sous le bouton "Activity Feed"
- Sous le bouton "Download Code"
- Juste avant les informations de migration (ID, timestamp)

## 🎯 Fonctionnement

### 1. **Backend Route**
- **Endpoint**: `POST /api/repo-migration/:id/restart`
- **Fichier**: `platform/backend/src/routes/repoMigrationRoutes.ts`

**Ce qui se passe:**
1. Reset le statut de la migration à `'analyzing'`
2. Vide tous les progrès (`progress = []`)
3. Supprime le rapport de validation
4. Supprime les résultats de déploiement
5. Relance le workflow complet depuis le début
6. Émet un événement WebSocket `migration-restarted`

### 2. **Frontend Button**
- **Fichier**: `platform/frontend/src/app/dashboard/page.tsx`
- **Handler**: `handleRestartMigration()`

**Comportement:**
- Affiche une confirmation avant de redémarrer
- Désactivé pendant le processus de redémarrage
- Désactivé si la migration est déjà en cours (`status === 'analyzing'`)
- Montre un spinner pendant le redémarrage

## 🎨 Design

Le bouton utilise le style shadcn/ui professionnel:

```tsx
- Couleur: Gradient orange-rouge (from-orange-600 to-red-600)
- Icône: Flèches circulaires (symbole de restart)
- États:
  - Normal: Gradient orange avec shadow
  - Hover: Scale 1.05 avec shadow plus prononcée
  - Disabled: Gris avec cursor-not-allowed
  - Loading: Spinner blanc avec texte "Restarting..."
```

## 🚀 Utilisation

### Quand Utiliser?

**Scénarios d'utilisation:**

1. **Validation échouée plusieurs fois**
   - Les erreurs persistent après plusieurs tentatives de "Retry Validation"
   - Vous voulez recommencer avec un code source modifié

2. **Erreur dans une étape intermédiaire**
   - Code analyzer a mal analysé le code
   - Migration planner a créé un plan incorrect
   - Service generator a généré du code avec des erreurs

3. **Test d'une nouvelle configuration**
   - Vous avez modifié les prompts des agents ARK
   - Vous voulez voir l'impact sur toute la migration

4. **Corruption de données**
   - Les données de migration sont corrompues
   - Le workflow est bloqué

### Étapes d'Utilisation:

1. **Accéder au dashboard**
   ```
   http://localhost:3000/dashboard?id=YOUR_MIGRATION_ID
   ```

2. **Cliquer sur "Restart Migration"**
   - Le bouton est dans la barre latérale gauche
   - Couleur orange/rouge

3. **Confirmer le redémarrage**
   ```
   ⚠️  Are you sure you want to restart this migration?
       This will reset all progress and start from the beginning.
   ```

4. **Attendre le redémarrage**
   - Le bouton affiche "Restarting..."
   - Les agents se relancent automatiquement
   - Le workflow reprend depuis Step 1: Code Analyzer

## 📊 Workflow Complet

```
┌──────────────────────────────────────────────────────┐
│  User clicks "Restart Migration"                     │
└────────────────────┬─────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────┐
│  Confirmation Dialog                                 │
│  "Are you sure you want to restart?"                 │
└────────────────────┬─────────────────────────────────┘
                     │ [User confirms]
                     ↓
┌──────────────────────────────────────────────────────┐
│  Frontend: handleRestartMigration()                  │
│  - POST /api/repo-migration/:id/restart              │
└────────────────────┬─────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────┐
│  Backend: /restart endpoint                          │
│  1. Reset migration status to 'analyzing'            │
│  2. Clear progress array                             │
│  3. Remove validation report                         │
│  4. Remove deployment result                         │
│  5. Emit WebSocket event 'migration-restarted'       │
└────────────────────┬─────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────┐
│  runMigrationWorkflow(migration, io)                 │
│                                                      │
│  Step 1: code-analyzer (ARK agent)                   │
│         ↓                                            │
│  Step 2: migration-planner (ARK agent)               │
│         ↓                                            │
│  Step 3: service-generator (ARK agent)               │
│         ↓                                            │
│  Step 3: frontend-migrator (ARK agent)               │
│         ↓                                            │
│  Step 4: quality-validator (ARK agent)               │
│         ↓                                            │
│  Step 5: container-deployer (ARK agent)              │
└──────────────────────────────────────────────────────┘
```

## 🔧 Code Technique

### Backend (repoMigrationRoutes.ts)

```typescript
router.post('/:id/restart', async (req, res) => {
  const { id } = req.params;
  const migration = activeMigrations.find(m => m.id === id);

  // Reset migration state
  migration.status = 'analyzing';
  migration.progress = [];
  migration.validationReport = undefined;
  migration.deploymentResult = undefined;

  // Emit WebSocket event
  io.emit('migration-restarted', {
    migrationId: id,
    status: 'analyzing',
    timestamp: new Date()
  });

  // Restart workflow
  await runMigrationWorkflow(migration, io);

  res.json({ success: true });
});
```

### Frontend (dashboard/page.tsx)

```typescript
const handleRestartMigration = async () => {
  const confirmed = window.confirm(
    'Are you sure you want to restart this migration?'
  );

  if (!confirmed) return;

  const response = await fetch(
    `http://localhost:4000/api/repo-migration/${migrationId}/restart`,
    { method: 'POST' }
  );

  const result = await response.json();

  if (result.success) {
    setMigration(prev => ({
      ...prev,
      status: 'analyzing',
      progress: [],
    }));
    setActivityFeed([]);
  }
};
```

## ⚠️ Différences avec "Retry Validation"

| Feature | Restart Migration | Retry Validation |
|---------|------------------|------------------|
| **Quand utiliser** | À tout moment | Seulement quand status='paused' |
| **Scope** | Reset TOUTE la migration | Retry seulement l'étape de validation |
| **Progrès** | Tout est supprimé | Progrès précédents conservés |
| **Point de départ** | Step 1: Code Analyzer | Step 5: Quality Validator |
| **Confirmation** | Demande confirmation | Pas de confirmation |
| **Couleur** | Orange/Rouge | Bleu/Violet |

## 🎯 Cas d'Usage Concrets

### Cas 1: Validation échoue avec "Entities match: 45%"

```
Problème: Le code généré ne correspond pas assez au code source
Solution:
1. Modifier le prompt de "service-generator" dans ARK Dashboard
2. Cliquer "Restart Migration"
3. La migration utilise le nouveau prompt dès le début
```

### Cas 2: Code Analyzer a raté des entités

```
Problème: L'analyse a manqué 3 entités JPA importantes
Solution:
1. Vérifier le prompt dans ARK Dashboard
2. Améliorer les instructions d'extraction
3. "Restart Migration" pour réanalyser avec le nouveau prompt
```

### Cas 3: Test d'amélioration itérative

```
Workflow:
1. Migration complète → Note les problèmes
2. Améliore les prompts des agents
3. "Restart Migration" pour tester
4. Compare les résultats
5. Répète jusqu'à satisfaction
```

## 📈 Métriques et Logs

### Logs Backend

```
2026-02-10 16:00:00 [info]: Restarting migration abc123
2026-02-10 16:00:00 [info]: Starting workflow for restarted migration abc123
2026-02-10 16:00:05 [info]: Step 1: Starting code-analyzer agent
...
```

### Events WebSocket

```javascript
// Émis lors du restart
{
  event: 'migration-restarted',
  data: {
    migrationId: 'abc123',
    status: 'analyzing',
    timestamp: '2026-02-10T16:00:00.000Z'
  }
}
```

### Activity Feed

```
🔄 Migration restarted! Starting from the beginning...
▶️  Step 1: Code Analyzer started
...
```

## 🧪 Testing

Pour tester la fonctionnalité:

```bash
# 1. Démarrer une migration
curl -X POST http://localhost:4000/api/repo-migration/analyze-and-generate \
  -H "Content-Type: application/json" \
  -d '{"repoUrl":"path/to/repo"}'

# 2. Attendre quelques étapes (ou pas)

# 3. Redémarrer la migration
curl -X POST http://localhost:4000/api/repo-migration/MIGRATION_ID/restart

# 4. Vérifier le statut
curl http://localhost:4000/api/repo-migration/MIGRATION_ID
```

Ou via l'interface:
1. Aller sur http://localhost:3000
2. Upload un repo
3. Aller sur le dashboard
4. Cliquer "Restart Migration" dans la sidebar

## ✅ Checklist de Vérification

Après le redémarrage, vérifier:
- [ ] Status = 'analyzing'
- [ ] Progress array vide
- [ ] Activity feed reset (ou nouveau message de restart)
- [ ] Workflow nodes tous en état 'pending' sauf le premier
- [ ] Code Analyzer démarre automatiquement
- [ ] WebSocket émet les événements de progression
- [ ] Validation report supprimé
- [ ] Deployment result supprimé

## 🎉 Résultat Final

Vous avez maintenant:
- ✅ Bouton "Restart Migration" dans le dashboard
- ✅ Route backend `/api/repo-migration/:id/restart`
- ✅ Confirmation avant redémarrage
- ✅ Reset complet de la migration
- ✅ Relance automatique du workflow
- ✅ Événements WebSocket pour le tracking
- ✅ Design professionnel shadcn/ui

Le bouton est **opérationnel** et prêt à l'emploi! 🚀
