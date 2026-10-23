import React, { useState } from 'react';
import { 
  GitFork, 
  Upload, 
  FileDown, 
  UserPlus, 
  Palette, 
  Users, 
  Sparkles, 
  Image as ImageIcon, 
  Search, 
  Clock, 
  Layers, 
  Compass, 
  Share2, 
  Eye, 
  Check, 
  HelpCircle,
  PlusCircle,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { FamilyTree, ViewMode, TreeTheme, Collaborator } from '../types';

interface NavbarProps {
  tree: FamilyTree;
  allTrees: { id: string; name: string; memberCount: number; updatedAt: string }[];
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onSelectTree: (treeId: string) => void;
  onCreateTree: () => void;
  onOpenImportExport: () => void;
  onOpenAddMember: () => void;
  onOpenMediaGallery: () => void;
  onOpenCollaboration: () => void;
  onOpenThemeModal?: () => void;
  onThemeChange: (theme: TreeTheme) => void;
  currentCollaborator: Collaborator;
  onSwitchCollaborator: (collaborator: Collaborator) => void;
  onSearchPerson: (query: string) => void;
  searchQuery: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  tree,
  allTrees,
  currentView,
  onViewChange,
  onSelectTree,
  onCreateTree,
  onOpenImportExport,
  onOpenAddMember,
  onOpenMediaGallery,
  onOpenCollaboration,
  onOpenThemeModal,
  onThemeChange,
  currentCollaborator,
  onSwitchCollaborator,
  onSearchPerson,
  searchQuery,
}) => {
  const [showTreeDropdown, setShowTreeDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const memberCount = Object.keys(tree.members || {}).length;
  const photoCount = (tree.media || []).length;
  const onlineCollaborators = (tree.collaborators || []).filter((c) => c.isOnline);

  const handleCopyShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}?tree=${tree.shareCode}`);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const themes: { id: TreeTheme; label: string; bg: string; dot: string }[] = [
    { id: 'parchment', label: 'Vintage Parchment', bg: 'bg-[#fbf8f2]', dot: 'bg-amber-700' },
    { id: 'emerald-heritage', label: 'Emerald Botanical', bg: 'bg-emerald-950', dot: 'bg-emerald-500' },
    { id: 'royal-indigo', label: 'Royal Lineage', bg: 'bg-indigo-950', dot: 'bg-indigo-400' },
    { id: 'modern-slate', label: 'Modern Slate', bg: 'bg-slate-900', dot: 'bg-sky-500' },
    { id: 'rose-wood', label: 'Rosewood Victorian', bg: 'bg-rose-950', dot: 'bg-rose-500' },
    { id: 'monochrome-charcoal', label: 'Charcoal Minimal', bg: 'bg-stone-900', dot: 'bg-stone-400' },
  ];

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md select-none">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-4">
        
        {/* Left: Brand & Tree Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50 shadow-inner ring-1 ring-amber-400/30 flex-shrink-0">
            <GitFork className="w-5 h-5 transform rotate-180" />
          </div>

          <div className="relative min-w-0">
            <button
              onClick={() => setShowTreeDropdown(!showTreeDropdown)}
              className="flex items-center gap-2 text-left px-2 py-1 -mx-2 rounded-lg hover:bg-stone-800/80 transition-colors group"
              title="Switch or create family trees"
            >
              <div className="truncate max-w-[200px] sm:max-w-[280px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-base sm:text-lg text-amber-100 truncate group-hover:text-amber-300 transition-colors">
                    {tree.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-200 transition-transform flex-shrink-0" />
                </div>
                <div className="text-[11px] text-stone-400 flex items-center gap-2">
                  <span>{memberCount} relatives</span>
                  <span>•</span>
                  <span>{photoCount} photos</span>
                </div>
              </div>
            </button>

            {/* Tree Switcher Dropdown */}
            {showTreeDropdown && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Your Family Trees
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 my-1">
                  {allTrees.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelectTree(t.id);
                        setShowTreeDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        t.id === tree.id
                          ? 'bg-amber-600/20 text-amber-300 font-semibold border border-amber-500/30'
                          : 'text-stone-300 hover:bg-stone-700/60'
                      }`}
                    >
                      <div className="truncate">
                        <p className="truncate font-medium">{t.name}</p>
                        <p className="text-[10px] text-stone-400">{t.memberCount} members</p>
                      </div>
                      {t.id === tree.id && <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                    </button>
                  ))}
                </div>

                <div className="border-t border-stone-700 pt-2 mt-1 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      onCreateTree();
                      setShowTreeDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-amber-300 hover:bg-amber-500/10 flex items-center gap-2 font-medium transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create New Family Tree</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenImportExport();
                      setShowTreeDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-stone-300 hover:bg-stone-700 flex items-center gap-2 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-stone-400" />
                    <span>Import GEDCOM / Genealogy File</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Search Relatives */}
        <div className="hidden md:flex items-center flex-1 max-w-xs relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ancestors, maiden names..."
            value={searchQuery}
            onChange={(e) => onSearchPerson(e.target.value)}
            className="w-full bg-stone-800/80 border border-stone-700/80 rounded-full pl-9 pr-4 py-1.5 text-xs text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchPerson('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Add Person Primary Button */}
          <button
            onClick={onOpenAddMember}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium text-xs sm:text-sm rounded-lg shadow-sm flex items-center gap-1.5 transition-all transform active:scale-95"
            title="Add parent, spouse, child or ancestor"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Relative</span>
          </button>

          {/* Upload Photo Button */}
          <button
            onClick={onOpenMediaGallery}
            className="p-2 sm:px-3 sm:py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg text-xs font-medium border border-stone-700 flex items-center gap-1.5 transition-colors"
            title="Upload historic photos & view media archive"
          >
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">Photos ({photoCount})</span>
          </button>

          {/* Import / Export Button */}
          <button
            onClick={onOpenImportExport}
            className="p-2 sm:px-3 sm:py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg text-xs font-medium border border-stone-700 flex items-center gap-1.5 transition-colors"
            title="Import/Export GEDCOM, CSV, or sample lineages"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline">GEDCOM / Data</span>
          </button>

          {/* Share / Invite Code */}
          <button
            onClick={handleCopyShare}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 rounded-lg border border-stone-700 transition-colors relative"
            title="Copy share link for family members"
          >
            {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Theme Selector */}
          <div className="relative">
            <button
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
              className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-300 rounded-lg border border-stone-700 transition-colors"
              title="Change canvas parchment theme"
            >
              <Palette className="w-4 h-4" />
            </button>

            {showThemeDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-2 z-50">
                <div className="px-2 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                  Visual Style
                </div>
                <div className="space-y-1 mt-1">
                  {themes.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => {
                        onThemeChange(th.id);
                        setShowThemeDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        tree.theme === th.id
                          ? 'bg-amber-600/20 text-amber-300 font-semibold border border-amber-500/30'
                          : 'text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-3 h-3 rounded-full ${th.dot} ring-1 ring-white/20`} />
                        <span className="truncate">{th.label}</span>
                      </div>
                      {tree.theme === th.id && <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    </button>
                  ))}
                </div>

                {onOpenThemeModal && (
                  <div className="border-t border-stone-700 pt-1.5 mt-1.5">
                    <button
                      onClick={() => {
                        setShowThemeDropdown(false);
                        onOpenThemeModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-amber-300 hover:bg-stone-700/80 flex items-center gap-2 font-medium transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Theme Gallery & Previews</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Collaborator Avatar / Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 p-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-full sm:rounded-lg sm:px-2.5 transition-colors group"
              title={`Logged in as ${currentCollaborator.name} (${currentCollaborator.role})`}
            >
              <div className="relative">
                <img
                  src={currentCollaborator.avatar}
                  alt={currentCollaborator.name}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-amber-500/80"
                />
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-stone-900 absolute -bottom-0.5 -right-0.5" />
              </div>
              <div className="hidden sm:block text-left text-xs max-w-[90px] truncate">
                <p className="font-semibold text-stone-200 truncate">{currentCollaborator.name.split(' ')[0]}</p>
                <p className="text-[10px] text-amber-400/90 capitalize">{currentCollaborator.role}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-stone-400 hidden sm:block" />
            </button>

            {/* Collaborators Dropdown */}
            {showUserDropdown && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-2 z-50">
                <div className="px-3 py-1.5 text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Co-Editors Presence</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-normal">
                    {onlineCollaborators.length} Live
                  </span>
                </div>

                <div className="space-y-1 my-1">
                  {(tree.collaborators || []).map((collab) => (
                    <button
                      key={collab.id}
                      onClick={() => {
                        onSwitchCollaborator(collab);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center gap-2.5 transition-colors ${
                        collab.id === currentCollaborator.id
                          ? 'bg-amber-600/20 text-amber-200 border border-amber-500/30'
                          : 'text-stone-300 hover:bg-stone-700/60'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={collab.avatar}
                          alt={collab.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        {collab.isOnline && (
                          <span className="w-2 h-2 bg-emerald-500 rounded-full border border-stone-800 absolute bottom-0 right-0" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{collab.name}</p>
                        <p className="text-[10px] text-stone-400 capitalize">
                          {collab.role} • {collab.isOnline ? 'Online now' : collab.lastActive}
                        </p>
                      </div>
                      {collab.id === currentCollaborator.id && (
                        <span className="text-[10px] text-amber-400 font-semibold px-1.5 py-0.5 bg-amber-500/10 rounded">
                          You
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-stone-700 pt-2 mt-1">
                  <button
                    onClick={() => {
                      onOpenCollaboration();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-center px-3 py-2 bg-stone-700/80 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Manage Family Contributors & Audit Log</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Secondary Mode Navigation Tab Bar */}
      <div className="bg-stone-950/80 border-t border-stone-800/80 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1 sm:gap-2">
            
            <button
              onClick={() => onViewChange('tree')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                currentView === 'tree'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Interactive Tree Builder</span>
            </button>

            <button
              onClick={() => onViewChange('ancestor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                currentView === 'ancestor'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pedigree (Ancestors)</span>
            </button>

            <button
              onClick={() => onViewChange('descendant')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                currentView === 'descendant'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Descendants Branch</span>
            </button>

            <button
              onClick={() => onViewChange('fan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                currentView === 'fan'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <span className="text-xs">🪭</span>
              <span>Generational Fan Chart</span>
            </button>

            <button
              onClick={() => onViewChange('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                currentView === 'timeline'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Historic Lifespan Timeline</span>
            </button>

            <button
              onClick={() => onViewChange('gallery')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                currentView === 'gallery'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photo Archive & Documents</span>
            </button>

            <button
              onClick={() => onViewChange('collaboration')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                currentView === 'collaboration'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Collaborative Hub & Audit</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-[11px] text-stone-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Auto-saved
            </span>
            <span>•</span>
            <span className="text-stone-400 font-mono text-[10px]">
              ID: {tree.shareCode}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
