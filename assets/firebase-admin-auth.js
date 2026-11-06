/* Firebase Authentication for administrator operations.
   The Firebase Web API key is public configuration; database permissions live in Rules. */
(() => {
  const VERSION = '10.12.2';
  let initPromise;
  function load(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Không tải được Firebase Authentication.'));
      document.head.appendChild(script);
    });
  }
  async function init() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const cfg = window.GAME_CONFIG && window.GAME_CONFIG.firebase;
      if (!cfg || !cfg.apiKey || cfg.apiKey === 'PASTE_FIREBASE_WEB_API_KEY' ||
          !cfg.appId || cfg.appId === 'PASTE_FIREBASE_WEB_APP_ID' ||
          !cfg.adminUid || cfg.adminUid === 'PASTE_ADMIN_UID') {
        throw new Error('Chưa cấu hình Firebase Web app và UID quản trị.');
      }
      if (!window.firebase || !firebase.initializeApp) {
        await load('https://www.gstatic.com/firebasejs/' + VERSION + '/firebase-app-compat.js');
      }
      if (!firebase.auth) {
        await load('https://www.gstatic.com/firebasejs/' + VERSION + '/firebase-auth-compat.js');
      }
      const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
      const auth = firebase.auth(app);
      await new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(
          () => { unsubscribe(); resolve(); },
          reject
        );
      });
      return auth;
    })();
    return initPromise;
  }
  async function signIn(email, password) {
    const auth = await init();
    const result = await auth.signInWithEmailAndPassword(email, password);
    if (result.user.uid !== window.GAME_CONFIG.firebase.adminUid) {
      await auth.signOut();
      throw new Error('Tài khoản này không có quyền quản trị.');
    }
    return result.user;
  }
  async function adminUser() {
    const auth = await init();
    const user = auth.currentUser;
    return user && user.uid === window.GAME_CONFIG.firebase.adminUid ? user : null;
  }
  async function isAdmin() { return !!(await adminUser()); }
  async function request(url, options) {
    const user = await adminUser();
    if (!user) throw new Error('Bạn cần đăng nhập tài khoản quản trị Firebase.');
    const token = await user.getIdToken();
    const target = new URL(url);
    target.searchParams.set('auth', token);
    const response = await fetch(target.toString(), options);
    if (!response.ok) throw new Error('Firebase từ chối thao tác (' + response.status + ').');
    return response;
  }
  async function signOut() {
    const auth = await init();
    await auth.signOut();
  }
  window.FBA = { init, signIn, isAdmin, request, signOut };
})();
