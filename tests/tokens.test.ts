import { describe, it, expect } from 'vitest';
import { tokens } from '../lib/tokens';

describe('Design Tokens Architecture', () => {
  it('contains all core Rama Realty primitive colors', () => {
    expect(tokens.primitives.color.gallery).toBe('#fbfbf8');
    expect(tokens.primitives.color.paper).toBe('#ffffff');
    expect(tokens.primitives.color.ink).toBe('#202321');
    expect(tokens.primitives.color.sky).toBe('#82b8d7');
    expect(tokens.primitives.color.sand).toBe('#b99463');
  });

  it('resolves semantic tokens correctly from primitives', () => {
    expect(tokens.semantics.surface.canvas).toBe('#fbfbf8');
    expect(tokens.semantics.surface.card).toBe('#ffffff');
    expect(tokens.semantics.text.primary).toBe('#202321');
    expect(tokens.semantics.border.focus).toBe('#356d8d');
  });

  it('resolves component-level tokens', () => {
    expect(tokens.components.button.minHeight).toBe('2.75rem');
    expect(tokens.components.mediaFrame.radius).toBe('0px');
    expect(tokens.components.voiceSignal.size).toBe('10rem');
  });
});
