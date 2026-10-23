import React from 'react';
import { X, Palette, Check, Sparkles, Scroll, Leaf, LayoutGrid, Heart, Feather, Eye } from 'lucide-react';
import { TreeTheme, FamilyTree } from '../types';
import { THEMES, getThemeConfig } from '../utils/theme';

interface ThemeModalProps {
  tree: FamilyTree;
  isOpen: boolean;
  onClose: () => void;
  onSelectTheme: (theme: TreeTheme) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  tree,
  isOpen,
  onClose,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const currentTheme = tree.theme || 'parchment';

  const themeList = Object.values(THEMES);

  const getThemeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Scroll':
        return <Scroll className="w-5 h-5" />;
      case 'Leaf':
        return <Leaf className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'LayoutGrid':
        return <LayoutGrid className="w-5 h-5" />;
      case 'Heart':
        return <Heart className="w-5 h-5" />;
      case 'Feather':
        return <Feather className="w-5 h-5" />;
      default:
        return <Palette className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/90 flex items-center justify-center text-white shadow-inner">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-amber-100">
                Visual Lineage Themes & Aesthetics
              </h3>
              <p className="text-xs text-stone-400">
                Customize canvas textures, pedigree colorways, connector ink & typography
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-800 rounded-full text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-stone-50/50 max-h-[75vh] overflow-y-auto space-y-4">
          <p className="text-xs text-stone-600">
            Select an aesthetic for <strong>{tree.name}</strong>. The chosen theme automatically styles the dynamic tree canvas, pedigree ancestor charts, descendant branches, fan charts, and timelines.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {themeList.map((theme) => {
              const isSelected = currentTheme === theme.id;

              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    onSelectTheme(theme.id);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'border-amber-600 bg-white ring-2 ring-amber-500/20 shadow-md scale-[1.01]'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs'
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Header info */}
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white bg-gradient-to-br ${theme.previewGradient} shadow-sm border border-black/10`}>
                      <span className="text-stone-800 drop-shadow-xs">
                        {getThemeIcon(theme.iconName)}
                      </span>
                    </div>

                    <div className="pr-6">
                      <h4 className="font-display font-bold text-sm text-stone-900 leading-tight">
                        {theme.name}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                        {theme.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Visual Preview Box */}
                  <div className={`mt-3.5 p-3 rounded-xl border border-stone-200/80 ${theme.canvasBgClass} relative overflow-hidden`}>
                    {/* Simulated Mini Card */}
                    <div className={`p-2.5 rounded-lg border ${theme.cardBgClass} ${theme.cardBorderClass} ${theme.cardShadowClass} flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-stone-300 ring-1 ring-white/50" />
                        <div>
                          <div className={`text-[11px] font-bold ${theme.textPrimaryClass}`}>
                            Alexander Vance
                          </div>
                          <div className={`text-[9px] ${theme.textMutedClass}`}>
                            1892 – 1971
                          </div>
                        </div>
                      </div>

                      {/* Swatch dots */}
                      <div className="flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: theme.spouseLineColor }}
                          title="Spouse line"
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: theme.parentLineColor }}
                          title="Parent line"
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: theme.fanRootColor }}
                          title="Accent hue"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer button */}
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-stone-100 text-[11px]">
                    <span className="text-stone-400">
                      {theme.id.replace('-', ' ')}
                    </span>
                    <span className={`font-semibold ${isSelected ? 'text-amber-800' : 'text-stone-600 group-hover:text-amber-700'}`}>
                      {isSelected ? 'Active Theme' : 'Apply Theme'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-stone-100/90 border-t border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Theme auto-saves to your family tree settings</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
