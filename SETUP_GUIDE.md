# New Features Setup Guide

## 1. Firebase Setup (5 minutes)

### Step 1 — Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click **"Add Project"** → Name it `sms-pro`
3. Disable Google Analytics (optional) → **Create Project**

### Step 2 — Enable Services
Inside your Firebase project:

**Firestore** (cloud database):
- Left sidebar → **Firestore Database** → Create database
- Choose **"Start in test mode"** → Select region → Enable

**Realtime Database** (live announcements):
- Left sidebar → **Realtime Database** → Create database
- Choose **"Start in test mode"** → Enable

**Storage** (profile photos):
- Left sidebar → **Storage** → Get started
- Choose **"Start in test mode"** → Enable

**Authentication** (optional for login):
- Left sidebar → **Authentication** → Get started
- Enable **Email/Password** provider

### Step 3 — Get Config Keys
- Left sidebar → **Project Settings** (gear icon)
- Scroll to **"Your apps"** → Click `</>` (Web)
- Register app → Copy the `firebaseConfig` object

### Step 4 — Paste into .env
Open `student-management/.env` and fill in:
```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=sms-pro.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sms-pro
VITE_FIREBASE_STORAGE_BUCKET=sms-pro.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_DATABASE_URL=https://sms-pro-default-rtdb.firebaseio.com
```

---

## 2. Gemini AI Chatbot Setup (2 minutes)

1. Go to https://aistudio.google.com/app/apikey
2. Click **"Create API Key"** → Select your Firebase project
3. Copy the key
4. Paste into `.env`:
```
VITE_GEMINI_API_KEY=AIzaSy...
```

**Free tier:** 60 requests/minute — more than enough for testing!

---

## 3. EmailJS Setup (5 minutes)

1. Go to https://www.emailjs.com → Sign up free
2. **Email Services** → Add Service → Connect Gmail/Outlook
3. **Email Templates** → Create template with these variables:
   ```
   To: {{to_email}}
   Subject: Welcome to SMS Pro, {{student_name}}!
   Body:
   Hello {{student_name}},
   
   Welcome to SMS Pro! Your registration is confirmed.
   
   Student ID: {{student_id}}
   Course: {{course}}
   Department: {{department}}
   
   Login at: http://localhost:5173/student-login
   Password: {{password_hint}}
   
   Best regards,
   SMS Pro Admin
   ```
4. **Account** → API Keys → Copy Public Key
5. Paste into `.env`:
```
VITE_EMAILJS_SERVICE_ID=service_xxx
VITE_EMAILJS_TEMPLATE_ID=template_xxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

---

## 4. Restart Dev Server

After updating `.env`:
```cmd
cd C:\Users\appur\student-management
npm run dev
```

**Important:** Vite reads `.env` at startup — always restart after changing it!

---

## Features Summary

| Feature | Status | Requires |
|---------|--------|---------|
| AI Chatbot (EduBot) | ✅ Working (demo mode without key) | Gemini API Key |
| Student ID Card + QR | ✅ Working right now | Nothing |
| PDF/PNG Download | ✅ Working right now | Nothing |
| Announcements Board | ✅ Works with local data | Firebase Realtime DB for live |
| Profile Photo Upload | ✅ Preview works | Firebase Storage for cloud save |
| Firestore Cloud DB | 🔌 Ready to connect | Firebase Project |
| Email on Registration | 🔌 Ready to connect | EmailJS account |

---

## What Each Tool Does

```
Firebase Firestore    → Cloud database (replaces localStorage)
Firebase Realtime DB  → Live announcements (updates instantly for all users)
Firebase Storage      → Store profile photos in the cloud
Gemini AI (@google/generative-ai) → Powers the EduBot chatbot
QRCode.react          → Generates QR code on the student ID card
jsPDF + html2canvas   → Converts the ID card to PDF/PNG download
EmailJS               → Sends welcome emails without a backend
```
