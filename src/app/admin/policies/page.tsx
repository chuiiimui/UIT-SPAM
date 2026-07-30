import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { setGroupPolicy, setPolicy } from "@/lib/features/actions";
import { adminNav } from "@/lib/nav";
import { btnPrimary, Card, Field, inputClass, PageHead, Shell } from "@/components/ui";

export default async function AdminPoliciesPage() {
  const session = await auth();
  const groups = await prisma.projectGroup.findMany({ orderBy: { groupCode: "asc" } });
  const settings = await prisma.policySetting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <Shell nav={adminNav("policies")} user={session!.user}>
      <PageHead
        title="Policy controls"
        subtitle="Lock submissions after deadlines and freeze marks after publish."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Campus defaults">
          <form action={setPolicy} className="mb-4">
            <input type="hidden" name="key" value="late_submissions" />
            <Field label="Late submissions allowed?">
              <select className={inputClass} name="value" defaultValue={map.late_submissions || "yes"}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
            <button className={btnPrimary} type="submit">
              Save
            </button>
          </form>
          <form action={setPolicy}>
            <input type="hidden" name="key" value="peer_ratings_required" />
            <Field label="Peer ratings required?">
              <select className={inputClass} name="value" defaultValue={map.peer_ratings_required || "no"}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Field>
            <button className={btnPrimary} type="submit">
              Save
            </button>
          </form>
        </Card>
        <Card title="Per-group locks">
          {groups.map((g) => (
            <form key={g.id} action={setGroupPolicy} className="mb-4 border-b border-line pb-3">
              <input type="hidden" name="groupId" value={g.id} />
              <strong>{g.groupCode}</strong>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" name="submissionsLocked" defaultChecked={g.submissionsLocked} />
                Lock submissions
              </label>
              <label className="mt-1 flex items-center gap-2 text-sm">
                <input type="checkbox" name="marksFrozen" defaultChecked={g.marksFrozen} />
                Freeze marks
              </label>
              <button className={btnPrimary + " !mt-2 !py-2 !px-3 text-xs"} type="submit">
                Update
              </button>
            </form>
          ))}
        </Card>
      </div>
    </Shell>
  );
}
