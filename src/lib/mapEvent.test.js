import { describe, it, expect } from 'vitest';
import { slugify, dbRowToEvent, eventToDbRow } from './mapEvent.js';

describe('slugify', () => {
  it('folds Swedish letters and drops punctuation', () => {
    expect(slugify('Balett: Julia & Romeo')).toBe('balett-julia-romeo');
    expect(slugify('Höstmarknad på Södermalm')).toBe('hostmarknad-pa-sodermalm');
  });
});

describe('dbRowToEvent', () => {
  it('fills defaults for missing columns', () => {
    const event = dbRowToEvent({ id: 'x', event_name: 'Thing' });
    expect(event.source).toBe('user');
    expect(event.location.city).toBe('Stockholm');
    expect(event.endDate).toBe('');
  });
});

describe('eventToDbRow', () => {
  it('round-trips the fields a user can edit', () => {
    const row = {
      id: 'u_1',
      source: 'user',
      event_name: 'Loppis',
      type: 'market',
      date: '2026-11-05',
      start_time: '10:00',
      venue: 'Hornstull',
      address: 'Hornstulls strand',
      city: 'Stockholm',
      price_currency: 'SEK',
      price_amount: 0,
      capacity: 50,
      available_spots: 20,
      tags: ['vintage'],
    };
    const back = eventToDbRow(dbRowToEvent(row));
    for (const key of Object.keys(row)) {
      expect(back[key], key).toEqual(row[key]);
    }
  });

  it('keeps a missing spot count null instead of 0', () => {
    expect(eventToDbRow({ eventName: 'x' }).available_spots).toBeNull();
  });
});
