import React, { useState } from 'react';
import { 
  X, 
  User, 
  Heart, 
  Camera, 
  Sparkles, 
  MessageSquare, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Trash2, 
  Save, 
  Plus, 
  HelpCircle,
  FileText,
  Upload,
  Link,
  Check,
  Share2,
  BookOpen
} from 'lucide-react';
import { Person, FamilyTree, Collaborator, Gender, MediaAttachment, CommentItem } from '../types';

interface PersonDetailModalProps {
  person: Person;
  tree: FamilyTree;
  onClose: () => void;
  onUpdatePerson: (updatedPerson: Person, logMessage?: string) => void;
  onDeletePerson: (personId: string) => void;
  onAddRelative: (personId: string, relationshipType: 'child' | 'parent' | 'spouse') => void;
  onSelectPerson: (personId: string) => void;
  currentCollaborator: Collaborator;
  onUploadMedia: (media: Partial<MediaAttachment>) => void;
  onAddComment: (personId: string, commentText: string) => void;
  initialTab?: 'vitals' | 'relations' | 'photos' | 'ai-story' | 'interview' | 'comments';
}

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  person,
  tree,
  onClose,
  onUpdatePerson,
  onDeletePerson,
  onAddRelative,
  onSelectPerson,
  currentCollaborator,
  onUploadMedia,
  onAddComment,
  initialTab = 'vitals',
}) => {
  const [activeTab, setActiveTab] = useState<'vitals' | 'relations' | 'photos' | 'ai-story' | 'interview' | 'comments'>(initialTab);
  
  // Local Form State
  const [formData, setFormData] = useState<Person>({ ...person });
  const [newCommentText, setNewCommentText] = useState('');
  
  // AI Story Generator State
  const [storyStyle, setStoryStyle] = useState<'biographical' | 'narrative'>('biographical');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [generatedStory, setGeneratedStory] = useState(formData.bio || '');
  const [storyError, setStoryError] = useState<string | null>(null);

  // Elder Interview State
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<{ question: string; purpose: string; theme: string }[]>([]);

  // Photo Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoYear, setPhotoYear] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const members = tree.members || {};

  const handleInputChange = (field: keyof Person, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdatePerson(formData, `Updated profile records for ${formData.firstName} ${formData.lastName}.`);
    onClose();
  };

  // AI Story Generation
  const handleGenerateStory = async () => {
    setIsGeneratingStory(true);
    setStoryError(null);
    try {
      const response = await fetch('/api/ai/generate-biography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person: formData,
          style: storyStyle,
          familyContext: `Part of ${tree.name}`,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate story');

      setGeneratedStory(data.biography);
      setFormData((prev) => ({ ...prev, bio: data.biography }));
    } catch (err: any) {
      setStoryError(err.message || 'Error communicating with AI Assistant');
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // AI Interview Prompts
  const handleGeneratePrompts = async () => {
    setIsGeneratingPrompts(true);
    try {
      const response = await fetch('/api/ai/elder-interview-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person: formData }),
      });
      const data = await response.json();
      if (data.questions) {
        setInterviewQuestions(data.questions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  // Handle Photo File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Photo Upload
  const handleUploadPhotoSubmit = () => {
    if (!photoPreview) return;
    setIsUploadingPhoto(true);

    const mediaItem: Partial<MediaAttachment> = {
      url: photoPreview,
      title: photoTitle || `Photo of ${formData.firstName} ${formData.lastName}`,
      caption: photoCaption,
      year: photoYear,
      taggedPersonIds: [formData.id],
      uploadedBy: currentCollaborator.name,
    };

    onUploadMedia(mediaItem);

    // If no avatar, set this as primary avatar
    if (!formData.avatarUrl) {
      setFormData((prev) => ({ ...prev, avatarUrl: photoPreview }));
    }

    setUploadFile(null);
    setPhotoPreview(null);
    setPhotoTitle('');
    setPhotoCaption('');
    setPhotoYear('');
    setIsUploadingPhoto(false);
  };

  // Post Comment
  const handlePostComment = () => {
    if (!newCommentText.trim()) return;
    onAddComment(formData.id, newCommentText.trim());
    setNewCommentText('');
  };

  const comments = (tree.comments || []).filter((c) => c.personId === formData.id);

  // Relatives lookup
  const parents = (formData.parentIds || []).map((id) => members[id]).filter(Boolean);
  const spouses = (formData.spouseIds || []).map((id) => members[id]).filter(Boolean);
  const children = (formData.childIds || []).map((id) => members[id]).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-400/80 bg-stone-800 flex-shrink-0 flex items-center justify-center font-bold text-sm">
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt={formData.firstName} className="w-full h-full object-cover" />
              ) : (
                `${formData.firstName[0]}${formData.lastName ? formData.lastName[0] : ''}`
              )}
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-amber-100 flex items-center gap-2">
                <span>{formData.firstName} {formData.lastName}</span>
                {formData.maidenName && (
                  <span className="text-xs text-stone-400 font-normal italic">
                    (née {formData.maidenName})
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-400 flex items-center gap-2">
                <span>ID: {formData.id}</span>
                <span>•</span>
                <span>{formData.isLiving ? 'Living' : 'Deceased'}</span>
                {formData.occupation && (
                  <>
                    <span>•</span>
                    <span className="text-amber-300">{formData.occupation}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-stone-800 rounded-full text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-stone-100/80 border-b border-stone-200 flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          <button
            onClick={() => setActiveTab('vitals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'vitals'
                ? 'bg-white text-amber-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-amber-700" />
            <span>Vital Records</span>
          </button>

          <button
            onClick={() => setActiveTab('relations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'relations'
                ? 'bg-white text-amber-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-600" />
            <span>Family Links ({parents.length + spouses.length + children.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'photos'
                ? 'bg-white text-amber-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-amber-600" />
            <span>Photos & Gallery ({(formData.photos || []).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-story')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'ai-story'
                ? 'bg-white text-amber-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Story & Biography</span>
          </button>

          <button
            onClick={() => setActiveTab('interview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'interview'
                ? 'bg-white text-amber-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Elder Oral Interview</span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'comments'
                ? 'bg-white text-amber-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Family Notes ({comments.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-50/40">
          
          {/* TAB 1: Vital Records */}
          {activeTab === 'vitals' && (
            <div className="space-y-6">
              {/* Primary Names & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    First / Given Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. Alexander"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Last / Surname
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. Montgomery"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Maiden Name (née)
                  </label>
                  <input
                    type="text"
                    value={formData.maidenName || ''}
                    onChange={(e) => handleInputChange('maidenName', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. MacKenzie"
                  />
                </div>
              </div>

              {/* Gender & Profile Avatar URL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value as Gender)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="male">Male (♂)</option>
                    <option value="female">Female (♀)</option>
                    <option value="other">Other</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Profile Portrait Photo URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.avatarUrl || ''}
                      onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="https://... or upload in Photos tab"
                    />
                  </div>
                </div>
              </div>

              {/* Birth & Death Vitals */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-stone-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-700" />
                    <span>Birth & Lifespan Records</span>
                  </h3>
                  <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isLiving}
                      onChange={(e) => handleInputChange('isLiving', e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span>Is Currently Living</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Birth Date (YYYY-MM-DD or Year)
                    </label>
                    <input
                      type="text"
                      value={formData.birthDate || ''}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="1892-04-14 or 1892"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Birth Location / Town & Country
                    </label>
                    <input
                      type="text"
                      value={formData.birthPlace || ''}
                      onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="Edinburgh, Scotland"
                    />
                  </div>
                </div>

                {!formData.isLiving && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Death Date
                      </label>
                      <input
                        type="text"
                        value={formData.deathDate || ''}
                        onChange={(e) => handleInputChange('deathDate', e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="1971-11-03"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Death Location / Resting Place
                      </label>
                      <input
                        type="text"
                        value={formData.deathPlace || ''}
                        onChange={(e) => handleInputChange('deathPlace', e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="Boston, Massachusetts"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Occupation & General Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Occupation / Trade / Calling
                  </label>
                  <input
                    type="text"
                    value={formData.occupation || ''}
                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. Master Botanist & Expedition Leader"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Historical Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(formData.tags || []).join(', ')}
                    onChange={(e) =>
                      handleInputChange(
                        'tags',
                        e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="Botanist, WWI, Highland Origin"
                  />
                </div>
              </div>

              {/* Delete person option */}
              <div className="pt-6 border-t border-stone-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove ${formData.firstName} ${formData.lastName} from the tree?`)) {
                      onDeletePerson(formData.id);
                      onClose();
                    }
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1.5 p-2 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Relative from Tree</span>
                </button>

                <p className="text-[11px] text-stone-400">
                  Last updated {formData.updatedAt ? new Date(formData.updatedAt).toLocaleDateString() : 'recently'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Family Links */}
          {activeTab === 'relations' && (
            <div className="space-y-6">
              
              {/* Parents Section */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-sm text-stone-900 flex items-center gap-2">
                    <span>Parents ({parents.length}/2)</span>
                  </h3>
                  <button
                    onClick={() => onAddRelative(formData.id, 'parent')}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Parent</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {parents.map((parent) => (
                    <div
                      key={parent.id}
                      onClick={() => onSelectPerson(parent.id)}
                      className="p-3 bg-stone-50 hover:bg-amber-50/50 rounded-xl border border-stone-200 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-300 bg-white flex-shrink-0 flex items-center justify-center font-bold text-xs">
                          {parent.avatarUrl ? (
                            <img src={parent.avatarUrl} alt={parent.firstName} className="w-full h-full object-cover" />
                          ) : (
                            `${parent.firstName[0]}`
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-stone-900">{parent.firstName} {parent.lastName}</p>
                          <p className="text-[10px] text-stone-500">
                            {parent.gender === 'male' ? 'Father' : parent.gender === 'female' ? 'Mother' : 'Parent'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-amber-700 font-medium">View →</span>
                    </div>
                  ))}
                  {parents.length === 0 && (
                    <p className="text-xs text-stone-400 italic py-2">No parents linked yet.</p>
                  )}
                </div>
              </div>

              {/* Spouses & Partners Section */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-sm text-stone-900 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span>Spouses & Partners ({spouses.length})</span>
                  </h3>
                  <button
                    onClick={() => onAddRelative(formData.id, 'spouse')}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Spouse</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {spouses.map((spouse) => (
                    <div
                      key={spouse.id}
                      onClick={() => onSelectPerson(spouse.id)}
                      className="p-3 bg-rose-50/30 hover:bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-rose-300 bg-white flex-shrink-0 flex items-center justify-center font-bold text-xs">
                          {spouse.avatarUrl ? (
                            <img src={spouse.avatarUrl} alt={spouse.firstName} className="w-full h-full object-cover" />
                          ) : (
                            `${spouse.firstName[0]}`
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-stone-900">{spouse.firstName} {spouse.lastName}</p>
                          <p className="text-[10px] text-stone-500">Spouse / Partner</p>
                        </div>
                      </div>
                      <span className="text-xs text-rose-700 font-medium">View →</span>
                    </div>
                  ))}
                  {spouses.length === 0 && (
                    <p className="text-xs text-stone-400 italic py-2">No spouse or partner recorded.</p>
                  )}
                </div>
              </div>

              {/* Children Section */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-sm text-stone-900 flex items-center gap-2">
                    <span>Children ({children.length})</span>
                  </h3>
                  <button
                    onClick={() => onAddRelative(formData.id, 'child')}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Child</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {children.map((child) => (
                    <div
                      key={child.id}
                      onClick={() => onSelectPerson(child.id)}
                      className="p-3 bg-stone-50 hover:bg-amber-50/50 rounded-xl border border-stone-200 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-300 bg-white flex-shrink-0 flex items-center justify-center font-bold text-xs">
                          {child.avatarUrl ? (
                            <img src={child.avatarUrl} alt={child.firstName} className="w-full h-full object-cover" />
                          ) : (
                            `${child.firstName[0]}`
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-stone-900">{child.firstName} {child.lastName}</p>
                          <p className="text-[10px] text-stone-500">
                            {child.birthDate ? `b. ${child.birthDate.split('-')[0]}` : 'Child'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-amber-700 font-medium">View →</span>
                    </div>
                  ))}
                  {children.length === 0 && (
                    <p className="text-xs text-stone-400 italic py-2">No children added yet.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Photos & Gallery */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              
              {/* Upload New Photograph Form */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <h3 className="font-display font-bold text-sm text-stone-900 mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-700" />
                  <span>Attach Photograph or Historic Document</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                  
                  {/* Image Picker / Drop area */}
                  <div className="sm:col-span-1">
                    <label className="block w-full aspect-square border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl overflow-hidden cursor-pointer bg-stone-50 flex flex-col items-center justify-center p-4 text-center transition-colors">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="space-y-2">
                          <Camera className="w-8 h-8 text-stone-400 mx-auto" />
                          <p className="text-xs font-semibold text-stone-700">Choose Image</p>
                          <p className="text-[10px] text-stone-400">PNG, JPG, WebP</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Metadata fields */}
                  <div className="sm:col-span-2 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Photo Title
                      </label>
                      <input
                        type="text"
                        value={photoTitle}
                        onChange={(e) => setPhotoTitle(e.target.value)}
                        placeholder="e.g. Wedding Portrait in Edinburgh, 1920"
                        className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Year / Era Taken
                        </label>
                        <input
                          type="text"
                          value={photoYear}
                          onChange={(e) => setPhotoYear(e.target.value)}
                          placeholder="e.g. 1924"
                          className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Uploaded By
                        </label>
                        <input
                          type="text"
                          disabled
                          value={currentCollaborator.name}
                          className="w-full px-3 py-1.5 bg-stone-100 border border-stone-300 rounded-xl text-xs text-stone-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Caption & Memory Description
                      </label>
                      <textarea
                        rows={2}
                        value={photoCaption}
                        onChange={(e) => setPhotoCaption(e.target.value)}
                        placeholder="Describe the context, location, and who is in the photo..."
                        className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={!photoPreview || isUploadingPhoto}
                      onClick={handleUploadPhotoSubmit}
                      className="w-full py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Attach Photo to {formData.firstName}</span>
                    </button>
                  </div>

                </div>
              </div>

              {/* Gallery List of Photos */}
              <div>
                <h4 className="font-display font-bold text-sm text-stone-900 mb-3">
                  Attached Photographs & Archival Records
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(formData.photos || []).map((photo) => (
                    <div key={photo.id} className="group relative rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-xs">
                      <div className="aspect-4/3 overflow-hidden bg-stone-100">
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-2.5">
                        <p className="font-semibold text-xs text-stone-900 truncate">{photo.title}</p>
                        {photo.year && <p className="text-[10px] text-amber-800 font-medium">{photo.year}</p>}
                        {photo.caption && <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">{photo.caption}</p>}
                        
                        <button
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, avatarUrl: photo.url }));
                          }}
                          className="mt-2 text-[10px] font-semibold text-amber-700 hover:text-amber-900 block"
                        >
                          Set as Profile Avatar
                        </button>
                      </div>
                    </div>
                  ))}

                  {(formData.photos || []).length === 0 && (
                    <div className="col-span-full py-8 text-center text-stone-400 text-xs">
                      No photographs attached yet. Upload a vintage snapshot above!
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: AI Heritage Story & Biography */}
          {activeTab === 'ai-story' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-xs text-amber-900">
                  <p className="font-bold">AI Heritage Biographer (Gemini AI)</p>
                  <p className="mt-0.5 opacity-90">
                    Automatically synthesizes historical context, world events, and era details based on {formData.firstName}'s vital dates and trade.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-semibold text-stone-700">Writing Style:</label>
                <div className="flex bg-stone-200/80 p-0.5 rounded-xl text-xs">
                  <button
                    onClick={() => setStoryStyle('biographical')}
                    className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                      storyStyle === 'biographical' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600'
                    }`}
                  >
                    Historical Lineage Entry
                  </button>
                  <button
                    onClick={() => setStoryStyle('narrative')}
                    className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                      storyStyle === 'narrative' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600'
                    }`}
                  >
                    Engaging Heritage Memoir
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isGeneratingStory}
                  onClick={handleGenerateStory}
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all ml-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingStory ? 'Writing Historical Prose...' : 'Generate AI Story'}</span>
                </button>
              </div>

              {storyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {storyError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Biographical Narrative (Editable)
                </label>
                <textarea
                  rows={9}
                  value={formData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Click 'Generate AI Story' or write personal memories and life accounts here..."
                  className="w-full p-4 bg-white border border-stone-300 rounded-2xl text-xs sm:text-sm text-stone-900 leading-relaxed focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-inner"
                />
              </div>
            </div>
          )}

          {/* TAB 5: Elder Interview Prompts */}
          {activeTab === 'interview' && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-xs text-emerald-950">
                  <p className="font-bold">Oral History Interview Guide</p>
                  <p className="mt-0.5 opacity-90">
                    Use these AI-generated questions when interviewing older relatives or recording family oral history sessions.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isGeneratingPrompts}
                  onClick={handleGeneratePrompts}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex-shrink-0"
                >
                  {isGeneratingPrompts ? 'Generating...' : 'Generate New Questions'}
                </button>
              </div>

              <div className="space-y-3">
                {interviewQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {q.theme}
                      </span>
                      <span className="text-[10px] text-stone-400">Question #{idx + 1}</span>
                    </div>
                    <p className="font-display font-semibold text-sm text-stone-900">
                      "{q.question}"
                    </p>
                    <p className="text-[11px] text-stone-500 italic">
                      Genealogical Goal: {q.purpose}
                    </p>
                  </div>
                ))}

                {interviewQuestions.length === 0 && (
                  <div className="text-center py-8 bg-white rounded-2xl border border-stone-200">
                    <p className="text-xs text-stone-500">
                      Click the button above to generate personalized oral history prompts tailored to {formData.firstName}'s era.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: Collaboration Comments */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm text-stone-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-700" />
                  <span>Family Notes & Relative Contributions</span>
                </h3>
                <span className="text-xs text-stone-500">{comments.length} notes posted</span>
              </div>

              {/* New Comment Input */}
              <div className="bg-white p-3 rounded-2xl border border-stone-200 flex gap-2">
                <img
                  src={currentCollaborator.avatar}
                  alt={currentCollaborator.name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-amber-500"
                />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                    placeholder={`Add a memory or oral story as ${currentCollaborator.name.split(' ')[0]}...`}
                    className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    onClick={handlePostComment}
                    className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>

              {/* Comment Thread List */}
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-start gap-3">
                    <img
                      src={c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={c.author}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-stone-900" style={{ color: c.authorColor }}>
                          {c.author}
                        </span>
                        <span className="text-[10px] text-stone-400">{c.timestamp}</span>
                      </div>
                      <p className="text-xs text-stone-700 mt-1 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="text-center py-6 text-stone-400 text-xs">
                    No notes yet. Be the first relative to contribute a memory!
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
