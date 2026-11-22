(() => {
  const video = document.querySelector('#home-film');
  const button = document.querySelector('#hero-video-toggle');
  if (!video || !button) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const labels = {
    en: { play: 'Play video', pause: 'Pause video', playLabel: 'Play background video', pauseLabel: 'Pause background video' },
    zh: { play: '播放视频', pause: '暂停视频', playLabel: '播放背景视频', pauseLabel: '暂停背景视频' },
    ja: { play: '動画を再生', pause: '動画を一時停止', playLabel: '背景動画を再生', pauseLabel: '背景動画を一時停止' }
  };
  let wantsPlayback = !motion.matches;
  let userChoice = null;
  let playPending = false;
  let playAttempt = 0;
  let failed = false;

  const render = () => {
    const language = document.documentElement.lang.split('-')[0];
    const copy = labels[language] || labels.en;
    const playing = !video.paused || playPending;
    button.dataset.playing = String(playing);
    button.querySelector('span').textContent = playing ? copy.pause : copy.play;
    button.setAttribute('aria-label', playing ? copy.pauseLabel : copy.playLabel);
    button.title = playing ? copy.pauseLabel : copy.playLabel;
    button.hidden = failed;
  };

  const pause = () => {
    playAttempt += 1;
    playPending = false;
    video.pause();
    render();
  };

  const play = async () => {
    if (failed || document.hidden || !wantsPlayback) return;
    const attempt = ++playAttempt;
    playPending = true;
    video.muted = true;
    render();
    try {
      await video.play();
    } catch {
      // A browser may require a click before it allows background playback.
    } finally {
      if (attempt === playAttempt) {
        playPending = false;
        if (document.hidden || !wantsPlayback) video.pause();
        render();
      }
    }
  };

  button.addEventListener('click', () => {
    if (!video.paused || playPending) {
      userChoice = 'pause';
      wantsPlayback = false;
      pause();
    } else {
      userChoice = 'play';
      wantsPlayback = true;
      void play();
    }
  });

  video.addEventListener('play', () => {
    if (document.hidden || !wantsPlayback) pause();
    else render();
  });
  video.addEventListener('pause', render);
  video.addEventListener('error', () => {
    failed = true;
    pause();
    video.hidden = true;
  });
  // Source failures do not consistently bubble as a video error across browsers.
  video.querySelector('source')?.addEventListener('error', () => {
    failed = true;
    pause();
    video.hidden = true;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else if (wantsPlayback) void play();
  });
  window.addEventListener('pagehide', pause);
  window.addEventListener('pageshow', () => {
    if (wantsPlayback) void play();
  });
  motion.addEventListener('change', () => {
    if (userChoice !== null) return;
    wantsPlayback = !motion.matches;
    if (wantsPlayback) void play();
    else pause();
  });
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  if (motion.matches) {
    video.autoplay = false;
    video.removeAttribute('autoplay');
  }
  render();
  if (wantsPlayback && !document.hidden) void play();
  else pause();
})();
