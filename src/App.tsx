import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { TreeCanvas } from './components/TreeCanvas';
import { AncestorChart } from './components/AncestorChart';
import { DescendantChart } from './components/DescendantChart';
import { FanChart } from './components/FanChart';
import { TimelineView } from './components/TimelineView';
import { PersonDetailModal } from './components/PersonDetailModal';
import { AddMemberModal } from './components/AddMemberModal';
import { ImportExportModal } from './components/ImportExportModal';
import { MediaGalleryModal } from './components/MediaGalleryModal';
import { CollaborationDrawer } from './components/CollaborationDrawer';
import { ThemeModal } from './components/ThemeModal';
import { SAMPLE_TREES, DEFAULT_COLLABORATORS } from './data/sampleTrees';
import { FamilyTree, Person, Collaborator, MediaAttachment, ViewMode, TreeTheme } from './types';
import { getThemeConfig } from './utils/theme';
import { Plus, Users, Sparkles, FolderDown, Camera, HelpCircle, Shield, CheckCircle2 } from 'lucide-react';

export function App() {
  // All trees in local session / repository
  const [allTreesList, setAllTreesList] = useState<FamilyTree[]>(() => {
    const saved = localStorage.getItem('all_family_trees');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return SAMPLE_TREES;
  });

  // Main State
  const [currentTree, setCurrentTree] = useState<FamilyTree>(() => {
    const saved = localStorage.getItem('family_tree_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return SAMPLE_TREES[0];
  });

  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | undefined>(
    currentTree.rootPersonId || Object.keys(currentTree.members || {})[0]
  );

  // Collaborator State
  const [currentCollaborator, setCurrentCollaborator] = useState<Collaborator>(
    currentTree.collaborators?.[0] || DEFAULT_COLLABORATORS[0]
  );

  // Modal Open States
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [personModalInitialTab, setPersonModalInitialTab] = useState<
    'vitals' | 'relations' | 'photos' | 'ai-story' | 'interview' | 'comments'
  >('vitals');

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [addMemberTargetId, setAddMemberTargetId] = useState<string | undefined>();
  const [addMemberRelType, setAddMemberRelType] = useState<
    'child' | 'parent' | 'spouse' | 'root' | undefined
  >('child');

  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCollabDrawerOpen, setIsCollabDrawerOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Debounced Save to LocalStorage & cross-tree sync
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('family_tree_data', JSON.stringify(currentTree));
        setAllTreesList((prevList) => {
          const exists = prevList.some((t) => t.id === currentTree.id);
          const updatedList = exists
            ? prevList.map((t) => (t.id === currentTree.id ? currentTree : t))
            : [currentTree, ...prevList];
          localStorage.setItem('all_family_trees', JSON.stringify(updatedList));
          return updatedList;
        });
      } catch (err) {
        console.error('Failed to persist tree data:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentTree]);

  // Sync viewing persona without redundant re-renders
  useEffect(() => {
    if (selectedPersonId && currentCollaborator) {
      setCurrentTree((prev) => {
        const collab = (prev.collaborators || []).find((c) => c.id === currentCollaborator.id);
        if (collab && collab.currentViewingPersonId === selectedPersonId) {
          return prev;
        }
        return {
          ...prev,
          collaborators: (prev.collaborators || []).map((c) =>
            c.id === currentCollaborator.id
              ? { ...c, currentViewingPersonId: selectedPersonId }
              : c
          ),
        };
      });
    }
  }, [selectedPersonId, currentCollaborator.id]);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#d97706', '#b45309', '#10b981', '#f59e0b', '#059669'],
      });
    } catch {}
  };

  // Log Activity Helper
  const logActivity = (action: string, details: string) => {
    const newLog = {
      id: `log_${Date.now()}`,
      collaboratorId: currentCollaborator.id,
      collaboratorName: currentCollaborator.name,
      collaboratorColor: currentCollaborator.color,
      action: action as any,
      details,
      timestamp: 'Just now',
    };

    setCurrentTree((prev) => ({
      ...prev,
      activityLogs: [newLog, ...(prev.activityLogs || []).slice(0, 40)],
      updatedAt: new Date().toISOString(),
    }));
  };

  // Person Select handler - highlights person on canvas without opening modal
  const handleSelectPerson = (personId: string) => {
    setSelectedPersonId(personId);
  };

  // Open Full Info / Edit Modal handler
  const handleOpenEditPerson = (
    personId: string,
    initialTab: 'vitals' | 'media' | 'notes' | 'ai-story' = 'vitals'
  ) => {
    setSelectedPersonId(personId);
    setPersonModalInitialTab(initialTab);
    setIsPersonModalOpen(true);
  };

  // Open Story handler
  const handleOpenStory = (personId: string) => {
    setSelectedPersonId(personId);
    setPersonModalInitialTab('ai-story');
    setIsPersonModalOpen(true);
  };

  // Add Relative Trigger
  const handleOpenAddRelative = (
    targetPersonId?: string,
    relationshipType?: 'child' | 'parent' | 'spouse' | 'root'
  ) => {
    setAddMemberTargetId(targetPersonId);
    setAddMemberRelType(relationshipType || 'child');
    setIsAddMemberModalOpen(true);
  };

  // Add Member Submission & Bidirectional linking
  const handleAddMember = (
    newPerson: Person,
    relType?: 'child' | 'parent' | 'spouse' | 'root',
    targetId?: string
  ) => {
    setCurrentTree((prev) => {
      const updatedMembers = { ...prev.members, [newPerson.id]: newPerson };
      const targetPerson = targetId ? updatedMembers[targetId] : null;

      if (targetPerson) {
        if (relType === 'child') {
          // Add target person as parent of newPerson
          newPerson.parentIds = Array.from(new Set([...(newPerson.parentIds || []), targetPerson.id]));
          // If target has a spouse, link spouse as second parent
          if (targetPerson.spouseIds && targetPerson.spouseIds.length > 0) {
            newPerson.parentIds = Array.from(new Set([...newPerson.parentIds, targetPerson.spouseIds[0]]));
            const spouse = updatedMembers[targetPerson.spouseIds[0]];
            if (spouse) {
              spouse.childIds = Array.from(new Set([...(spouse.childIds || []), newPerson.id]));
            }
          }
          // Add newPerson as child of target
          targetPerson.childIds = Array.from(new Set([...(targetPerson.childIds || []), newPerson.id]));
        } else if (relType === 'parent') {
          // Add newPerson as parent of target
          targetPerson.parentIds = Array.from(new Set([...(targetPerson.parentIds || []), newPerson.id]));
          // Add target as child of newPerson
          newPerson.childIds = Array.from(new Set([...(newPerson.childIds || []), targetPerson.id]));
        } else if (relType === 'spouse') {
          // Link spouses bidirectionally
          targetPerson.spouseIds = Array.from(new Set([...(targetPerson.spouseIds || []), newPerson.id]));
          newPerson.spouseIds = Array.from(new Set([...(newPerson.spouseIds || []), targetPerson.id]));
        }
      }

      return {
        ...prev,
        members: updatedMembers,
        updatedAt: new Date().toISOString(),
      };
    });

    logActivity(
      'add_person',
      `${currentCollaborator.name} added ${newPerson.firstName} ${newPerson.lastName} to the lineage tree.`
    );
    showToast(`Added ${newPerson.firstName} ${newPerson.lastName} to family tree!`);
    triggerConfetti();
    setSelectedPersonId(newPerson.id);
  };

  // Update Person Records
  const handleUpdatePerson = (updatedPerson: Person, logMessage?: string) => {
    setCurrentTree((prev) => ({
      ...prev,
      members: {
        ...prev.members,
        [updatedPerson.id]: updatedPerson,
      },
      updatedAt: new Date().toISOString(),
    }));

    logActivity(
      'edit_person',
      logMessage || `${currentCollaborator.name} updated records for ${updatedPerson.firstName} ${updatedPerson.lastName}.`
    );
    showToast(`Saved records for ${updatedPerson.firstName} ${updatedPerson.lastName}`);
  };

  // Delete Person
  const handleDeletePerson = (personId: string) => {
    const personToDelete = currentTree.members[personId];
    if (!personToDelete) return;

    setCurrentTree((prev) => {
      const updatedMembers = { ...prev.members };
      delete updatedMembers[personId];

      // Remove references from other members
      (Object.values(updatedMembers) as Person[]).forEach((p) => {
        p.parentIds = (p.parentIds || []).filter((id) => id !== personId);
        p.spouseIds = (p.spouseIds || []).filter((id) => id !== personId);
        p.childIds = (p.childIds || []).filter((id) => id !== personId);
      });

      return {
        ...prev,
        members: updatedMembers,
        rootPersonId:
          prev.rootPersonId === personId
            ? Object.keys(updatedMembers)[0] || ''
            : prev.rootPersonId,
        updatedAt: new Date().toISOString(),
      };
    });

    logActivity(
      'edit_person',
      `${currentCollaborator.name} removed ${personToDelete.firstName} ${personToDelete.lastName} from tree.`
    );
    showToast(`Removed relative from tree`);
  };

  // Upload Media
  const handleUploadMedia = (mediaItem: Partial<MediaAttachment>) => {
    const newMedia: MediaAttachment = {
      id: `media_${Date.now()}`,
      url: mediaItem.url || '',
      title: mediaItem.title || 'Archival Photograph',
      caption: mediaItem.caption,
      year: mediaItem.year,
      taggedPersonIds: mediaItem.taggedPersonIds || [],
      uploadedBy: currentCollaborator.name,
      uploadedAt: new Date().toISOString(),
    };

    setCurrentTree((prev) => {
      const updatedMembers = { ...prev.members };

      // Tag to person if specified
      (newMedia.taggedPersonIds || []).forEach((pid) => {
        if (updatedMembers[pid]) {
          updatedMembers[pid] = {
            ...updatedMembers[pid],
            photos: [newMedia, ...(updatedMembers[pid].photos || [])],
          };
        }
      });

      return {
        ...prev,
        members: updatedMembers,
        mediaGallery: [newMedia, ...(prev.mediaGallery || [])],
        updatedAt: new Date().toISOString(),
      };
    });

    logActivity('upload_photo', `${currentCollaborator.name} uploaded photo "${newMedia.title}".`);
    showToast(`Uploaded photo "${newMedia.title}" to gallery!`);
    triggerConfetti();
  };

  // Add Comment / Oral Story Note
  const handleAddComment = (personId: string, text: string) => {
    const person = currentTree.members[personId];
    const newComment = {
      id: `c_${Date.now()}`,
      personId,
      author: currentCollaborator.name,
      authorColor: currentCollaborator.color,
      avatar: currentCollaborator.avatar,
      text,
      timestamp: 'Just now',
    };

    setCurrentTree((prev) => ({
      ...prev,
      comments: [newComment, ...(prev.comments || [])],
      updatedAt: new Date().toISOString(),
    }));

    logActivity(
      'add_comment',
      `${currentCollaborator.name} added a memory note on ${person ? `${person.firstName} ${person.lastName}` : 'relative'}.`
    );
    showToast(`Posted memory note!`);
  };

  // Import Tree handler
  const handleImportTree = (importedTree: FamilyTree, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setCurrentTree(importedTree);
      setSelectedPersonId(importedTree.rootPersonId || Object.keys(importedTree.members || {})[0]);
    } else {
      // Merge members
      setCurrentTree((prev) => ({
        ...prev,
        members: {
          ...prev.members,
          ...importedTree.members,
        },
        mediaGallery: [...(prev.mediaGallery || []), ...(importedTree.mediaGallery || [])],
        updatedAt: new Date().toISOString(),
      }));
    }

    logActivity(
      'import_gedcom',
      `${currentCollaborator.name} imported ${Object.keys(importedTree.members || {}).length} relatives (${mode} mode).`
    );
    triggerConfetti();
    showToast(`Successfully loaded ${Object.keys(importedTree.members || {}).length} relatives!`);
  };

  // Switch Active Collaborator Persona
  const handleSwitchCollaborator = (collab: Collaborator) => {
    setCurrentCollaborator(collab);
    showToast(`Now editing as ${collab.name} (${collab.role})`);
  };

  // Add Direct Collaborator
  const handleAddCollaborator = (name: string, email: string, role: Collaborator['role']) => {
    const colors = ['#d97706', '#e11d48', '#2563eb', '#059669', '#7c3aed', '#ea580c'];
    const newCollab: Collaborator = {
      id: `collab_${Date.now()}`,
      name,
      email,
      role,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      color: colors[Math.floor(Math.random() * colors.length)],
      lastActive: 'Just now',
      isOnline: true,
    };

    setCurrentTree((prev) => ({
      ...prev,
      collaborators: [...(prev.collaborators || []), newCollab],
    }));

    logActivity('edit_person', `Added ${name} as family ${role}.`);
    showToast(`Added ${name} to family collaboration list`);
  };

  // Change Visual Canvas Theme
  const handleChangeTheme = (theme: TreeTheme) => {
    setCurrentTree((prev) => ({ ...prev, theme }));
    showToast(`Applied ${theme.replace('-', ' ')} aesthetic theme`);
  };

  // Create new blank tree
  const handleCreateNewTree = () => {
    const newTreeId = `tree_${Date.now()}`;
    const newTreeObj: FamilyTree = {
      id: newTreeId,
      name: 'New Family Lineage',
      description: 'A new blank family heritage tree ready for oral histories and records.',
      rootPersonId: '',
      members: {},
      relationships: [],
      media: [],
      mediaGallery: [],
      collaborators: [currentCollaborator],
      activityLogs: [
        {
          id: `log_${Date.now()}`,
          collaboratorName: currentCollaborator.name,
          collaboratorColor: currentCollaborator.color,
          action: 'added_person',
          details: `${currentCollaborator.name} created a new family tree.`,
          timestamp: 'Just now',
        },
      ],
      comments: [],
      theme: 'parchment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shareCode: `FAM-${newTreeId.slice(-4).toUpperCase()}`,
    };

    setAllTreesList((prev) => [newTreeObj, ...prev]);
    setCurrentTree(newTreeObj);
    setSelectedPersonId(undefined);
    showToast('Created new blank family tree!');
  };

  // Switch Selected Tree
  const handleSelectTree = (treeId: string) => {
    const found = allTreesList.find((t) => t.id === treeId);
    if (found) {
      setCurrentTree(found);
      setSelectedPersonId(found.rootPersonId || Object.keys(found.members || {})[0]);
      showToast(`Switched to "${found.name}"`);
    }
  };

  const selectedPerson = selectedPersonId ? currentTree.members[selectedPersonId] : undefined;
  const memberCount = useMemo(() => Object.keys(currentTree.members || {}).length, [currentTree.members]);

  const treeSummaries = useMemo(
    () =>
      allTreesList.map((t) => ({
        id: t.id,
        name: t.name,
        memberCount: Object.keys(t.members || {}).length,
        updatedAt: t.updatedAt || t.createdAt,
      })),
    [allTreesList]
  );

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col selection:bg-amber-200 selection:text-amber-950">
      
      {/* Top Main Navigation */}
      <Navbar
        tree={currentTree}
        allTrees={treeSummaries}
        currentView={viewMode}
        onViewChange={setViewMode}
        onSelectTree={handleSelectTree}
        onCreateTree={handleCreateNewTree}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenAddMember={() => handleOpenAddRelative(undefined, 'root')}
        onOpenMediaGallery={() => setIsGalleryOpen(true)}
        onOpenCollaboration={() => setIsCollabDrawerOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onThemeChange={handleChangeTheme}
        currentCollaborator={currentCollaborator}
        onSwitchCollaborator={handleSwitchCollaborator}
        onSearchPerson={setSearchQuery}
        searchQuery={searchQuery}
        onSelectPerson={handleSelectPerson}
      />

      {/* Main Interactive Stage Body */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        
        {memberCount === 0 ? (
          /* Empty State */
          <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center ${getThemeConfig(currentTree.theme).canvasBgClass}`}>
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 shadow-md border border-amber-200">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="font-display font-bold text-2xl text-stone-900 mb-2">
              Begin Your Family Heritage Tree
            </h2>
            <p className="text-sm text-stone-600 max-w-md mb-6 leading-relaxed">
              Import existing genealogy records via GEDCOM or CSV, reconstruct an oral history with AI, or manually add your first ancestor.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleOpenAddRelative(undefined, 'root')}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Relative</span>
              </button>

              <button
                onClick={() => setIsImportExportOpen(true)}
                className="px-5 py-2.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all"
              >
                <FolderDown className="w-4 h-4 text-amber-700" />
                <span>Import GEDCOM / Presets</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active View Mode Screen */
          <div className="flex-1 w-full h-full">
            {viewMode === 'tree' && (
              <TreeCanvas
                tree={currentTree}
                selectedPersonId={selectedPersonId}
                onSelectPerson={handleSelectPerson}
                onOpenEditPerson={handleOpenEditPerson}
                onAddRelative={handleOpenAddRelative}
                onOpenStory={handleOpenStory}
                searchQuery={searchQuery}
                currentCollaborator={currentCollaborator}
              />
            )}

            {viewMode === 'ancestor' && (
              <div className={`w-full h-full overflow-auto ${getThemeConfig(currentTree.theme).canvasBgClass}`}>
                <AncestorChart
                  tree={currentTree}
                  selectedPersonId={selectedPersonId}
                  onSelectPerson={handleSelectPerson}
                  onOpenEditPerson={handleOpenEditPerson}
                  onOpenStory={handleOpenStory}
                />
              </div>
            )}

            {viewMode === 'descendant' && (
              <div className={`w-full h-full overflow-auto ${getThemeConfig(currentTree.theme).canvasBgClass}`}>
                <DescendantChart
                  tree={currentTree}
                  selectedPersonId={selectedPersonId}
                  onSelectPerson={handleSelectPerson}
                  onOpenEditPerson={handleOpenEditPerson}
                  onAddRelative={(targetId, type) => handleOpenAddRelative(targetId, type)}
                  onOpenStory={handleOpenStory}
                />
              </div>
            )}

            {viewMode === 'fan' && (
              <div className={`w-full h-full overflow-auto ${getThemeConfig(currentTree.theme).canvasBgClass}`}>
                <FanChart
                  tree={currentTree}
                  selectedPersonId={selectedPersonId}
                  onSelectPerson={handleSelectPerson}
                  onOpenEditPerson={handleOpenEditPerson}
                  onOpenStory={handleOpenStory}
                />
              </div>
            )}

            {viewMode === 'timeline' && (
              <div className={`w-full h-full overflow-auto ${getThemeConfig(currentTree.theme).canvasBgClass}`}>
                <TimelineView
                  tree={currentTree}
                  onSelectPerson={handleSelectPerson}
                  onOpenEditPerson={handleOpenEditPerson}
                  onOpenStory={handleOpenStory}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Pill on Mobile & Desktop */}
      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-2">
        <button
          onClick={() => handleOpenAddRelative(selectedPersonId, 'child')}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-2xl text-xs font-bold shadow-xl flex items-center gap-2 border border-amber-400/40 hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Relative</span>
        </button>

        <button
          onClick={() => setIsCollabDrawerOpen(true)}
          className="p-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl shadow-xl border border-stone-700 relative hover:scale-105 transition-all"
          title="Open Collaboration Hub"
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-stone-900" />
        </button>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-stone-900/95 text-stone-100 text-xs px-4 py-2.5 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Person Detail & Record Editing Modal */}
      {isPersonModalOpen && selectedPerson && (
        <PersonDetailModal
          person={selectedPerson}
          tree={currentTree}
          initialTab={personModalInitialTab}
          onClose={() => setIsPersonModalOpen(false)}
          onUpdatePerson={handleUpdatePerson}
          onDeletePerson={handleDeletePerson}
          onAddRelative={(targetId, relType) => {
            setIsPersonModalOpen(false);
            handleOpenAddRelative(targetId, relType);
          }}
          onSelectPerson={(newId) => {
            setSelectedPersonId(newId);
          }}
          currentCollaborator={currentCollaborator}
          onUploadMedia={handleUploadMedia}
          onAddComment={handleAddComment}
        />
      )}

      {/* Quick Add Member Wizard Modal */}
      {isAddMemberModalOpen && (
        <AddMemberModal
          tree={currentTree}
          targetPersonId={addMemberTargetId}
          defaultRelationshipType={addMemberRelType}
          onClose={() => setIsAddMemberModalOpen(false)}
          onAddMember={handleAddMember}
        />
      )}

      {/* Import & Export Modal (GEDCOM / CSV / AI Extractor / Presets) */}
      {isImportExportOpen && (
        <ImportExportModal
          currentTree={currentTree}
          onClose={() => setIsImportExportOpen(false)}
          onImportTree={handleImportTree}
        />
      )}

      {/* Archival Media Gallery & Photo Upload Modal */}
      {isGalleryOpen && (
        <MediaGalleryModal
          tree={currentTree}
          onClose={() => setIsGalleryOpen(false)}
          onUploadMedia={handleUploadMedia}
          onSelectPerson={handleSelectPerson}
          currentCollaborator={currentCollaborator}
        />
      )}

      {/* Multi-member Collaboration & Activity Audit Trail Drawer */}
      <CollaborationDrawer
        tree={currentTree}
        isOpen={isCollabDrawerOpen}
        onClose={() => setIsCollabDrawerOpen(false)}
        currentCollaborator={currentCollaborator}
        onSwitchCollaborator={handleSwitchCollaborator}
        onAddCollaborator={handleAddCollaborator}
      />

      {/* Visual Lineage Theme Selector Modal */}
      <ThemeModal
        tree={currentTree}
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        onSelectTheme={handleChangeTheme}
      />

    </div>
  );
}
export default App;
