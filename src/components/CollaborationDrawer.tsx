import React, { useState } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  Copy, 
  Check, 
  Shield, 
  Clock, 
  Radio, 
  Eye, 
  Edit3, 
  Sparkles,
  Link,
  Share2
} from 'lucide-react';
import { FamilyTree, Collaborator, ActivityLog } from '../types';

interface CollaborationDrawerProps {
  tree: FamilyTree;
  isOpen: boolean;
  onClose: () => void;
  currentCollaborator: Collaborator;
  onSwitchCollaborator: (collaborator: Collaborator) => void;
  onAddCollaborator: (name: string, email: string, role: Collaborator['role']) => void;
}

export const CollaborationDrawer: React.FC<CollaborationDrawerProps> = ({
  tree,
  isOpen,
  onClose,
  currentCollaborator,
  onSwitchCollaborator,
  onAddCollaborator,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'activity' | 'invite'>('members');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // New Collaborator Form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Collaborator['role']>('editor');

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddCollaborator(newName.trim(), newEmail.trim(), newRole);
    setNewName('');
    setNewEmail('');
    setActiveTab('members');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`FAM-${tree.id.slice(-4).toUpperCase()}`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const collaborators = tree.collaborators || [];
  const activityLogs = tree.activityLogs || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-stone-200 flex flex-col animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-6 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-amber-100">
                  Family Collaboration Hub
                </h3>
                <p className="text-xs text-stone-400">
                  Multi-member live editing, presence & audit trail
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

          {/* Tab Navigation */}
          <div className="px-6 bg-stone-100/80 border-b border-stone-200 flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'members'
                  ? 'bg-white text-amber-900 shadow-xs border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Editors ({collaborators.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'activity'
                  ? 'bg-white text-amber-900 shadow-xs border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>

            <button
              onClick={() => setActiveTab('invite')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'invite'
                  ? 'bg-white text-amber-900 shadow-xs border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto flex-1 bg-stone-50/40 space-y-6">
            
            {/* TAB 1: Members & Live Switcher */}
            {activeTab === 'members' && (
              <div className="space-y-5">
                
                {/* Active Persona Banner */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Currently Editing As:
                  </span>
                  <div className="flex items-center gap-3 mt-2">
                    <img
                      src={currentCollaborator.avatar}
                      alt={currentCollaborator.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-stone-900">
                        {currentCollaborator.name}
                      </p>
                      <p className="text-[11px] text-stone-500 capitalize">
                        Role: {currentCollaborator.role} • <span className="text-emerald-700 font-semibold">Active Session</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* All Co-Editors List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-display font-bold text-xs text-stone-700 uppercase tracking-wider">
                      Family Members with Access
                    </h4>
                    <span className="text-[11px] text-stone-400">Click to switch persona</span>
                  </div>

                  <div className="space-y-2.5">
                    {collaborators.map((c) => {
                      const isCurrent = c.id === currentCollaborator.id;

                      return (
                        <div
                          key={c.id}
                          onClick={() => onSwitchCollaborator(c)}
                          className={`p-3 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                            isCurrent
                              ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400 shadow-xs'
                              : 'bg-white hover:bg-stone-50 border-stone-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={c.avatar}
                                alt={c.name}
                                className="w-9 h-9 rounded-full object-cover"
                              />
                              {c.isOnline && (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-stone-900 flex items-center gap-1.5">
                                <span>{c.name}</span>
                                {isCurrent && (
                                  <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                                    YOU
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-stone-500 capitalize">
                                {c.role} {c.email ? `• ${c.email}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: c.color }}
                              title="Cursor Color"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Role Permissions Legend */}
                <div className="p-4 bg-white rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-2">
                  <h5 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-700" />
                    <span>Permission Levels</span>
                  </h5>
                  <p className="text-[11px] leading-relaxed">
                    <strong>Owner / Admin:</strong> Full tree management, delete, import/export.
                    <br />
                    <strong>Editor:</strong> Add relatives, edit dates, upload photos & notes.
                    <br />
                    <strong>Historian:</strong> Record elder oral stories and AI biographies.
                  </p>
                </div>

              </div>
            )}

            {/* TAB 2: Activity Audit Trail */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-xs text-stone-700 uppercase tracking-wider">
                    Recent Collaborative Edits
                  </h4>
                  <span className="text-[11px] text-stone-400">{activityLogs.length} events logged</span>
                </div>

                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-start gap-3"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: log.collaboratorColor || '#d97706' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-xs text-stone-900 truncate">
                            {log.collaboratorName}
                          </span>
                          <span className="text-[10px] text-stone-400 whitespace-nowrap">
                            {log.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 mt-0.5 leading-snug">
                          {log.details}
                        </p>
                        <span className="inline-block mt-1 text-[9px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded capitalize">
                          {log.action.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}

                  {activityLogs.length === 0 && (
                    <div className="text-center py-8 text-stone-400 text-xs">
                      No edits logged yet. Every tree update is recorded in this feed.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Invite Family Members */}
            {activeTab === 'invite' && (
              <div className="space-y-5">
                
                {/* Invite Links / Access Codes */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                  <h4 className="font-display font-bold text-xs text-stone-800 uppercase tracking-wider">
                    Share Link with Family
                  </h4>
                  <p className="text-xs text-stone-500">
                    Anyone with this link or family access code can view and contribute photos and oral history records.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={window.location.href}
                      className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-700"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                    <span className="text-stone-500">Family Join PIN:</span>
                    <button
                      onClick={handleCopyCode}
                      className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1"
                    >
                      <span>FAM-{tree.id.slice(-4).toUpperCase()}</span>
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Add Direct Collaborator Form */}
                <form onSubmit={handleAddSubmit} className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
                  <h4 className="font-display font-bold text-xs text-stone-800 uppercase tracking-wider">
                    Register New Family Member Editor
                  </h4>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Aunt Rosemary Vance"
                      className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="rosemary@example.com"
                      className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Assigned Role
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as Collaborator['role'])}
                      className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="editor">Editor (Can add & edit records)</option>
                      <option value="admin">Admin / Genealogist (Full control)</option>
                      <option value="viewer">Viewer (Read-only guest)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Member to Collaboration List</span>
                  </button>
                </form>

              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};
