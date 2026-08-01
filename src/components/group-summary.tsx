"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProjectSummary } from "@/lib/map/actions";
import { StudentName } from "@/components/student-name-link";
import { btnPrimary, btnSecondary, inputClass } from "@/components/ui";

export type GroupSummaryData = {
  groupId: number;
  groupCode: string;
  projectTitle: string;
  projectAbout: string;
  domain: string;
  objectives: string;
  techStack: string;
  status: string;
  batchLabel: string;
  mentorName: string | null;
  members: { id: number; fullName: string; uniqueId: string; isLeader: boolean }[];
  weeksLogged: number;
  rubricsCompleted: number;
  totalRubrics: number;
  linkProfiles?: boolean;
};

export function GroupSummaryButton({
  data,
  canEdit,
  initiallyOpen = false,
}: {
  data: GroupSummaryData;
  canEdit: boolean;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setEditing(false);
        setError(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function onSave(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const res = await saveProjectSummary(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[rgba(51,77,147,0.28)] bg-white px-3.5 py-2 text-sm font-semibold text-brand-deep shadow-sm transition hover:border-brand hover:bg-brand-mist"
      >
        Project summary
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(26,36,64,0.45)] p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="group-summary-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
              setEditing(false);
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-white p-5 shadow-[0_24px_60px_rgba(36,55,113,0.22)] sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-brand/70">
                  Group summary
                </p>
                <h2
                  id="group-summary-title"
                  className="m-0 mt-1 break-words font-[family-name:var(--font-display)] text-xl text-brand-deep sm:text-2xl"
                >
                  {data.projectTitle}
                </h2>
                <p className="mt-1 mb-0 text-sm text-muted">
                  {data.groupCode} · {data.batchLabel} · {data.status.replaceAll("_", " ")}
                </p>
              </div>
              <button
                type="button"
                className={`${btnSecondary} !min-h-9 !px-3 !py-2 !text-xs`}
                onClick={() => {
                  setOpen(false);
                  setEditing(false);
                }}
              >
                Close
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Members", String(data.members.length)],
                ["Mentor", data.mentorName || "Not assigned"],
                ["Weeks logged", `${data.weeksLogged}/8`],
                ["Rubrics", `${data.rubricsCompleted}/${data.totalRubrics}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-line bg-brand-mist/50 px-3 py-2.5">
                  <div className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted">
                    {label}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-ink">{value}</div>
                </div>
              ))}
            </div>

            {!editing ? (
              <div className="space-y-4 text-sm">
                <SummaryBlock
                  title="About the project"
                  body={data.projectAbout || "No project description added yet."}
                />
                <SummaryBlock title="Domain" body={data.domain || "—"} />
                <SummaryBlock title="Objectives" body={data.objectives || "—"} />
                <SummaryBlock title="Tech stack" body={data.techStack || "—"} />
                <div>
                  <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">
                    Team
                  </h3>
                  <ul className="mt-2 mb-0 list-none space-y-1.5 p-0">
                    {data.members.map((m) => (
                      <li
                        key={m.uniqueId}
                        className="rounded-lg border border-line bg-white px-3 py-2 text-ink"
                      >
                        <StudentName
                          studentId={m.id}
                          name={m.fullName}
                          link={data.linkProfiles}
                          className={
                            data.linkProfiles
                              ? "font-semibold text-brand no-underline hover:underline"
                              : "font-semibold"
                          }
                        />
                        <span className="text-muted">
                          {" "}
                          · {m.uniqueId}
                          {m.isLeader ? " · Leader" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {canEdit ? (
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => setEditing(true)}
                  >
                    Edit summary
                  </button>
                ) : null}
              </div>
            ) : (
              <form
                className="space-y-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  onSave(new FormData(e.currentTarget));
                }}
              >
                {error ? (
                  <div className="mb-3 rounded-xl border border-[rgba(214,32,39,0.25)] bg-[#fee4e2] px-4 py-3 text-sm font-medium text-danger">
                    {error}
                  </div>
                ) : null}
                <input type="hidden" name="groupId" value={data.groupId} />
                <label className="mb-3 block">
                  <span className="mb-1.5 block text-[0.82rem] font-semibold text-ink-soft">
                    Project title
                  </span>
                  <input
                    className={inputClass}
                    name="projectTitle"
                    required
                    defaultValue={data.projectTitle}
                  />
                </label>
                <label className="mb-3 block">
                  <span className="mb-1.5 block text-[0.82rem] font-semibold text-ink-soft">
                    About the project
                  </span>
                  <textarea
                    className={inputClass}
                    name="projectAbout"
                    rows={4}
                    defaultValue={data.projectAbout}
                    placeholder="What problem does this project solve? Who is it for?"
                  />
                </label>
                <label className="mb-3 block">
                  <span className="mb-1.5 block text-[0.82rem] font-semibold text-ink-soft">
                    Domain
                  </span>
                  <input
                    className={inputClass}
                    name="domain"
                    defaultValue={data.domain}
                    placeholder="e.g. Computer Vision, EdTech, FinTech"
                  />
                </label>
                <label className="mb-3 block">
                  <span className="mb-1.5 block text-[0.82rem] font-semibold text-ink-soft">
                    Objectives
                  </span>
                  <textarea
                    className={inputClass}
                    name="objectives"
                    rows={3}
                    defaultValue={data.objectives}
                    placeholder="Key goals of the project"
                  />
                </label>
                <label className="mb-4 block">
                  <span className="mb-1.5 block text-[0.82rem] font-semibold text-ink-soft">
                    Tech stack
                  </span>
                  <input
                    className={inputClass}
                    name="techStack"
                    defaultValue={data.techStack}
                    placeholder="e.g. Next.js, Python, OpenCV, PostgreSQL"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button className={btnPrimary} type="submit" disabled={pending}>
                    {pending ? "Saving…" : "Save summary"}
                  </button>
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => setEditing(false)}
                    disabled={pending}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function SummaryBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <p className="mt-1.5 mb-0 whitespace-pre-wrap leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
