import React, { useState } from 'react';
import { X, UserPlus, Heart, User, Calendar, MapPin, Briefcase } from 'lucide-react';
import { Person, Gender, FamilyTree } from '../types';

interface AddMemberModalProps {
  tree: FamilyTree;
  targetPersonId?: string;
  defaultRelationshipType?: 'child' | 'parent' | 'spouse' | 'root';
  onClose: () => void;
  onAddMember: (newPerson: Person, relationshipType?: 'child' | 'parent' | 'spouse' | 'root', targetId?: string) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  tree,
  targetPersonId,
  defaultRelationshipType = 'child',
  onClose,
  onAddMember,
}) => {
  const members = tree.members || {};
  const targetPerson = targetPersonId ? members[targetPersonId] : null;

  const [relType, setRelType] = useState<'child' | 'parent' | 'spouse' | 'root'>(
    defaultRelationshipType || (targetPerson ? 'child' : 'root')
  );
  const [selectedTargetId, setSelectedTargetId] = useState<string>(targetPersonId || '');

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState(targetPerson ? targetPerson.lastName : '');
  const [maidenName, setMaidenName] = useState('');
  const [gender, setGender] = useState<Gender>('unknown');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState(targetPerson?.birthPlace || '');
  const [deathDate, setDeathDate] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [isLiving, setIsLiving] = useState(true);
  const [occupation, setOccupation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;

    const newId = `p_${Date.now()}`;
    const newPerson: Person = {
      id: newId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      maidenName: maidenName.trim() || undefined,
      gender,
      birthDate: birthDate.trim() || undefined,
      birthPlace: birthPlace.trim() || undefined,
      deathDate: !isLiving && deathDate.trim() ? deathDate.trim() : undefined,
      deathPlace: !isLiving && deathPlace.trim() ? deathPlace.trim() : undefined,
      isLiving,
      occupation: occupation.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
      parentIds: [],
      spouseIds: [],
      childIds: [],
      tags: [],
      photos: [],
      updatedAt: new Date().toISOString(),
    };

    onAddMember(newPerson, relType, selectedTargetId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-amber-100">
                Add Family Member
              </h3>
              <p className="text-xs text-stone-400">
                Expand lineage with parents, spouses, children or ancestors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-800 rounded-full text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Relationship Connection Selector */}
          {Object.keys(members).length > 0 && (
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
              <label className="block text-xs font-semibold text-stone-700">
                Relationship Connection
              </label>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRelType('child')}
                  className={`p-2 rounded-xl font-medium border text-center transition-colors ${
                    relType === 'child'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  👶 Child
                </button>
                <button
                  type="button"
                  onClick={() => setRelType('spouse')}
                  className={`p-2 rounded-xl font-medium border text-center transition-colors ${
                    relType === 'spouse'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  💍 Spouse
                </button>
                <button
                  type="button"
                  onClick={() => setRelType('parent')}
                  className={`p-2 rounded-xl font-medium border text-center transition-colors ${
                    relType === 'parent'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  👴 Parent
                </button>
                <button
                  type="button"
                  onClick={() => setRelType('root')}
                  className={`p-2 rounded-xl font-medium border text-center transition-colors ${
                    relType === 'root'
                      ? 'bg-stone-800 text-white border-stone-800 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  🌳 New Branch
                </button>
              </div>

              {relType !== 'root' && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Connect to Existing Relative:
                  </label>
                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {(Object.values(members) as Person[]).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} {m.birthDate ? `(${m.birthDate.split('-')[0]})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Names & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                First / Given Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Fiona"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Last / Surname
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Montgomery"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Maiden Name (née)
              </label>
              <input
                type="text"
                value={maidenName}
                onChange={(e) => setMaidenName(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="unknown">Unknown</option>
                <option value="female">Female (♀)</option>
                <option value="male">Male (♂)</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Vitals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Birth Date (Year or YYYY-MM-DD)
              </label>
              <input
                type="text"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                placeholder="e.g. 1958 or 1958-05-12"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Birth Location
              </label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="e.g. Boston, Massachusetts"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Occupation / Trade
            </label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g. Astronomer, Teacher, Architect"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              Add Relative to Tree
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
