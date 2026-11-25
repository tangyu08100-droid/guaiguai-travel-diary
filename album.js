/* Date chapters and the photo lightbox, based on xinjiang-album. */
(() => {
  'use strict';
  const { $, $$, count, full, albumLink, node, facts, navigation } = window.AlbumUI;
  const { meta, trips } = window.TRIPS;
  const wanted = new URLSearchParams(location.search).get('trip');
  const trip = wanted ? trips.find(item => item.id === wanted) : trips[0];
  if (!trip) {
    document.title = `找不到相册 · ${meta.title}`;
    $('#heroTitle').textContent = '找不到相册';
    $('#heroAction').href = 'index.html#trips';
    $('#heroAction').textContent = '返回相册目录';
    $('#works').hidden = $('#about').hidden = true;
    return;
  }

  document.title = `${trip.name} · ${meta.title}`;
  $('#heroImg').src = full(trip.hero);
  $('#heroImg').alt = trip.heroAlt;
  $('#heroTitle').textContent = trip.name;
  $('#heroTitle').classList.toggle('long-title', trip.name.length > 9);
  $('#heroEyebrow').textContent = trip.period;
  $('#heroSub').textContent = trip.place === trip.name ? trip.region : trip.place;
  $('#coLine').textContent = `${trip.name} · ${count(trip.total.photos)} 张照片`;
  const note = window.ALBUM_NOTES[trip.id];
  if (note) {
    $('#albumNoteText').textContent = note;
    $('#albumNote').hidden = false;
  }
  const captions = [[count(trip.total.photos), '张照片'], [trip.region, '地区']];
  if (trip.entries.length > 1) captions.push([trip.entries.length, '个照片分组']);
  facts('#heroFacts', captions);
  $('#worksLead').textContent = trip.entries.length > 1
    ? `共 ${count(trip.total.photos)} 张，选择一个分组查看照片。`
    : `共 ${count(trip.total.photos)} 张，点击照片查看大图。`;

  const detail = $('#detail');
  const lb = $('#lb');
  const grid = $('#grid');
  const filters = $('#filters');
  const chapterPrefix = '#entry-';
  const rowPattern = [7, 5, 4, 4, 4, 6, 6, 5, 7];
  let lightboxEntry;
  let lightboxIndex;

  function syncModal() {
    document.body.classList.toggle('modal-open', detail.open || lb.open);
  }

  function renderBackdrop() {
    const date = lightboxEntry.galleryDates[lightboxIndex];
    const total = lightboxEntry.galleryImages.length;
    const label = `${trip.name} · ${date || '日期待考'}`;
    $('#lbImg').src = full(lightboxEntry.galleryImages[lightboxIndex]);
    $('#lbImg').alt = `${label} · 第 ${lightboxIndex + 1} 张照片`;
    $('#lbCap').textContent = label;
    $('#lbCount').textContent = `${lightboxIndex + 1} / ${total}`;
    $('#lbPrev').hidden = $('#lbNext').hidden = total < 2;
  }

  function openLightbox(entry, index) {
    lightboxEntry = entry;
    lightboxIndex = index;
    renderBackdrop();
    lb.showModal();
    syncModal();
  }

  function step(direction) {
    const total = lightboxEntry.galleryImages.length;
    if (total < 2) return;
    lightboxIndex = (lightboxIndex + direction + total) % total;
    renderBackdrop();
  }

  function gallery(entry, destination) {
    const wall = node('div', 'gallery');
    const more = node('button', 'more-btn');
    more.type = 'button';
    const total = entry.galleryImages.length;
    let shown = 0;
    function appendBatch() {
      const end = Math.min(shown + 24, total);
      const batch = document.createDocumentFragment();
      for (let index = shown; index < end; index++) {
        const button = node('button', 'g');
        button.type = 'button';
        button.setAttribute('aria-label', `查看第 ${index + 1} 张照片`);
        const image = node('img', '');
        image.src = entry.galleryImages[index];
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        button.append(image);
        button.addEventListener('click', () => openLightbox(entry, index));
        batch.append(button);
      }
      wall.append(batch);
      shown = end;
      more.hidden = shown === total;
      more.textContent = `加载更多照片（剩余 ${total - shown} 张）`;
    }
    more.addEventListener('click', () => {
      const firstNew = shown;
      appendBatch();
      wall.children[firstNew].focus();
    });
    destination.append(wall, more);
    appendBatch();
  }

  function openChapter(entry) {
    if (detail.open) detail.close();
    const body = $('#detailBody');
    body.replaceChildren();
    $('#detailTitle').textContent = trip.name;
    const heading = node('header', 'chapter-heading');
    const meta = `${entry.date === '日期待考' ? '' : `${entry.date} · `}${count(entry.galleryImages.length)} 张照片`;
    heading.append(node('h2', '', entry.title), node('p', '', meta));
    body.append(heading);
    gallery(entry, body);
    detail.showModal();
    detail.scrollTop = 0;
    history.replaceState(null, '', `${chapterPrefix}${entry.id}`);
    syncModal();
  }

  function renderChapters(category = '') {
    const entries = trip.entries.filter(entry => !category || category === entry.categoryId);
    grid.replaceChildren();
    entries.forEach((entry, index) => {
      const card = node('a', 'card');
      card.href = chapterPrefix + entry.id;
      card.dataset.span = rowPattern[index % rowPattern.length];
      const media = node('div', 'card-media');
      const image = node('img', '');
      image.src = entry.coverImage;
      image.alt = '';
      image.loading = 'lazy';
      media.append(image);
      const copy = node('div', 'card-meta');
      const title = node('div', 'r1');
      title.append(node('span', 't', entry.title));
      const row = node('div', 'r2');
      row.append(node('span', 'loc', entry.date === '日期待考' ? '' : entry.date),
        node('span', 'cnt', `${count(entry.galleryImages.length)} 张`));
      copy.append(title, row);
      card.append(media, copy);
      card.addEventListener('click', event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        openChapter(entry);
      });
      grid.append(card);
    });
  }

  if (trip.entries.length === 1) {
    const host = $('#inlineGallery');
    host.hidden = false;
    gallery(trip.entries[0], host);
  } else {
    grid.hidden = false;
    renderChapters();
    if (trip.categories.length > 1) {
      filters.hidden = false;
      for (const item of [{ id: '', name: '全部' }, ...trip.categories]) {
        const button = node('button', item.id ? '' : 'on', item.name);
        button.type = 'button';
        button.setAttribute('aria-pressed', String(!item.id));
        filters.append(button);
        button.addEventListener('click', () => {
          $$('button', filters).forEach(control => {
            control.classList.toggle('on', control === button);
            control.setAttribute('aria-pressed', String(control === button));
          });
          renderChapters(item.id);
        });
      }
    }
  }

  function readChapterLink() {
    if (!location.hash.startsWith(chapterPrefix) || trip.entries.length < 2) return;
    const entry = trip.entries.find(item => item.id === location.hash.slice(chapterPrefix.length));
    if (entry && !detail.open) openChapter(entry);
  }

  $('#detailBack').addEventListener('click', () => detail.close());
  $('#detailX').addEventListener('click', () => detail.close());
  detail.addEventListener('close', () => {
    if (detail.open) return;
    if (location.hash.startsWith(chapterPrefix)) history.replaceState(null, '', '#works');
    syncModal();
  });
  $('#lbX').addEventListener('click', () => lb.close());
  $('#lbPrev').addEventListener('click', () => step(-1));
  $('#lbNext').addEventListener('click', () => step(1));
  lb.addEventListener('close', syncModal);
  lb.addEventListener('click', event => { if (event.target === lb) lb.close(); });
  lb.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
  });
  let touchStart;
  const stage = $('.lb-stage');
  stage.addEventListener('touchstart', event => { touchStart = event.changedTouches[0]; }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.clientX;
    const dy = touch.clientY - touchStart.clientY;
    touchStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) step(dx < 0 ? 1 : -1);
  }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchStart = null; });

  const others = trips.filter(item => item !== trip);
  const related = [...others.filter(item => item.region === trip.region), ...others.filter(item => item.region !== trip.region)].slice(0, 4);
  for (const item of related) {
    const card = node('a', 'other-card');
    card.href = albumLink(item.id);
    const image = node('img', '');
    image.src = item.cover;
    image.alt = '';
    image.loading = 'lazy';
    const label = node('span', 'oc-body');
    label.append(node('b', '', item.name), node('i', '', `${item.total.photos} 张`));
    card.append(image, label);
    $('#others').append(card);
  }
  window.addEventListener('hashchange', readChapterLink);
  readChapterLink();
  navigation();
})();
