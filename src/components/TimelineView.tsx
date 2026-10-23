import React, { useState, useMemo } from 'react';
import { Person, FamilyTree } from '../types';
import { Calendar, Sparkles, MapPin, Filter } from 'lucide-react';

interface TimelineViewProps {
  tree: FamilyTree;
  onSelectPerson: (personId: string) => void;
  onOpenStory: (personId: string) => void;
}

interface HistoricalEra {
  name: string;
  start: number;
  end: number;
  color: string;
}

const HISTORICAL_ERAS: HistoricalEra[] = [
  { name: 'Belle Époque & WWI Era', start: 1890, end: 1918, color: 'bg-amber-950/10 border-amber-900/20' },
  { name: 'Interwar & Great Depression', start: 1919, end: 1938, color: 'bg-stone-900/10 border-stone-900/20' },
  { name: 'World War II & Post-War Rebuilding', start: 1939, end: 1955, color: 'bg-rose-950/10 border-rose-900/20' },
  { name: 'Space Age & Cultural Expansion', start: 1956, end: 1980, color: 'bg-sky-950/10 border-sky-900/20' },
  { name: 'Digital Dawn & Modern Millennium', start: 1981, end: 2026, color: 'bg-emerald-950/10 border-emerald-900/20' },
];

export const TimelineView: React.FC<TimelineViewProps> = ({
  tree,
  onSelectPerson,
  onOpenStory,
}) => {
  const members = (Object.values(tree.members || {}) as Person[]);
  const [filterLiving, setFilterLiving] = useState<'all' | 'living' | 'ancestors'>('all');

  // Compute timeline boundaries
  const { minYear, maxYear, timelineData } = useMemo(() => {
    let earliest = 1900;
    let latest = new Date().getFullYear();

    const data = members
      .map((p) => {
        let bYear = p.birthDate ? parseInt(p.birthDate.split('-')[0], 10) : null;
        let dYear = p.deathDate
          ? parseInt(p.deathDate.split('-')[0], 10)
          : p.isLiving
          ? new Date().getFullYear()
          : null;

        if (bYear && bYear < earliest) earliest = bYear;
        if (dYear && dYear > latest) latest = dYear;

        return {
          person: p,
          birthYear: bYear || 1920,
          deathYear: dYear || (bYear ? bYear + 70 : 1990),
          hasExactBirth: !!bYear,
          hasExactDeath: !!p.deathDate || p.isLiving,
        };
      })
      .sort((a, b) => a.birthYear - b.birthYear);

    // Padding
    earliest = Math.floor(earliest / 10) * 10 - 10;
    latest = Math.ceil(latest / 10) * 10 + 5;

    return {
      minYear: earliest,
      maxYear: latest,
      timelineData: data,
    };
  }, [members]);

  const yearRange = maxYear - minYear;
  const getPercentPosition = (year: number) => {
    return Math.max(0, Math.min(100, ((year - minYear) / yearRange) * 100));
  };

  // Generate decade ruler markers
  const decades: number[] = [];
  for (let y = minYear; y <= maxYear; y += 10) {
    decades.push(y);
  }

  const filteredList = timelineData.filter((item) => {
    if (filterLiving === 'living') return item.person.isLiving;
    if (filterLiving === 'ancestors') return !item.person.isLiving;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-xs border border-stone-200">
        <div>
          <h2 className="font-display font-bold text-xl text-stone-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-700" />
            <span>Generational Lifespan Timeline</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Chronological life spans spanning {minYear} to {maxYear} against historical eras
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setFilterLiving('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterLiving === 'all' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600'
              }`}
            >
              All ({members.length})
            </button>
            <button
              onClick={() => setFilterLiving('ancestors')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterLiving === 'ancestors' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600'
              }`}
            >
              Ancestors
            </button>
            <button
              onClick={() => setFilterLiving('living')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterLiving === 'living' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600'
              }`}
            >
              Living
            </button>
          </div>
        </div>
      </div>

      {/* Main Timeline Card Container */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
        <div className="min-w-[900px] relative">
          
          {/* Historical Era Bands Top Layer */}
          <div className="h-7 w-full relative mb-4 flex border-b border-stone-200">
            {HISTORICAL_ERAS.map((era, i) => {
              if (era.end < minYear || era.start > maxYear) return null;
              const start = Math.max(era.start, minYear);
              const end = Math.min(era.end, maxYear);
              const leftPct = getPercentPosition(start);
              const widthPct = getPercentPosition(end) - leftPct;

              return (
                <div
                  key={i}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  className={`absolute top-0 bottom-0 ${era.color} border-l border-r rounded px-1.5 flex items-center justify-center overflow-hidden`}
                >
                  <span className="text-[10px] font-semibold text-stone-700 truncate">
                    {era.name} ({era.start}–{era.end})
                  </span>
                </div>
              );
            })}
          </div>

          {/* Timeline Decades Ruler Axis */}
          <div className="relative h-8 w-full border-b border-stone-300 select-none">
            {decades.map((dec) => {
              const pos = getPercentPosition(dec);
              return (
                <div
                  key={dec}
                  style={{ left: `${pos}%` }}
                  className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center"
                >
                  <span className="text-[11px] font-mono font-bold text-stone-500">{dec}</span>
                  <div className="w-px h-2.5 bg-stone-400 mt-0.5" />
                </div>
              );
            })}
          </div>

          {/* Vertical Grid Lines for Decades */}
          <div className="absolute top-15 bottom-0 left-0 right-0 pointer-events-none">
            {decades.map((dec) => {
              const pos = getPercentPosition(dec);
              return (
                <div
                  key={`grid-${dec}`}
                  style={{ left: `${pos}%` }}
                  className="absolute top-0 bottom-0 w-px bg-stone-100"
                />
              );
            })}
          </div>

          {/* Person Timeline Bars */}
          <div className="space-y-3.5 mt-4 pt-2">
            {filteredList.map(({ person, birthYear, deathYear }) => {
              const leftPct = getPercentPosition(birthYear);
              const widthPct = Math.max(getPercentPosition(deathYear) - leftPct, 4);
              const lifespanYears = deathYear - birthYear;

              return (
                <div
                  key={person.id}
                  onClick={() => onSelectPerson(person.id)}
                  className="relative group cursor-pointer hover:bg-stone-50/80 p-1.5 -mx-1.5 rounded-xl transition-colors"
                >
                  {/* Lifespan Span Bar */}
                  <div
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                    }}
                    className={`relative h-10 rounded-full flex items-center px-2.5 shadow-xs transition-all duration-150 group-hover:shadow-md border ${
                      person.gender === 'female'
                        ? 'bg-gradient-to-r from-rose-100 to-rose-200 border-rose-300 text-rose-950 group-hover:from-rose-200 group-hover:to-rose-300'
                        : person.gender === 'male'
                        ? 'bg-gradient-to-r from-sky-100 to-sky-200 border-sky-300 text-sky-950 group-hover:from-sky-200 group-hover:to-sky-300'
                        : 'bg-gradient-to-r from-amber-100 to-amber-200 border-amber-300 text-amber-950 group-hover:from-amber-200 group-hover:to-amber-300'
                    }`}
                  >
                    {/* Small avatar circle */}
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-white bg-white shadow-xs flex-shrink-0 flex items-center justify-center font-bold text-[10px] mr-2">
                      {person.avatarUrl ? (
                        <img src={person.avatarUrl} alt={person.firstName} className="w-full h-full object-cover" />
                      ) : (
                        `${person.firstName[0]}${person.lastName ? person.lastName[0] : ''}`
                      )}
                    </div>

                    <div className="truncate flex-1 flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-xs truncate">
                        {person.firstName} {person.lastName}
                      </span>
                      <span className="text-[10px] font-mono opacity-80 whitespace-nowrap">
                        {birthYear} – {person.isLiving ? 'Now' : deathYear} ({lifespanYears}y)
                      </span>
                    </div>

                    {/* Living green pulse dot */}
                    {person.isLiving && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white ml-1.5 flex-shrink-0 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};
