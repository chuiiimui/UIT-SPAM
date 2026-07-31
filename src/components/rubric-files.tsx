"use client";

import { deleteRubricFile, uploadRubricFile } from "@/lib/map/actions";
import { ActionForm } from "@/components/action-form";
import { btnPrimary, btnSecondary, inputClass } from "@/components/ui";
import { useRouter } from "next/navigation";

export function RubricFiles({
  groupId,
  rubricCode,
  slidesPath,
  reportPath,
  canUpload,
}: {
  groupId: number;
  rubricCode: string;
  slidesPath: string | null | undefined;
  reportPath: string | null | undefined;
  canUpload: boolean;
}) {
  const router = useRouter();
  const refresh = () => router.refresh();

  return (
    <div className="mb-4 grid gap-3 rounded-xl border border-line bg-white/80 p-3 sm:grid-cols-2">
      <FileSlot
        label="Presentation slides"
        kind="slides"
        groupId={groupId}
        rubricCode={rubricCode}
        filePath={slidesPath}
        canUpload={canUpload}
        onDone={refresh}
      />
      <FileSlot
        label="Report"
        kind="report"
        groupId={groupId}
        rubricCode={rubricCode}
        filePath={reportPath}
        canUpload={canUpload}
        onDone={refresh}
      />
    </div>
  );
}

function FileSlot({
  label,
  kind,
  groupId,
  rubricCode,
  filePath,
  canUpload,
  onDone,
}: {
  label: string;
  kind: "slides" | "report";
  groupId: number;
  rubricCode: string;
  filePath: string | null | undefined;
  canUpload: boolean;
  onDone: () => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
      {filePath ? (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
          <a href={filePath} target="_blank" rel="noreferrer" className="font-semibold text-brand">
            View uploaded file
          </a>
          {canUpload ? (
            <ActionForm action={deleteRubricFile} onSuccess={onDone}>
              {(ctx) => (
                <>
                  <input type="hidden" name="groupId" value={groupId} />
                  <input type="hidden" name="rubricCode" value={rubricCode} />
                  <input type="hidden" name="kind" value={kind} />
                  <button
                    type="submit"
                    className={`${btnSecondary} !min-h-8 !px-2 !py-1 !text-xs`}
                    disabled={ctx.pending}
                  >
                    {ctx.pending ? "Removing…" : "Remove"}
                  </button>
                </>
              )}
            </ActionForm>
          ) : null}
        </div>
      ) : (
        <p className="mb-2 text-sm text-muted">No file uploaded yet.</p>
      )}
      {canUpload ? (
        <ActionForm action={uploadRubricFile} onSuccess={onDone} className="space-y-2">
          {(ctx) => (
            <>
              <input type="hidden" name="groupId" value={groupId} />
              <input type="hidden" name="rubricCode" value={rubricCode} />
              <input type="hidden" name="kind" value={kind} />
              <input className={inputClass} type="file" name="file" required />
              <button
                type="submit"
                className={`${btnPrimary} !min-h-9 !py-2 !text-xs`}
                disabled={ctx.pending}
              >
                {ctx.pending ? "Uploading…" : `Upload ${kind}`}
              </button>
            </>
          )}
        </ActionForm>
      ) : null}
    </div>
  );
}
