// 載入 Google Identity Services 並畫出官方的「使用 Google 登入」按鈕。

interface GoogleIdApi {
  initialize: (options: { client_id: string; callback: (response: { credential: string }) => void; auto_select?: boolean }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

let loading: Promise<GoogleIdApi> | null = null;

function loadGoogleIdentity(): Promise<GoogleIdApi> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error('Google Identity unavailable')));
    script.onerror = () => {
      loading = null;
      reject(new Error('Google Identity failed to load'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export async function renderGoogleButton(
  el: HTMLElement,
  clientId: string,
  onCredential: (credential: string) => void,
  options: { dark: boolean; locale: string },
): Promise<void> {
  const api = await loadGoogleIdentity();
  api.initialize({ client_id: clientId, callback: (response) => onCredential(response.credential) });
  api.renderButton(el, {
    type: 'standard',
    theme: options.dark ? 'filled_black' : 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    locale: options.locale,
  });
}
