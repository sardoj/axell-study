/* Axell, étude pivot ICP, auth client (SHA-256 du mot de passe).
   Stocke un flag dans sessionStorage : valable jusqu'à fermeture du navigateur.
   Note de sécurité : protection légère type basic auth, pas un coffre-fort.
   Quelqu'un avec accès aux fichiers peut bypass. À combiner avec une auth
   serveur (.htpasswd, Cloudflare Access) pour un usage publié plus sensible.
*/

(function () {
  'use strict';

  // Hash SHA-256 de "Axe!!"
  const PASSWORD_HASH = 'd5662339e7d27c98178f4c046b8918897c101d2c309068bcd1b00be57d2dadfc';
  const STORAGE_KEY   = 'axell_closer_auth_v1';
  const LOGIN_PAGE    = 'login.html';

  // Détecte si on est dans /pages/X.html ou à la racine
  function isInPages() {
    return /\/pages\//.test(window.location.pathname);
  }

  function loginPath() {
    return isInPages() ? '../' + LOGIN_PAGE : LOGIN_PAGE;
  }

  function homePath() {
    return isInPages() ? '../index.html' : 'index.html';
  }

  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Vérifie l'auth, redirige vers login si non authentifié.
  function gate() {
    const ok = sessionStorage.getItem(STORAGE_KEY) === 'ok';
    if (!ok) {
      window.location.replace(loginPath());
      return false;
    }
    document.body.classList.remove('auth-pending');
    return true;
  }

  // Tentative de login (depuis login.html)
  async function tryLogin(password) {
    const hash = await sha256(password);
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem(STORAGE_KEY, 'ok');
      return true;
    }
    return false;
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.replace(loginPath());
  }

  // Si déjà authentifié et qu'on arrive sur login.html, rediriger vers home.
  function redirectIfAuthed() {
    if (sessionStorage.getItem(STORAGE_KEY) === 'ok') {
      window.location.replace(homePath());
    }
  }

  // Expose API
  window.AxellAuth = { gate, tryLogin, logout, redirectIfAuthed, sha256 };
})();
