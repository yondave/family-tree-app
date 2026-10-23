import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  FileCode, 
  FileSpreadsheet, 
  Sparkles, 
  Check, 
  AlertCircle, 
  FolderDown, 
  BookOpen, 
  ArrowRight,
  RefreshCw,
  Copy
} from 'lucide-react';
import { FamilyTree, Person } from '../types';
import { 
  parseGedcomToTree, 
  exportTreeToGedcom, 
  exportTreeToCSV, 
  parseCsvToTree,
  SAMPLE_GEDCOM 
} from '../utils/gedcom';
import { SAMPLE_TREES } from '../data/sampleTrees';

interface ImportExportModalProps {
  currentTree: FamilyTree;
  onClose: () => void;
  onImportTree: (importedTree: FamilyTree, mode: 'replace' | 'merge') => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  currentTree,
  onClose,
  onImportTree,
}) => {
  const [activeTab, setActiveTab] = useState<'gedcom' | 'csv' | 'ai-extract' | 'export' | 'presets'>('gedcom');
  
  // GEDCOM state
  const [gedcomText, setGedcomText] = useState('');
  const [gedcomParsedStats, setGedcomParsedStats] = useState<{ personCount: number; treeName: string } | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // CSV state
  const [csvText, setCsvText] = useState('');

  // AI Extraction state
  const [unstructuredText, setUnstructuredText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Handle GEDCOM File upload
  const handleGedcomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setGedcomText(content);
      try {
        const parsed = parseGedcomToTree(content);
        setGedcomParsedStats({
          personCount: Object.keys(parsed.members || {}).length,
          treeName: parsed.name,
        });
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  // Run GEDCOM Import
  const handleProcessGedcom = () => {
    if (!gedcomText.trim()) return;
    try {
      const tree = parseGedcomToTree(gedcomText, currentTree.id);
      onImportTree(tree, importMode);
      setImportStatus(`Successfully imported ${Object.keys(tree.members || {}).length} relatives!`);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setImportStatus(`Import error: ${err.message}`);
    }
  };

  // Run CSV Import
  const handleProcessCsv = () => {
    if (!csvText.trim()) return;
    try {
      const tree = parseCsvToTree(csvText, currentTree.id);
      onImportTree(tree, importMode);
      setImportStatus(`Successfully imported ${Object.keys(tree.members || {}).length} relatives from CSV!`);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setImportStatus(`CSV Import error: ${err.message}`);
    }
  };

  // AI Extraction handler
  const handleAIExtract = async () => {
    if (!unstructuredText.trim()) return;
    setIsExtracting(true);
    setExtractError(null);

    try {
      const response = await fetch('/api/ai/extract-tree-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: unstructuredText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to extract genealogy records');

      if (data.persons && Array.isArray(data.persons)) {
        const membersMap: Record<string, Person> = {};
        data.persons.forEach((p: Person) => {
          membersMap[p.id] = {
            ...p,
            photos: [],
            tags: [],
          };
        });

        const newTree: FamilyTree = {
          id: currentTree.id,
          name: data.treeName || 'AI Extracted Lineage',
          description: 'Lineage automatically reconstructed from narrative text records using Gemini AI.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rootPersonId: data.persons[0]?.id || '',
          theme: 'parchment',
          members: membersMap,
          collaborators: currentTree.collaborators,
          activityLogs: currentTree.activityLogs,
          mediaGallery: [],
          comments: [],
        };

        onImportTree(newTree, 'replace');
        setImportStatus(`AI parsed ${data.persons.length} family members!`);
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      setExtractError(err.message || 'AI extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  // Export handlers
  const handleDownloadGedcom = () => {
    const gedContent = exportTreeToGedcom(currentTree);
    const blob = new Blob([gedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTree.name.replace(/\s+/g, '_')}.ged`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const csvContent = exportTreeToCSV(currentTree);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTree.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const jsonContent = JSON.stringify(currentTree, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTree.name.replace(/\s+/g, '_')}_archive.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-amber-100">
                Import & Export Genealogy Records
              </h2>
              <p className="text-xs text-stone-400">
                GEDCOM 5.5/7.0, CSV spreadsheets, AI narrative extraction, and cloud backups
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-800 rounded-full text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 bg-stone-100/80 border-b border-stone-200 flex items-center gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('gedcom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'gedcom'
                ? 'bg-white text-amber-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-amber-700" />
            <span>GEDCOM File (.ged)</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'csv'
                ? 'bg-white text-amber-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV Spreadsheet</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-extract')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'ai-extract'
                ? 'bg-white text-amber-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Story Extractor</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'export'
                ? 'bg-white text-amber-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Export & Download</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'presets'
                ? 'bg-white text-amber-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sample Trees</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-50/40">
          
          {/* Status Message */}
          {importStatus && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* TAB 1: GEDCOM */}
          {activeTab === 'gedcom' && (
            <div className="space-y-5">
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
                <p className="text-xs text-amber-950 font-medium">
                  GEDCOM is the universal international genealogy standard. You can export from <strong>Ancestry.com, MyHeritage, FamilySearch, Gramps, or Geni</strong> and import it seamlessly here.
                </p>
              </div>

              {/* Upload Drop Area */}
              <div>
                <label className="block w-full border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer bg-white transition-colors">
                  <FileCode className="w-8 h-8 text-amber-700 mx-auto mb-2" />
                  <p className="text-xs font-bold text-stone-800">
                    Upload .GED or .GEDCOM File
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Drag and drop or click to select from your device
                  </p>
                  <input
                    type="file"
                    accept=".ged,.gedcom,text/plain"
                    onChange={handleGedcomFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Or Paste Raw GEDCOM */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Or Paste GEDCOM 5.5 / 7.0 Syntax
                  </label>
                  <button
                    type="button"
                    onClick={() => setGedcomText(SAMPLE_GEDCOM)}
                    className="text-[11px] text-amber-700 hover:underline font-medium"
                  >
                    Load Sample GEDCOM snippet
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={gedcomText}
                  onChange={(e) => {
                    setGedcomText(e.target.value);
                    try {
                      const p = parseGedcomToTree(e.target.value);
                      setGedcomParsedStats({
                        personCount: Object.keys(p.members || {}).length,
                        treeName: p.name,
                      });
                    } catch {}
                  }}
                  placeholder="0 HEAD&#10;1 SOUR Ancestry&#10;1 GEDC&#10;2 VERS 5.5.1&#10;0 @I1@ INDI&#10;1 NAME Alexander /Montgomery/..."
                  className="w-full p-3 font-mono text-xs bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {gedcomParsedStats && (
                <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
                  <span>
                    Detected: <strong>{gedcomParsedStats.personCount} relatives</strong> in "{gedcomParsedStats.treeName}"
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-amber-600"
                      />
                      <span>Replace Tree</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="text-amber-600"
                      />
                      <span>Merge Branches</span>
                    </label>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={!gedcomText.trim()}
                onClick={handleProcessGedcom}
                className="w-full py-2.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Import GEDCOM Records</span>
              </button>
            </div>
          )}

          {/* TAB 2: CSV */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-600">
                Import family records from Microsoft Excel or Google Sheets. Columns supported: <code className="bg-stone-100 px-1 py-0.5 rounded text-amber-800">id, firstName, lastName, maidenName, gender, birthDate, birthPlace, deathDate, deathPlace, occupation, parentIds, spouseIds</code>
              </p>

              <textarea
                rows={7}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="firstName,lastName,gender,birthDate,birthPlace,occupation,parentIds,spouseIds&#10;Alexander,Montgomery,male,1892-04-14,Edinburgh,Botanist,,p_2&#10;Isla,Sterling,female,1895-09-22,Glasgow,Naturalist,,p_1"
                className="w-full p-3 font-mono text-xs bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />

              <button
                type="button"
                disabled={!csvText.trim()}
                onClick={handleProcessCsv}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Import CSV Spreadsheet</span>
              </button>
            </div>
          )}

          {/* TAB 3: AI Narrative Extractor */}
          {activeTab === 'ai-extract' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950">
                  <p className="font-bold">AI Unstructured Narrative Extractor</p>
                  <p className="mt-0.5 opacity-90">
                    Paste an obituary, handwritten letter transcript, old diary entry, or family bible inscription. Gemini AI will automatically extract every individual, calculate parents, spouses, and children, and construct an interactive tree.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Paste Raw Text / Obituary / Biography
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setUnstructuredText(
                        `Alexander Montgomery was born in Edinburgh in 1892. In 1920, he married Isla Sterling (born 1895 in Glasgow). Together they had three children: Alistair (born 1924), Margaret (born 1927), and Arthur (born 1931). Alistair later married Clara Vance and had a daughter named Eleanor in 1958.`
                      )
                    }
                    className="text-[11px] text-amber-700 hover:underline font-medium"
                  >
                    Paste Example Story
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={unstructuredText}
                  onChange={(e) => setUnstructuredText(e.target.value)}
                  placeholder="Paste historical narrative here..."
                  className="w-full p-3 text-xs bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {extractError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {extractError}
                </div>
              )}

              <button
                type="button"
                disabled={!unstructuredText.trim() || isExtracting}
                onClick={handleAIExtract}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isExtracting ? 'AI Reconstructing Lineage...' : 'Reconstruct Tree with AI'}</span>
              </button>
            </div>
          )}

          {/* TAB 4: Export Data */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-600">
                Download your complete family tree in standard formats for backup, offline storage, or migration into external genealogy software.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* GEDCOM Download */}
                <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-xs text-stone-900">Standard GEDCOM (.ged)</h4>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Compatible with Ancestry, MyHeritage, FamilySearch, Gramps.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadGedcom}
                    className="mt-4 px-3 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .GED</span>
                  </button>
                </div>

                {/* CSV Download */}
                <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-xs text-stone-900">Spreadsheet CSV (.csv)</h4>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Open in Microsoft Excel, Google Sheets, or Numbers.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadCsv}
                    className="mt-4 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .CSV</span>
                  </button>
                </div>

                {/* JSON Archive */}
                <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center mb-2">
                      <FolderDown className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-xs text-stone-900">Full JSON Archive</h4>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Contains all metadata, photos, comments & activity logs.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadJson}
                    className="mt-4 px-3 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .JSON</span>
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-600">
                Explore pre-built sample family dynasties to test multi-generational features and visual charts:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {SAMPLE_TREES.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-colors"
                  >
                    <div>
                      <h4 className="font-display font-bold text-sm text-stone-900">
                        {preset.name}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-1 line-clamp-3">
                        {preset.description}
                      </p>
                      <div className="mt-3 text-[11px] text-amber-800 font-semibold">
                        {Object.keys(preset.members).length} Relatives Recorded
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onImportTree(preset, 'replace');
                        onClose();
                      }}
                      className="mt-4 w-full py-2 bg-stone-100 hover:bg-amber-100 text-stone-800 hover:text-amber-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>Load Sample Tree</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
