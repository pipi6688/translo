import { describe, it, expect } from 'vitest';
import { shouldTranslate } from './filter';

describe('shouldTranslate', () => {
  // Should translate
  it('translates normal English sentences', () => {
    expect(shouldTranslate('Hello world')).toBe(true);
    expect(shouldTranslate('This is a test')).toBe(true);
    expect(shouldTranslate('React Server Components')).toBe(true);
  });

  it('translates English with some numbers', () => {
    expect(shouldTranslate('Version 3.0 is released')).toBe(true);
  });

  it('translates multi-line English text', () => {
    expect(shouldTranslate('First line\nSecond line')).toBe(true);
  });

  // Should NOT translate
  it('rejects empty or very short text', () => {
    expect(shouldTranslate('')).toBe(false);
    expect(shouldTranslate('a')).toBe(false);
  });

  it('rejects pure numbers', () => {
    expect(shouldTranslate('123456')).toBe(false);
    expect(shouldTranslate('3.14159')).toBe(false);
  });

  it('rejects URLs', () => {
    expect(shouldTranslate('https://example.com/path')).toBe(false);
    expect(shouldTranslate('http://localhost:3000')).toBe(false);
  });

  it('rejects email addresses', () => {
    expect(shouldTranslate('user@example.com')).toBe(false);
  });

  it('rejects file paths', () => {
    expect(shouldTranslate('/usr/local/bin/node')).toBe(false);
    expect(shouldTranslate('./src/index.ts')).toBe(false);
    expect(shouldTranslate('~/Documents/file.txt')).toBe(false);
  });

  it('rejects hex strings', () => {
    expect(shouldTranslate('0x1a2b3c4d5e6f')).toBe(false);
    expect(shouldTranslate('deadbeef1234')).toBe(false);
  });

  it('rejects base64 tokens', () => {
    expect(shouldTranslate('dGhpcyBpcyBhIHRlc3Q=')).toBe(false);
  });

  it('rejects JWT tokens', () => {
    expect(
      shouldTranslate(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      ),
    ).toBe(false);
  });

  it('rejects password-like strings (high entropy, mixed types)', () => {
    expect(shouldTranslate('Abc123!@#xyz')).toBe(false);
    expect(shouldTranslate('sK8$mP2!nQ5#')).toBe(false);
  });

  it('rejects single-line code', () => {
    expect(shouldTranslate('console.log("hello");')).toBe(false);
    expect(shouldTranslate('const foo = bar')).toBe(false);
  });

  it('rejects pure Chinese text (no English letters)', () => {
    expect(shouldTranslate('你好世界')).toBe(false);
  });
});
