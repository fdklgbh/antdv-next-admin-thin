import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

import { describe, expect, it } from 'vitest';

const glassStyles = readFileSync(
  fileURLToPath(new URL('../../src/assets/styles/glass.css', import.meta.url)),
  'utf8',
);

function pageScrollRule(): string {
  const match = /html:root\[data-theme-style='glass'\] \.page-scroll\s*\{([^}]*)\}/.exec(
    glassStyles,
  );
  if (!match) {
    throw new Error('glass.css 缺少 .page-scroll 规则');
  }
  return match[1];
}

describe('glass theme page container', () => {
  it('does not create a containing block on .page-scroll', () => {
    const rule = pageScrollRule();
    expect(rule).not.toContain('backdrop-filter');
    expect(rule).not.toContain('-webkit-backdrop-filter');
  });

  it('keeps nested panel and control backdrop variables disabled', () => {
    const rule = pageScrollRule();
    expect(rule).toContain('--glass-panel-backdrop: none;');
    expect(rule).toContain('--glass-control-backdrop: none;');
  });
});