-- The ivfflat index on DocumentEmbedding.embedding was created directly in migration
-- 20260314180000_chat_rag_persistence but cannot be represented in schema.prisma because
-- the column type is Unsupported("vector(1536)"). This causes prisma migrate diff to
-- report schema drift and fail CI. Dropping it here so migration history matches schema.
--
-- Vector similarity search will fall back to a sequential scan. A proper HNSW/ivfflat
-- index can be re-introduced via a schema-managed approach when pgvector support matures.
DROP INDEX IF EXISTS "DocumentEmbedding_embedding_idx";
