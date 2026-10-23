import React from 'react';
import { TreeTheme } from '../types';

export interface ThemeConfig {
  id: TreeTheme;
  name: string;
  subtitle: string;
  iconName: string;
  dot: string;
  previewGradient: string;
  canvasBgClass: string;
  canvasBgStyle?: React.CSSProperties;
  cardBgClass: string;
  cardBorderClass: string;
  cardShadowClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
  textMutedClass: string;
  accentPrimaryClass: string;
  accentBgClass: string;
  accentBorderClass: string;
  spouseLineColor: string;
  parentLineColor: string;
  forkLineColor: string;
  fanRootColor: string;
  fanPaternalColors: string[];
  fanMaternalColors: string[];
  timelineEraBg: string;
  timelineBarGrad: {
    male: string;
    female: string;
    other: string;
  };
  maleCardBorder: string;
  femaleCardBorder: string;
  otherCardBorder: string;
}

export const THEMES: Record<TreeTheme, ThemeConfig> = {
  parchment: {
    id: 'parchment',
    name: 'Vintage Heirloom Parchment',
    subtitle: 'Warm antique parchment, sepia ink & golden amber accents',
    iconName: 'Scroll',
    dot: 'bg-amber-600',
    previewGradient: 'from-[#fbf8f2] via-[#f5eedc] to-[#e6d5bc]',
    canvasBgClass: 'tree-parchment-bg text-stone-900',
    cardBgClass: 'bg-[#fffdfa]/95 backdrop-blur-xs',
    cardBorderClass: 'border-amber-900/20',
    cardShadowClass: 'shadow-[0_4px_16px_rgba(120,53,15,0.08)]',
    textPrimaryClass: 'text-stone-900',
    textSecondaryClass: 'text-stone-700',
    textMutedClass: 'text-amber-900/60',
    accentPrimaryClass: 'text-amber-800',
    accentBgClass: 'bg-amber-100/80 text-amber-900',
    accentBorderClass: 'border-amber-300',
    spouseLineColor: '#b45309',
    parentLineColor: '#78350f',
    forkLineColor: '#92400e',
    fanRootColor: '#d97706',
    fanPaternalColors: ['#f59e0b', '#d97706', '#b45309', '#78350f'],
    fanMaternalColors: ['#10b981', '#059669', '#047857', '#064e3b'],
    timelineEraBg: 'bg-amber-50/50 border-amber-200',
    timelineBarGrad: {
      male: 'from-amber-600 to-amber-700',
      female: 'from-rose-600 to-rose-700',
      other: 'from-amber-500 to-amber-600',
    },
    maleCardBorder: 'border-sky-400/70 ring-sky-400/20',
    femaleCardBorder: 'border-rose-400/70 ring-rose-400/20',
    otherCardBorder: 'border-amber-400/70 ring-amber-400/20',
  },

  'emerald-heritage': {
    id: 'emerald-heritage',
    name: 'Botanical Dynasty',
    subtitle: 'Evergreen forest backdrop, lustrous gold leaf & jade rings',
    iconName: 'Leaf',
    dot: 'bg-emerald-500',
    previewGradient: 'from-[#062419] via-[#0b3d2b] to-[#041a12]',
    canvasBgClass: 'bg-gradient-to-br from-[#062419] via-[#083022] to-[#03150e] text-emerald-50',
    cardBgClass: 'bg-[#0b3828]/90 backdrop-blur-md',
    cardBorderClass: 'border-emerald-500/30 ring-1 ring-emerald-400/10',
    cardShadowClass: 'shadow-[0_6px_20px_rgba(0,0,0,0.35)]',
    textPrimaryClass: 'text-emerald-50',
    textSecondaryClass: 'text-emerald-200',
    textMutedClass: 'text-emerald-300/60',
    accentPrimaryClass: 'text-amber-300',
    accentBgClass: 'bg-emerald-900/80 text-amber-200 border border-emerald-700/60',
    accentBorderClass: 'border-emerald-500/50',
    spouseLineColor: '#f59e0b',
    parentLineColor: '#34d399',
    forkLineColor: '#10b981',
    fanRootColor: '#10b981',
    fanPaternalColors: ['#34d399', '#10b981', '#059669', '#047857'],
    fanMaternalColors: ['#fbbf24', '#f59e0b', '#d97706', '#b45309'],
    timelineEraBg: 'bg-emerald-950/60 border-emerald-800',
    timelineBarGrad: {
      male: 'from-emerald-500 to-teal-700',
      female: 'from-amber-500 to-amber-700',
      other: 'from-emerald-400 to-emerald-600',
    },
    maleCardBorder: 'border-teal-400/80 ring-teal-400/20',
    femaleCardBorder: 'border-amber-400/80 ring-amber-400/20',
    otherCardBorder: 'border-emerald-400/80 ring-emerald-400/20',
  },

  'royal-indigo': {
    id: 'royal-indigo',
    name: 'Midnight Celestial Archive',
    subtitle: 'Deep starry navy, celestial sapphire lines & luminous silver accents',
    iconName: 'Sparkles',
    dot: 'bg-indigo-400',
    previewGradient: 'from-[#0b112c] via-[#161c47] to-[#080d22]',
    canvasBgClass: 'bg-gradient-to-br from-[#0b112c] via-[#131940] to-[#070b1e] text-indigo-50',
    cardBgClass: 'bg-[#151c4a]/90 backdrop-blur-md',
    cardBorderClass: 'border-indigo-400/30 ring-1 ring-indigo-300/10',
    cardShadowClass: 'shadow-[0_6px_20px_rgba(0,0,0,0.4)]',
    textPrimaryClass: 'text-indigo-50',
    textSecondaryClass: 'text-indigo-200',
    textMutedClass: 'text-indigo-300/60',
    accentPrimaryClass: 'text-cyan-300',
    accentBgClass: 'bg-indigo-900/80 text-cyan-200 border border-indigo-700/60',
    accentBorderClass: 'border-indigo-400/50',
    spouseLineColor: '#ec4899',
    parentLineColor: '#818cf8',
    forkLineColor: '#6366f1',
    fanRootColor: '#6366f1',
    fanPaternalColors: ['#818cf8', '#6366f1', '#4f46e5', '#3730a3'],
    fanMaternalColors: ['#f472b6', '#ec4899', '#db2777', '#9d174d'],
    timelineEraBg: 'bg-indigo-950/60 border-indigo-800',
    timelineBarGrad: {
      male: 'from-indigo-500 to-blue-700',
      female: 'from-pink-500 to-rose-700',
      other: 'from-indigo-400 to-indigo-600',
    },
    maleCardBorder: 'border-sky-400/80 ring-sky-400/20',
    femaleCardBorder: 'border-pink-400/80 ring-pink-400/20',
    otherCardBorder: 'border-indigo-400/80 ring-indigo-400/20',
  },

  'modern-slate': {
    id: 'modern-slate',
    name: 'Contemporary Slate & Steel',
    subtitle: 'Refined crisp minimalist canvas, cool gray cards & sky blue accents',
    iconName: 'LayoutGrid',
    dot: 'bg-sky-500',
    previewGradient: 'from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]',
    canvasBgClass: 'bg-[#f8fafc] text-slate-900 tree-grid-bg',
    cardBgClass: 'bg-white/95 backdrop-blur-xs',
    cardBorderClass: 'border-slate-200',
    cardShadowClass: 'shadow-[0_4px_16px_rgba(15,23,42,0.06)]',
    textPrimaryClass: 'text-slate-900',
    textSecondaryClass: 'text-slate-700',
    textMutedClass: 'text-slate-500',
    accentPrimaryClass: 'text-sky-700',
    accentBgClass: 'bg-sky-50 text-sky-800 border border-sky-200',
    accentBorderClass: 'border-sky-300',
    spouseLineColor: '#0284c7',
    parentLineColor: '#475569',
    forkLineColor: '#64748b',
    fanRootColor: '#0284c7',
    fanPaternalColors: ['#38bdf8', '#0284c7', '#0369a1', '#075985'],
    fanMaternalColors: ['#a855f7', '#9333ea', '#7e22ce', '#6b21a8'],
    timelineEraBg: 'bg-slate-100/60 border-slate-300',
    timelineBarGrad: {
      male: 'from-sky-600 to-blue-700',
      female: 'from-purple-600 to-purple-800',
      other: 'from-slate-600 to-slate-800',
    },
    maleCardBorder: 'border-sky-400/70 ring-sky-400/20',
    femaleCardBorder: 'border-purple-400/70 ring-purple-400/20',
    otherCardBorder: 'border-slate-400/70 ring-slate-400/20',
  },

  'rose-wood': {
    id: 'rose-wood',
    name: 'Victorian Rosewood',
    subtitle: 'Antique mahogany warmth, blush rose accents & romantic heritage',
    iconName: 'Heart',
    dot: 'bg-rose-500',
    previewGradient: 'from-[#fff5f5] via-[#fae8e8] to-[#f4d6d6]',
    canvasBgClass: 'bg-[#faf5f5] text-stone-900',
    cardBgClass: 'bg-white/95 backdrop-blur-xs',
    cardBorderClass: 'border-rose-200/80',
    cardShadowClass: 'shadow-[0_4px_16px_rgba(225,29,72,0.06)]',
    textPrimaryClass: 'text-stone-900',
    textSecondaryClass: 'text-stone-700',
    textMutedClass: 'text-rose-900/60',
    accentPrimaryClass: 'text-rose-800',
    accentBgClass: 'bg-rose-50 text-rose-800 border border-rose-200',
    accentBorderClass: 'border-rose-300',
    spouseLineColor: '#e11d48',
    parentLineColor: '#881337',
    forkLineColor: '#9f1239',
    fanRootColor: '#e11d48',
    fanPaternalColors: ['#fb7185', '#f43f5e', '#e11d48', '#be123c'],
    fanMaternalColors: ['#c084fc', '#a855f7', '#9333ea', '#7e22ce'],
    timelineEraBg: 'bg-rose-50/60 border-rose-200',
    timelineBarGrad: {
      male: 'from-amber-600 to-rose-700',
      female: 'from-rose-500 to-pink-700',
      other: 'from-rose-400 to-rose-600',
    },
    maleCardBorder: 'border-amber-400/70 ring-amber-400/20',
    femaleCardBorder: 'border-rose-400/70 ring-rose-400/20',
    otherCardBorder: 'border-pink-400/70 ring-pink-400/20',
  },

  'monochrome-charcoal': {
    id: 'monochrome-charcoal',
    name: 'Archival Monochrome Noir',
    subtitle: 'High-contrast black & white archival print styling with crisp linework',
    iconName: 'Feather',
    dot: 'bg-stone-900',
    previewGradient: 'from-[#1c1917] via-[#292524] to-[#0c0a09]',
    canvasBgClass: 'bg-[#18181b] text-zinc-100',
    cardBgClass: 'bg-[#27272a]/95 backdrop-blur-md',
    cardBorderClass: 'border-zinc-700 ring-1 ring-zinc-600/30',
    cardShadowClass: 'shadow-[0_6px_20px_rgba(0,0,0,0.5)]',
    textPrimaryClass: 'text-zinc-100',
    textSecondaryClass: 'text-zinc-300',
    textMutedClass: 'text-zinc-400',
    accentPrimaryClass: 'text-white',
    accentBgClass: 'bg-zinc-800 text-zinc-200 border border-zinc-600',
    accentBorderClass: 'border-zinc-500',
    spouseLineColor: '#d4d4d8',
    parentLineColor: '#a1a1aa',
    forkLineColor: '#71717a',
    fanRootColor: '#e4e4e7',
    fanPaternalColors: ['#e4e4e7', '#d4d4d8', '#a1a1aa', '#71717a'],
    fanMaternalColors: ['#cbd5e1', '#94a3b8', '#64748b', '#475569'],
    timelineEraBg: 'bg-zinc-900/80 border-zinc-700',
    timelineBarGrad: {
      male: 'from-zinc-400 to-zinc-600',
      female: 'from-zinc-300 to-zinc-500',
      other: 'from-zinc-500 to-zinc-700',
    },
    maleCardBorder: 'border-zinc-400 ring-zinc-400/20',
    femaleCardBorder: 'border-zinc-300 ring-zinc-300/20',
    otherCardBorder: 'border-zinc-500 ring-zinc-500/20',
  },
};

export function getThemeConfig(theme?: TreeTheme): ThemeConfig {
  if (theme && THEMES[theme]) {
    return THEMES[theme];
  }
  return THEMES.parchment;
}
