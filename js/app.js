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

  var shareLabels = {
    twitter: 'X에 공유',
    instagram: 'Instagram에 공유',
    threads: 'Threads에 공유',
    reddit: 'Reddit에 공유',
    linkedin: 'LinkedIn에 공유',
    bluesky: 'Bluesky에 공유',
  };

  function renderCard(platform, summary) {
    var now = new Date();
    var timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    var dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    var hn = escapeHtml;

    var header, body, footer;

    var card = document.getElementById('snsCard');
    card.className = 'sns-card sns-' + platform;

    switch (platform) {
      case 'twitter':
        header =
          '<div class="sns-card-header">' +
            '<div class="sns-avatar"><span>✂️</span></div>' +
            '<div class="sns-user-info">' +
              '<div class="sns-display-name">SnipLink <svg class="verified" viewBox="0 0 24 24" fill="#1d9bf0"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25a3.606 3.606 0 00-1.336-.25C5.37 3.502 3.66 5.29 3.66 7.5c0 .495.083.965.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.817 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.164.865.25 1.336.25 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z"/></svg></div>' +
              '<div class="sns-username">@sniplink <span class="dot">·</span> ' + timeStr + '</div>' +
            '</div>' +
            '<div class="sns-more"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg></div>' +
          '</div>';
        body =
          '<div class="sns-card-body">' +
            '<p class="sns-summary-text">' + hn(summary) + '</p>' +
          '</div>';
        footer =
          '<div class="sns-card-footer">' +
            '<div class="sns-actions-row">' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4M7 23l-4-4 4-4"/><path d="M21 5H9a4 4 0 00-4 4v3M3 19h12a4 4 0 004-4v-3"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></button>' +
            '</div>' +
            '<div class="sns-timestamp">' + summary.length + '자 · ' + timeStr + ' · ' + dateStr + ' · <span style="color:var(--text-muted)">0 조회</span></div>' +
          '</div>';
        break;

      case 'instagram':
        header =
          '<div class="sns-card-header">' +
            '<div class="sns-avatar"><span>✂️</span></div>' +
            '<div class="sns-user-info">' +
              '<div class="sns-display-name">sniplink</div>' +
              '<div class="sns-username" style="font-size:11px;color:var(--text-secondary)">' + timeStr + '</div>' +
            '</div>' +
            '<div class="sns-more"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg></div>' +
          '</div>';
        body =
          '<div class="sns-card-body">' +
            '<p class="sns-summary-text" style="font-size:14px;line-height:1.7">' + hn(summary) + '</p>' +
          '</div>';
        footer =
          '<div class="sns-card-footer">' +
            '<div class="sns-actions-row" style="justify-content:space-between">' +
              '<div style="display:flex;gap:4px">' +
                '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></button>' +
                '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></button>' +
                '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></button>' +
              '</div>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button>' +
            '</div>' +
            '<div class="sns-timestamp" style="font-weight:600">좋아요 0개</div>' +
            '<div class="sns-timestamp">' + dateStr + '</div>' +
          '</div>';
        break;

      case 'threads':
        header =
          '<div class="sns-card-header">' +
            '<div class="sns-avatar"><span>✂️</span></div>' +
            '<div class="sns-user-info">' +
              '<div class="sns-display-name">sniplink</div>' +
              '<div class="sns-username">@sniplink <span class="dot">·</span> ' + timeStr + '</div>' +
            '</div>' +
            '<div class="sns-more"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg></div>' +
          '</div>';
        body =
          '<div class="sns-card-body">' +
            '<p class="sns-summary-text">' + hn(summary) + '</p>' +
          '</div>';
        footer =
          '<div class="sns-card-footer">' +
            '<div class="sns-actions-row">' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4M7 23l-4-4 4-4"/><path d="M21 5H9a4 4 0 00-4 4v3M3 19h12a4 4 0 004-4v-3"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></button>' +
            '</div>' +
            '<div class="sns-timestamp">' + summary.length + '자 · ' + timeStr + ' · ' + dateStr + '</div>' +
          '</div>';
        break;

      case 'reddit':
        var titleHtml = hn(currentArticle.title || '기사 요약');
        header =
          '<div class="sns-card-header">' +
            '<div class="sns-avatar" style="background:#ff4500;border-radius:4px;font-size:20px">r/</div>' +
            '<div class="sns-user-info">' +
              '<div class="sns-display-name" style="font-size:13px;font-weight:500">r/news</div>' +
              '<div class="sns-username">Posted by u/SnipLink <span class="dot">·</span> ' + timeStr + '</div>' +
            '</div>' +
            '<div class="sns-more"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg></div>' +
          '</div>';
        body =
          '<div class="sns-card-body">' +
            '<h3 class="reddit-title">' + titleHtml + '</h3>' +
            '<p class="sns-summary-text">' + hn(summary) + '</p>' +
          '</div>';
        footer =
          '<div class="sns-card-footer">' +
            '<div class="sns-actions-row" style="gap:2px">' +
              '<button class="sns-action-btn" style="color:#ff4500"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h5v8h6v-8h5z"/></svg></button>' +
              '<span style="font-size:13px;color:var(--text-secondary);min-width:20px;text-align:center">0</span>' +
              '<button class="sns-action-btn" style="color:#7193ff"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8h-5V4H9v8H4z"/></svg></button>' +
              '<span style="flex:1"></span>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span>0 Comments</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>' +
            '</div>' +
            '<div class="sns-timestamp">' + timeStr + ' · ' + dateStr + '</div>' +
          '</div>';
        break;

      case 'linkedin':
        header =
          '<div class="sns-card-header">' +
            '<div class="sns-avatar" style="background:#0a66c2;border-radius:4px;font-size:18px">in</div>' +
            '<div class="sns-user-info">' +
              '<div class="sns-display-name">SnipLink <span style="color:#0a66c2;font-size:12px">✔</span></div>' +
              '<div class="sns-username">뉴스 큐레이터 · ' + timeStr + '</div>' +
            '</div>' +
            '<div class="sns-more"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg></div>' +
          '</div>';
        body =
          '<div class="sns-card-body">' +
            '<p class="sns-summary-text">' + hn(summary) + '</p>' +
          '</div>';
        footer =
          '<div class="sns-card-footer">' +
            '<div class="sns-actions-row" style="justify-content:space-between">' +
              '<div style="display:flex;gap:4px">' +
                '<button class="sns-action-btn" style="color:#0a66c2">👍</button>' +
                '<button class="sns-action-btn" style="color:#0a66c2">💡</button>' +
                '<button class="sns-action-btn" style="color:#0a66c2">❤️</button>' +
              '</div>' +
              '<div style="display:flex;gap:4px;font-size:12px;color:var(--text-muted)">' +
                '<button class="sns-action-btn" style="font-size:12px;gap:4px">Like</button>' +
                '<button class="sns-action-btn" style="font-size:12px;gap:4px">Comment</button>' +
                '<button class="sns-action-btn" style="font-size:12px;gap:4px">Repost</button>' +
                '<button class="sns-action-btn" style="font-size:12px;gap:4px">Send</button>' +
              '</div>' +
            '</div>' +
            '<div class="sns-timestamp">' + timeStr + ' · ' + dateStr + '</div>' +
          '</div>';
        break;

      case 'bluesky':
        header =
          '<div class="sns-card-header">' +
            '<div class="sns-avatar" style="background:#0085ff"><span>✂️</span></div>' +
            '<div class="sns-user-info">' +
              '<div class="sns-display-name">SnipLink</div>' +
              '<div class="sns-username">@sniplink.bsky.social <span class="dot">·</span> ' + timeStr + '</div>' +
            '</div>' +
            '<div class="sns-more"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg></div>' +
          '</div>';
        body =
          '<div class="sns-card-body">' +
            '<p class="sns-summary-text">' + hn(summary) + '</p>' +
          '</div>';
        footer =
          '<div class="sns-card-footer">' +
            '<div class="sns-actions-row">' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4M7 23l-4-4 4-4"/><path d="M21 5H9a4 4 0 00-4 4v3M3 19h12a4 4 0 004-4v-3"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></button>' +
            '</div>' +
            '<div class="sns-timestamp">' + summary.length + '자 · ' + timeStr + ' · ' + dateStr + '</div>' +
          '</div>';
        break;
    }

    card.innerHTML = header + body + footer;
  }

  function updatePlatformTab(platform) {
    currentPlatform = platform;

    DOM.platformTabs.forEach(function(tab) {
      tab.classList.toggle('active', tab.dataset.platform === platform);
    });

    DOM.tweetBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg> ' + (shareLabels[platform] || '공유하기');

    if (!currentArticle) return;

    var cacheKey = platform;
    if (!cachedSummaries[cacheKey]) {
      cachedSummaries[cacheKey] = generateSummary(currentArticle, platform);
    }

    renderCard(platform, cachedSummaries[cacheKey]);
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
