"use client";

import { saveRubricDeadlines } from "@/lib/map/actions";
import { RUBRIC_CODES, RUBRICS, type RubricCode } from "@/lib/map/rubrics";
import { ActionForm } from "@/components/action-form";
import { Field, btnPrimary, inputClass } from "@/components/ui";

type ScheduleRow = {
  rubricCode: string;
  openAt: string;
  dueAt: string;
};

export function RubricTimelineForm({
  batchId,
  schedules,
}: {
  batchId: number;
  schedules: ScheduleRow[];
}) {
  const byCode = new Map(schedules.map((s) => [s.rubricCode, s]));

  return (
    <ActionForm action={saveRubricDeadlines}>
      {(ctx) => (
        <>
          <input type="hidden" name="batchId" value={batchId} />
          <div className="grid gap-4">
            {RUBRIC_CODES.map((code) => {
              const row = byCode.get(code);
              return (
                <TimelineRow
                  key={code}
                  code={code}
                  openAt={row?.openAt ?? ""}
                  dueAt={row?.dueAt ?? ""}
                />
              );
            })}
          </div>
          <button className={`${btnPrimary} mt-2`} type="submit" disabled={ctx.pending}>
            {ctx.pending ? "Saving…" : "Save full R1–R8 timeline"}
          </button>
        </>
      )}
    </ActionForm>
  );
}

function TimelineRow({
  code,
  openAt,
  dueAt,
}: {
  code: RubricCode;
  openAt: string;
  dueAt: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-brand-mist/40 p-4">
      <h3 className="m-0 text-base font-semibold">
        {code} — {RUBRICS[code].title}
      </h3>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <Field label="Opens (visible to students & mentors)">
          <input
            className={inputClass}
            type="datetime-local"
            name={`open_${code}`}
            defaultValue={openAt}
            required
          />
        </Field>
        <Field label="Due (end of this window)">
          <input
            className={inputClass}
            type="datetime-local"
            name={`due_${code}`}
            defaultValue={dueAt}
            required
          />
        </Field>
      </div>
    </div>
  );
}
