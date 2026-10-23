import React, { useState } from 'react';
import { X, Camera, Upload, Tag, Calendar, MapPin, Trash2, Filter, User } from 'lucide-react';
import { FamilyTree, MediaAttachment, Collaborator, Person } from '../types';

interface MediaGalleryModalProps {
  tree: FamilyTree;
  onClose: () => void;
  onUploadMedia: (media: Partial<MediaAttachment>) => void;
  onDeleteMedia?: (mediaId: string) => void;
  onSelectPerson: (personId: string) => void;
  currentCollaborator: Collaborator;
}

export const MediaGalleryModal: React.FC<MediaGalleryModalProps> = ({
  tree,
  onClose,
  onUploadMedia,
  onDeleteMedia,
  onSelectPerson,
  currentCollaborator,
}) => {
  const [selectedTagPersonId, setSelectedTagPersonId] = useState<string>('all');
  const [activeMediaPreview, setActiveMediaPreview] = useState<MediaAttachment | null>(null);

  // Upload state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [year, setYear] = useState('');
  const [taggedPersonId, setTaggedPersonId] = useState<string>('');

  const members = tree.members || {};

  // Aggregate all photos from tree.mediaGallery AND from individual persons' photo collections
  const allMedia: MediaAttachment[] = React.useMemo(() => {
    const gallery = [...(tree.mediaGallery || [])];
    const seenUrls = new Set(gallery.map((m) => m.url));

    (Object.values(members) as Person[]).forEach((p) => {
      (p.photos || []).forEach((photo) => {
        if (!seenUrls.has(photo.url)) {
          seenUrls.add(photo.url);
          gallery.push(photo);
        }
      });
      // Include avatar if present
      if (p.avatarUrl && !seenUrls.has(p.avatarUrl)) {
        seenUrls.add(p.avatarUrl);
        gallery.push({
          id: `avatar_${p.id}`,
          url: p.avatarUrl,
          title: `Portrait: ${p.firstName} ${p.lastName}`,
          caption: `Profile portrait for ${p.firstName} ${p.lastName}`,
          taggedPersonIds: [p.id],
          uploadedBy: 'System Archive',
          uploadedAt: p.updatedAt || new Date().toISOString(),
        });
      }
    });

    return gallery;
  }, [tree, members]);

  const filteredMedia = allMedia.filter((m) => {
    if (selectedTagPersonId === 'all') return true;
    return (m.taggedPersonIds || []).includes(selectedTagPersonId);
  });

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

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoPreview) return;

    onUploadMedia({
      url: photoPreview,
      title: title || 'Family Photograph',
      caption,
      year,
      taggedPersonIds: taggedPersonId ? [taggedPersonId] : [],
      uploadedBy: currentCollaborator.name,
    });

    setUploadFile(null);
    setPhotoPreview(null);
    setTitle('');
    setCaption('');
    setYear('');
    setShowUploadForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-amber-100">
                Heritage Photo & Archival Document Gallery
              </h2>
              <p className="text-xs text-stone-400">
                {allMedia.length} photographs and vintage artifacts across generations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{showUploadForm ? 'Close Upload' : 'Upload Photo'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-stone-800 rounded-full text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upload Form Expansion Drawer */}
        {showUploadForm && (
          <form onSubmit={handleUploadSubmit} className="p-6 bg-stone-50 border-b border-stone-200 animate-in slide-in-from-top-4 duration-200">
            <h3 className="font-display font-bold text-sm text-stone-900 mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-700" />
              <span>Upload New Photograph or Document</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <div className="sm:col-span-1">
                <label className="block w-full aspect-4/3 border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl overflow-hidden cursor-pointer bg-white flex flex-col items-center justify-center p-3 text-center transition-colors">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="space-y-1">
                      <Camera className="w-7 h-7 text-stone-400 mx-auto" />
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

              <div className="sm:col-span-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Title / Event
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Homestead Harvest, 1928"
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Year Taken
                    </label>
                    <input
                      type="text"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g. 1928"
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Tag Family Member
                  </label>
                  <select
                    value={taggedPersonId}
                    onChange={(e) => setTaggedPersonId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="">Unassigned / Whole Family</option>
                    {(Object.values(members) as Person[]).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Caption & Archival Notes
                  </label>
                  <textarea
                    rows={2}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Provide details about the location, people, and occasion..."
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!photoPreview}
                  className="w-full py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Add to Family Archive</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Filter Bar */}
        <div className="px-6 py-3 bg-stone-100/60 border-b border-stone-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-xs font-semibold text-stone-700">Filter by Relative:</span>
            <select
              value={selectedTagPersonId}
              onChange={(e) => setSelectedTagPersonId(e.target.value)}
              className="px-3 py-1 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Photos ({allMedia.length})</option>
              {(Object.values(members) as Person[]).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-stone-500 font-medium">
            Showing {filteredMedia.length} of {allMedia.length} photos
          </span>
        </div>

        {/* Media Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-50/30">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredMedia.map((media) => {
              const taggedPeople = (media.taggedPersonIds || [])
                .map((id) => members[id])
                .filter(Boolean);

              return (
                <div
                  key={media.id}
                  onClick={() => setActiveMediaPreview(media)}
                  className="group relative rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className="aspect-4/3 overflow-hidden bg-stone-100">
                    <img
                      src={media.url}
                      alt={media.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-display font-bold text-xs text-stone-900 truncate">
                        {media.title}
                      </h4>
                      {media.year && (
                        <p className="text-[10px] text-amber-800 font-semibold mt-0.5">
                          {media.year}
                        </p>
                      )}
                      {media.caption && (
                        <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-tight">
                          {media.caption}
                        </p>
                      )}
                    </div>

                    {/* Tagged people chips */}
                    {taggedPeople.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-stone-100">
                        {taggedPeople.map((p) => (
                          <span
                            key={p.id}
                            className="text-[9px] bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded font-medium truncate max-w-full"
                          >
                            {p.firstName} {p.lastName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredMedia.length === 0 && (
              <div className="col-span-full py-16 text-center text-stone-400 text-xs">
                No photographs match the selected filter. Click "Upload Photo" to attach vintage memories!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Large Preview Modal */}
      {activeMediaPreview && (
        <div
          onClick={() => setActiveMediaPreview(null)}
          className="fixed inset-0 z-60 bg-black/90 p-6 flex items-center justify-center backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[90vh] bg-stone-900 text-stone-100 rounded-3xl overflow-hidden border border-stone-800 flex flex-col md:flex-row shadow-2xl"
          >
            <div className="md:w-3/5 bg-black flex items-center justify-center p-4">
              <img
                src={activeMediaPreview.url}
                alt={activeMediaPreview.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
            <div className="md:w-2/5 p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-amber-100">
                    {activeMediaPreview.title}
                  </h3>
                  <button
                    onClick={() => setActiveMediaPreview(null)}
                    className="p-1 text-stone-400 hover:text-white rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {activeMediaPreview.year && (
                  <p className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Estimated Year: {activeMediaPreview.year}</span>
                  </p>
                )}

                {activeMediaPreview.caption && (
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {activeMediaPreview.caption}
                  </p>
                )}

                {/* Tagged Persons */}
                {(activeMediaPreview.taggedPersonIds || []).length > 0 && (
                  <div className="pt-3 border-t border-stone-800">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mb-2">
                      Tagged Relatives:
                    </p>
                    <div className="space-y-2">
                      {(activeMediaPreview.taggedPersonIds || []).map((id) => {
                        const p = members[id];
                        if (!p) return null;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setActiveMediaPreview(null);
                              onSelectPerson(p.id);
                            }}
                            className="p-2 bg-stone-800 hover:bg-stone-700 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <User className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs font-semibold text-stone-200">
                              {p.firstName} {p.lastName}
                            </span>
                            <span className="text-[10px] text-stone-400 ml-auto">View Profile →</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-stone-800 text-[10px] text-stone-500 flex items-center justify-between">
                <span>Uploaded by {activeMediaPreview.uploadedBy || 'Family Member'}</span>
                <span>{new Date(activeMediaPreview.uploadedAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
