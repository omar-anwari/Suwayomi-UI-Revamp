export type ThemeMode = 'dark' | 'light';

export type ThemeTokens = {
  brand300: string;
  brand400: string;
  brand500: string;
  brand600: string;
  magenta400: string;
  magenta500: string;
  accent400: string;
  accent500: string;
  app: string;
  appTint: string;
  surface: string;
  raised: string;
  glass: string;
  glow1: string;
  glow2: string;
  ink: string;
  onBrand: string;
};

export type Theme = {
  id: string;
  name: string;
  mode: ThemeMode;
  tokens: ThemeTokens;
};

export type TokenKey = keyof ThemeTokens;

const CSS_VAR: Record<TokenKey, string> = {
  brand300: '--color-brand-300',
  brand400: '--color-brand-400',
  brand500: '--color-brand-500',
  brand600: '--color-brand-600',
  magenta400: '--color-magenta-400',
  magenta500: '--color-magenta-500',
  accent400: '--color-accent-400',
  accent500: '--color-accent-500',
  app: '--color-app',
  appTint: '--color-app-tint',
  surface: '--color-surface',
  raised: '--color-raised',
  glass: '--color-glass',
  glow1: '--color-glow-1',
  glow2: '--color-glow-2',
  ink: '--color-white',
  onBrand: '--color-on-brand',
};

export const TOKEN_GROUPS: { label: string; hint: string; keys: TokenKey[] }[] = [
  {
    label: 'Brand',
    hint: 'Primary accent - buttons, links, badges, progress bars',
    keys: ['brand300', 'brand400', 'brand500', 'brand600'],
  },
  {
    label: 'Secondary',
    hint: 'Gradient partners and secondary highlights',
    keys: ['magenta400', 'magenta500', 'accent400', 'accent500'],
  },
  {
    label: 'Surfaces',
    hint: 'Page background, cards, hover states, and sticky bars',
    keys: ['app', 'appTint', 'surface', 'raised', 'glass'],
  },
  {
    label: 'Details',
    hint: 'Background glow, overlay tint, and text on brand fills',
    keys: ['glow1', 'glow2', 'ink', 'onBrand'],
  },
];

export const TOKEN_LABELS: Record<TokenKey, string> = {
  brand300: 'Brand light',
  brand400: 'Brand',
  brand500: 'Brand strong',
  brand600: 'Brand deep',
  magenta400: 'Secondary light',
  magenta500: 'Secondary',
  accent400: 'Accent light',
  accent500: 'Accent',
  app: 'Page background',
  appTint: 'Page top tint',
  surface: 'Card surface',
  raised: 'Raised surface',
  glass: 'Bars and overlays',
  glow1: 'Glow (left)',
  glow2: 'Glow (right)',
  ink: 'Overlay tint',
  onBrand: 'Text on brand',
};

export const PRESETS: Theme[] = [
  {
    id: 'ember',
    name: 'Ember',
    mode: 'dark',
    tokens: {
      brand300: '#fda4a4',
      brand400: '#f05a4f',
      brand500: '#dc3f35',
      brand600: '#b92824',
      magenta400: '#f28b45',
      magenta500: '#e5682e',
      accent400: '#efaa62',
      accent500: '#d78332',
      app: '#050403',
      appTint: '#080706',
      surface: '#0a0d14',
      raised: '#10141e',
      glass: '#030509',
      glow1: '#b92824',
      glow2: '#e5682e',
      ink: '#ffffff',
      onBrand: '#ffffff',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    mode: 'dark',
    tokens: {
      brand300: '#a5b4fc',
      brand400: '#818cf8',
      brand500: '#6366f1',
      brand600: '#4338ca',
      magenta400: '#67e8f9',
      magenta500: '#22d3ee',
      accent400: '#7dd3fc',
      accent500: '#38bdf8',
      app: '#04060d',
      appTint: '#070a14',
      surface: '#0b1020',
      raised: '#151b2e',
      glass: '#030512',
      glow1: '#4338ca',
      glow2: '#22d3ee',
      ink: '#ffffff',
      onBrand: '#ffffff',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    mode: 'dark',
    tokens: {
      brand300: '#86efac',
      brand400: '#4ade80',
      brand500: '#22c55e',
      brand600: '#15803d',
      magenta400: '#5eead4',
      magenta500: '#2dd4bf',
      accent400: '#bef264',
      accent500: '#a3e635',
      app: '#030705',
      appTint: '#050b08',
      surface: '#0a1310',
      raised: '#101d17',
      glass: '#020604',
      glow1: '#15803d',
      glow2: '#2dd4bf',
      ink: '#ffffff',
      onBrand: '#04140b',
    },
  },
  {
    id: 'sakura',
    name: 'Sakura',
    mode: 'dark',
    tokens: {
      brand300: '#f9a8d4',
      brand400: '#f472b6',
      brand500: '#ec4899',
      brand600: '#be1e63',
      magenta400: '#c084fc',
      magenta500: '#a855f7',
      accent400: '#fda4af',
      accent500: '#fb7185',
      app: '#08040a',
      appTint: '#0c0710',
      surface: '#120b18',
      raised: '#1c1225',
      glass: '#060309',
      glow1: '#be1e63',
      glow2: '#a855f7',
      ink: '#ffffff',
      onBrand: '#ffffff',
    },
  },
  {
    id: 'gmk8008',
    name: 'GMK 8008',
    mode: 'dark',
    tokens: {
      brand300: '#f7aac5',
      brand400: '#f07ba3',
      brand500: '#e8527e',
      brand600: '#c33d63',
      magenta400: '#9bd8ea',
      magenta500: '#74c7dd',
      accent400: '#f0e7dd',
      accent500: '#d3c5b8',
      app: '#131318',
      appTint: '#1a1a21',
      surface: '#23232b',
      raised: '#2f2f39',
      glass: '#0e0e12',
      glow1: '#e8527e',
      glow2: '#74c7dd',
      ink: '#ffffff',
      onBrand: '#2a1119',
    },
  },
  {
    id: 'laser',
    name: 'GMK Laser',
    mode: 'dark',
    tokens: {
      brand300: '#ff9ecb',
      brand400: '#ff62ab',
      brand500: '#ff2f8e',
      brand600: '#c81e6e',
      magenta400: '#5ceaff',
      magenta500: '#00d5f5',
      accent400: '#b388ff',
      accent500: '#8c5bff',
      app: '#0c0518',
      appTint: '#130a24',
      surface: '#1a0b2e',
      raised: '#261243',
      glass: '#070311',
      glow1: '#c81e6e',
      glow2: '#00d5f5',
      ink: '#ffffff',
      onBrand: '#16041f',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    mode: 'dark',
    tokens: {
      brand300: '#a3d0dd',
      brand400: '#88c0d0',
      brand500: '#5e81ac',
      brand600: '#4c6a92',
      magenta400: '#b48ead',
      magenta500: '#a1789c',
      accent400: '#a3be8c',
      accent500: '#8fbcbb',
      app: '#242933',
      appTint: '#2e3440',
      surface: '#3b4252',
      raised: '#434c5e',
      glass: '#1e222b',
      glow1: '#5e81ac',
      glow2: '#b48ead',
      ink: '#ffffff',
      onBrand: '#eceff4',
    },
  },
  {
    id: 'mocha',
    name: 'Catppuccin Mocha',
    mode: 'dark',
    tokens: {
      brand300: '#e3cffd',
      brand400: '#d7b8f9',
      brand500: '#cba6f7',
      brand600: '#8839ef',
      magenta400: '#f5c2e7',
      magenta500: '#f38ba8',
      accent400: '#89dceb',
      accent500: '#74c7ec',
      app: '#11111b',
      appTint: '#181825',
      surface: '#1e1e2e',
      raised: '#313244',
      glass: '#0c0c14',
      glow1: '#8839ef',
      glow2: '#f38ba8',
      ink: '#ffffff',
      onBrand: '#1e1e2e',
    },
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox',
    mode: 'dark',
    tokens: {
      brand300: '#fbe3a0',
      brand400: '#fabd2f',
      brand500: '#d79921',
      brand600: '#b57614',
      magenta400: '#fe8019',
      magenta500: '#d65d0e',
      accent400: '#b8bb26',
      accent500: '#98971a',
      app: '#1d2021',
      appTint: '#282828',
      surface: '#32302f',
      raised: '#3c3836',
      glass: '#141617',
      glow1: '#b57614',
      glow2: '#d65d0e',
      ink: '#ffffff',
      onBrand: '#282828',
    },
  },
  {
    id: 'coffee',
    name: 'Coffee',
    mode: 'dark',
    tokens: {
      brand300: '#e7c9a9',
      brand400: '#d3a877',
      brand500: '#b9834f',
      brand600: '#8a5a34',
      magenta400: '#cf8f63',
      magenta500: '#a5643a',
      accent400: '#e9d8bf',
      accent500: '#cbb695',
      app: '#140f0c',
      appTint: '#1a1310',
      surface: '#221a15',
      raised: '#2e231c',
      glass: '#0d0907',
      glow1: '#8a5a34',
      glow2: '#a5643a',
      ink: '#ffffff',
      onBrand: '#201509',
    },
  },
  {
    id: 'mono',
    name: 'Mono',
    mode: 'dark',
    tokens: {
      brand300: '#e4e4e7',
      brand400: '#a1a1aa',
      brand500: '#71717a',
      brand600: '#52525b',
      magenta400: '#a1a1aa',
      magenta500: '#71717a',
      accent400: '#d4d4d8',
      accent500: '#a1a1aa',
      app: '#050506',
      appTint: '#08080a',
      surface: '#0d0d10',
      raised: '#17171b',
      glass: '#030304',
      glow1: '#52525b',
      glow2: '#3f3f46',
      ink: '#ffffff',
      onBrand: '#ffffff',
    },
  },
  {
    id: 'void',
    name: 'Void',
    mode: 'dark',
    tokens: {
      brand300: '#a5f3fc',
      brand400: '#67e8f9',
      brand500: '#22d3ee',
      brand600: '#0e7490',
      magenta400: '#c4b5fd',
      magenta500: '#a78bfa',
      accent400: '#f0abfc',
      accent500: '#e879f9',
      app: '#000000',
      appTint: '#000000',
      surface: '#0a0a0c',
      raised: '#16161a',
      glass: '#000000',
      glow1: '#0e7490',
      glow2: '#a78bfa',
      ink: '#ffffff',
      onBrand: '#001016',
    },
  },
  {
    id: 'paper',
    name: 'Paper',
    mode: 'light',
    tokens: {
      brand300: '#ea580c',
      brand400: '#c2410c',
      brand500: '#d9480a',
      brand600: '#9a3412',
      magenta400: '#b45309',
      magenta500: '#d97706',
      accent400: '#a16207',
      accent500: '#ca8a04',
      app: '#f5f1ea',
      appTint: '#fffdf8',
      surface: '#ffffff',
      raised: '#ebe5db',
      glass: '#faf7f2',
      glow1: '#d9480a',
      glow2: '#ca8a04',
      ink: '#1c1917',
      onBrand: '#ffffff',
    },
  },
  {
    id: 'frost',
    name: 'Frost',
    mode: 'light',
    tokens: {
      brand300: '#818cf8',
      brand400: '#6366f1',
      brand500: '#4f46e5',
      brand600: '#3730a3',
      magenta400: '#0ea5b7',
      magenta500: '#0e7490',
      accent400: '#0284c7',
      accent500: '#0369a1',
      app: '#eef2f7',
      appTint: '#f8fafc',
      surface: '#ffffff',
      raised: '#e2e8f0',
      glass: '#f1f5f9',
      glow1: '#4f46e5',
      glow2: '#0891b2',
      ink: '#0f172a',
      onBrand: '#ffffff',
    },
  },
  {
    id: 'latte',
    name: 'Catppuccin Latte',
    mode: 'light',
    tokens: {
      brand300: '#a86ff1',
      brand400: '#9450ef',
      brand500: '#8839ef',
      brand600: '#6d24cc',
      magenta400: '#ea76cb',
      magenta500: '#d63ba0',
      accent400: '#04a5e5',
      accent500: '#1e66d5',
      app: '#eff1f5',
      appTint: '#f8f9fb',
      surface: '#ffffff',
      raised: '#dce0e8',
      glass: '#e6e9ef',
      glow1: '#8839ef',
      glow2: '#ea76cb',
      ink: '#4c4f69',
      onBrand: '#ffffff',
    },
  },
];

export const DEFAULT_THEME = PRESETS[0];

export const CUSTOM_ID = 'custom';

export type ThemeSelection = {
  selected: string;
  custom: Theme;
};

const KEY = 'suwayomi-theme';

function makeCustom(base: Theme = DEFAULT_THEME): Theme {
  return { id: CUSTOM_ID, name: 'Custom', mode: base.mode, tokens: { ...base.tokens } };
}

export const DEFAULT_SELECTION: ThemeSelection = {
  selected: DEFAULT_THEME.id,
  custom: makeCustom(),
};

function sanitizeTokens(input: unknown, fallback: ThemeTokens): ThemeTokens {
  const raw = (input ?? {}) as Partial<Record<TokenKey, unknown>>;
  const out = { ...fallback };
  for (const key of Object.keys(CSS_VAR) as TokenKey[]) {
    const value = raw[key];
    if (typeof value === 'string' && isColor(value)) out[key] = value;
  }
  return out;
}

export function isColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());
}

export function loadSelection(): ThemeSelection {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SELECTION;
    const stored = JSON.parse(raw) as Partial<ThemeSelection>;
    const custom = stored.custom;
    return {
      selected:
        typeof stored.selected === 'string' &&
        (stored.selected === CUSTOM_ID || PRESETS.some((p) => p.id === stored.selected))
          ? stored.selected
          : DEFAULT_THEME.id,
      custom: {
        id: CUSTOM_ID,
        name: 'Custom',
        mode: custom?.mode === 'light' ? 'light' : 'dark',
        tokens: sanitizeTokens(custom?.tokens, DEFAULT_THEME.tokens),
      },
    };
  } catch {
    return DEFAULT_SELECTION;
  }
}

export function saveSelection(selection: ThemeSelection): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(selection));
  } catch {
  }
}

export function resetSelection(): void {
  localStorage.removeItem(KEY);
}

export function resolveTheme(selection: ThemeSelection): Theme {
  if (selection.selected === CUSTOM_ID) return selection.custom;
  return PRESETS.find((p) => p.id === selection.selected) ?? DEFAULT_THEME;
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(CSS_VAR) as [TokenKey, string][]) {
    root.style.setProperty(cssVar, theme.tokens[key]);
  }
  root.dataset.themeMode = theme.mode;
  root.style.colorScheme = theme.mode;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.tokens.app);
}

export function initTheme(): void {
  applyTheme(resolveTheme(loadSelection()));
}

export function exportTheme(theme: Theme): string {
  return JSON.stringify({ name: theme.name, mode: theme.mode, tokens: theme.tokens }, null, 2);
}

export function importTheme(json: string): Theme {
  const parsed = JSON.parse(json) as Partial<Theme>;
  return {
    id: CUSTOM_ID,
    name: 'Custom',
    mode: parsed.mode === 'light' ? 'light' : 'dark',
    tokens: sanitizeTokens(parsed.tokens, DEFAULT_THEME.tokens),
  };
}
