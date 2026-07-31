"use client";

import { FeedbackBanner, useActionFeedback } from "@/components/alerts";
import type { ActionResult } from "@/lib/map/result";

export function ActionForm({
  action,
  className,
  children,
  onSuccess,
}: {
  action: (fd: FormData) => Promise<ActionResult>;
  className?: string;
  children: React.ReactNode | ((ctx: { pending: boolean }) => React.ReactNode);
  onSuccess?: () => void;
}) {
  const { error, message, pending, run } = useActionFeedback();

  return (
    <form
      className={className}
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await run(action, new FormData(e.currentTarget));
        if (res.ok) onSuccess?.();
      }}
    >
      <FeedbackBanner error={error} message={message} />
      {typeof children === "function" ? children({ pending }) : children}
    </form>
  );
}
