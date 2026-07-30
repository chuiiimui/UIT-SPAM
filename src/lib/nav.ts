export const studentNav = (active: string) =>
  [
    { href: "/student", label: "Project", key: "project" },
    { href: "/student/milestones", label: "Milestones", key: "milestones" },
    { href: "/student/submissions", label: "Submissions", key: "submissions" },
    { href: "/student/progress", label: "Progress", key: "progress" },
    { href: "/student/contribution", label: "Contribution", key: "contribution" },
    { href: "/student/peers", label: "Peers", key: "peers" },
    { href: "/student/meetings", label: "Meetings", key: "meetings" },
    { href: "/student/marks", label: "Marks", key: "marks" },
    { href: "/student/requests", label: "Requests", key: "requests" },
    { href: "/student/announcements", label: "News", key: "news" },
    { href: "/student/team", label: "Team", key: "team" },
    { href: "/notifications", label: "Alerts", key: "alerts" },
  ].map((i) => ({ href: i.href, label: i.label, active: i.key === active }));

export const facultyNav = (active: string) =>
  [
    { href: "/faculty", label: "Dashboard", key: "dash" },
    { href: "/faculty/review", label: "Review", key: "review" },
    { href: "/faculty/groups", label: "Groups", key: "groups" },
    { href: "/faculty/rubric", label: "Rubric", key: "rubric" },
    { href: "/faculty/viva", label: "Viva", key: "viva" },
    { href: "/faculty/assess", label: "Assess", key: "assess" },
    { href: "/faculty/meetings", label: "Meetings", key: "meetings" },
    { href: "/faculty/compare", label: "Compare", key: "compare" },
    { href: "/faculty/flags", label: "Flags", key: "flags" },
    { href: "/faculty/requests", label: "Requests", key: "requests" },
    { href: "/faculty/templates", label: "Templates", key: "templates" },
    { href: "/faculty/comments", label: "Comments", key: "comments" },
    { href: "/notifications", label: "Alerts", key: "alerts" },
  ].map((i) => ({ href: i.href, label: i.label, active: i.key === active }));

export const adminNav = (active: string) =>
  [
    { href: "/admin", label: "Overview", key: "dash" },
    { href: "/admin/groups", label: "Groups", key: "groups" },
    { href: "/admin/faculty", label: "Faculty", key: "faculty" },
    { href: "/admin/students", label: "Students", key: "students" },
    { href: "/admin/assign", label: "Assign", key: "assign" },
    { href: "/admin/load", label: "Load", key: "load" },
    { href: "/admin/calendar", label: "Calendar", key: "calendar" },
    { href: "/admin/announcements", label: "News", key: "news" },
    { href: "/admin/flags", label: "Flags", key: "flags" },
    { href: "/admin/policies", label: "Policies", key: "policies" },
    { href: "/admin/import", label: "Import", key: "import" },
    { href: "/admin/export", label: "Export", key: "export" },
    { href: "/admin/reports", label: "Reports", key: "reports" },
    { href: "/notifications", label: "Alerts", key: "alerts" },
  ].map((i) => ({ href: i.href, label: i.label, active: i.key === active }));
