# ProgramLens

AI-powered graduate program research tool. Paste a program URL, get structured data and ask questions in plain English.

---

## What it does

1. **Ingest** — paste any graduate program URL. A multi-page crawler scrapes up to 10 linked pages, chunks the text, embeds every chunk with OpenAI, and stores them in pgvector.
2. **Extract** — Claude reads the raw text and extracts structured fields: tuition, deadlines, location, duration, salary data, top employers.
3. **Chat** — ask anything about a program. A RAG pipeline retrieves the most relevant chunks via cosine similarity search, builds a grounded system prompt, and streams Claude's response.
4. **Compare** — select 2–3 programs for a side-by-side breakdown plus an AI-generated tradeoff summary.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router | Server components + route handlers in one repo |
| Database | Neon (serverless Postgres) | HTTP driver works in edge/serverless — no persistent TCP connections |
| ORM | Drizzle | Type-safe SQL, lightweight, migrations as plain SQL |
| Vector search | pgvector + HNSW index | Cosine similarity search directly in Postgres — no separate vector DB |
| Embeddings | OpenAI `text-embedding-3-small` | 1536-dim, cheap, fast |
| LLM | Anthropic Claude via Vercel AI SDK | `generateObject` for structured extraction, `streamText` for chat |
| Scraping | Cheerio + custom multi-page crawler | Follows internal links up to depth 2, max 10 pages |
| Chunking | `RecursiveCharacterTextSplitter` | 2000 char chunks, 200 char overlap — balances context and retrieval precision |
| Styling | Tailwind CSS v4 + shadcn/ui | OKLCH color tokens, dark theme |

---

## Architecture

```
User pastes URL
      │
      ▼
POST /api/ingest
      │
      ├─ web-scraper.ts       — crawls up to 10 pages (depth 2)
      ├─ text-chunker.ts      — splits into 2000-char chunks with overlap
      ├─ text-embedder.ts     — batch embeds with text-embedding-3-small
      ├─ extraction-service.ts — Claude extracts 12 structured fields
      ├─ slug.ts              — generates readable URL slug
      └─ DB insert            — programs + chunks tables (pgvector)

User asks a question
      │
      ▼
POST /api/chat
      │
      ├─ embedQuery()         — embed the user's question
      ├─ retrieveChunks()     — cosine similarity search via pgvector HNSW
      ├─ buildSystemPrompt()  — inject top-6 chunks as numbered sources
      └─ streamText()         — stream Claude's grounded response
```

---

## RAG pipeline detail

**Chunking strategy:** `RecursiveCharacterTextSplitter` with `chunkSize: 2000` and `overlap: 200`. Overlap prevents context loss at chunk boundaries — a sentence about a deadline won't be split across two chunks with no shared context.

**Embedding model:** `text-embedding-3-small` (1536 dimensions). Chosen for cost efficiency — at ~$0.02 per million tokens, embedding 54 chunks costs fractions of a cent.

**Vector index:** HNSW (`m=16, ef_construction=64`) on the `embedding` column. HNSW builds a navigable small-world graph that finds approximate nearest neighbours in `O(log n)` time without a training step, unlike IVFFlat.

**Retrieval:** Top-6 chunks ranked by cosine similarity (`1 - <=>` operator). The threshold isn't hard-filtered — all 6 are passed regardless of score, since the LLM handles irrelevance gracefully.

**Grounding:** The system prompt explicitly instructs Claude to answer only from the provided context and say so clearly if the answer isn't there. This prevents hallucination of program details.

---

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
cp .env.example .env.local
# Fill in: DATABASE_URL, OPENAI_API_KEY, ANTHROPIC_API_KEY

# 3. Enable pgvector in your Neon database
# Run in the Neon SQL console:
CREATE EXTENSION IF NOT EXISTS vector;

# 4. Run migrations
npm run db:migrate

# 5. Apply the HNSW index
# Run directly in the Neon SQL console (CONCURRENTLY not supported in migration runners):
# See src/lib/db/migrations/0004_hnsw_index.sql

# 6. Start the dev server
npm run dev
```

---

## Project structure

```
src/
├── app/
│   ├── (dashboard)/page.tsx      # Home — hero, how it works, program grid
│   ├── programs/[slug]/page.tsx  # Program detail — stats + RAG chat
│   ├── compare/page.tsx          # Compare 2–3 programs side by side
│   └── api/
│       ├── ingest/route.ts       # POST — trigger ingestion pipeline
│       ├── programs/route.ts     # GET  — list all programs
│       ├── programs/[slug]/      # GET / DELETE — single program
│       ├── chat/route.ts         # POST — streaming RAG chat
│       └── compare/route.ts      # GET / POST — compare programs
├── components/
│   ├── nav.tsx
│   └── programs/
│       ├── program-card.tsx      # Card with live status polling
│       ├── program-grid.tsx      # Server component grid
│       ├── ingest-form.tsx       # URL submission form
│       └── chat-panel.tsx        # Streaming chat UI
└── lib/
    ├── db/
    │   ├── schema.ts             # Drizzle schema — programs, chunks, tuition, faculty, courses
    │   └── migrations/           # SQL migrations including HNSW index
    ├── ingestion/
    │   ├── web-scraper.ts        # Multi-page Cheerio crawler
    │   ├── text-chunker.ts       # RecursiveCharacterTextSplitter
    │   └── text-embedder.ts      # OpenAI embeddings (batch + single)
    └── services/
        ├── ingest-service.ts     # Pipeline orchestrator
        ├── extraction-service.ts # Claude structured extraction via generateObject
        ├── program-service.ts    # CRUD for programs
        ├── chunk-retriever.ts    # pgvector cosine similarity search
        ├── chat-prompt-builder.ts# RAG system prompt construction
        └── compare-service.ts    # Multi-program comparison + AI summary
```

---

## Key decisions

**Single repo (Next.js fullstack) over separate frontend/backend**
Route handlers and server components share the same DB client and service layer with zero network overhead. For a portfolio project this keeps the codebase readable and the deployment simple.

**Neon HTTP driver over TCP**
Serverless functions have no persistent connections. Neon's HTTP driver wraps every query in an HTTPS request — no connection pool needed, works in any serverless environment.

**`generateObject` for extraction, `streamText` for chat**
Extraction needs a guaranteed JSON shape — `generateObject` enforces the Zod schema at the SDK level and retries on malformed output. Chat needs low latency first-token — `streamText` pipes chunks to the client as they arrive.

**Metadata in `jsonb`, not dedicated columns**
Extracted fields vary by program type. Storing them in a `metadata: jsonb` column keeps the schema stable while allowing per-program variation. Strongly-typed fields (name, university, degree) are promoted to real columns for indexing and filtering.

**HNSW over IVFFlat for vector search**
IVFFlat requires a training step (`CLUSTER`) after bulk inserts and degrades without periodic retraining. HNSW indexes new rows automatically on insert — better fit for a dataset that grows one program at a time.
