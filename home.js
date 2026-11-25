/* Travel directory, destination map and timeline, based on xinjiang-album. */
(() => {
  'use strict';
  const { $, $$, count, full, albumLink, node, facts, navigation } = window.AlbumUI;
  const { meta, trips } = window.TRIPS;
  document.title = meta.title;
  const regions = ['西南', '华南', '华东', '西北', '华中', '华北'];
  const colors = ['#a6c5e8', '#efbb94', '#b3d2ad', '#efce78', '#df9eb5', '#bcb2e8'];
  const photos = trips.reduce((total, trip) => total + trip.total.photos, 0);
  const spans = [7, 5, 5, 7, 6, 6];
  const directory = $('#tripGrid');
  const search = $('#albumSearch');
  let region = '';
  let tripLimit = 10;

  const hero = $('#hheroImg');
  hero.src = full(meta.hero);
  hero.alt = meta.heroAlt;
  $('#heroCredit').href = albumLink(meta.heroTrip);
  $('#heroCredit').textContent = `封面 · ${meta.heroPlace}`;
  $('#coArchive').textContent = `${meta.archive} · ${count(photos)} 张照片`;
  facts('#hFacts', [[count(trips.length), '本相册'], [count(photos), '张照片'], [meta.archive, '拍摄年份']]);

  function tripCard(trip, index) {
    const card = node('a', 'trip-card');
    card.href = albumLink(trip.id);
    card.dataset.span = spans[index % spans.length];
    const media = node('div', 'tc-media');
    const image = node('img', '');
    image.src = trip.cover;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    media.append(image);
    const body = node('div', 'tc-body');
    const label = node('div', 'tc-top');
    label.append(node('span', 'tc-place', trip.region), node('span', 'tc-period', trip.period));
    const foot = node('div', 'tc-foot');
    const location = trip.place === trip.name ? '' : trip.place;
    foot.append(node('span', 'tc-place', location), node('span', 'tc-counts', `${count(trip.total.photos)} 张照片`));
    body.append(label, node('h3', 'tc-name', trip.name), foot);
    card.append(media, body);
    return card;
  }

  function renderDirectory() {
    const query = search.value.toLowerCase().replace(/[\s·・、，,]/g, '');
    const list = trips.filter(trip => (!region || trip.region === region) &&
      [trip.name, trip.place, trip.folder, trip.region, trip.id, ...trip.geo.map(point => point.n)]
        .some(value => value.toLowerCase().replace(/[\s·・、，,]/g, '').includes(query)));
    directory.replaceChildren(...list.slice(0, tripLimit).map(tripCard));
    $('#tripStatus').textContent = `找到 ${list.length} 本相册`;
    $('#tripEmpty').hidden = list.length > 0;
    const more = $('#moreTrips');
    more.hidden = list.length <= tripLimit;
    more.textContent = `显示其余 ${list.length - tripLimit} 本相册`;
  }

  for (const label of ['', ...regions]) {
    const filter = node('button', label ? '' : 'on', label || '全部');
    filter.type = 'button';
    filter.setAttribute('aria-pressed', String(!label));
    $('#regionFilters').append(filter);
    filter.addEventListener('click', () => {
      region = label;
      tripLimit = 10;
      $$('#regionFilters button').forEach(button => {
        button.classList.toggle('on', button === filter);
        button.setAttribute('aria-pressed', String(button === filter));
      });
      renderDirectory();
    });
  }
  search.addEventListener('input', () => { tripLimit = 10; renderDirectory(); });
  $('#moreTrips').addEventListener('click', () => {
    const firstNew = tripLimit;
    tripLimit = trips.length;
    renderDirectory();
    directory.children[firstNew]?.focus();
  });
  renderDirectory();

  function renderMap() {
    const svg = $('#mapSvg');
    const list = $('#mapList');
    const width = 1000;
    const height = 590;
    const mapLabels = new Set(['西藏（示意）', '呼伦贝尔', '宁夏（示意）', '杭州', '大理', '西安', '桂林', '海南（示意）']);
    const captions = [];
    const x = longitude => (longitude - 86) * 26;
    const y = latitude => (53 - latitude) * 16;
    function svgNode(tag, attributes, parent = svg, value) {
      const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [key, attr] of Object.entries(attributes)) child.setAttribute(key, attr);
      if (value !== undefined) child.textContent = value;
      parent.append(child);
      return child;
    }
    for (let longitude = 90; longitude <= 120; longitude += 5) {
      svgNode('line', { x1: x(longitude), y1: 0, x2: x(longitude), y2: height, class: 'map-gridline' });
      svgNode('text', { x: x(longitude) + 7, y: height - 43, class: 'map-coordinate' }, svg, `${longitude}°E`);
    }
    for (let latitude = 20; latitude <= 50; latitude += 5) {
      svgNode('line', { x1: 0, y1: y(latitude), x2: width, y2: y(latitude), class: 'map-gridline' });
      svgNode('text', { x: 16, y: y(latitude) - 7, class: 'map-coordinate' }, svg, `${latitude}°N`);
    }
    function highlight(id) {
      $$('.map-marker', svg).forEach(marker => marker.classList.toggle('is-active', marker.dataset.trip === id));
      $$('.ml-item', list).forEach(item => item.classList.toggle('is-active', item.dataset.trip === id));
    }
    for (const trip of trips) {
      const color = colors[regions.indexOf(trip.region)];
      for (const point of trip.geo) {
        const marker = svgNode('a', { href: albumLink(trip.id), class: 'map-marker', 'data-trip': trip.id,
          'aria-label': `${point.n}，打开${trip.name}相册`, style: `--marker: ${color}` });
        const cx = x(point.lon);
        const cy = y(point.lat);
        svgNode('title', {}, marker, `${point.n} · ${trip.name}`);
        svgNode('circle', { cx, cy, r: 12, class: 'map-halo' }, marker);
        svgNode('circle', { cx, cy, r: 4.3, class: 'map-dot' }, marker);
        if (mapLabels.has(point.n)) captions.push([point.n, cx, cy]);
        marker.addEventListener('mouseenter', () => highlight(trip.id));
        marker.addEventListener('mouseleave', () => highlight(''));
        marker.addEventListener('focus', () => highlight(trip.id));
        marker.addEventListener('blur', () => highlight(''));
      }
      const item = node('a', 'ml-item');
      item.dataset.trip = trip.id;
      item.href = albumLink(trip.id);
      const dot = node('span', 'ml-dot');
      dot.style.backgroundColor = color;
      dot.setAttribute('aria-hidden', 'true');
      item.append(dot, node('b', '', trip.name), node('span', 'ml-count', `${trip.total.photos} 张`));
      item.addEventListener('mouseenter', () => highlight(trip.id));
      item.addEventListener('mouseleave', () => highlight(''));
      item.addEventListener('focus', () => highlight(trip.id));
      item.addEventListener('blur', () => highlight(''));
      list.append(item);
    }
    for (const [name, cx, cy] of captions) {
      svgNode('text', { x: cx + 14, y: cy - 9, class: 'map-label', 'aria-hidden': 'true' }, svg, name.replace('（示意）', ''));
    }
  }

  const dates = [...trips].sort((a, b) => b.end.localeCompare(a.end));
  function renderTimeline(start, end) {
    const timeline = $('#tl');
    for (const trip of dates.slice(start, end)) {
      const row = node('li', 'tl-item');
      const dot = node('span', 'tl-dot');
      dot.setAttribute('aria-hidden', 'true');
      const body = node('div', 'tl-body');
      const link = node('a', 'tl-album', trip.name);
      link.href = albumLink(trip.id);
      body.append(link, node('p', 'tl-note', `${trip.period} · ${count(trip.total.photos)} 张照片`));
      row.append(node('span', 'tl-year', trip.end ? trip.end.slice(0, 4) : '待考'), dot, body);
      timeline.append(row);
    }
  }
  const firstDates = 8;
  const moreDates = $('#moreDates');
  moreDates.hidden = dates.length <= firstDates;
  moreDates.textContent = `显示其余 ${dates.length - firstDates} 本相册`;
  moreDates.addEventListener('click', () => {
    renderTimeline(firstDates, dates.length);
    moreDates.hidden = true;
    $$('.tl-album')[firstDates]?.focus();
  });
  renderMap();
  renderTimeline(0, firstDates);
  navigation();
})();
