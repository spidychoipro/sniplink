const PROXIES = [
  { url: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, name: 'allorigins' },
  { url: (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`, name: 'corsproxy' },
  { url: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, name: 'codetabs' },
];

const MAX_RETRIES = 2;

async function fetchViaProxy(url, proxyIndex = 0, retry = 0) {
  if (proxyIndex >= PROXIES.length) {
    throw new Error('모든 프록시 서버가 응답하지 않습니다. 나중에 다시 시도해주세요.');
  }

  const proxy = PROXIES[proxyIndex];
  const proxyUrl = proxy.url(url);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(proxyUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    if (!text || text.length < 100) throw new Error('응답이 너무 짧습니다');

    return text;
  } catch (e) {
    if (retry < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, 1000));
      return fetchViaProxy(url, proxyIndex, retry + 1);
    }
    return fetchViaProxy(url, proxyIndex + 1, 0);
  }
}

function extractWithReadability(html, sourceUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const article = doc.querySelector('article');
  const main = doc.querySelector('main');
  const body = doc.body;

  let title = '';
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.content;
  const h1 = doc.querySelector('h1');
  title = ogTitle || h1?.textContent || '';

  let source = '';
  try {
    source = new URL(sourceUrl).hostname.replace('www.', '');
  } catch {}

  let contentText = '';

  if (article) {
    contentText = article.innerText;
  } else if (main) {
    contentText = main.innerText;
  } else {
    const articleLike = doc.querySelector('[class*="article"], [class*="content"], [class*="post"], [class*="entry"], [id*="article"], [id*="content"], [id*="post"]');
    if (articleLike) {
      contentText = articleLike.innerText;
    } else {
      const p = doc.querySelectorAll('p');
      if (p.length > 3) {
        contentText = Array.from(p).map(p => p.innerText).join('\n');
      } else {
        contentText = doc.body.innerText;
      }
    }
  }

  const scriptRemoved = contentText
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '');

  const cleanText = scriptRemoved
    .replace(/<[^>]+>/g, '')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = cleanText.split('\n').filter(l => l.trim().length > 0);
  const filtered = lines.filter(l => {
    const t = l.trim();
    if (t.length < 10) return false;
    if (/^(Copyright|©|All\s*Rights\s*Reserved|구독|팔로우|공유|트위터|페이스북|인스타|광고|기사제보|이메일|무단\s*전재|재배포\s*금지)/i.test(t)) return false;
    if (t.includes('@') && t.length < 40) return false;
    return true;
  });

  const finalText = filtered.join('\n');

  const image = doc.querySelector('meta[property="og:image"]')?.content || '';

  return {
    title: title.trim(),
    source,
    text: finalText,
    image,
    url: sourceUrl
  };
}

async function extractArticle(url) {
  const html = await fetchViaProxy(url);

  const result = extractWithReadability(html, url);

  if (!result.text || result.text.length < 50) {
    throw new Error('기사 내용을 추출할 수 없습니다. 올바른 기사 URL인지 확인해주세요.');
  }

  const fullContent = `${result.title}\n${result.text}`;
  const lang = detectLanguage(fullContent);

  if (!lang) {
    throw new Error('영어 또는 한국어 기사만 지원합니다.\n이 기사는 지원되지 않는 언어로 작성된 것 같습니다.');
  }

  if (checkAIBan(fullContent)) {
    throw new Error('처리할 수 없는 링크입니다.');
  }

  if (checkDarkWeb(fullContent)) {
    throw new Error('처리할 수 없는 링크입니다.');
  }

  return result;
}

function getPlatformSummaryLength(platform) {
  switch (platform) {
    case 'twitter': return { maxChars: 100, maxSentences: 2 };
    case 'threads': return { maxChars: 180, maxSentences: 3 };
    case 'instagram': return { maxChars: 250, maxSentences: 3 };
    case 'reddit': return { maxChars: 180, maxSentences: 2 };
    case 'linkedin': return { maxChars: 200, maxSentences: 2 };
    case 'bluesky': return { maxChars: 120, maxSentences: 2 };
    default: return { maxChars: 100, maxSentences: 2 };
  }
}
