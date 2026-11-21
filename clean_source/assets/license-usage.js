/* Ghi nhận lượt dùng mã Pro theo phiên trình duyệt. Không thu thập IP. */
(() => {
  const PREFIX = 'msnene_license_usage_';

  function browserName() {
    const ua = navigator.userAgent || '';
    if (/Edg\//.test(ua)) return 'Edge';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/Chrome\//.test(ua)) return 'Chrome';
    if (/Safari\//.test(ua)) return 'Safari';
    return 'Trình duyệt khác';
  }

  function platformName() {
    const ua = navigator.userAgent || '';
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iPhone/iPad';
    if (/Windows/.test(ua)) return 'Windows';
    if (/Macintosh|Mac OS X/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Thiết bị khác';
  }

  async function record(token, force = false) {
    const hash = token && token.hash;
    if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/i.test(hash)) return;
    const sessionKey = PREFIX + hash;
    if (!force) {
      try { if (sessionStorage.getItem(sessionKey)) return; } catch (_) {}
    }
    const cfg = window.GAME_CONFIG && window.GAME_CONFIG.firebase;
    if (!cfg || !cfg.databaseURL || !window.FBA) return;
    const auth = await window.FBA.init();
    const user = auth.currentUser || (await auth.signInAnonymously()).user;
    const base = cfg.databaseURL.replace(/\/$/, '');
    const url = new URL(base + '/license_usage/' + hash + '/' + user.uid + '.json');
    url.searchParams.set('auth', await user.getIdToken());
    const previousResponse = await fetch(url);
    if (!previousResponse.ok) throw new Error('Không đọc được lịch sử dùng mã.');
    const previous = await previousResponse.json();
    const timestamp = { '.sv': 'timestamp' };
    const entry = {
      firstSeen: previous && Number.isFinite(previous.firstSeen) ? previous.firstSeen : timestamp,
      lastSeen: timestamp,
      browser: browserName(),
      platform: platformName()
    };
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    if (!response.ok) throw new Error('Không ghi được lịch sử dùng mã.');
    try { sessionStorage.setItem(sessionKey, '1'); } catch (_) {}
  }

  function recordCurrent() {
    const current = window.LIC && window.LIC.current && window.LIC.current();
    if (!current || !current.ok || !current.token) return Promise.resolve();
    return record(current.token);
  }

  window.LicenseUsage = { record, recordCurrent };
  window.addEventListener('load', () => {
    setTimeout(() => recordCurrent().catch(error => console.warn('License usage:', error)), 3000);
  });
})();
