import { useEffect, useRef, useState } from 'react';
import {
  CUSTOM_ID,
  PRESETS,
  TOKEN_GROUPS,
  TOKEN_LABELS,
  applyTheme,
  exportTheme,
  importTheme,
  isColor,
  loadSelection,
  resetSelection,
  resolveTheme,
  saveSelection,
  type Theme,
  type ThemeMode,
  type ThemeSelection,
  type TokenKey,
} from '../theme';
import { SettingsSection } from './Settings';
import { PageHeader } from './ui';
import { CheckIcon, SparklesIcon } from './icons';

export function ThemeSettings() {
  const [selection, setSelection] = useState<ThemeSelection>(loadSelection);
  const active = resolveTheme(selection);

  function commit(next: ThemeSelection) {
    setSelection(next);
    saveSelection(next);
    applyTheme(resolveTheme(next));
  }

  function selectTheme(id: string) {
    commit({ ...selection, selected: id });
  }

  function editToken(key: TokenKey, value: string) {
    commit({
      ...selection,
      selected: CUSTOM_ID,
      custom: { ...selection.custom, tokens: { ...selection.custom.tokens, [key]: value } },
    });
  }

  function setMode(mode: ThemeMode) {
    commit({ ...selection, selected: CUSTOM_ID, custom: { ...selection.custom, mode } });
  }

  function forkPreset(preset: Theme) {
    commit({
      ...selection,
      selected: CUSTOM_ID,
      custom: { id: CUSTOM_ID, name: 'Custom', mode: preset.mode, tokens: { ...preset.tokens } },
    });
  }

  function reset() {
    resetSelection();
    const fresh = loadSelection();
    setSelection(fresh);
    applyTheme(resolveTheme(fresh));
  }

  const editing = selection.selected === CUSTOM_ID;

  return (
    <div className="min-h-dvh">
      <PageHeader title="Appearance" subtitle={`Theme · ${active.name}`} backTo="/settings" />

      <main className="mx-auto max-w-3xl space-y-5 px-4 pb-16 pt-5 sm:px-6">
        <SettingsSection
          eyebrow="Theme"
          title="Presets"
          description="Pick a palette. Everything in the app - accents, surfaces, borders and the background glow - follows the selection instantly."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PRESETS.map((preset) => (
              <PresetCard
                key={preset.id}
                theme={preset}
                selected={selection.selected === preset.id}
                onSelect={() => selectTheme(preset.id)}
                onFork={() => forkPreset(preset)}
              />
            ))}
            <PresetCard
              theme={selection.custom}
              label="Custom"
              selected={editing}
              onSelect={() => selectTheme(CUSTOM_ID)}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          eyebrow="Custom"
          title="Theme variables"
          description="Each swatch maps to one CSS variable. Editing any of them switches to your custom theme and saves as you go."
        >
          {!editing && (
            <button
              onClick={() => forkPreset(active)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-app px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.04]"
            >
              <SparklesIcon className="h-4 w-4 text-brand-400" />
              Start a custom theme from {active.name}
            </button>
          )}

          <div className={editing ? '' : 'pointer-events-none select-none opacity-45'}>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-300">Base</span>
              <div className="flex overflow-hidden rounded-lg border border-white/[0.09]">
                {(['dark', 'light'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setMode(mode)}
                    className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      selection.custom.mode === mode
                        ? 'bg-brand-500/20 text-brand-300'
                        : 'text-zinc-400 hover:bg-white/[0.04]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-zinc-600">Flips the text and neutral ramp</span>
            </div>

            <div className="space-y-4">
              {TOKEN_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold text-zinc-300">{group.label}</p>
                  <p className="mb-2 text-[11px] text-zinc-600">{group.hint}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.keys.map((key) => (
                      <ColorField
                        key={key}
                        label={TOKEN_LABELS[key]}
                        value={selection.custom.tokens[key]}
                        onChange={(value) => editToken(key, value)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          eyebrow="Transfer"
          title="Share and reset"
          description="Custom themes are stored in this browser. Export to move one to another device, or paste someone else's in."
        >
          <ThemeTransfer theme={selection.custom} onImport={(theme) => commit({ selected: CUSTOM_ID, custom: theme })} />
          <button
            onClick={reset}
            className="w-full rounded-xl border border-white/[0.09] bg-app px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.04]"
          >
            Reset to default theme
          </button>
        </SettingsSection>
      </main>
    </div>
  );
}

function PresetCard({
  theme,
  label,
  selected,
  onSelect,
  onFork,
}: {
  theme: Theme;
  label?: string;
  selected: boolean;
  onSelect: () => void;
  onFork?: () => void;
}) {
  const t = theme.tokens;
  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors ${
        selected ? 'border-brand-400' : 'border-white/[0.09] hover:border-white/20'
      }`}
    >
      <button onClick={onSelect} className="block w-full text-left">
        <div className="relative h-16 w-full" style={{ background: t.app }}>
          <div
            className="absolute inset-x-3 bottom-2 top-3 rounded-md"
            style={{ background: t.surface, border: `1px solid ${t.raised}` }}
          />
          <div className="absolute bottom-3.5 left-4.5 flex gap-1">
            <Swatch color={t.brand500} />
            <Swatch color={t.magenta500} />
            <Swatch color={t.accent400} />
          </div>
          {selected && (
            <span
              className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full"
              style={{ background: t.brand500, color: t.onBrand }}
            >
              <CheckIcon className="h-3 w-3" />
            </span>
          )}
        </div>
        <span className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-medium text-zinc-200">{label ?? theme.name}</span>
          <span className="text-[10px] uppercase tracking-wide text-zinc-600">{theme.mode}</span>
        </span>
      </button>
      {onFork && (
        <button
          onClick={onFork}
          className="w-full border-t border-white/[0.06] px-3 py-1.5 text-[11px] text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-300"
        >
          Customize
        </button>
      )}
    </div>
  );
}

function Swatch({ color }: { color: string }) {
  return <span className="h-3 w-3 rounded-full ring-1 ring-black/30" style={{ background: color }} />;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  function onText(next: string) {
    setDraft(next);
    if (isColor(next)) onChange(next);
  }

  const valid = isColor(draft);

  return (
    <label className="flex items-center gap-2.5 rounded-xl border border-white/[0.09] bg-app px-2.5 py-2">
      <input
        type="color"
        value={valid ? expand(draft) : '#000000'}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(event.target.value);
        }}
        className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border [&::-webkit-color-swatch]:border-white/15"
        aria-label={label}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-medium text-zinc-300">{label}</span>
        <input
          value={draft}
          onChange={(event) => onText(event.target.value)}
          spellCheck={false}
          className={`w-full bg-transparent font-mono text-[11px] uppercase outline-none ${
            valid ? 'text-zinc-500' : 'text-red-400'
          }`}
        />
      </span>
    </label>
  );
}

function expand(hex: string): string {
  const value = hex.trim();
  if (value.length === 4) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return value.slice(0, 7);
}

function ThemeTransfer({ theme, onImport }: { theme: Theme; onImport: (theme: Theme) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function flash(message: string) {
    setStatus(message);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(null), 2400);
  }

  function toggle() {
    if (!open) setText(exportTheme(theme));
    setOpen((v) => !v);
    setStatus(null);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      flash('Copied to clipboard');
    } catch {
      flash('Copy failed - select the text and copy manually');
    }
  }

  function apply() {
    try {
      onImport(importTheme(text));
      flash('Theme imported');
    } catch {
      flash('That is not valid theme JSON');
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={toggle}
        className="w-full rounded-xl border border-white/[0.09] bg-app px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.04]"
      >
        {open ? 'Hide theme code' : 'Export / import theme'}
      </button>

      {open && (
        <>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            spellCheck={false}
            rows={10}
            className="w-full rounded-xl border border-white/[0.09] bg-app p-3 font-mono text-[11px] leading-5 text-zinc-300 outline-none focus:border-brand-500/60"
          />
          <div className="flex gap-2">
            <button
              onClick={copy}
              className="flex-1 rounded-xl border border-white/[0.09] bg-app px-4 py-2.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.04]"
            >
              Copy
            </button>
            <button
              onClick={apply}
              className="brand-gradient flex-1 rounded-xl px-4 py-2.5 text-xs font-semibold text-on-brand transition hover:brightness-110"
            >
              Apply pasted theme
            </button>
          </div>
        </>
      )}

      {status && <p className="text-center text-[11px] text-zinc-500">{status}</p>}
    </div>
  );
}
