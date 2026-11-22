(() => {
  'use strict';

  const initialize = () => {
    if (document.getElementById('wanzi-companion')) return;

    const translations = {
      zh: {
        name: '万滋', label: '万滋 Wanzi · 打开鱼形文化向导', close: '关闭介绍', minimize: '收起万滋', restore: '展开万滋',
        eyebrow: '来自万州的文化向导', title: '你好，我是万滋。',
        intro: '一只爱讲故事的小鱼。跟我聊聊江边的烟火、烤鱼的手艺，和万州的味道。',
        talk: '与万滋对话', topicsLabel: '从一点好奇开始',
        topics: { fish: '为什么是万州烤鱼？', preparation: '先烤后煮，有什么讲究？', peppercorn: '花椒的“麻”是什么味道？' },
        states: { idle: '陪你发现万州', thinking: '让我想一想…', speaking: '故事正在继续', error: '我们稍后再聊', unconfigured: '先一起逛逛万州' },
        drag: '可以拖动我，换个位置'
      },
      en: {
        name: 'Wanzi', label: 'Wanzi · Open your fish-shaped culture guide', close: 'Close introduction', minimize: 'Minimize Wanzi', restore: 'Expand Wanzi',
        eyebrow: 'Your companion from Wanzhou', title: 'Hello, I’m Wanzi.',
        intro: 'A little fish with stories to share. Let’s talk about life by the river, the craft of grilled fish, and the flavors of Wanzhou.',
        talk: 'Talk with Wanzi', topicsLabel: 'Start with a little curiosity',
        topics: { fish: 'What makes Wanzhou grilled fish special?', preparation: 'Why grill first, then simmer?', peppercorn: 'What does Sichuan pepper taste like?' },
        states: { idle: 'Discover Wanzhou with me', thinking: 'Let me think…', speaking: 'The story continues', error: 'Let’s try again a little later', unconfigured: 'Let’s explore Wanzhou' },
        drag: 'Drag me to a different spot'
      },
      ja: {
        name: '万滋', label: '万滋 Wanzi · 魚の文化ガイドを開く', close: '紹介を閉じる', minimize: '万滋を小さくする', restore: '万滋を開く',
        eyebrow: '万州から来た文化ガイド', title: 'こんにちは、万滋です。',
        intro: '物語が大好きな小さな魚です。川辺の暮らし、焼き魚の技、万州の味についてお話ししましょう。',
        talk: '万滋と話す', topicsLabel: '小さな好奇心から',
        topics: { fish: '万州烤魚の魅力とは？', preparation: 'なぜ焼いてから煮込むの？', peppercorn: '花椒の「しびれ」はどんな味？' },
        states: { idle: '一緒に万州を見つけよう', thinking: '少し考えています…', speaking: '物語の続きです', error: 'また少し後で話しましょう', unconfigured: '万州を歩いてみよう' },
        drag: 'ドラッグで場所を変えられます'
      }
    };
    const storageKey = 'wanzi-companion-position-v1:'+new URL('.',location.href).pathname;
    const topicKeys = ['fish', 'preparation', 'peppercorn'];
    const readLanguage = () => {
      const language = document.documentElement.lang.toLowerCase().split('-')[0];
      return translations[language] ? language : 'en';
    };
    const create = (tag, className, text) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text) element.textContent = text;
      return element;
    };

    let language = readLanguage();
    let state = 'unconfigured';
    let restingState = 'unconfigured';
    let speakingTimer = 0;
    let open = false;
    let minimized = false;
    let pointer = null;
    let moved = false;
    let position = null;
    let resizeFrame = 0;
    const root = create('aside', 'wanzi-companion');
    root.id = 'wanzi-companion';
    root.dataset.state = state;
    const shell = create('div', 'wanzi-companion-shell');
    const fishButton = create('button', 'wanzi-fish-button');
    fishButton.type = 'button';
    fishButton.setAttribute('aria-controls', 'wanzi-companion-card');
    fishButton.setAttribute('aria-expanded', 'false');
    const illustration = create('span', 'wanzi-fish-illustration');
    const fish = create('img', 'wanzi-fish-image');
    fish.src = 'assets/wanzi-fish.png';
    fish.alt = '';
    fish.width = 140;
    fish.height = 140;
    fish.draggable = false;
    illustration.append(fish);
    const name = create('span', 'wanzi-fish-name');
    fishButton.append(illustration, name);

    const minimize = create('button', 'wanzi-minimize', '−');
    minimize.type = 'button';
    const capsule = create('button', 'wanzi-capsule');
    capsule.type = 'button';
    capsule.hidden = true;
    const capsuleImage = create('img');
    capsuleImage.src = fish.src;
    capsuleImage.alt = '';
    capsuleImage.draggable = false;
    const capsuleName = create('span');
    capsule.append(capsuleImage, capsuleName);
    shell.append(fishButton, minimize, capsule);

    const card = create('div', 'wanzi-companion-card');
    card.id = 'wanzi-companion-card';
    card.hidden = true;
    card.setAttribute('role', 'region');
    card.setAttribute('aria-labelledby', 'wanzi-companion-title');
    const cardClose = create('button', 'wanzi-card-close', '×');
    cardClose.type = 'button';
    const eyebrow = create('p', 'wanzi-card-eyebrow');
    const title = create('h2', 'wanzi-card-title');
    title.id = 'wanzi-companion-title';
    const introduction = create('p', 'wanzi-card-intro');
    const talkLink = create('a', 'wanzi-talk-link');
    const topicsLabel = create('p', 'wanzi-topics-label');
    topicsLabel.id = 'wanzi-companion-topics';
    const topics = create('div', 'wanzi-topic-links');
    topics.setAttribute('aria-labelledby', topicsLabel.id);
    const topicLinks = topicKeys.map(topic => {
      const link = create('a', 'wanzi-topic-link');
      link.dataset.topic = topic;
      topics.append(link);
      return link;
    });
    const footer = create('div', 'wanzi-card-footer');
    const status = create('span', 'wanzi-companion-status');
    const dragHint = create('span', 'wanzi-drag-hint');
    footer.append(status, dragHint);
    card.append(cardClose, eyebrow, title, introduction, talkLink, topicsLabel, topics, footer);
    // Keep the introduction after its trigger in keyboard navigation order.
    root.append(shell, card);
    document.body.append(root);

    const onExplore = () => document.body.dataset.page === 'explore' || /\/(?:explore|explore\.html)\/?$/.test(location.pathname);
    const conversationURL = (topic) => {
      const url = new URL('explore.html', location.href);
      if (topic) url.searchParams.set('topic', topic);
      url.searchParams.set('lang', language);
      return `${url.pathname}${url.search}#chat-input`;
    };
    const persist = () => {
      if (!position) return;
      try { sessionStorage.setItem(storageKey, JSON.stringify({ ...position, minimized })); } catch { /* Session storage may be disabled. */ }
    };
    const viewport = () => {
      const visible = window.visualViewport;
      return {
        left: visible ? visible.offsetLeft : 0,
        top: visible ? visible.offsetTop : 0,
        width: visible ? Math.min(visible.width, document.documentElement.clientWidth) : document.documentElement.clientWidth,
        height: visible ? Math.min(visible.height, window.innerHeight) : window.innerHeight
      };
    };
    const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
    const placeCard = () => {
      if (!open) return;
      const bounds = root.getBoundingClientRect();
      const screen = viewport();
      const gap = 12;
      const margin = 12;
      card.style.maxHeight = `${Math.max(80, screen.height - margin * 2)}px`;
      card.style.maxWidth = `${Math.max(160, screen.width - margin * 2)}px`;
      const cardBounds = card.getBoundingClientRect();
      const left = clamp(bounds.right - cardBounds.width, screen.left + margin, screen.left + screen.width - cardBounds.width - margin);
      let top = bounds.top - cardBounds.height - gap;
      if (top < screen.top + margin && bounds.bottom + cardBounds.height + gap <= screen.top + screen.height - margin) top = bounds.bottom + gap;
      top = clamp(top, screen.top + margin, screen.top + screen.height - cardBounds.height - margin);
      card.style.left = `${Math.round(left)}px`;
      card.style.top = `${Math.round(top)}px`;
    };
    const place = (x, y, save = true) => {
      const screen = viewport();
      const bounds = root.getBoundingClientRect();
      position = {
        x: clamp(x, screen.left + 12, screen.left + screen.width - bounds.width - 12),
        y: clamp(y, screen.top + 12, screen.top + screen.height - bounds.height - 12)
      };
      root.style.left = `${Math.round(position.x)}px`;
      root.style.top = `${Math.round(position.y)}px`;
      placeCard();
      if (save) persist();
    };
    const setOpen = (next, returnFocus = false) => {
      open = Boolean(next) && !minimized;
      card.hidden = !open;
      root.classList.toggle('wanzi-is-open', open);
      fishButton.setAttribute('aria-expanded', String(open));
      if (open) placeCard();
      if (returnFocus) fishButton.focus({ preventScroll: true });
    };
    const setMinimized = (next, restoreFocus = false) => {
      const bounds = root.getBoundingClientRect();
      if (next) setOpen(false);
      minimized = Boolean(next);
      root.classList.toggle('wanzi-is-minimized', minimized);
      fishButton.hidden = minimized;
      minimize.hidden = minimized;
      capsule.hidden = !minimized;
      const newBounds = root.getBoundingClientRect();
      place(bounds.right - newBounds.width, bounds.bottom - newBounds.height);
      if (restoreFocus) (minimized ? capsule : fishButton).focus({ preventScroll: true });
    };
    const updateCopy = () => {
      language = readLanguage();
      const copy = translations[language];
      root.setAttribute('aria-label', copy.name);
      fishButton.setAttribute('aria-label', copy.label);
      fishButton.title = copy.drag;
      minimize.setAttribute('aria-label', copy.minimize);
      minimize.title = copy.minimize;
      capsule.setAttribute('aria-label', copy.restore);
      cardClose.setAttribute('aria-label', copy.close);
      name.textContent = copy.name;
      capsuleName.textContent = copy.name;
      eyebrow.textContent = copy.eyebrow;
      title.textContent = copy.title;
      introduction.textContent = copy.intro;
      talkLink.textContent = copy.talk;
      talkLink.href = conversationURL();
      topicsLabel.textContent = copy.topicsLabel;
      topicLinks.forEach(link => {
        link.textContent = copy.topics[link.dataset.topic];
        link.href = conversationURL(link.dataset.topic);
      });
      status.textContent = copy.states[state];
      dragHint.textContent = copy.drag;
      placeCard();
    };
    const startConversation = (event, topic) => {
      if (!onExplore() || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      setOpen(false);
      window.dispatchEvent(new CustomEvent('wanzi:ask', { detail: { topic: topic || null } }));
      const input = document.getElementById('chat-input');
      if (input) {
        input.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
        input.focus({ preventScroll: true });
      }
    };
    talkLink.addEventListener('click', event => startConversation(event));
    topicLinks.forEach(link => link.addEventListener('click', event => startConversation(event, link.dataset.topic)));
    fishButton.addEventListener('click', event => {
      if (moved && event.detail !== 0) { event.preventDefault(); moved = false; return; }
      setOpen(!open);
    });
    minimize.addEventListener('click', () => setMinimized(true, true));
    capsule.addEventListener('click', event => {
      if (moved && event.detail !== 0) { event.preventDefault(); moved = false; return; }
      setMinimized(false, true);
    });
    cardClose.addEventListener('click', () => setOpen(false, true));
    document.addEventListener('pointerdown', event => {
      if (open && !root.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && open) { event.preventDefault(); setOpen(false, true); }
    });

    const attachDrag = handle => {
      handle.addEventListener('pointerdown', event => {
        if (!event.isPrimary || event.button !== 0) return;
        const bounds = root.getBoundingClientRect();
        moved = false;
        pointer = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: bounds.left, y: bounds.top };
        handle.setPointerCapture(event.pointerId);
      });
      handle.addEventListener('pointermove', event => {
        if (!pointer || pointer.id !== event.pointerId) return;
        const dx = event.clientX - pointer.startX;
        const dy = event.clientY - pointer.startY;
        if (!moved && Math.hypot(dx, dy) < 7) return;
        moved = true;
        root.classList.add('wanzi-is-dragging');
        if (open) setOpen(false);
        place(pointer.x + dx, pointer.y + dy, false);
      });
      const finish = event => {
        if (!pointer || pointer.id !== event.pointerId) return;
        if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
        pointer = null;
        root.classList.remove('wanzi-is-dragging');
        persist();
      };
      handle.addEventListener('pointerup', finish);
      handle.addEventListener('pointercancel', finish);
      handle.addEventListener('lostpointercapture', finish);
      handle.addEventListener('dragstart', event => event.preventDefault());
    };
    attachDrag(fishButton);
    attachDrag(capsule);

    window.addEventListener('wanzi:state', event => {
      const next = event.detail && event.detail.state;
      if (!Object.prototype.hasOwnProperty.call(translations.en.states, next)) return;
      clearTimeout(speakingTimer);
      if (next === 'idle' || next === 'unconfigured') restingState = next;
      state = next;
      root.dataset.state = state;
      status.textContent = translations[language].states[state];
      if (state === 'speaking') speakingTimer = setTimeout(() => {
        state = restingState;
        root.dataset.state = state;
        status.textContent = translations[language].states[state];
      }, 4200);
    });
    window.addEventListener('wanzi:language', updateCopy);
    new MutationObserver(updateCopy).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    const reposition = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => { if (position) place(position.x, position.y); });
    };
    window.addEventListener('resize', reposition, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', reposition, { passive: true });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(reposition).observe(root);

    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(storageKey)); } catch { /* A fresh session starts at the lower right. */ }
    if (saved && saved.minimized === true) {
      minimized = true;
      root.classList.add('wanzi-is-minimized');
      fishButton.hidden = true;
      minimize.hidden = true;
      capsule.hidden = false;
    }
    const bounds = root.getBoundingClientRect();
    const screen = viewport();
    const hasSavedPosition = saved && Number.isFinite(saved.x) && Number.isFinite(saved.y);
    place(hasSavedPosition ? saved.x : screen.left + screen.width - bounds.width - 24, hasSavedPosition ? saved.y : screen.top + screen.height - bounds.height - 24);
    updateCopy();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
