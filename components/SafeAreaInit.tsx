'use client';
import { useEffect } from 'react';

export default function SafeAreaInit() {
  useEffect(() => {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;left:0;right:0;height:env(safe-area-inset-top,0px);pointer-events:none;visibility:hidden;z-index:-1;';
    document.body.appendChild(probe);
    const measured = probe.getBoundingClientRect().height;
    document.body.removeChild(probe);

    if (measured > 0) {
      document.documentElement.style.setProperty('--sat', measured + 'px');
    }
  }, []);

  return null;
}
