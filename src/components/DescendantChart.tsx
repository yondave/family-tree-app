import React, { useState } from 'react';
import { Person, FamilyTree } from '../types';
import { ChevronDown, ChevronRight, User, Users, Calendar, MapPin, Sparkles, UserPlus } from 'lucide-react';

interface DescendantChartProps {
  tree: FamilyTree;
  selectedPersonId?: string;
  onSelectPerson: (personId: string) => void;
  onAddRelative: (personId: string, type: 'child' | 'spouse') => void;
  onOpenStory: (personId: string) => void;
}

export const DescendantChart: React.FC<DescendantChartProps> = ({
  tree,
  selectedPersonId,
  onSelectPerson,
  onAddRelative,
  onOpenStory,
}) => {
  const members = tree.members || {};
  const [rootId, setRootId] = useState<string>(
    tree.rootPersonId || Object.keys(members)[0] || ''
  );
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const toggleCollapse = (id: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const rootPerson = members[rootId] || Object.values(members)[0];

  if (!rootPerson) {
    return (
      <div className="p-12 text-center text-stone-500">
        No individuals found in this tree.
      </div>
    );
  }

  // Recursive Branch Renderer
  const renderBranch = (personId: string, depth = 0): React.ReactNode => {
    const person = members[personId];
    if (!person) return null;

    const children = (person.childIds || []).map((cid) => members[cid]).filter(Boolean);
    const spouses = (person.spouseIds || []).map((sid) => members[sid]).filter(Boolean);
    const isCollapsed = collapsedNodes.has(personId);
    const hasChildren = children.length > 0;

    return (
      <div key={person.id} className="relative pl-6 sm:pl-8 my-3">
        {/* Branch Connecting lines */}
        {depth > 0 && (
          <>
            <div className="absolute left-0 top-6 w-6 sm:w-8 h-px bg-amber-600/40" />
            <div className="absolute left-0 top-0 bottom-0 w-px bg-amber-600/30" />
          </>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {/* Main Person Card */}
          <div
            onClick={() => onSelectPerson(person.id)}
            className={`p-3 rounded-2xl border transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md max-w-sm flex-1 sm:flex-none sm:min-w-[280px] ${
              person.id === selectedPersonId
                ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-400'
                : 'bg-white hover:bg-amber-50/40 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-300 bg-stone-100 flex-shrink-0 flex items-center justify-center font-bold text-xs">
                {person.avatarUrl ? (
                  <img src={person.avatarUrl} alt={person.firstName} className="w-full h-full object-cover" />
                ) : (
                  `${person.firstName[0]}${person.lastName ? person.lastName[0] : ''}`
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-stone-900 truncate">
                    {person.firstName} {person.lastName}
                  </h4>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                    Gen {depth + 1}
                  </span>
                </div>
                <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-amber-700" />
                  <span>
                    {person.birthDate ? person.birthDate.split('-')[0] : '—'} –{' '}
                    {person.isLiving ? 'Living' : person.deathDate ? person.deathDate.split('-')[0] : '—'}
                  </span>
                </p>
                {person.occupation && (
                  <p className="text-[11px] text-stone-600 truncate mt-0.5">
                    {person.occupation}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddRelative(person.id, 'child');
                  }}
                  className="text-amber-700 hover:text-amber-900 font-medium flex items-center gap-0.5"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Child</span>
                </button>
              </div>

              {person.bio && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenStory(person.id);
                  }}
                  className="text-stone-500 hover:text-amber-800 flex items-center gap-0.5"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Bio</span>
                </button>
              )}
            </div>
          </div>

          {/* Spouse tags */}
          {spouses.map((spouse) => (
            <div
              key={spouse.id}
              onClick={() => onSelectPerson(spouse.id)}
              className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-stone-800 text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span className="text-rose-600 text-sm">💍</span>
              <div className="w-7 h-7 rounded-full overflow-hidden border border-rose-300 bg-white flex-shrink-0 flex items-center justify-center font-bold text-[10px]">
                {spouse.avatarUrl ? (
                  <img src={spouse.avatarUrl} alt={spouse.firstName} className="w-full h-full object-cover" />
                ) : (
                  `${spouse.firstName[0]}`
                )}
              </div>
              <div>
                <p className="font-semibold">{spouse.firstName} {spouse.lastName}</p>
                <p className="text-[10px] text-stone-500">Spouse</p>
              </div>
            </div>
          ))}

          {/* Collapse/Expand Sub-tree button */}
          {hasChildren && (
            <button
              onClick={() => toggleCollapse(person.id)}
              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
            >
              {isCollapsed ? (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
                  <span>{children.length} {children.length === 1 ? 'Child' : 'Children'}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-600" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Children Sub-branches */}
        {hasChildren && !isCollapsed && (
          <div className="mt-1">
            {children.map((child) => renderBranch(child.id, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-xs border border-stone-200">
        <div>
          <h2 className="font-display font-bold text-xl text-stone-900">
            Descendants Lineage Branch
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Full branching tree of children, grandchildren, and subsequent generations from{' '}
            <span className="font-semibold text-amber-800">
              {rootPerson.firstName} {rootPerson.lastName}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">Start from:</span>
          <select
            value={rootId}
            onChange={(e) => setRootId(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {(Object.values(members) as Person[]).map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName} {m.birthDate ? `(${m.birthDate.split('-')[0]})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Tree Container */}
      <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
        {renderBranch(rootPerson.id, 0)}
      </div>
    </div>
  );
};
