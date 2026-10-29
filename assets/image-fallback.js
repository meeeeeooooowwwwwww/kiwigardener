// Keep photo cards usable when a third-party image host declines a request.
// Run before lazy-loaded images and repair images already failed by DOM ready.
(() => {
  function recover(img) {
    if (!img || !img.matches('img[data-fallback-src]')) return;
    if (img.dataset.photoRecovered === 'yes') {
      // If even the second real photo fails, hide the broken image and its
      // obsolete attribution instead of displaying a broken-image icon.
      const figure = img.closest('figure.local-figure');
      if (figure) figure.hidden = true;
      else img.hidden = true;
      return;
    }
    const fallback = img.dataset.fallbackSrc;
    if (!fallback || img.currentSrc === fallback || img.src === fallback) {
      img.hidden = true;
      return;
    }
    img.dataset.photoRecovered = 'yes';
    if (img.closest('.local-figure')) {
      const caption = img.closest('figure').querySelector('figcaption');
      if (caption) caption.textContent = 'Illustrative garden photograph (Unsplash). Original local image is temporarily unavailable.';
    }
    img.alt = 'Illustrative garden photograph (Unsplash), not a photograph of this particular location or of completed work by Dallas Timpson';
    img.src = fallback;
  }
  document.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement) recover(event.target);
  }, true);
  function checkAlreadyFailed() {
    document.querySelectorAll('img[data-fallback-src]').forEach(img => {
      if (img.complete && img.naturalWidth === 0) recover(img);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', checkAlreadyFailed, {once:true});
  else checkAlreadyFailed();
})();
