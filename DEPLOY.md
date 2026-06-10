# LeanTrack — Deployment Guide

## What you have
A full personal health tracker web app with:
- 📸 Food photo → calorie scanning (OpenAI GPT-4o Vision)
- ✏️ Manual food logging with meal types
- ⚡ Quick-add common foods
- 📊 Dashboard with calorie ring, weight trend chart, weekly bar chart
- 📅 Weekly summaries (like Chris Murphy's doc, but automatic)
- ⚖️ Daily weight & steps logging
- 🔥 Streak tracking
- 💾 Export/import backup (JSON)
- All data stored locally on your device (no server, no subscription)

---

## Deploy to GitHub Pages (FREE, takes ~5 minutes)

### Step 1: Create a GitHub account
Go to https://github.com and sign up (free).

### Step 2: Create a new repository
1. Click the "+" button → "New repository"
2. Name it: `healthtracker` (or any name)
3. Set to **Public**
4. Click "Create repository"

### Step 3: Upload the code
Option A (easiest — GitHub web upload):
1. In your new repo, click "uploading an existing file"
2. Drag the entire `healthtracker` folder contents
3. Commit the files

Option B (Git command line):
```bash
cd healthtracker
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/healthtracker.git
git push -u origin main
```

### Step 4: Enable GitHub Pages
1. In your repo, go to **Settings** → **Pages**
2. Under "Source", select **GitHub Actions**
3. GitHub will show you a workflow — click "Configure"
4. Replace with this workflow content, commit it

Create file `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install --legacy-peer-deps
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
```

### Step 5: Update package.json homepage
In `package.json`, change this line:
```json
"homepage": "."
```
To:
```json
"homepage": "https://YOUR_USERNAME.github.io/healthtracker"
```

### Step 6: Push and wait
After pushing, GitHub Actions will build and deploy automatically.
Your app will be live at: `https://YOUR_USERNAME.github.io/healthtracker`

---

## Alternative: Run locally (instant, no deployment needed)
```bash
cd healthtracker
npm install --legacy-peer-deps
npm start
```
Opens at http://localhost:3000

---

## Getting your OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with sk-)
4. Paste it in LeanTrack → Settings → OpenAI API Key
5. The key is stored ONLY on your device (localStorage)

Cost: GPT-4o Vision costs ~$0.01-0.03 per food scan. Very cheap.

---

## Adding food photos from iPhone
Since this is a web app:
1. Open the app on your iPhone browser
2. Tap "Photo Scan" → tap the upload area
3. Your iPhone will offer to take a photo or choose from library
4. Take/select your food photo
5. Tap "Scan with AI" — results in ~3 seconds

---

## Syncing steps from Apple Watch
Since Apple Health doesn't share with web apps:
1. Open your Apple Watch app at end of day
2. Note your step count
3. Open LeanTrack → "Log Today"
4. Enter steps in the "Steps today" field
5. Tap "Save vitals"

Optional automation: Use iOS Shortcuts app to create a shortcut that reads HealthKit steps and opens a URL with the count — ask Claude to help set that up.

---

## Your data
- All data lives in your browser's localStorage
- Use Settings → "Export all data" to back up weekly
- Backup file can be imported on any device/browser

---

## File structure
```
healthtracker/
├── public/index.html
├── src/
│   ├── App.js              # Main app + routing
│   ├── index.css           # All styles
│   ├── pages/
│   │   ├── Onboarding.js   # Setup wizard
│   │   ├── Dashboard.js    # Main dashboard
│   │   ├── DailyLog.js     # Food logging + photo scan
│   │   ├── WeeklyView.js   # Weekly summaries
│   │   └── Settings.js     # Profile + data management
│   └── components/
│       ├── CalorieRing.js  # Circular progress component
│       └── Toast.js        # Notification component
└── package.json
```
