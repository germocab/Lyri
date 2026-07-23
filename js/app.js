/**
 * app.js — entry point
 * ---------------------------------------------------------
 * Boots the app: hydrates storage, renders today's board,
 * wires the FAB and editor, and watches for the day rolling
 * over at local midnight so the board refreshes automatically.
 */

import { noteStorage } from './storage/noteStorage.js';
import { createNoteCard } from './components/noteCard.js';
import { openEditor } from './components/noteEditor.js';
import { qs } from './utils/dom.js';
import { todayKey, formatDayKeyLong } from './utils/date.js';

const boardEl = qs('#board');
const emptyStateEl = qs('#empty-state');
const dateEyebrowEl = qs('#date-eyebrow');
const fab = qs('#fab');
const toastEl = qs('#toast');

let currentDayKey = todayKey();

async function init() {
  await noteStorage.init();
  renderHeader();
  await renderBoard();
  watchForDayChange();
  registerServiceWorker();
}

function renderHeader() {
  dateEyebrowEl.textContent = formatDayKeyLong(currentDayKey);
}

/** Renders every note for the current day onto the board */
async function renderBoard() {
  const notes = await noteStorage.getNotesForDay(currentDayKey);

  boardEl.innerHTML = '';
  emptyStateEl.hidden = notes.length > 0;

  notes.forEach((note, i) => {
    const card = createNoteCard(note, handleOpenNote);
    card.style.animationDelay = `${Math.min(i, 8) * 35}ms`;
    boardEl.appendChild(card);
  });
}

/** Opens the editor for an existing note */
async function handleOpenNote(note, cardEl) {
  await openEditor(note, cardEl, {
    save: handleSaveNote,
    delete: handleDeleteNote,
  });
}

/** Opens a blank editor for a brand-new note (always created on today's board) */
async function handleCreateNote() {
  await openEditor(null, null, {
    save: handleSaveNote,
    delete: handleDeleteNote,
  });
}

async function handleSaveNote({ id, title, content }) {
  if (!title && !content) return; // nothing to save

  if (id) {
    await noteStorage.updateNote(id, { title, content });
    showToast('Note updated');
  } else {
    await noteStorage.createNote({ title, content });
    showToast('Note added to today');
  }
  await renderBoard();
}

async function handleDeleteNote(id) {
  await noteStorage.deleteNote(id);
  showToast('Note deleted');
  await renderBoard();
}

let toastTimer = null;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

/** Polls for local midnight so a fresh, empty board appears without a reload */
function watchForDayChange() {
  setInterval(async () => {
    const latest = todayKey();
    if (latest !== currentDayKey) {
      currentDayKey = latest;
      renderHeader();
      await renderBoard();
      showToast('A new day has started');
    }
  }, 30_000);
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline support is best-effort; ignore failures */
    });
  }
}

fab.addEventListener('click', handleCreateNote);

init();
