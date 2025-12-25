import { kv } from '@vercel/kv';

function approvalsKey(listingId: string): string {
  return `approvals:listing:${listingId}`;
}

function canUseKv(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

const memoryStore = new Map<string, Set<string>>();
let warnedMissingKv = false;

function getStore(listingId: string): {
  type: 'kv' | 'memory';
  key: string;
} {
  if (canUseKv()) {
    return { type: 'kv', key: approvalsKey(listingId) };
  }

  if (!warnedMissingKv && process.env.NODE_ENV !== 'production') {
    warnedMissingKv = true;
    console.warn(
      '[approvedReviewsStore] KV env vars missing; using in-memory approvals store (dev-only). Approvals will not persist across restarts.'
    );
  }

  return { type: 'memory', key: approvalsKey(listingId) };
}

async function readApprovedIds(listingId: string): Promise<string[]> {
  const store = getStore(listingId);

  if (store.type === 'kv') {
    const value = (await kv.get(store.key)) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is string => typeof v === 'string');
  }

  const set = memoryStore.get(store.key);
  return set ? Array.from(set) : [];
}

async function writeApprovedIds(listingId: string, ids: string[]): Promise<void> {
  const store = getStore(listingId);

  if (store.type === 'kv') {
    await kv.set(store.key, ids);
    return;
  }

  memoryStore.set(store.key, new Set(ids));
}

export async function getApprovedReviewIds(listingId?: string): Promise<string[]> {
  if (!listingId) return [];
  return readApprovedIds(listingId);
}

export async function setReviewApproved(input: {
  reviewId: string;
  listingId: string;
  approved: boolean;
}): Promise<{ approved: boolean }> {
  const { reviewId, listingId, approved } = input;

  if (!reviewId || !listingId) {
    throw new Error('reviewId and listingId are required');
  }

  const existing = await readApprovedIds(listingId);
  const next = new Set(existing);
  if (approved) next.add(reviewId);
  else next.delete(reviewId);

  await writeApprovedIds(listingId, Array.from(next));

  return { approved };
}
