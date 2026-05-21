import { z } from "zod";
import type { Tool } from "@chadlabs/core";

export const SlaClockCheckInputSchema = z.object({
  denial_received_at: z.string().min(1),
  sla_kind: z.enum(["standard_7day", "expedited_72hour", "post_service_30day"]),
});

export type SlaClockCheckInput = z.infer<typeof SlaClockCheckInputSchema>;

const SLA_HOURS: Record<SlaClockCheckInput["sla_kind"], number> = {
  standard_7day: 7 * 24,
  expedited_72hour: 72,
  post_service_30day: 30 * 24,
};

export interface SlaClockResult {
  sla_kind: string;
  denial_received_at: string;
  deadline: string;
  hours_remaining: number;
  status: "fresh" | "warning" | "overdue";
}

export function checkSlaClock(
  denial_received_at: string,
  sla_kind: SlaClockCheckInput["sla_kind"]
): SlaClockResult {
  const windowHours = SLA_HOURS[sla_kind];
  const receivedMs = new Date(denial_received_at).getTime();
  const deadlineMs = receivedMs + windowHours * 60 * 60 * 1000;
  const nowMs = Date.now();
  const hours_remaining = (deadlineMs - nowMs) / (60 * 60 * 1000);
  const deadline = new Date(deadlineMs).toISOString();

  let status: SlaClockResult["status"];
  if (hours_remaining > 48) {
    status = "fresh";
  } else if (hours_remaining > 0) {
    status = "warning";
  } else {
    status = "overdue";
  }

  return { sla_kind, denial_received_at, deadline, hours_remaining, status };
}

async function slaClockCheckHandler(args: SlaClockCheckInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const result = checkSlaClock(args.denial_received_at, args.sla_kind);
  return {
    content: [{ type: "text", text: JSON.stringify(result) }],
  };
}

export const slaClockCheckTool: Tool<SlaClockCheckInput> = {
  name: "sla_clock_check",
  description:
    "Pure-function SLA deadline calculator. Given denial_received_at (ISO datetime) and sla_kind (standard_7day=168h, expedited_72hour=72h, post_service_30day=720h), returns deadline, hours_remaining, and status (fresh >48h / warning 0–48h / overdue ≤0h). No DB write.",
  inputSchema: SlaClockCheckInputSchema,
  handler: slaClockCheckHandler,
};
