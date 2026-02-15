# 🔍 DEBUG RESTART MIGRATION - Guide Complet

## 📋 Instructions Étape par Étape

### **Étape 1: Ouvrir les DevTools**

1. Ouvrir http://localhost:3000 dans votre navigateur
2. Appuyer sur **F12** pour ouvrir les DevTools
3. Aller dans l'onglet **Console**

### **Étape 2: Ouvrir/Créer une Migration**

- Si vous avez déjà une migration, ouvrez-la
- Sinon, créez une nouvelle migration (upload un repo)

### **Étape 3: Cliquer "Restart Migration"**

Cliquez sur le bouton orange "Restart Migration" dans la sidebar gauche

### **Étape 4: Observer la Console**

Vous devriez voir dans la console:

```javascript
🚨 handleRestartMigration CALLED!
   migrationId: "abc-123-def"
   migration status: "completed"
✅ Showing confirmation dialog...
```

**SI VOUS NE VOYEZ PAS ÇA** → Le bouton n'appelle pas la fonction!

---

## 🎯 Cas de Figure

### **Cas 1: Rien dans la console**

❌ **Problème**: Le click ne déclenche rien

**Solutions**:
1. Le bouton est disabled → Vérifier que `migration.status !== 'analyzing'`
2. Événement click non attaché → Bug dans le code

**Test**:
```javascript
// Dans la console du navigateur:
document.querySelector('button').click()
```

---

### **Cas 2: Vous voyez les logs mais pas de popup**

```javascript
🚨 handleRestartMigration CALLED!
   migrationId: "abc-123"
   migration status: "completed"
❌ No migrationId, returning
```

**Problème**: `migrationId` est undefined

**Solution**: Le composant n'a pas le migrationId dans l'URL

---

### **Cas 3: Le popup apparaît mais rien après "OK"**

```javascript
🚨 handleRestartMigration CALLED!
✅ Showing confirmation dialog...
   User confirmed: true
✅ Starting restart process...
```

**Ensuite, regardez s'il y a:**

#### ✅ **Bon cas:**
```javascript
🌐 Making fetch request to: http://localhost:4000/api/repo-migration/abc-123/restart
📥 Response received: 200 OK
📊 Result: { success: true, ... }
```

#### ❌ **Mauvais cas - Erreur réseau:**
```javascript
🌐 Making fetch request to: http://localhost:4000/api/repo-migration/abc-123/restart
❌ Failed to fetch
```
→ Backend pas accessible

#### ❌ **Mauvais cas - Erreur 404:**
```javascript
📥 Response received: 404 Not Found
📊 Result: { error: "Migration not found" }
```
→ Migration n'existe pas dans le backend

---

## 🔧 Tests à Faire

### **Test 1: Le bouton est-il cliquable?**

Dans la console du navigateur:
```javascript
// Vérifier si le bouton est disabled
const btn = document.querySelector('button[class*="orange"]');
console.log('Button disabled?', btn.disabled);
console.log('Button classes:', btn.className);
```

---

### **Test 2: Migration ID existe?**

Dans la console du navigateur:
```javascript
// Vérifier l'URL
console.log('Current URL:', window.location.href);

// Devrait afficher: http://localhost:3000/dashboard?id=abc-123
```

---

### **Test 3: Backend accessible?**

Dans un terminal:
```bash
curl http://localhost:4000/health
# Devrait retourner: {"status":"ok"}

curl -X POST http://localhost:4000/api/repo-migration/test-id/restart
# Devrait retourner: {"error":"Migration not found"} ou autre réponse
```

---

## 📊 Logs Backend Simultanés

**Terminal 1** - Surveiller les logs backend:
```bash
tail -f /tmp/backend.log
```

**Terminal 2** - Surveiller uniquement les restart:
```bash
tail -f /tmp/backend.log | grep --color=always "RESTART\|restart\|🚨"
```

---

## 🎯 Que Faire Maintenant?

### **Action 1: Ouvrir DevTools (F12)**

1. Aller sur http://localhost:3000
2. Ouvrir une migration
3. F12 → Console
4. Cliquer "Restart Migration"
5. **Copier TOUT ce qui apparaît dans la console**

### **Action 2: Vérifier l'onglet Network**

1. F12 → Network
2. Cliquer "Restart Migration"
3. Chercher une requête vers `/restart`
4. **Copier la requête et la réponse**

### **Action 3: Envoyer les Résultats**

Envoyez-moi:
1. ✅ Ce qui apparaît dans la **Console** du navigateur
2. ✅ Ce qui apparaît dans l'onglet **Network** (requête /restart)
3. ✅ Ce qui apparaît dans les **logs backend** (/tmp/backend.log)

---

## 🚀 Checklist Rapide

Avant de tester:
- [ ] Backend running: `curl http://localhost:4000/health`
- [ ] Frontend running: `curl http://localhost:3000`
- [ ] DevTools ouvert (F12)
- [ ] Console visible
- [ ] Network tab visible
- [ ] Migration ouverte dans le dashboard
- [ ] Bouton "Restart Migration" visible

Après avoir cliqué "Restart Migration":
- [ ] Quelque chose apparaît dans la Console?
- [ ] Une requête apparaît dans Network?
- [ ] Quelque chose apparaît dans les logs backend?

---

## 💡 Debug Rapide

**Copier/coller dans la console du navigateur:**

```javascript
// Vérifier le state
console.log('Migration ID:', window.location.search);
console.log('Restart button:', document.querySelector('button[class*="orange"]'));

// Tester la fonction directement
// (Remplacer ABC123 par votre migration ID)
fetch('http://localhost:4000/api/repo-migration/ABC123/restart', {
  method: 'POST'
})
.then(r => r.json())
.then(d => console.log('Direct test result:', d))
.catch(e => console.error('Direct test error:', e));
```

---

**Faites ces tests et envoyez-moi les résultats!** 🔍
