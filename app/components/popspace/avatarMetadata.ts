export interface AvatarMeta {
  id: string;
  label: string;
  bgColor: string;
  gradient?: string;
  textColor?: string;
  border?: string;
}

export const EXECUTIVE_THEMES: AvatarMeta[] = [
  {
    id: 'indigo',
    label: 'Indigo',
    bgColor: '#4F46E5',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)',
    textColor: '#FFFFFF',
    border: '#4338CA',
  },
  {
    id: 'slate',
    label: 'Slate',
    bgColor: '#1E293B',
    gradient: 'linear-gradient(135deg, #334155 0%, #0F172A 100%)',
    textColor: '#FFFFFF',
    border: '#1E293B',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    bgColor: '#059669',
    gradient: 'linear-gradient(135deg, #059669 0%, #064E3B 100%)',
    textColor: '#FFFFFF',
    border: '#047857',
  },
  {
    id: 'violet',
    label: 'Violet',
    bgColor: '#7C3AED',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
    textColor: '#FFFFFF',
    border: '#6D28D9',
  },
  {
    id: 'rose',
    label: 'Rose',
    bgColor: '#E11D48',
    gradient: 'linear-gradient(135deg, #E11D48 0%, #881337 100%)',
    textColor: '#FFFFFF',
    border: '#BE123C',
  },
  {
    id: 'amber',
    label: 'Amber',
    bgColor: '#D97706',
    gradient: 'linear-gradient(135deg, #D97706 0%, #78350F 100%)',
    textColor: '#FFFFFF',
    border: '#B45309',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    bgColor: '#0284C7',
    gradient: 'linear-gradient(135deg, #0284C7 0%, #075985 100%)',
    textColor: '#FFFFFF',
    border: '#0369A1',
  },
  {
    id: 'teal',
    label: 'Teal',
    bgColor: '#0D9488',
    gradient: 'linear-gradient(135deg, #0D9488 0%, #115E59 100%)',
    textColor: '#FFFFFF',
    border: '#0F766E',
  },
];

// Alias for backwards compatibility across existing components
export const POPSPACE_AVATARS: AvatarMeta[] = EXECUTIVE_THEMES;

export function getRandomAvatar(): AvatarMeta {
  const index = Math.floor(Math.random() * EXECUTIVE_THEMES.length);
  return EXECUTIVE_THEMES[index];
}

export function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'M';
  const clean = name.trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getThemeById(id?: string): AvatarMeta {
  return EXECUTIVE_THEMES.find((t) => t.id === id) || EXECUTIVE_THEMES[0];
}
