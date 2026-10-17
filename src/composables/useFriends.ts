// 好友：好友碼、邀請、同意、刪除，還有去好友家（後端 /me/friends、/friends/:code/home）

import { ref } from 'vue';
import { accountRequest } from 'src/composables/useAccount';
import type { GardenPlacement, Look } from 'src/composables/usePlayerPrefs';

export interface FriendProfile {
  code: string;
  name: string;
  look: Look;
  theme?: 'villa';
}

export interface FriendHome {
  profile: FriendProfile;
  garden: GardenPlacement[];
}

const myCode = ref('');
const friends = ref<FriendProfile[]>([]);
const incoming = ref<FriendProfile[]>([]);
const outgoing = ref<FriendProfile[]>([]);
const loading = ref(false);

const int = (v: unknown) => (Number.isInteger(v) && (v as number) >= 0 ? (v as number) : 0);

function parseProfile(raw: unknown): FriendProfile | null {
  const p = raw as { code?: unknown; name?: unknown; look?: Record<string, unknown>; theme?: unknown } | null;
  if (!p || typeof p.code !== 'string' || typeof p.name !== 'string') return null;
  const look = p.look ?? {};
  return {
    code: p.code,
    name: p.name,
    look: { hair: int(look.hair), shirt: int(look.shirt), body: look.body === 1 ? 1 : 0, acc: int(look.acc) },
    ...(p.theme === 'villa' ? { theme: 'villa' as const } : {}),
  };
}

const list = (raw: unknown) => (Array.isArray(raw) ? raw.map(parseProfile).filter((p): p is FriendProfile => !!p) : []);

export type AddResult = 'sent' | 'accepted' | 'pending' | 'already' | 'not_found' | 'self' | 'too_many' | 'error';

export function useFriends() {
  async function refresh(): Promise<void> {
    loading.value = true;
    try {
      const res = await accountRequest('/api/v1/me/friends');
      if (!res.ok) return;
      const body = (await res.json()) as Record<string, unknown>;
      myCode.value = typeof body.code === 'string' ? body.code : '';
      friends.value = list(body.friends);
      incoming.value = list(body.incoming);
      outgoing.value = list(body.outgoing);
    } catch {
      // 連不上就維持原本的
    } finally {
      loading.value = false;
    }
  }

  async function add(code: string): Promise<AddResult> {
    try {
      const res = await accountRequest('/api/v1/me/friends', { method: 'POST', body: JSON.stringify({ code: code.trim().toUpperCase() }) });
      const body = (await res.json()) as { status?: string; message?: string };
      await refresh();
      const result = (res.ok ? body.status : body.message) as AddResult | undefined;
      return result ?? 'error';
    } catch {
      return 'error';
    }
  }

  async function accept(code: string): Promise<void> {
    await accountRequest(`/api/v1/me/friends/${encodeURIComponent(code)}/accept`, { method: 'POST' }).catch(() => undefined);
    await refresh();
  }

  async function remove(code: string): Promise<void> {
    await accountRequest(`/api/v1/me/friends/${encodeURIComponent(code)}`, { method: 'DELETE' }).catch(() => undefined);
    await refresh();
  }

  async function loadHome(code: string): Promise<FriendHome | null> {
    try {
      const res = await accountRequest(`/api/v1/friends/${encodeURIComponent(code)}/home`);
      if (!res.ok) return null;
      const body = (await res.json()) as { profile?: unknown; garden?: unknown };
      const profile = parseProfile(body.profile);
      if (!profile) return null;
      const garden = Array.isArray(body.garden)
        ? body.garden.filter((g): g is GardenPlacement => !!g && typeof (g as GardenPlacement).id === 'string' && Number.isInteger((g as GardenPlacement).x) && Number.isInteger((g as GardenPlacement).y)).slice(0, 300)
        : [];
      return { profile, garden };
    } catch {
      return null;
    }
  }

  return { myCode, friends, incoming, outgoing, loading, refresh, add, accept, remove, loadHome };
}
