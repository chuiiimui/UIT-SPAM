"use client";

import {
  cancelInvite,
  evaluateWeekly,
  saveWeeklySummary,
  submitGroupForAdmin,
  updateProjectTitle,
} from "@/lib/map/actions";
import { ActionForm } from "@/components/action-form";
import { Field, btnPrimary, btnSecondary, inputClass } from "@/components/ui";
import { useRouter } from "next/navigation";

export function CancelInviteButton({ inviteId }: { inviteId: number }) {
  const router = useRouter();
  return (
    <ActionForm action={cancelInvite} onSuccess={() => router.refresh()}>
      {(ctx) => (
        <>
          <input type="hidden" name="inviteId" value={inviteId} />
          <button className={btnSecondary} type="submit" disabled={ctx.pending}>
            {ctx.pending ? "Cancelling…" : "Cancel invite"}
          </button>
        </>
      )}
    </ActionForm>
  );
}

export function SubmitGroupButton({ groupId }: { groupId: number }) {
  const router = useRouter();
  return (
    <ActionForm action={submitGroupForAdmin} onSuccess={() => router.refresh()}>
      {(ctx) => (
        <>
          <input type="hidden" name="groupId" value={groupId} />
          <button className={btnPrimary} type="submit" disabled={ctx.pending}>
            {ctx.pending ? "Submitting…" : "Submit group for admin approval"}
          </button>
        </>
      )}
    </ActionForm>
  );
}

export function ProjectTitleForm({
  groupId,
  projectTitle,
}: {
  groupId: number;
  projectTitle: string;
}) {
  const router = useRouter();
  return (
    <ActionForm
      action={updateProjectTitle}
      onSuccess={() => router.refresh()}
      className="mb-4"
    >
      {(ctx) => (
        <div className="flex flex-wrap items-start gap-2">
          <input type="hidden" name="groupId" value={groupId} />
          <input
            className={`${inputClass} max-w-xl flex-1`}
            name="projectTitle"
            defaultValue={projectTitle}
            required
          />
          <button className={btnSecondary} type="submit" disabled={ctx.pending}>
            {ctx.pending ? "Saving…" : "Save title"}
          </button>
        </div>
      )}
    </ActionForm>
  );
}

export function WeeklySummaryForm({
  groupId,
  weekNumber,
  summary,
}: {
  groupId: number;
  weekNumber: number;
  summary: string;
}) {
  const router = useRouter();
  return (
    <ActionForm action={saveWeeklySummary} onSuccess={() => router.refresh()} className="mb-3">
      {(ctx) => (
        <>
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="weekNumber" value={weekNumber} />
          <Field label="Weekly summary">
            <textarea
              className={inputClass}
              name="summary"
              rows={3}
              defaultValue={summary}
              placeholder="What did the group complete this week?"
            />
          </Field>
          <button className={btnPrimary} type="submit" disabled={ctx.pending}>
            {ctx.pending ? "Saving…" : `Save week ${weekNumber}`}
          </button>
        </>
      )}
    </ActionForm>
  );
}

export function WeeklyEvalForm({
  groupId,
  weekNumber,
  performance,
}: {
  groupId: number;
  weekNumber: number;
  performance: string;
}) {
  const router = useRouter();
  return (
    <ActionForm
      action={evaluateWeekly}
      onSuccess={() => router.refresh()}
      className="mt-3"
    >
      {(ctx) => (
        <div className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="weekNumber" value={weekNumber} />
          <div className="min-w-[200px] flex-1">
            <Field label="Performance">
              <select className={inputClass} name="performance" defaultValue={performance}>
                <option value="">Select…</option>
                <option value="satisfactory">Satisfactory</option>
                <option value="unsatisfactory">Unsatisfactory</option>
              </select>
            </Field>
          </div>
          <button className={btnSecondary} type="submit" disabled={ctx.pending}>
            {ctx.pending ? "Saving…" : "Save evaluation"}
          </button>
        </div>
      )}
    </ActionForm>
  );
}
