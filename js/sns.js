const SNS = {

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(ta);
      }
    }
  },

  tweet(text) {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=450');
  },

  async webShare(data) {
    if (!navigator.share) return false;
    try {
      await navigator.share(data);
      return true;
    } catch {
      return false;
    }
  },

  makeThreadsUrl(text) {
    return `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`;
  },

  openInNewTab(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
