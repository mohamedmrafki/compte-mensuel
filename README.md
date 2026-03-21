# Mes Comptes Chauffeur

Application web PWA de gestion de courses privées et comptabilité pour chauffeur.

## Stack

- React + Vite
- Supabase (base de données)
- Vercel (hébergement)
- PWA (installable iPhone / Android)

---

## Installation et déploiement

### 1. Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com) et créer un compte
2. Cliquer **New project**
3. Choisir un nom et un mot de passe pour la base de données
4. Attendre la création du projet (~1 minute)

### 2. Créer les tables

1. Dans le dashboard Supabase, aller dans **SQL Editor**
2. Cliquer **New query**
3. Copier-coller tout le contenu du fichier `supabase/schema.sql`
4. Cliquer **Run**

### 3. Récupérer les clés API

1. Dans le dashboard Supabase, aller dans **Settings > API**
2. Copier **Project URL** et **anon public key**

### 4. Configuration locale

```bash
# Copier le fichier d'exemple
cp .env.example .env.local

# Éditer .env.local avec vos vraies clés
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

### 5. Lancer en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## Déploiement sur Vercel

### 1. Pousser le code sur GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/votre-compte/votre-repo.git
git push -u origin main
```

### 2. Connecter à Vercel

1. Aller sur [vercel.com](https://vercel.com) et se connecter avec GitHub
2. Cliquer **Add New Project**
3. Importer le dépôt GitHub
4. Framework preset : **Vite** (détecté automatiquement)

### 3. Ajouter les variables d'environnement sur Vercel

Dans **Settings > Environment Variables**, ajouter :

| Nom | Valeur |
|-----|--------|
| `VITE_SUPABASE_URL` | `https://votre-projet.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `votre_cle_anon` |

4. Cliquer **Deploy**

---

## Installer l'app sur mobile (PWA)

### iPhone (Safari)

1. Ouvrir l'URL de l'application dans **Safari**
2. Appuyer sur l'icône **Partager** (carré avec flèche vers le haut)
3. Faire défiler et appuyer sur **"Sur l'écran d'accueil"**
4. Appuyer sur **Ajouter**

L'app apparaît sur l'écran d'accueil comme une vraie app native.

### Android (Chrome)

1. Ouvrir l'URL dans **Chrome**
2. Appuyer sur le menu **⋮** (trois points en haut à droite)
3. Appuyer sur **"Ajouter à l'écran d'accueil"**
4. Confirmer en appuyant sur **Ajouter**

---

## Structure du projet

```
compte-mensuel/
├── public/
│   ├── manifest.json      # Config PWA
│   ├── sw.js              # Service worker
│   ├── icon-192.png       # Icône PWA 192x192
│   └── icon-512.png       # Icône PWA 512x512
├── src/
│   ├── App.jsx            # Application principale
│   ├── main.jsx           # Point d'entrée React
│   └── supabase.js        # Client Supabase
├── supabase/
│   └── schema.sql         # Schéma de base de données
├── .env.example           # Variables d'environnement (exemple)
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```
