import React, { useState, useMemo } from 'react';
import { Person, FamilyTree } from '../types';
import { Sparkles, Calendar, MapPin, ZoomIn } from 'lucide-react';

interface FanChartProps {
  tree: FamilyTree;
  selectedPersonId?: string;
  onSelectPerson: (personId: string) => void;
  onOpenStory: (personId: string) => void;
}

interface FanSegment {
  person?: Person;
  generation: number;
  indexInGen: number;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  color: string;
  side: 'root' | 'paternal' | 'maternal';
  label?: string;
}

export const FanChart: React.FC<FanChartProps> = ({
  tree,
  selectedPersonId,
  onSelectPerson,
  onOpenStory,
}) => {
  const members = tree.members || {};
  const [focalId, setFocalId] = useState<string>(
    selectedPersonId || tree.rootPersonId || Object.keys(members)[0] || ''
  );
  const [hoveredSegment, setHoveredSegment] = useState<FanSegment | null>(null);

  const focalPerson = members[focalId] || Object.values(members)[0];

  // Colors for paternal vs maternal fan sectors
  const paternalColors = ['#f59e0b', '#d97706', '#b45309', '#78350f'];
  const maternalColors = ['#10b981', '#059669', '#047857', '#064e3b'];

  const segments = useMemo(() => {
    if (!focalPerson) return [];

    const result: FanSegment[] = [];
    const MAX_GEN = 4;
    const baseRadius = 70;
    const ringWidth = 80;

    // Helper to get parents
    const getParents = (p?: Person) => {
      if (!p || !p.parentIds) return [undefined, undefined];
      const p1 = members[p.parentIds[0]];
      const p2 = members[p.parentIds[1]];
      let father = p1?.gender === 'male' ? p1 : p2?.gender === 'male' ? p2 : p1;
      let mother = p1?.gender === 'female' ? p1 : p2?.gender === 'female' ? p2 : p2;
      return [father, mother];
    };

    // Build binary ancestor tree array
    // Index 1: Root
    // Left child: 2 * i (Father), Right child: 2 * i + 1 (Mother)
    const ancestorSlots: (Person | undefined)[] = new Array(32).fill(undefined);
    ancestorSlots[1] = focalPerson;

    for (let i = 1; i <= 7; i++) {
      const p = ancestorSlots[i];
      if (p) {
        const [f, m] = getParents(p);
        ancestorSlots[2 * i] = f;
        ancestorSlots[2 * i + 1] = m;
      }
    }

    // Gen 0: Focal Person semi-circle
    result.push({
      person: focalPerson,
      generation: 0,
      indexInGen: 0,
      startAngle: Math.PI,
      endAngle: 2 * Math.PI,
      innerRadius: 0,
      outerRadius: baseRadius,
      color: '#d97706',
      side: 'root',
      label: 'Focal Individual',
    });

    // Generations 1 to 3
    for (let gen = 1; gen < MAX_GEN; gen++) {
      const count = Math.pow(2, gen);
      const angleStep = Math.PI / count;
      const innerR = baseRadius + (gen - 1) * ringWidth;
      const outerR = innerR + ringWidth;

      for (let idx = 0; idx < count; idx++) {
        const slotIdx = count + idx;
        const person = ancestorSlots[slotIdx];
        const isPaternal = idx < count / 2;
        const startAngle = Math.PI + idx * angleStep;
        const endAngle = startAngle + angleStep;

        const colorPalette = isPaternal ? paternalColors : maternalColors;
        const color = colorPalette[gen % colorPalette.length];

        result.push({
          person,
          generation: gen,
          indexInGen: idx,
          startAngle,
          endAngle,
          innerRadius: innerR,
          outerRadius: outerR,
          color,
          side: isPaternal ? 'paternal' : 'maternal',
        });
      }
    }

    return result;
  }, [focalPerson, members]);

  // SVG Arc generator
  const describeArc = (
    cx: number,
    cy: number,
    innerR: number,
    outerR: number,
    startAngle: number,
    endAngle: number
  ) => {
    const startX1 = cx + outerR * Math.cos(startAngle);
    const startY1 = cy + outerR * Math.sin(startAngle);
    const endX1 = cx + outerR * Math.cos(endAngle);
    const endY1 = cy + outerR * Math.sin(endAngle);

    const startX2 = cx + innerR * Math.cos(endAngle);
    const startY2 = cy + innerR * Math.sin(endAngle);
    const endX2 = cx + innerR * Math.cos(startAngle);
    const endY2 = cy + innerR * Math.sin(startAngle);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    if (innerR === 0) {
      return `M ${cx} ${cy} L ${startX1} ${startY1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${endX1} ${endY1} Z`;
    }

    return `M ${startX1} ${startY1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${endX1} ${endY1} L ${startX2} ${startY2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${endX2} ${endY2} Z`;
  };

  if (!focalPerson) {
    return <div className="p-12 text-center text-stone-500">No data available</div>;
  }

  const cx = 450;
  const cy = 400;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-xs border border-stone-200">
        <div>
          <h2 className="font-display font-bold text-xl text-stone-900 flex items-center gap-2">
            <span>🪭</span>
            <span>Generational Fan Chart</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Concentric 180° radial pedigree fan for{' '}
            <span className="font-semibold text-amber-800">
              {focalPerson.firstName} {focalPerson.lastName}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-amber-800 font-medium">
              <span className="w-2.5 h-2.5 bg-amber-600 rounded-full" />
              Paternal Side
            </span>
            <span className="flex items-center gap-1 text-emerald-800 font-medium">
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />
              Maternal Side
            </span>
          </div>

          <select
            value={focalId}
            onChange={(e) => setFocalId(e.target.value)}
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

      {/* Fan Chart Canvas & Hover Details Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* SVG Fan Visualizer */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-center overflow-x-auto">
          <svg
            viewBox="0 0 900 460"
            className="w-full max-w-[850px] select-none filter drop-shadow-md"
          >
            {segments.map((seg, i) => {
              const pathD = describeArc(
                cx,
                cy,
                seg.innerRadius,
                seg.outerRadius,
                seg.startAngle,
                seg.endAngle
              );

              const isHovered = hoveredSegment === seg;
              const hasPerson = !!seg.person;

              // Arc center angle for label rotation
              const midAngle = (seg.startAngle + seg.endAngle) / 2;
              const midR = (seg.innerRadius + seg.outerRadius) / 2;
              const textX = cx + midR * Math.cos(midAngle);
              const textY = cy + midR * Math.sin(midAngle);
              const rotationDeg = (midAngle * 180) / Math.PI + 90;

              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredSegment(seg)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() => seg.person && onSelectPerson(seg.person.id)}
                  className="cursor-pointer transition-all duration-150"
                >
                  <path
                    d={pathD}
                    fill={hasPerson ? seg.color : '#f3f4f6'}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    opacity={isHovered ? 1 : hasPerson ? 0.9 : 0.4}
                    className="hover:scale-[1.01] origin-center transition-transform"
                  />

                  {/* Text inside arc */}
                  {hasPerson && seg.person && (
                    <text
                      x={textX}
                      y={textY}
                      transform={`rotate(${rotationDeg}, ${textX}, ${textY})`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      fontSize={seg.generation === 0 ? 12 : seg.generation === 1 ? 11 : 9.5}
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {seg.person.firstName}
                    </text>
                  )}

                  {hasPerson && seg.person && seg.generation < 3 && (
                    <text
                      x={textX}
                      y={textY + 11}
                      transform={`rotate(${rotationDeg}, ${textX}, ${textY})`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255,255,255,0.85)"
                      fontSize="8"
                      className="pointer-events-none"
                    >
                      {seg.person.lastName}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hovered Person Detail Card */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm sticky top-24">
          <h3 className="font-display font-bold text-sm text-stone-900 uppercase tracking-wider mb-3">
            Selected Ancestor
          </h3>

          {hoveredSegment?.person ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 bg-stone-100 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                  {hoveredSegment.person.avatarUrl ? (
                    <img
                      src={hoveredSegment.person.avatarUrl}
                      alt={hoveredSegment.person.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    `${hoveredSegment.person.firstName[0]}${
                      hoveredSegment.person.lastName ? hoveredSegment.person.lastName[0] : ''
                    }`
                  )}
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-stone-900">
                    {hoveredSegment.person.firstName} {hoveredSegment.person.lastName}
                  </h4>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full capitalize">
                    {hoveredSegment.side} • Gen {hoveredSegment.generation + 1}
                  </span>
                </div>
              </div>

              <div className="text-xs text-stone-600 space-y-1.5 pt-2 border-t border-stone-100">
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  <span>
                    {hoveredSegment.person.birthDate || 'Unknown'} –{' '}
                    {hoveredSegment.person.isLiving ? 'Living' : hoveredSegment.person.deathDate || 'Deceased'}
                  </span>
                </p>
                {hoveredSegment.person.birthPlace && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{hoveredSegment.person.birthPlace}</span>
                  </p>
                )}
                {hoveredSegment.person.occupation && (
                  <p className="text-stone-700 italic">
                    Trade: {hoveredSegment.person.occupation}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                <button
                  onClick={() => onSelectPerson(hoveredSegment.person!.id)}
                  className="flex-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Open Full Record
                </button>
                {hoveredSegment.person.id !== focalId && (
                  <button
                    onClick={() => setFocalId(hoveredSegment.person!.id)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium"
                    title="Center fan chart around this ancestor"
                  >
                    Center Fan
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-stone-400 text-xs">
              Hover over or click any arc sector in the fan chart to inspect ancestor records.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
