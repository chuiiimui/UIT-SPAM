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
