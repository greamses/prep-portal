import { PEOPLE_DATA } from "./people.js";
import { EDGE_COLORS } from "../config/constants.js";

export function generateLinks(people) {
  const links = [];

  PEOPLE_DATA.forEach((p) => {
    if (p.role === "student") {
      if (p.parentId)
        links.push({ source: p.id, target: p.parentId, type: "family" });
      if (p.tutorId)
        links.push({ source: p.id, target: p.tutorId, type: "study" });
    }
  });

  const studentsByCity = {};
  people
    .filter((p) => p.role === "student")
    .forEach((s) => {
      if (!studentsByCity[s.city]) studentsByCity[s.city] = [];
      studentsByCity[s.city].push(s);
    });

  Object.values(studentsByCity).forEach((students) => {
    for (let i = 0; i < students.length - 1; i++) {
      links.push({
        source: students[i].id,
        target: students[i + 1].id,
        type: "peer",
      });
    }
  });

  const tutors = people.filter((p) => p.role === "tutor");
  for (let i = 0; i < tutors.length - 1; i++) {
    links.push({
      source: tutors[i].id,
      target: tutors[i + 1].id,
      type: "colleague",
    });
  }

  return links;
}

export function buildEdges(links) {
  return links.map((l, i) => ({
    data: {
      id: `e${i}`,
      source: l.source,
      target: l.target,
      type: l.type,
      color: EDGE_COLORS[l.type] || "#60a5fa",
    },
  }));
}
