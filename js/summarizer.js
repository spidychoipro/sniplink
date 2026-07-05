const KR_STOPWORDS = new Set([
  '이', '그', '저', '것', '수', '등', '더', '너무', '정말', '매우',
  '및', '의', '에', '에서', '으로', '로', '에게', '한테', '께',
  '있다', '하다', '되다', '같다', '그렇다', '아니', '않',
  '와', '과', '하고', '이랑', '랑',
  '는', '은', '가', '이', '를', '을', '도', '만', '까지', '조차',
  '부터', '에서', '까지',
  '안', '못',
  '이런', '저런', '그런', '어떤',
  '때', '데', '곳', '중', '경우',
  '위해', '통해', '대해', '대한',
  '우리', '나', '저', '당신', '그', '그녀', '제', '네',
  '아', '어', '응', '그래',
  '근데', '그런데', '그래서', '하지만', '왜냐하면', '그러나',
  '그리고', '또', '또한',
  '아주', '아직', '벌써', '이미',
  '자꾸', '자주', '가끔', '항상', '늘', '언제나',
  '대부분', '거의', '모두', '전체',
  '때문', '대한', '위한', '통한', '통해서', '통해',
  '대해서', '관해서', '관한', '대해',
  '년', '월', '일', '시', '분', '초',
  '한', '더', '이미', '바로', '아직',
  '이번', '지난', '다음', '저번',
  '쪽', '편', '분', '명',
]);

const EN_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'were', 'be', 'been',
  'are', 'am', 'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'shall',
  'it', 'its', 'it\'s', 'that', 'this', 'these', 'those',
  'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their',
  'not', 'no', 'nor', 'so', 'if', 'then', 'than',
  'also', 'very', 'just', 'about', 'up', 'out', 'over',
  'after', 'before', 'between', 'through', 'during',
  'which', 'what', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'only', 'own', 'same', 'into', 'than',
  'because', 'while', 'although', 'since', 'until',
  'here', 'there', 'back', 'still', 'well',
]);

function splitSentences(text) {
  const raw = text
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const parts = raw.match(/[^.!?\n]+[.!?\n]*(?:\s|$)/g) || [raw];

  const sentences = [];
  let buffer = '';

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.length > 15 || /[.!?]$/.test(trimmed)) {
      if (buffer) {
        sentences.push(buffer + ' ' + trimmed);
        buffer = '';
      } else {
        sentences.push(trimmed);
      }
    } else {
      if (buffer) {
        buffer += ' ' + trimmed;
      } else {
        buffer = trimmed;
      }
    }
  }

  if (buffer) sentences.push(buffer);

  return sentences
    .filter(s => s.length > 10 && /[가-힣a-zA-Z]/.test(s))
    .map(s => s.replace(/\s+/g, ' ').trim());
}

function isKoreanChar(c) {
  return c >= '\uAC00' && c <= '\uD7AF';
}

function tokenize(sentence) {
  const s = sentence.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = s.split(/\s+/).filter(w => w.length > 1);

  return words.filter(w => {
    if (isKoreanChar(w[0])) {
      return !KR_STOPWORDS.has(w);
    }
    return !EN_STOPWORDS.has(w) && w.length > 2;
  });
}

function getCharBigrams(word) {
  const bigrams = [];
  for (let i = 0; i < word.length - 1; i++) {
    bigrams.push(word.slice(i, i + 2));
  }
  return bigrams;
}

function tokenizeWithBigrams(sentence) {
  const words = tokenize(sentence);
  const tokens = [...words];

  for (const word of words) {
    if (isKoreanChar(word[0])) {
      const bigrams = getCharBigrams(word);
      const frequent = bigrams.filter(b => {
        const count = words.filter(w => w.includes(b)).length;
        return count > 1;
      });
      tokens.push(...frequent);
    }
  }

  return [...new Set(tokens)];
}

function sentenceSimilarity(s1, s2) {
  const t1 = tokenizeWithBigrams(s1);
  const t2 = tokenizeWithBigrams(s2);

  if (t1.length === 0 || t2.length === 0) return 0;

  const set1 = new Set(t1);
  let common = 0;
  for (const t of t2) {
    if (set1.has(t)) common++;
  }

  if (common === 0) return 0;

  return common / (Math.log(t1.length) + Math.log(t2.length));
}

function textRank(sentences, iterations = 30, damping = 0.85) {
  const n = sentences.length;
  if (n === 0) return [];
  if (n === 1) return [1];

  const simMatrix = [];
  for (let i = 0; i < n; i++) {
    simMatrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        simMatrix[i][j] = 0;
      } else {
        simMatrix[i][j] = sentenceSimilarity(sentences[i], sentences[j]);
      }
    }
  }

  let scores = new Array(n).fill(1);
  for (let iter = 0; iter < iterations; iter++) {
    const newScores = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const rowSum = simMatrix[j].reduce((a, b) => a + b, 0);
          if (rowSum > 0) {
            sum += (simMatrix[j][i] / rowSum) * scores[j];
          }
        }
      }
      newScores[i] = (1 - damping) + damping * sum;
    }
    scores = newScores;
  }

  return scores;
}

function extractSummary(text, platform) {
  const { maxChars, maxSentences } = getPlatformSummaryLength(platform);

  const sentences = splitSentences(text);

  if (sentences.length === 0) return '요약할 내용이 없습니다.';

  if (sentences.length <= maxSentences) {
    let result = sentences.join(' ');
    if (result.length > maxChars) {
      result = result.slice(0, maxChars - 3) + '...';
    }
    return result;
  }

  const scores = textRank(sentences);
  const scored = sentences.map((s, i) => ({ sentence: s, score: scores[i], index: i }));
  scored.sort((a, b) => b.score - a.score);

  const topSentences = scored.slice(0, maxSentences);
  topSentences.sort((a, b) => a.index - b.index);

  let result = topSentences.map(s => s.sentence).join(' ');

  if (result.length > maxChars) {
    const selected = topSentences.slice(0, maxSentences - 1);
    selected.sort((a, b) => a.index - b.index);
    result = selected.map(s => s.sentence).join(' ');

    if (result.length > maxChars) {
      result = result.slice(0, maxChars - 3) + '...';
    }
  }

  return result;
}

function generateHashtags(text, platform) {
  if (platform !== 'instagram') return '';

  const words = text.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, ' ').split(/\s+/);
  const freq = {};
  for (const w of words) {
    if (w.length > 1 && !KR_STOPWORDS.has(w) && !EN_STOPWORDS.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const now = new Date();
  const todayStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  const hashtags = sorted.map(([word]) => `#${word.replace(/\s/g, '')}`);

  const all = ['#SnipLink', ...hashtags, '#뉴스요약', '#SNS요약'];

  return [...new Set(all)].slice(0, 8).join(' ');
}

function formatForPlatform(summary, platform, articleTitle, articleUrl) {
  const title = articleTitle || '기사';

  switch (platform) {
    case 'twitter': {
      const header = ``;
      const body = summary;
      const footer = `\n\n🔗 ${articleUrl}`;
      let full = body + footer;
      if (full.length > 140) {
        const maxBody = 140 - footer.length - 10;
        full = body.slice(0, Math.max(maxBody, 30)) + '...' + footer;
      }
      return full;
    }

    case 'threads': {
      return `${title}\n\n${summary}\n\n🔗 ${articleUrl}`;
    }

    case 'instagram': {
      const hashtags = generateHashtags(summary + ' ' + articleTitle, 'instagram');
      return `${title}\n\n${summary}\n\n.\n.\n.\n${hashtags}\n\n🔗 ${articleUrl}`;
    }

    case 'reddit': {
      return `${title}\n\n${summary}\n\n🔗 ${articleUrl}`;
    }

    case 'linkedin': {
      return `📰 ${title}\n\n${summary}\n\n#SnipLink #요약 #뉴스\n\n🔗 ${articleUrl}`;
    }

    case 'bluesky': {
      return `📰 ${title}\n\n${summary}\n\n🔗 ${articleUrl}`;
    }

    default:
      return `${title}\n\n${summary}\n\n🔗 ${articleUrl}`;
  }
}

function generateSummary(article, platform) {
  const summary = extractSummary(article.text, platform);
  return formatForPlatform(summary, platform, article.title, article.url);
}
