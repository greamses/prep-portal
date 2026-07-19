/* GRAMMAR — Discoveries. Authoring format and rules are documented in
   diary.js — read them before adding one.

   Each of these is a short account of how something came to be known, which
   gives the register a natural shape: a date, a person, a surprise, and what
   followed. Names and dates make Capitalisation and comma rule 1 do the work,
   and the "which suggested…" clauses are honest non-defining relatives.

   As with the history passages: check the facts before planting an error near
   them. */

export const PASSAGES = [
  {
    id: 'discovery-penicillin',
    title: 'The Discovery of Penicillin',
    band: [7, 11],
    text: `In {{P|1928|1928,}} {{C|alexander|Alexander}} Fleming returned from holiday to find a dish of {{S|bacterier|bacteria}} spoiled by mould. Most scientists would have thrown it away. Fleming {{S|noticced|noticed}} that the bacteria nearest the mould had {{P|died|died,}} and he realised the mould was producing something that killed them. He called it penicillin. For more than ten {{P|years|years,}} nobody could make enough of it to treat a patient. {{C|howard|Howard}} Florey and Ernst Chain, two researchers at {{C|oxford|Oxford}}, finally found a way. {{U|There|Their}} work has saved more lives than almost any other {{S|discovry|discovery}} of the century.`,
  },
  {
    id: 'discovery-dna',
    title: 'The Shape of DNA',
    band: [9, 12],
    text: `In {{P|1952|1952,}} {{C|rosalind|Rosalind}} Franklin produced an X-ray photograph of DNA that was {{S|sharpper|sharper}} than any taken before. It showed a clear cross {{P|pattern|pattern,}} which suggested that the {{S|molecual|molecule}} was a helix. {{C|james|James}} Watson and Francis Crick used that photograph, together with other evidence, to build {{U|there|their}} model of the double helix. Franklin died of cancer in {{P|1958|1958,}} and the {{C|nobel|Nobel}} Prize was awarded four years later. Prizes are not given after death, so her name was left off. {{S|Historans|Historians}} still argue about how fairly she {{U|were|was}} treated.`,
  },
  {
    id: 'discovery-tectonics',
    title: 'Continental Drift',
    band: [8, 12],
    text: `{{C|alfred|Alfred}} Wegener noticed that the coastline of South {{C|america|America}} seemed to fit against the coastline of {{C|africa|Africa}}. In {{P|1912|1912,}} he suggested that the continents had once been joined and had since drifted apart. {{S|Geologests|Geologists}} laughed at him. He could not explain what force was strong enough to move a {{P|continent|continent,}} and without that explanation his idea {{U|were|was}} ignored for fifty years. {{S|Evidance|Evidence}} from the ocean floor proved him right in the 1960s. The theory is now called plate {{P|tectonics|tectonics,}} and it explains {{S|erthquakes|earthquakes}} as well as the shapes of the continents. {{U|There|Their}} outlines still match today.`,
  },
];
