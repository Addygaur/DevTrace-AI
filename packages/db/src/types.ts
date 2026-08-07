export type MemoryType =
  | "adr"
  | "incident"
  | "onboarding"
  | "feature"
  | "refactor"
  | "note";

export type Severity = "low" | "medium" | "high" | "critical";

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_at: Date;
}

export interface EngineeringMemory {
  id: string;
  project_id: string;
  title: string;
  body: string;
  memory_type: MemoryType;
  source: string;
  module_path: string | null;
  tags: string[];
  created_at: Date;
  updated_at: Date;
  distance?: number;
}

export interface ImpactLink {
  id: string;
  project_id: string;
  code_path: string;
  feature_name: string;
  user_segment: string | null;
  apis: string[];
  downstream: string[];
  severity_if_changed: Severity;
  notes: string | null;
  created_at: Date;
}

export interface CreateMemoryInput {
  projectId: string;
  title: string;
  body: string;
  memoryType: MemoryType;
  source?: string;
  modulePath?: string | null;
  tags?: string[];
  embedding: number[];
}
