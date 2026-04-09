/**
 * Shared DOM helpers — navigation shell, library switcher,
 * theme toggle, and reusable component builders.
 */

import { loadLibrary, getLibraries, getLibraryLabels, getCurrentLibraryKey } from './tokens.js';

/* -------------------------------------------------------
   SVG icon library (inline to avoid external deps)
   ------------------------------------------------------- */

const ICONS = {
  colours: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  spacing: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 6H3"/><path d="M17 12H7"/><path d="M19 18H5"/></svg>`,
  typography: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  sizes: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
};

/* -------------------------------------------------------
   Navigation page map
   ------------------------------------------------------- */

const NAV_ITEMS = [
  { href: 'index.html',      label: 'Overview',    icon: 'home' },
  { href: 'colours.html',    label: 'Colours',     icon: 'colours' },
  { href: 'spacing.html',    label: 'Spacing',     icon: 'spacing' },
  { href: 'typography.html', label: 'Typography',  icon: 'typography' },
  { href: 'sizes.html',      label: 'Sizes',       icon: 'sizes' },
];

/* -------------------------------------------------------
   Shell initialisation — call from every page's <script>
   ------------------------------------------------------- */

/** Render the sidebar + mobile toggle, wire up the library switcher,
 *  restore persisted theme & library, then invoke the page callback
 *  with the freshly-loaded token data. */
export async function initPage(pageCallback) {
  const currentFile = location.pathname.split('/').pop() || 'index.html';

  buildSidebar(currentFile);
  buildMobileToggle();
  restoreTheme();

  const savedLib = localStorage.getItem('dt-library') || 'golden';
  const select = document.getElementById('library-select');
  if (select) select.value = savedLib;

  const data = await loadLibrary(savedLib);
  if (pageCallback) pageCallback(data);

  if (select) {
    select.addEventListener('change', async () => {
      localStorage.setItem('dt-library', select.value);
      const fresh = await loadLibrary(select.value);
      if (pageCallback) pageCallback(fresh);
    });
  }
}

/* -------------------------------------------------------
   Sidebar builder
   ------------------------------------------------------- */

function buildSidebar(currentFile) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const labels = getLibraryLabels();
  const libs = getLibraries();

  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <h1>Design Tokens</h1>
      <span>Reference Library</span>
    </div>

    <div class="library-switcher">
      <label for="library-select">Library</label>
      <select id="library-select" aria-label="Choose design library">
        ${Object.keys(libs).map((k) =>
          `<option value="${k}">${labels[k]}</option>`
        ).join('')}
      </select>
    </div>

    <nav class="sidebar-nav" aria-label="Main navigation">
      ${NAV_ITEMS.map((item) => {
        const active = currentFile === item.href ? ' class="active"' : '';
        return `<a href="${item.href}"${active} aria-current="${currentFile === item.href ? 'page' : 'false'}">${ICONS[item.icon]}<span>${item.label}</span></a>`;
      }).join('')}
    </nav>

    <div class="theme-toggle">
      <button id="theme-btn" type="button" aria-label="Toggle site theme">
        <span class="theme-icon">${ICONS.moon}</span>
        <span class="theme-label">Dark</span>
      </button>
    </div>
  `;

  const themeBtn = document.getElementById('theme-btn');
  themeBtn?.addEventListener('click', toggleTheme);
}

/* -------------------------------------------------------
   Mobile hamburger
   ------------------------------------------------------- */

function buildMobileToggle() {
  const btn = document.createElement('button');
  btn.className = 'mobile-menu-toggle';
  btn.setAttribute('aria-label', 'Toggle navigation');
  btn.innerHTML = ICONS.menu;
  document.body.prepend(btn);

  btn.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.toggle('open');
  });

  document.querySelector('.main')?.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.remove('open');
  });
}

/* -------------------------------------------------------
   Theme toggle
   ------------------------------------------------------- */

function restoreTheme() {
  const saved = localStorage.getItem('dt-theme') || 'dark';
  if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
  updateThemeButton();
}

function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (isLight) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('dt-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('dt-theme', 'light');
  }
  updateThemeButton();
}

function updateThemeButton() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const iconEl = document.querySelector('.theme-icon');
  const labelEl = document.querySelector('.theme-label');
  if (iconEl) iconEl.innerHTML = isLight ? ICONS.sun : ICONS.moon;
  if (labelEl) labelEl.textContent = isLight ? 'Light' : 'Dark';
}

/* -------------------------------------------------------
   Reusable DOM builders
   ------------------------------------------------------- */

/** Create an element with optional class, attributes, and children. */
export function el(tag, opts = {}) {
  const elem = document.createElement(tag);
  if (opts.className) elem.className = opts.className;
  if (opts.text) elem.textContent = opts.text;
  if (opts.html) elem.innerHTML = opts.html;
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) elem.setAttribute(k, v);
  }
  if (opts.style) {
    for (const [k, v] of Object.entries(opts.style)) elem.style[k] = v;
  }
  if (opts.children) {
    for (const child of opts.children) {
      if (child) elem.appendChild(child);
    }
  }
  return elem;
}

/** Section label with divider line. */
export function sectionLabel(text) {
  return el('div', { className: 'section-label', text });
}
