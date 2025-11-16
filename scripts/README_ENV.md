# Configuration du fichier .env pour le script de test

## 🚨 Erreur commune

Si vous recevez cette erreur :
```
FIREBASE FATAL ERROR: Can't determine Firebase Database URL
```

Cela signifie que votre fichier `.env` n'existe pas ou n'est pas correctement configuré.

## ✅ Solution

### Étape 1 : Créer le fichier .env

Créez un fichier `.env` **à la racine du projet** (même niveau que package.json) :

```bash
# Dans le dossier racine du projet
touch .env
```

### Étape 2 : Copier vos credentials Firebase

Ouvrez le fichier `.env` et ajoutez vos credentials Firebase (depuis la console Firebase) :

```env
VITE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_PROJECT_ID=votre-projet-id
VITE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_MESSAGING_SENDER_ID=123456789012
VITE_APP_ID=1:123456789012:web:abcdef0123456789abcdef
VITE_DATABASE_URL=https://votre-projet-default-rtdb.firebaseio.com
```

### Étape 3 : Où trouver ces valeurs ?

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionnez votre projet
3. Cliquez sur l'icône ⚙️ (Paramètres du projet)
4. Descendez jusqu'à "Vos applications"
5. Cliquez sur l'application Web (icône `</>`)
6. Copiez les valeurs de `firebaseConfig`

**⚠️ Important pour VITE_DATABASE_URL :**
- Allez dans "Realtime Database" dans le menu de gauche
- L'URL est visible en haut : `https://votre-projet-default-rtdb.firebaseio.com`
- Ou dans les paramètres : elle ressemble à `https://PROJET_ID.firebaseio.com`

### Étape 4 : Vérifier que le fichier existe

```bash
# Vérifier que le fichier existe
ls -la .env

# Vérifier qu'il contient les variables
cat .env | grep VITE_DATABASE_URL
```

### Étape 5 : Lancer le script

```bash
npm run test:operations
```

## 🔍 Debugging

Si le script affiche :
```
❌ Variables d'environnement manquantes:
   - VITE_DATABASE_URL
```

Vérifiez que :
1. ✅ Le fichier `.env` existe à la racine (pas dans `/scripts`)
2. ✅ Les variables commencent par `VITE_`
3. ✅ Pas d'espaces autour du `=` (ex: `VITE_API_KEY=valeur` et non `VITE_API_KEY = valeur`)
4. ✅ Pas de guillemets autour des valeurs (sauf si vraiment nécessaire)
5. ✅ L'URL de la database est complète avec `https://`

## 📝 Exemple complet

Voici un exemple réel d'un fichier `.env` (avec des valeurs factices) :

```env
VITE_API_KEY=AIzaSyB123456789abcdefghijklmnopqrstuvwx
VITE_AUTH_DOMAIN=sandwichs-du-docteur.firebaseapp.com
VITE_PROJECT_ID=sandwichs-du-docteur
VITE_STORAGE_BUCKET=sandwichs-du-docteur.appspot.com
VITE_MESSAGING_SENDER_ID=987654321098
VITE_APP_ID=1:987654321098:web:abc123def456ghi789jkl
VITE_DATABASE_URL=https://sandwichs-du-docteur-default-rtdb.firebaseio.com
```

## 🔐 Sécurité

**Important** : Le fichier `.env` contient des credentials sensibles.

- ✅ Il est déjà dans `.gitignore` (ne sera pas commité)
- ❌ Ne partagez JAMAIS ce fichier
- ❌ Ne le commitez JAMAIS sur Git
- ✅ Chaque développeur doit avoir son propre `.env`

## 🚀 Une fois configuré

Quand tout est bien configuré, vous verrez :

```
🔧 Configuration Firebase:
   - Project ID: votre-projet-id
   - Database URL: https://votre-projet-default-rtdb.firebaseio.com

🚀 Démarrage de la génération d'opérations comptables de test
📅 Période: 01/07/2025 - 07/11/2025

📥 Chargement des comptes...
```

Si vous voyez cela, c'est bon ! Le script fonctionne. ✨
