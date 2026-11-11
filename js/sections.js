/* ==========================================================================
   Sections — behaviour for the rebuilt content sections:
   mobile nav, district tabs, town brochure carousel, live server/Discord
   status, copy IP, wiki widget, citizen roster (leaders + towns + search),
   profile modal, scrollspy, back-to-top.

   Everything renders from window.LiveData so the directory, the map area
   and the hero stats always show the same trusted numbers.
   ========================================================================== */
(function () {
  'use strict';

  const config = window.SITE_CONFIG || {};
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

  /* ---------- Toast -------------------------------------------------------*/
  const toastEl = document.getElementById('toast');
  let toastTimeout;
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }

  /* ---------- Mobile nav --------------------------------------------------*/
  const navToggle = document.getElementById('navToggle');
  const siteNav = document.getElementById('siteNav');
  const navScrim = document.getElementById('navScrim');
  const navMQ = window.matchMedia('(max-width: 1080px)');

  function syncNavForViewport() {
    if (!siteNav) return;
    if (navMQ.matches && !siteNav.classList.contains('open')) {
      siteNav.setAttribute('inert', '');
      siteNav.setAttribute('aria-hidden', 'true');
    } else {
      siteNav.removeAttribute('inert');
      siteNav.removeAttribute('aria-hidden');
    }
  }
  function openNav() {
    siteNav.classList.add('open');
    navToggle.classList.add('open');
    navScrim.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    siteNav.removeAttribute('inert');
    siteNav.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeNav(returnFocus) {
    siteNav.classList.remove('open');
    navToggle.classList.remove('open');
    navScrim.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    syncNavForViewport();
    if (returnFocus) navToggle.focus();
  }
  if (navToggle && siteNav) {
    syncNavForViewport();
    navMQ.addEventListener('change', syncNavForViewport);
    navToggle.addEventListener('click', () => {
      siteNav.classList.contains('open') ? closeNav(true) : openNav();
    });
    if (navScrim) navScrim.addEventListener('click', () => closeNav(true));
    $$ ('#siteNav a').forEach(a => a.addEventListener('click', () => closeNav(false)));
  }

  /* ---------- Back to top -------------------------------------------------*/
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- Scrollspy: highlight current section in nav ------------------*/
  const spyIds = ['capital', 'towns', 'map', 'wiki', 'citizens'];
  const spySections = spyIds.map(id => document.getElementById(id)).filter(Boolean);
  const spyLinks = $$('#siteNav a').filter(a => (a.getAttribute('href') || '').startsWith('#'));
  function setActiveNavLink(id) {
    spyLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
  }
  if (spySections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActiveNavLink(e.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    spySections.forEach(sec => spy.observe(sec));
  }

  /* ---------- District tabs (Capital section) ------------------------------*/
  $$('.district-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.district-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      $$('.district-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panel = document.getElementById('panel-' + tab.dataset.panel);
      if (panel) panel.classList.add('active');
    });
  });

  /* ---------- Town brochure carousel ---------------------------------------*/
  (function brochure() {
    const track = document.getElementById('brochureTrack');
    if (!track) return;
    const prev = document.getElementById('brochurePrev');
    const next = document.getElementById('brochureNext');
    const dots = $$('#brochureDots .brochure-dot');
    let i = 0;
    const n = track.children.length;

    function go(to) {
      i = (to + n) % n;
      track.style.transform = 'translateX(' + (-i * 100) + '%)';
      dots.forEach((d, di) => d.classList.toggle('active', di === i));
    }
    if (prev) prev.addEventListener('click', () => go(i - 1));
    if (next) next.addEventListener('click', () => go(i + 1));
    dots.forEach(d => d.addEventListener('click', () => go(parseInt(d.getAttribute('data-i'), 10))));

    // swipe on touch
    let x0 = null;
    track.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });

    // keyboard when the carousel is focused
    const root = document.getElementById('townBrochure');
    if (root) {
      root.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') go(i + 1);
        if (e.key === 'ArrowLeft') go(i - 1);
      });
    }
  })();

  /* ---------- Live server status + Copy IP ---------------------------------*/
  const serverStatusDot = document.getElementById('serverStatusDot');
  const serverStatusText = document.getElementById('serverStatusText');
  const copyIpBtn = document.getElementById('copyIpBtn');
  const copyIpLabel = document.getElementById('copyIpLabel');

  async function loadServerStatus() {
    if (!serverStatusDot || !serverStatusText) return;
    try {
      const res = await fetch('https://api.mcsrvstat.us/3/' + encodeURIComponent(config.SERVER_IP));
      const data = await res.json();
      if (data.online) {
        serverStatusDot.className = 'status-dot online';
        const count = data.players && typeof data.players.online === 'number' ? data.players.online : null;
        serverStatusText.textContent = count !== null ? 'Server Online · ' + count + ' playing' : 'Server Online';
      } else {
        serverStatusDot.className = 'status-dot offline';
        serverStatusText.textContent = 'Server Offline';
      }
    } catch (err) {
      serverStatusDot.className = 'status-dot offline';
      serverStatusText.textContent = 'Status unavailable';
    }
  }
  loadServerStatus();
  setInterval(loadServerStatus, 60000);

  if (copyIpBtn) {
    copyIpBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(config.SERVER_IP);
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = config.SERVER_IP;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e2) { /* ignore */ }
        document.body.removeChild(ta);
      }
      copyIpLabel.textContent = '✓ Copied!';
      copyIpBtn.classList.add('copied');
      showToast('Server IP copied: ' + config.SERVER_IP);
      setTimeout(() => {
        copyIpLabel.textContent = 'Copy Server IP';
        copyIpBtn.classList.remove('copied');
      }, 2000);
    });
  }

  /* ---------- Discord member count ------------------------------------------*/
  const discordStatusText = document.getElementById('discordStatusText');
  async function loadDiscordStatus() {
    if (!discordStatusText) return;
    try {
      const res = await fetch('https://discord.com/api/v10/invites/' + config.DISCORD_INVITE_CODE + '?with_counts=true&with_expiration=false');
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      const online = data.approximate_presence_count;
      const total = data.approximate_member_count;
      discordStatusText.textContent =
        (typeof online === 'number' && typeof total === 'number')
          ? online + ' online · ' + total + ' members'
          : 'Join our Discord';
    } catch (err) {
      discordStatusText.textContent = 'Join our Discord';
    }
  }
  loadDiscordStatus();

  /* ---------- Wiki widget (lazy, loads when scrolled near) ------------------*/
  const WIKI_PAGE_TITLE = config.WIKI_PAGE_TITLE || 'Cuba';
  const wikiWidgetBody = document.getElementById('wikiWidgetBody');

  async function loadWikiWidget() {
    if (!wikiWidgetBody) return;
    try {
      const params = new URLSearchParams({
        action: 'query', format: 'json', origin: '*',
        prop: 'extracts|pageimages', exintro: '1', explaintext: '1', exchars: '400',
        piprop: 'thumbnail', pithumbsize: '300', titles: WIKI_PAGE_TITLE,
      });
      const res = await fetch('https://wiki.diplomaticamc.com/api.php?' + params);
      const data = await res.json();
      const pages = data.query && data.query.pages;
      const page = pages ? Object.values(pages)[0] : null;

      if (!page || page.missing !== undefined) {
        wikiWidgetBody.innerHTML = '<p class="muted">No wiki page found titled "' + WIKI_PAGE_TITLE + '" yet. Once the nation\'s page exists on the DMC Wiki it will show up here automatically.</p>';
        return;
      }
      const extract = page.extract ? page.extract.trim() : 'No summary available yet.';
      const thumb = page.thumbnail ? page.thumbnail.source : null;
      const pageUrl = 'https://wiki.diplomaticamc.com/wiki/' + encodeURIComponent(page.title.replace(/ /g, '_'));
      wikiWidgetBody.innerHTML =
        (thumb ? '<img src="' + thumb + '" alt="' + page.title + '" loading="lazy" decoding="async">' : '') +
        '<div class="wiki-widget-text"><h3>' + page.title + '</h3><p>' + extract + '</p>' +
        '<a href="' + pageUrl + '" target="_blank" rel="noopener">Read Full Entry →</a></div>';
    } catch (err) {
      wikiWidgetBody.innerHTML = '<p class="muted">Couldn\'t reach the wiki right now — <a href="https://wiki.diplomaticamc.com/wiki/' +
        encodeURIComponent(WIKI_PAGE_TITLE.replace(/ /g, '_')) + '" target="_blank" rel="noopener">view it directly here</a>.</p>';
    }
  }
  const wikiSection = document.getElementById('wiki');
  if (wikiSection && 'IntersectionObserver' in window) {
    let wikiLoaded = false;
    const wikiObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !wikiLoaded) {
          wikiLoaded = true;
          loadWikiWidget();
          wikiObserver.disconnect();
        }
      });
    }, { rootMargin: '400px' });
    wikiObserver.observe(wikiSection);
  } else {
    loadWikiWidget();
  }

  /* ---------- Profile modal --------------------------------------------------*/
  const profileOverlay = document.getElementById('profileOverlay');
  let lastProfileTrigger = null;

  function openProfile(c) {
    if (!profileOverlay) return;
    lastProfileTrigger = document.activeElement;
    const avatar = 'https://mc-heads.net/avatar/' + encodeURIComponent(c.username) + '/128';
    const profileImage = document.getElementById('pImg');
    profileImage.hidden = false;
    profileImage.alt = c.username;
    profileImage.onerror = function () { this.hidden = true; };
    profileImage.src = avatar;
    document.getElementById('pName').textContent = c.username;
    document.getElementById('pRole').textContent = c.role || 'Citizen';
    document.getElementById('pBio').textContent = c.bio || 'No bio has been added for this citizen yet.';
    document.getElementById('pTown').textContent = c.town || 'Unassigned';
    document.getElementById('pJoined').textContent = c.joined || 'Unknown';
    profileOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('profileClose').focus();
  }
  function closeProfile() {
    if (!profileOverlay) return;
    profileOverlay.classList.remove('open');
    document.body.style.overflow = '';
    if (lastProfileTrigger) lastProfileTrigger.focus();
  }
  const profileClose = document.getElementById('profileClose');
  if (profileClose) profileClose.addEventListener('click', closeProfile);
  if (profileOverlay) profileOverlay.addEventListener('click', (e) => { if (e.target === profileOverlay) closeProfile(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (profileOverlay && profileOverlay.classList.contains('open')) closeProfile();
      if (siteNav && siteNav.classList.contains('open')) closeNav(true);
    }
  });

  function makeAvatarImg(username, size) {
    const avatar = document.createElement('span');
    avatar.className = 'resident-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    const initials = document.createElement('span');
    initials.className = 'resident-avatar-initials';
    initials.textContent = username.slice(0, 2).toUpperCase();
    avatar.appendChild(initials);

    const img = document.createElement('img');
    img.alt = '';
    img.setAttribute('role', 'presentation');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = 'https://mc-heads.net/avatar/' + encodeURIComponent(username) + '/' + size;
    img.addEventListener('load', () => avatar.classList.add('has-image'), { once: true });
    img.addEventListener('error', () => img.remove(), { once: true });
    avatar.appendChild(img);
    return avatar;
  }

  /* ---------- Towns & residents roster --------------------------------------*/
  function renderTownsRoster(list) {
    const grid = document.getElementById('townsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const townFilter = document.getElementById('townFilter');
    const rosterSort = document.getElementById('rosterSort');
    const selectedTown = townFilter ? townFilter.value : '';
    const towns = list.filter(t => t.name && Array.isArray(t.residents) && t.residents.length);
    if (townFilter) {
      const options = ['<option value="">All towns</option>'];
      towns.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(t => {
        const option = document.createElement('option');
        option.value = t.name;
        option.textContent = t.name;
        options.push(option.outerHTML);
      });
      townFilter.innerHTML = options.join('');
      townFilter.value = towns.some(t => t.name === selectedTown) ? selectedTown : '';
    }

    if (rosterSort && rosterSort.value === 'residents') {
      towns.sort((a, b) => b.residents.length - a.residents.length || a.name.localeCompare(b.name));
    } else {
      towns.sort((a, b) => a.name.localeCompare(b.name));
    }

    towns.forEach((t) => {
      const residents = t.residents;
      if (!residents.length) return;
      const card = document.createElement('div');
      card.className = 'town-roster-card';
      card.dataset.town = t.name.toLowerCase();

      const head = document.createElement('div');
      head.className = 'town-roster-head';
      const h4 = document.createElement('h4');
      h4.textContent = t.name;
      const count = document.createElement('span');
      count.className = 'town-roster-count';
      count.textContent = residents.length + ' ' + (residents.length === 1 ? 'resident' : 'residents');
      head.appendChild(h4);
      head.appendChild(count);
      card.appendChild(head);

      const chips = document.createElement('div');
      chips.className = 'town-residents-chips';
      residents.forEach((r) => {
        if (!r.username) return;
        const isMayor = typeof t.mayor === 'string' &&
          t.mayor.toLowerCase() === r.username.toLowerCase();
        const person = {
          username: r.username,
          role: isMayor ? 'Mayor of ' + t.name : 'Resident of ' + t.name,
          town: t.name,
          joined: '',
          bio: '',
        };
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'resident-chip';
        chip.setAttribute('aria-label', 'View profile: ' + r.username + ', ' + person.role);
        chip.dataset.name = r.username.toLowerCase();
        chip.appendChild(makeAvatarImg(r.username, 32));
        chip.appendChild(document.createTextNode(r.username));
        if (isMayor) {
          const label = document.createElement('span');
          label.className = 'resident-role';
          label.textContent = 'Mayor';
          chip.appendChild(label);
        }
        chip.addEventListener('click', () => openProfile(person));
        chips.appendChild(chip);
      });
      card.appendChild(chips);
      grid.appendChild(card);
    });
  }

  /* ---------- Roster search ---------------------------------------------------*/
  const citizenSearch = document.getElementById('citizenSearch');
  const rosterEmpty = document.getElementById('rosterEmpty');
  const rosterEmptyQuery = document.getElementById('rosterEmptyQuery');
  const rosterClearBtn = document.getElementById('rosterClear');
  const townFilter = document.getElementById('townFilter');
  const rosterSort = document.getElementById('rosterSort');
  const rosterSummary = document.getElementById('rosterSummary');

  function filterRoster() {
    if (!citizenSearch) return;
    const q = citizenSearch.value.trim().toLowerCase();
    const selectedTown = townFilter ? townFilter.value.toLowerCase() : '';
    let anyVisible = false;
    let visibleTowns = 0;
    let visibleResidents = 0;

    $$('#townsGrid .town-roster-card').forEach(card => {
      const townName = card.dataset.town || '';
      const townSelected = !selectedTown || townName === selectedTown;
      const townMatchesSearch = !q || townName.includes(q);
      let matchedResidents = 0;
      card.querySelectorAll('.resident-chip').forEach(chip => {
        const residentMatchesSearch = !q || (chip.dataset.name || '').includes(q);
        const visible = townSelected && (townMatchesSearch || residentMatchesSearch);
        chip.classList.toggle('roster-hidden', !visible);
        if (visible) matchedResidents++;
      });
      const cardMatch = townSelected && (townMatchesSearch || matchedResidents > 0);
      card.classList.toggle('roster-hidden', !cardMatch);
      if (cardMatch) {
        anyVisible = true;
        visibleTowns++;
        visibleResidents += matchedResidents;
      }
    });

    if (rosterEmptyQuery) rosterEmptyQuery.textContent = citizenSearch.value.trim();
    if (rosterEmpty) rosterEmpty.classList.toggle('show', !anyVisible);
    if (rosterSummary) {
      rosterSummary.textContent = anyVisible
        ? visibleResidents + ' resident' + (visibleResidents === 1 ? '' : 's') +
          ' shown across ' + visibleTowns + ' town' + (visibleTowns === 1 ? '' : 's')
        : '';
    }
    if (citizenSearch.parentElement) {
      citizenSearch.parentElement.classList.toggle('has-value', q.length > 0);
    }
  }
  if (citizenSearch) citizenSearch.addEventListener('input', filterRoster);
  if (townFilter) townFilter.addEventListener('change', filterRoster);
  if (rosterSort) rosterSort.addEventListener('change', function () {
    const towns = window.LiveData && window.LiveData.getState().data;
    if (towns) {
      renderTownsRoster(towns.towns);
      filterRoster();
    }
  });

  if (rosterClearBtn) {
    rosterClearBtn.addEventListener('click', () => {
      citizenSearch.value = '';
      filterRoster();
      citizenSearch.focus();
    });
  }

  /* ---------- Deep links: #citizens / town?person=X / town=X ---------------*/
  // Applies a search term from the URL (?person= or ?town=) or from an
  // in-page jump link, then scrolls the directory into view.
  function applyJumpTerm(term) {
    if (!citizenSearch || !term) return;
    citizenSearch.value = term;
    filterRoster();
  }
  $$('[data-jump-town]').forEach(link => {
    link.addEventListener('click', () => applyJumpTerm(link.dataset.jumpTown));
  });
  (function handleUrlParams() {
    const params = new URLSearchParams(location.search);
    const term = params.get('person') || params.get('town');
    if (term) applyJumpTerm(term);
  })();
  window.addEventListener('hashchange', () => {
    const params = new URLSearchParams(location.search);
    const term = params.get('person') || params.get('town');
    if (term) applyJumpTerm(term);
  });

  /* ---------- Render everything whenever LiveData updates ---------------------*/
  const rosterLiveBadge = document.getElementById('rosterLiveBadge');

  function shortStamp(date) {
    if (!date || isNaN(date)) return 'recently';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
           ', ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  // Human freshness from a real timestamp: minutes first ("Updated 4
  // minutes ago"), only escalating to hours/days when it's truly that old.
  function relFreshness(date) {
    if (!date || isNaN(date)) return 'just now';
    const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + (mins === 1 ? ' minute ago' : ' minutes ago');
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
    const days = Math.floor(hours / 24);
    return days + (days === 1 ? ' day ago' : ' days ago');
  }

  function setRosterBadge(state) {
    if (!rosterLiveBadge) return;
    const fetchedAt = state.fetchedAt;
    const serverAt = state.serverUpdatedAt;
    const fresh = relFreshness(fetchedAt);

    if (state.source === 'live') {
      rosterLiveBadge.textContent = '● Live · updated ' + fresh;
      rosterLiveBadge.title = 'Fetched live from the roster feed at ' + shortStamp(fetchedAt) +
        (serverAt ? '. Source last synced by the server at ' + shortStamp(serverAt) + '.' : '.');
    } else if (state.source === 'bundled') {
      rosterLiveBadge.textContent = '● Packaged roster · updated ' + fresh;
      rosterLiveBadge.title = 'Showing the verified roster packaged with this site copy. ' +
        'It refreshes when the site roster is synced and published.';
    } else if (state.source === 'fallback') {
      rosterLiveBadge.textContent = '● Snapshot · updated ' + fresh;
      rosterLiveBadge.title = 'Live feed unavailable — showing the committed snapshot, loaded at ' +
        shortStamp(fetchedAt) + '. The page retries automatically.';
    } else if (state.source === 'cache') {
      rosterLiveBadge.textContent = '● Saved copy · updated ' + fresh;
      rosterLiveBadge.title = 'Network sources unavailable — showing the last data this browser ' +
        'successfully loaded (' + shortStamp(fetchedAt) + '). Retrying automatically.';
    } else if (state.error) {
      rosterLiveBadge.textContent = '○ Data temporarily unavailable';
      rosterLiveBadge.title = 'Could not reach the roster feed or the snapshot (' + state.error +
        '). The page keeps retrying every couple of minutes.';
    } else {
      rosterLiveBadge.textContent = '○ Syncing…';
    }
  }

  const rosterStatus = document.getElementById('rosterStatus');

  function renderRoster(state) {
    const roster = state.data;
    if (!roster) {
      setRosterBadge(state);
      if (rosterStatus) {
        rosterStatus.classList.toggle('is-unavailable', Boolean(state.error));
        rosterStatus.classList.toggle('is-connecting', !state.error);
        rosterStatus.classList.remove('is-saved');
        rosterStatus.textContent = state.error
          ? 'No verified Cuba register is published yet. A site maintainer can import an authorized map export; only towns marked exactly “Cuba” will appear. Unverified residents stay off the site.'
          : 'Checking the verified Cuba map register…';
      }
      return;
    }
    setRosterBadge(state);
    if (rosterStatus) {
      const saved = state.source === 'fallback' || state.source === 'cache' || state.source === 'bundled';
      rosterStatus.classList.toggle('is-saved', saved);
      rosterStatus.classList.remove('is-unavailable', 'is-connecting');
      rosterStatus.textContent = state.source === 'bundled'
        ? 'Showing the verified roster packaged with this site. It works offline and when opened as a local file.'
        : saved
          ? 'Showing a verified saved copy while the live register reconnects.'
          : 'Verified map register loaded. Residents appear only when their town marker names Cuba.';
    }
    renderTownsRoster(roster.towns);
    filterRoster();
  }

  if (window.LiveData && typeof window.LiveData.subscribe === 'function') {
    window.LiveData.subscribe(renderRoster);
  }

  /* ---------- Grants petition form -----------------------------------------*/
  (function grantForm() {
    const form = document.getElementById('grantForm');
    if (!form) return;
    const successCard = document.getElementById('grantSuccess');
    const successText = document.getElementById('grantSuccessText');
    const submitBtn = document.getElementById('grantSubmitBtn');
    const noteEl = document.getElementById('grantFormNote');
    const copyBtn = document.getElementById('grantCopyBtn');
    const againBtn = document.getElementById('grantAgainBtn');
    let lastPayload = null;

    function fieldError(input, message) {
      const err = form.querySelector('[data-error-for="' + input.id + '"]');
      if (message) {
        input.setAttribute('aria-invalid', 'true');
        if (err) err.textContent = message;
      } else {
        input.removeAttribute('aria-invalid');
        if (err) err.textContent = '';
      }
      return !message;
    }

    function validate() {
      const v = {
        minecraft: form.elements.minecraft.value.trim(),
        discord: form.elements.discord.value.trim(),
        town: form.elements.town.value.trim(),
        region: form.elements.region.value,
        amount: form.elements.amount.value,
        status: form.elements.status.value,
        plan: form.elements.plan.value.trim(),
      };
      let ok = true;
      ok = fieldError(form.elements.minecraft, v.minecraft ? '' : 'Your Minecraft username is required.') && ok;
      ok = fieldError(form.elements.discord, v.discord ? '' : 'A Discord tag lets the Crown reach you.') && ok;
      ok = fieldError(form.elements.town, v.town ? '' : 'Name the town you want to found.') && ok;
      ok = fieldError(form.elements.plan,
        !v.plan ? 'Tell us what you plan to build.'
        : v.plan.length < 30 ? 'A little more detail please — at least a sentence or two.'
        : '') && ok;
      return ok ? v : null;
    }

    // Live re-validation once a field has been flagged.
    ['minecraft', 'discord', 'town', 'plan'].forEach(name => {
      const el = form.elements[name];
      el.addEventListener('input', () => { if (el.getAttribute('aria-invalid')) validate(); });
    });

    function buildMessage(v) {
      return [
        '**Town Grant Petition — Reino de Cuba**',
        '- **Minecraft:** ' + v.minecraft,
        '- **Discord:** ' + v.discord,
        '- **Proposed town:** ' + v.town,
        '- **Region:** ' + v.region,
        '- **Grant requested:** ' + v.amount,
        '- **Status:** ' + v.status,
        '- **Plan:**',
        '> ' + v.plan.replace(/\n/g, '\n> '),
      ].join('\n');
    }

    function showSuccess(message) {
      form.hidden = true;
      successCard.hidden = false;
      successText.textContent = message;
      successCard.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    }

    async function copyText(text) {
      try { await navigator.clipboard.writeText(text); return true; }
      catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        let done = false;
        try { done = document.execCommand('copy'); } catch (e2) { done = false; }
        document.body.removeChild(ta);
        return done;
      }
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = validate();
      if (!v) {
        noteEl.textContent = 'Please fix the highlighted fields.';
        noteEl.classList.add('error');
        return;
      }
      noteEl.textContent = '';
      noteEl.classList.remove('error');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      lastPayload = buildMessage(v);

      const webhook = (config.WEBHOOK_URL || '').trim();
      if (/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//.test(webhook)) {
        try {
          const res = await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'Grant Petitions', content: lastPayload }),
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          showSuccess('Your petition was delivered straight to the Crown’s review channel. Expect an answer in Discord.');
        } catch (err) {
          showSuccess('The direct line to the Crown is busy right now, so your petition is ready to paste instead.');
        }
      } else {
        // No webhook configured yet — guarantee the application survives.
        const copied = await copyText(lastPayload);
        showSuccess(copied
          ? 'Your petition is on your clipboard. Paste it in #grant-applications on Discord and the Crown will review it.'
          : 'Select the copied text below if the clipboard did not cooperate, then post it in #grant-applications on Discord.');
      }

      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Petition';
    });

    if (copyBtn) copyBtn.addEventListener('click', async () => {
      if (!lastPayload) return;
      const ok = await copyText(lastPayload);
      showToast(ok ? 'Application copied to clipboard' : 'Copy failed — select it manually');
    });

    if (againBtn) againBtn.addEventListener('click', () => {
      form.reset();
      form.hidden = false;
      successCard.hidden = true;
      form.elements.minecraft.focus();
    });
  })();
})();
