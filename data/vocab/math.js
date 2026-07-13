/* ═══════════════════════════════════════════════════════
   VOCAB BANK — Maths
   Same shape as science.js: letter -> [{ w, g, d }].

   Maths is genuinely thin at a few letters (J, Q, U, X, Y, Z) — there are
   only so many mathematical terms that start with them. That is fine: the
   game marches through whichever letters the chosen subject and grade
   actually have words for, rather than inventing filler.
═══════════════════════════════════════════════════════ */

export const MATH_WORDS = {
  A: [
    { w: 'add', g: 1, d: 'To put two amounts together to find how many altogether.' },
    { w: 'angle', g: 3, d: 'The amount of turn between two lines that meet at a point.' },
    { w: 'area', g: 3, d: 'The amount of flat space a shape covers.' },
    { w: 'acute', g: 4, d: 'The word for an angle smaller than a right angle.' },
    { w: 'average', g: 5, d: 'The middle-ish value you get by sharing a total out evenly.' },
    { w: 'algebra', g: 7, d: 'The branch of maths where letters stand in for unknown numbers.' },
  ],
  B: [
    { w: 'bar', g: 3, d: 'The kind of chart that shows amounts as tall rectangles.' },
    { w: 'base', g: 4, d: 'The flat bottom face a solid shape stands on.' },
    { w: 'billion', g: 4, d: 'A thousand million.' },
    { w: 'bracket', g: 5, d: 'The curved mark that shows which part to work out first.' },
    { w: 'bisect', g: 6, d: 'To cut something into two equal halves.' },
  ],
  C: [
    { w: 'count', g: 1, d: 'To say the numbers one after another to find how many.' },
    { w: 'circle', g: 1, d: 'A perfectly round flat shape.' },
    { w: 'cone', g: 2, d: 'A solid with a round bottom that rises to a point.' },
    { w: 'cube', g: 3, d: 'A solid with six square faces, all the same size.' },
    { w: 'coordinate', g: 6, d: 'A pair of numbers that pins down one exact point on a grid.' },
    { w: 'circumference', g: 6, d: 'The distance all the way round the edge of a circle.' },
  ],
  D: [
    { w: 'digit', g: 1, d: 'Any one of the ten symbols from 0 to 9.' },
    { w: 'divide', g: 2, d: 'To share an amount into equal groups.' },
    { w: 'difference', g: 2, d: 'What is left when you take one number away from another.' },
    { w: 'decimal', g: 4, d: 'A number written with a point, like 3.75.' },
    { w: 'degree', g: 4, d: 'The unit an angle is measured in.' },
    { w: 'denominator', g: 4, d: 'The bottom number of a fraction.' },
    { w: 'diameter', g: 5, d: 'A straight line right across a circle, through its centre.' },
  ],
  E: [
    { w: 'equal', g: 1, d: 'Exactly the same in value as something else.' },
    { w: 'even', g: 1, d: 'The word for a number that can be shared into two equal groups.' },
    { w: 'edge', g: 2, d: 'The line where two faces of a solid shape meet.' },
    { w: 'estimate', g: 3, d: 'A sensible guess at an answer, without working it out exactly.' },
    { w: 'equation', g: 6, d: 'A number sentence with an equals sign in the middle.' },
    { w: 'expression', g: 6, d: 'A group of numbers and letters joined by signs, with no equals sign.' },
    { w: 'exponent', g: 7, d: 'The small raised number showing how many times to multiply a number by itself.' },
  ],
  F: [
    { w: 'face', g: 2, d: 'One of the flat sides of a solid shape.' },
    { w: 'fraction', g: 3, d: 'A number written as one whole split into parts, like 3 over 4.' },
    { w: 'factor', g: 4, d: 'A number that divides into another one exactly, with nothing left over.' },
    { w: 'formula', g: 6, d: 'A rule written with letters that tells you how to work something out.' },
    { w: 'frequency', g: 6, d: 'How many times a value turns up in a set of data.' },
  ],
  G: [
    { w: 'gram', g: 2, d: 'The small unit of mass — a paperclip is about one.' },
    { w: 'graph', g: 4, d: 'A drawing that shows numbers as a picture, so you can compare them.' },
    { w: 'geometry', g: 5, d: 'The branch of maths that deals with shapes, lines and angles.' },
    { w: 'gradient', g: 8, d: 'A measure of how steeply a line slopes.' },
  ],
  H: [
    { w: 'half', g: 1, d: 'One of two equal parts of a whole.' },
    { w: 'hundred', g: 1, d: 'Ten tens.' },
    { w: 'height', g: 2, d: 'How tall something is, measured from bottom to top.' },
    { w: 'hexagon', g: 3, d: 'A flat shape with six straight sides.' },
    { w: 'horizontal', g: 4, d: 'Flat and level, going the same way as the ground.' },
    { w: 'hypotenuse', g: 7, d: 'The longest side of a right-angled triangle.' },
  ],
  I: [
    { w: 'inch', g: 3, d: 'An old unit of length — twelve of them make a foot.' },
    { w: 'improper', g: 5, d: 'The word for a fraction whose top number is bigger than its bottom one.' },
    { w: 'isosceles', g: 5, d: 'The word for a triangle with two sides the same length.' },
    { w: 'integer', g: 6, d: 'A whole number, which may be positive, negative or zero.' },
    { w: 'interest', g: 7, d: 'The extra money the bank adds for keeping or lending you money.' },
  ],
  J: [
    { w: 'jump', g: 1, d: 'One equal-sized hop along a number line when you count in steps.' },
  ],
  K: [
    { w: 'kilogram', g: 2, d: 'The unit mass is usually measured in — a thousand grams.' },
    { w: 'kite', g: 3, d: 'A four-sided shape with two pairs of equal sides next to each other.' },
    { w: 'kilometre', g: 3, d: 'A unit of distance — a thousand metres.' },
  ],
  L: [
    { w: 'less', g: 1, d: 'Smaller in amount than something else.' },
    { w: 'line', g: 1, d: 'A straight mark going from one point to another.' },
    { w: 'length', g: 1, d: 'How long something is, from one end to the other.' },
    { w: 'litre', g: 2, d: 'The unit liquid is usually measured in.' },
    { w: 'linear', g: 7, d: 'The word for an equation whose graph comes out perfectly straight.' },
  ],
  M: [
    { w: 'minus', g: 1, d: 'The sign that tells you to take one number away from another.' },
    { w: 'metre', g: 2, d: 'The main unit of length — roughly one big stride.' },
    { w: 'multiply', g: 2, d: 'To add a number to itself a given number of times.' },
    { w: 'mass', g: 3, d: 'How much stuff there is in an object, measured in kilograms.' },
    { w: 'mean', g: 5, d: 'The average you get by adding all the values and dividing by how many there are.' },
    { w: 'median', g: 6, d: 'The middle value once all the data is put in order.' },
    { w: 'mode', g: 6, d: 'The value that turns up most often in a set of data.' },
  ],
  N: [
    { w: 'number', g: 1, d: 'A word or symbol that tells you how many.' },
    { w: 'numerator', g: 4, d: 'The top part of a fraction.' },
    { w: 'net', g: 5, d: 'The flat shape you get by unfolding a solid.' },
    { w: 'negative', g: 5, d: 'The word for a number below zero.' },
  ],
  O: [
    { w: 'odd', g: 1, d: 'The word for a number that cannot be shared into two equal groups.' },
    { w: 'operation', g: 3, d: 'Any one of adding, taking away, timesing or sharing.' },
    { w: 'obtuse', g: 4, d: 'The word for an angle bigger than a right angle but less than a straight line.' },
    { w: 'origin', g: 6, d: 'The point on a grid where both axes cross, at nought and nought.' },
  ],
  P: [
    { w: 'plus', g: 1, d: 'The sign that tells you to put two numbers together.' },
    { w: 'pattern', g: 2, d: 'An arrangement that repeats in a way you can predict.' },
    { w: 'product', g: 2, d: 'The answer you get when you times two numbers together.' },
    { w: 'perimeter', g: 3, d: 'The total distance all the way round the outside of a shape.' },
    { w: 'pentagon', g: 3, d: 'A flat shape with five straight sides.' },
    { w: 'prime', g: 4, d: 'The word for a number that only divides by itself and one.' },
    { w: 'parallel', g: 4, d: 'The word for two lines that stay the same distance apart for ever.' },
    { w: 'percentage', g: 5, d: 'A way of writing a fraction as a number of parts per hundred.' },
    { w: 'probability', g: 7, d: 'A measure of how likely something is to happen.' },
  ],
  Q: [
    { w: 'quarter', g: 2, d: 'One of four equal parts of a whole.' },
    { w: 'quotient', g: 4, d: 'The answer you get when you divide one number by another.' },
    { w: 'quadrilateral', g: 4, d: 'Any flat shape with exactly four straight sides.' },
    { w: 'quadratic', g: 9, d: 'The word for an equation where the highest power is two.' },
  ],
  R: [
    { w: 'ruler', g: 1, d: 'The straight tool you use to draw and measure lines.' },
    { w: 'rectangle', g: 1, d: 'A four-sided shape with four right angles and opposite sides equal.' },
    { w: 'round', g: 2, d: 'To change a number to a nearby, tidier one.' },
    { w: 'remainder', g: 3, d: 'The bit left over when one number will not divide exactly into another.' },
    { w: 'radius', g: 5, d: 'The distance from the centre of a circle out to its edge.' },
    { w: 'ratio', g: 6, d: 'A way of comparing two amounts, written with a colon between them.' },
  ],
  S: [
    { w: 'sum', g: 1, d: 'The answer you get when you add numbers together.' },
    { w: 'shape', g: 1, d: 'The outline or form of an object.' },
    { w: 'square', g: 1, d: 'A four-sided shape with all sides equal and all angles right angles.' },
    { w: 'subtract', g: 2, d: 'To take one amount away from another.' },
    { w: 'sphere', g: 2, d: 'A perfectly round solid, like a ball.' },
    { w: 'symmetry', g: 4, d: 'When one half of a shape is a mirror image of the other half.' },
    { w: 'simplify', g: 5, d: 'To write something in its smallest, tidiest form.' },
    { w: 'sequence', g: 6, d: 'A list of numbers that follows a rule from one term to the next.' },
  ],
  T: [
    { w: 'total', g: 1, d: 'The whole amount, once everything has been added up.' },
    { w: 'triangle', g: 1, d: 'A flat shape with three straight sides.' },
    { w: 'tally', g: 2, d: 'A count kept with little strokes, crossed through in fives.' },
    { w: 'trapezium', g: 5, d: 'A four-sided shape with exactly one pair of parallel sides.' },
    { w: 'tangent', g: 9, d: 'A straight line that just touches a curve at a single point.' },
  ],
  U: [
    { w: 'unit', g: 2, d: 'A standard amount that measurements are counted in, like a metre.' },
    { w: 'union', g: 7, d: 'In sets, everything that is in either one group or the other.' },
  ],
  V: [
    { w: 'value', g: 2, d: 'How much a number or a digit is worth.' },
    { w: 'volume', g: 4, d: 'The amount of space a solid takes up.' },
    { w: 'vertex', g: 4, d: 'The corner point where edges of a shape meet.' },
    { w: 'vertical', g: 4, d: 'Standing straight up, at a right angle to the ground.' },
    { w: 'variable', g: 7, d: 'A letter that stands in for a number that can change.' },
  ],
  W: [
    { w: 'whole', g: 1, d: 'The complete thing, with none of it missing.' },
    { w: 'width', g: 2, d: 'How wide something is, from one side to the other.' },
    { w: 'weight', g: 2, d: 'How heavy something is.' },
  ],
  X: [
    { w: 'x-axis', g: 6, d: 'The line that runs across a graph, left to right.' },
  ],
  Y: [
    { w: 'y-axis', g: 6, d: 'The line that runs up a graph, bottom to top.' },
  ],
  Z: [
    { w: 'zero', g: 1, d: 'The number that means none at all.' },
  ],
};
