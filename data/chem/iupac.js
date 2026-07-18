/* ── IUPAC NAMES BANK ────────────────────────────────────────────────────
   Compounds a secondary-school chemistry student is expected to name the
   IUPAC way, in two categories: inorganic and organic. Feeds the Vocab
   hangman's two "IUPAC Names" topics under Chemistry AND the dictionary cards
   (the study library). One source of truth, mirroring the laws bank.

   Each entry:
     name    — the IUPAC name (the hangman ANSWER; shown on the study card).
     formula — the compound's formula as a PLAIN string ("H2SO4", "CH3CH2OH").
               Digit runs are rendered as subscripts (no MathJax needed); the
               formula is also the hangman clue, so it must not spell the name.
     common  — a short trivial name / everyday hint for the clue and card. Kept
               free of the answer's own words (a clue that names itself is no
               puzzle — the vocab house rule).
*/

export const CATEGORIES = [
  {
    key: 'inorganic',
    label: 'Inorganic',
    compounds: [
      { name: 'sodium chloride', formula: 'NaCl', common: 'common table salt' },
      { name: 'potassium chloride', formula: 'KCl', common: 'a salt substitute' },
      { name: 'calcium oxide', formula: 'CaO', common: 'quicklime' },
      { name: 'magnesium oxide', formula: 'MgO', common: 'white ash of a burnt ribbon' },
      { name: 'calcium hydroxide', formula: 'Ca(OH)2', common: 'slaked lime' },
      { name: 'sodium hydroxide', formula: 'NaOH', common: 'caustic soda' },
      { name: 'potassium hydroxide', formula: 'KOH', common: 'caustic potash' },
      { name: 'calcium carbonate', formula: 'CaCO3', common: 'limestone and chalk' },
      { name: 'sodium carbonate', formula: 'Na2CO3', common: 'washing soda' },
      { name: 'sodium hydrogencarbonate', formula: 'NaHCO3', common: 'baking soda' },
      { name: 'carbon dioxide', formula: 'CO2', common: 'the gas that puts out flames' },
      { name: 'carbon monoxide', formula: 'CO', common: 'a poisonous exhaust gas' },
      { name: 'sulfuric acid', formula: 'H2SO4', common: 'oil of vitriol' },
      { name: 'nitric acid', formula: 'HNO3', common: 'aqua fortis' },
      { name: 'hydrochloric acid', formula: 'HCl', common: 'muriatic acid' },
      { name: 'ammonia', formula: 'NH3', common: 'a pungent alkaline gas' },
      { name: 'ammonium chloride', formula: 'NH4Cl', common: 'sal ammoniac' },
      { name: 'ammonium nitrate', formula: 'NH4NO3', common: 'a common fertiliser' },
      { name: 'iron(III) oxide', formula: 'Fe2O3', common: 'rust' },
      { name: 'iron(II) sulfide', formula: 'FeS', common: 'made by heating iron with sulfur' },
      { name: 'copper(II) sulfate', formula: 'CuSO4', common: 'blue vitriol' },
      { name: 'copper(II) oxide', formula: 'CuO', common: 'the black coat on heated copper' },
      { name: 'zinc oxide', formula: 'ZnO', common: 'calamine' },
      { name: 'zinc sulfate', formula: 'ZnSO4', common: 'white vitriol' },
      { name: 'aluminium oxide', formula: 'Al2O3', common: 'alumina, refined from bauxite' },
      { name: 'lead(II) oxide', formula: 'PbO', common: 'litharge' },
      { name: 'sulfur dioxide', formula: 'SO2', common: 'the choking gas from burning sulfur' },
      { name: 'nitrogen dioxide', formula: 'NO2', common: 'a brown acidic gas' },
      { name: 'dinitrogen monoxide', formula: 'N2O', common: 'laughing gas' },
      { name: 'potassium manganate(VII)', formula: 'KMnO4', common: 'a purple oxidising agent' },
      { name: 'potassium dichromate(VI)', formula: 'K2Cr2O7', common: 'an orange oxidising agent' },
      { name: 'silver nitrate', formula: 'AgNO3', common: 'used to test for halide ions' },
      { name: 'magnesium sulfate', formula: 'MgSO4', common: 'Epsom salt' },
      { name: 'calcium sulfate', formula: 'CaSO4', common: 'gypsum, or plaster of Paris' },
      { name: 'hydrogen peroxide', formula: 'H2O2', common: 'a bleaching antiseptic' },
      { name: 'water', formula: 'H2O', common: 'the universal solvent' },
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
