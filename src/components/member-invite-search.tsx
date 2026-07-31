"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteStudentToGroup, searchStudentsForInvite } from "@/lib/map/actions";
import { FeedbackBanner } from "@/components/alerts";
import { btnPrimary, inputClass } from "@/components/ui";

type Hit = {
  id: number;
  uniqueId: string;
  fullName: string;
  department: string | null;
  section: string | null;
  branch: string | null;
};

export function MemberInviteSearch({ groupId }: { groupId: number }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [pending, startTransition] = useTransition();
  const [inviting, setInviting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        const rows = await searchStudentsForInvite(query, groupId);
        setHits(rows);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [query, groupId]);

  async function invite(aktuRoll: string) {
    setInviting(aktuRoll);
    setError(null);
    setMessage(null);
    const fd = new FormData();
    fd.set("groupId", String(groupId));
    fd.set("aktuRoll", aktuRoll);
    const res = await inviteStudentToGroup(fd);
    setInviting(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage(res.message ?? "Invite sent.");
    setQuery("");
    setHits([]);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-line bg-white/80 p-4">
      <h3 className="m-0 text-base font-semibold">Add members</h3>
      <FeedbackBanner error={error} message={message} />
      <p className="mt-1 text-sm text-muted">
        Search students who already completed biodata and are free (same batch). They must approve
        the invite from their portal.
      </p>
      <input
        className={`${inputClass} mt-3`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or AKTU roll…"
        autoComplete="off"
      />
      {pending ? <p className="mt-2 text-xs text-muted">Searching…</p> : null}
      {hits.length > 0 ? (
        <ul className="mt-3 m-0 list-none space-y-2 p-0">
          {hits.map((h) => (
            <li
              key={h.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-brand-mist/40 px-3 py-2"
            >
              <div className="text-sm">
                <strong>{h.fullName}</strong>
                <div className="text-xs text-muted">
                  {h.uniqueId}
                  {h.branch ? ` · ${h.branch}` : ""}
                  {h.section ? ` · Sec ${h.section}` : ""}
                </div>
              </div>
              <button
                type="button"
                className={`${btnPrimary} !px-3 !py-2 !text-xs`}
                disabled={inviting === h.uniqueId}
                onClick={() => invite(h.uniqueId)}
              >
                {inviting === h.uniqueId ? "Inviting…" : "Invite"}
              </button>
            </li>
          ))}
        </ul>
      ) : query.trim().length >= 2 && !pending ? (
        <p className="mt-2 text-sm text-muted">No available students found.</p>
      ) : null}
    </div>
  );
}
