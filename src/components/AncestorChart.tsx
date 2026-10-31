import React, { useState } from 'react';
import { Person, FamilyTree } from '../types';
import { getThemeConfig } from '../utils/theme';
import { ChevronRight, User, Calendar, MapPin, Sparkles, Printer, Info } from 'lucide-react';

interface AncestorChartProps {
  tree: FamilyTree;
  selectedPersonId?: string;
  onSelectPerson: (personId: string) => void;
  onOpenEditPerson?: (personId: string) => void;
  onOpenStory: (personId: string) => void;
}

export const AncestorChart: React.FC<AncestorChartProps> = ({
  tree,
  selectedPersonId,
  onSelectPerson,
  onOpenEditPerson,
  onOpenStory,
}) => {
  const members = tree.members || {};
  const [focalId, setFocalId] = useState<string>(
    selectedPersonId || tree.rootPersonId || Object.keys(members)[0] || ''
  );

  const focalPerson = members[focalId] || Object.values(members)[0];

  if (!focalPerson) {
    return (
      <div className="p-12 text-center text-stone-500">
        No individuals found in this tree. Add your first family member to begin.
      </div>
    );
  }

  // Build pedigree levels up to 4 generations
  // Gen 0: Focal
  // Gen 1: Parents (Father, Mother)
  // Gen 2: Grandparents (Paternal Grandfather, Paternal Grandmother, Maternal Grandfather, Maternal Grandmother)
  // Gen 3: Great-grandparents (8 slots)

  const getParents = (p?: Person): { father?: Person; mother?: Person } => {
    if (!p || !p.parentIds) return {};
    const p1 = members[p.parentIds[0]];
    const p2 = members[p.parentIds[1]];

    let father: Person | undefined;
    let mother: Person | undefined;

    if (p1?.gender === 'male') father = p1;
    else if (p1?.gender === 'female') mother = p1;

    if (p2?.gender === 'male') father = p2;
    else if (p2?.gender === 'female') mother = p2;

    // Fallback if genders unrecorded
    if (!father && !mother) {
      father = p1;
      mother = p2;
    }

    return { father, mother };
  };

  const themeConfig = getThemeConfig(tree.theme);

  const gen1 = getParents(focalPerson);
  const gen2_pat = getParents(gen1.father);
  const gen2_mat = getParents(gen1.mother);

  const gen3_pat_gf = getParents(gen2_pat.father);
  const gen3_pat_gm = getParents(gen2_pat.mother);
  const gen3_mat_gf = getParents(gen2_mat.father);
  const gen3_mat_gm = getParents(gen2_mat.mother);

  const renderPersonCard = (
    person?: Person,
    label?: string,
    widthClass = 'w-64',
    compact = false
  ) => {
    if (!person) {
      return (
        <div
          className={`${widthClass} h-20 rounded-xl border border-dashed border-stone-300/60 bg-stone-50/30 flex flex-col items-center justify-center p-2 text-stone-400 text-xs backdrop-blur-xs`}
        >
          <span className="font-medium text-[11px] text-stone-400">{label || 'Unknown Ancestor'}</span>
          <span className="text-[10px] text-stone-400/70">Not yet recorded</span>
        </div>
      );
    }

    const isFocal = person.id === focalId;

    return (
      <div
        onClick={() => onSelectPerson(person.id)}
        className={`${widthClass} group rounded-xl border transition-all duration-200 cursor-pointer p-3 ${themeConfig.cardBgClass} ${themeConfig.cardBorderClass} ${themeConfig.cardShadowClass} ${
          isFocal
            ? 'ring-2 ring-amber-500 scale-[1.02]'
            : 'hover:scale-[1.01] hover:border-amber-400/80'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-300 bg-stone-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-stone-700">
            {person.avatarUrl ? (
              <img src={person.avatarUrl} alt={person.firstName} className="w-full h-full object-cover" />
            ) : (
              `${person.firstName[0]}${person.lastName ? person.lastName[0] : ''}`
            )}
          </div>
          <div className="min-w-0 flex-1">
            {label && (
              <p className={`text-[10px] uppercase font-bold tracking-wider -mb-0.5 ${themeConfig.accentPrimaryClass}`}>
                {label}
              </p>
            )}
            <div className="flex items-center justify-between gap-1">
              <h4 className={`font-display font-bold text-xs truncate ${themeConfig.textPrimaryClass}`}>
                {person.firstName} {person.lastName}
              </h4>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenEditPerson) {
                    onOpenEditPerson(person.id);
                  } else {
                    onSelectPerson(person.id);
                  }
                }}
                className="p-1 -mr-1 rounded-full text-stone-400 hover:text-amber-700 hover:bg-stone-200/70 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                title="View & Edit Details"
              >
                <Info className="w-3 h-3" />
              </button>
            </div>
            <p className={`text-[11px] flex items-center gap-1 mt-0.5 ${themeConfig.textSecondaryClass}`}>
              <Calendar className="w-3 h-3 text-amber-500 flex-shrink-0" />
              <span>
                {person.birthDate ? person.birthDate.split('-')[0] : '—'} –{' '}
                {person.isLiving ? 'Living' : person.deathDate ? person.deathDate.split('-')[0] : '—'}
              </span>
            </p>
          </div>
        </div>

        {!compact && person.birthPlace && (
          <p className={`text-[10px] flex items-center gap-1 mt-2 pt-1.5 border-t border-stone-200/40 truncate ${themeConfig.textMutedClass}`}>
            <MapPin className="w-2.5 h-2.5 opacity-70" />
            <span className="truncate">{person.birthPlace}</span>
          </p>
        )}

        <div className="mt-1 flex items-center justify-between">
          {person.id !== focalId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFocalId(person.id);
              }}
              className={`text-[10px] font-semibold flex items-center gap-0.5 ${themeConfig.accentPrimaryClass} hover:underline`}
            >
              <span>Make Focal</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          {person.bio && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenStory(person.id);
              }}
              className={`text-[10px] ml-auto flex items-center gap-0.5 ${themeConfig.textMutedClass} hover:text-stone-900`}
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
              <span>Story</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full min-h-[calc(100vh-104px)] p-4 sm:p-6 overflow-x-auto ${themeConfig.canvasBgClass}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-stone-900/80 backdrop-blur-md p-4 rounded-2xl shadow-xs border border-stone-800 text-stone-100">
          <div>
            <h2 className="font-display font-bold text-xl text-amber-100">
              Pedigree Ancestor Chart
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Direct 4-generation lineage tree for{' '}
              <span className="font-semibold text-amber-300">
                {focalPerson.firstName} {focalPerson.lastName}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={focalId}
              onChange={(e) => setFocalId(e.target.value)}
              className="px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs font-medium text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {(Object.values(members) as Person[]).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} {m.birthDate ? `(${m.birthDate.split('-')[0]})` : ''}
                </option>
              ))}
            </select>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-stone-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Chart</span>
            </button>
          </div>
        </div>

        {/* Interactive Pedigree Chart Grid */}
        <div className="min-w-[1100px] flex items-center gap-10 py-6">
          
          {/* Generation 0: Focal Person */}
          <div className="flex flex-col justify-center">
            <div className="text-center mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-900/60 border border-amber-700/50 px-2 py-0.5 rounded-full">
                Focal Individual (Gen 1)
              </span>
            </div>
            {renderPersonCard(focalPerson, 'Focal Individual', 'w-64')}
          </div>

          {/* Column Divider Lines */}
          <div 
            className="w-6 h-64 border-r-2 border-t-2 border-b-2 rounded-r-2xl" 
            style={{ borderColor: themeConfig.parentLineColor }}
          />

          {/* Generation 1: Parents (Father & Mother) */}
          <div className="flex flex-col justify-around h-[500px] gap-8">
            <div className="flex flex-col justify-center">
              <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${themeConfig.textMutedClass}`}>Father</span>
              {renderPersonCard(gen1.father, 'Father', 'w-60')}
            </div>

            <div className="flex flex-col justify-center">
              <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${themeConfig.textMutedClass}`}>Mother</span>
              {renderPersonCard(gen1.mother, 'Mother', 'w-60')}
            </div>
          </div>

          {/* Column Divider Lines */}
          <div className="flex flex-col justify-around h-[540px]">
            <div 
              className="w-6 h-32 border-r-2 border-t-2 border-b-2 rounded-r-2xl" 
              style={{ borderColor: themeConfig.parentLineColor }}
            />
            <div 
              className="w-6 h-32 border-r-2 border-t-2 border-b-2 rounded-r-2xl" 
              style={{ borderColor: themeConfig.parentLineColor }}
            />
          </div>

          {/* Generation 2: Grandparents (4 slots) */}
          <div className="flex flex-col justify-between h-[600px] gap-4">
            <div>
              <span className={`text-[10px] font-semibold ${themeConfig.textMutedClass}`}>Paternal Grandfather</span>
              {renderPersonCard(gen2_pat.father, 'Paternal Grandfather', 'w-56', true)}
            </div>
            <div>
              <span className={`text-[10px] font-semibold ${themeConfig.textMutedClass}`}>Paternal Grandmother</span>
              {renderPersonCard(gen2_pat.mother, 'Paternal Grandmother', 'w-56', true)}
            </div>
            <div>
              <span className={`text-[10px] font-semibold ${themeConfig.textMutedClass}`}>Maternal Grandfather</span>
              {renderPersonCard(gen2_mat.father, 'Maternal Grandfather', 'w-56', true)}
            </div>
            <div>
              <span className={`text-[10px] font-semibold ${themeConfig.textMutedClass}`}>Maternal Grandmother</span>
              {renderPersonCard(gen2_mat.mother, 'Maternal Grandmother', 'w-56', true)}
            </div>
          </div>

          {/* Column Divider Lines */}
          <div className="flex flex-col justify-between h-[640px] py-4">
            <div 
              className="w-4 h-16 border-r border-t border-b rounded-r-lg" 
              style={{ borderColor: themeConfig.parentLineColor, opacity: 0.6 }}
            />
            <div 
              className="w-4 h-16 border-r border-t border-b rounded-r-lg" 
              style={{ borderColor: themeConfig.parentLineColor, opacity: 0.6 }}
            />
            <div 
              className="w-4 h-16 border-r border-t border-b rounded-r-lg" 
              style={{ borderColor: themeConfig.parentLineColor, opacity: 0.6 }}
            />
            <div 
              className="w-4 h-16 border-r border-t border-b rounded-r-lg" 
              style={{ borderColor: themeConfig.parentLineColor, opacity: 0.6 }}
            />
          </div>

          {/* Generation 3: Great Grandparents (8 slots) */}
          <div className="flex flex-col justify-between h-[720px] gap-2">
            {renderPersonCard(gen3_pat_gf.father, '2x Gr-Grandfather', 'w-48', true)}
            {renderPersonCard(gen3_pat_gf.mother, '2x Gr-Grandmother', 'w-48', true)}
            {renderPersonCard(gen3_pat_gm.father, '2x Gr-Grandfather', 'w-48', true)}
            {renderPersonCard(gen3_pat_gm.mother, '2x Gr-Grandmother', 'w-48', true)}
            {renderPersonCard(gen3_mat_gf.father, '2x Gr-Grandfather', 'w-48', true)}
            {renderPersonCard(gen3_mat_gf.mother, '2x Gr-Grandmother', 'w-48', true)}
            {renderPersonCard(gen3_mat_gm.father, '2x Gr-Grandfather', 'w-48', true)}
            {renderPersonCard(gen3_mat_gm.mother, '2x Gr-Grandmother', 'w-48', true)}
          </div>

        </div>
      </div>
    </div>
  );
};
