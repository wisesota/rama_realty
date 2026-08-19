import { describe, it, expect } from 'vitest';
import { tokens } from '../lib/tokens';
import { compileTokens } from '../scripts/build-tokens.mjs';

describe('Design Tokens Architecture', () => {
  it('contains all core Rama Realty primitive colors', () => {
    expect(tokens.primitives.color.gallery).toBe('#fbfbf8');
    expect(tokens.primitives.color.paper).toBe('#ffffff');
    expect(tokens.primitives.color.ink).toBe('#202321');
    expect(tokens.primitives.color.sky).toBe('#82b8d7');
    expect(tokens.primitives.color.sand).toBe('#b99463');
  });

  it('contains compliant 16px media frame radius and 8px control radius', () => {
    expect(tokens.primitives.radius.media).toBe('16px');
    expect(tokens.primitives.radius.control).toBe('0.5rem');
  });

  it('resolves semantic tokens correctly from primitives', () => {
    expect(tokens.semantics.surface.canvas).toBe('#fbfbf8');
    expect(tokens.semantics.surface.card).toBe('#ffffff');
    expect(tokens.semantics.text.primary).toBe('#202321');
    expect(tokens.semantics.border.focus).toBe('#356d8d');
  });

  it('resolves component-level tokens', () => {
    expect(tokens.components.button.minHeight).toBe('2.75rem');
    expect(tokens.components.button.paddingInline).toBe('0.5rem');
    expect(tokens.components.mediaFrame.radius).toBe('16px');
    expect(tokens.components.voiceSignal.size).toBe('10rem');
  });

  it('throws an error on circular token references', () => {
    const cyclicSources = {
      primitives: {
        color: {
          a: { $value: '{color.b}' },
          b: { $value: '{color.a}' },
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
          test: { $value: '{color.nonExistent}' },
        },
      },
      semantics: {},
      components: {},
    };

    expect(() => compileTokens(invalidSources)).toThrow(/Unknown token reference/);
  });
});
