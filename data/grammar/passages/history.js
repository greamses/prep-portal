/* GRAMMAR — Historical articles. Authoring format and rules are documented in
   diary.js — read them before adding one.

   Dense with proper nouns and dates, which makes Capitalisation and the
   introductory comma ("In 1897, a British force…") carry most of the weight.

   The facts must be right. A child will remember that the Nok terracottas were
   found by a tin miner long after they have forgotten where the comma went, so
   check anything you are not certain of before planting an error near it. */

export const PASSAGES = [
  {
    id: 'history-benin',
    title: 'The Benin Bronzes',
    band: [7, 12],
    text: `{{C|the|The}} kingdom of {{C|benin|Benin}}, in what is now southern {{C|nigeria|Nigeria}}, was famous for {{U|it's|its}} metalwork. Craftsmen there had been casting brass and bronze since the thirteenth {{S|centry|century}}. They used a method called lost-wax {{P|casting|casting,}} in which a wax model is covered in clay and then melted away. In {{P|1897|1897,}} a {{C|british|British}} force attacked Benin City and removed thousands of these {{S|objets|objects}}. Most of them were sold to museums in Europe. {{U|There|Their}} return has been argued about ever since. In 2022, {{C|germany|Germany}} agreed to hand back more than a thousand {{S|peices|pieces}}.`,
  },
  {
    id: 'history-nok',
    title: 'The Nok Culture',
    band: [8, 12],
    text: `In {{P|1928|1928,}} a tin miner working near the village of {{C|nok|Nok}} in central {{C|nigeria|Nigeria}} turned up a small terracotta head. Nobody knew how old it {{U|were|was}}. {{S|Archaeologests|Archaeologists}} later dated the Nok sculptures to more than two thousand years {{P|ago|ago,}} which makes them among the oldest figurative art in West Africa. The people who made them also smelted {{S|irone|iron}}, and {{U|there|their}} furnaces have been found across the {{C|jos|Jos}} Plateau. We still do not know what the figures were for. Some scholars believe they stood in {{P|shrines|shrines,}} but the {{S|evidance|evidence}} is thin.`,
  },
  {
    id: 'history-railway',
    title: 'The Lagos to Kano Railway',
    band: [7, 11],
    text: `Work on {{P|Nigerias|Nigeria’s}} first railway began in {{P|1896|1896,}} and the line reached {{C|ibadan|Ibadan}} five years later. The engineers faced heavy rain, thick {{P|forest|forest,}} and {{S|dificult|difficult}} ground. By {{P|1912|1912,}} the track had been pushed as far north as {{C|kano|Kano}}, a journey of more than one thousand {{S|kilometeres|kilometres}}. Trains carried groundnuts and cotton to the coast for {{S|exsport|export}}. The railway changed which towns grew and which {{U|was|were}} left behind. {{C|today|Today}} much of the old line is disused, although parts of it have been rebuilt.`,
  },
];
