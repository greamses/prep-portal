/* ── IUPAC NAMES BANK ────────────────────────────────────────────────────
   Compounds a secondary-school chemistry student names the IUPAC way, in two
   categories: inorganic and organic. Feeds the Vocab hangman's two "IUPAC
   Names" topics under Chemistry AND the dictionary cards (with a formula ⇄
   structure toggle). One source of truth.

   `name`   — the SYSTEMATIC IUPAC name (the hangman ANSWER; shown on the card).
              Inorganic uses the Nigerian/WAEC oxo-stock style with British
              'ph': H2SO4 → "tetraoxosulphate(VI) acid", CO2 → "carbon(IV)
              oxide", KMnO4 → "potassium tetraoxomanganate(VII)" — NOT trivial
              names.
   formula  — the plain formula string ("H2SO4", "CH3CH2OH"); digit runs render
              as subscripts. Also the clue, so it must not spell the name.
   common   — the trivial name plus an everyday hint, for the clue and card.
   smiles   — the structure, drawn to SVG at BUILD time by RDKit (see
              scripts... / data/chem/structures.js). No runtime library/API.
*/

export const CATEGORIES = [
  {
    key: 'inorganic',
    label: 'Inorganic',
    compounds: [
      { name: 'sodium chloride', formula: 'NaCl', common: 'common table salt', smiles: '[Na+].[Cl-]' },
      { name: 'potassium chloride', formula: 'KCl', common: 'a salt substitute', smiles: '[K+].[Cl-]' },
      { name: 'calcium oxide', formula: 'CaO', common: 'quicklime', smiles: '[Ca+2].[O-2]' },
      { name: 'magnesium oxide', formula: 'MgO', common: 'white ash of a burnt ribbon', smiles: '[Mg+2].[O-2]' },
      { name: 'calcium hydroxide', formula: 'Ca(OH)2', common: 'slaked lime', smiles: '[Ca+2].[OH-].[OH-]' },
      { name: 'sodium hydroxide', formula: 'NaOH', common: 'caustic soda', smiles: '[Na+].[OH-]' },
      { name: 'potassium hydroxide', formula: 'KOH', common: 'caustic potash', smiles: '[K+].[OH-]' },
      { name: 'calcium trioxocarbonate(IV)', formula: 'CaCO3', common: 'calcium carbonate — limestone and chalk', smiles: '[Ca+2].[O-]C(=O)[O-]' },
      { name: 'sodium trioxocarbonate(IV)', formula: 'Na2CO3', common: 'sodium carbonate — washing soda', smiles: '[Na+].[Na+].[O-]C(=O)[O-]' },
      { name: 'sodium hydrogentrioxocarbonate(IV)', formula: 'NaHCO3', common: 'sodium bicarbonate — baking soda', smiles: '[Na+].OC(=O)[O-]' },
      { name: 'carbon(IV) oxide', formula: 'CO2', common: 'carbon dioxide — the gas that puts out flames', smiles: 'O=C=O' },
      { name: 'carbon(II) oxide', formula: 'CO', common: 'carbon monoxide — a poisonous exhaust gas', smiles: '[C-]#[O+]' },
      { name: 'tetraoxosulphate(VI) acid', formula: 'H2SO4', common: 'sulphuric acid — oil of vitriol', smiles: 'OS(=O)(=O)O' },
      { name: 'trioxonitrate(V) acid', formula: 'HNO3', common: 'nitric acid — aqua fortis', smiles: 'O[N+](=O)[O-]' },
      { name: 'hydrochloric acid', formula: 'HCl', common: 'muriatic acid', smiles: '[H]Cl' },
      { name: 'ammonia', formula: 'NH3', common: 'a pungent alkaline gas', smiles: '[H]N([H])[H]' },
      { name: 'ammonium chloride', formula: 'NH4Cl', common: 'sal ammoniac', smiles: '[NH4+].[Cl-]' },
      { name: 'ammonium trioxonitrate(V)', formula: 'NH4NO3', common: 'ammonium nitrate — a common fertiliser', smiles: '[NH4+].[O-][N+](=O)[O-]' },
      { name: 'iron(III) oxide', formula: 'Fe2O3', common: 'rust', smiles: '[Fe+3].[Fe+3].[O-2].[O-2].[O-2]' },
      { name: 'iron(II) sulphide', formula: 'FeS', common: 'made by heating iron with sulphur', smiles: '[Fe+2].[S-2]' },
      { name: 'copper(II) tetraoxosulphate(VI)', formula: 'CuSO4', common: 'copper(II) sulphate — blue vitriol', smiles: '[Cu+2].[O-]S(=O)(=O)[O-]' },
      { name: 'copper(II) oxide', formula: 'CuO', common: 'the black coat on heated copper', smiles: '[Cu+2].[O-2]' },
      { name: 'zinc oxide', formula: 'ZnO', common: 'calamine', smiles: '[Zn+2].[O-2]' },
      { name: 'zinc tetraoxosulphate(VI)', formula: 'ZnSO4', common: 'zinc sulphate — white vitriol', smiles: '[Zn+2].[O-]S(=O)(=O)[O-]' },
      { name: 'aluminium oxide', formula: 'Al2O3', common: 'alumina, refined from bauxite', smiles: '[Al+3].[Al+3].[O-2].[O-2].[O-2]' },
      { name: 'lead(II) oxide', formula: 'PbO', common: 'litharge', smiles: '[Pb+2].[O-2]' },
      { name: 'sulphur(IV) oxide', formula: 'SO2', common: 'sulphur dioxide — the choking gas from burning sulphur', smiles: 'O=S=O' },
      { name: 'nitrogen(IV) oxide', formula: 'NO2', common: 'nitrogen dioxide — a brown acidic gas', smiles: '[O]N=O' },
      { name: 'nitrogen(I) oxide', formula: 'N2O', common: 'nitrous oxide — laughing gas', smiles: '[N-]=[N+]=O' },
      { name: 'potassium tetraoxomanganate(VII)', formula: 'KMnO4', common: 'potassium permanganate — a purple oxidiser', smiles: '[K+].[O-][Mn](=O)(=O)=O' },
      { name: 'potassium heptaoxodichromate(VI)', formula: 'K2Cr2O7', common: 'potassium dichromate — an orange oxidiser', smiles: '[K+].[K+].[O-][Cr](=O)(=O)O[Cr](=O)(=O)[O-]' },
      { name: 'silver trioxonitrate(V)', formula: 'AgNO3', common: 'silver nitrate — used to test for halide ions', smiles: '[Ag+].[O-][N+](=O)[O-]' },
      { name: 'magnesium tetraoxosulphate(VI)', formula: 'MgSO4', common: 'magnesium sulphate — Epsom salt', smiles: '[Mg+2].[O-]S(=O)(=O)[O-]' },
      { name: 'calcium tetraoxosulphate(VI)', formula: 'CaSO4', common: 'calcium sulphate — gypsum, or plaster of Paris', smiles: '[Ca+2].[O-]S(=O)(=O)[O-]' },
      { name: 'hydrogen peroxide', formula: 'H2O2', common: 'a bleaching antiseptic', smiles: 'OO' },
      { name: 'water', formula: 'H2O', common: 'the universal solvent', smiles: '[H]O[H]' },
    ],
  },
  {
    key: 'organic',
    label: 'Organic',
    compounds: [
      { name: 'methane', formula: 'CH4', common: 'marsh gas, the main natural gas', smiles: '[H]C([H])([H])[H]' },
      { name: 'ethane', formula: 'C2H6', common: 'a two-carbon alkane', smiles: 'CC' },
      { name: 'propane', formula: 'C3H8', common: 'bottled cooking gas', smiles: 'CCC' },
      { name: 'butane', formula: 'C4H10', common: 'lighter fuel', smiles: 'CCCC' },
      { name: 'pentane', formula: 'C5H12', common: 'a five-carbon alkane', smiles: 'CCCCC' },
      { name: 'hexane', formula: 'C6H14', common: 'a six-carbon alkane solvent', smiles: 'CCCCCC' },
      { name: 'ethene', formula: 'C2H4', common: 'the gas that ripens fruit', smiles: 'C=C' },
      { name: 'propene', formula: 'C3H6', common: 'the monomer of a common plastic', smiles: 'CC=C' },
      { name: 'ethyne', formula: 'C2H2', common: 'the welding gas acetylene', smiles: 'C#C' },
      { name: 'methanol', formula: 'CH3OH', common: 'wood spirit', smiles: 'CO' },
      { name: 'ethanol', formula: 'C2H5OH', common: 'the alcohol in drinks', smiles: 'CCO' },
      { name: 'propan-1-ol', formula: 'CH3CH2CH2OH', common: 'a straight three-carbon alcohol', smiles: 'CCCO' },
      { name: 'propan-2-ol', formula: 'CH3CH(OH)CH3', common: 'rubbing alcohol', smiles: 'CC(O)C' },
      { name: 'butan-1-ol', formula: 'CH3CH2CH2CH2OH', common: 'a straight four-carbon alcohol', smiles: 'CCCCO' },
      { name: 'methanoic acid', formula: 'HCOOH', common: 'the sting in an ant bite', smiles: 'OC=O' },
      { name: 'ethanoic acid', formula: 'CH3COOH', common: 'the sour part of vinegar', smiles: 'CC(=O)O' },
      { name: 'propanoic acid', formula: 'CH3CH2COOH', common: 'a three-carbon acid', smiles: 'CCC(=O)O' },
      { name: 'ethanedioic acid', formula: '(COOH)2', common: 'oxalic acid, found in rhubarb', smiles: 'OC(=O)C(=O)O' },
      { name: 'methanal', formula: 'HCHO', common: 'formalin, a preservative', smiles: 'C=O' },
      { name: 'ethanal', formula: 'CH3CHO', common: 'acetaldehyde', smiles: 'CC=O' },
      { name: 'propanone', formula: 'CH3COCH3', common: 'acetone, a nail-polish remover', smiles: 'CC(=O)C' },
      { name: 'propanal', formula: 'CH3CH2CHO', common: 'a three-carbon aldehyde', smiles: 'CCC=O' },
      { name: 'chloromethane', formula: 'CH3Cl', common: 'a one-carbon haloalkane', smiles: 'CCl' },
      { name: 'chloroethane', formula: 'C2H5Cl', common: 'a two-carbon haloalkane', smiles: 'CCCl' },
      { name: 'dichloromethane', formula: 'CH2Cl2', common: 'a common lab solvent', smiles: 'ClCCl' },
      { name: 'trichloromethane', formula: 'CHCl3', common: 'chloroform', smiles: 'ClC(Cl)Cl' },
      { name: 'tetrachloromethane', formula: 'CCl4', common: 'a dry-cleaning solvent', smiles: 'ClC(Cl)(Cl)Cl' },
      { name: 'chloroethene', formula: 'CH2CHCl', common: 'the monomer of PVC', smiles: 'C=CCl' },
      { name: 'methanamine', formula: 'CH3NH2', common: 'the simplest amine', smiles: 'CN' },
      { name: 'ethanamide', formula: 'CH3CONH2', common: 'the simplest ethanoic amide', smiles: 'CC(N)=O' },
      { name: 'benzene', formula: 'C6H6', common: 'a ring of six carbons', smiles: 'c1ccccc1' },
      { name: 'phenol', formula: 'C6H5OH', common: 'carbolic acid', smiles: 'Oc1ccccc1' },
      { name: 'methylbenzene', formula: 'C6H5CH3', common: 'toluene', smiles: 'Cc1ccccc1' },
      { name: 'methoxymethane', formula: 'CH3OCH3', common: 'dimethyl ether', smiles: 'COC' },
      { name: 'ethoxyethane', formula: 'C2H5OC2H5', common: 'the old surgical anaesthetic ether', smiles: 'CCOCC' },
      { name: 'ethyl ethanoate', formula: 'CH3COOC2H5', common: 'a fruity-smelling ester', smiles: 'CCOC(C)=O' },
    ],
  },
];
