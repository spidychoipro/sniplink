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

  bluesky(text) {
    const url = `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=600');
  },

  linkedin(url) {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=450');
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

  shareTo(platform, text, url) {
    switch (platform) {
      case 'twitter':
        this.tweet(text);
        break;
      case 'bluesky':
        this.bluesky(text);
        break;
      case 'linkedin':
        this.linkedin(url);
        break;
      default:
        this.copyToClipboard(text).then(ok => {
          if (ok) {
            const toast = document.getElementById('toast');
            toast.textContent = '📋 클립보드에 복사되었습니다!';
            toast.className = 'toast success';
            toast.classList.remove('hidden');
            clearTimeout(toast._hide);
            toast._hide = setTimeout(() => toast.classList.add('hidden'), 2500);
          }
        });
    }
  },

  openInNewTab(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
