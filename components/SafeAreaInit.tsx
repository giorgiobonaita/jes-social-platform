'use client';
import { useEffect } from 'react';

export default function SafeAreaInit() {
  useEffect(() => {
    // Measure the actual var(--sat) value via a probe element
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;left:0;right:0;height:var(--sat);pointer-events:none;visibility:hidden;z-index:-1;';
    document.body.appendChild(probe);
    const measured = probe.getBoundingClientRect().height;
    document.body.removeChild(probe);

    // If env() returned 0 (viewport-fit not applied or not supported),
    // fall back to device detection: modern iPhones have 44-59px status bar
    let sat = measured;
    if (sat === 0 && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      const h = window.screen.height;
      // Dynamic Island iPhones (≥2778px logical): 59px
      // Notch iPhones: 44px
      // Old iPhones (SE, 8, etc): 20px — but those don't go under status bar
      sat = h >= 844 ? 44 : 20;
    }

    document.documentElement.style.setProperty('--sat', sat + 'px');
  }, []);

  return null;
}
