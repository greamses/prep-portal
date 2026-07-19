/* GRAMMAR — Science write-ups. Authoring format and rules are documented in
   diary.js — read them before adding one.

   The register a practical is actually marked in: headed sections with colons,
   the passive voice, and the usage traps that cost marks in a science paper
   specifically (affect/effect above all).

   The headed sections are separate paragraphs, which is also what keeps the
   Aim/Method/Result colons meaningful. */

export const PASSAGES = [
  {
    id: 'science-evaporation',
    title: 'Lab Report — Evaporation',
    band: [8, 11],
    text: `{{P|Aim|Aim:}} to find out whether the temperature of water {{U|effects|affects}} how quickly it evaporates.

Method: {{C|we|We}} measured fifty {{S|mililitres|millilitres}} of water into each of three identical beakers. The first was left at room {{P|temperature|temperature.}} The second was placed on a windowsill in direct sunlight, and the third was warmed gently over a {{C|bunsen|Bunsen}} burner. Each beaker was measured again after thirty minutes.

{{P|Result|Result:}} the beaker over the burner lost the most water, and the beaker at room temperature lost the {{S|leest|least}}.

Conclusion: water evaporates more quickly at higher temperatures because the {{S|particals|particles}} gain energy and escape from the {{S|surfase|surface}}.`,
  },
  {
    id: 'science-photosynthesis',
    title: 'Photosynthesis',
    band: [9, 12],
    text: `{{C|green|Green}} plants make {{U|there|their}} own food by a process called photosynthesis. The leaves {{S|absorbe|absorb}} carbon dioxide from the air through tiny pores called stomata. At the same time, the roots take in {{P|water|water,}} which travels up the stem in the xylem. {{P|Chlorophyll|Chlorophyll,}} the green pigment in the chloroplasts, captures light energy from the sun. This energy is used to convert the water and carbon dioxide into {{S|glucoze|glucose}}. Oxygen is {{S|relesed|released}} as a by-product. Without this process, {{U|their|there}} would be almost no oxygen in the {{P|atmosphere|atmosphere.}}`,
  },
];
