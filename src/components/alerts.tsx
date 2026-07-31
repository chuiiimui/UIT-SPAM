"use client";

import { useEffect, useState } from "react";
import type { ActionResult } from "@/lib/map/result";

export function Alert({
  tone = "danger",
  children,
}: {
  tone?: "danger" | "ok" | "warn" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    danger: "border-[rgba(214,32,39,0.25)] bg-[#fee4e2] text-danger",
    ok: "border-[rgba(6,118,71,0.25)] bg-[#dcfae6] text-ok",
    warn: "border-[rgba(181,71,8,0.25)] bg-[#ffefd6] text-warn",
    info: "border-[rgba(51,77,147,0.22)] bg-brand-mist text-brand-deep",
  };
  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${styles[tone]}`}>
      {children}
    </div>
  );
}

/** Client form helper: calls a server action that returns ActionResult */
export function useActionFeedback() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(action: (fd: FormData) => Promise<ActionResult>, fd: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await action(fd);
      if (!res.ok) {
        setError(res.error);
        setPending(false);
        return res;
      }
      if (res.message) setMessage(res.message);
      if (res.redirectTo) {
        window.location.href = res.redirectTo;
        return res;
      }
      setPending(false);
      return res;
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
      return failLocal("Something went wrong. Please try again.");
    }
  }

  return { error, message, pending, setError, setMessage, run };
}

function failLocal(error: string): ActionResult {
  return { ok: false, error };
}

export function FeedbackBanner({
  error,
  message,
}: {
  error?: string | null;
  message?: string | null;
}) {
  if (error) return <Alert tone="danger">{error}</Alert>;
  if (message) return <Alert tone="ok">{message}</Alert>;
  return null;
}

export function ToastFromQuery() {
  const [text, setText] = useState<string | null>(null);
  const [tone, setTone] = useState<"ok" | "danger">("ok");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const okMsg = params.get("ok");
    const errMsg = params.get("error");
    if (okMsg) {
      setText(okMsg);
      setTone("ok");
    } else if (errMsg) {
      setText(errMsg);
      setTone("danger");
    }
    if (okMsg || errMsg) {
      params.delete("ok");
      params.delete("error");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", next);
    }
  }, []);

  if (!text) return null;
  return <Alert tone={tone}>{text}</Alert>;
}
