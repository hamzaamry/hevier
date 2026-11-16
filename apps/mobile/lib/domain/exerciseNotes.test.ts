import { describe, expect, it } from 'vitest';
import { isLongNote } from './exerciseNotes';

describe('isLongNote', () => {
  it('keeps a short note open', () => {
    expect(isLongNote('')).toBe(false);
    expect(isLongNote('Last sesh keyboard hiding the ui')).toBe(false);
    expect(isLongNote('one\ntwo\nthree')).toBe(false);
  });

  it('folds a note with more than three lines', () => {
    expect(isLongNote('one\ntwo\nthree\nfour')).toBe(true);
  });

  it('folds a long single paragraph', () => {
    expect(isLongNote('x'.repeat(141))).toBe(true);
    expect(isLongNote('x'.repeat(140))).toBe(false);
  });
});
