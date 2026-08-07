-- DevTrace AI schema for CockroachDB Cloud
-- Requires VECTOR type + C-SPANN vector indexes (CockroachDB 25.2+)

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug STRING NOT NULL UNIQUE,
  name STRING NOT NULL,
  description STRING,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS engineering_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title STRING NOT NULL,
  body STRING NOT NULL,
  memory_type STRING NOT NULL,
  source STRING NOT NULL DEFAULT 'manual',
  module_path STRING,
  tags STRING[] DEFAULT ARRAY[],
  embedding VECTOR(1024),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT engineering_memories_type_check CHECK (
    memory_type IN ('adr', 'incident', 'onboarding', 'feature', 'refactor', 'note')
  )
);

CREATE INDEX IF NOT EXISTS engineering_memories_project_idx
  ON engineering_memories (project_id);

CREATE INDEX IF NOT EXISTS engineering_memories_type_idx
  ON engineering_memories (project_id, memory_type);

CREATE INDEX IF NOT EXISTS engineering_memories_module_idx
  ON engineering_memories (project_id, module_path);

-- Distributed vector index (C-SPANN) optimized for cosine distance
CREATE VECTOR INDEX IF NOT EXISTS memories_embed_idx
  ON engineering_memories (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS impact_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code_path STRING NOT NULL,
  feature_name STRING NOT NULL,
  user_segment STRING,
  apis STRING[] DEFAULT ARRAY[],
  downstream STRING[] DEFAULT ARRAY[],
  severity_if_changed STRING NOT NULL DEFAULT 'medium',
  notes STRING,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT impact_links_severity_check CHECK (
    severity_if_changed IN ('low', 'medium', 'high', 'critical')
  )
);

CREATE INDEX IF NOT EXISTS impact_links_project_path_idx
  ON impact_links (project_id, code_path);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title STRING,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role STRING NOT NULL,
  content STRING NOT NULL,
  memory_ids UUID[] DEFAULT ARRAY[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT messages_role_check CHECK (role IN ('user', 'assistant', 'system'))
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx
  ON messages (conversation_id, created_at);
