import { useState } from 'react';

// Google blocks sign-in inside apps' built-in browsers, such as LinkedIn,
// Instagram and Facebook. Visitors who tap a link in those apps need to
// open the page in Chrome or Safari first.
const APPS = [
  [/LinkedInApp/i, 'LinkedIn'],
  [/Instagram/i, 'Instagram'],
  [/FBAN|FBAV|FB_IAB|FB4A/i, 'Facebook'],
  [/Snapchat/i, 'Snapchat'],
  [/\bLine\//i, 'LINE'],
  [/MicroMessenger/i, 'WeChat'],
];

// Returns the app's name, "this app" for other Android in-app browsers, or null.
export function detectInAppBrowser(ua = navigator.userAgent) {
  for (const [pattern, name] of APPS) if (pattern.test(ua)) return name;
  if (/; wv\)/.test(ua)) return 'this app';
  return null;
}

export default function InAppBrowserNotice({ app }) {
  const [copy, setCopy] = useState('idle');
  const android = /Android/i.test(navigator.userAgent);
  const url = window.location.href;
  const { host, pathname, search } = window.location;
  const chromeLink =
    `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;` +
    `S.browser_fallback_url=${encodeURIComponent(url)};end`;
  const where = app === 'this app' ? 'this app' : `the ${app} app`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopy('done');
    } catch {
      setCopy('failed');
    }
  }

  return (
    <div className="inapp" role="note">
      <p className="inapp-title">Open Cafflora in your browser</p>
      <p className="inapp-text">
        Google sign-in doesn&apos;t work inside {where}.{' '}
        {android
          ? 'Tap the button to open this page in Chrome.'
          : 'Tap the ⋯ menu and choose Open in Safari (or Open in browser).'}
      </p>
      <div className="inapp-actions">
        {android && (
          <a className="btn btn-primary" href={chromeLink}>
            Open in Chrome
          </a>
        )}
        <button type="button" className={`btn ${android ? 'btn-ghost' : 'btn-primary'}`} onClick={copyLink}>
          {copy === 'done' ? 'Link copied' : 'Copy link'}
        </button>
      </div>
      <p className="inapp-text inapp-url">{host}</p>
      <p className="inapp-text" role="status">
        {copy === 'done' && 'Now paste it into Chrome or Safari.'}
        {copy === 'failed' && 'Press and hold the address above to copy it.'}
      </p>
    </div>
  );
}
