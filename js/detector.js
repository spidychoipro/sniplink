const AI_PROHIBITION_PATTERNS = [
  /AI\s*(?:학습|training|learning)\s*(?:및|과|와|and)?\s*(?:활용|use|utilization)?\s*(?:금지|prohibited|forbidden|not\s*allowed)/i,
  /AI\s*크롤링\s*(?:금지|prohibited|forbidden)/i,
  /무단\s*(?:크롤링|수집|복제)\s*금지/i,
  /데이터\s*(?:수집|학습)\s*(?:금지|제한|불가)/i,
  /수집\s*(?:된\s*)?데이터\s*(?:의\s*)?(?:학습|AI)\s*(?:금지|제한)/i,
  /crawl(?:ing|s)?\s*(?:is\s*)?(?:prohibited|not\s*allowed|forbidden|blocked)/i,
  /scrap(?:ing|e)?\s*(?:is\s*)?(?:prohibited|not\s*allowed|forbidden)/i,
  /AI\s*(?:training|use|utilization)\s*(?:prohibited|not\s*allowed|forbidden)/i,
  /do\s*(?:not|n't)\s*(?:train|use|scrape|crawl)/i,
  /no\s*(?:training|scraping|crawling)/i,
  /DNT(?:\s*:\s*1)?/i,
  /robots\.txt.*disallow/i,
  /ai\s*generated\s*content\s*(?:policy|notice)/i,
];

const DARKWEB_PATTERNS = [
  /dark\s*web/i,
  /다크\s*웹/i,
  /다크웹/i,
  /tor\s*(?:browser|network|site)/i,
  /hidden\s*wiki/i,
  /onion\s*(?:site|link|address)/i,
  /일베/i,
  /dcinside/i,
  /warrior/i,
  /wef/i,
  /illuminati/i,
  /pizzagate/i,
  /qanon/i,
];

function detectLanguage(text) {
  if (!text || text.length < 20) return null;

  const hangulCount = (text.match(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g) || []).length;
  const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;

  if (totalChars === 0) return null;

  const hangulRatio = hangulCount / totalChars;
  const latinRatio = latinCount / totalChars;

  if (hangulRatio > 0.15) return 'ko';
  if (latinRatio > 0.4) return 'en';

  return null;
}

function checkAIBan(text) {
  for (const pattern of AI_PROHIBITION_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

function checkDarkWeb(text) {
  for (const pattern of DARKWEB_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

function scanContent(text) {
  const issues = [];

  if (!text || text.trim().length < 50) {
    return { safe: false, reason: 'too_short', message: '기사 내용이 너무 짧습니다. 유효한 기사 URL인지 확인해주세요.' };
  }

  if (checkAIBan(text)) {
    issues.push({
      type: 'ai_ban',
      message: '이 기사는 AI 학습 및 활용을 금지하고 있습니다.\nSnipLink는 해당 콘텐츠를 처리할 수 없습니다.\n\n⚠️ 이 링크는 다크웹 콘텐츠로 간주되어 차단되었습니다.'
    });
  }

  if (checkDarkWeb(text)) {
    issues.push({
      type: 'darkweb',
      message: '⚠️ 이 콘텐츠는 다크웹 관련 내용을 포함하고 있어\n안전을 위해 처리가 차단되었습니다.'
    });
  }

  const lang = detectLanguage(text);
  if (!lang) {
    issues.push({
      type: 'unsupported_lang',
      message: '영어 또는 한국어 기사만 지원합니다.\n감지된 언어가 지원되지 않습니다.'
    });
  }

  return {
    safe: issues.length === 0,
    lang,
    issues
  };
}
