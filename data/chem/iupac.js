/* ── IUPAC NAMES BANK ────────────────────────────────────────────────────
   Compounds a secondary-school chemistry student names the IUPAC way, in two
   categories: inorganic and organic. Feeds the Vocab hangman's two "IUPAC
   Names" topics under Chemistry AND the dictionary cards (with a formula ⇄
   structure toggle drawn from PubChem). One source of truth.

   `name`  — the SYSTEMATIC IUPAC name (the hangman ANSWER; shown on the card).
             Inorganic uses the systematic stock/oxo style taught here, e.g.
             H2SO4 → "tetraoxosulfate(VI) acid", CO2 → "carbon(IV) oxide" —
             NOT the trivial "sulfuric acid" / "carbon dioxide".
   formula — the plain formula string ("H2SO4", "CH3CH2OH"); digit runs render
             as subscripts. It is also the clue, so it must not spell the name.
   common  — the familiar / trivial name plus an everyday hint, for the clue
             and card (the drill is "common name → systematic name").
   pc      — a PubChem-resolvable name for the 2-D structure image (the trivial
             name for inorganic; for organic the IUPAC name resolves, so pc is
             omitted and the name is used).
*/

export const CATEGORIES = [
  {
    key: 'inorganic',
    label: 'Inorganic',
    compounds: [
      { name: 'sodium chloride', formula: 'NaCl', common: 'common table salt', pc: 'sodium chloride' },
      { name: 'potassium chloride', formula: 'KCl', common: 'a salt substitute', pc: 'potassium chloride' },
      { name: 'calcium oxide', formula: 'CaO', common: 'quicklime', pc: 'calcium oxide' },
      { name: 'magnesium oxide', formula: 'MgO', common: 'white ash of a burnt ribbon', pc: 'magnesium oxide' },
      { name: 'calcium hydroxide', formula: 'Ca(OH)2', common: 'slaked lime', pc: 'calcium hydroxide' },
      { name: 'sodium hydroxide', formula: 'NaOH', common: 'caustic soda', pc: 'sodium hydroxide' },
      { name: 'potassium hydroxide', formula: 'KOH', common: 'caustic potash', pc: 'potassium hydroxide' },
      { name: 'calcium trioxocarbonate(IV)', formula: 'CaCO3', common: 'calcium carbonate — limestone and chalk', pc: 'calcium carbonate' },
      { name: 'sodium trioxocarbonate(IV)', formula: 'Na2CO3', common: 'sodium carbonate — washing soda', pc: 'sodium carbonate' },
      { name: 'sodium hydrogentrioxocarbonate(IV)', formula: 'NaHCO3', common: 'sodium bicarbonate — baking soda', pc: 'sodium bicarbonate' },
      { name: 'carbon(IV) oxide', formula: 'CO2', common: 'carbon dioxide — the gas that puts out flames', pc: 'carbon dioxide' },
      { name: 'carbon(II) oxide', formula: 'CO', common: 'carbon monoxide — a poisonous exhaust gas', pc: 'carbon monoxide' },
      { name: 'tetraoxosulfate(VI) acid', formula: 'H2SO4', common: 'sulfuric acid — oil of vitriol', pc: 'sulfuric acid' },
      { name: 'trioxonitrate(V) acid', formula: 'HNO3', common: 'nitric acid — aqua fortis', pc: 'nitric acid' },
      { name: 'hydrochloric acid', formula: 'HCl', common: 'muriatic acid', pc: 'hydrochloric acid' },
      { name: 'ammonia', formula: 'NH3', common: 'a pungent alkaline gas', pc: 'ammonia' },
      { name: 'ammonium chloride', formula: 'NH4Cl', common: 'sal ammoniac', pc: 'ammonium chloride' },
      { name: 'ammonium trioxonitrate(V)', formula: 'NH4NO3', common: 'ammonium nitrate — a common fertiliser', pc: 'ammonium nitrate' },
      { name: 'iron(III) oxide', formula: 'Fe2O3', common: 'rust', pc: 'iron(III) oxide' },
      { name: 'iron(II) sulfide', formula: 'FeS', common: 'made by heating iron with sulfur', pc: 'iron(II) sulfide' },
      { name: 'copper(II) tetraoxosulfate(VI)', formula: 'CuSO4', common: 'copper(II) sulfate — blue vitriol', pc: 'copper(II) sulfate' },
      { name: 'copper(II) oxide', formula: 'CuO', common: 'the black coat on heated copper', pc: 'copper(II) oxide' },
      { name: 'zinc oxide', formula: 'ZnO', common: 'calamine', pc: 'zinc oxide' },
      { name: 'zinc tetraoxosulfate(VI)', formula: 'ZnSO4', common: 'zinc sulfate — white vitriol', pc: 'zinc sulfate' },
      { name: 'aluminium oxide', formula: 'Al2O3', common: 'alumina, refined from bauxite', pc: 'aluminum oxide' },
      { name: 'lead(II) oxide', formula: 'PbO', common: 'litharge', pc: 'lead(II) oxide' },
      { name: 'sulfur(IV) oxide', formula: 'SO2', common: 'sulfur dioxide — the choking gas from burning sulfur', pc: 'sulfur dioxide' },
      { name: 'nitrogen(IV) oxide', formula: 'NO2', common: 'nitrogen dioxide — a brown acidic gas', pc: 'nitrogen dioxide' },
      { name: 'nitrogen(I) oxide', formula: 'N2O', common: 'nitrous oxide — laughing gas', pc: 'nitrous oxide' },
      { name: 'potassium tetraoxomanganate(VII)', formula: 'KMnO4', common: 'potassium permanganate — a purple oxidiser', pc: 'potassium permanganate' },
      { name: 'potassium heptaoxodichromate(VI)', formula: 'K2Cr2O7', common: 'potassium dichromate — an orange oxidiser', pc: 'potassium dichromate' },
      { name: 'silver trioxonitrate(V)', formula: 'AgNO3', common: 'silver nitrate — used to test for halide ions', pc: 'silver nitrate' },
      { name: 'magnesium tetraoxosulfate(VI)', formula: 'MgSO4', common: 'magnesium sulfate — Epsom salt', pc: 'magnesium sulfate' },
      { name: 'calcium tetraoxosulfate(VI)', formula: 'CaSO4', common: 'calcium sulfate — gypsum, or plaster of Paris', pc: 'calcium sulfate' },
      { name: 'hydrogen peroxide', formula: 'H2O2', common: 'a bleaching antiseptic', pc: 'hydrogen peroxide' },
      { name: 'water', formula: 'H2O', common: 'the universal solvent', pc: 'water' },
    ],
  },
  {
    key: 'organic',
    label: 'Organic',
    compounds: [
      { name: 'methane', formula: 'CH4', common: 'marsh gas, the main natural gas' },
      { name: 'ethane', formula: 'C2H6', common: 'a two-carbon alkane' },
      { name: 'propane', formula: 'C3H8', common: 'bottled cooking gas' },
      { name: 'butane', formula: 'C4H10', common: 'lighter fuel' },
      { name: 'pentane', formula: 'C5H12', common: 'a five-carbon alkane' },
      { name: 'hexane', formula: 'C6H14', common: 'a six-carbon alkane solvent' },
      { name: 'ethene', formula: 'C2H4', common: 'the gas that ripens fruit' },
      { name: 'propene', formula: 'C3H6', common: 'the monomer of a common plastic' },
      { name: 'ethyne', formula: 'C2H2', common: 'the welding gas acetylene' },
      { name: 'methanol', formula: 'CH3OH', common: 'wood spirit' },
      { name: 'ethanol', formula: 'C2H5OH', common: 'the alcohol in drinks' },
      { name: 'propan-1-ol', formula: 'CH3CH2CH2OH', common: 'a straight three-carbon alcohol' },
      { name: 'propan-2-ol', formula: 'CH3CH(OH)CH3', common: 'rubbing alcohol' },
      { name: 'butan-1-ol', formula: 'CH3CH2CH2CH2OH', common: 'a straight four-carbon alcohol' },
      { name: 'methanoic acid', formula: 'HCOOH', common: 'the sting in an ant bite' },
      { name: 'ethanoic acid', formula: 'CH3COOH', common: 'the sour part of vinegar' },
      { name: 'propanoic acid', formula: 'CH3CH2COOH', common: 'a three-carbon acid' },
      { name: 'ethanedioic acid', formula: '(COOH)2', common: 'oxalic acid, found in rhubarb' },
      { name: 'methanal', formula: 'HCHO', common: 'formalin, a preservative' },
      { name: 'ethanal', formula: 'CH3CHO', common: 'acetaldehyde' },
      { name: 'propanone', formula: 'CH3COCH3', common: 'acetone, a nail-polish remover' },
      { name: 'propanal', formula: 'CH3CH2CHO', common: 'a three-carbon aldehyde' },
      { name: 'chloromethane', formula: 'CH3Cl', common: 'a one-carbon haloalkane' },
      { name: 'chloroethane', formula: 'C2H5Cl', common: 'a two-carbon haloalkane' },
      { name: 'dichloromethane', formula: 'CH2Cl2', common: 'a common lab solvent' },
      { name: 'trichloromethane', formula: 'CHCl3', common: 'chloroform' },
      { name: 'tetrachloromethane', formula: 'CCl4', common: 'a dry-cleaning solvent' },
      { name: 'chloroethene', formula: 'CH2CHCl', common: 'the monomer of PVC' },
      { name: 'methanamine', formula: 'CH3NH2', common: 'the simplest amine' },
      { name: 'ethanamide', formula: 'CH3CONH2', common: 'the simplest ethanoic amide' },
      { name: 'benzene', formula: 'C6H6', common: 'a ring of six carbons' },
      { name: 'phenol', formula: 'C6H5OH', common: 'carbolic acid' },
      { name: 'methylbenzene', formula: 'C6H5CH3', common: 'toluene' },
      { name: 'methoxymethane', formula: 'CH3OCH3', common: 'dimethyl ether' },
      { name: 'ethoxyethane', formula: 'C2H5OC2H5', common: 'the old surgical anaesthetic ether' },
      { name: 'ethyl ethanoate', formula: 'CH3COOC2H5', common: 'a fruity-smelling ester' },
    ],
  },
];
