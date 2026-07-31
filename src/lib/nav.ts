export const studentNav = (active: string) =>
  [
    { href: "/student", label: "Home", key: "home" },
    { href: "/student/rubrics", label: "Rubrics", key: "rubrics" },
    { href: "/guidelines", label: "Guidelines", key: "guidelines" },
    { href: "/account/password", label: "Password", key: "password" },
  ].map((i) => ({ href: i.href, label: i.label, active: i.key === active }));

export const facultyNav = (active: string) =>
  [
    { href: "/faculty", label: "My Groups", key: "home" },
    { href: "/faculty/rubrics", label: "Rubrics", key: "rubrics" },
    { href: "/guidelines", label: "Guidelines", key: "guidelines" },
    { href: "/account/password", label: "Password", key: "password" },
  ].map((i) => ({ href: i.href, label: i.label, active: i.key === active }));

export const adminNav = (active: string) =>
  [
    { href: "/admin", label: "Home", key: "home" },
    { href: "/admin/groups", label: "Groups", key: "groups" },
    { href: "/admin/rubrics", label: "Rubrics", key: "rubrics" },
    { href: "/admin/dates", label: "Dates", key: "dates" },
    { href: "/admin/marks", label: "Marks", key: "marks" },
    { href: "/admin/students", label: "Students", key: "students" },
    { href: "/admin/import", label: "Import", key: "import" },
    { href: "/admin/faculty", label: "Faculty", key: "faculty" },
    { href: "/guidelines", label: "Guidelines", key: "guidelines" },
    { href: "/account/password", label: "Password", key: "password" },
  ].map((i) => ({ href: i.href, label: i.label, active: i.key === active }));
