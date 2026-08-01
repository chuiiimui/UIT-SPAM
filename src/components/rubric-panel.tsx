"use client";

import { RUBRIC_CODES, RUBRICS, type RubricCode } from "@/lib/map/rubrics";
import { saveRubricMarks, saveRubricStatus } from "@/lib/map/actions";
import { RubricFiles } from "@/components/rubric-files";
import { ActionForm } from "@/components/action-form";
import { StudentName } from "@/components/student-name-link";
import { Badge, Field, btnPrimary, btnSecondary, inputClass } from "@/components/ui";
import { useRouter } from "next/navigation";

type StudentRow = { id: number; fullName: string; uniqueId: string };
type StatusRow = {
  rubricCode: string;
  examinerName: string | null;
  status: string;
  slidesPath?: string | null;
  reportPath?: string | null;
};
type MarkRow = { studentId: number; rubricCode: string; marks: number };

export function RubricPanel({
  groupId,
  students,
  statuses,
  marks,
  canEvaluate,
  canUpload = false,
  linkProfiles = false,
  codes = RUBRIC_CODES as unknown as RubricCode[],
}: {
  groupId: number;
  students: StudentRow[];
  statuses: StatusRow[];
  marks: MarkRow[];
  canEvaluate: boolean;
  canUpload?: boolean;
  linkProfiles?: boolean;
  /** Subset of R1–R8 to render (timeline filter for students/mentors). */
  codes?: RubricCode[];
}) {
  const router = useRouter();
  const refresh = () => router.refresh();
  const statusMap = new Map(statuses.map((r) => [r.rubricCode, r]));
  const allowUpload = canUpload || canEvaluate;

  if (codes.length === 0) {
    return (
      <p className="m-0 text-sm text-muted">
        No rubrics are open on the project timeline yet. Check back after the admin opens the next
        window.
      </p>
    );
  }

  return (
    <div className="grid gap-5">
      {codes.map((code) => {
        const meta = RUBRICS[code];
        const status = statusMap.get(code);
        return (
          <div key={code} className="rounded-2xl border border-line bg-brand-mist/40 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="m-0 text-lg font-semibold">
                  {code} — {meta.title}
                </h3>
                <p className="mt-1 mb-0 text-xs text-muted">
                  Max {meta.maxMarks} marks
                  {meta.needsFiles ? " · Slides/report expected" : ""}
                </p>
              </div>
              <Badge tone={status?.status === "completed" ? "ok" : "warn"}>
                {status?.status === "completed" ? "Completed" : "Not completed"}
              </Badge>
            </div>

            <ul className="mt-0 mb-4 list-disc pl-5 text-sm text-ink-soft">
              {meta.criteria.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>

            {meta.needsFiles ? (
              <RubricFiles
                groupId={groupId}
                rubricCode={code}
                slidesPath={status?.slidesPath}
                reportPath={status?.reportPath}
                canUpload={allowUpload}
              />
            ) : null}

            {canEvaluate ? (
              <>
                <ActionForm
                  action={saveRubricStatus}
                  onSuccess={refresh}
                  className="mb-4 grid gap-2 md:grid-cols-3"
                >
                  {(ctx) => (
                    <>
                      <input type="hidden" name="groupId" value={groupId} />
                      <input type="hidden" name="rubricCode" value={code} />
                      <Field label="Examiner name">
                        <input
                          className={inputClass}
                          name="examinerName"
                          defaultValue={status?.examinerName ?? ""}
                        />
                      </Field>
                      <Field label="Status">
                        <select
                          className={inputClass}
                          name="status"
                          defaultValue={status?.status ?? "not_completed"}
                        >
                          <option value="not_completed">Not Completed</option>
                          <option value="completed">Completed</option>
                        </select>
                      </Field>
                      <div className="flex items-end">
                        <button
                          className={`${btnSecondary} mb-4 w-full`}
                          type="submit"
                          disabled={ctx.pending}
                        >
                          {ctx.pending ? "Saving…" : "Save status"}
                        </button>
                      </div>
                    </>
                  )}
                </ActionForm>

                <ActionForm action={saveRubricMarks} onSuccess={refresh}>
                  {(ctx) => (
                    <>
                      <input type="hidden" name="groupId" value={groupId} />
                      <input type="hidden" name="rubricCode" value={code} />
                      <div className="grid gap-3 md:grid-cols-2">
                        {students.map((s) => {
                          const existing = marks.find(
                            (m) => m.studentId === s.id && m.rubricCode === code,
                          );
                          return (
                            <Field
                              key={s.id}
                              label={
                                linkProfiles ? (
                                  <span>
                                    <StudentName
                                      studentId={s.id}
                                      name={s.fullName}
                                      link
                                      className="font-semibold text-brand no-underline hover:underline"
                                    />{" "}
                                    <span className="font-normal text-muted">({s.uniqueId})</span>
                                  </span>
                                ) : (
                                  `${s.fullName} (${s.uniqueId})`
                                )
                              }
                            >
                              <input
                                className={inputClass}
                                name={`marks_${s.id}`}
                                type="number"
                                min={0}
                                max={meta.maxMarks}
                                step={0.5}
                                defaultValue={existing?.marks ?? ""}
                                placeholder={`0–${meta.maxMarks}`}
                              />
                            </Field>
                          );
                        })}
                      </div>
                      <button className={btnPrimary} type="submit" disabled={ctx.pending}>
                        {ctx.pending ? "Saving…" : `Save ${code} scores`}
                      </button>
                    </>
                  )}
                </ActionForm>
              </>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {students.map((s) => {
                  const existing = marks.find(
                    (m) => m.studentId === s.id && m.rubricCode === code,
                  );
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
                    >
                      <StudentName
                        studentId={s.id}
                        name={s.fullName}
                        link={linkProfiles}
                        className={
                          linkProfiles
                            ? "font-semibold text-brand no-underline hover:underline"
                            : "font-semibold"
                        }
                      />
                      <div className="text-muted">
                        Score: {existing ? existing.marks : "—"} / {meta.maxMarks}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function RubricCatalog({
  codes = RUBRIC_CODES as unknown as RubricCode[],
}: {
  codes?: RubricCode[];
}) {
  if (codes.length === 0) {
    return (
      <p className="m-0 text-sm text-muted">
        Rubric details unlock with the project timeline set by admin.
      </p>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {codes.map((code) => {
        const meta = RUBRICS[code];
        return (
          <div key={code} className="rounded-2xl border border-line bg-white/80 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="m-0 text-base font-semibold">
                {code} — {meta.title}
              </h3>
              <Badge tone="info">{meta.maxMarks} marks</Badge>
            </div>
            <ul className="mb-0 mt-3 list-disc pl-5 text-sm text-ink-soft">
              {meta.criteria.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
