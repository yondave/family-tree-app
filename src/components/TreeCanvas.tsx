import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  Maximize2, 
  RotateCcw, 
  Edit3, 
  UserPlus, 
  Heart, 
  BookOpen, 
  Camera, 
  MessageSquare, 
  Eye, 
  Sparkles,
  MapPin,
  Briefcase,
  Calendar,
  Layers
} from 'lucide-react';
import { Person, FamilyTree, Collaborator, Gender } from '../types';
import { getThemeConfig } from '../utils/theme';

interface TreeCanvasProps {
  tree: FamilyTree;
  selectedPersonId?: string;
  onSelectPerson: (personId: string) => void;
  onAddRelative: (targetPersonId: string, relationshipType: 'child' | 'parent' | 'spouse') => void;
  onOpenStory: (personId: string) => void;
  searchQuery?: string;
  currentCollaborator: Collaborator;
}

interface LayoutNode {
  person: Person;
  x: number;
  y: number;
  width: number;
  height: number;
  generation: number;
}

interface LayoutLink {
  id: string;
  type: 'parent-child' | 'spouse';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}

export const TreeCanvas: React.FC<TreeCanvasProps> = ({
  tree,
  selectedPersonId,
  onSelectPerson,
  onAddRelative,
  onOpenStory,
  searchQuery = '',
  currentCollaborator,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 100, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredPersonId, setHoveredPersonId] = useState<string | null>(null);

  const NODE_WIDTH = 240;
  const NODE_HEIGHT = 145;
  const HORIZONTAL_GAP = 60;
  const VERTICAL_GAP = 120;

  // Calculate layout of generations and branch positioning
  const { nodes, links, bounds } = useMemo(() => {
    const members = (Object.values(tree.members || {}) as Person[]);
    if (members.length === 0) {
      return { nodes: [], links: [], bounds: { minX: 0, maxX: 800, minY: 0, maxY: 600 } };
    }

    // Step 1: Assign generation depth from root person or earliest ancestors
    const generationMap: Record<string, number> = {};
    const rootId = tree.rootPersonId || members[0]?.id;

    // Find all ancestor depths
    function calculateGenerations(personId: string, gen: number, visited: Set<string>) {
      if (visited.has(personId)) return;
      visited.add(personId);
      generationMap[personId] = Math.max(generationMap[personId] ?? 0, gen);

      const p = tree.members[personId];
      if (!p) return;

      // Spouses are on the same generation
      (p.spouseIds || []).forEach((spId) => {
        generationMap[spId] = gen;
      });

      // Children are generation + 1
      (p.childIds || []).forEach((cId) => {
        calculateGenerations(cId, gen + 1, visited);
      });
    }

    // Start with root or people with no parents
    const roots = members.filter((m) => (m.parentIds || []).length === 0);
    const startList = roots.length > 0 ? roots : [tree.members[rootId] || members[0]];

    const visitedSet = new Set<string>();
    startList.forEach((r) => {
      if (r) calculateGenerations(r.id, 0, visitedSet);
    });

    // Ensure everyone has a generation assigned
    members.forEach((m) => {
      if (generationMap[m.id] === undefined) {
        generationMap[m.id] = 0;
      }
    });

    // Step 2: Group members by generation
    const byGen: Record<number, Person[]> = {};
    Object.entries(generationMap).forEach(([id, gen]) => {
      if (!byGen[gen]) byGen[gen] = [];
      if (tree.members[id]) byGen[gen].push(tree.members[id]);
    });

    const layoutNodes: LayoutNode[] = [];
    const nodeCoords: Record<string, { x: number; y: number }> = {};
    const placedInGen = new Set<string>();

    const generations = Object.keys(byGen)
      .map(Number)
      .sort((a, b) => a - b);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    generations.forEach((gen) => {
      const genPersons = byGen[gen] || [];
      const y = gen * (NODE_HEIGHT + VERTICAL_GAP) + 60;

      // Cluster spouses together
      const orderedGenPersons: Person[] = [];
      genPersons.forEach((p) => {
        if (placedInGen.has(p.id)) return;
        orderedGenPersons.push(p);
        placedInGen.add(p.id);

        // Put spouses immediately next
        (p.spouseIds || []).forEach((spId) => {
          const spouse = tree.members[spId];
          if (spouse && !placedInGen.has(spId)) {
            orderedGenPersons.push(spouse);
            placedInGen.add(spId);
          }
        });
      });

      const totalWidth = orderedGenPersons.length * (NODE_WIDTH + HORIZONTAL_GAP) - HORIZONTAL_GAP;
      const startX = Math.max(80, 600 - totalWidth / 2);

      orderedGenPersons.forEach((person, idx) => {
        const x = startX + idx * (NODE_WIDTH + HORIZONTAL_GAP);
        nodeCoords[person.id] = { x, y };

        layoutNodes.push({
          person,
          x,
          y,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          generation: gen,
        });

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x + NODE_WIDTH);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + NODE_HEIGHT);
      });
    });

    // Step 3: Create connecting links
    const layoutLinks: LayoutLink[] = [];
    const processedSpousePairs = new Set<string>();

    // Spouse links (horizontal connectors)
    members.forEach((person) => {
      (person.spouseIds || []).forEach((spId) => {
        const pairKey = [person.id, spId].sort().join('_');
        if (!processedSpousePairs.has(pairKey)) {
          processedSpousePairs.add(pairKey);
          const c1 = nodeCoords[person.id];
          const c2 = nodeCoords[spId];
          if (c1 && c2) {
            const isLeft = c1.x < c2.x;
            const x1 = isLeft ? c1.x + NODE_WIDTH : c1.x;
            const y1 = c1.y + NODE_HEIGHT / 2;
            const x2 = isLeft ? c2.x : c2.x + NODE_WIDTH;
            const y2 = c2.y + NODE_HEIGHT / 2;

            layoutLinks.push({
              id: `spouse_${pairKey}`,
              type: 'spouse',
              x1,
              y1,
              x2,
              y2,
              label: 'Married',
            });
          }
        }
      });
    });

    // Parent to Child links (vertical and fork connectors)
    members.forEach((child) => {
      if (child.parentIds && child.parentIds.length > 0) {
        const childCoord = nodeCoords[child.id];
        if (!childCoord) return;

        const childTopX = childCoord.x + NODE_WIDTH / 2;
        const childTopY = childCoord.y;

        // If child has 2 parents that are spouses, connect from center of spouse line
        if (child.parentIds.length >= 2) {
          const p1 = nodeCoords[child.parentIds[0]];
          const p2 = nodeCoords[child.parentIds[1]];
          if (p1 && p2) {
            const midX = (p1.x + NODE_WIDTH / 2 + p2.x + NODE_WIDTH / 2) / 2;
            const midY = (p1.y + p2.y) / 2 + NODE_HEIGHT / 2;

            layoutLinks.push({
              id: `parent_child_joint_${child.id}`,
              type: 'parent-child',
              x1: midX,
              y1: midY,
              x2: childTopX,
              y2: childTopY,
            });
            return;
          }
        }

        // Single parent link
        child.parentIds.forEach((pId) => {
          const parentCoord = nodeCoords[pId];
          if (parentCoord) {
            layoutLinks.push({
              id: `parent_child_${pId}_${child.id}`,
              type: 'parent-child',
              x1: parentCoord.x + NODE_WIDTH / 2,
              y1: parentCoord.y + NODE_HEIGHT,
              x2: childTopX,
              y2: childTopY,
            });
          }
        });
      }
    });

    return {
      nodes: layoutNodes,
      links: layoutLinks,
      bounds: {
        minX: minX === Infinity ? 0 : minX - 100,
        maxX: maxX === -Infinity ? 1000 : maxX + 100,
        minY: minY === Infinity ? 0 : minY - 50,
        maxY: maxY === -Infinity ? 800 : maxY + 150,
      },
    };
  }, [tree]);

  // Handle Canvas Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.tree-node-card')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom Controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.4));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 100, y: 80 });
  };

  const handleFitToScreen = () => {
    if (!containerRef.current || nodes.length === 0) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;

    const scaleX = (containerWidth - 80) / contentWidth;
    const scaleY = (containerHeight - 80) / contentHeight;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.45), 1.2);

    setZoom(newZoom);
    setPan({
      x: (containerWidth - contentWidth * newZoom) / 2 - bounds.minX * newZoom,
      y: (containerHeight - contentHeight * newZoom) / 2 - bounds.minY * newZoom + 20,
    });
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.35), 2.5));
    }
  };

  // Search match helper
  const isSearchMatch = (person: Person) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      person.firstName.toLowerCase().includes(q) ||
      person.lastName.toLowerCase().includes(q) ||
      (person.maidenName && person.maidenName.toLowerCase().includes(q)) ||
      (person.birthPlace && person.birthPlace.toLowerCase().includes(q)) ||
      (person.occupation && person.occupation.toLowerCase().includes(q))
    );
  };

  // Find other collaborators currently viewing nodes
  const getCollaboratorsOnPerson = (personId: string) => {
    return (tree.collaborators || []).filter(
      (c) => c.currentViewingPersonId === personId && c.id !== currentCollaborator.id && c.isOnline
    );
  };

  const getGenderBorder = (gender: Gender) => {
    if (gender === 'female') return 'border-rose-400/60 ring-rose-400/20';
    if (gender === 'male') return 'border-sky-400/60 ring-sky-400/20';
    return 'border-amber-400/60 ring-amber-400/20';
  };

  const getGenderBadge = (gender: Gender) => {
    if (gender === 'female') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (gender === 'male') return 'bg-sky-50 text-sky-700 border-sky-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const formatLifespan = (p: Person) => {
    const bYear = p.birthDate ? p.birthDate.split('-')[0] : 'Unknown';
    if (p.isLiving) {
      return `b. ${bYear} (Living)`;
    }
    const dYear = p.deathDate ? p.deathDate.split('-')[0] : 'Deceased';
    return `${bYear} – ${dYear}`;
  };

  const themeConfig = getThemeConfig(tree.theme);

  const calculateAgeOrLifespan = (p: Person) => {
    if (!p.birthDate) return null;
    const birthYear = parseInt(p.birthDate.split('-')[0], 10);
    if (isNaN(birthYear)) return null;

    if (p.isLiving) {
      const currentYear = new Date().getFullYear();
      return `${currentYear - birthYear} yrs`;
    }
    if (p.deathDate) {
      const deathYear = parseInt(p.deathDate.split('-')[0], 10);
      if (!isNaN(deathYear)) {
        return `${deathYear - birthYear} yrs`;
      }
    }
    return null;
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className={`relative w-full h-[calc(100vh-104px)] overflow-hidden cursor-grab active:cursor-grabbing select-none transition-colors duration-300 ${themeConfig.canvasBgClass}`}
    >
      {/* Canvas Viewport Floating Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-stone-900/85 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-stone-700 text-stone-200">
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-200 hover:text-white transition-colors"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold w-10 text-center text-amber-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-200 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-stone-700 hidden sm:block" />

        <div className="flex items-center gap-1">
          <button
            onClick={handleFitToScreen}
            className="px-2 py-1 hover:bg-stone-800 rounded-lg text-xs font-medium text-stone-200 flex items-center gap-1 transition-colors"
            title="Fit whole family tree on screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fit View</span>
          </button>

          <button
            onClick={handleResetZoom}
            className="px-2 py-1 hover:bg-stone-800 rounded-lg text-xs font-medium text-stone-200 flex items-center gap-1 transition-colors"
            title="Reset position and zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Generation Scale Guide on Left */}
      <div className="absolute left-4 bottom-4 z-10 hidden md:flex items-center gap-2 bg-stone-900/85 backdrop-blur-md text-stone-200 text-[11px] px-3 py-1.5 rounded-full shadow-md border border-stone-800">
        <Layers className="w-3.5 h-3.5 text-amber-400" />
        <span>Theme: <strong className="text-amber-300 font-semibold">{themeConfig.name}</strong></span>
        <span className="text-stone-600">•</span>
        <span>Drag canvas to explore</span>
      </div>

      {/* SVG Connecting Links Layer & Interactive Canvas Container */}
      <div
        className="w-full h-full transform-gpu origin-top-left transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <svg
          className="absolute top-0 left-0 pointer-events-none overflow-visible"
          style={{ width: '100%', height: '100%' }}
        >
          {links.map((link) => {
            if (link.type === 'spouse') {
              return (
                <g key={link.id}>
                  <path
                    d={`M ${link.x1} ${link.y1} L ${link.x2} ${link.y2}`}
                    fill="none"
                    stroke={themeConfig.spouseLineColor}
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    className="opacity-80"
                  />
                  {/* Marriage Rings Icon in center of line */}
                  <circle
                    cx={(link.x1 + link.x2) / 2}
                    cy={(link.y1 + link.y2) / 2}
                    r="9"
                    fill="#fff1f2"
                    stroke={themeConfig.spouseLineColor}
                    strokeWidth="1.5"
                  />
                  <text
                    x={(link.x1 + link.x2) / 2}
                    y={(link.y1 + link.y2) / 2 + 3.5}
                    textAnchor="middle"
                    fontSize="9"
                    fill={themeConfig.spouseLineColor}
                    fontWeight="bold"
                  >
                    💍
                  </text>
                </g>
              );
            }

            // Parent-child bezier curve
            const midY = (link.y1 + link.y2) / 2;
            const pathD = `M ${link.x1} ${link.y1} C ${link.x1} ${midY}, ${link.x2} ${midY}, ${link.x2} ${link.y2}`;

            return (
              <g key={link.id}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={themeConfig.parentLineColor}
                  strokeWidth="2.5"
                  strokeOpacity="0.75"
                  className="transition-all duration-300"
                />
                <circle cx={link.x2} cy={link.y2} r="3.5" fill={themeConfig.parentLineColor} />
              </g>
            );
          })}
        </svg>

        {/* Tree Nodes Cards */}
        {nodes.map((node) => {
          const person = node.person;
          const isSelected = person.id === selectedPersonId;
          const matchesSearch = isSearchMatch(person);
          const coEditors = getCollaboratorsOnPerson(person.id);
          const photoCount = (person.photos || []).length;
          const ageStr = calculateAgeOrLifespan(person);

          return (
            <div
              key={person.id}
              id={`tree-node-${person.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPerson(person.id);
              }}
              onMouseEnter={() => setHoveredPersonId(person.id)}
              onMouseLeave={() => setHoveredPersonId(null)}
              style={{
                position: 'absolute',
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${node.width}px`,
              }}
              className={`tree-node-card group rounded-2xl p-3 cursor-pointer transition-all duration-200 border ${themeConfig.cardBgClass} ${themeConfig.cardBorderClass} ${themeConfig.cardShadowClass} ${
                isSelected
                  ? 'ring-3 ring-amber-500 shadow-2xl scale-[1.03] z-20'
                  : 'hover:scale-[1.01] hover:shadow-lg z-10'
              } ${!matchesSearch ? 'opacity-25 grayscale' : 'opacity-100'}`}
            >
              {/* Co-editor live viewing bubble */}
              {coEditors.length > 0 && (
                <div className="absolute -top-3 right-3 flex items-center gap-1 bg-stone-900 text-stone-100 text-[10px] px-2 py-0.5 rounded-full shadow-md z-30 animate-pulse border border-stone-700">
                  <Eye className="w-3 h-3 text-emerald-400" />
                  <span>{coEditors[0].name.split(' ')[0]} viewing</span>
                </div>
              )}

              {/* Main Card Content */}
              <div className="flex items-start gap-3">
                {/* Avatar with ring frame */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full overflow-hidden border-2 shadow-inner ring-2 ${getGenderBorder(
                      person.gender
                    )} bg-stone-200 flex items-center justify-center`}
                  >
                    {person.avatarUrl ? (
                      <img
                        src={person.avatarUrl}
                        alt={`${person.firstName} ${person.lastName}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-display font-bold text-sm text-stone-700">
                        {person.firstName[0]}
                        {person.lastName ? person.lastName[0] : ''}
                      </span>
                    )}
                  </div>

                  {/* Gender indicator badge */}
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold shadow-xs border ${
                      person.gender === 'female'
                        ? 'bg-rose-100 text-rose-700 border-rose-300'
                        : person.gender === 'male'
                        ? 'bg-sky-100 text-sky-700 border-sky-300'
                        : 'bg-amber-100 text-amber-700 border-amber-300'
                    }`}
                  >
                    {person.gender === 'female' ? '♀' : person.gender === 'male' ? '♂' : '•'}
                  </span>
                </div>

                {/* Person Names & Vitals */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`font-display font-bold text-sm truncate leading-tight group-hover:text-amber-500 transition-colors ${themeConfig.textPrimaryClass}`}>
                      {person.firstName} {person.lastName}
                    </h4>
                  </div>

                  {person.maidenName && (
                    <p className={`text-[11px] italic truncate -mt-0.5 ${themeConfig.textMutedClass}`}>
                      née {person.maidenName}
                    </p>
                  )}

                  {/* Lifespan & Living Indicator */}
                  <div className={`flex items-center gap-1.5 mt-1 text-[11px] font-medium ${themeConfig.textSecondaryClass}`}>
                    <Calendar className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    <span className="truncate">{formatLifespan(person)}</span>
                    {ageStr && (
                      <span className={`text-[10px] font-normal ${themeConfig.textMutedClass}`}>
                        ({ageStr})
                      </span>
                    )}
                  </div>

                  {/* Occupation or Location */}
                  {person.occupation ? (
                    <div className={`flex items-center gap-1 mt-0.5 text-[11px] truncate ${themeConfig.textMutedClass}`}>
                      <Briefcase className="w-3 h-3 flex-shrink-0 opacity-70" />
                      <span className="truncate">{person.occupation}</span>
                    </div>
                  ) : person.birthPlace ? (
                    <div className={`flex items-center gap-1 mt-0.5 text-[11px] truncate ${themeConfig.textMutedClass}`}>
                      <MapPin className="w-3 h-3 flex-shrink-0 opacity-70" />
                      <span className="truncate">{person.birthPlace}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Badges / Footer Row */}
              <div className="mt-2.5 pt-2 border-t border-stone-200/40 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 truncate">
                  {photoCount > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-600 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                      <Camera className="w-3 h-3" />
                      <span>{photoCount}</span>
                    </span>
                  )}
                  {person.bio && (
                    <span className={`flex items-center gap-0.5 ${themeConfig.textMutedClass}`} title="Has written biography">
                      <BookOpen className="w-3 h-3 text-amber-500" />
                      <span>Bio</span>
                    </span>
                  )}
                  {(person.childIds || []).length > 0 && (
                    <span className={`font-medium ${themeConfig.textMutedClass}`}>
                      {person.childIds.length} {person.childIds.length === 1 ? 'ch' : 'ch'}
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenStory(person.id);
                  }}
                  className={`font-medium flex items-center gap-0.5 hover:underline ${themeConfig.accentPrimaryClass}`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Story</span>
                </button>
              </div>

              {/* Quick Actions Hover Palette */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-stone-900/95 backdrop-blur-md px-2 py-1 rounded-full shadow-xl border border-stone-700 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddRelative(person.id, 'child');
                  }}
                  className="px-2 py-0.5 text-[10px] font-medium text-amber-300 hover:bg-stone-800 rounded-full flex items-center gap-1 transition-colors whitespace-nowrap"
                  title="Add child"
                >
                  <span>+ Child</span>
                </button>
                <span className="text-stone-600">|</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddRelative(person.id, 'spouse');
                  }}
                  className="px-2 py-0.5 text-[10px] font-medium text-rose-300 hover:bg-stone-800 rounded-full flex items-center gap-1 transition-colors whitespace-nowrap"
                  title="Add spouse / partner"
                >
                  <Heart className="w-2.5 h-2.5" />
                  <span>+ Spouse</span>
                </button>
                <span className="text-stone-600">|</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddRelative(person.id, 'parent');
                  }}
                  className="px-2 py-0.5 text-[10px] font-medium text-sky-300 hover:bg-stone-800 rounded-full flex items-center gap-1 transition-colors whitespace-nowrap"
                  title="Add father or mother"
                >
                  <span>+ Parent</span>
                </button>
                <span className="text-stone-600">|</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPerson(person.id);
                  }}
                  className="p-1 text-stone-300 hover:text-white hover:bg-stone-800 rounded-full"
                  title="Edit full profile"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
