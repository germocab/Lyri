/**
 * noteEditor
 * ---------------------------------------------------------
 * Controls the full-screen editor sheet that already lives in
 * index.html. Handles:
 *   - shared-element (FLIP) open animation from a tapped card
 *   - reverse animation on close
 *   - save / delete actions, delegated back to the caller
 *
 * This module owns no data — it's told what to edit and reports
 * back via callbacks, keeping storage concerns out of the UI layer.
 */

import { qs, autoGrow, nextFrame } from '../utils/dom.js';
import { formatTime } from '../utils/date.js';

const screen = qs('#editor-screen');
const sheet = qs('#editor-sheet');
const backdrop = qs('#editor-backdrop');
const titleField = qs('#editor-title');
const contentField = qs('#editor-content');
const metaLabel = qs('#editor-meta');
const closeBtn = qs('#editor-close');
const saveBtn = qs('#editor-save');
const deleteBtn = qs('#editor-delete');

autoGrow(titleField);

let activeNote = null; // note being edited, or null when creating
let sourceCardEl = null; // the card we animated from, for the reverse animation
let onSave = null;
let onDelete = null;

/**
 * Opens the editor.
 * @param {object|null} note - existing note, or null for a new note
 * @param {HTMLElement|null} cardEl - the card element tapped (for FLIP), or null for FAB
 * @param {{save: Function, delete: Function}} handlers
 */
export async function openEditor(note, cardEl, handlers) {
  activeNote = note;
  sourceCardEl = cardEl;
  onSave = handlers.save;
  onDelete = handlers.delete;

  titleField.value = note?.title || '';
  contentField.value = note?.content || '';
  deleteBtn.hidden = !note;
  metaLabel.textContent = note ? `Edited ${formatTime(note.updatedAt)}` : 'New note';

  autoGrow(titleField);

  screen.setAttribute('aria-hidden', 'false');
  screen.classList.add('open');

  if (cardEl) {
    await animateFromCard(cardEl);
  } else {
    sheet.classList.remove('from-card');
    sheet.style.transform = '';
  }

  // Focus without triggering iOS scroll jump
  requestAnimationFrame(() => {
    (note ? contentField : titleField).focus({ preventScroll: true });
  });
}

/** Runs the FLIP transform: sheet starts sized/positioned like the card, then animates to full screen */
async function animateFromCard(cardEl) {
  const startRect = cardEl.getBoundingClientRect();
  const endRect = { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };

  const scaleX = startRect.width / endRect.width;
  const scaleY = startRect.height / endRect.height;
  const translateX = startRect.left - endRect.left + (startRect.width - endRect.width) / 2;
  const translateY = startRect.top - endRect.top + (startRect.height - endRect.height) / 2;

  sheet.classList.add('from-card');
  sheet.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
  sheet.style.opacity = '0.4';
  sheet.style.borderRadius = '26px';

  await nextFrame();

  sheet.style.transition = `transform var(--dur-med) var(--ease-out-expo), opacity var(--dur-med), border-radius var(--dur-med)`;
  sheet.style.transition =
    'transform 380ms cubic-bezier(0.16,1,0.3,1), opacity 280ms ease, border-radius 380ms ease';
  sheet.style.transform = 'translate(0,0) scale(1,1)';
  sheet.style.opacity = '1';
  sheet.style.borderRadius = '32px 32px 0 0';

  cardEl.style.visibility = 'hidden';
}

/** Reverses the FLIP animation back into the source card, or fades out if opened via FAB */
async function closeEditor() {
  if (sourceCardEl && sourceCardEl.isConnected) {
    const startRect = sourceCardEl.getBoundingClientRect();
    const endRect = { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };

    const scaleX = startRect.width / endRect.width;
    const scaleY = startRect.height / endRect.height;
    const translateX = startRect.left - endRect.left + (startRect.width - endRect.width) / 2;
    const translateY = startRect.top - endRect.top + (startRect.height - endRect.height) / 2;

    sheet.style.transition =
      'transform 340ms cubic-bezier(0.32,0,0.67,0), opacity 260ms ease, border-radius 340ms ease';
    sheet.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
    sheet.style.opacity = '0.5';
    sheet.style.borderRadius = '26px';

    await waitForTransition(sheet);
    sourceCardEl.style.visibility = '';
  }

  screen.classList.remove('open');
  screen.setAttribute('aria-hidden', 'true');

  await waitForTransition(backdrop);

  // reset inline styles set during FLIP so next open starts clean
  sheet.style.transition = '';
  sheet.style.transform = '';
  sheet.style.opacity = '';
  sheet.style.borderRadius = '';
  sheet.classList.remove('from-card');

  activeNote = null;
  sourceCardEl = null;
}

function waitForTransition(node) {
  return new Promise((resolve) => {
    const done = () => {
      node.removeEventListener('transitionend', done);
      resolve();
    };
    node.addEventListener('transitionend', done);
    // safety fallback in case transitionend doesn't fire
    setTimeout(resolve, 420);
  });
}

async function handleSave() {
  const title = titleField.value.trim();
  const content = contentField.value.trim();

  if (!title && !content) {
    await closeEditor();
    return;
  }

  await onSave({ id: activeNote?.id, title, content });
  await closeEditor();
}

async function handleDelete() {
  if (!activeNote) return;
  await onDelete(activeNote.id);
  await closeEditor();
}

closeBtn.addEventListener('click', () => handleSave());
saveBtn.addEventListener('click', () => handleSave());
deleteBtn.addEventListener('click', () => handleDelete());
backdrop.addEventListener('click', () => handleSave());
