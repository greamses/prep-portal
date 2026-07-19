/* GRAMMAR — Reports & Notices. Authoring format and rules are documented in
   diary.js — read them before adding one.

   Formal register: proper nouns everywhere (so Capitalisation carries the
   weight), dates, times, and the colon before a list — which makes it the
   natural home for the serial comma (comma rule 5) as well. */

export const PASSAGES = [
  {
    id: 'report-pta',
    title: 'A School Notice',
    band: [7, 10],
    text: `The Parent-Teacher {{C|association|Association}} will hold {{U|it's|its}} termly meeting on {{C|thursday|Thursday}} 14 {{C|september|September}} in the school hall. The meeting begins at four {{P|oclock|o’clock}} and is expected to last two hours. Three items appear on the {{P|agenda|agenda:}} the new library, the examination {{P|timetable|timetable,}} and the proposed increase in fees. Parents who wish to raise other matters should submit them to the {{S|secretery|secretary}} in writing before {{C|monday|Monday}}. {{S|Refreshmants|Refreshments}} will be provided. All parents and guardians are strongly {{S|incouraged|encouraged}} to attend.`,
  },
  {
    id: 'report-flood',
    title: 'A News Report',
    band: [8, 12],
    text: `Heavy flooding closed the {{C|lagos-ibadan|Lagos-Ibadan}} expressway for six hours on {{C|sunday|Sunday}} morning. According to the {{C|federal|Federal}} Road Safety {{P|Corps|Corps,}} water reached a depth of almost one metre near the Berger junction. No {{S|injurys|injuries}} were reported, but hundreds of motorists {{U|was|were}} stranded until the afternoon. A spokesman said that the {{S|draneage|drainage}} channels had been blocked by refuse. He advised drivers to avoid the route {{S|entirley|entirely}} until repairs are complete. The state government has promised to begin clearing work {{P|immediately|immediately.}}`,
  },
  {
    id: 'report-sports',
    title: 'Sports Day Notice',
    band: [7, 10],
    text: `This {{P|years|year’s}} inter-house sports competition will take place on {{C|saturday|Saturday}} 22 {{C|march|March}} at the main field. Students should report to {{U|there|their}} house captains by seven {{P|oclock|o’clock}} in the morning. The march-past begins at {{P|eight|eight,}} and the first track event follows {{S|imediately|immediately}} afterwards. Parents are welcome, and seating will be provided under the canopy. Any student who has not {{S|colected|collected}} a house vest should see Mr {{C|danladi|Danladi}} before Friday. The {{S|competion|competition}} will continue whether or not it rains.`,
  },
  {
    id: 'report-library',
    title: 'The Library Reopens',
    band: [7, 10],
    text: `{{C|the|The}} school library will reopen on {{C|monday|Monday}} after three weeks of repairs. The roof above the reading room has been {{P|replaced|replaced,}} and the {{S|damiged|damaged}} shelves have been rebuilt. Students who lost books during the flood should report to the {{S|libarian|librarian}} this week. {{U|There|Their}} books may be returned at the desk. No fine will be {{P|charged|charged.}} New opening hours are eight {{P|oclock|o’clock}} until four o’clock, Monday to Friday. The library will also open on {{C|saturday|Saturday}} mornings during the {{S|examinaton|examination}} term.`,
  },
  {
    id: 'report-water',
    title: 'Water Supply Notice',
    band: [8, 12],
    text: `The water board has announced that supply to the eastern district will be {{S|interupted|interrupted}} next week. {{S|Enginers|Engineers}} will replace a main pipe that has burst three times this year. {{C|residents|Residents}} are advised to store water on {{C|sunday|Sunday}} evening. The work is expected to last two {{P|days|days,}} although heavy rain could delay it. Standpipes will be provided at the market and at the health {{P|centre|centre.}} According to the {{P|board|board,}} no charge will be made for water taken from them. {{U|There|Their}} supply will return on Tuesday. Complaints should be {{S|dirrected|directed}} to the district office.`,
  },
];
