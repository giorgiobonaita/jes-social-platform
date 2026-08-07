'use client';
import { useEffect } from 'react';

function readEnv(property: 'safe-area-inset-top' | 'safe-area-inset-bottom'): number {
  const el = document.createElement('div');
  const cssProp = property === 'safe-area-inset-top' ? 'paddingTop' : 'paddingBottom';
  const envVal = `env(${property}, 0px)`;
  el.style.cssText = `position:fixed;top:0;left:0;${cssProp}:${envVal};pointer-events:none;visibility:hidden;z-index:-1;`;
  document.body.appendChild(el);
  const computed = parseFloat(getComputedStyle(el)[cssProp]) || 0;
  document.body.removeChild(el);
  return computed;
}

function applyVars() {
  const top = readEnv('safe-area-inset-top');
  const bottom = readEnv('safe-area-inset-bottom');
  if (top > 0) document.documentElement.style.setProperty('--sat', top + 'px');
  if (bottom > 0) document.documentElement.style.setProperty('--sab', bottom + 'px');
  return top > 0;
}

export default function SafeAreaInit() {
  useEffect(() => {
    // Try immediately — if env() is already resolved, we're done in 1 frame
    // Otherwise retry up to 30 frames (≈500ms) waiting for WKWebView to initialize
    let attempts = 0;

    function tryMeasure() {
      const resolved = applyVars();
      if (!resolved && attempts < 30) {
        attempts++;
        requestAnimationFrame(tryMeasure);
      }
    }

    requestAnimationFrame(tryMeasure);
  }, []);

  return null;
}
