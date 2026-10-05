// ═══════════════════════════════════════
// FILE: src/security/dom.js
// Manifest Journal — Security Layer
// ═══════════════════════════════════════

import { sanitizeUrl } from './sanitize.js';

const BLOCKED_TAGS = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'link',
  'meta',
  'base',
  'style',
]);

/**
 * Safely sets plain text content on an element. Never uses innerHTML.
 *
 * @param {HTMLElement} element
 * @param {string} text
 */
export function setText(element, text) {
  if (!element || typeof element.textContent === 'undefined') {
    throw new TypeError('Invalid DOM element provided to setText');
  }
  element.textContent = text == null ? '' : String(text);
}

/**
 * Sets HTML on an element using strict internal DOM sanitization.
 * Used exclusively for static trusted content like the Knowledge screen.
 *
 * @param {HTMLElement} element
 * @param {string} trustedHtml
 */
export function setHtml(element, trustedHtml) {
  if (!element) {
    throw new TypeError('Invalid DOM element provided to setHtml');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(trustedHtml || '', 'text/html');

  // Walk and clean all nodes
  const cleanTree = (node) => {
    const children = Array.from(node.children);
    for (const child of children) {
      const tagName = child.tagName.toLowerCase();

      // Remove blocked tags immediately
      if (BLOCKED_TAGS.has(tagName)) {
        child.remove();
        continue;
      }

      // Strip inline event attributes and dangerous URI schemes
      const attrs = Array.from(child.attributes);
      for (const attr of attrs) {
        const name = attr.name.toLowerCase();
        const value = (attr.value || '').trim().toLowerCase();

        if (name.startsWith('on')) {
          child.removeAttribute(attr.name);
          continue;
        }

        if (
          (name === 'href' || name === 'src' || name === 'action') &&
          (value.startsWith('javascript:') || value.startsWith('data:'))
        ) {
          child.removeAttribute(attr.name);
          continue;
        }
      }

      // Recurse into children
      cleanTree(child);
    }
  };

  cleanTree(doc.body);

  element.innerHTML = doc.body.innerHTML;
}

/**
 * Safely creates an element and sets attributes and children without string interpolation.
 *
 * @param {string} tag
 * @param {Record<string, any>} [attrs={}]
 * @param {Array<string|Node>} [children=[]]
 * @returns {HTMLElement}
 */
export function createEl(tag, attrs = {}, children = []) {
  if (typeof tag !== 'string' || BLOCKED_TAGS.has(tag.toLowerCase())) {
    throw new Error(`Creating element of tag "${tag}" is disallowed for security.`);
  }

  const el = document.createElement(tag);

  for (const [key, val] of Object.entries(attrs)) {
    if (val == null) continue;

    const lowerKey = key.toLowerCase();

    // Prevent inline event listeners via attributes
    if (lowerKey.startsWith('on')) {
      throw new Error(`Direct event attribute "${key}" blocked. Use addEventListener.`);
    }

    // Sanitize URLs for href and src
    if (lowerKey === 'href') {
      el.setAttribute(key, sanitizeUrl(String(val)));
      continue;
    }

    if (lowerKey === 'src') {
      const strVal = String(val);
      const isMedia = tag.toLowerCase() === 'img' || tag.toLowerCase() === 'video';
      if (isMedia && (strVal.startsWith('blob:') || strVal.startsWith('data:'))) {
        el.setAttribute(key, strVal);
      } else {
        el.setAttribute(key, sanitizeUrl(strVal));
      }
      continue;
    }

    el.setAttribute(key, String(val));
  }

  for (const child of children) {
    if (child == null) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }

  return el;
}
