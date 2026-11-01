import * as React from 'react';

export type BgCategory = 'all' | 'natural' | 'pattern' | 'gradient';

export interface BgPreset {
  id: string;
  name: string;
  category: 'natural' | 'pattern' | 'gradient';
  style: React.CSSProperties;
  textClass: string;
  previewBg: string; // Used for tiny preview swatches
}

// Reusable SVG pattern data URIs
const SVG_LEAVES =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cpath d='M32 6 C20 18, 12 34, 32 58 C52 34, 44 18, 32 6 Z M32 16 L32 48' fill='none' stroke='rgba(255,255,255,0.18)' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E\")";

const SVG_WAVES =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='36' viewBox='0 0 80 36'%3E%3Cpath d='M0 18 Q20 6, 40 18 T80 18' fill='none' stroke='rgba(255,255,255,0.22)' stroke-width='2.2' stroke-linecap='round'/%3E%3C/svg%3E\")";

const SVG_STARS =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70' viewBox='0 0 70 70'%3E%3Ccircle cx='18' cy='18' r='1.5' fill='rgba(255,255,255,0.5)'/%3E%3Ccircle cx='54' cy='48' r='1.2' fill='rgba(255,255,255,0.4)'/%3E%3Cpath d='M45 14 L47 8 L49 14 L55 16 L49 18 L47 24 L45 18 L39 16 Z' fill='rgba(255,255,255,0.45)'/%3E%3C/svg%3E\")";

const SVG_PETALS =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M20 10 C30 5, 40 20, 25 30 C12 30, 10 16, 20 10 Z' fill='rgba(255,255,255,0.24)'/%3E%3Ccircle cx='48' cy='44' r='2.5' fill='rgba(255,255,255,0.2)'/%3E%3C/svg%3E\")";

const SVG_HONEYCOMB =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='48' viewBox='0 0 28 48'%3E%3Cpath d='M14 0 L28 8 L28 24 L14 32 L0 24 L0 8 Z M14 48 L28 40 L28 24 L14 16 L0 24 L0 40 Z' fill='none' stroke='rgba(255,255,255,0.18)' stroke-width='1.5'/%3E%3C/svg%3E\")";

const SVG_CONTOUR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M0 25 Q50 55, 100 25 M0 75 Q50 45, 100 75' fill='none' stroke='rgba(255,255,255,0.14)' stroke-width='2'/%3E%3C/svg%3E\")";

const SVG_RIPPLES =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='14' fill='none' stroke='rgba(255,255,255,0.18)' stroke-width='1.5'/%3E%3Ccircle cx='40' cy='40' r='28' fill='none' stroke='rgba(255,255,255,0.12)' stroke-width='1.5'/%3E%3C/svg%3E\")";

const SVG_LIME_3D =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cpath d='M60 25 Q60 60, 25 60 Q60 60, 60 95 Q60 60, 95 60 Q60 60, 60 25 Z' fill='rgba(255,255,255,0.22)'/%3E%3Ccircle cx='95' cy='25' r='5' fill='rgba(255,255,255,0.2)'/%3E%3Ccircle cx='25' cy='95' r='4' fill='rgba(255,255,255,0.15)'/%3E%3C/svg%3E\")";

export const BG_PRESETS: BgPreset[] = [
  // 1. Lime 3D (Natural Citrus - Facebook style)
  {
    id: 'lime-green',
    name: 'লাইম থ্রিডি (Citrus)',
    category: 'natural',
    style: {
      backgroundImage: `${SVG_LIME_3D}, radial-gradient(circle at 85% 15%, rgba(255,255,255,0.4) 0%, transparent 45%), linear-gradient(135deg, #a3e635 0%, #4ade80 45%, #10b981 100%)`,
      backgroundSize: '120px 120px, auto, auto',
      backgroundRepeat: 'repeat, no-repeat, no-repeat',
      color: '#0f172a',
      textShadow: '0 1px 3px rgba(255,255,255,0.6)',
    },
    textClass: 'text-slate-900 font-black placeholder:text-slate-800/60',
    previewBg: 'linear-gradient(135deg, #a3e635, #4ade80, #10b981)',
  },

  // 2. Lush Rainforest & Leaves
  {
    id: 'lush-forest',
    name: 'লুশ ফরেস্ট (Leaves)',
    category: 'natural',
    style: {
      backgroundImage: `${SVG_LEAVES}, linear-gradient(135deg, #022c22 0%, #065f46 45%, #059669 80%, #10b981 100%)`,
      backgroundSize: '64px 64px, auto',
      backgroundRepeat: 'repeat, no-repeat',
      color: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.5)',
    },
    textClass: 'text-white font-extrabold placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #022c22, #059669, #10b981)',
  },

  // 3. Ocean Waves
  {
    id: 'ocean-wave',
    name: 'সমুদ্রের ঢেউ (Waves)',
    category: 'natural',
    style: {
      backgroundImage: `${SVG_WAVES}, linear-gradient(135deg, #082f49 0%, #0284c7 45%, #06b6d4 80%, #38bdf8 100%)`,
      backgroundSize: '80px 36px, auto',
      backgroundRepeat: 'repeat, no-repeat',
      color: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.45)',
    },
    textClass: 'text-white font-extrabold placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #082f49, #0284c7, #06b6d4)',
  },

  // 4. Sunset Fire / Horizon
  {
    id: 'sunset-fire',
    name: 'সানসেট হরাইজন (Sunset)',
    category: 'natural',
    style: {
      backgroundImage: `radial-gradient(circle at 50% 85%, rgba(254,240,138,0.5) 0%, transparent 55%), linear-gradient(135deg, #7c2d12 0%, #c2410c 40%, #ea580c 70%, #facc15 100%)`,
      color: '#ffffff',
      textShadow: '0 2px 10px rgba(0,0,0,0.55)',
    },
    textClass: 'text-white font-black placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #7c2d12, #ea580c, #facc15)',
  },

  // 5. Aurora Borealis (Northern Lights)
  {
    id: 'aurora-borealis',
    name: 'অরোরা (Northern Lights)',
    category: 'natural',
    style: {
      backgroundImage: `radial-gradient(ellipse at 20% 20%, rgba(52,211,153,0.55) 0%, transparent 55%), radial-gradient(ellipse at 80% 85%, rgba(192,132,252,0.55) 0%, transparent 55%), linear-gradient(135deg, #090d16 0%, #064e3b 45%, #3b0764 100%)`,
      color: '#ffffff',
      textShadow: '0 2px 12px rgba(0,0,0,0.65)',
    },
    textClass: 'text-white font-black placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #090d16, #064e3b, #3b0764)',
  },

  // 6. Cherry Blossom (Sakura Bloom)
  {
    id: 'cherry-blossom',
    name: 'চেরি ব্লসম (Sakura)',
    category: 'natural',
    style: {
      backgroundImage: `${SVG_PETALS}, linear-gradient(135deg, #9f1239 0%, #e11d48 45%, #f43f5e 75%, #fda4af 100%)`,
      backgroundSize: '60px 60px, auto',
      backgroundRepeat: 'repeat, no-repeat',
      color: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.45)',
    },
    textClass: 'text-white font-black placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #9f1239, #e11d48, #fda4af)',
  },

  // 7. Mint Polka Drops (Fresh Dew)
  {
    id: 'mint-drops',
    name: 'মিন্ট ড্রপস (Polka)',
    category: 'pattern',
    style: {
      backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.32) 2px, transparent 2.5px), linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #2dd4bf 100%)`,
      backgroundSize: '22px 22px, auto',
      backgroundRepeat: 'repeat, no-repeat',
      color: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.4)',
    },
    textClass: 'text-white font-extrabold placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #0f766e, #14b8a6, #2dd4bf)',
  },

  // 8. Golden Sunrise (Morning Sunbeam)
  {
    id: 'golden-sunrise',
    name: 'গোল্ডেন সানরাইজ',
    category: 'natural',
    style: {
      backgroundImage: `radial-gradient(circle at 15% 15%, rgba(255,255,255,0.5) 0%, transparent 45%), linear-gradient(135deg, #b45309 0%, #d97706 40%, #f59e0b 80%, #fef08a 100%)`,
      color: '#0f172a',
      textShadow: '0 1px 3px rgba(255,255,255,0.6)',
    },
    textClass: 'text-slate-900 font-black placeholder:text-slate-800/60',
    previewBg: 'linear-gradient(135deg, #b45309, #f59e0b, #fef08a)',
  },

  // 9. Midnight Starlight (Cosmic Sky)
  {
    id: 'midnight-neon',
    name: 'মিডনাইট স্টারস (Cosmic)',
    category: 'pattern',
    style: {
      backgroundImage: `${SVG_STARS}, linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e1b4b 75%, #311042 100%)`,
      backgroundSize: '70px 70px, auto',
      backgroundRepeat: 'repeat, no-repeat',
      color: '#ffffff',
      textShadow: '0 2px 10px rgba(0,0,0,0.7)',
    },
    textClass: 'text-white font-black placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #020617, #1e1b4b, #311042)',
  },

  // 10. Honeycomb Wild Gold
  {
    id: 'honeycomb-gold',
    name: 'মৌচাক গোল্ড (Honeycomb)',
    category: 'pattern',
    style: {
      backgroundImage: `${SVG_HONEYCOMB}, linear-gradient(135deg, #78350f 0%, #b45309 45%, #d97706 80%, #fde047 100%)`,
      backgroundSize: '28px 48px, auto',
      backgroundRepeat: 'repeat, no-repeat',
      color: '#1e1b4b',
      textShadow: '0 1px 3px rgba(255,255,255,0.6)',
    },
    textClass: 'text-slate-900 font-black placeholder:text-slate-800/60',
    previewBg: 'linear-gradient(135deg, #78350f, #d97706, #fde047)',
  },

  // 11. Lavender Mist
  {
    id: 'lavender-mist',
    name: 'ল্যাভেন্ডার ড্রিম',
    category: 'natural',
    style: {
      backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.25) 1.5px, transparent 2px), linear-gradient(135deg, #4c1d95 0%, #7e22ce 50%, #c084fc 100%)`,
      backgroundSize: '18px 18px, auto',
      backgroundRepeat: 'repeat, no-repeat',
      color: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.5)',
    },
    textClass: 'text-white font-black placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #4c1d95, #7e22ce, #c084fc)',
  },

  // 12. Earthy Clay (Terracotta & River)
  {
    id: 'earthy-clay',
    name: 'টেরাকোটা (Earthy Clay)',
    category: 'natural',
    style: {
      backgroundImage: `${SVG_CONTOUR}, linear-gradient(135deg, #451a03 0%, #78350f 45%, #9a3412 80%, #ea580c 100%)`,
      backgroundSize: '100px 100px, auto',
      backgroundRepeat: 'repeat, no-repeat',
      color: '#fef3c7',
      textShadow: '0 2px 8px rgba(0,0,0,0.55)',
    },
    textClass: 'text-amber-50 font-black placeholder:text-amber-100/70',
    previewBg: 'linear-gradient(135deg, #451a03, #9a3412, #ea580c)',
  },

  // 13. Deep Emerald Stone
  {
    id: 'deep-emerald',
    name: 'গাঢ় মার্বেল (Emerald)',
    category: 'natural',
    style: {
      backgroundImage: `${SVG_RIPPLES}, linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f766e 100%)`,
      backgroundSize: '80px 80px, auto',
      backgroundRepeat: 'repeat, no-repeat',
      color: '#ffffff',
      textShadow: '0 2px 10px rgba(0,0,0,0.5)',
    },
    textClass: 'text-white font-black placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #022c22, #064e3b, #0f766e)',
  },

  // 14. Royal Velvet Purple
  {
    id: 'royal-purple',
    name: 'রয়্যাল পার্পল (Royal)',
    category: 'gradient',
    style: {
      backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.2) 0%, transparent 40%), linear-gradient(135deg, #581c87 0%, #7c3aed 45%, #db2777 100%)`,
      color: '#ffffff',
      textShadow: '0 2px 10px rgba(0,0,0,0.5)',
    },
    textClass: 'text-white font-black placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #581c87, #7c3aed, #db2777)',
  },

  // 15. Vibrant Rose Garden
  {
    id: 'vibrant-rose',
    name: 'রোজ পিংক (Crimson)',
    category: 'gradient',
    style: {
      backgroundImage: `radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25) 0%, transparent 45%), linear-gradient(135deg, #881337 0%, #e11d48 50%, #f43f5e 100%)`,
      color: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.45)',
    },
    textClass: 'text-white font-black placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #881337, #e11d48, #f43f5e)',
  },

  // 16. Aqua Lagoon & Coral Waters
  {
    id: 'aqua-lagoon',
    name: 'নীল লেগুন (Coral Waters)',
    category: 'natural',
    style: {
      backgroundImage: `${SVG_RIPPLES}, linear-gradient(135deg, #164e63 0%, #0891b2 50%, #06b6d4 100%)`,
      backgroundSize: '80px 80px, auto',
      backgroundRepeat: 'repeat, no-repeat',
      color: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.45)',
    },
    textClass: 'text-white font-black placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #164e63, #0891b2, #06b6d4)',
  },

  // 17. Sunset Bliss & Prismatic Flow
  {
    id: 'sunset-bliss',
    name: 'সানসেট ব্লিস (Prismatic)',
    category: 'gradient',
    style: {
      backgroundImage: `linear-gradient(135deg, #c026d3 0%, #db2777 30%, #ea580c 70%, #facc15 100%)`,
      color: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.5)',
    },
    textClass: 'text-white font-black placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #c026d3, #db2777, #facc15)',
  },

  // 18. Cyber Neon Matrix
  {
    id: 'cyber-matrix',
    name: 'সাইবার নিওন (Cyber Grid)',
    category: 'pattern',
    style: {
      backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(135deg, #2e1065 0%, #4c1d95 45%, #4338ca 100%)`,
      backgroundSize: '24px 24px, 24px 24px, auto',
      backgroundRepeat: 'repeat, repeat, no-repeat',
      color: '#ffffff',
      textShadow: '0 0 10px rgba(168,85,247,0.8)',
    },
    textClass: 'text-white font-black placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #2e1065, #4c1d95, #4338ca)',
  },

  // 19. Obsidian Carbon Fiber
  {
    id: 'obsidian-carbon',
    name: 'ডার্ক কার্বন (Carbon)',
    category: 'pattern',
    style: {
      backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 8px), linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)`,
      color: '#ffffff',
      textShadow: '0 2px 10px rgba(0,0,0,0.7)',
    },
    textClass: 'text-white font-black placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #09090b, #18181b, #27272a)',
  },

  // 20. Glacial Snow & Alpine Frost
  {
    id: 'alpine-frost',
    name: 'অ্যালপাইন ফ্রস্ট (Snow)',
    category: 'natural',
    style: {
      backgroundImage: `${SVG_STARS}, linear-gradient(135deg, #1e3a8a 0%, #0284c7 50%, #38bdf8 100%)`,
      backgroundSize: '70px 70px, auto',
      backgroundRepeat: 'repeat, no-repeat',
      color: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.45)',
    },
    textClass: 'text-white font-black placeholder:text-white/70',
    previewBg: 'linear-gradient(135deg, #1e3a8a, #0284c7, #38bdf8)',
  },
];

export function getBgPreset(id?: string | null): BgPreset | undefined {
  if (!id) return undefined;
  return BG_PRESETS.find((p) => p.id === id);
}
