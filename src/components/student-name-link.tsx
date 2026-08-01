import Link from "next/link";

/** Clickable student name → biodata page (faculty/admin). */
export function StudentNameLink({
  studentId,
  name,
  className = "font-semibold text-brand no-underline hover:underline",
}: {
  studentId: number;
  name: string;
  className?: string;
}) {
  return (
    <Link href={`/students/${studentId}`} className={className} title="View student biodata">
      {name}
    </Link>
  );
}

/** Name as link for staff; plain text for students / when no id. */
export function StudentName({
  studentId,
  name,
  link,
  className,
}: {
  studentId?: number | null;
  name: string;
  link?: boolean;
  className?: string;
}) {
  if (link && studentId) {
    return <StudentNameLink studentId={studentId} name={name} className={className} />;
  }
  return <span className={className}>{name}</span>;
}
