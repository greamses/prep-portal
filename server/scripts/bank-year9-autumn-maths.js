/**
 * One-off: save "Year 9 Autumn Maths 2025/26" as a named bank in the owner's Exam Maker bank
 * (questionSets/{uid}/sets/{sha1(name)}). Section A is REPHRASED from the school paper (same topic,
 * skill and difficulty, new numbers and wording; that section came from a third-party site).
 * Section B is the school's own essay questions, with worked answers.
 *
 *   node scripts/bank-year9-autumn-maths.js --dry    print what it would save
 *   node scripts/bank-year9-autumn-maths.js          save it (replaces a bank of the same name)
 */
const crypto = require("crypto");
const admin = require("firebase-admin");
const { cleanQuestion } = require("../lib/question-bank");

const UID = "Ieh3HiMxoVMAscvMTvsxp1wOAwH3";
const NAME = "JSS 3 Autumn Maths 2025/26";
const dry = process.argv.includes("--dry");

const mcq = (text, options, answer, svg = "") => ({ type: "mcq", text, options, answer, marks: 1, lines: 0, svg });
const theory = (text, answer, marks, lines) => ({ type: "theory", text, options: [], answer, marks, lines, svg: "" });

/* Q23: right-angled triangle, 30° at the top, hypotenuse 24 cm, x opposite the 30° angle */
const TRI = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 200" width="260" height="200" fill="none" stroke="currentColor" stroke-width="2" font-family="serif" font-size="15">
<path d="M40 20 L40 170 L210 170 Z"/>
<path d="M40 155 L55 155 L55 170"/>
<path d="M40 48 A28 28 0 0 0 54 44" />
<text x="47" y="66" stroke="none" fill="currentColor">30°</text>
<text x="132" y="86" stroke="none" fill="currentColor">24 cm</text>
<text x="118" y="190" stroke="none" fill="currentColor">x</text>
</svg>`;

/* Q39: 24 cm by 18 cm rectangle with a circle of radius 7 cm cut out; the rest is shaded */
const RECT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 230" width="300" height="230" font-family="serif" font-size="15">
<defs><pattern id="y9dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="currentColor"/></pattern></defs>
<rect x="30" y="30" width="240" height="180" fill="url(#y9dots)" stroke="currentColor" stroke-width="2"/>
<circle cx="150" cy="120" r="56" fill="#fff" stroke="currentColor" stroke-width="2"/>
<line x1="150" y1="120" x2="206" y2="120" stroke="currentColor" stroke-width="2"/>
<circle cx="150" cy="120" r="3" fill="currentColor"/>
<text x="166" y="112" fill="currentColor">7 cm</text>
<text x="132" y="22" fill="currentColor">24 cm</text>
<text x="276" y="125" fill="currentColor">18 cm</text>
</svg>`;

const SECTION_A = [
  mcq("Approximate $3.8462$ to the nearest thousandth.", ["$3.85$", "$3.846$", "$3.8462$", "$3.847$"], 1),
  mcq("Write in figures: four hundred and twenty-three million, sixty thousand and seven.", ["$423\\,600\\,007$", "$423\\,006\\,007$", "$423\\,060\\,070$", "$423\\,060\\,007$"], 3),
  mcq("Express $0.000318$ in standard form.", ["$3.18 \\times 10^{-3}$", "$3.18 \\times 10^{-4}$", "$3.18 \\times 10^{-5}$", "$31.8 \\times 10^{-5}$"], 1),
  mcq("Find the sum of the distinct prime factors of $84$.", ["$7$", "$9$", "$12$", "$14$"], 2),
  mcq("Round $4583$ to the nearest ten.", ["$4580$", "$4500$", "$4590$", "$4600$"], 0),
  mcq("Express ₦45.00 as a ratio of ₦75.00 in its simplest form.", ["$5:3$", "$9:25$", "$15:45$", "$3:5$"], 3),
  mcq("Find the L.C.M. of $12x^{2}$ and $18xy$.", ["$6x$", "$36x^{2}y$", "$216x^{3}y$", "$36xy$"], 1),
  mcq("Add $1101_{\\text{two}}$, $111_{\\text{two}}$ and $10011_{\\text{two}}$.", ["$101111_{\\text{two}}$", "$100101_{\\text{two}}$", "$100111_{\\text{two}}$", "$110111_{\\text{two}}$"], 2),
  mcq("Find the H.C.F. of $96$ and $60$.", ["$6$", "$12$", "$24$", "$48$"], 1),
  mcq("Increase $3200$ kg by $15\\%$.", ["$480$ kg", "$3520$ kg", "$3840$ kg", "$3680$ kg"], 3),
  mcq("Find the product of the L.C.M. and the H.C.F. of $12$ and $20$.", ["$240$", "$64$", "$120$", "$80$"], 0),
  mcq("₦180,000 is shared among three people in the ratio $4:3:2$. What is the least share?", ["₦60,000", "₦40,000", "₦80,000", "₦20,000"], 1),
  mcq("Find the simple interest on ₦40,000 for $2\\tfrac{1}{2}$ years at $6\\%$ per annum.", ["₦2,400", "₦4,800", "₦6,000", "₦60,000"], 2),
  mcq("Find the square root of $4 \\times 9 \\times 49$.", ["$1764$", "$21$", "$84$", "$42$"], 3),
  mcq("A phone is bought for ₦60,000 and sold for ₦48,000. Find the loss percent.", ["$20\\%$", "$25\\%$", "$12\\%$", "$80\\%$"], 0),
  mcq("Arrange in descending order of size: $\\tfrac{3}{5}, \\tfrac{1}{2}, \\tfrac{2}{3}, \\tfrac{5}{8}$.", ["$\\tfrac{1}{2}, \\tfrac{3}{5}, \\tfrac{5}{8}, \\tfrac{2}{3}$", "$\\tfrac{2}{3}, \\tfrac{5}{8}, \\tfrac{3}{5}, \\tfrac{1}{2}$", "$\\tfrac{5}{8}, \\tfrac{2}{3}, \\tfrac{3}{5}, \\tfrac{1}{2}$", "$\\tfrac{2}{3}, \\tfrac{3}{5}, \\tfrac{5}{8}, \\tfrac{1}{2}$"], 1),
  mcq("An agent earns ₦400 commission on every ₦10,000 worth of goods sold. Find the commission on sales of ₦250,000.", ["₦1,000", "₦4,000", "₦25,000", "₦10,000"], 3),
  mcq("Multiply $1011_{\\text{two}}$ by $101_{\\text{two}}$.", ["$111011_{\\text{two}}$", "$110111_{\\text{two}}$", "$101111_{\\text{two}}$", "$110011_{\\text{two}}$"], 1),
  mcq("A car uses $40$ litres of fuel to travel $320$ km. How many litres will it use for $200$ km?", ["$20$ litres", "$30$ litres", "$25$ litres", "$64$ litres"], 2),
  mcq("Find the reciprocal of $0.45$, correct to three significant figures.", ["$2.22$", "$2.23$", "$0.222$", "$2.20$"], 0),
  mcq("If $\\dfrac{x}{12} = \\dfrac{5}{4}$, find the value of $x$.", ["$3$", "$9.6$", "$20$", "$15$"], 3),
  mcq("A rope can be cut into $15$ pieces, each $40$ cm long. How many pieces, each $30$ cm long, can be cut from the same rope?", ["$18$", "$20$", "$12$", "$25$"], 1),
  mcq("In the right-angled triangle below, the hypotenuse is $24$ cm and the angle at the top is $30^{\\circ}$. Find $x$, the side opposite the $30^{\\circ}$ angle.", ["$20.8$ cm", "$24$ cm", "$12$ cm", "$48$ cm"], 2, TRI),
  mcq("The linear scale factor of two similar objects is $3:7$. What is their volume scale factor?", ["$3:7$", "$9:49$", "$6:14$", "$27:343$"], 3),
  mcq("The volume scale factor of two similar solids is $27:64$. A side of the bigger solid is $96$ cm. Find the corresponding side of the smaller solid.", ["$72$ cm", "$54$ cm", "$40.5$ cm", "$81$ cm"], 0),
  mcq("The linear scale factor of two similar shapes is $3:5$. The area of the bigger shape is $375\\text{ cm}^{2}$. Find the area of the smaller shape.", ["$225\\text{ cm}^{2}$", "$135\\text{ cm}^{2}$", "$81\\text{ cm}^{2}$", "$625\\text{ cm}^{2}$"], 1),
  mcq("Each interior angle of a regular polygon is $140^{\\circ}$. How many sides has the polygon?", ["$7$", "$8$", "$10$", "$9$"], 3),
  mcq("One interior angle of a pentagon is $120^{\\circ}$ and each of the other four angles is $y^{\\circ}$. Find $y$.", ["$108$", "$105$", "$120$", "$96$"], 1),
  mcq("Find the size of an interior angle of a regular decagon.", ["$150^{\\circ}$", "$135^{\\circ}$", "$144^{\\circ}$", "$36^{\\circ}$"], 2),
  mcq("All of the following are properties of a square EXCEPT:", ["All four sides are equal", "The diagonals bisect each other at right angles", "It has four lines of symmetry", "It has only two lines of symmetry"], 3),
  mcq("A polygon with $9$ sides is called a", ["heptagon", "nonagon", "octagon", "decagon"], 1),
  mcq("Solve the equation $\\dfrac{12}{2p - 1} = 1\\tfrac{5}{7}$.", ["$4$", "$3$", "$5$", "$7$"], 0),
  mcq("When $4$ is divided by the sum of a number and $5$, the result is the same as dividing $3$ by the sum of that number and $2$. Find the number.", ["$5$", "$9$", "$7$", "$11$"], 2),
  mcq("With ruler and compasses, a perpendicular is constructed at a point on a straight line. What angle does it make with the line?", ["$45^{\\circ}$", "$60^{\\circ}$", "$120^{\\circ}$", "$90^{\\circ}$"], 3),
  mcq("Which method constructs an angle of $30^{\\circ}$ at a point $P$ with ruler and compasses?", ["Construct $90^{\\circ}$ and bisect it", "Construct $60^{\\circ}$ and bisect it", "Construct $45^{\\circ}$ and double it", "Construct $120^{\\circ}$ and bisect it"], 1),
  mcq("In triangle $ABC$, $D$ is on $AB$ and $E$ is on $AC$ with $DE$ parallel to $BC$. If $AD = 4$ cm and $DB = 6$ cm, find the ratio $AE : EC$.", ["$2:3$", "$3:2$", "$2:5$", "$4:5$"], 0),
  mcq("Find the area of a semicircle of diameter $14$ cm. (Take $\\pi = \\tfrac{22}{7}$.)", ["$154\\text{ cm}^{2}$", "$44\\text{ cm}^{2}$", "$77\\text{ cm}^{2}$", "$308\\text{ cm}^{2}$"], 2),
  mcq("A sector of a circle of radius $14$ cm has an area of $77\\text{ cm}^{2}$. Find the angle of the sector. (Take $\\pi = \\tfrac{22}{7}$.)", ["$60^{\\circ}$", "$45^{\\circ}$", "$90^{\\circ}$", "$30^{\\circ}$"], 1),
  mcq("Find the area of the shaded part of the figure below: a $24$ cm by $18$ cm rectangle with a circle of radius $7$ cm cut out of it. (Take $\\pi = \\tfrac{22}{7}$.)", ["$154\\text{ cm}^{2}$", "$432\\text{ cm}^{2}$", "$586\\text{ cm}^{2}$", "$278\\text{ cm}^{2}$"], 3, RECT),
  mcq("The area of a triangle is $63\\text{ cm}^{2}$ and its base is $14$ cm. Find its height.", ["$9$ cm", "$4.5$ cm", "$18$ cm", "$7$ cm"], 0),
];

const SECTION_B = [
  theory("Factorise completely: $132pqr - 96qr^{2} + 108pqrs$.",
    "The H.C.F. of the three terms is $12qr$. $132pqr - 96qr^{2} + 108pqrs = 12qr(11p - 8r + 9ps)$.", 4, 6),
  theory("Simplify $(2ab - 3)^{2}$.",
    "$(2ab - 3)^{2} = (2ab - 3)(2ab - 3) = 4a^{2}b^{2} - 6ab - 6ab + 9 = 4a^{2}b^{2} - 12ab + 9$.", 4, 6),
  theory("Solve for $x$: $\\dfrac{6}{8} = \\dfrac{2}{4}x - 14$.",
    "$\\tfrac{3}{4} = \\tfrac{1}{2}x - 14$. Add $14$: $\\tfrac{1}{2}x = 14\\tfrac{3}{4} = \\tfrac{59}{4}$. Multiply by $2$: $x = \\tfrac{59}{2} = 29\\tfrac{1}{2}$.", 5, 8),
  theory("One-third of a number is subtracted from twice the number. If the result is $36$, find the number.",
    "Let the number be $n$. $2n - \\tfrac{1}{3}n = 36$, so $\\tfrac{5}{3}n = 36$ and $n = \\tfrac{108}{5} = 21\\tfrac{3}{5}$ (that is, $21.6$).", 5, 8),
  theory("Make $a$ the subject of $\\dfrac{k}{ma} + b = c$.",
    "$\\dfrac{k}{ma} = c - b$, so $ma(c - b) = k$ and $a = \\dfrac{k}{m(c - b)}$.", 4, 6),
  theory("Make $a$ the subject of $x = \\left(\\dfrac{3a - 3b}{2}\\right)^{2}$.",
    "Square root both sides: $\\sqrt{x} = \\dfrac{3a - 3b}{2}$. So $3a - 3b = 2\\sqrt{x}$, $3a = 2\\sqrt{x} + 3b$ and $a = \\dfrac{2\\sqrt{x} + 3b}{3} = \\dfrac{2\\sqrt{x}}{3} + b$.", 5, 8),
  theory("Solve simultaneously: $6x + 2y = -26$ and $2x + 2y = -10$.",
    "Subtract the second equation from the first: $4x = -16$, so $x = -4$. Substitute: $2(-4) + 2y = -10$, $2y = -2$, $y = -1$. So $x = -4$, $y = -1$.", 6, 10),
];

(async () => {
  const questions = [...SECTION_A, ...SECTION_B].map(cleanQuestion).filter(Boolean);
  console.log(`${questions.length} questions (${SECTION_A.length} objective, ${SECTION_B.length} essay)`);
  if (dry) { questions.slice(0, 3).forEach((q) => console.log(JSON.stringify(q).slice(0, 200))); process.exit(0); }
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(require("../serviceAccountKey.json")) });
  const id = crypto.createHash("sha1").update(NAME.trim().toLowerCase()).digest("hex").slice(0, 24);
  await admin.firestore().collection("questionSets").doc(UID).collection("sets").doc(id).set({
    name: NAME, questions, subject: "Mathematics", level: "JSS 3 (Year 9)", savedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`saved "${NAME}" (${id})`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
