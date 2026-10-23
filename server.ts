import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { sampleTrees } from './src/data/sampleTrees';
import { parseGedcom, exportGedcom, parseGenealogyCSV, exportGenealogyCSV } from './src/utils/gedcom';
import { FamilyTree, Person, MediaAttachment, ActivityLog, CommentItem, Collaborator } from './src/types';

dotenv.config();

// In-memory persistent state initialized with rich sample trees
let treesStore: Record<string, FamilyTree> = {};

// Initialize with sample trees
sampleTrees.forEach((t) => {
  treesStore[t.id] = JSON.parse(JSON.stringify(t));
});

// Lazy Gemini client helper
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not found in environment variables.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large base64 image uploads and GEDCOM files
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get all trees summary
  app.get('/api/trees', (req, res) => {
    const list = Object.values(treesStore).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      memberCount: Object.keys(t.members || {}).length,
      mediaCount: (t.media || []).length,
      collaboratorCount: (t.collaborators || []).length,
      updatedAt: t.updatedAt,
      rootPersonId: t.rootPersonId,
      theme: t.theme,
      shareCode: t.shareCode,
    }));
    res.json({ trees: list });
  });

  // Get single tree with full data
  app.get('/api/trees/:id', (req, res) => {
    const tree = treesStore[req.params.id];
    if (!tree) {
      return res.status(404).json({ error: 'Family tree not found' });
    }
    res.json({ tree });
  });

  // Create new tree
  app.post('/api/trees', (req, res) => {
    const newTree: FamilyTree = req.body;
    if (!newTree || !newTree.name) {
      return res.status(400).json({ error: 'Tree name is required' });
    }
    const id = newTree.id || `tree-${Date.now()}`;
    const fullTree: FamilyTree = {
      ...newTree,
      id,
      createdAt: newTree.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: newTree.members || {},
      relationships: newTree.relationships || [],
      media: newTree.media || [],
      collaborators: newTree.collaborators || [
        {
          id: `user-${Date.now()}`,
          name: 'You (Creator)',
          role: 'owner',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          color: '#b45309',
          lastActive: 'Just now',
          isOnline: true,
        },
      ],
      activityLogs: newTree.activityLogs || [
        {
          id: `act-${Date.now()}`,
          treeId: id,
          collaboratorName: 'You',
          collaboratorColor: '#b45309',
          action: 'added_person',
          details: `Created family tree "${newTree.name}".`,
          timestamp: 'Just now',
        },
      ],
      comments: newTree.comments || [],
      theme: newTree.theme || 'parchment',
      shareCode: newTree.shareCode || `TREE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    };

    treesStore[id] = fullTree;
    res.status(201).json({ tree: fullTree });
  });

  // Update tree
  app.put('/api/trees/:id', (req, res) => {
    const treeId = req.params.id;
    if (!treesStore[treeId]) {
      return res.status(404).json({ error: 'Tree not found' });
    }

    const updatedTree: FamilyTree = {
      ...treesStore[treeId],
      ...req.body,
      id: treeId,
      updatedAt: new Date().toISOString(),
    };

    treesStore[treeId] = updatedTree;
    res.json({ tree: updatedTree });
  });

  // Delete tree
  app.delete('/api/trees/:id', (req, res) => {
    const treeId = req.params.id;
    if (!treesStore[treeId]) {
      return res.status(404).json({ error: 'Tree not found' });
    }
    delete treesStore[treeId];
    res.json({ success: true, message: 'Tree deleted successfully' });
  });

  // Collaborators & Activity Logging
  app.post('/api/trees/:id/activity', (req, res) => {
    const tree = treesStore[req.params.id];
    if (!tree) return res.status(404).json({ error: 'Tree not found' });

    const log: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      treeId: tree.id,
      collaboratorName: req.body.collaboratorName || 'Collaborator',
      collaboratorColor: req.body.collaboratorColor || '#b45309',
      action: req.body.action || 'edited_person',
      details: req.body.details || 'Updated lineage records',
      timestamp: 'Just now',
      personId: req.body.personId,
    };

    tree.activityLogs = [log, ...(tree.activityLogs || [])].slice(0, 100);
    tree.updatedAt = new Date().toISOString();
    res.json({ success: true, log });
  });

  // Comments
  app.post('/api/trees/:id/comments', (req, res) => {
    const tree = treesStore[req.params.id];
    if (!tree) return res.status(404).json({ error: 'Tree not found' });

    const comment: CommentItem = {
      id: `comm-${Date.now()}`,
      personId: req.body.personId,
      author: req.body.author || 'Family Contributor',
      authorColor: req.body.authorColor || '#047857',
      avatar: req.body.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      text: req.body.text,
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    tree.comments = [...(tree.comments || []), comment];
    tree.updatedAt = new Date().toISOString();
    res.json({ success: true, comment });
  });

  // Photo / Media Upload
  app.post('/api/trees/:id/media', (req, res) => {
    const tree = treesStore[req.params.id];
    if (!tree) return res.status(404).json({ error: 'Tree not found' });

    const newMedia: MediaAttachment = {
      id: `media-${Date.now()}`,
      url: req.body.url,
      title: req.body.title || 'Family Photograph',
      caption: req.body.caption || '',
      year: req.body.year || '',
      place: req.body.place || '',
      taggedPersonIds: req.body.taggedPersonIds || [],
      uploadedBy: req.body.uploadedBy || 'Contributor',
      uploadedAt: new Date().toISOString(),
    };

    tree.media = [newMedia, ...(tree.media || [])];

    // Also attach to tagged person profiles
    if (newMedia.taggedPersonIds && newMedia.taggedPersonIds.length > 0) {
      newMedia.taggedPersonIds.forEach((pid) => {
        if (tree.members[pid]) {
          tree.members[pid].photos = [newMedia, ...(tree.members[pid].photos || [])];
          // If member has no avatar, set this as primary avatar
          if (!tree.members[pid].avatarUrl && newMedia.url) {
            tree.members[pid].avatarUrl = newMedia.url;
          }
        }
      });
    }

    // Add activity
    tree.activityLogs = [
      {
        id: `act-${Date.now()}`,
        treeId: tree.id,
        collaboratorName: newMedia.uploadedBy,
        collaboratorColor: '#047857',
        action: 'added_photo',
        details: `Uploaded photo "${newMedia.title}"${newMedia.taggedPersonIds.length > 0 ? ` tagged to ${newMedia.taggedPersonIds.length} person(s)` : ''}.`,
        timestamp: 'Just now',
      },
      ...(tree.activityLogs || []),
    ];

    tree.updatedAt = new Date().toISOString();
    res.json({ success: true, media: newMedia });
  });

  // GEDCOM Import Parsing Endpoint
  app.post('/api/genealogy/parse-gedcom', (req, res) => {
    try {
      const { gedcomText } = req.body;
      if (!gedcomText) {
        return res.status(400).json({ error: 'No GEDCOM content provided' });
      }

      const parsed = parseGedcom(gedcomText);
      res.json({ success: true, result: parsed });
    } catch (err: any) {
      console.error('GEDCOM parse error:', err);
      res.status(500).json({ error: `Failed to parse GEDCOM file: ${err.message}` });
    }
  });

  // GEDCOM Export Endpoint
  app.post('/api/genealogy/export-gedcom', (req, res) => {
    try {
      const { tree } = req.body;
      if (!tree || !tree.members) {
        return res.status(400).json({ error: 'Invalid tree data provided for export' });
      }
      const gedcomText = exportGedcom(tree);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(tree.name || 'family-tree')}.ged"`);
      res.send(gedcomText);
    } catch (err: any) {
      console.error('GEDCOM export error:', err);
      res.status(500).json({ error: `Failed to export GEDCOM: ${err.message}` });
    }
  });

  // CSV Import Parsing Endpoint
  app.post('/api/genealogy/parse-csv', (req, res) => {
    try {
      const { csvText } = req.body;
      if (!csvText) {
        return res.status(400).json({ error: 'No CSV content provided' });
      }
      const members = parseGenealogyCSV(csvText);
      res.json({ success: true, members, count: Object.keys(members).length });
    } catch (err: any) {
      res.status(500).json({ error: `Failed to parse CSV: ${err.message}` });
    }
  });

  // --- AI Genealogy Assistant Endpoints (Gemini 2.5/3.7 Flash) ---

  // Generate biographical narrative for an ancestor
  app.post('/api/ai/generate-biography', async (req, res) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(500).json({ error: 'Gemini AI API key is not configured.' });
      }

      const { person, familyContext, style = 'biographical' } = req.body;
      if (!person) {
        return res.status(400).json({ error: 'Person details required' });
      }

      const prompt = `You are an expert family genealogist and master heritage storyteller.
Write a rich, beautifully composed, historical narrative biography for this family ancestor based on the provided records:

Individual Records:
- Name: ${person.firstName} ${person.lastName} ${person.maidenName ? `(née ${person.maidenName})` : ''}
- Gender: ${person.gender}
- Born: ${person.birthDate || 'Date unknown'} in ${person.birthPlace || 'Location unknown'}
- Died: ${person.isLiving ? 'Living' : `${person.deathDate || 'Unknown'} in ${person.deathPlace || 'Unknown'}`}
- Occupation / Trade: ${person.occupation || 'Not recorded'}
- Known Notes / Anecdotes: ${person.notes || person.bio || 'None specified'}
- Family Context: ${familyContext || 'Not specified'}

Writing Style: ${style === 'narrative' ? 'Engaging heritage memoir prose' : 'Authoritative biographical lineage entry with historical context of their era'}

Guidelines:
1. Weave in the historical era, migration patterns, and cultural atmosphere of their birth and lifespan.
2. If certain facts are sparse, frame them with respectful period-appropriate historical color without inventing false verifiable records.
3. Keep it between 180 and 320 words, structured into 2-3 engaging paragraphs. Include a suggested "Era Headline" at the top.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      res.json({ biography: response.text });
    } catch (err: any) {
      console.error('AI biography error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate biography' });
    }
  });

  // Generate Elder Interview Questions for oral history preservation
  app.post('/api/ai/elder-interview-prompts', async (req, res) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(500).json({ error: 'Gemini AI API key is not configured.' });
      }

      const { person } = req.body;
      const prompt = `You are a genealogy oral historian.
Generate 5 thoughtful, emotionally resonant, and specific interview questions to ask this family member (or their living relatives) to capture oral histories and generational memories:

Person: ${person.firstName} ${person.lastName}
Birth Year/Era: ${person.birthDate || 'Unknown'}
Birth Location: ${person.birthPlace || 'Unknown'}
Occupation: ${person.occupation || 'Unknown'}
Known details: ${person.bio || person.notes || 'None'}

Format as a JSON array with objects containing:
- question: The warm, open-ended question to ask
- purpose: Why this question uncovers valuable genealogical or emotional heritage
- theme: (e.g. 'Childhood & Homeland', 'Traditions & Kitchen Recipes', 'Historical Turning Points', 'Love & Partnerships')`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '[]');
      res.json({ questions: parsed });
    } catch (err: any) {
      console.error('AI interview error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate interview questions' });
    }
  });

  // Extract structured family members from messy text / obituary / family letters
  app.post('/api/ai/extract-family-tree', async (req, res) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(500).json({ error: 'Gemini AI API key is not configured.' });
      }

      const { text } = req.body;
      if (!text) return res.status(400).json({ error: 'Text is required' });

      const prompt = `Analyze this obituary, historical letter, or genealogy text and extract all identified family members and their relationships.

Input Text:
"""
${text}
"""

Return a JSON object with:
- members: Array of objects with { id (string like "p1"), firstName, lastName, maidenName, gender ("male"|"female"|"other"|"unknown"), birthDate, birthPlace, deathDate, deathPlace, isLiving (boolean), occupation, bio, parentIds (array of ids), spouseIds (array of ids), childIds (array of ids) }
- suggestedTreeName: A good title for this family branch`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ result: parsed });
    } catch (err: any) {
      console.error('AI extract error:', err);
      res.status(500).json({ error: err.message || 'Failed to extract family tree' });
    }
  });

  // Historical context provider (What happened during their life)
  app.post('/api/ai/historical-context', async (req, res) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(500).json({ error: 'Gemini AI API key is not configured.' });
      }

      const { birthYear, deathYear, location } = req.body;
      const prompt = `Provide a concise, fascinating timeline of 3-4 major historical, cultural, or technological events that shaped daily life for someone living in ${location || 'the world'} between ${birthYear || '1900'} and ${deathYear || '1980'}.

Return JSON array of { year: string, event: string, impactOnFamilies: string }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '[]');
      res.json({ events: parsed });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate historical context' });
    }
  });

  // --- Vite & Static Asset Handling ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Family Tree App Maker server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
