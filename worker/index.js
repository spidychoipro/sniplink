export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');

    if (!target) {
      return new Response('Missing "url" parameter', { status: 400 });
    }

    try {
      new URL(target);
    } catch {
      return new Response('Invalid URL', { status: 400 });
    }

    const response = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SnipLink/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    const body = await response.text();

    return new Response(body, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  },
};
