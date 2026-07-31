"use client";

import Link from "next/link";
import { useState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { btnPrimary, Field, inputClass } from "@/components/ui";

export function LoginForm({
  demoUser = "2102840100001",
  demoPassword = "password123",
}: {
  demoUser?: string;
  demoPassword?: string;
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
      {error ? (
        <div className="mb-4 rounded-xl bg-[#fee4e2] px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}
      <Field label="Unique Id">
        <input
          className={inputClass}
          name="uniqueId"
          required
          autoComplete="username"
          placeholder="AKTU roll / faculty id / admin id"
          defaultValue={demoUser}
        />
      </Field>
      <Field label="Password">
        <input
          className={inputClass}
          name="password"
          type="password"
          required
          autoComplete="current-password"
          defaultValue={demoPassword}
        />
      </Field>
      <button className={`${btnPrimary} w-full`} type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Login"}
      </button>
      <p className="mt-3 mb-0 text-center text-sm">
        <Link href="/forgot-password" className="font-semibold text-brand no-underline">
          Forgot password?
        </Link>
      </p>
      <div className="mt-4 space-y-1 rounded-xl border border-line bg-brand-mist/60 px-4 py-3 text-[0.8rem] text-ink-soft">
        <div>
          Student: <strong>2102840100001</strong> / password123
        </div>
        <div>
          Faculty: <strong>faculty1</strong> / password123
        </div>
        <div>
          Admin: <strong>testadmin</strong> / 123456
        </div>
      </div>
    </form>
  );
}
