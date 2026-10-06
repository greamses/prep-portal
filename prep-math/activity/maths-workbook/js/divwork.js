/* ============================================================================
   Maths Workbook — the working of a division by one figure
   ----------------------------------------------------------------------------
   Shared by the paper (ex-pvdiv.js) and PrepBot's video (divvideo.js), so the
   sum a child watches and the sum a child writes are worked the same way.
   ========================================================================== */

/**
 * n ÷ d, a column at a time, in DIGITS.
 *   cols   for each figure of n: the `digit`, what the column has `now` (with
 *          what was carried into it), and the three steps — `q` in each group,
 *          `m` shared out altogether, `s` left over — and its `place` (100, 10, 1)
 *   q, r   the answer and the remainder
 */
export function divWork(n, d) {
  const digits = String(n).split("").map(Number);
  let carry = 0;
  const cols = digits.map((digit, c) => {
    const now = carry * 10 + digit;
    const q = Math.floor(now / d), m = q * d, s = now - m;
    carry = s;
    return { digit, now, q, m, s, place: 10 ** (digits.length - 1 - c) };
  });
  return { cols, q: Math.floor(n / d), r: n % d };
}
