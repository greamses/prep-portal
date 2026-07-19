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
  {
    id: 'science-digestion',
    title: 'The Digestive System',
    band: [8, 12],
    text: `{{P|Aim|Aim:}} to describe what happens to food in the human digestive system.

{{C|digestion|Digestion}} begins in the {{P|mouth|mouth,}} where saliva starts to break down starch. The food then passes down the {{S|osophagus|oesophagus}} to the stomach. Acid in the stomach kills most {{P|bacteria|bacteria,}} and {{S|enzimes|enzymes}} begin to break down protein. Most {{S|absorbtion|absorption}} happens in the small intestine, which is lined with tiny folds called villi. These folds greatly increase the surface area that {{U|are|is}} available. {{C|water|Water}} is absorbed in the large intestine. What remains {{U|are|is}} stored until it leaves the body.`,
  },
  {
    id: 'science-circuit',
    title: 'Lab Report — Bulbs in Series',
    band: [8, 11],
    text: `{{P|Aim|Aim:}} to find out how the number of bulbs in a series circuit {{U|effects|affects}} their brightness.

Method: {{C|we|We}} connected a single bulb to a cell with {{S|coper|copper}} wire. We closed the switch and recorded how {{S|brightley|brightly}} the bulb glowed. A second bulb was then added in {{P|series|series,}} and the reading was taken again.

{{P|Result|Result:}} each bulb glowed less brightly as more {{U|was|were}} added.

Conclusion: the cell supplies a fixed {{P|voltage|voltage,}} which is shared between the bulbs. Adding bulbs also increases the total {{S|resistence|resistance}}, so less current flows.`,
  },
];
