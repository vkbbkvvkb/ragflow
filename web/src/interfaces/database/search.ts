export interface PromptConfig {
  system: string;
}

export interface ISetting {
  create_date: string;
  create_time: number;
  id: string;
  llm_id: string;
  llm_setting: Variable;
  llm_setting_type: string;
  prompt_config: PromptConfig;
  tenant_id: string;
  update_date: string;
  update_time: number;
  vector_similarity_weight: number;
  similarity_threshold: number;
}
