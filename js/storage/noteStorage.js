/**
 * noteStorage
 * ---------------------------------------------------------
 * Domain-level persistence for boards & notes. This is the ONLY
 * module the rest of the app should talk to for data — it hides
 * the underlying adapter (localStorage today, Supabase tomorrow)
 * behind a small, storage-agnostic API.
 *
 * Data shape:
 * {
 *   boards: {
 *     "2026-07-22": {
 *       dayKey: "2026-07-22",
 *       noteIds: ["id1", "id2", ...]   // ordered, newest first
 *     }
 *   },
 *   notes: {
 *     "id1": {
 *       id, title, content, dayKey,
 *       createdAt, updatedAt, variant
 *     }
 *   }
 * }
 */

import { localStorageAdapter as adapter } from './localStorageAdapter.js';
import { todayKey } from '../utils/date.js';

let cache = null; // in-memory mirror, hydrated once on init

function emptyState() {
  return { boards: {}, notes: {} };
}

async function ensureLoaded() {
  if (!cache) {
    cache = (await adapter.load()) || emptyState();
  }
  return cache;
}

async function persist() {
  await adapter.save(cache);
}

function ensureBoard(state, dayKey) {
  if (!state.boards[dayKey]) {
    state.boards[dayKey] = { dayKey, noteIds: [] };
  }
  return state.boards[dayKey];
}

function makeId() {
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Deterministically alternates card style, echoing the prototype's mixed board */
function variantFor(index) {
  return index % 5 === 0 ? 'dark' : 'light';
}

export const noteStorage = {
  /** Call once on boot */
  async init() {
    await ensureLoaded();
  },

  /** Returns all notes for a given day, newest first */
  async getNotesForDay(dayKey) {
    const state = await ensureLoaded();
    const board = state.boards[dayKey];
    if (!board) return [];
    return board.noteIds
      .map((id) => state.notes[id])
      .filter(Boolean)
      .map((note, i) => ({ ...note, variant: variantFor(i) }));
  },

  /** Returns a single note by id */
  async getNote(id) {
    const state = await ensureLoaded();
    return state.notes[id] || null;
  },

  /**
   * Creates a note. Notes are ALWAYS created on today's board,
   * regardless of which day the user is currently viewing.
   */
  async createNote({ title, content }) {
    const state = await ensureLoaded();
    const dayKey = todayKey();
    const board = ensureBoard(state, dayKey);
    const now = Date.now();

    const note = {
      id: makeId(),
      title: title?.trim() || '',
      content: content?.trim() || '',
      dayKey,
      createdAt: now,
      updatedAt: now,
    };

    state.notes[note.id] = note;
    board.noteIds.unshift(note.id);
    await persist();
    return note;
  },

  /** Edits an existing note (allowed from any day it belongs to) */
  async updateNote(id, { title, content }) {
    const state = await ensureLoaded();
    const note = state.notes[id];
    if (!note) throw new Error(`Note ${id} not found`);

    note.title = title?.trim() || '';
    note.content = content?.trim() || '';
    note.updatedAt = Date.now();

    await persist();
    return note;
  },

  /** Deletes a note from its board */
  async deleteNote(id) {
    const state = await ensureLoaded();
    const note = state.notes[id];
    if (!note) return;

    const board = state.boards[note.dayKey];
    if (board) {
      board.noteIds = board.noteIds.filter((n) => n !== id);
    }
    delete state.notes[id];
    await persist();
  },
};
