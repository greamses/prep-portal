export const MOCK = {
  adminSignups: [
    {
      name: "Ngozi Adeleke",
      email: "ngozi@example.com",
      role: "student",
      joinedAt: "2026-05-22",
    },
    {
      name: "Mr Tunde Lawal",
      email: "tunde@example.com",
      role: "teacher",
      joinedAt: "2026-05-22",
    },
    {
      name: "Mrs Amaka Eze",
      email: "amaka@example.com",
      role: "parent",
      joinedAt: "2026-05-21",
    },
    {
      name: "Chidi Okafor",
      email: "chidi@example.com",
      role: "student",
      joinedAt: "2026-05-21",
    },
    {
      name: "Halima Bello",
      email: "halima@example.com",
      role: "student",
      joinedAt: "2026-05-20",
    },
    {
      name: "Mr Segun Aina",
      email: "segun@example.com",
      role: "teacher",
      joinedAt: "2026-05-20",
    },
  ],
  adminClasses: [
    {
      name: "Grade 9 Algebra & Equations",
      teacher: "Mr Tunde Lawal",
      studentCount: 32,
    },
    {
      name: "Grade 8 Geometry & Proofs",
      teacher: "Ms Kemi Adio",
      studentCount: 28,
    },
    { name: "Grade 10 Calculus & Functions", teacher: null, studentCount: 0 },
    {
      name: "JSS 3 Trigonometry & Measurement",
      teacher: "Mr Emeka Chukwu",
      studentCount: 24,
    },
    {
      name: "Grade 7 Integers & Arithmetic",
      teacher: "Ms Ify Nzelu",
      studentCount: 30,
    },
  ],
  roleDist: [
    { role: "Students", count: 2150, pct: 76, color: "var(--blue)" },
    { role: "Parents", count: 420, pct: 15, color: "var(--green)" },
    { role: "Teachers", count: 240, pct: 8, color: "var(--yellow)" },
    { role: "Admins", count: 37, pct: 1, color: "var(--red)" },
  ],
};
