export const RUBRIC_CODES = ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"] as const;
export type RubricCode = (typeof RUBRIC_CODES)[number];

export const WEEK_COUNT = 8;

export const RUBRICS: Record<
  RubricCode,
  {
    title: string;
    maxMarks: number;
    needsFiles?: boolean;
    criteria: string[];
  }
> = {
  R1: {
    title: "Project Proposal / Problem Analysis",
    maxMarks: 18,
    criteria: [
      "Identification of Problem Domain and Detailed Analysis",
      "Study of Existing Systems and Feasibility",
      "Objectives and Methodology",
    ],
  },
  R2: {
    title: "Synopsis Presentation",
    maxMarks: 24,
    needsFiles: true,
    criteria: [
      "Project Synopsis Report",
      "Description of Concepts and Technical Details",
      "Planning of Project Work and Team Structure",
    ],
  },
  R3: {
    title: "Teamwork & Progress",
    maxMarks: 12,
    criteria: ["Working within a Team", "Progress against plan", "Communication with supervisor"],
  },
  R4: {
    title: "Design Methodology",
    maxMarks: 50,
    criteria: ["Design Methodology", "Module division", "Computing framework selection"],
  },
  R5: {
    title: "Mid-term Incorporation",
    maxMarks: 50,
    criteria: ["Incorporation of Suggestions", "Mid-term improvements", "Work quality"],
  },
  R6: {
    title: "Implementation Presentation",
    maxMarks: 30,
    needsFiles: true,
    criteria: ["Implementation quality", "Demo readiness", "Documentation"],
  },
  R7: {
    title: "Research Paper",
    maxMarks: 35,
    criteria: ["Research paper related to project", "Communication of results"],
  },
  R8: {
    title: "Final Teamwork & Presentation",
    maxMarks: 30,
    criteria: ["Working within a Team", "Final presentation quality"],
  },
};

export function isRubricCode(value: string): value is RubricCode {
  return (RUBRIC_CODES as readonly string[]).includes(value);
}

export type RubricSchedule = {
  rubricCode: string;
  openAt: Date;
  dueAt: Date;
};

function asTime(value: Date | string | null | undefined): number | null {
  if (value == null) return null;
  const t = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

/** Rubric is unlocked for students/mentors once openAt has passed. */
export function isRubricUnlocked(openAt: Date | string | null | undefined, now = new Date()): boolean {
  const t = asTime(openAt);
  if (t == null) return false;
  return t <= now.getTime();
}

/** Progressive timeline: show every rubric whose window has opened (past + current). Future ones stay hidden. */
export function visibleRubricCodes(
  deadlines: RubricSchedule[],
  now = new Date(),
): RubricCode[] {
  const byCode = new Map(deadlines.map((d) => [d.rubricCode, d]));
  return RUBRIC_CODES.filter((code) => {
    const d = byCode.get(code);
    return d ? isRubricUnlocked(d.openAt, now) : false;
  });
}

/** Next rubric that has not opened yet (for “unlocks on …” messaging). */
export function nextLockedRubric(
  deadlines: RubricSchedule[],
  now = new Date(),
): RubricSchedule | null {
  const locked = deadlines
    .filter((d) => {
      if (!isRubricCode(d.rubricCode) || !d.openAt) return false;
      const t = d.openAt instanceof Date ? d.openAt.getTime() : new Date(d.openAt).getTime();
      return Number.isFinite(t) && t > now.getTime();
    })
    .sort((a, b) => {
      const ta = a.openAt instanceof Date ? a.openAt.getTime() : new Date(a.openAt).getTime();
      const tb = b.openAt instanceof Date ? b.openAt.getTime() : new Date(b.openAt).getTime();
      return ta - tb;
    });
  return locked[0] ?? null;
}

export function isRubricInActiveWindow(
  schedule: RubricSchedule | undefined,
  now = new Date(),
): boolean {
  if (!schedule) return false;
  const open = asTime(schedule.openAt);
  const due = asTime(schedule.dueAt);
  if (open == null || due == null) return false;
  const t = now.getTime();
  return open <= t && t <= due;
}
