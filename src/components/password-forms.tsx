"use client";

import { changePassword, forgotPassword } from "@/lib/map/actions";
import { ActionForm } from "@/components/action-form";
import { Field, btnPrimary, inputClass } from "@/components/ui";

export function ChangePasswordForm() {
  return (
    <ActionForm action={changePassword} className="max-w-md space-y-1">
      {(ctx) => (
        <>
          <Field label="Current password">
            <input
              className={inputClass}
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password">
            <input
              className={inputClass}
              name="newPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password">
            <input
              className={inputClass}
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </Field>
          <button className={btnPrimary} type="submit" disabled={ctx.pending}>
            {ctx.pending ? "Updating…" : "Update password"}
          </button>
        </>
      )}
    </ActionForm>
  );
}

export function ForgotPasswordForm() {
  return (
    <ActionForm action={forgotPassword} className="space-y-1">
      {(ctx) => (
        <>
          <Field label="Unique Id">
            <input
              className={inputClass}
              name="uniqueId"
              required
              autoComplete="username"
              placeholder="AKTU roll / faculty id / admin id"
            />
          </Field>
          <Field label="Registered email">
            <input
              className={inputClass}
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Must match biodata / account email"
            />
          </Field>
          <Field label="New password">
            <input
              className={inputClass}
              name="newPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password">
            <input
              className={inputClass}
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </Field>
          <button className={`${btnPrimary} w-full`} type="submit" disabled={ctx.pending}>
            {ctx.pending ? "Resetting…" : "Reset password"}
          </button>
        </>
      )}
    </ActionForm>
  );
}
