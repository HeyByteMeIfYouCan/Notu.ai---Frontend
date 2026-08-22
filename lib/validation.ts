import { z } from "zod";

// Base Enums
export const TaskStatusSchema = z.enum(["todo", "in-progress", "done"]);
export const TaskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const MeetingStatusSchema = z.enum(["pending", "processing", "completed", "failed"]);
export const MeetingTypeSchema = z.enum(["upload", "online", "realtime"]);
export const CollaboratorRoleSchema = z.enum(["owner", "editor", "viewer"]);
export const BoardSourceSchema = z.enum(["manual", "ai"]);

// User Schema
export const UserSchema = z.object({
    _id: z.string(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    image: z.string().optional(),
    plan: z.enum(["free", "pro", "enterprise"]),
});

// Task Schemas
export const CreateTaskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    status: TaskStatusSchema.optional().default("todo"),
    priority: TaskPrioritySchema.optional().default("medium"),
    dueDate: z.string().optional(), // ISO date string
    assignee: z.string().optional(), // User ID
    labels: z.array(z.string()).optional(),
    meetingId: z.string().optional(),
    boardId: z.string().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
    order: z.number().optional(),
});

// Board Schemas
export const LabelSchema = z.object({
    name: z.string().min(1, "Label name is required"),
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color hex"),
});

export const CreateBoardSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    source: BoardSourceSchema.optional(),
});

export const UpdateBoardSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().optional(),
    labels: z.array(LabelSchema).optional(),
});

// Meeting Schemas
export const CreateMeetingSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    type: MeetingTypeSchema,
    platform: z.string().optional(),
    meetingLink: z.string().url("Invalid meeting URL").optional().or(z.literal("")),
    scheduledAt: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

export const UpdateMeetingSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
});

// Collaborator Schema
export const AddCollaboratorSchema = z.object({
    email: z.string().email("Invalid email address"),
    role: CollaboratorRoleSchema.default("viewer"),
});

// Types inferred from Zod schemas
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type CreateBoardInput = z.infer<typeof CreateBoardSchema>;
export type UpdateBoardInput = z.infer<typeof UpdateBoardSchema>;
export type CreateMeetingInput = z.infer<typeof CreateMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof UpdateMeetingSchema>;
