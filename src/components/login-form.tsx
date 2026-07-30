"use client";

import { useState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { btnPrimary, Field, inputClass } from "@/components/ui";
import type { Role } from "@/lib/constants";

export function LoginForm({
  role,
  callbackUrl,
  demoUser,
}: {
  role: Role;
  callbackUrl: string;
  demoUser: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const res = await loginAction(formData);
    if (res?.error) {
      setError(res.error);
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-1">
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {error ? (
        <div className="mb-4 rounded-xl bg-[#fee4e2] px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}
      <Field label="Username">
        <input className={inputClass} name="username" required defaultValue={demoUser} />
      </Field>
      <Field label="Password">
        <input
          className={inputClass}
          name="password"
          type="password"
          required
          defaultValue="password123"
        />
      </Field>
      <button className={`${btnPrimary} w-full`} type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <div className="mt-4 rounded-xl border border-dashed border-[rgba(196,138,42,0.35)] bg-[rgba(196,138,42,0.1)] px-4 py-3 text-[0.82rem] text-ink-soft">
        Demo: <strong>{demoUser}</strong> / password123
      </div>
    </form>
  );
}
