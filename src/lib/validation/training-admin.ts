import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));

export const courseInputSchema = z.object({
  courseCode: z.string().trim().min(1, "과정 코드를 입력해 주세요."),
  courseName: z.string().trim().min(1, "과정명을 입력해 주세요."),
  targetModel: optionalText,
  description: optionalText,
  validityMonths: z.number().int().positive().nullable().optional(),
  status: z.enum(["draft", "active", "archived"]),
  thresholdPercent: z.number().min(0).max(100),
});

export const sessionInputSchema = z.object({
  courseId: z.number().int().positive(),
  sessionNumber: z.number().int().positive(),
  startsAt: z.string().date(),
  endsAt: z.string().date(),
  location: optionalText,
  instructorName: optionalText,
  capacity: z.number().int().positive().nullable().optional(),
  status: z.enum(["planned", "open", "closed", "cancelled"]),
}).refine((value) => value.endsAt >= value.startsAt, {
  message: "종료일은 시작일 이후여야 합니다.",
  path: ["endsAt"],
});

export type CourseInput = z.input<typeof courseInputSchema>;
export type SessionInput = z.input<typeof sessionInputSchema>;

export function validateCourseInput(input: unknown) {
  return courseInputSchema.safeParse(input);
}

export function validateSessionInput(input: unknown) {
  return sessionInputSchema.safeParse(input);
}
