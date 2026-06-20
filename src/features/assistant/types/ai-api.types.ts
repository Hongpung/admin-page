import { z } from "zod";

export const aiUsageCheckResSchema = z.object({
  allowed: z.boolean(),
  used: z.number(),
  limit: z.number(),
  period: z.enum(["month"]),
  resetAt: z.string(),
});

export const aiContentBlockSchema = z
  .object({
    type: z.string(),
  })
  .passthrough();

export const aiContextMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.array(aiContentBlockSchema),
});

export const aiContextReservationSchema = z.object({
  id: z.string(),
  status: z.string(),
  date: z.string(),
  spaceName: z.string(),
});

export const aiAvailableCommandSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const aiDomainSnapshotSchema = z.object({
  reservations: z.array(aiContextReservationSchema),
  availableCommands: z.array(aiAvailableCommandSchema),
});

export const aiContextResSchema = z.object({
  messages: z.array(aiContextMessageSchema),
  domainSnapshot: aiDomainSnapshotSchema,
});

export const assistantRoomIdSchema = z.string().uuid();

export const createAiDraftReqSchema = z.object({
  adminId: z.string(),
  roomId: assistantRoomIdSchema,
  toolUseId: z.string(),
  toolName: z.string(),
  args: z.record(z.string(), z.unknown()),
  pendingAssistantContent: z.array(z.record(z.string(), z.unknown())),
  pendingUserMessage: z.string(),
});

export const createAiDraftResSchema = z.object({
  draftId: z.string(),
  status: z.literal("PENDING"),
  createdAt: z.string(),
  expiresAt: z.string(),
});

export const resolveAiDraftReqSchema = z.object({
  adminId: z.string(),
  roomId: assistantRoomIdSchema,
  decision: z.enum(["approve", "reject"]),
  editedArgs: z.record(z.string(), z.unknown()).optional(),
});

export const resolveAiDraftResSchema = z.object({
  draftId: z.string(),
  status: z.enum(["EXECUTED", "REJECTED"]),
  result: z.record(z.string(), z.unknown()).optional(),
  resolvedAt: z.string(),
});

export const resolveAiDraftConflictResSchema = z.object({
  error: z.literal("ALREADY_RESOLVED"),
  status: z.enum(["EXECUTED", "REJECTED"]),
});

export const aiTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.array(z.record(z.string(), z.unknown())),
});

export const createAssistantRoomResSchema = z.object({
  roomId: assistantRoomIdSchema,
});

export const saveAiTurnsReqSchema = z.object({
  adminId: z.string(),
  roomId: assistantRoomIdSchema,
  turns: z.array(aiTurnSchema),
});

export const saveAiTurnsResSchema = z.object({
  ok: z.boolean(),
  turnIds: z.array(z.string()),
});

export type AiUsageCheckRes = z.infer<typeof aiUsageCheckResSchema>;
export type AiContextRes = z.infer<typeof aiContextResSchema>;
export type CreateAiDraftReq = z.infer<typeof createAiDraftReqSchema>;
export type CreateAiDraftRes = z.infer<typeof createAiDraftResSchema>;
export type ResolveAiDraftReq = z.infer<typeof resolveAiDraftReqSchema>;
export type ResolveAiDraftRes = z.infer<typeof resolveAiDraftResSchema>;
export type ResolveAiDraftConflictRes = z.infer<
  typeof resolveAiDraftConflictResSchema
>;
export type SaveAiTurnsReq = z.infer<typeof saveAiTurnsReqSchema>;
export type SaveAiTurnsRes = z.infer<typeof saveAiTurnsResSchema>;
export type AiTurn = z.infer<typeof aiTurnSchema>;
