# Family Tree App Maker 🌳

A modern, full-featured, collaborative family tree builder and genealogy archival studio. Built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Express**, featuring GPU-accelerated canvas rendering, multiple lineage visualization modes, standardized GEDCOM/CSV data exchange, real-time collaboration presence, archival photo albums, and AI-powered biographical storytelling.

---

## 🌟 Key Features

### 1. Interactive Family Tree Canvas
- **High-Performance Rendering**: GPU-accelerated viewport with RAF-throttled mouse dragging, smooth zoom (35% to 220%), and pinch-to-zoom touch gesture support.
- **Smart Generational Layout**: Barycenter parent-midpoint alignment algorithm with horizontal collision avoidance, reducing branch crossing and maintaining natural couple pairings.
- **Visual Connections**: Smooth cubic bezier curves for parent-child descents, marriage connector links with wedding band indicators, and generational strata tracking.
- **Card Quick Actions**: Direct hover triggers to add children, spouses, or parents with automatic bidirectional relationship linking.

### 2. Multi-Perspective Visualization Views
- **Tree Canvas**: Full free-form infinite canvas with generation tiers and family cluster cards.
- **Pedigree Ancestor Chart**: 4-generation horizontal ancestral view distinguishing paternal and maternal lineages.
- **Descendant Branch Chart**: Hierarchical tree with collapsible branches and generation depth indentations.
- **Circular Fan Chart**: Elegant radial polar chart displaying direct ancestry arcs across generations with separate paternal and maternal color spectrums.
- **Generational Lifespan Timeline**: Chronological horizontal lifespan bars aligned against key historical eras (Belle Époque, WWI, Interwar/Depression, WWII, Space Age, Digital Era).

### 3. Six Curated Aesthetic Themes
Switch themes on the fly via the quick dropdown or open the interactive Theme Gallery Modal:
- 📜 **Vintage Parchment**: Warm aged paper texture with sepia ink lines, gold badges, and classic serif typography.
- 🌿 **Emerald Botanical Heritage**: Deep forest botanical greens, gold filigree accents, and natural motifs.
- 👑 **Royal Indigo Lineage**: Regal sapphire and indigo tones with silver-blue relationship links.
- 🏙️ **Modern Minimalist Slate**: Crisp dark slate glassmorphism with high-contrast sky-blue indicators.
- 🌹 **Rosewood Victorian Romance**: Romantic burgundy and antique rosewood borders with warm velvet accents.
- 🏛️ **Charcoal Monochrome Minimal**: Elegant museum-grade monochromatic architecture with clean graphite lines.

### 4. Data Interoperability (Import & Export)
- **GEDCOM 5.5 / 5.5.1 Support**: Import and export standardized `.ged` genealogy files to sync with Ancestry, MyHeritage, FamilySearch, or Gramps.
- **Genealogy CSV Support**: Import and export tabular relative data formatted for spreadsheets.
- **JSON Backup**: Complete tree preservation including media attachments, activity logs, comments, and theme presets.
- **Merge or Replace Modes**: Safely append imported individuals to an existing tree without wiping previous records.

### 5. Multi-User Collaboration & Presence
- **Collaborator Switching**: Seamlessly toggle between family roles (**Owner**, **Editor**, **Family Historian**, **Viewer**).
- **Live Viewing Presence**: Avatars and pulsing indicators display which relative card other collaborators are currently inspecting.
- **Activity Feed**: Comprehensive audit trail recording who added individuals, uploaded photos, edited vitals, or imported files.
- **Shareable Tree Codes**: Unique access tokens for invited family members.

### 6. Archival Media Gallery & Oral History
- **Archival Photo Vault**: Upload historical portraits and documents with year tags, descriptions, and person tagging.
- **Memory Notes & Comments**: Attach reflections, verified facts, and family lore directly to ancestor records.
- **AI Storytelling & Biography Generator**: Integrated with Google Gemini to generate biographical memoirs and generational narratives based on dates, locations, occupations, and family context.
- **Elder Interview Guide**: Generates personalized, respectful oral history interview questions tailored to an individual’s historical era and milestones.

---

## ⌨️ Keyboard Shortcuts & Gestures

| Key / Gesture | Action |
| --- | --- |
| `+` or `=` | Zoom in on canvas |
| `-` or `_` | Zoom out on canvas |
| `0` | Fit whole family tree to screen |
| `Arrow Keys` | Pan canvas left, right, up, down |
| `Ctrl + Scroll` | Smooth wheel zoom |
| `Touch Pinch` | 2-finger zoom on mobile and tablets |
| `1-Finger Drag` | Pan across canvas |
| `Search Box` | Instant query with auto-centering on matched relative |

---

## 🛠️ Architecture & Tech Stack

- **Frontend**:
  - React 19 (`react`, `react-dom`)
  - TypeScript 5.8
  - Tailwind CSS v4 (`@tailwindcss/vite`)
  - Lucide React (Genealogy & historical UI icons)
  - Canvas Confetti (Celebration moments for additions & milestones)
  - Motion
- **Backend**:
  - Node.js & Express (`server.ts`)
  - Vite dev server middleware integration
  - Google GenAI SDK (`@google/genai`) for elder storytelling & interview prompts
- **Genealogy Engine**:
  - Custom GEDCOM parser & serializer (`src/utils/gedcom.ts`)
  - Generational barycenter tree layout engine (`src/components/TreeCanvas.tsx`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or bun

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Set up Gemini API key for AI storytelling:
   Copy `.env.example` to `.env` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

Compile frontend assets and bundle the Node.js server:
```bash
npm run build
```

Run the production server:
```bash
npm run start
```

### Deploying to GitHub Pages 🌐

This project is configured with `base: './'` in `vite.config.ts`, so assets resolve relatively and work seamlessly on GitHub Pages subpaths (`https://<username>.github.io/<repo-name>/`).

#### Option 1: Automatic Deployment with GitHub Actions (Recommended)
1. In your GitHub repository, navigate to **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Create `.github/workflows/deploy.yml` with:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]
     workflow_dispatch:

   permissions:
     contents: read
     pages: write
     id-token: write

   concurrency:
     group: 'pages'
     cancel-in-progress: true

   jobs:
     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v4
         - name: Setup Node
           uses: actions/setup-node@v4
           with:
             node-version: 20
         - name: Install dependencies
           run: npm ci
         - name: Build static site
           run: npm run build
         - name: Setup Pages
           uses: actions/configure-pages@v5
         - name: Upload artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: './dist'
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```

#### Option 2: Using the `gh-pages` package
1. Install `gh-pages`: `npm install -D gh-pages`
2. Add deploy script to `package.json`: `"deploy": "npm run build && gh-pages -d dist"`
3. Run `npm run deploy`

---

## 📁 Project Structure

```
├── public/                 # Static assets and favicons
├── src/
│   ├── components/         # Reusable genealogy components
│   │   ├── AddMemberModal.tsx       # Relative creation with relation linking
│   │   ├── AncestorChart.tsx        # 4-generation pedigree chart
│   │   ├── CollaborationDrawer.tsx  # Activity feed & collaborator management
│   │   ├── DescendantChart.tsx      # Hierarchical descendant branch viewer
│   │   ├── FanChart.tsx             # Radial polar fan chart
│   │   ├── ImportExportModal.tsx    # GEDCOM, CSV, and JSON import/export
│   │   ├── MediaGalleryModal.tsx    # Photo archive and portrait management
│   │   ├── Navbar.tsx               # Top navigation, views, search & tree switcher
│   │   ├── PersonDetailModal.tsx    # Full vitals, AI story & interview generator
│   │   ├── ThemeModal.tsx           # Visual aesthetic switcher gallery
│   │   ├── TimelineView.tsx         # Chronological lifespan & era ruler
│   │   └── TreeCanvas.tsx           # GPU-accelerated interactive tree canvas
│   ├── data/
│   │   └── sampleTrees.ts           # Preloaded multi-generational lineage data
│   ├── utils/
│   │   ├── gedcom.ts                # GEDCOM 5.5 & CSV parser/serializer
│   │   └── theme.ts                 # 6-theme aesthetic styling configuration
│   ├── types.ts                     # Core TypeScript data contracts
│   ├── App.tsx                      # Root orchestration & state persistence
│   ├── index.css                    # Tailwind CSS v4 styling & vintage textures
│   └── main.tsx                     # React root mount
├── server.ts               # Express server with Gemini endpoints & Vite middleware
├── metadata.json           # Application identity & permissions
├── package.json            # Scripts and dependencies
└── vite.config.ts          # Vite bundling configuration
```

---

## 📄 License

MIT License. Designed and crafted for family historians, genealogists, and heritage preservationists.
