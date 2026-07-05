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

  function renderCard(platform, summary, url) {
    var now = new Date();
    var timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    var dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    var hn = escapeHtml;
    var card = document.getElementById('snsCard');
    card.className = 'sns-card sns-' + platform;
    var domain = '';
    try { domain = new URL(url).hostname.replace('www.', ''); } catch (e) {}
    var h = '';

    switch (platform) {
      case 'twitter':
        h =
          '<div class="sns-card-header">' +
            '<div class="sns-avatar"><span>✂️</span></div>' +
            '<div class="sns-user-info">' +
              '<div class="sns-display-name">SnipLink</div>' +
              '<div class="sns-username">@sniplink <span class="dot">·</span> ' + timeStr + '</div>' +
            '</div>' +
            '<div class="sns-more"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg></div>' +
          '</div>' +
          '<div class="sns-card-body">' +
            '<p class="sns-summary-text">' + hn(summary) + '</p>' +
            '<div class="sns-url">🔗 <a href="' + hn(url) + '" target="_blank" rel="noopener">' + hn(domain) + '</a></div>' +
          '</div>' +
          '<div class="sns-card-footer">' +
            '<div class="sns-actions-row">' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4M7 23l-4-4 4-4"/><path d="M21 5H9a4 4 0 00-4 4v3M3 19h12a4 4 0 004-4v-3"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn like-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></button>' +
            '</div>' +
            '<div class="sns-timestamp">' + timeStr + ' · <span class="tweet-stats">0 조회</span></div>' +
          '</div>';
        break;

      case 'instagram':
        h =
          '<div class="sns-card-header">' +
            '<div class="sns-avatar"><span>✂️</span></div>' +
            '<div class="sns-user-info">' +
              '<div class="sns-display-name">sniplink</div>' +
            '</div>' +
            '<div class="sns-more"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg></div>' +
          '</div>' +
          '<div class="insta-placeholder"></div>' +
          '<div class="sns-card-body">' +
            '<p class="sns-summary-text">' + hn(summary) + '</p>' +
          '</div>' +
          '<div class="sns-card-footer">' +
            '<div class="sns-actions-row">' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></button>' +
              '<span style="flex:1"></span>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button>' +
            '</div>' +
            '<div class="sns-timestamp" style="font-weight:600">좋아요 0개</div>' +
            '<div class="sns-timestamp"><span class="sns-username">sniplink</span> ' + hn(summary).slice(0, 30) + '...</div>' +
            '<div class="sns-timestamp" style="font-size:11px">🔗 ' + hn(domain) + '</div>' +
            '<div class="sns-timestamp" style="font-size:11px">' + dateStr + '</div>' +
          '</div>';
        break;

      case 'threads':
        h =
          '<div class="sns-card-header">' +
            '<div class="sns-avatar"><span>✂️</span></div>' +
            '<div class="sns-user-info">' +
              '<div class="sns-display-name">sniplink</div>' +
              '<div class="sns-username">' + timeStr + '</div>' +
            '</div>' +
            '<div class="sns-more"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg></div>' +
          '</div>' +
          '<div class="sns-card-body">' +
            '<p class="sns-summary-text">' + hn(summary) + '</p>' +
            '<div class="sns-url">🔗 <a href="' + hn(url) + '" target="_blank" rel="noopener">' + hn(domain) + '</a></div>' +
          '</div>' +
          '<div class="sns-card-footer">' +
            '<div class="sns-actions-row">' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4M7 23l-4-4 4-4"/><path d="M21 5H9a4 4 0 00-4 4v3M3 19h12a4 4 0 004-4v-3"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn like-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></button>' +
            '</div>' +
            '<div class="sns-timestamp">' + timeStr + '</div>' +
          '</div>';
        break;

      case 'reddit':
        h =
          '<div class="reddit-container">' +
            '<div class="reddit-votes">' +
              '<button class="vote-btn upvote"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h5v8h6v-8h5z"/></svg></button>' +
              '<span class="vote-score">0</span>' +
              '<button class="vote-btn downvote"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8h-5V4H9v8H4z"/></svg></button>' +
            '</div>' +
            '<div class="reddit-content">' +
              '<div class="reddit-meta">r/news <span class="dot">·</span> Posted by u/SnipLink <span class="dot">·</span> ' + timeStr + '</div>' +
              '<h3 class="reddit-title">' + hn(currentArticle.title || '기사 요약') + '</h3>' +
              '<div class="sns-card-body"><p class="sns-summary-text">' + hn(summary) + '</p></div>' +
              '<div class="sns-url" style="padding:0 0 4px 0;font-size:12px">🔗 <a href="' + hn(url) + '" target="_blank" rel="noopener">' + hn(domain) + '</a></div>' +
              '<div class="reddit-footer">' +
                '<button class="reddit-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> 0 Comments</button>' +
                '<button class="reddit-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg> Share</button>' +
                '<button class="reddit-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Save</button>' +
                '<button class="reddit-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>' +
              '</div>' +
            '</div>' +
          '</div>';
        break;

      case 'linkedin':
        h =
          '<div class="sns-card-header">' +
            '<div class="sns-avatar" style="background:#0a66c2;border-radius:4px;font-size:18px">in</div>' +
            '<div class="sns-user-info">' +
              '<div class="sns-display-name">SnipLink</div>' +
              '<div class="sns-username">뉴스 큐레이터</div>' +
            '</div>' +
            '<div class="sns-more"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg></div>' +
          '</div>' +
          '<div class="linkedin-badge">' + timeStr + ' · <span class="dot">📰</span> Article</div>' +
          '<div class="sns-card-body">' +
            '<p class="sns-summary-text">' + hn(summary) + '</p>' +
            '<div class="sns-url">🔗 <a href="' + hn(url) + '" target="_blank" rel="noopener">' + hn(domain) + '</a></div>' +
          '</div>' +
          '<div class="sns-card-footer">' +
            '<div class="linkedin-reactions">' +
              '<span>👍 0</span> <span>💡 0</span> <span>❤️ 0</span>' +
            '</div>' +
            '<div class="sns-actions-row" style="border-top:1px solid var(--border);padding-top:4px;margin-top:4px">' +
              '<button class="linkedin-action">👍 Like</button>' +
              '<button class="linkedin-action">💬 Comment</button>' +
              '<button class="linkedin-action">🔁 Repost</button>' +
              '<button class="linkedin-action">✉️ Send</button>' +
            '</div>' +
            '<div class="sns-timestamp" style="margin-top:4px">' + timeStr + ' · ' + dateStr + '</div>' +
          '</div>';
        break;

      case 'bluesky':
        h =
          '<div class="sns-card-header">' +
            '<div class="sns-avatar" style="background:#0085ff"><span>✂️</span></div>' +
            '<div class="sns-user-info">' +
              '<div class="sns-display-name">SnipLink</div>' +
              '<div class="sns-username">@sniplink.bsky.social</div>' +
            '</div>' +
            '<div class="sns-more"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg></div>' +
          '</div>' +
          '<div class="sns-card-body">' +
            '<p class="sns-summary-text">' + hn(summary) + '</p>' +
            '<div class="sns-url">🔗 <a href="' + hn(url) + '" target="_blank" rel="noopener">' + hn(domain) + '</a></div>' +
          '</div>' +
          '<div class="sns-card-footer">' +
            '<div class="sns-actions-row">' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4M7 23l-4-4 4-4"/><path d="M21 5H9a4 4 0 00-4 4v3M3 19h12a4 4 0 004-4v-3"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn like-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><span>0</span></button>' +
              '<button class="sns-action-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></button>' +
            '</div>' +
            '<div class="sns-timestamp">' + timeStr + ' · ' + dateStr + ' · <span style="opacity:0.5">0 likes, 0 reposts</span></div>' +
          '</div>';
        break;
    }

    card.innerHTML = h;
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

    renderCard(platform, cachedSummaries[cacheKey].display, currentArticle.url);
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
    const text = cachedSummaries[currentPlatform].share;
    const ok = await SNS.copyToClipboard(text);
    if (ok) {
      showToast('📋 클립보드에 복사되었습니다!', 'success');
    } else {
      showToast('복사에 실패했습니다', 'error');
    }
  });

  DOM.tweetBtn.addEventListener('click', () => {
    if (!currentArticle || !cachedSummaries[currentPlatform]) return;
    const text = cachedSummaries[currentPlatform].share;
    SNS.shareTo(currentPlatform, text, currentArticle.url);
  });

  DOM.shareBtn.addEventListener('click', async () => {
    if (!currentArticle || !cachedSummaries[currentPlatform]) return;
    const text = cachedSummaries[currentPlatform].share;

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
