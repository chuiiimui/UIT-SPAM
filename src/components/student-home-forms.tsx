"use client";

import { createGroup, respondToInvite, saveBiodata } from "@/lib/map/actions";
import { ActionForm } from "@/components/action-form";
import { Field, btnPrimary, btnSecondary, inputClass } from "@/components/ui";

export function BiodataForm({
  defaults,
  uniqueId,
}: {
  uniqueId: string;
  defaults: {
    fullName: string;
    email: string;
    phone: string;
    department: string;
    branch: string;
    section: string;
    semester: string;
    bioNote: string;
  };
}) {
  return (
    <ActionForm action={saveBiodata}>
      {(ctx) => (
        <div className="grid gap-1 md:grid-cols-2">
          <Field label="Full name">
            <input className={inputClass} name="fullName" required defaultValue={defaults.fullName} />
          </Field>
          <Field label="AKTU roll (Unique Id)">
            <input className={inputClass} value={uniqueId} disabled readOnly />
          </Field>
          <Field label="Email">
            <input className={inputClass} name="email" type="email" defaultValue={defaults.email} />
          </Field>
          <Field label="Phone">
            <input className={inputClass} name="phone" defaultValue={defaults.phone} />
          </Field>
          <Field label="Department">
            <input className={inputClass} name="department" defaultValue={defaults.department} />
          </Field>
          <Field label="Branch">
            <input className={inputClass} name="branch" defaultValue={defaults.branch} />
          </Field>
          <Field label="Section">
            <input className={inputClass} name="section" defaultValue={defaults.section} />
          </Field>
          <Field label="Semester">
            <input className={inputClass} name="semester" defaultValue={defaults.semester} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Short bio (optional)">
              <textarea className={inputClass} name="bioNote" rows={3} defaultValue={defaults.bioNote} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <button className={btnPrimary} type="submit" disabled={ctx.pending}>
              {ctx.pending ? "Saving…" : "Save biodata & continue"}
            </button>
          </div>
        </div>
      )}
    </ActionForm>
  );
}

export function CreateGroupForm({ batchLabel }: { batchLabel: string }) {
  return (
    <ActionForm action={createGroup}>
      {(ctx) => (
        <>
          <p className="mt-0 text-sm text-muted">
            You become the group leader. After creating, search and invite members who completed
            biodata. Each invitee must approve, then admin approves the group.
          </p>
          <p className="text-sm text-ink-soft">
            Batch: <strong>{batchLabel}</strong>
          </p>
          <Field label="Project title">
            <input className={inputClass} name="projectTitle" required placeholder="Your project name" />
          </Field>
          <button className={btnPrimary} type="submit" disabled={ctx.pending}>
            {ctx.pending ? "Creating…" : "Create group & add members"}
          </button>
        </>
      )}
    </ActionForm>
  );
}

export function InviteResponseButtons({ inviteId }: { inviteId: number }) {
  return (
    <div className="flex gap-2">
      <ActionForm action={respondToInvite}>
        {(ctx) => (
          <>
            <input type="hidden" name="inviteId" value={inviteId} />
            <input type="hidden" name="decision" value="accepted" />
            <button className={btnPrimary} type="submit" disabled={ctx.pending}>
              {ctx.pending ? "…" : "Approve"}
            </button>
          </>
        )}
      </ActionForm>
      <ActionForm action={respondToInvite}>
        {(ctx) => (
          <>
            <input type="hidden" name="inviteId" value={inviteId} />
            <input type="hidden" name="decision" value="rejected" />
            <button className={btnSecondary} type="submit" disabled={ctx.pending}>
              {ctx.pending ? "…" : "Reject"}
            </button>
          </>
        )}
      </ActionForm>
    </div>
  );
}
