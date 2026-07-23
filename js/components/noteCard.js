/**
 * noteCard
 * ---------------------------------------------------------
 * Renders a single note as a card element. Purely presentational —
 * it takes a note object and an onOpen callback, and returns a DOM node.
 */

import { el } from '../utils/dom.js';
import { formatTime } from '../utils/date.js';

/**
 * @param {object} note
 * @param {(note, cardEl) => void} onOpen - called when the card is tapped
 */
export function createNoteCard(note, onOpen) {
  const card = el('article', {
    class: `note-card variant-${note.variant} entering`,
    'data-id': note.id,
    role: 'button',
    tabindex: '0',
  });

  if (note.title) {
    card.appendChild(el('h3', { class: 'note-card-title', text: note.title }));
  }

  if (note.content) {
    card.appendChild(el('p', { class: 'note-card-body', text: note.content }));
  }

  card.appendChild(
    el('span', { class: 'note-card-time', text: formatTime(note.updatedAt) })
  );

  const open = () => onOpen(note, card);
  card.addEventListener('click', open);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });

  return card;
}
