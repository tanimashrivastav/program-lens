-- HNSW index for fast approximate nearest-neighbour search on chunk embeddings.
--
-- Why HNSW over IVFFlat?
--   - No training step required (IVFFlat needs a CLUSTER call after bulk inserts)
--   - Better recall at the same query speed
--   - Handles incremental inserts well — new chunks index themselves automatically
--
-- m=16        : edges per node in the graph (16 is the pgvector default, good for 1536-dim)
-- ef_construction=64 : search width during index build — higher = better recall, slower build
--
-- After applying this migration, queries using <=> will automatically use the index.

CREATE INDEX CONCURRENTLY IF NOT EXISTS chunks_embedding_hnsw_idx
ON chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
