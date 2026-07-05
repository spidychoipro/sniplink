(function () {
  'use strict';

  const DOM = {
    urlInput: document.getElementById('urlInput'),
    snipBtn: document.getElementById('snipBtn'),
    loadingSection: document.getElementById('loadingSection'),
    loadingText: document.getElementById('loadingText'),
    loadingSteps: document.getElementById('loadingSteps'),
    errorSection: document.getElementById('errorSection'),
    errorTitle: document.getElementById('errorTitle'),
    errorDesc: document.getElementById('errorDesc'),
    errorIcon: document.getElementById('errorIcon'),
    errorCard: document.getElementById('errorCard'),
    retryBtn: document.getElementById('retryBtn'),
    resultSection: document.getElementById('resultSection'),
    articleTitle: document.getElementById('articleTitle'),
    articleSource: document.getElementById('articleSource'),
    snsCardBody: document.getElementById('snsCardBody'),
    snsTimestamp: document.getElementById('snsTimestamp'),
    copyBtn: document.getElementById('copyBtn'),
    tweetBtn: document.getElementById('tweetBtn'),
    shareBtn: document.getElementById('shareBtn'),
    platformTabs: document.querySelectorAll('.platform-tab'),
    pickerBtns: document.querySelectorAll('.picker-btn'),
    toast: document.getElementById('toast'),
  };

  let currentArticle = null;
  let currentPlatform = 'twitter';
  let cachedSummaries = {};

  function getSelectedPlatform() {
    const active = document.querySelector('.picker-btn.active');
    return active ? active.dataset.platform : 'twitter';
  }

  function showToast(msg, type) {
    const t = DOM.toast;
    t.textContent = msg;
    t.className = 'toast' + (type ? ' ' + type : '');
    t.classList.remove('hidden');
    clearTimeout(t._hide);
    t._hide = setTimeout(() => t.classList.add('hidden'), 2500);
  }

  function setLoading(step, text) {
    DOM.loadingText.textContent = text || '처리 중...';
    if (step) {
      DOM.loadingSteps.querySelectorAll('.step').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.step) === step);
        el.classList.toggle('done', parseInt(el.dataset.step) < step);
      });
    }
  }

  function showError(title, desc) {
    DOM.errorTitle.textContent = title;
    DOM.errorDesc.innerHTML = desc.replace(/\n/g, '<br>');
    DOM.errorIcon.textContent = '⚠️';
    DOM.errorCard.className = 'error-card';
    DOM.loadingSection.classList.add('hidden');
    DOM.errorSection.classList.remove('hidden');
    DOM.resultSection.classList.add('hidden');
  }

  function showResult(article) {
    currentArticle = article;
    cachedSummaries = {};

    DOM.articleTitle.textContent = article.title || '제목 없음';
    DOM.articleSource.textContent = article.source ? '📰 ' + article.source : '';

    DOM.loadingSection.classList.add('hidden');
    DOM.errorSection.classList.add('hidden');
    DOM.resultSection.classList.remove('hidden');

    DOM.platformTabs.forEach(t =>
      t.classList.toggle('active', t.dataset.platform === currentPlatform)
    );

    updatePlatformTab(currentPlatform);

    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updatePlatformTab(platform) {
    currentPlatform = platform;

    DOM.platformTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.platform === platform);
    });

    const shareLabels = {
      twitter: 'X에 공유',
      instagram: 'Instagram에 공유',
      threads: 'Threads에 공유',
      reddit: 'Reddit에 공유',
      linkedin: 'LinkedIn에 공유',
      bluesky: 'Bluesky에 공유',
    };
    DOM.tweetBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg> ${shareLabels[platform] || '공유하기'}`;

    if (!currentArticle) return;

    const cacheKey = platform;
    if (!cachedSummaries[cacheKey]) {
      const summary = generateSummary(currentArticle, platform);
      cachedSummaries[cacheKey] = summary;
    }

    const summary = cachedSummaries[cacheKey];
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    DOM.snsCardBody.innerHTML = `<p class="sns-summary-text">${escapeHtml(summary)}</p>`;
    DOM.snsTimestamp.textContent = `${timeStr} · ${dateStr} · ${summary.length}자`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function validateUrl(url) {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async function handleSnip() {
    const url = DOM.urlInput.value.trim();

    if (!url) {
      showToast('링크를 입력해주세요', 'error');
      DOM.urlInput.focus();
      return;
    }

    if (!validateUrl(url)) {
      showToast('올바른 URL 형식이 아닙니다 (https://...)', 'error');
      return;
    }

    DOM.snipBtn.disabled = true;
    DOM.snipBtn.textContent = '⏳ 처리 중...';

    DOM.errorSection.classList.add('hidden');
    DOM.resultSection.classList.add('hidden');

    DOM.loadingSection.classList.remove('hidden');
    setLoading(1, '기사를 읽고 있어요...');

    try {
      currentPlatform = getSelectedPlatform();

      setLoading(2, '내용을 분석하고 있어요...');
      const article = await extractArticle(url);

      setLoading(3, '✂️ 요약을 생성하고 있어요...');
      await new Promise(r => setTimeout(r, 400));

      showResult(article);
      showToast('✂️ 요약 완료!', 'success');
    } catch (e) {
      const msg = e.message || '알 수 없는 오류가 발생했습니다.';
      showError('처리 실패', msg);
    } finally {
      DOM.snipBtn.disabled = false;
      DOM.snipBtn.textContent = 'Snip! ✂️';
    }
  }

  DOM.snipBtn.addEventListener('click', handleSnip);

  DOM.urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSnip();
  });

  DOM.retryBtn.addEventListener('click', handleSnip);

  DOM.platformTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      updatePlatformTab(tab.dataset.platform);
      document.querySelectorAll('.picker-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.platform === tab.dataset.platform)
      );
    });
  });

  DOM.pickerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.pickerBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPlatform = btn.dataset.platform;
    });
  });

  DOM.copyBtn.addEventListener('click', async () => {
    if (!currentArticle || !cachedSummaries[currentPlatform]) return;
    const text = cachedSummaries[currentPlatform];
    const ok = await SNS.copyToClipboard(text);
    if (ok) {
      showToast('📋 클립보드에 복사되었습니다!', 'success');
    } else {
      showToast('복사에 실패했습니다', 'error');
    }
  });

  DOM.tweetBtn.addEventListener('click', () => {
    if (!currentArticle || !cachedSummaries[currentPlatform]) return;
    const text = cachedSummaries[currentPlatform];
    SNS.shareTo(currentPlatform, text, currentArticle.url);
  });

  DOM.shareBtn.addEventListener('click', async () => {
    if (!currentArticle || !cachedSummaries[currentPlatform]) return;
    const text = cachedSummaries[currentPlatform];

    const shared = await SNS.webShare({
      title: currentArticle.title || 'SnipLink 요약',
      text: text,
      url: currentArticle.url
    });

    if (!shared) {
      const ok = await SNS.copyToClipboard(text);
      if (ok) {
        showToast('📋 클립보드에 복사되었습니다! 공유할 앱에 붙여넣으세요', 'success');
      } else {
        showToast('공유를 지원하지 않는 브라우저입니다', 'error');
      }
    }
  });
})();
