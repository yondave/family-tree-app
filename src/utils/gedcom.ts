import { Person, Relationship, FamilyTree, GedcomParseResult, Gender } from '../types';

/**
 * Robust GEDCOM 5.5 / 5.5.1 / 7.0 Parser for genealogy imports
 */
export function parseGedcom(gedcomText: string): GedcomParseResult {
  const lines = gedcomText.split(/\r?\n/);
  const rawIndis: Record<string, any> = {};
  const rawFams: Record<string, any> = {};
  let currentRecord: any = null;
  let recordType: 'INDI' | 'FAM' | 'HEAD' | 'OTHER' = 'OTHER';
  let currentSubTag = '';

  let treeName = 'Imported Genealogy Tree';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Standard GEDCOM line: Level [Optional @ID@] Tag [Optional LineValue]
    const match = rawLine.match(/^(\d+)\s+(?:@([^@]+)@\s+)?([A-Za-z0-9_]+)(?:\s+(.*))?$/);
    if (!match) continue;

    const level = parseInt(match[1], 10);
    const pointer = match[2];
    const tag = match[3].toUpperCase();
    const value = (match[4] || '').trim();

    if (level === 0) {
      if (tag === 'INDI' && pointer) {
        recordType = 'INDI';
        currentRecord = {
          id: pointer,
          givn: '',
          surn: '',
          name: '',
          sex: 'unknown',
          birtDate: '',
          birtPlace: '',
          deatDate: '',
          deatPlace: '',
          occu: '',
          notes: [],
          famc: [],
          fams: [],
          photos: [],
        };
        rawIndis[pointer] = currentRecord;
      } else if (tag === 'FAM' && pointer) {
        recordType = 'FAM';
        currentRecord = {
          id: pointer,
          husb: '',
          wife: '',
          chil: [],
          marrDate: '',
          marrPlace: '',
        };
        rawFams[pointer] = currentRecord;
      } else if (tag === 'HEAD') {
        recordType = 'HEAD';
      } else {
        recordType = 'OTHER';
        currentRecord = null;
      }
      currentSubTag = '';
      continue;
    }

    if (recordType === 'HEAD' && tag === 'FILE' && value) {
      treeName = value.replace(/\.[^/.]+$/, '');
    }

    if (recordType === 'INDI' && currentRecord) {
      if (level === 1) {
        currentSubTag = tag;
        if (tag === 'NAME') {
          currentRecord.name = value;
          const slashMatch = value.match(/(.*?)\s*\/([^/]*)\//);
          if (slashMatch) {
            currentRecord.givn = slashMatch[1].trim();
            currentRecord.surn = slashMatch[2].trim();
          } else if (value) {
            const parts = value.split(' ');
            currentRecord.givn = parts.slice(0, -1).join(' ') || parts[0];
            currentRecord.surn = parts.length > 1 ? parts[parts.length - 1] : '';
          }
        } else if (tag === 'SEX') {
          const s = value.toUpperCase();
          currentRecord.sex = s === 'M' ? 'male' : s === 'F' ? 'female' : 'other';
        } else if (tag === 'OCCU') {
          currentRecord.occu = value;
        } else if (tag === 'NOTE') {
          currentRecord.notes.push(value);
        } else if (tag === 'FAMC') {
          const famId = value.replace(/@/g, '');
          if (famId) currentRecord.famc.push(famId);
        } else if (tag === 'FAMS') {
          const famId = value.replace(/@/g, '');
          if (famId) currentRecord.fams.push(famId);
        }
      } else if (level === 2) {
        if (currentSubTag === 'NAME') {
          if (tag === 'GIVN' && value) currentRecord.givn = value;
          if (tag === 'SURN' && value) currentRecord.surn = value;
        } else if (currentSubTag === 'BIRT') {
          if (tag === 'DATE') currentRecord.birtDate = value;
          if (tag === 'PLAC') currentRecord.birtPlace = value;
        } else if (currentSubTag === 'DEAT') {
          if (tag === 'DATE') currentRecord.deatDate = value;
          if (tag === 'PLAC') currentRecord.deatPlace = value;
        } else if (currentSubTag === 'NOTE' && (tag === 'CONT' || tag === 'CONC')) {
          if (currentRecord.notes.length > 0) {
            currentRecord.notes[currentRecord.notes.length - 1] += (tag === 'CONT' ? '\n' : ' ') + value;
          }
        }
      }
    } else if (recordType === 'FAM' && currentRecord) {
      if (level === 1) {
        currentSubTag = tag;
        if (tag === 'HUSB') {
          currentRecord.husb = value.replace(/@/g, '');
        } else if (tag === 'WIFE') {
          currentRecord.wife = value.replace(/@/g, '');
        } else if (tag === 'CHIL') {
          const childId = value.replace(/@/g, '');
          if (childId) currentRecord.chil.push(childId);
        }
      } else if (level === 2) {
        if (currentSubTag === 'MARR') {
          if (tag === 'DATE') currentRecord.marrDate = value;
          if (tag === 'PLAC') currentRecord.marrPlace = value;
        }
      }
    }
  }

  // Convert raw individuals to Person objects
  const members: Record<string, Person> = {};
  const relationships: Relationship[] = [];

  const indiKeys = Object.keys(rawIndis);
  for (const indiId of indiKeys) {
    const raw = rawIndis[indiId];
    let firstName = raw.givn;
    let lastName = raw.surn;
    if (!firstName && !lastName) {
      firstName = raw.name || `Person ${indiId}`;
    }

    const isLiving = !raw.deatDate && !raw.deatPlace;

    members[indiId] = {
      id: indiId,
      firstName: firstName || 'Unknown',
      lastName: lastName || '',
      gender: (raw.sex as Gender) || 'unknown',
      birthDate: raw.birtDate || undefined,
      birthPlace: raw.birtPlace || undefined,
      deathDate: raw.deatDate || undefined,
      deathPlace: raw.deatPlace || undefined,
      isLiving,
      occupation: raw.occu || undefined,
      notes: raw.notes.join('\n\n') || undefined,
      parentIds: [],
      spouseIds: [],
      childIds: [],
      tags: [],
      photos: [],
      updatedAt: new Date().toISOString(),
    };
  }

  // Process family connections
  for (const famId of Object.keys(rawFams)) {
    const fam = rawFams[famId];
    const husbId = fam.husb;
    const wifeId = fam.wife;
    const children = fam.chil as string[];

    // Spouse connection
    if (husbId && wifeId && members[husbId] && members[wifeId]) {
      if (!members[husbId].spouseIds.includes(wifeId)) {
        members[husbId].spouseIds.push(wifeId);
      }
      if (!members[wifeId].spouseIds.includes(husbId)) {
        members[wifeId].spouseIds.push(husbId);
      }

      relationships.push({
        id: `rel_${famId}`,
        type: 'spouse',
        person1Id: husbId,
        person2Id: wifeId,
        marriageDate: fam.marrDate || undefined,
        marriagePlace: fam.marrPlace || undefined,
        status: 'married',
      });
    }

    // Children parent-child connections
    for (const childId of children) {
      if (!members[childId]) continue;

      if (husbId && members[husbId]) {
        if (!members[childId].parentIds.includes(husbId)) {
          members[childId].parentIds.push(husbId);
        }
        if (!members[husbId].childIds.includes(childId)) {
          members[husbId].childIds.push(childId);
        }
      }

      if (wifeId && members[wifeId]) {
        if (!members[childId].parentIds.includes(wifeId)) {
          members[childId].parentIds.push(wifeId);
        }
        if (!members[wifeId].childIds.includes(childId)) {
          members[wifeId].childIds.push(childId);
        }
      }
    }
  }

  // Determine the best root person (e.g. someone with children or earliest birth)
  let rootPersonId = indiKeys[0] || '';
  if (indiKeys.length > 0) {
    // Find candidate with no parents or most descendants
    const noParents = indiKeys.filter((id) => members[id].parentIds.length === 0);
    const withChildren = noParents.filter((id) => members[id].childIds.length > 0);
    if (withChildren.length > 0) {
      rootPersonId = withChildren[0];
    } else if (noParents.length > 0) {
      rootPersonId = noParents[0];
    }
  }

  return {
    treeName: treeName || 'Imported Family Lineage',
    rootPersonId,
    members,
    relationships,
    media: [],
    stats: {
      individualCount: indiKeys.length,
      familyCount: Object.keys(rawFams).length,
      generationCount: calculateGenerations(members, rootPersonId),
    },
  };
}

/**
 * Calculate max generation depth from root
 */
function calculateGenerations(members: Record<string, Person>, rootId: string): number {
  if (!rootId || !members[rootId]) return 1;
  let maxDepth = 1;

  function traverse(personId: string, currentDepth: number, visited: Set<string>) {
    if (visited.has(personId)) return;
    visited.add(personId);
    if (currentDepth > maxDepth) maxDepth = currentDepth;

    const person = members[personId];
    if (person && person.childIds) {
      for (const childId of person.childIds) {
        traverse(childId, currentDepth + 1, visited);
      }
    }
  }

  traverse(rootId, 1, new Set<string>());
  return maxDepth;
}

/**
 * Generate standard-compliant GEDCOM 5.5.1 export text
 */
export function exportGedcom(tree: FamilyTree): string {
  const lines: string[] = [
    '0 HEAD',
    '1 SOUR FAMILY_TREE_APP_MAKER',
    '2 VERS 1.0',
    '2 NAME Family Tree App Maker',
    '1 DEST ANY',
    `1 DATE ${new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}`,
    '1 GEDC',
    '2 VERS 5.5.1',
    '2 FORM LINEAGE-LINKED',
    '1 CHAR UTF-8',
  ];

  const members = Object.values(tree.members);
  const families: Record<string, { id: string; husb?: string; wife?: string; children: string[]; marrDate?: string; marrPlace?: string }> = {};

  // Build family pairings
  let famIndex = 1;
  const processedSpousePairs = new Set<string>();

  for (const person of members) {
    if (person.spouseIds && person.spouseIds.length > 0) {
      for (const spId of person.spouseIds) {
        const pairKey = [person.id, spId].sort().join('_');
        if (!processedSpousePairs.has(pairKey)) {
          processedSpousePairs.add(pairKey);
          const famId = `F${famIndex++}`;
          const isHusb = person.gender === 'male' || (tree.members[spId]?.gender === 'female');
          
          // Find shared children
          const sharedChildren = (person.childIds || []).filter((cId) =>
            (tree.members[spId]?.childIds || []).includes(cId)
          );

          // Find relationship metadata if any
          const rel = tree.relationships.find(
            (r) => (r.person1Id === person.id && r.person2Id === spId) || (r.person1Id === spId && r.person2Id === person.id)
          );

          families[famId] = {
            id: famId,
            husb: isHusb ? person.id : spId,
            wife: isHusb ? spId : person.id,
            children: sharedChildren,
            marrDate: rel?.marriageDate,
            marrPlace: rel?.marriagePlace,
          };
        }
      }
    }
  }

  // Handle single parent families for remaining children
  for (const person of members) {
    if (person.parentIds && person.parentIds.length === 1) {
      const parentId = person.parentIds[0];
      let existingFam = Object.values(families).find((f) => f.husb === parentId || f.wife === parentId);
      if (!existingFam) {
        const famId = `F${famIndex++}`;
        const parent = tree.members[parentId];
        families[famId] = {
          id: famId,
          husb: parent?.gender === 'male' ? parentId : undefined,
          wife: parent?.gender === 'female' ? parentId : undefined,
          children: [person.id],
        };
      } else if (!existingFam.children.includes(person.id)) {
        existingFam.children.push(person.id);
      }
    }
  }

  // Write Individuals
  for (const person of members) {
    lines.push(`0 @${person.id}@ INDI`);
    const lastName = person.lastName ? `/${person.lastName}/` : '//';
    lines.push(`1 NAME ${person.firstName} ${lastName}`.trim());
    if (person.firstName) lines.push(`2 GIVN ${person.firstName}`);
    if (person.lastName) lines.push(`2 SURN ${person.lastName}`);
    if (person.maidenName) lines.push(`2 _MARNM ${person.maidenName}`);
    if (person.nickname) lines.push(`2 NICK ${person.nickname}`);

    const sex = person.gender === 'male' ? 'M' : person.gender === 'female' ? 'F' : 'U';
    lines.push(`1 SEX ${sex}`);

    if (person.birthDate || person.birthPlace) {
      lines.push('1 BIRT');
      if (person.birthDate) lines.push(`2 DATE ${person.birthDate}`);
      if (person.birthPlace) lines.push(`2 PLAC ${person.birthPlace}`);
    }

    if (!person.isLiving || person.deathDate || person.deathPlace) {
      lines.push('1 DEAT Y');
      if (person.deathDate) lines.push(`2 DATE ${person.deathDate}`);
      if (person.deathPlace) lines.push(`2 PLAC ${person.deathPlace}`);
    }

    if (person.occupation) {
      lines.push(`1 OCCU ${person.occupation}`);
    }

    if (person.bio || person.notes) {
      const fullNote = [person.bio, person.notes].filter(Boolean).join('\n\n');
      const noteLines = fullNote.split('\n');
      if (noteLines.length > 0) {
        lines.push(`1 NOTE ${noteLines[0]}`);
        for (let j = 1; j < noteLines.length; j++) {
          lines.push(`2 CONT ${noteLines[j]}`);
        }
      }
    }

    // Link FAMS (families where person is spouse/parent)
    for (const [famId, fam] of Object.entries(families)) {
      if (fam.husb === person.id || fam.wife === person.id) {
        lines.push(`1 FAMS @${famId}@`);
      }
      if (fam.children.includes(person.id)) {
        lines.push(`1 FAMC @${famId}@`);
      }
    }
  }

  // Write Families
  for (const [famId, fam] of Object.entries(families)) {
    lines.push(`0 @${famId}@ FAM`);
    if (fam.husb) lines.push(`1 HUSB @${fam.husb}@`);
    if (fam.wife) lines.push(`1 WIFE @${fam.wife}@`);
    if (fam.marrDate || fam.marrPlace) {
      lines.push('1 MARR');
      if (fam.marrDate) lines.push(`2 DATE ${fam.marrDate}`);
      if (fam.marrPlace) lines.push(`2 PLAC ${fam.marrPlace}`);
    }
    for (const childId of fam.children) {
      lines.push(`1 CHIL @${childId}@`);
    }
  }

  lines.push('0 TRLR');
  return lines.join('\n');
}

/**
 * Parse CSV format for quick bulk genealogy import
 */
export function parseGenealogyCSV(csvText: string): Record<string, Person> {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return {};

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[\s_]/g, ''));
  const members: Record<string, Person> = {};

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parser supporting quotes
    const row = parseCsvRow(lines[i]);
    if (row.length === 0) continue;

    const data: Record<string, string> = {};
    headers.forEach((h, idx) => {
      data[h] = (row[idx] || '').trim();
    });

    const id = data.id || `P_${i}`;
    const firstName = data.firstname || data.givenname || data.name?.split(' ')[0] || 'Unknown';
    const lastName = data.lastname || data.surname || data.name?.split(' ').slice(1).join(' ') || '';
    const genderRaw = (data.gender || data.sex || '').toLowerCase();
    const gender: Gender = genderRaw.startsWith('m') ? 'male' : genderRaw.startsWith('f') ? 'female' : 'unknown';

    const parentIds = (data.parents || data.parentids || '').split(';').map((s) => s.trim()).filter(Boolean);
    const spouseIds = (data.spouses || data.spouseids || '').split(';').map((s) => s.trim()).filter(Boolean);
    const childIds = (data.children || data.childids || '').split(';').map((s) => s.trim()).filter(Boolean);

    members[id] = {
      id,
      firstName,
      lastName,
      maidenName: data.maidenname || undefined,
      gender,
      birthDate: data.birthdate || data.birth || undefined,
      birthPlace: data.birthplace || undefined,
      deathDate: data.deathdate || data.death || undefined,
      deathPlace: data.deathplace || undefined,
      isLiving: !data.deathdate && !data.death,
      occupation: data.occupation || undefined,
      bio: data.bio || data.biography || undefined,
      notes: data.notes || undefined,
      parentIds,
      spouseIds,
      childIds,
      tags: data.tags ? data.tags.split(';').map((t) => t.trim()) : [],
      updatedAt: new Date().toISOString(),
    };
  }

  // Cross-link parent/child references
  for (const person of Object.values(members)) {
    for (const pId of person.parentIds) {
      if (members[pId] && !members[pId].childIds.includes(person.id)) {
        members[pId].childIds.push(person.id);
      }
    }
    for (const cId of person.childIds) {
      if (members[cId] && !members[cId].parentIds.includes(person.id)) {
        members[cId].parentIds.push(person.id);
      }
    }
    for (const spId of person.spouseIds) {
      if (members[spId] && !members[spId].spouseIds.includes(person.id)) {
        members[spId].spouseIds.push(person.id);
      }
    }
  }

  return members;
}

function parseCsvRow(rowStr: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let currentVal = '';

  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];
    if (char === '"') {
      if (inQuotes && rowStr[i + 1] === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentVal);
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal);
  return result;
}

/**
 * Generate CSV export
 */
export function exportGenealogyCSV(tree: FamilyTree): string {
  const headers = [
    'ID',
    'FirstName',
    'LastName',
    'MaidenName',
    'Gender',
    'BirthDate',
    'BirthPlace',
    'DeathDate',
    'DeathPlace',
    'IsLiving',
    'Occupation',
    'Parents',
    'Spouses',
    'Children',
    'Bio',
  ];

  const rows = [headers.join(',')];

  for (const person of Object.values(tree.members)) {
    const row = [
      escapeCsv(person.id),
      escapeCsv(person.firstName),
      escapeCsv(person.lastName),
      escapeCsv(person.maidenName || ''),
      escapeCsv(person.gender),
      escapeCsv(person.birthDate || ''),
      escapeCsv(person.birthPlace || ''),
      escapeCsv(person.deathDate || ''),
      escapeCsv(person.deathPlace || ''),
      escapeCsv(person.isLiving ? 'true' : 'false'),
      escapeCsv(person.occupation || ''),
      escapeCsv((person.parentIds || []).join(';')),
      escapeCsv((person.spouseIds || []).join(';')),
      escapeCsv((person.childIds || []).join(';')),
      escapeCsv(person.bio || ''),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

function escapeCsv(str: string): string {
  if (!str) return '""';
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function parseGedcomToTree(gedcomText: string, currentTreeId = `tree_${Date.now()}`): FamilyTree {
  const result = parseGedcom(gedcomText);
  return {
    id: currentTreeId,
    name: result.treeName || 'Imported Lineage',
    description: `Imported with ${result.stats.individualCount} relatives across ${result.stats.generationCount} generations.`,
    rootPersonId: result.rootPersonId,
    members: result.members,
    relationships: result.relationships,
    media: result.media,
    mediaGallery: result.media,
    theme: 'parchment',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const exportTreeToGedcom = exportGedcom;
export const exportTreeToCSV = exportGenealogyCSV;

export function parseCsvToTree(csvText: string, currentTreeId = `tree_${Date.now()}`): FamilyTree {
  const members = parseGenealogyCSV(csvText);
  const firstId = Object.keys(members)[0] || '';
  return {
    id: currentTreeId,
    name: 'Imported CSV Lineage',
    description: `Imported spreadsheet containing ${Object.keys(members).length} family members.`,
    rootPersonId: firstId,
    members,
    relationships: [],
    media: [],
    mediaGallery: [],
    theme: 'parchment',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const SAMPLE_GEDCOM = `0 HEAD
1 SOUR FAMILY_HERITAGE
1 GEDC
2 VERS 5.5.1
2 FORM LINEAGE-LINKED
1 CHAR UTF-8
0 @p1@ INDI
1 NAME Alexander /Montgomery/
2 GIVN Alexander
2 SURN Montgomery
1 SEX M
1 BIRT
2 DATE 14 APR 1892
2 PLAC Edinburgh, Scotland
1 DEAT
2 DATE 03 NOV 1971
2 PLAC Boston, Massachusetts, USA
1 OCCU Master Botanist
1 FAMS @F1@
0 @p2@ INDI
1 NAME Isla /Sterling/
2 GIVN Isla
2 SURN Sterling
1 SEX F
1 BIRT
2 DATE 22 SEP 1896
2 PLAC Inverness, Scotland
1 DEAT
2 DATE 15 MAR 1984
1 FAMS @F1@
0 @p3@ INDI
1 NAME Douglas /Montgomery/
2 GIVN Douglas
2 SURN Montgomery
1 SEX M
1 BIRT
2 DATE 18 JUN 1922
2 PLAC Boston, Massachusetts, USA
1 FAMC @F1@
0 @F1@ FAM
1 HUSB @p1@
1 WIFE @p2@
1 MARR
2 DATE 12 SEP 1920
2 PLAC Edinburgh, Scotland
1 CHIL @p3@
0 TRLR`;

