export const MOCK = {
  scheduleEvents: [
    {
      date: new Date(new Date().setDate(new Date().getDate() + 1))
        .toISOString()
        .split("T")[0],
      time: "10:00 AM",
      title: "Algebra I Live Class",
      topic: "Solving Quadratic Expressions",
      class: "JS 3 Math",
      link: "#",
    },
    {
      date: new Date(new Date().setDate(new Date().getDate() + 3))
        .toISOString()
        .split("T")[0],
      time: "02:00 PM",
      title: "Interactive Geometry Lab",
      topic: "Pythagorean Theorem Discovery",
      class: "JS 3 Math",
      link: "#",
    },
    {
      date: new Date(new Date().setDate(new Date().getDate() - 1))
        .toISOString()
        .split("T")[0],
      time: "11:30 AM",
      title: "Mental Math Sprint",
      topic: "Fast Fractions Multiplication",
      class: "JS 3 Math",
      link: "#",
    },
    {
      date: new Date(new Date().setDate(new Date().getDate() + 5))
        .toISOString()
        .split("T")[0],
      time: "04:00 PM",
      title: "Math Problem Solving Lab",
      topic: "Word Problems & Fractions",
      class: "JS 3 Math",
      link: "#",
    },
  ],

  studentTasks: [
    {
      title: "Algebra: Quadratic Equations",
      subject: "Algebra",
      dueDate: "2026-05-28",
      status: "in-progress",
      progress: 45,
    },
    {
      title: "Geometry: Pythagorean Theorem Practice",
      subject: "Geometry",
      dueDate: "2026-05-26",
      status: "pending",
      progress: 0,
    },
    {
      title: "Arithmetic: Equivalent Fractions Quiz",
      subject: "Arithmetic",
      dueDate: "2026-05-25",
      status: "overdue",
      progress: 20,
    },
    {
      title: "Data Handling: Bar Chart Analysis",
      subject: "Data & Stats",
      dueDate: "2026-05-30",
      status: "pending",
      progress: 0,
    },
  ],

  studentResults: [
    {
      title: "Fractions and Decimals Review",
      subject: "Arithmetic",
      date: "2026-05-21",
      score: 85,
    },
    {
      title: "Order of Operations (BODMAS)",
      subject: "Arithmetic",
      date: "2026-05-20",
      score: 72,
    },
    {
      title: "Angles and Triangles Challenge",
      subject: "Geometry",
      date: "2026-05-18",
      score: 91,
    },
    {
      title: "Introduction to Polynomials",
      subject: "Algebra",
      date: "2026-05-16",
      score: 63,
    },
  ],

  subjectPerf: [
    { subject: "Arithmetic & Numbers", score: 84 },
    { subject: "Algebraic Systems", score: 72 },
    { subject: "Geometry & Shapes", score: 91 },
    { subject: "Data & Statistics", score: 63 },
  ],

  teacherStudents: [
    {
      name: "Alice Obi",
      class: "JS 3 Math",
      lastActive: "2h ago",
      accuracy: 91,
      streak: 7,
      status: "active",
      activeThisWeek: true,
    },
    {
      name: "Bayo Adeyemi",
      class: "JS 3 Math",
      lastActive: "Yesterday",
      accuracy: 78,
      streak: 3,
      status: "idle",
      activeThisWeek: true,
    },
    {
      name: "David Nwosu",
      class: "JS 3 Math",
      lastActive: "3 days ago",
      accuracy: 42,
      streak: 0,
      status: "inactive",
      activeThisWeek: false,
    },
  ],

  teacherAssignments: [
    {
      title: "Linear Equations Practice Set",
      subject: "Algebra",
      dueDate: "2026-05-28",
      completedCount: 18,
      totalCount: 32,
    },
    {
      title: "Ratios & Proportions Workbook",
      subject: "Arithmetic",
      dueDate: "2026-05-26",
      completedCount: 25,
      totalCount: 32,
    },
  ],

  parentChildren: [
    {
      name: "Sarah",
      streakDays: 5,
      accuracy: 82,
      weeklyProgress: 60,
      activeClass: "Grade 7 Math",
      teacher: "Ms. Kemi Adio",
      subjectPerformance: [
        { subject: "Arithmetic & Numbers", score: 82 },
        { subject: "Basic Algebra", score: 74 },
        { subject: "Introductory Geometry", score: 89 },
      ],
      recentActivity: [
        {
          type: "quiz",
          title: "Simplifying Fractions Quiz",
          subject: "Arithmetic",
          date: "2026-05-21",
          score: 85,
        },
        {
          type: "activity",
          title: "Multiplication Tables Speedrun",
          subject: "Arithmetic",
          date: "2026-05-20",
          score: 72,
        },
      ],
      pendingAssignments: [
        {
          title: "Intro to Algebraic Expressions",
          subject: "Algebra",
          dueDate: "2026-05-28",
          status: "in-progress",
          progress: 45,
        },
        {
          title: "Decimal Place Value Practice",
          subject: "Arithmetic",
          dueDate: "2026-05-26",
          status: "pending",
          progress: 0,
        },
      ],
    },
  ],

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
