/** Supabase CLI-compatible contract for the v2 migration. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      employees: Table<{ employee_id: number; employee_number: number; name: string; birth_date: string | null; position: string | null; svc_team: string | null; hire_date: string | null; resign_date: string | null; status: "재직" | "휴직" | "퇴사"; email: string | null; created_at: string; updated_at: string }>;
      departments: Table<{ department_id: number; department_code: string; name: string; parent_department_id: number | null; is_active: boolean; created_at: string }>;
      employment_history: Table<{ employment_history_id: number; employee_id: number; department_id: number; position: string | null; start_date: string; end_date: string | null; reason: string | null; created_at: string }>;
      training_courses: Table<{ course_id: number; course_code: string; course_name: string; target_model: string | null; description: string | null; created_date: string; is_active: boolean; threshold_percent: number; status: "draft" | "active" | "archived"; validity_months: number | null; owner_user_id: string | null; created_at: string }>;
      training_sessions: Table<{ session_id: number; course_id: number; session_number: number; starts_at: string; ends_at: string; location: string | null; instructor_name: string | null; status: "planned" | "open" | "closed" | "cancelled"; capacity: number | null; created_by: string | null; created_at: string }>;
      session_participants: Table<{ session_id: number; employee_id: number; registered_at: string; registered_by: string | null }>;
      course_completions: Table<{ completion_id: number; session_id: number; employee_id: number; status: "completed" | "failed" | "absent" | "cancelled"; completion_date: string | null; score: number | null; note: string | null; cancelled_at: string | null; cancellation_reason: string | null; created_by: string | null; created_at: string }>;
      competency_tags: Table<{ competency_tag_id: number; tag: string; description: string | null; created_at: string }>;
      course_competency_tags: Table<{ course_id: number; competency_tag_id: number }>;
      course_prerequisites: Table<{ course_id: number; prerequisite_course_id: number }>;
      eligibility_rule_groups: Table<{ rule_group_id: number; course_id: number; name: string; match_all: boolean; created_at: string }>;
      eligibility_rules: Table<{ rule_id: number; rule_group_id: number; field: string; operator: string; value: string }>;
      eligibility_employee_exceptions: Table<{ rule_group_id: number; employee_id: number; is_included: boolean; reason: string | null }>;
      import_batches: Table<{ import_batch_id: number; session_id: number; file_name: string; row_count: number; accepted_count: number; rejected_count: number; status: string; created_by: string | null; created_at: string }>;
      import_rows: Table<{ import_row_id: number; import_batch_id: number; row_number: number; employee_number: number | null; raw_data: Json; normalized_data: Json | null; error_code: string | null; error_message: string | null }>;
      user_role_scopes: Table<{ scope_id: number; user_id: string; role: string; employee_id: number | null; department_id: number | null; course_id: number | null; created_at: string }>;
      audit_logs: Table<{ audit_log_id: number; actor_user_id: string | null; action: string; entity_name: string; entity_id: string | null; before_data: Json | null; after_data: Json | null; created_at: string }>;
      metric_snapshots: Table<{ metric_snapshot_id: number; snapshot_date: string; course_id: number | null; department_id: number | null; target_count: number; completed_count: number; completion_rate: number; created_at: string }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { employment_status: "active" | "leave" | "resigned"; course_status: "draft" | "active" | "archived"; session_status: "planned" | "open" | "closed" | "cancelled"; completion_status: "completed" | "failed" | "absent" | "cancelled"; rule_field: "department" | "position" | "employment_status" | "competency_tag"; rule_operator: "equals" | "not_equals" | "contains" | "in" };
    CompositeTypes: Record<string, never>;
  };
};
