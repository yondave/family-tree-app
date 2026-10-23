export type Gender = 'male' | 'female' | 'other' | 'unknown';

export interface MediaAttachment {
  id: string;
  url: string;
  title: string;
  caption?: string;
  year?: string;
  place?: string;
  taggedPersonIds: string[];
  uploadedBy: string;
  uploadedAt: string;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  maidenName?: string;
  nickname?: string;
  gender: Gender;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  isLiving: boolean;
  occupation?: string;
  avatarUrl?: string;
  bio?: string;
  notes?: string;
  parentIds: string[];
  spouseIds: string[];
  childIds: string[];
  tags?: string[];
  photos?: MediaAttachment[];
  customFields?: { key: string; value: string }[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface Relationship {
  id: string;
  type: 'spouse' | 'partner' | 'parent-child';
  person1Id: string;
  person2Id: string;
  marriageDate?: string;
  marriagePlace?: string;
  divorceDate?: string;
  status?: 'married' | 'divorced' | 'partner';
}

export type CollaboratorRole = 'owner' | 'editor' | 'viewer' | 'historian' | 'admin';

export interface Collaborator {
  id: string;
  name: string;
  email?: string;
  role: CollaboratorRole;
  avatar: string;
  color: string;
  lastActive: string;
  currentViewingPersonId?: string;
  isOnline: boolean;
}

export interface ActivityLog {
  id: string;
  treeId?: string;
  collaboratorId?: string;
  collaboratorName: string;
  collaboratorColor: string;
  action: 'added_person' | 'edited_person' | 'deleted_person' | 'added_photo' | 'imported_gedcom' | 'added_relationship' | 'generated_ai_story' | 'add_person' | 'edit_person' | 'upload_photo' | 'add_comment';
  details: string;
  timestamp: string;
  personId?: string;
}

export interface CommentItem {
  id: string;
  personId: string;
  author: string;
  authorColor?: string;
  avatar?: string;
  text: string;
  timestamp: string;
}

export type TreeTheme = 
  | 'parchment' 
  | 'modern-slate' 
  | 'emerald-heritage' 
  | 'royal-indigo' 
  | 'rose-wood' 
  | 'monochrome-charcoal';

export interface FamilyTree {
  id: string;
  name: string;
  description: string;
  rootPersonId: string;
  members: Record<string, Person>;
  relationships?: Relationship[];
  media?: MediaAttachment[];
  mediaGallery?: MediaAttachment[];
  collaborators?: Collaborator[];
  activityLogs?: ActivityLog[];
  comments?: CommentItem[];
  createdAt: string;
  updatedAt: string;
  theme: TreeTheme;
  shareCode?: string;
}

export type ViewMode = 'tree' | 'ancestor' | 'descendant' | 'fan' | 'timeline' | 'gallery' | 'collaboration';

export interface GedcomParseResult {
  treeName: string;
  rootPersonId: string;
  members: Record<string, Person>;
  relationships: Relationship[];
  media: MediaAttachment[];
  stats: {
    individualCount: number;
    familyCount: number;
    generationCount: number;
  };
}
