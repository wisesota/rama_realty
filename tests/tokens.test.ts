import { describe, it, expect } from 'vitest';
import { tokens } from '../lib/tokens';
import { compileTokens } from '../scripts/build-tokens.mjs';

describe('Design Tokens Architecture', () => {
  it('contains all core Rama Realty primitive colors', () => {
    expect(tokens.primitives.color.gallery).toBe('#f5f3ed');
    expect(tokens.primitives.color.paper).toBe('#fcfbf7');
    expect(tokens.primitives.color.ink).toBe('#172126');
    expect(tokens.primitives.color.sky).toBe('#4f7787');
    expect(tokens.primitives.color.sand).toBe('#b58c54');
    expect(tokens.primitives.color.pine).toBe('#3f6b5a');
    expect(tokens.primitives.color.clay).toBe('#9a654d');
  });

  it('contains compliant 16px media, 8px evidence, and 6px control radii', () => {
    expect(tokens.primitives.radius.media).toBe('16px');
    expect(tokens.primitives.radius.content).toBe('0.5rem');
    expect(tokens.primitives.radius.control).toBe('0.375rem');
  });

  it('resolves semantic tokens correctly from primitives', () => {
    expect(tokens.semantics.surface.canvas).toBe('#f5f3ed');
    expect(tokens.semantics.surface.card).toBe('#fcfbf7');
    expect(tokens.semantics.text.primary).toBe('#172126');
    expect(tokens.semantics.border.focus).toBe('#315f73');
  });

  it('resolves component-level tokens', () => {
    expect(tokens.components.button.minHeight).toBe('2.75rem');
    expect(tokens.components.button.paddingInline).toBe('0.5rem');
    expect(tokens.components.mediaFrame.radius).toBe('16px');
    expect(tokens.components.voiceSignal.size).toBe('2.75rem');
    expect(tokens.components.evidencePlane.radius).toBe('0.5rem');
  });

  it('throws an error on circular token references', () => {
    const cyclicSources = {
      primitives: {
        color: {
          a: { $value: '{color.b}', $type: 'color', $description: 'Cycle fixture A' },
          b: { $value: '{color.a}', $type: 'color', $description: 'Cycle fixture B' },
        },
      },
      semantics: {},
      components: {},
    };

    expect(() => compileTokens(cyclicSources)).toThrow(/Circular reference detected/);
  });

  it('throws an error on missing/unknown token references', () => {
    const invalidSources = {
      primitives: {
        color: {
          test: { $value: '{color.nonExistent}', $type: 'color', $description: 'Missing-reference fixture' },
        },
      },
      semantics: {},
      components: {},
    };

    expect(() => compileTokens(invalidSources)).toThrow(/Unknown token reference/);
  });

  it('keeps migrated legacy literals governed and documented', () => {
    const legacyDimensions = Object.values(tokens.primitives.legacy.dimension);
    const legacyColors = Object.values(tokens.primitives.legacy.color);

    expect(legacyDimensions.length).toBeGreaterThan(0);
    expect(legacyColors.length).toBeGreaterThan(0);
    expect(legacyDimensions).toContain('0.5rem');
  });

  it('rejects undocumented token leaves', () => {
    expect(() => compileTokens({
      primitives: { color: { test: { $value: '#000000', $type: 'color' } } },
      semantics: {},
      components: {},
    })).toThrow(/missing required \$description/);
  });
});
