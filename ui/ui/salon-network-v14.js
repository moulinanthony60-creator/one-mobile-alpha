/* ONE — connexion salons V14.
 * Adapter limité à /party/state et /party/create. Les autres appels gardent
 * leur implémentation, leur authentification et leurs délais existants.
 * Aucune écriture POST n'est réessayée automatiquement.
 */
(() => {
  'use strict';
  if (!window.ONEUI?.api || window.ONESalonNetwork?.version === '14') return;
  const originalApi = window.ONEUI.api;
  const API = 'https://one-comments-api.moulinanthony60.workers.dev';
  let rateLimitUntil = 0;
  const error = (message, code, extra = {}) => Object.assign(new Error(message), { code, ...extra });
  const accountChanged = () => error('Le compte a changé. Rouvre les salons.', 'ACCOUNT_CHANGED');
  const retryDelay = response => {
    const value = response.headers.get('Retry-After');
    if (!value) return 8000;
    const seconds = Number(value);
    return Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : Math.max(0, Date.parse(value) - Date.now()) || 8000;
  };

  async function salonApi(path, method = 'GET', body, options = {}) {
    if (!/^\/party\/(state|create)(?:\?|$)/.test(path)) return originalApi(path, method, body);
    method = method.toUpperCase();
    const writing = method !== 'GET';
    const token = window.oneAccountToken?.();
    if (!token) throw error('Connecte-toi à ONE pour ouvrir un salon.', 'AUTH_REQUIRED', { status: 401 });
    if (navigator.onLine === false) throw error('Pas de connexion Internet. Reconnecte-toi puis réessaie.', 'OFFLINE', { uncertain: false });
    // A deliberate verification can bypass the shared network backoff, but not
    // an explicit Retry-After returned by this service.
    if (Date.now() < rateLimitUntil) {
      const wait = Math.ceil((rateLimitUntil - Date.now()) / 1000);
      throw error('Trop de demandes. Réessaie dans ' + wait + ' s.', 'RATE_LIMIT', { status: 429, backoff: true });
    }
    if (!options.interactive) window.ONEAPIBackoff?.check(method);

    const controller = new AbortController();
    const external = options.signal;
    const abort = () => controller.abort();
    if (external?.aborted) abort();
    else external?.addEventListener('abort', abort, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, writing ? 25000 : 15000);
    try {
      const response = await fetch(API + path, {
        method, cache: 'no-store',
        headers: { Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: controller.signal,
      });
      let data;
      try { data = await response.json(); }
      catch (e) {
        // Keep a timeout while reading the response body distinct from bad JSON.
        if (controller.signal.aborted || e.name === 'AbortError' || e.name === 'TimeoutError') throw e;
        data = null;
      }
      if (token !== window.oneAccountToken?.()) throw accountChanged();
      window.ONEAPIBackoff?.note(response, data);
      if (response.status === 429) rateLimitUntil = Date.now() + retryDelay(response);
      if (!response.ok) {
        let message = typeof data?.error === 'string' ? data.error : '';
        if (response.status === 401) message = 'Ta session ONE a expiré. Reconnecte-toi depuis ton profil.';
        else if (response.status === 429) message = 'Le serveur demande une pause. Réessaie dans ' + Math.ceil((rateLimitUntil - Date.now()) / 1000) + ' s.';
        else if (!message && response.status >= 500) message = 'Le serveur des salons est momentanément indisponible (HTTP ' + response.status + ').';
        else if (!message) message = 'Impossible de confirmer cette action (HTTP ' + response.status + ').';
        throw error(message, 'HTTP_' + response.status, { status: response.status, uncertain: writing && response.status >= 500 });
      }
      const validState = writing || data && Object.hasOwn(data, 'room') && (data.room === null || typeof data.room?.id === 'string' && Array.isArray(data.room?.members));
      if (!data?.ok || !validState || writing && typeof data.id !== 'string') {
        throw error('Réponse du serveur des salons incomplète. Vérifie ton salon avant de recommencer.', 'INVALID_RESPONSE', { uncertain: writing });
      }
      return data;
    } catch (e) {
      if (token !== window.oneAccountToken?.()) throw accountChanged();
      if (timedOut || e.name === 'TimeoutError') {
        const failure = error('Le serveur des salons ne répond pas assez vite. Vérifie ta connexion puis réessaie.', 'TIMEOUT', { name: 'TimeoutError', uncertain: writing });
        window.ONEAPIBackoff?.network(failure);
        throw failure;
      }
      if (controller.signal.aborted || e.name === 'AbortError') throw e;
      if (e.name === 'TypeError') {
        window.ONEAPIBackoff?.network(e);
        throw error('Connexion au serveur des salons impossible. Vérifie Internet puis réessaie.', 'NETWORK', { uncertain: writing });
      }
      throw e;
    } finally {
      clearTimeout(timer);
      external?.removeEventListener('abort', abort);
    }
  }
  window.ONEUI.api = salonApi;
  window.ONESalonNetwork = Object.freeze({ version: '14', stateTimeoutMs: 15000, createTimeoutMs: 25000 });
})();
