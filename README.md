# 🏘️ Padosi — Backend Setup Guide

A hyperlocal task platform built with Node.js, Express, SQLite, and Passport.js.

---

## 📁 Project Structure

```
padosi-backend/
├── server.js          # Main Express server & all API routes
├── auth.js            # Passport strategies (Local + Google OAuth)
├── db.js              # SQLite database setup & helpers
├── package.json       # Dependencies
├── .env               # ← YOUR config (fill this in!)
├── .env.example       # Template for .env
└── public/
    └── index.html     # Frontend (served by Express)
```

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Open `.env` and fill in your values:
```
SESSION_SECRET=some_long_random_string_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
BASE_URL=http://localhost:3000
```

> **Tip:** Generate a strong SESSION_SECRET with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 3. Run the server
```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

### 4. Open in browser
```
http://localhost:3000
```

---

## 🔑 Setting Up Google OAuth (for "Continue with Google")

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Set Application type to **Web application**
6. Under **Authorised redirect URIs**, add:
   ```
   http://localhost:3000/auth/google/callback
   ```
7. Copy the **Client ID** and **Client Secret** into your `.env` file

> ⚠️ Google login will NOT work until you complete these steps.  
> Email/password login works immediately without any setup.

---

## 🛠️ API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/me` | — | Get current logged-in user |
| POST | `/api/signup` | — | Register with email + password |
| POST | `/api/login` | — | Login with email + password |
| POST | `/api/logout` | ✅ | Sign out |
| GET | `/auth/google` | — | Start Google OAuth flow |
| GET | `/auth/google/callback` | — | Google OAuth callback |
| GET | `/api/tasks` | ✅ | Get all tasks for current user |
| POST | `/api/tasks` | ✅ | Create a new task |
| PUT | `/api/tasks/:id` | ✅ | Edit a task |
| DELETE | `/api/tasks/:id` | ✅ | Delete a task |
| POST | `/api/tasks/:id/accept` | ✅ | Accept a task (assigns helper) |

---

## 🗄️ Database

SQLite database files are auto-created on first run:
- `padosi.db` — users, tasks, helpers
- `sessions.db` — login sessions

No setup needed — they're created automatically.

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| express | Web server |
| express-session | Session management |
| connect-sqlite3 | SQLite session store |
| passport | Authentication middleware |
| passport-local | Email/password strategy |
| passport-google-oauth20 | Google OAuth strategy |
| bcryptjs | Password hashing |
| sqlite3 | Database |
| cors | Cross-origin requests |
| dotenv | Environment variables |
| express-validator | Input validation |

---

## 🚀 Deploying to Production

1. Set `NODE_ENV=production` in `.env`
2. Set `BASE_URL` to your real domain (e.g. `https://padosi.in`)
3. Update Google OAuth redirect URI in Google Cloud Console to match
4. Set `cookie.secure = true` (already handled when NODE_ENV=production)
5. Use a process manager like **PM2**:
   ```bash
   npm install -g pm2
   pm2 start server.js --name padosi
   pm2 save
   ```

---

## 🧪 Testing Without Google OAuth

Email/password auth works out of the box. Just:
1. `npm install`
2. Add any `SESSION_SECRET` to `.env`
3. `npm start`
4. Sign up at `http://localhost:3000`
