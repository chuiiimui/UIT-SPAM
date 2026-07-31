export type ActionResult =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; error: string };

export function ok(message?: string, redirectTo?: string): ActionResult {
  return { ok: true, message, redirectTo };
}

export function fail(error: string): ActionResult {
  return { ok: false, error };
}
