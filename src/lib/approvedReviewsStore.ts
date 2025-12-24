import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface ApprovedReviewRecord {
  reviewId: string;
  listingId: string;
  approvedAt: string;
}

interface ApprovedReviewsDb {
  version: 1;
  reviews: Record<string, ApprovedReviewRecord>;
}

function dbPath(): string {
  return path.join(process.cwd(), 'src', 'data', 'approved-reviews.json');
}

const EMPTY_DB: ApprovedReviewsDb = { version: 1, reviews: {} };

async function readDb(): Promise<ApprovedReviewsDb> {
  try {
    const raw = await readFile(dbPath(), 'utf8');
    const parsed = JSON.parse(raw) as ApprovedReviewsDb;
    if (!parsed || typeof parsed !== 'object') return EMPTY_DB;
    if (parsed.version !== 1 || !parsed.reviews || typeof parsed.reviews !== 'object') return EMPTY_DB;
    return parsed;
  } catch {
    return EMPTY_DB;
  }
}

async function writeDb(db: ApprovedReviewsDb): Promise<void> {
  await writeFile(dbPath(), JSON.stringify(db, null, 2), 'utf8');
}

export async function getApprovedReviewIds(listingId?: string): Promise<string[]> {
  const db = await readDb();
  const records = Object.values(db.reviews);
  return records
    .filter((r) => (listingId ? r.listingId === listingId : true))
    .sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime())
    .map((r) => r.reviewId);
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

  const db = await readDb();

  if (approved) {
    db.reviews[reviewId] = {
      reviewId,
      listingId,
      approvedAt: new Date().toISOString(),
    };
  } else {
    delete db.reviews[reviewId];
  }

  await writeDb(db);

  return { approved };
}
