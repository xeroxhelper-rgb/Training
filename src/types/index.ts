import type { Database } from "./database";

export type Employee = Database["public"]["Tables"]["employees"]["Row"];
export type TrainingCourse = Database["public"]["Tables"]["training_courses"]["Row"];
export type EmployeeStatus = Employee["status"];
export type CareerHistory = { history_id: number; employee_id: number; svc_team: string | null; position: string | null; start_date: string; end_date: string | null; reason: string | null };
export type Certification = { cert_id: number; employee_id: number; cert_name: string; acquired_date: string | null; expiry_date: string | null };
export type Award = { award_id: number; employee_id: number; award_name: string; award_date: string | null; description: string | null };
export type TrainingTarget = { target_id: number; course_id: number; employee_id: number; assigned_date: string };
export type TrainingCompletion = { completion_id: number; course_id: number; employee_id: number; completion_date: string; score: number | null };
export type EmailLog = { log_id: number; course_id: number | null; recipient_ids: number[]; subject: string | null; body: string | null; status: "초안" | "발송완료"; created_date: string };
export type CourseCompletionRate = { course_id: number; course_name: string; target_model: string | null; is_active: boolean; threshold_percent: number; target_count: number; completed_count: number; completion_rate: number };
export type TeamCompletionRate = { svc_team: string; total_targets: number; total_completed: number; completion_rate: number };
export type TeamCertRate = { svc_team: string; team_count: number; cert_holder_count: number; cert_holding_rate: number };
export type IncompleteAlertRow = { course_id: number; course_name: string; target_model: string | null; completion_rate: number; threshold_percent: number; employee_id: number; employee_name: string; svc_team: string | null };
