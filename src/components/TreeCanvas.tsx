import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
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
  Eye, 
  Sparkles,
  MapPin,
  Briefcase,
  Calendar,
  Layers,
  LocateFixed,
  Compass
} from 'lucide-react';
import { Person, FamilyTree, Collaborator, Gender } from '../types';
import { getThemeConfig, ThemeConfig } from '../utils/theme';

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

const NODE_WIDTH = 240;
const NODE_HEIGHT = 145;
const HORIZONTAL_GAP = 55;
const VERTICAL_GAP = 110;

// Optimized Memoized Tree Node Card
interface TreeNodeCardProps {
  person: Person;
  x: number;
  y: number;
  width: number;
  isSelected: boolean;
  matchesSearch: boolean;
  coEditors: Collaborator[];
  themeConfig: ThemeConfig;
  onSelectPerson: (id: string) => void;
  onAddRelative: (id: string, type: 'child' | 'parent' | 'spouse') => void;
  onOpenStory: (id: string) => void;
}

const TreeNodeCard = memo<TreeNodeCardProps>(({
  person,
  x,
  y,
  width,
  isSelected,
  matchesSearch,
  coEditors,
  themeConfig,
  onSelectPerson,
  onAddRelative,
  onOpenStory,
}) => {
  const photoCount = (person.photos || []).length;
  
  const getGenderBorder = (gender: Gender) => {
    if (gender === 'female') return 'border-rose-400/60 ring-rose-400/20';
    if (gender === 'male') return 'border-sky-400/60 ring-sky-400/20';
    return 'border-amber-400/60 ring-amber-400/20';
  };

  const formatLifespan = (p: Person) => {
    const bYear = p.birthDate ? p.birthDate.split('-')[0] : 'Unknown';
    if (p.isLiving) return `b. ${bYear} (Living)`;
    const dYear = p.deathDate ? p.deathDate.split('-')[0] : 'Deceased';
    return `${bYear} – ${dYear}`;
  };

  const calculateAge = (p: Person) => {
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

  const ageStr = calculateAge(person);

  return (
    <div
      id={`tree-node-${person.id}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelectPerson(person.id);
      }}
      style={{
        position: 'absolute',
        transform: `translate3d(${x}px, ${y}px, 0)`,
        width: `${width}px`,
        contentVisibility: 'auto',
        containIntrinsicSize: `${width}px ${NODE_HEIGHT}px`,
      }}
      className={`tree-node-card group rounded-2xl p-3 cursor-pointer transition-shadow duration-150 border ${themeConfig.cardBgClass} ${themeConfig.cardBorderClass} ${themeConfig.cardShadowClass} ${
        isSelected
          ? 'ring-3 ring-amber-500 shadow-2xl z-20 scale-[1.02]'
          : 'hover:shadow-lg hover:border-amber-400/70 z-10'
      } ${!matchesSearch ? 'opacity-20 grayscale' : 'opacity-100'}`}
    >
      {/* Co-editor live viewing badge */}
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
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-display font-bold text-sm text-stone-700">
                {person.firstName[0]}
                {person.lastName ? person.lastName[0] : ''}
              </span>
            )}
          </div>

          {/* Gender badge */}
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
              {person.childIds.length} {person.childIds.length === 1 ? 'child' : 'children'}
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
});

TreeNodeCard.displayName = 'TreeNodeCard';

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
  const [pan, setPan] = useState({ x: 120, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  
  // High performance drag references without state flood
  const dragRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    initialPanX: 120,
    initialPanY: 80,
    rafId: 0,
    lastPinchDistance: 0,
  });

  // Pre-index Collaborators by currentViewingPersonId (O(1) lookup)
  const collaboratorsByPerson = useMemo(() => {
    const map = new Map<string, Collaborator[]>();
    (tree.collaborators || []).forEach((c) => {
      if (c.currentViewingPersonId && c.id !== currentCollaborator.id && c.isOnline) {
        const list = map.get(c.currentViewingPersonId) || [];
        list.push(c);
        map.set(c.currentViewingPersonId, list);
      }
    });
    return map;
  }, [tree.collaborators, currentCollaborator.id]);

  // Pre-index Search Query matching person IDs (O(1) lookup during render)
  const matchedPersonIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const set = new Set<string>();
    
    (Object.values(tree.members || {}) as Person[]).forEach((p) => {
      if (
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        (p.maidenName && p.maidenName.toLowerCase().includes(q)) ||
        (p.birthPlace && p.birthPlace.toLowerCase().includes(q)) ||
        (p.occupation && p.occupation.toLowerCase().includes(q)) ||
        (p.bio && p.bio.toLowerCase().includes(q))
      ) {
        set.add(p.id);
      }
    });
    return set;
  }, [tree.members, searchQuery]);

  // Hierarchical Barycenter Tree Layout
  const { nodes, links, bounds, generationCounts } = useMemo(() => {
    const members = (Object.values(tree.members || {}) as Person[]);
    if (members.length === 0) {
      return { 
        nodes: [], 
        links: [], 
        bounds: { minX: 0, maxX: 800, minY: 0, maxY: 600 },
        generationCounts: {} as Record<number, number>
      };
    }

    // Step 1: Assign generational levels
    const generationMap: Record<string, number> = {};
    const rootId = tree.rootPersonId || members[0]?.id;

    function assignGen(personId: string, gen: number, visited: Set<string>) {
      if (visited.has(personId)) return;
      visited.add(personId);
      generationMap[personId] = Math.max(generationMap[personId] ?? 0, gen);

      const p = tree.members[personId];
      if (!p) return;

      // Spouses stay on same level
      (p.spouseIds || []).forEach((spId) => {
        generationMap[spId] = gen;
      });

      // Children are gen + 1
      (p.childIds || []).forEach((cId) => {
        assignGen(cId, gen + 1, visited);
      });
    }

    const roots = members.filter((m) => (m.parentIds || []).length === 0);
    const startList = roots.length > 0 ? roots : [tree.members[rootId] || members[0]];

    const visitedSet = new Set<string>();
    startList.forEach((r) => {
      if (r) assignGen(r.id, 0, visitedSet);
    });

    members.forEach((m) => {
      if (generationMap[m.id] === undefined) {
        generationMap[m.id] = 0;
      }
    });

    // Step 2: Group by generation
    const byGen: Record<number, Person[]> = {};
    const genCounts: Record<number, number> = {};
    Object.entries(generationMap).forEach(([id, gen]) => {
      if (!byGen[gen]) byGen[gen] = [];
      const person = tree.members[id];
      if (person) {
        byGen[gen].push(person);
        genCounts[gen] = (genCounts[gen] || 0) + 1;
      }
    });

    const generations = Object.keys(byGen).map(Number).sort((a, b) => a - b);
    const layoutNodes: LayoutNode[] = [];
    const nodeCoords: Record<string, { x: number; y: number }> = {};
    const placedMembers = new Set<string>();

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    // Step 3: Layout generation by generation with parent barycenter centering
    generations.forEach((gen) => {
      const genPersons = byGen[gen] || [];
      const y = gen * (NODE_HEIGHT + VERTICAL_GAP) + 60;

      // Order persons: cluster couples together
      const ordered: Person[] = [];
      genPersons.forEach((p) => {
        if (placedMembers.has(p.id)) return;
        ordered.push(p);
        placedMembers.add(p.id);

        (p.spouseIds || []).forEach((spId) => {
          const spouse = tree.members[spId];
          if (spouse && !placedMembers.has(spId)) {
            ordered.push(spouse);
            placedMembers.add(spId);
          }
        });
      });

      // Calculate desired x position based on parent midpoint
      const desiredPositions: { person: Person; desiredX: number }[] = ordered.map((person, idx) => {
        let parentCenterX: number | null = null;
        if (person.parentIds && person.parentIds.length > 0) {
          const validParents = person.parentIds
            .map((pid) => nodeCoords[pid])
            .filter(Boolean);
          if (validParents.length > 0) {
            const sumX = validParents.reduce((acc, c) => acc + c.x, 0);
            parentCenterX = sumX / validParents.length;
          }
        }

        const fallbackX = 100 + idx * (NODE_WIDTH + HORIZONTAL_GAP);
        return {
          person,
          desiredX: parentCenterX !== null ? parentCenterX : fallbackX,
        };
      });

      // Sort by desired X to prevent crossing branches
      desiredPositions.sort((a, b) => a.desiredX - b.desiredX);

      // Sweep from left to right to resolve overlapping cards
      let currentX = 80;
      desiredPositions.forEach((item, idx) => {
        // Minimum x to avoid colliding with preceding card
        if (idx === 0) {
          currentX = Math.max(item.desiredX, 80);
        } else {
          currentX = Math.max(currentX + NODE_WIDTH + HORIZONTAL_GAP, item.desiredX);
        }

        nodeCoords[item.person.id] = { x: currentX, y };

        layoutNodes.push({
          person: item.person,
          x: currentX,
          y,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          generation: gen,
        });

        minX = Math.min(minX, currentX);
        maxX = Math.max(maxX, currentX + NODE_WIDTH);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + NODE_HEIGHT);
      });
    });

    // Step 4: Build connecting links
    const layoutLinks: LayoutLink[] = [];
    const processedSpousePairs = new Set<string>();

    // Spouse links
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

    // Parent to child links
    members.forEach((child) => {
      if (child.parentIds && child.parentIds.length > 0) {
        const childCoord = nodeCoords[child.id];
        if (!childCoord) return;

        const childTopX = childCoord.x + NODE_WIDTH / 2;
        const childTopY = childCoord.y;

        // Joint parents midpoint connection
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
      generationCounts: genCounts,
    };
  }, [tree]);

  // Center canvas on a specific person
  const centerOnPerson = useCallback((personId: string) => {
    const targetNode = nodes.find((n) => n.person.id === personId);
    if (!targetNode || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const targetCenterX = targetNode.x + targetNode.width / 2;
    const targetCenterY = targetNode.y + targetNode.height / 2;

    setPan({
      x: containerWidth / 2 - targetCenterX * zoom,
      y: containerHeight / 2 - targetCenterY * zoom,
    });
  }, [nodes, zoom]);

  // Auto-center when search finds exactly one match
  useEffect(() => {
    if (matchedPersonIds && matchedPersonIds.size === 1) {
      const singleId = Array.from(matchedPersonIds)[0];
      centerOnPerson(singleId);
    }
  }, [matchedPersonIds, centerOnPerson]);

  // High performance pointer and mouse dragging via window events + RAF
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.tree-node-card')) return;
    dragRef.current.isDown = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.initialPanX = pan.x;
    dragRef.current.initialPanY = pan.y;
    setIsDragging(true);
  };

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.isDown) return;

      if (dragRef.current.rafId) {
        cancelAnimationFrame(dragRef.current.rafId);
      }

      dragRef.current.rafId = requestAnimationFrame(() => {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPan({
          x: dragRef.current.initialPanX + dx,
          y: dragRef.current.initialPanY + dy,
        });
      });
    };

    const handleWindowMouseUp = () => {
      if (dragRef.current.isDown) {
        dragRef.current.isDown = false;
        setIsDragging(false);
        if (dragRef.current.rafId) {
          cancelAnimationFrame(dragRef.current.rafId);
        }
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      if (dragRef.current.rafId) {
        cancelAnimationFrame(dragRef.current.rafId);
      }
    };
  }, []);

  // Touch Support: 1-finger pan, 2-finger pinch zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.tree-node-card')) return;
    if (e.touches.length === 1) {
      dragRef.current.isDown = true;
      dragRef.current.startX = e.touches[0].clientX;
      dragRef.current.startY = e.touches[0].clientY;
      dragRef.current.initialPanX = pan.x;
      dragRef.current.initialPanY = pan.y;
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      dragRef.current.isDown = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      dragRef.current.lastPinchDistance = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && dragRef.current.isDown) {
      const dx = e.touches[0].clientX - dragRef.current.startX;
      const dy = e.touches[0].clientY - dragRef.current.startY;
      setPan({
        x: dragRef.current.initialPanX + dx,
        y: dragRef.current.initialPanY + dy,
      });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (dragRef.current.lastPinchDistance > 0) {
        const factor = dist / dragRef.current.lastPinchDistance;
        setZoom((prev) => Math.min(Math.max(prev * factor, 0.35), 2.4));
      }
      dragRef.current.lastPinchDistance = dist;
    }
  };

  const handleTouchEnd = () => {
    dragRef.current.isDown = false;
    dragRef.current.lastPinchDistance = 0;
    setIsDragging(false);
  };

  // Zoom Controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.4));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 120, y: 80 });
  };

  const handleFitToScreen = () => {
    if (!containerRef.current || nodes.length === 0) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;

    const scaleX = (containerWidth - 100) / contentWidth;
    const scaleY = (containerHeight - 100) / contentHeight;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.4), 1.25);

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

  // Keyboard Shortcuts: +, -, 0, Arrow Keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input / textarea
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleFitToScreen();
      } else if (e.key === 'ArrowLeft') {
        setPan((prev) => ({ ...prev, x: prev.x + 40 }));
      } else if (e.key === 'ArrowRight') {
        setPan((prev) => ({ ...prev, x: prev.x - 40 }));
      } else if (e.key === 'ArrowUp') {
        setPan((prev) => ({ ...prev, y: prev.y + 40 }));
      } else if (e.key === 'ArrowDown') {
        setPan((prev) => ({ ...prev, y: prev.y - 40 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bounds]);

  const themeConfig = getThemeConfig(tree.theme);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className={`relative w-full h-[calc(100vh-104px)] overflow-hidden select-none transition-colors duration-300 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } ${themeConfig.canvasBgClass}`}
    >
      {/* Floating Canvas Viewport Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-stone-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl border border-stone-700/80 text-stone-200">
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-200 hover:text-white transition-colors"
            title="Zoom In (+)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold w-10 text-center text-amber-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-200 hover:text-white transition-colors"
            title="Zoom Out (-)"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-stone-700 mx-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={handleFitToScreen}
            className="px-2.5 py-1 hover:bg-stone-800 rounded-lg text-xs font-medium text-stone-200 flex items-center gap-1.5 transition-colors"
            title="Fit entire family tree on canvas (0)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Fit View</span>
          </button>

          <button
            onClick={handleResetZoom}
            className="px-2 py-1 hover:bg-stone-800 rounded-lg text-xs font-medium text-stone-200 flex items-center gap-1 transition-colors"
            title="Reset position and zoom"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {selectedPersonId && (
            <button
              onClick={() => centerOnPerson(selectedPersonId)}
              className="px-2.5 py-1 hover:bg-stone-800 rounded-lg text-xs font-medium text-amber-300 flex items-center gap-1.5 transition-colors"
              title="Locate selected relative"
            >
              <LocateFixed className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Center Selection</span>
            </button>
          )}
        </div>
      </div>

      {/* Generation & Statistics Legend in Bottom Bar */}
      <div className="absolute left-4 bottom-4 z-10 hidden md:flex items-center gap-3 bg-stone-900/85 backdrop-blur-md text-stone-200 text-xs px-3.5 py-2 rounded-2xl shadow-lg border border-stone-800">
        <div className="flex items-center gap-1.5 text-amber-300 font-medium">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>{Object.keys(generationCounts).length} Generations</span>
        </div>
        <span className="text-stone-600">•</span>
        <div className="flex items-center gap-1 text-stone-400">
          <Compass className="w-3.5 h-3.5 text-stone-400" />
          <span>Theme: <strong className="text-stone-200 font-medium">{themeConfig.name}</strong></span>
        </div>
        <span className="text-stone-600">•</span>
        <span className="text-[11px] text-stone-400">Use mouse drag or pinch to explore</span>
      </div>

      {/* High-Performance GPU-Accelerated Canvas Layer */}
      <div
        className="w-full h-full transform-gpu origin-top-left will-change-transform"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
        }}
      >
        {/* SVG Connections Layer */}
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
                  {/* Marriage Rings Icon */}
                  <circle
                    cx={(link.x1 + link.x2) / 2}
                    cy={(link.y1 + link.y2) / 2}
                    r="8.5"
                    fill="#fff1f2"
                    stroke={themeConfig.spouseLineColor}
                    strokeWidth="1.5"
                  />
                  <text
                    x={(link.x1 + link.x2) / 2}
                    y={(link.y1 + link.y2) / 2 + 3}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill={themeConfig.spouseLineColor}
                    fontWeight="bold"
                  >
                    💍
                  </text>
                </g>
              );
            }

            // Smooth cubic bezier for parent-child tree branch
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
          const matches = matchedPersonIds ? matchedPersonIds.has(person.id) : true;
          const coEditors = collaboratorsByPerson.get(person.id) || [];

          return (
            <TreeNodeCard
              key={person.id}
              person={person}
              x={node.x}
              y={node.y}
              width={node.width}
              isSelected={isSelected}
              matchesSearch={matches}
              coEditors={coEditors}
              themeConfig={themeConfig}
              onSelectPerson={onSelectPerson}
              onAddRelative={onAddRelative}
              onOpenStory={onOpenStory}
            />
          );
        })}
      </div>
    </div>
  );
};
