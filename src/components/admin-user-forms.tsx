"use client";

import {
  adminCreateFaculty,
  adminCreateStudent,
  adminResetPassword,
  bulkImportStudents,
} from "@/lib/map/actions";
import { ActionForm } from "@/components/action-form";
import { Field, btnPrimary, btnSecondary, inputClass } from "@/components/ui";
import { useRouter } from "next/navigation";

export function CreateStudentForm({
  batches,
}: {
  batches: { id: number; label: string }[];
}) {
  const router = useRouter();
  return (
    <ActionForm
      action={adminCreateStudent}
      onSuccess={() => router.refresh()}
      className="grid gap-1 md:grid-cols-2"
    >
      {(ctx) => (
        <>
          <Field label="AKTU roll (Unique Id)">
            <input className={inputClass} name="uniqueId" required placeholder="2102840100123" />
          </Field>
          <Field label="Full name">
            <input className={inputClass} name="fullName" required />
          </Field>
          <Field label="Batch">
            <select className={inputClass} name="batchId" required defaultValue={batches[0]?.id}>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Temp password">
            <input className={inputClass} name="password" defaultValue="password123" />
          </Field>
          <div className="md:col-span-2">
            <button className={btnPrimary} type="submit" disabled={ctx.pending}>
              {ctx.pending ? "Creating…" : "Create student"}
            </button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function CreateFacultyForm() {
  const router = useRouter();
  return (
    <ActionForm
      action={adminCreateFaculty}
      onSuccess={() => router.refresh()}
      className="grid gap-1 md:grid-cols-2"
    >
      {(ctx) => (
        <>
          <Field label="Unique Id">
            <input className={inputClass} name="uniqueId" required placeholder="faculty21" />
          </Field>
          <Field label="Full name">
            <input className={inputClass} name="fullName" required />
          </Field>
          <Field label="Department">
            <input className={inputClass} name="department" defaultValue="CSE" />
          </Field>
          <Field label="Temp password">
            <input className={inputClass} name="password" defaultValue="password123" />
          </Field>
          <div className="md:col-span-2">
            <button className={btnPrimary} type="submit" disabled={ctx.pending}>
              {ctx.pending ? "Creating…" : "Create faculty"}
            </button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function ResetPasswordForm({
  role,
  targetId,
}: {
  role: "student" | "faculty";
  targetId: number;
}) {
  return (
    <ActionForm action={adminResetPassword} className="flex flex-wrap items-center gap-2">
      {(ctx) => (
        <>
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="targetId" value={targetId} />
          <input
            className={`${inputClass} !mb-0 max-w-[140px] !py-2 text-xs`}
            name="newPassword"
            defaultValue="password123"
            aria-label="New password"
          />
          <button
            className={`${btnSecondary} !min-h-9 !px-2.5 !py-1.5 !text-xs`}
            type="submit"
            disabled={ctx.pending}
          >
            {ctx.pending ? "…" : "Reset pwd"}
          </button>
        </>
      )}
    </ActionForm>
  );
}

export function BulkImportForm({
  batches,
}: {
  batches: { id: number; label: string }[];
}) {
  const router = useRouter();
  return (
    <ActionForm action={bulkImportStudents} onSuccess={() => router.refresh()} className="grid gap-1">
      {(ctx) => (
        <>
          <Field label="Batch">
            <select className={inputClass} name="batchId" required defaultValue={batches[0]?.id}>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Default password for new accounts">
            <input className={inputClass} name="defaultPassword" defaultValue="password123" />
          </Field>
          <Field label="Upload CSV file">
            <input className={inputClass} type="file" name="csvFile" accept=".csv,text/csv" />
          </Field>
          <Field label="Or paste CSV">
            <textarea
              className={inputClass}
              name="csvText"
              rows={8}
              placeholder={"uniqueId,fullName,email,phone\n2102840100201,Ada Lovelace,ada@student.uit.ac.in,9876543210"}
            />
          </Field>
          <button className={btnPrimary} type="submit" disabled={ctx.pending}>
            {ctx.pending ? "Importing…" : "Import students"}
          </button>
        </>
      )}
    </ActionForm>
  );
}
