# Flex Living Reviews Dashboard

## What the app does
This app helps Flex Living managers understand property performance from guest reviews, filter/sort the review stream, and curate which reviews appear on the public-facing property page. It integrates with Hostaway (mocked using realistic JSON) and includes an optional Google Places Reviews fetch.

## Local setup
1. Install dependencies:

```bash
npm install
```

2. Create/update environment variables (optional):

```bash
# (Optional) Google Places reviews endpoint only
GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE

# (Optional) Vercel KV / Upstash Redis for approvals persistence
# If unset locally, the app falls back to an in-memory store (dev-only) and approvals will not persist across restarts.
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

3. Run:

```bash
npm run dev
```

## Architecture overview
- **Framework**
  - Next.js App Router (server components + route handlers), TypeScript, Tailwind CSS.
- **Backend (API routes)**
  - `GET /api/reviews/hostaway`
    - Loads mocked Hostaway data and returns normalized reviews + per-listing summaries.
    - Supports query params for filtering/sorting.
  - `GET /api/reviews/approved` and `POST /api/reviews/approved`
    - Stores manager approval state in **Vercel KV** (Upstash Redis) keyed per listing.
  - `GET /api/reviews/google` (optional)
    - Fetches Google Place Details (New) reviews and normalizes them.
- **Frontend**
  - `/dashboard` provides a filter bar, listing overview cards, and a reviews table with approval toggles.
  - `/properties/[listingId]` renders a Flex-style listing page layout and shows only approved reviews.
- **Storage**
  - `src/data/hostaway-reviews.mock.json` for mocked review input.
  - Approvals are stored in KV as `approvals:listing:<listingId> => string[]`.

## Deployment note (why KV)
Serverless deployments (like Vercel) do not provide reliable writable filesystem persistence between invocations or across redeploys.
That means writing approvals to a JSON file will appear to work locally but will not consistently persist in production.
This project uses **Vercel KV** so that manager approvals persist across refreshes and redeploys.

## Review approval flow
- **Manager action (Dashboard)**
  - In the dashboard review table, a manager toggles `Approve` on a review.
- **Persistence**
  - The frontend calls `POST /api/reviews/approved` with `{ reviewId, listingId, approved }`.
  - The server updates KV key `approvals:listing:<listingId>`.
- **Public display (Property page)**
  - The property page reads `GET /api/reviews/approved?listingId=...`.
  - It then filters Hostaway reviews to **render only approved review IDs**.

## Data normalization choices
The UI works with a single, predictable review shape:

```ts
NormalizedReview = {
  id,
  listingId,
  listingName,
  channel,
  overallRating,      // normalized to 0–5
  categories: [{ category, rating }], // also normalized to 0–5
  publicReview,
  submittedAt
}
```

- **Rating scale**
  - Some inputs use 0–10 (or mixed scales). Ratings are normalized to **0–5** for consistent comparisons and UI.
- **Categories**
  - Hostaway category ratings are mapped into a flat array of `{ category, rating }` for rendering and aggregation.
- **Listing summaries**
  - `ListingSummary` is derived from normalized reviews (avg rating, count, category averages).

## Google Reviews findings
- **Feasibility**
  - Google reviews can be fetched via **Places API (New) Place Details** by requesting the `reviews` field using a field mask.
  - Endpoint implemented: `GET /api/reviews/google?placeId=...`.
- **Operational requirements**
  - Requires `GOOGLE_MAPS_API_KEY`.
  - Review availability depends on the place and Google’s response; some places return limited/no reviews.
- **Data differences vs Hostaway**
  - Google reviews provide an overall rating and text, but do not provide Hostaway-style per-category ratings.
- **Compliance**
  - When displaying Google reviews, you must respect Google’s attribution and display requirements (author attribution/source).

## AI tools used (explicit)
- **Cascade (agentic coding assistant)**
  - Used to navigate the codebase, implement API routes, normalize JSON, build UI wiring, and draft this documentation.
- **Web documentation lookup**
  - Used to confirm Google Places API (New) request/field mask patterns for fetching `reviews`.
