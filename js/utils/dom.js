/**
 * Tiny DOM helpers to keep component code readable.
 */

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, value);
    }
  }
  for (const child of [].concat(children)) {
    if (child) node.appendChild(child);
  }
  return node;
}

/** Auto-grow a textarea to fit its content (used for the title field) */
export function autoGrow(textarea) {
  const resize = () => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };
  textarea.addEventListener('input', resize);
  resize();
}

/** requestAnimationFrame-based delay, avoids layout thrash before animating */
export function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
