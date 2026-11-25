/* Shared navigation and local asset helpers. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const { title } = window.TRIPS.meta;
  $$('[data-site-title]').forEach(element => { element.textContent = title; });
  const count = number => number.toLocaleString('zh-CN');
  const full = path => path.replace(/^assets\//, 'assets/hd/');
  const albumLink = id => `album.html?trip=${encodeURIComponent(id)}`;
  const node = (tag, className, value) => {
    const element = document.createElement(tag);
    element.className = className;
    if (value !== undefined) element.textContent = value;
    return element;
  };

  function facts(selector, values) {
    const root = $(selector);
    for (const [value, label] of values) {
      const item = node('div', 'hf');
      item.append(node('b', '', value), node('span', '', label));
      root.append(item);
    }
  }

  function navigation() {
    const ranges = $$('.nav-links a[href^="#"]').map(link => [link, $(link.hash)]);
    let scheduled = false;
    function paint() {
      scheduled = false;
      const scroll = window.scrollY;
      const range = document.documentElement.scrollHeight - window.innerHeight;
      $('#nav').classList.toggle('scrolled', scroll > 24);
      $('#progress').style.transform = `scaleX(${range > 0 ? Math.min(1, scroll / range) : 0})`;
      const active = ranges.findLastIndex(([, section]) => section.getBoundingClientRect().top <= window.innerHeight * 0.35);
      ranges.forEach(([link], index) => {
        link.classList.toggle('active', index === active);
        if (index === active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    function schedule() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(paint);
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    paint();
  }

  window.AlbumUI = { $, $$, count, full, albumLink, node, facts, navigation };
})();
