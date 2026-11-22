export interface Card {
  id: string;
  topic: string;
  term: string;
  front: string;
  back: string;
  alt?: string[];
  opts?: string[];
  only?: 'mc' | 'id' | 'tf';
  tf?: boolean;
  why?: string;
}

export interface Topic {
  id: string;
  subject: string;
  title: string;
  intro: string;
  remember: string;
  level: string;
  note?: string;
  meta?: string;
}

export const COURSE_META = {
  appName: 'Senior Reviewer',
  courseTitle: 'CCP 1 · Principles of Crop Protection',
  subtitle: 'Sorsogon State University · Castilla Campus · AY 2026–2027',
  defaultStudentName: 'Scholar',
};

type Row = [back: string, front: string, term?: string, why?: string];

function makeCard(
  id: string,
  topic: string,
  row: Row,
  extra: Partial<Card> = {}
): Card {
  const [back, front, customTerm, why] = row;
  return {
    id,
    topic,
    term: customTerm ?? back,
    front,
    back,
    ...(why ? { why } : {}),
    ...extra,
  };
}

function clue(
  prefix: string,
  topic: string,
  rows: Array<
    | [back: string, front: string, opts?: string[], why?: string]
    | [back: string, front: string]
  >
): Card[] {
  return rows.map((row, i) => {
    const num = String(i + 1).padStart(2, '0');
    const [back, front, opts, why] = row;
    return makeCard(`${prefix}-${num}`, topic, [back, front, back, why], {
      ...(opts && opts.length ? { opts, only: 'mc' as const } : {}),
    });
  });
}

function idc(
  id: string,
  topic: string,
  back: string,
  front: string,
  alt?: string[],
  why?: string
): Card {
  return makeCard(id, topic, [back, front, back, why], {
    only: 'id',
    ...(alt ? { alt } : {}),
  });
}

function withAlt(
  id: string,
  topic: string,
  back: string,
  front: string,
  alt: string[],
  extra: Partial<Card> = {}
): Card {
  return makeCard(id, topic, [back, front, back], { alt, ...extra });
}

function tfc(
  id: string,
  topic: string,
  term: string,
  statement: string,
  answer: 'True' | 'False',
  why: string
): Card {
  return {
    id,
    topic,
    term,
    front: statement,
    back: answer,
    only: 'tf',
    tf: true,
    why,
  };
}

export const TOPICS: Topic[] = [
  {
    id: 'weeds-fundamentals',
    subject: 'Crop Protection 1',
    level: 'Lesson 3.1a–3.1d',
    meta: 'Module 1 · Instructor: Lorelyn S. Tagaban, MSci.',
    title: 'Weed Science, Concepts & Characteristics',
    intro:
      'Introduces weed science, definitions and role of weeds in agriculture, historical context from Jethru Tull (1731), the relative concept of a weed, weed survival traits, benefits, and harmful impacts as crop competitors and disease/pest hosts.',
    remember:
      'Weeds cause about 10% crop yield and financial losses per year worldwide, and a plant becomes a weed as a function of time and place—causing significant damage even at low densities.',
    note: 'Source text uses "Jethru Tull", "Hoeing Husbandry", "Ccompete", "Characteristics of Weeds Crops", "Propagules posses dormancy", and an unclosed "(Brassica species" parenthesis on p. 6; the Lesson 3.1 Summary on p. 3 also ends mid-phrase with "change in Weed".',
  },
  {
    id: 'weeds-classification',
    subject: 'Crop Protection 1',
    level: 'Lesson 3.1e–3.1i',
    meta: 'Module 1 · Life Cycle, Morphology & Management',
    title: 'Weed Classification, Impact, Reproduction & Management',
    intro:
      'Covers weed classification by life cycle (annuals, biennials, perennials) and growth characteristics (broadleaf, grasses, sedges), effects on human health and water dams, sexual vs. vegetative reproduction, crop-weed competition, population dynamics, dispersal, and the four weed control methods.',
    remember:
      'Distinguish grass vs. sedge stems: grasses have jointed, usually hollow circular stems, while sedges have solid, unjointed triangular stems and thrive in wet, poorly drained soils.',
    note: 'Source spells "Must thistle" (p. 7), "Prostrat spurge" (p. 7), and "Elusine indica" (p. 8). The four Weed Control Methods (Cultural, Physical, Chemical, Biological) come from the diagram on p. 11.',
  },
  {
    id: 'arthropods-insects',
    subject: 'Crop Protection 1',
    level: 'Lesson 3.2a–3.2b, 3.2d–3.2f',
    meta: 'Module 1 · Entomology, Mites, Behavior & Management',
    title: 'Entomology, Insect & Mite Anatomy, Behavior & Roles',
    intro:
      'Defines entomology and phylum Arthropoda (~84% of known animal species), compares Class Insecta (Hexapoda) with mites (Chelicerata), reviews labeled insect and mite anatomy diagrams, contrasts innate vs. learned insect behavior, and outlines insect importance and management strategies.',
    remember:
      'Insects have three body regions (head, three-segmented thorax with 3 pairs of legs, and many-segmented abdomen), whereas mites belong to Chelicerata and are organized into Gnathosoma/Capitulum and Idiosoma.',
    note: 'Anatomy terms follow the Wigglesworth (2023) insect diagram and Walter & Proctor (2013) mite diagram on p. 14.',
  },
  {
    id: 'insect-orders',
    subject: 'Crop Protection 1',
    level: 'Lesson 3.2c',
    meta: 'Chart of 30 Insect Orders · Gullan & Cranston (2020)',
    title: 'Insect Orders: Wings, Mouthparts & Metamorphosis',
    intro:
      'Covers the hierarchical classification chart of insect orders, matching representative examples (beetles, butterflies, flies, bees, true bugs, grasshoppers, dragonflies, thrips, fleas, lice, and more) with their wing structure, adult mouthparts, and metamorphosis type.',
    remember:
      'Look out for key exceptions: Thysanoptera (thrips) have metamorphosis "between incomplete and complete", Ephemeroptera (mayflies) and Strepsiptera have vestigial mouthparts, and Archaeognatha & Thysanura have no wings and no metamorphosis.',
    note: 'In the pp. 15–17 table (headed "30 orders"), Blattodea appears twice—once for Cockroaches and once for Termites (Isoptera is not listed separately). Diptera lists "back legs modified into halters" and Odonata lists "abundant rubs" verbatim; Megaloptera, Neuroptera, and Raphidioptera share identical wing/mouthpart/metamorphosis descriptions.',
  },
  {
    id: 'vertebrate-pests',
    subject: 'Crop Protection 1',
    level: 'Lesson 3.2g',
    meta: 'Module 1 · Philippine Agriculture',
    title: 'Vertebrate Pests & Invasive Species',
    intro:
      'Explains vertebrate pests (Subphylum Chordata) and invasive species in Philippine agriculture, detailing the five major rodent pests (Order Rodentia) plus minor vertebrate pests: bats, crab-eating macaques, grain-eating birds (Class Aves), and Philippine wild pigs.',
    remember:
      'Major vertebrate pests are the five rodents (Rattus rattus complex, R. argentiventer, R. exulans, R. norvegicus, and Mus musculus castaneus); minor vertebrate pests are bats, monkeys, birds, and Philippine wild pigs.',
    note: 'Lesson 3.2 Summary (p. 12) mentions "snails, scale insects" under Philippine invasive species, but they are absent from pp. 20–22. Native Philippine bats and wild pigs also appear under the "Examples of invasive species" heading, and source spellings "spinal chord", "Means", and "Berkenhont" are preserved.',
  },
  {
    id: 'ipm-concepts',
    subject: 'Crop Protection 1',
    level: 'Lesson 3.3 Intro, A–C',
    meta: 'Module 1 · History, Cardinal Axiom, ETL & EIL',
    title: 'IPM History, Principles, Thresholds & Diagnosis',
    intro:
      'Traces the history of Integrated Pest Management from 18th–19th century husbandry through the 1900s–1940s chemical revolution, Rachel Carson’s Silent Spring (1962), 1970s agriculture, and 1980s BIRC publications, then covers the cardinal axiom, goals, ETL vs. EIL, diagnosis ("complexes"), and field factors.',
    remember:
      'The cardinal axiom of IPM is that one pest control method will not be successful. Action is taken at the Economic Threshold Level (ETL) to prevent pests from reaching the higher Economic Injury Level (EIL).',
    note: 'On p. 27, the "Weather Conditions" graphic contains small illegible boxes beneath its title; only the legible module text and the 6-stage "Integrated Pest Management Basic Principles" diagram are included.',
  },
  {
    id: 'ipm-methods',
    subject: 'Crop Protection 1',
    level: 'Lesson 3.3 D (1–5)',
    meta: 'Module 1 · Cultural, Mechanical, Biological, Chemical & Regulatory',
    title: 'IPM Control Methods & Pesticide Color Categories',
    intro:
      'Details the five pest management approaches in IPM planning—Cultural, Mechanical/Physical, Biological (including Bio Control Agents percentages), Chemical (including the four color-coded pesticide toxicity categories), and Regulatory Practices—along with advantages, disadvantages, and the Friendly Reminder.',
    remember:
      'Pesticide toxicity color codes go from Category 1 Red (Extremely toxic, 1–50 mg/kg) -> Category 2 Yellow (51–500 mg/kg) -> Category 3 Blue (501–5000 mg/kg) -> Category 4 Green (Slightly toxic, > 5000 mg/kg).',
    note: 'Source lists "The pest is unstable" under Biological Control Advantages (p. 29), "not environmentally begun" under Cultural Disadvantages (p. 28), "Timeless and Flexibility" under Chemical Advantages (p. 30), and drops the leading "S" and "R" in "urvey and detection" and "etardation of spread" on p. 31.',
  },
];

export const CARDS: Card[] = [
  // ================= TOPIC 1: weeds-fundamentals (25 cards) =================
  ...clue('wf', 'weeds-fundamentals', [
    [
      'Weed science',
      '________ studies vegetation management in agricultural production systems, natural areas, and properties in residential and urban areas.',
    ],
    [
      'Biology, taxonomy, ecology, and herbicides',
      'Areas involved in weed science (3.1a) include biological control, cropping systems, integrated management, conservation tillage, transgenic crop tolerance, precision technology, and ________.',
      [
        'Vertebrate anatomy, mammalia, and aves',
        'Museum collection care and fumigant gases',
        'Insect metamorphosis and wing venation',
      ],
    ],
    [
      'Space, sunlight, water, and nutrients',
      'In the field, weeds compete with the main crops for ________.',
      [
        'Soil temperature, humidity, and day length',
        'Pollen, nectar, and seed dormancy',
        'Tillage, mulching, and crop rotation',
      ],
    ],
    [
      'Crop management system',
      'A ________ is a technology that comprises all planning, establishment, management, and postharvest to enable to maximize profit and quality of market produce.',
    ],
    [
      'Habitat and hosts for insect pests and plant diseases',
      'Besides competing with crops and causing yield losses, weeds also serve as potential ________.',
      [
        'Replacement for synthetic fertilizers',
        'Permanent barriers against all wind dispersal',
        'Primary pollinators for cereal crops',
      ],
    ],
    [
      'Time and place',
      'A plant becomes a weed as a function of ________ (for example, tall weeds on roadsides became dangerous after the invention of the automobile).',
    ],
    [
      'Propagules possess dormancy',
      'Key characteristics of weeds listed in 3.1d include rapid vegetative growth, profuse root production, survival in adverse conditions, damage at low densities, and ________.',
      [
        'Strictly annual life cycles without seed banks',
        'Dependence on insect pollination only',
        'Inability of buried seeds to survive',
      ],
    ],
    [
      'Soil stabilization and wildlife habitat',
      'Benefits of weeds listed in 3.1d include nectar for bees, adding organic matter, genetic reservoir, human consumption, employment opportunities, and ________.',
      [
        'Increasing chemical pesticide residues',
        'Replacing all cultivated crop varieties',
        'Eliminating soil moisture competition',
      ],
    ],
    [
      'Powdery mildew',
      'Prickly lettuce (Lactuca scariola) and sow thistle (Sonchus species) are listed as weed hosts of the plant disease ________.',
    ],
    [
      'Prickly lettuce and sow thistle',
      'According to p. 6, powdery mildew is hosted by ________.',
      [
        'Wild mustards, saltbrush, and Russian thistle',
        'Water hyacinth and cabomba',
        'Foxtails and tarweeds',
      ],
    ],
    [
      'Clubroot of cabbage',
      'Wild mustards (Brassica species), saltbrush (Atriplex species), and Russian thistle act as weed hosts for ________.',
    ],
    [
      'Wild mustards, saltbrush, and Russian thistle',
      'According to p. 6, clubroot of cabbage is hosted by ________.',
      [
        'Prickly lettuce and sow thistle',
        'Crabgrass and Parthenium hysterophorus',
        'Barnyardgrass and yellow foxtail',
      ],
    ],
    [
      'Parthenium hysterophorus',
      'Alongside crabgrass (Digitaria sanguinalis), ________ is shown on p. 6 as a weed host of insect pests and an invasive species.',
    ],
  ]),
  withAlt(
    'wf-14',
    'weeds-fundamentals',
    'Weed',
    'A ________ is any plant growing where it is not wanted, a plant that interferes with human activities, or any plant growing out of place.',
    ['Weeds']
  ),
  withAlt(
    'wf-15',
    'weeds-fundamentals',
    'Jethru Tull',
    '________ (Great Britain) was the first person who defined weeds in 1731 in his book "Hoeing Husbandry".',
    ['Jethro Tull']
  ),
  withAlt(
    'wf-16',
    'weeds-fundamentals',
    'Hoeing Husbandry',
    'Jethru Tull defined weeds in 1731 in his book titled "________".',
    ['Horse-Hoeing Husbandry']
  ),
  withAlt(
    'wf-17',
    'weeds-fundamentals',
    'Foxtails (Alopecurus species)',
    'In rangelands and pastures, lodging of ________ in horse mouths can cause injuries to animals.',
    ['Foxtails', 'Alopecurus', 'Alopecurus species']
  ),
  withAlt(
    'wf-18',
    'weeds-fundamentals',
    'Tarweeds (Madia species)',
    'Horses grazing in sticky ________ can lower the value of animal products.',
    ['Tarweeds', 'Madia', 'Madia species']
  ),
  withAlt(
    'wf-19',
    'weeds-fundamentals',
    'Crabgrass (Digitaria sanguinalis)',
    '________ and Parthenium hysterophorus are listed as weeds that serve as hosts of insect pests and invasive species.',
    ['Crabgrass', 'Digitaria sanguinalis']
  ),
  tfc(
    'wf-20',
    'weeds-fundamentals',
    'Relative category of weeds',
    'The category of weeds is ever-changing and relative because some unwanted plants were later cultivated while some cultivated plants escaped and became weeds.',
    'True',
    'True — Lesson 3.1c states that some unwanted plants were found to have virtues and taken under cultivation, while escaped cultivated plants became weeds or invasive species.'
  ),
  tfc(
    'wf-21',
    'weeds-fundamentals',
    'Damage at low densities',
    'Weeds only cause significant crop damage when they grow in very high densities.',
    'False',
    'False — Lesson 3.1d explicitly lists "Cause significant damage even low densities" as a characteristic of weeds.'
  ),
  tfc(
    'wf-22',
    'weeds-fundamentals',
    'Weed biology and ecology',
    'Understanding weed biology and ecology helps farmers assess weed growth patterns and desirable conditions for propagation to adapt suitable weed management.',
    'True',
    'True — Lesson 3.1b emphasizes continuous study and observation of weed biology, ecology, and changing population dynamics.'
  ),
  idc(
    'wf-23',
    'weeds-fundamentals',
    '10%',
    'Weeds are responsible for significant crop yield losses and financial losses in agricultural production in the order of ________ per year worldwide.',
    ['10 percent', 'ten percent']
  ),
  idc(
    'wf-24',
    'weeds-fundamentals',
    '1731',
    'Jethru Tull first defined weeds in the year ________ in his book "Hoeing Husbandry".'
  ),
  withAlt(
    'wf-25',
    'weeds-fundamentals',
    'Long term survival of buried seeds',
    'Alongside induced dormancy and early reproduction, another characteristic of weeds in 3.1d is ________.',
    ['Long-term survival of buried seeds', 'Buried seeds survival'],
    {
      only: 'mc',
      opts: [
        'Short-term seed death within one week',
        'Total absence of root systems',
        'Requirement for animal pollination only',
      ],
    }
  ),

  // ================= TOPIC 2: weeds-classification (34 cards) =================
  ...clue('wc', 'weeds-classification', [
    [
      'Annuals',
      '________ complete their life cycle from seed in less than one year and are generally easy to control because of the seedling stage.',
    ],
    [
      'Summer annuals',
      '________ germinate in the spring, mature, produce flowers and seeds, and die before fall.',
    ],
    [
      'Winter annuals',
      '________ germinate in the fall, overwinter in a seedling or rosette stage, mature, produce flowers and seeds, and die in the spring or early summer.',
    ],
    [
      'Biennials',
      '________ generally complete their life cycle in two years, forming a basal cluster of leaves and a tap root in the first year and a flower stalk in the second.',
    ],
    [
      'Perennials',
      '________ live for more than two years, are most common in blueberry fields, and are generally the most difficult weeds to control.',
    ],
    [
      'Daisy',
      'Among perennial weeds, ________ is the example given for reproducing primarily by seed.',
    ],
    [
      'Sheep sorrel',
      'Among perennial weeds, ________ is the example given for reproducing by both seed and roots.',
    ],
    [
      'Bunchberry',
      'Among perennial weeds, ________ is the example given for reproducing primarily by vegetative means.',
    ],
    [
      'Grasses',
      '________ generally have narrow, upright, parallel-veined leaves and jointed stems that are usually hollow at the internodes and circular in cross section.',
    ],
    [
      'Sedges',
      '________ are grass-like plants common in wet, poorly drained soils whose stems are triangular in cross section, solid, and not jointed.',
    ],
    [
      'Parthenium, Ragweed, Rye grass, and Privet',
      'Weeds cited in 3.1f that impact human health by causing asthma, respiratory problems (especially in children), skin irritation, or poisoning are ________.',
      [
        'Water hyacinth and cabomba',
        'Dandelion, purslane, and velvetleaf',
        'Barnyardgrass, crabgrass, and sandbur',
      ],
    ],
    [
      'Sexual reproduction',
      'Reproduction by seed is called ________ and requires fertilization of an egg by sperm, usually in the form of pollen.',
    ],
    [
      'Rhizomes',
      'Modified underground stems used by perennial weeds in vegetative reproduction are called ________.',
    ],
    [
      'Stolons',
      'Modified above-ground stems used by perennial weeds in vegetative reproduction are called ________.',
    ],
    [
      'Number of species, density, and distribution',
      'Weed infestation in a field is defined in 3.1i by three parameters: ________.',
      [
        'Soil pH, light intensity, and oxygen levels',
        'Seed size, root depth, and leaf venation',
        'Planting date, mulching, and row spacing',
      ],
    ],
    [
      'Soil temperature',
      'Among environmental factors affecting weed population, ________ has a primary influence on seed dormancy and germination, regulating both capacity and speed.',
    ],
    [
      'Weed control',
      '________ is the process of limiting infestation of the weed plant so that crops can be grown profitably.',
    ],
    [
      'Weed management',
      '________ includes prevention, eradication and control by regulated use, restricting invasion, suppression of growth, prevention of seed production, and complete destruction.',
    ],
    [
      'Cultural, Physical, Chemical, and Biological Methods',
      'According to the Weed Control Methods diagram (p. 11), the four weed control methods are ________.',
      [
        'Annual, Biennial, Perennial, and Aquatic Methods',
        'Mechanical, Regulatory, Genetic, and Thermal Methods',
        'Tillage, Mulching, Interseeding, and Rotation Methods',
      ],
    ],
  ]),
  withAlt(
    'wc-20',
    'weeds-classification',
    'Must thistle',
    'In Lesson 3.1e, ________ is the single example listed for biennial weeds.',
    ['Musk thistle']
  ),
  withAlt(
    'wc-21',
    'weeds-classification',
    'Broadleaf weeds',
    '________ generally have two leaves (cotyledons) emerging upon germination, a branching network of veins, and flowers with distinct petals.',
    ['Broadleaf']
  ),
  withAlt(
    'wc-22',
    'weeds-classification',
    'Water Hyacinth (Eichhornia crassipes)',
    '________ and Cabomba (Cabomba caroliniana) are aquatic weeds that can affect drinking water quality if unmanaged within water supply dams.',
    ['Water Hyacinth', 'Eichhornia crassipes']
  ),
  withAlt(
    'wc-23',
    'weeds-classification',
    'Cabomba (Cabomba caroliniana)',
    'Alongside Water Hyacinth, ________ is listed as an aquatic weed that can affect drinking water quality in water supply dams.',
    ['Cabomba', 'Cabomba caroliniana']
  ),
  withAlt(
    'wc-24',
    'weeds-classification',
    'Vegetative (asexual) reproduction',
    'In ________, a new plant develops from a vegetative organ such as a stem, root, or leaf (including rhizomes, stolons, bulbs, corms, and tubers).',
    ['Vegetative reproduction', 'Asexual reproduction']
  ),
  tfc(
    'wc-25',
    'weeds-classification',
    'Sedge vs. Grass stem anatomy',
    'Sedges have hollow, jointed stems that are circular in cross section.',
    'False',
    'False — grasses have jointed, usually hollow, circular stems; sedges have stems that are triangular in cross section, solid, and not jointed.'
  ),
  tfc(
    'wc-26',
    'weeds-classification',
    'Seed dependence across life cycles',
    'Annual and biennial weeds depend on seed production as their sole means of propagation and survival, whereas perennial weeds are less dependent on this mechanism.',
    'True',
    'True — Lesson 3.1g states annuals and biennials depend solely on seed production, while perennials also propagate vegetatively.'
  ),
  withAlt(
    'wc-27',
    'weeds-classification',
    'Interconnected underground root systems',
    'In blueberry fields (p. 7), perennials that are low growing and spread vegetatively by ________ are the most difficult to control.',
    ['Underground root systems'],
    {
      only: 'mc',
      opts: [
        'Winter seedling rosettes',
        'Windborne floating pollen only',
        'Single taproots dying in year two',
      ],
    }
  ),
  withAlt(
    'wc-28',
    'weeds-classification',
    'Grasses, broadleaf weeds, ferns, and herbaceous or woody weeds',
    'Based on growth characteristics (p. 8), weeds are classified into ________.',
    ['Grasses, broadleaf weeds, ferns, herbaceous or woody weeds'],
    {
      only: 'mc',
      opts: [
        'Annuals, biennials, and perennials only',
        'Summer annuals and winter annuals',
        'Rodents, bats, monkeys, and wild pigs',
      ],
    }
  ),
  withAlt(
    'wc-29',
    'weeds-classification',
    'Barnyardgrass (Echinochloa crus-galli), Goosegrass (Elusine indica), Red rice (Oryza sativa), and Johnson grass (Sorghum halepense)',
    'Which group lists grass weed examples (with scientific names) from Lesson 3.1e (p. 8)?',
    ['Barnyardgrass, Goosegrass, Red rice, Johnson grass'],
    {
      only: 'mc',
      opts: [
        'Sedge (Cyperus spp.), Fringerush (Fimbristylis spp), and Eclipta (Eclipta prostrata)',
        'Water Hyacinth (Eichhornia crassipes) and Cabomba (Cabomba caroliniana)',
        'Prickly lettuce (Lactuca scariola) and Sow thistle (Sonchus species)',
      ],
    }
  ),
  withAlt(
    'wc-30',
    'weeds-classification',
    'Bulbs, corms, and tubers',
    'Alongside underground stems (rhizomes) and above-ground stems (stolons), perennial weeds modify vegetative organs into ________.',
    ['Bulbs, corms, tubers'],
    {
      only: 'mc',
      opts: [
        'Cotyledons, petals, and pollen',
        'Halters, spiracles, and cerci',
        'Chelicerae, hypostome, and palpi',
      ],
    }
  ),
  withAlt(
    'wc-31',
    'weeds-classification',
    'Allelopathic crops, crop rotation, row spacing, mulching, and interseeding',
    'In 3.1h Crop-Weed Competition, practices that break a weed life cycle and lower crop loss risk include timing of tillage, planting date, increased crop variety, and ________.',
    ['Allelopathic crops and crop rotation'],
    {
      only: 'mc',
      opts: [
        'Using unclean farm tools and spreading animal manure',
        'Increasing plant density with continuous monocrops',
        'Eliminating irrigation and water management',
      ],
    }
  ),
  withAlt(
    'wc-32',
    'weeds-classification',
    'Light signals',
    'Among environmental factors in 3.1i (p. 10), the reaction of seeds to ________ can break dormancy, and seeds of several species require it for germination.',
    ['Light']
  ),
  withAlt(
    'wc-33',
    'weeds-classification',
    'Nitrates, soil pH, and oxygen levels',
    'Besides soil temperature, moisture, and light, weed seed dormancy and germination in 3.1i are also affected by ________ (including anaerobic conditions).',
    ['Nitrates, soil pH, and oxygen'],
    {
      only: 'mc',
      opts: [
        'Compound eyes and ocelli',
        'Crop rotation and trap plants',
        'Predators, parasitoids, and pathogens',
      ],
    }
  ),
  withAlt(
    'wc-34',
    'weeds-classification',
    'Wind, flooding/irrigation, birds/animals, unclean tools, and animal manure',
    'According to p. 11, weeds disperse through five main pathways: ________.',
    ['Wind, water, animals, tools, and manure'],
    {
      only: 'mc',
      opts: [
        'Cultural, physical, chemical, and biological methods',
        'Pruning, raking, netting, and trenching',
        'Pollination, biological control, and insect protein',
      ],
    }
  ),

  // ================= TOPIC 3: arthropods-insects (33 cards) =================
  ...clue('ai', 'arthropods-insects', [
    [
      'Entomology',
      '________ is the study of insects and animals in other arthropod groups, such as arachnids, myriapods, and crustaceans.',
    ],
    [
      'Segmented bodies, jointed legs, and exoskeletons',
      'Insects share three general anatomical features listed in 3.2b: ________.',
      [
        'Soft bodies, unjointed appendages, and internal shells',
        'Feathers, beaks, and hollow bones',
        'Notochords, craniums, and spinal chords',
      ],
    ],
    [
      'Head',
      'In insects, the ________ is the body region that bears the mouthparts, eyes, and a pair of antennae.',
    ],
    [
      'Thorax',
      'In insects, the three-segmented ________ usually has three pairs of legs (hence "Hexapoda") in adults and usually one or two pairs of wings.',
    ],
    [
      'Abdomen',
      'In insects, the many-segmented ________ contains the digestive, excretory, and reproductive organs.',
    ],
    [
      'Spiracle',
      'In the Wigglesworth (2023) insect anatomy diagram (p. 14), the respiratory openings along the segments of the abdomen are labeled ________.',
      ['Ocelli', 'Labrum', 'Cercus'],
    ],
    [
      'Ovipositor',
      'In the Wigglesworth (2023) insect anatomy diagram (p. 14), the folded structure at the tip of the abdomen below the cercus is the ________.',
      ['Spermatheca', 'Maxilla', 'Labium'],
    ],
    [
      'Chelicerata',
      'Mites are members of the ________ along with scorpions, pseudoscorpions, and spiders, distinguished by body organisation, diverse ecologies, and very small size.',
    ],
    [
      'Very small creature',
      'The word "mite" comes from Old English and means a ________.',
    ],
    [
      'Innate behavior',
      '________ is inherent or instinctive behavior genetically wired to the organism, exemplified by the dorsal light reaction.',
    ],
    [
      'Dorsal light reaction',
      'Moths keep the sun or light source overhead on their dorsal side to stay parallel to the ground; this is called the ________.',
    ],
    [
      'Learned behavior',
      '________ is acquired through experience or learning for survival, as when honey bees use environmental signals to locate food sources.',
    ],
    [
      'Honey bees',
      'In Lesson 3.2d, ________ exemplify learned behavior because they learn from environmental signals to locate a food source.',
    ],
    [
      'Pollination, biological control, animal feed, recycling/waste clearance, and insect protein',
      'The five reasons why insects are important in Lesson 3.2e are ________.',
      [
        'Soil erosion, crop competition, disease vectors, venom, and pollination',
        'Crop rotation, mulching, cultivation, sanitation, and trap crops',
        'Gnawing, parasitism, defoliation, seed dispersal, and toxicity',
      ],
    ],
    [
      'Crop rotation, trap crops, inter-cropping, and resistant varieties',
      'Strategies or programs for insect management in 3.2f include planting time, cultivation, mulching, sanitation, beneficial organisms, and ________.',
      [
        'Increasing pesticide drift and monocropping',
        'Eliminating soil fertility and water management',
        'Introducing invasive vertebrate predators only',
      ],
    ],
  ]),
  withAlt(
    'ai-16',
    'arthropods-insects',
    'Arthropod',
    'An ________ is any member of the phylum Arthropoda, the largest phylum in the animal kingdom (lobsters, crabs, spiders, mites, insects, centipedes, millipedes).',
    ['Arthropoda']
  ),
  idc(
    'ai-17',
    'arthropods-insects',
    '84 percent',
    'About ________ of all known species of animals are members of the phylum Arthropoda.',
    ['84%']
  ),
  withAlt(
    'ai-18',
    'arthropods-insects',
    'Class Insecta (Hexapoda)',
    'Insects come from ________, the largest class of the phylum Arthropoda.',
    ['Insecta', 'Hexapoda', 'Class Insecta', 'Class Hexapoda']
  ),
  idc(
    'ai-19',
    'arthropods-insects',
    'Over one million',
    'Globally, well ________ species of insects have been described to date (with over 24,000 species in Britain).',
    ['one million', '1 million', '> 1 million']
  ),
  withAlt(
    'ai-20',
    'arthropods-insects',
    'Gnathosoma (Capitulum) and Idiosoma',
    'In the Walter & Proctor (2013) mite anatomy diagram (p. 14), the anterior mouthpart region and main body region of a mite are labeled ________.',
    ['Gnathosoma and Idiosoma', 'Capitulum and Idiosoma']
  ),
  tfc(
    'ai-21',
    'arthropods-insects',
    'Meaning of Hexapoda',
    'The class name "Hexapoda" refers to the three pairs of legs typically present on the three-segmented thorax of adult insects.',
    'True',
    'True — Lesson 3.2b explicitly notes "(hence Hexapoda)" after describing the three pairs of legs on the thorax.'
  ),
  tfc(
    'ai-22',
    'arthropods-insects',
    'Mite classification',
    'Mites belong to Class Insecta because they share the same three body regions as beetles and flies.',
    'False',
    'False — mites are members of Chelicerata (with scorpions and spiders), not Class Insecta, and have a Gnathosoma/Capitulum and Idiosoma.'
  ),
  withAlt(
    'ai-23',
    'arthropods-insects',
    'Compound eye and ocelli',
    'In the Wigglesworth (2023) insect anatomy diagram (p. 14), the large faceted eye and the simple eyes on the head are labeled ________.',
    ['Compound eye, ocelli'],
    {
      only: 'mc',
      opts: [
        'Cercus and ovipositor',
        'Chelicerae and hypostome',
        'Sternal plate and anal plate',
      ],
    }
  ),
  withAlt(
    'ai-24',
    'arthropods-insects',
    'Labrum, mandible, maxilla, and labium',
    'In the Wigglesworth (2023) insect anatomy diagram (p. 14), the four labeled mouthpart structures on the head are ________.',
    ['Labrum, mandible, maxilla, labium'],
    {
      only: 'mc',
      opts: [
        'Hypostome, chelicerae, and palpus',
        'Femur, tibia, and tarsus',
        'Ovary, oviduct, and spermatheca',
      ],
    }
  ),
  withAlt(
    'ai-25',
    'arthropods-insects',
    'Femur, tibia, and tarsus',
    'In the Wigglesworth (2023) insect anatomy diagram (p. 14), the three labeled leg segments from upper to foot are ________.',
    ['Femur, tibia, tarsus'],
    {
      only: 'mc',
      opts: [
        'Coxa, trochanter, and genu',
        'Labrum, mandible, and maxilla',
        'Head, thorax, and abdomen',
      ],
    }
  ),
  withAlt(
    'ai-26',
    'arthropods-insects',
    'Cercus',
    'In the Wigglesworth (2023) insect anatomy diagram (p. 14), the pointed posterior appendage above the ovipositor at the rear of the abdomen is the ________.',
    ['Cerci']
  ),
  withAlt(
    'ai-27',
    'arthropods-insects',
    'Ovary, oviduct, and spermatheca',
    'In the Wigglesworth (2023) insect anatomy diagram (p. 14), the three internal female reproductive structures labeled in the abdomen are ________.',
    ['Ovary, oviduct, spermatheca'],
    {
      only: 'mc',
      opts: [
        'Rectum, nerve cord, and spiracle',
        'Sternal plate, genital plate, and anal plate',
        'Compound eye, ocelli, and antenna',
      ],
    }
  ),
  withAlt(
    'ai-28',
    'arthropods-insects',
    'Nerve cord and rectum',
    'Alongside reproductive organs in the Wigglesworth (2023) diagram (p. 14), the ventral nervous tract and rear digestive chamber labeled in the abdomen are ________.',
    ['Nerve cord, rectum'],
    {
      only: 'mc',
      opts: [
        'Striations and setae',
        'Claw and caruncle',
        'Labrum and labium',
      ],
    }
  ),
  withAlt(
    'ai-29',
    'arthropods-insects',
    'Hypostome, chelicerae, and palpus',
    'In the Walter & Proctor (2013) mite anatomy diagram (p. 14), the three mouthpart structures on the Gnathosoma / Capitulum are ________.',
    ['Hypostome, chelicerae, palpus'],
    {
      only: 'mc',
      opts: [
        'Labrum, mandible, maxilla, and labium',
        'Sternal plate, genital plate, and anal plate',
        'Ocelli, compound eye, and antenna',
      ],
    }
  ),
  withAlt(
    'ai-30',
    'arthropods-insects',
    'Coxa, trochanter, femur, genu, tibia, and tarsus',
    'In the Walter & Proctor (2013) mite anatomy diagram (p. 14), the six leg segments from body base to tip (ending in Claw and Caruncle) are ________.',
    ['Coxa, trochanter, femur, genu, tibia, tarsus'],
    {
      only: 'mc',
      opts: [
        'Femur, tibia, and tarsus only',
        'Head, thorax, and abdomen',
        'Striations, setae, and spiracles',
      ],
    }
  ),
  withAlt(
    'ai-31',
    'arthropods-insects',
    'Genu',
    'In the Walter & Proctor (2013) mite anatomy diagram (p. 14), the leg segment located directly between the femur and tibia is the ________.',
    ['Genu']
  ),
  withAlt(
    'ai-32',
    'arthropods-insects',
    'Sternal plate, genital plate, and anal plate',
    'In the Walter & Proctor (2013) mite anatomy diagram (p. 14), the three ventral plates on the Idiosoma from front to back are ________.',
    ['Sternal, genital, and anal plates'],
    {
      only: 'mc',
      opts: [
        'Labrum, maxilla, and labium',
        'Ovary, oviduct, and spermatheca',
        'Coxa, trochanter, and caruncle',
      ],
    }
  ),
  withAlt(
    'ai-33',
    'arthropods-insects',
    'Striations and setae',
    'In the Walter & Proctor (2013) mite anatomy diagram (p. 14), the fine parallel cuticular ridges and marginal bristles on the Idiosoma are labeled ________.',
    ['Striations, setae'],
    {
      only: 'mc',
      opts: [
        'Spiracles and nerve cord',
        'Claw and caruncle',
        'Ocelli and compound eye',
      ],
    }
  ),

  // ================= TOPIC 4: insect-orders (34 cards) =================
  ...clue('io', 'insect-orders', [
    [
      'Coleoptera',
      'Ladybugs, scarab beetles, and lightning bugs belong to order ________ (usually four wings: hard ribless front wings and folded membranous back wings; chewing; complete metamorphosis).',
    ],
    [
      'Lepidoptera',
      'Butterflies and moths belong to order ________ (four scaly wings, rarely none; sucking mouthparts; complete metamorphosis).',
    ],
    [
      'Diptera',
      'Flies and mosquitoes belong to order ________ (two wings, very rarely none; sucking-licking or piercing-sucking; complete metamorphosis).',
    ],
    [
      'Hymenoptera',
      'Bees, bumblebees, wasps, and ants belong to order ________ (four wings with sparse ribs and front wings larger than back wings; chewing or chewing-licking; complete metamorphosis).',
    ],
    [
      'Hemiptera',
      'The giant water bug belongs to order ________ (front wings thick at the base or uniformly membranous; piercing-sucking mouthparts; incomplete metamorphosis).',
    ],
    [
      'Orthoptera',
      'Grasshoppers and locusts belong to order ________ (thick, narrow front wings and folded back wings; chewing mouthparts; incomplete metamorphosis).',
    ],
    [
      'Odonata',
      'Dragonflies belong to order ________ (four similar wings with abundant ribs/"rubs"; chewing mouthparts; incomplete metamorphosis).',
    ],
    [
      'Blattodea',
      'In the module’s Insect Orders chart (pp. 15–16), BOTH cockroaches and termites are listed under order ________.',
    ],
    [
      'Dermaptera',
      'Earwigs belong to order ________ (none or four wings: short thick front wings and folded back wings; chewing mouthparts; incomplete metamorphosis).',
    ],
    [
      'Ephemeroptera',
      'Mayflies belong to order ________ (triangular membranous back wings smaller than front wings; vestigial mouthparts; incomplete metamorphosis).',
    ],
    [
      'Thysanoptera',
      'Thrips belong to order ________ (none or four long, narrow fringed wings; sucking mouthparts).',
    ],
    [
      'Between incomplete and complete',
      'According to the chart (p. 17), Thysanoptera (thrips) have a metamorphosis type described as ________.',
      ['None', 'Complete', 'Incomplete'],
    ],
    [
      'Siphonaptera',
      'Fleas belong to order ________ (no wings; sucking mouthparts; complete metamorphosis).',
    ],
    [
      'Phthiraptera',
      'Lice belong to order ________ (no wings; chewing or piercing-sucking mouthparts; incomplete metamorphosis).',
    ],
    [
      'Phasmatodea',
      'Stick insects belong to order ________ (none or four: narrow front wings and folded back wings; chewing mouthparts; incomplete metamorphosis).',
    ],
    [
      'Mantodea',
      'Mantids belong to order ________ (four wings; chewing mouthparts; incomplete metamorphosis).',
    ],
    [
      'Trichoptera',
      'Caddisflies belong to order ________ (four hairy wings; chewing, greatly reduced mouthparts; complete metamorphosis).',
    ],
    [
      'Mecoptera',
      'Scorpionflies belong to order ________ (none or four similar, narrow wings; chewing mouthparts; complete metamorphosis).',
    ],
    [
      'Neuroptera',
      'Lacewings belong to order ________ (four similar front and back wings with abundant ribs; chewing mouthparts; complete metamorphosis).',
    ],
    [
      'Megaloptera',
      'Dobsonflies belong to order ________ (four similar front and back wings with abundant ribs; chewing mouthparts; complete metamorphosis).',
    ],
    [
      'Raphidioptera',
      'Snakeflies belong to order ________ (four similar front and back wings with abundant ribs; chewing mouthparts; complete metamorphosis).',
    ],
    [
      'Plecoptera',
      'Stoneflies belong to order ________ (four wings: narrow front wings and wide back wings; chewing mouthparts; incomplete metamorphosis).',
    ],
    [
      'Psocoptera',
      'Book lice belong to order ________ (none or four wings with sparse ribs and front wings larger than back wings; chewing mouthparts; incomplete metamorphosis).',
    ],
    [
      'Strepsiptera',
      'Stylops belong to order ________ (wingless females, males with reduced front wings and triangular back wings; vestigial mouthparts; complete metamorphosis).',
    ],
    [
      'Archaeognatha and Thysanura',
      'Which two orders in the chart (Petrobius maritimus and Silverfish) have NO wings, chewing mouthparts, and NO metamorphosis?',
      [
        'Siphonaptera and Phthiraptera',
        'Embioptera and Zoraptera',
        'Grylloblattodea and Mantophasmatodea',
      ],
    ],
    [
      'Embioptera',
      'Anisembia texana belongs to order ________ (wingless females/some males, four similar wings in males; chewing mouthparts; incomplete metamorphosis).',
    ],
    [
      'Zoraptera',
      'Zorotypus newi belongs to order ________ (none or four long, narrow fringed front wings larger than back wings; chewing mouthparts; incomplete metamorphosis).',
    ],
  ]),
  tfc(
    'io-28',
    'insect-orders',
    'Mayfly mouthparts and metamorphosis',
    'According to the Insect Orders chart, Ephemeroptera (Mayflies) undergo complete metamorphosis and have chewing mouthparts as adults.',
    'False',
    'False — Ephemeroptera (Mayflies) have vestigial mouthparts and incomplete metamorphosis.'
  ),
  ...clue('io', 'insect-orders', []).concat([
    {
      id: 'io-29',
      topic: 'insect-orders',
      term: 'Grylloblattodea',
      front:
        'Grylloblatta barberi belongs to order ________ (no wings, chewing mouthparts, incomplete metamorphosis).',
      back: 'Grylloblattodea',
    },
    {
      id: 'io-30',
      topic: 'insect-orders',
      term: 'Mantophasmatodea',
      front:
        'Mantophasma zephyra belongs to order ________ (no wings, chewing mouthparts, incomplete metamorphosis).',
      back: 'Mantophasmatodea',
    },
    {
      id: 'io-31',
      topic: 'insect-orders',
      term: 'Archaeognatha',
      front:
        'Petrobius maritimus belongs to order ________ (no wings, chewing mouthparts, no metamorphosis).',
      back: 'Archaeognatha',
    },
    {
      id: 'io-32',
      topic: 'insect-orders',
      term: 'Thysanura',
      front:
        'Silverfish belong to order ________ (no wings, chewing mouthparts, no metamorphosis).',
      back: 'Thysanura',
    },
    {
      id: 'io-33',
      topic: 'insect-orders',
      term: 'Gullan & Cranston (2020) chart',
      front:
        'According to Lesson 3.2c (Gullan P.J. & P. S. Cranston 2020), how many orders of insects are stated as known at present in the chart?',
      back: '30 orders',
      alt: ['30'],
      only: 'id',
    },
  ]),
  tfc(
    'io-34',
    'insect-orders',
    'Blattodea duplicate entry in chart',
    'In the module’s Insect Orders chart (pp. 15–16), Blattodea is listed twice—once for Cockroaches and once for Termites.',
    'True',
    'True — Blattodea appears on p. 15 (Cockroaches) and again on p. 16 (Termites), with Isoptera omitted from the 30-row table.'
  ),

  // ================= TOPIC 5: vertebrate-pests (17 cards) =================
  ...clue('vp', 'vertebrate-pests', [
    [
      'Invasive species',
      'An ________ is an organism that is not indigenous or native to a particular area and can cause great economic and environmental harm to the new area.',
    ],
    [
      'Rodentia',
      'Rodents belong to order ________, characterized by two constantly growing incisors in the upper and lower jaws which must be kept short by gnawing.',
    ],
    [
      'Rattus argentiventer',
      'Among the five major rodent pests in the Philippines, the Asian rice field rat is ________.',
    ],
    [
      'Rattus exulans',
      'Among the five major rodent pests in the Philippines, the Polynesian rat or bush rat is ________.',
    ],
    [
      'Philippine bamboo bat',
      'The smallest bat in the world, found in the Philippines, is the ________.',
    ],
    [
      'Giant flying fox (Acerodon jubatus) and golden crown flying fox (Pteropus vampyrus)',
      'The world’s largest bats found in the Philippines are the ________.',
      [
        'Philippine bamboo bat and fruit bat',
        'Vampire bat and horseshoe bat',
        'Crab-eating macaque and tarsier',
      ],
    ],
  ]),
  withAlt(
    'vp-07',
    'vertebrate-pests',
    'Subphylum Chordata',
    'Vertebrate pests are animals belonging to ________ whose notochord is replaced by a backbone or spinal chord after its embryonic stage.',
    ['Chordata']
  ),
  withAlt(
    'vp-08',
    'vertebrate-pests',
    'Rattus rattus complex (Means)',
    'Among the five major rodent pests in the Philippines, the common rice field rat is ________.',
    ['Rattus rattus complex', 'Rattus rattus']
  ),
  withAlt(
    'vp-09',
    'vertebrate-pests',
    'Rattus norvegicus (Berkenhont)',
    'Among the five major rodent pests in the Philippines, the Norway rat is ________.',
    ['Rattus norvegicus', 'Rattus norvegicus Berkenhout']
  ),
  withAlt(
    'vp-10',
    'vertebrate-pests',
    'Mus musculus castaneus (Waterhouse)',
    'Among the five major rodent pests in the Philippines, the Philippine house mouse is ________.',
    ['Mus musculus castaneus', 'Mus musculus']
  ),
  idc(
    'vp-11',
    'vertebrate-pests',
    '56',
    'The Philippines has around ________ species of bats out of the 1,000 species in the world.',
    ['56 species']
  ),
  withAlt(
    'vp-12',
    'vertebrate-pests',
    'Crab-eating Macaque (Raffles, 1821)',
    'In the Philippines, the major monkey pest belonging to the primate order is the ________.',
    ['Crab-eating Macaque', 'Macaque']
  ),
  withAlt(
    'vp-13',
    'vertebrate-pests',
    'Class Aves',
    'Birds belong to ________ of Phylum Chordata; they are the only animals with feathers, and grain-eating birds are important agricultural pests.',
    ['Aves']
  ),
  withAlt(
    'vp-14',
    'vertebrate-pests',
    'Visayan Warty Pig (Sus cebifrons)',
    'One of the two Philippine wild pig species listed under minor vertebrate pests is the ________.',
    ['Visayan Warty Pig', 'Sus cebifrons']
  ),
  withAlt(
    'vp-15',
    'vertebrate-pests',
    'Philippine Warty Pig (Sus philippensis)',
    'Alongside the Visayan Warty Pig (Sus cebifrons), the other Philippine wild pig listed under minor vertebrate pests is the ________.',
    ['Philippine Warty Pig', 'Sus philippensis']
  ),
  tfc(
    'vp-16',
    'vertebrate-pests',
    'Major vs. Minor vertebrate pests',
    'Rodents are classified under Minor Vertebrate Pests, whereas bats, monkeys, birds, and Philippine wild pigs are classified under Major Vertebrate Pests.',
    'False',
    'False — Rodents are Section A (Major Vertebrate Pests), while Bats, Monkeys, Birds, and Philippine wild pigs are Section B (Minor Vertebrate Pests).'
  ),
  withAlt(
    'vp-17',
    'vertebrate-pests',
    'Mammals, birds, reptiles, amphibian, and fish',
    'According to Lesson 3.2g (p. 20), vertebrate pests under subphylum Chordata include five animal groups: ________.',
    ['Mammals, birds, reptiles, amphibians, fish'],
    {
      only: 'mc',
      opts: [
        'Insects, mites, spiders, scorpions, and millipedes',
        'Fungi, bacteria, nematodes, and protozoa',
        'Lobsters, crabs, centipedes, and ticks',
      ],
    }
  ),

  // ================= TOPIC 6: ipm-concepts (28 cards) =================
  ...clue('ic', 'ipm-concepts', [
    [
      '18th - 19th centuries',
      'The origin of IPM in the ________ depended on combining husbandry techniques such as rotation and cultivation to maintain fertility including freedom from pests.',
    ],
    [
      'H. and W. Olkowski',
      'The first literature on IPM in non-agricultural settings came in the early 1980s with publications by ________ (founders of the Bio-Integral Resource Center – BIRC).',
    ],
    [
      "1970's",
      'The term Integrated Pest Management was first used in agriculture in the ________ in response to growing knowledge about the negative side effects of pesticide overuse.',
    ],
    [
      "1900's - 1940's",
      'During the ________, pest problems became severe and the chemical revolution started with DDT, Organochlorides, Organophosphate, and Carbamates.',
    ],
    [
      'One pest control method will not be successful',
      'What is the cardinal axiom of IPM stated on page 25?',
      [
        'Chemical pesticides should always be applied first',
        'Complete pest eradication is the primary objective',
        'Natural enemies alone always eliminate crop pests',
      ],
    ],
    [
      'Biological, Chemical, Cultural, and Physical',
      'The Integrated Pest Management diagram on page 25 depicts four interconnected approaches around IPM: ________.',
      [
        'Annual, Biennial, Perennial, and Aquatic',
        'Monitoring, Spraying, Harvesting, and Marketing',
        'Rodents, Bats, Birds, and Wild Pigs',
      ],
    ],
    [
      'Maintain population levels below economically relevant levels',
      'The goal of IPM is not to eradicate pests, but to ________.',
      [
        'Eliminate every insect species from agricultural land',
        'Rely solely on organophosphate and carbamate sprays',
        'Maximize chemical input regardless of yield loss',
      ],
    ],
    [
      'Increase farm profitability, improve environmental quality, and improve public image of agriculture',
      'The three numbered goals of IPM listed on page 25 are to ________.',
      [
        'Increase pesticide frequency, expand monocrops, and reduce monitoring',
        'Replace crop rotation, remove natural predators, and ban tillage',
        'Eliminate biological control, maximize residues, and raise labor costs',
      ],
    ],
    [
      'Complexes',
      'Because pest and disease problems in plants are often the result of more than one cause, these multi-cause problems are called "________".',
    ],
    [
      'Prevent, ID Pests, Monitor, Decide, Control, Evaluate',
      'The "Integrated Pest Management Basic Principles" diagram (p. 27) outlines the six-step cycle: ________.',
      [
        'Spray, Harvest, Store, Market, Plow, Burn',
        'Eradicate, Fumigate, Irrigate, Fertilize, Seed, Prune',
        'Quarantine, Import, Cultivate, Monocrop, Clear, Abandon',
      ],
    ],
    [
      'Temperature, day length, and humidity',
      'According to Section C (p. 27), which three weather conditions affect pests’ activity and rate of reproduction?',
      [
        'Soil pH, nitrates concentration, and oxygen',
        'Row spacing, mulching, and trap crops',
        'Oral lethal dose, drift, and vapour',
      ],
    ],
    [
      'New crop species, field enlargement/aggregation, monocrops, and plant density',
      'Changes in agricultural practices held responsible for causing many pest problems in Section C (p. 27) include ________.',
      [
        'Crop rotation, resistant varieties, and sanitation',
        'Biological control, hand weeding, and mulching',
        'Quarantine inspections and public education',
      ],
    ],
    [
      'Financial constraints, lack of expertise, inadequate research, lack of supportive policies, and traditional farming',
      'The five challenges in implementing IPM listed on page 26 are ________.',
      [
        'Lower cost intervention, environmental benefits, and minimized residues',
        'Soil stabilization, wildlife habitat, and nectar for bees',
        'High equipment durability, instant results, and zero supervision',
      ],
    ],
    [
      'Lower cost intervention, benefits to the environment, and minimized pesticide residues',
      'The three advantages of IPM listed on page 26 are ________.',
      [
        'Complete pest eradication, single-method control, and higher chemical drift',
        'Labor intensity, limited application, and high research cost',
        'Reduced farm profit, disrupted ecosystems, and non-target toxicity',
      ],
    ],
  ]),
  withAlt(
    'ic-15',
    'ipm-concepts',
    'Integrated Pest Management (IPM)',
    '________ is a process of holistic evaluation and implementation of pest management strategies in food production systems, landscapes, and urban environments.',
    ['IPM', 'Integrated Pest Management']
  ),
  withAlt(
    'ic-16',
    'ipm-concepts',
    'Bio-Integral Resource Center (BIRC)',
    'H. and W. Olkowski were the founders of the ________, producing early 1980s non-agricultural IPM literature including a National Park Service training manual.',
    ['BIRC', 'Bio-Integral Resource Center']
  ),
  withAlt(
    'ic-17',
    'ipm-concepts',
    'DDT (dichloro-diphenyl-trichloro-ethane)',
    'During the 1900s–1940s chemical revolution, major synthetic pesticides included Organochlorides, Organophosphate, Carbamates, and ________.',
    ['DDT', 'dichloro-diphenyl-trichloro-ethane']
  ),
  withAlt(
    'ic-18',
    'ipm-concepts',
    'Silent Spring by Rachel Carson (1962)',
    'Published in 1962, the book ________ explained the environmental and health hazards of chemicals.',
    ['Silent Spring', 'Rachel Carson', '1962']
  ),
  withAlt(
    'ic-19',
    'ipm-concepts',
    'Economic Threshold Level (ETL)',
    'The ________ is the pest density at which management action should be taken to prevent an increasing pest population from reaching the economic injury level.',
    ['ETL', 'Economic Threshold Level', 'Economic Threshold']
  ),
  withAlt(
    'ic-20',
    'ipm-concepts',
    'Economic Injury Level (EIL)',
    'The ________ is the smallest number of insects (amount of injury) that will cause yield losses equal to insect management costs (damage exceeds cost of control measures).',
    ['EIL', 'Economic Injury Level', 'Economic Injury']
  ),
  tfc(
    'ic-21',
    'ipm-concepts',
    'Goal of IPM vs. eradication',
    'The primary goal of Integrated Pest Management is to completely eradicate all pests from the field.',
    'False',
    'False — Lesson 3.3 explicitly states that the goal of IPM is NOT to eradicate pests, but to maintain population levels below economically relevant levels.'
  ),
  tfc(
    'ic-22',
    'ipm-concepts',
    'ETL vs. EIL graph position',
    'On the Change In Pest Population Density Over Time graph (p. 26), the Economic Threshold line is below the Economic Injury Level line.',
    'True',
    'True — management action is triggered at the lower Economic Threshold (ETL) before the population rises to the Economic Injury Level (EIL).'
  ),
  withAlt(
    'ic-23',
    'ipm-concepts',
    'Integration of pest biology and cultural practices',
    'Under History of IPM in the Philippines (p. 24), the approach emphasized the ________ in controlling insect pests in crops.',
    ['Pest biology and cultural practices'],
    {
      only: 'mc',
      opts: [
        'Total reliance on DDT and organophosphates',
        'Complete eradication of all wildlife habitats',
        'Exclusive use of toxic fumigant gases',
      ],
    }
  ),
  withAlt(
    'ic-24',
    'ipm-concepts',
    'Museums',
    'Following early 1980s non-agricultural publications, the term IPM was used in ________ as a replacement for "pest control" to integrate alternative methods into collection care practices.',
    ['Cultural institutions']
  ),
  withAlt(
    'ic-25',
    'ipm-concepts',
    "1960's – 1970's",
    'Following Rachel Carson’s Silent Spring (1962), during the ________ plant protection became a greater concern.',
    ['1960s - 1970s', '1960s to 1970s'],
    {
      only: 'mc',
      opts: ["18th - 19th centuries", "1900's - 1940's", "Early 1980's"],
    }
  ),
  withAlt(
    'ic-26',
    'ipm-concepts',
    'Identifying/preventing/eliminating pests, reducing injury, growing a healthy crop with least agroecosystem disruption, and encouraging natural control',
    'Which statement summarizes the four points under Importance of IPM on page 25?',
    ['Importance of IPM'],
    {
      only: 'mc',
      opts: [
        'Increasing monocrop field size and maximizing synthetic chemical spray schedules',
        'Eliminating all non-target predators and relying solely on soil fumigation',
        'Replacing biological monitoring with fixed calendar-based pesticide spraying',
      ],
    }
  ),
  withAlt(
    'ic-27',
    'ipm-concepts',
    'Identification, dynamics, preventive strategies, monitoring, decision making, optimal tactics, implementation, and evaluation',
    'The eight Key Components or Steps in the Implementation of IPM listed on page 27 are ________.',
    ['8 steps of IPM implementation'],
    {
      only: 'mc',
      opts: [
        'Plowing, planting, fertilizing, irrigating, harvesting, and marketing',
        'Spraying, fumigating, trenching, netting, wrapping, and burning',
        'Soil temperature, moisture, light, nitrates, pH, and oxygen',
      ],
    }
  ),
  withAlt(
    'ic-28',
    'ipm-concepts',
    'Effective, affordable, and safe for the environment',
    'Under General Considerations in Planning Pest Management Programs (p. 27), IPM treatment methods considered should be ________.',
    ['Effective, affordable, safe for the environment'],
    {
      only: 'mc',
      opts: [
        'Costly, labor-intensive, and reliant on toxic fumigants',
        'Single-method, temporary, and non-selective',
        'Permanent eradication regardless of ecological disruption',
      ],
    }
  ),

  // ================= TOPIC 7: ipm-methods (31 cards) =================
  ...clue('im', 'ipm-methods', [
    [
      'Minimum chance for biotype selection and no harmful effect on non-target organisms',
      'Advantages of the Cultural Method (p. 28) include no extra cost/inputs, no special equipment, minimum labor cost, ecological soundness, and ________.',
      [
        'Permanent eradication of all foreign quarantine pests',
        'Complete elimination of labor and crop value changes',
        'High pesticide residue levels in harvested food',
      ],
    ],
    [
      'Hand picking, banding, wrapping, netting, and trenching',
      'Visual examples of Mechanical/Physical controls shown in the p. 28 photos include ________.',
      [
        'Monocrotophos, carbaryl, malathion, and mancozeb',
        'Crop rotation, resistant varieties, and strip cropping',
        'Fungi, bacteria, predatory nematodes, and protozoa',
      ],
    ],
    [
      'Limited application, require continuous use, rarely highly effective, and labor intensive',
      'The four disadvantages listed for the Mechanical Method (p. 29) are ________.',
      [
        'High research cost, expert supervision, and difficult supply',
        'Groundwater contamination, spray drift, and food residues',
        'High biotype selection and harm to non-target organisms',
      ],
    ],
    [
      'Biological Control',
      '________ is the integrated management method of destroying pests using predators, parasitoids, pathogens, etc.',
    ],
    [
      'Requires expert supervision and high research/supply cost',
      'Disadvantages of Biological Control (p. 29) include not always being applicable, insufficient level of control, and ________.',
      [
        'High chemical drift and leached groundwater contamination',
        'Low equipment cost and no toxicity or residue problems',
        'Guaranteed immediate permanent control in every crop',
      ],
    ],
    [
      'Chemical Control',
      '________ applies natural or synthetic chemical substances to repel or eradicate pests.',
    ],
    [
      'Reduction of beneficial species, drift/vapour damage, food/feed residues, and groundwater contamination',
      'Disadvantages of Chemical Control listed on page 30 include ________.',
      [
        'Home labor utilization and low equipment cost',
        'Minimum chance for biotype selection and ecological safety',
        'Lack of toxicity and potential to be permanent',
      ],
    ],
    [
      'Regulatory Practices',
      '________ involve preventing the entry and establishment of foreign plant and animal pests in a country or area and the eradication, containment, or suppression of pests established in limited areas.',
    ],
    [
      'Identification of risk, Prevention of entry, Survey and detection, Eradication, Retardation of spread, Mitigation of losses, Pest diagnostics/record keeping, Public information/education',
      'The eight regulatory actions listed in the Friendly Reminder (p. 31) are ________.',
      [
        'Tillage, mulching, hoeing, pruning, trapping, banding, netting, and trenching',
        'Fungi, bacteria, nematodes, protozoa, tardigrades, turbellarians, collembolans, and mites',
        'Monitor, Spray, Harvest, Store, Sell, Plow, Flood, and Burn',
      ],
    ],
  ]),
  withAlt(
    'im-10',
    'ipm-methods',
    'Cultural Method',
    'The ________ uses agricultural practices (resistant varieties, tillage, mulching, hand weeding/hoeing, pruning, row covers, sticky bands, crop rotation, trap plants) to enhance crop health and prevent pest problems.',
    ['Cultural Control', 'Cultural Controls']
  ),
  withAlt(
    'im-11',
    'ipm-methods',
    'Mechanical Method',
    'The ________ (integrated mechanical and physical controls) implies removing or killing pests with designated devices or manually, or blocking their access to plants (pruning, raking, irrigation management, heating/steaming soils).',
    ['Mechanical Control', 'Mechanical and physical controls', 'Physical Method']
  ),
  withAlt(
    'im-12',
    'ipm-methods',
    'Fungi (86%)',
    'In the Bio Control Agents chart (Walia and Bajaj, 2013, p. 29), ________ account for 86% of biocontrol agents, compared to Bacteria (10%) and Mites (2%).',
    ['Fungi', '86%']
  ),
  withAlt(
    'im-13',
    'ipm-methods',
    'Category 1 (Red label)',
    'Pesticides classified as Extremely toxic with an oral lethal dose of 1–50 mg/kg (e.g., monocrotophos, zinc phosphide, ethyl mercury acetate) carry a ________.',
    ['Category 1', 'Red label', 'Red'],
    {
      opts: [
        'Category 2 (Yellow label)',
        'Category 3 (Blue label)',
        'Category 4 (Green label)',
      ],
    }
  ),
  withAlt(
    'im-14',
    'ipm-methods',
    'Category 2 (Yellow label)',
    'Pesticides classified as Highly toxic with an oral lethal dose of 51–500 mg/kg (e.g., endosulfan, carbaryl, quinalphos) carry a ________.',
    ['Category 2', 'Yellow label', 'Yellow'],
    {
      opts: [
        'Category 1 (Red label)',
        'Category 3 (Blue label)',
        'Category 4 (Green label)',
      ],
    }
  ),
  withAlt(
    'im-15',
    'ipm-methods',
    'Category 3 (Blue label)',
    'Pesticides classified as Moderately toxic with an oral lethal dose of 501–5000 mg/kg (e.g., malathion, thiram, glyphosate) carry a ________.',
    ['Category 3', 'Blue label', 'Blue'],
    {
      opts: [
        'Category 1 (Red label)',
        'Category 2 (Yellow label)',
        'Category 4 (Green label)',
      ],
    }
  ),
  withAlt(
    'im-16',
    'ipm-methods',
    'Category 4 (Green label)',
    'Pesticides classified as Slightly toxic with an oral lethal dose > 5000 mg/kg (e.g., mancozeb, oxyfluorfen, mosquito repellant oils) carry a ________.',
    ['Category 4', 'Green label', 'Green'],
    {
      opts: [
        'Category 1 (Red label)',
        'Category 2 (Yellow label)',
        'Category 3 (Blue label)',
      ],
    }
  ),
  withAlt(
    'im-17',
    'ipm-methods',
    '1–50 mg/kg',
    'In the pesticide color-code table (p. 30), Category 1 (Red label, Extremely toxic) has an oral lethal dose of ________.',
    ['1-50 mg/kg', '1 to 50 mg/kg', '1-50'],
    {
      opts: ['51–500 mg/kg', '501–5000 mg/kg', '> 5000 mg/kg'],
    }
  ),
  withAlt(
    'im-18',
    'ipm-methods',
    '51–500 mg/kg',
    'In the pesticide color-code table (p. 30), Category 2 (Yellow label, Highly toxic) has an oral lethal dose of ________.',
    ['51-500 mg/kg', '51 to 500 mg/kg', '51-500'],
    {
      opts: ['1–50 mg/kg', '501–5000 mg/kg', '> 5000 mg/kg'],
    }
  ),
  withAlt(
    'im-19',
    'ipm-methods',
    '501–5000 mg/kg',
    'In the pesticide color-code table (p. 30), Category 3 (Blue label, Moderately toxic) has an oral lethal dose of ________.',
    ['501-5000 mg/kg', '501 to 5000 mg/kg', '501-5000'],
    {
      opts: ['1–50 mg/kg', '51–500 mg/kg', '> 5000 mg/kg'],
    }
  ),
  withAlt(
    'im-20',
    'ipm-methods',
    '> 5000 mg/kg',
    'In the pesticide color-code table (p. 30), Category 4 (Green label, Slightly toxic) has an oral lethal dose of ________.',
    ['greater than 5000 mg/kg', 'above 5000 mg/kg', '>5000 mg/kg', '> 5000'],
    {
      opts: ['1–50 mg/kg', '51–500 mg/kg', '501–5000 mg/kg'],
    }
  ),
  tfc(
    'im-21',
    'ipm-methods',
    'Category 4 vs. Category 1 toxicity',
    'Category 4 (Green label) pesticides are extremely toxic and have an oral lethal dose of 1–50 mg/kg.',
    'False',
    'False — Category 1 (Red label) is Extremely toxic (1–50 mg/kg); Category 4 (Green label) is Slightly toxic (> 5000 mg/kg).'
  ),
  tfc(
    'im-22',
    'ipm-methods',
    'Biological Control advantages',
    'Biological control advantages listed in Lesson 3.3 include low cost, potential to be permanent, no harm to non-target organisms, and no toxicity or residue problems.',
    'True',
    'True — these advantages are listed on page 29 under Biological Control (alongside the odd source phrase "The pest is unstable").'
  ),
  withAlt(
    'im-23',
    'ipm-methods',
    'May alter crop value/gross income, labor/energy intensive, low widespread adoption, and conflicts',
    'Disadvantages of the Cultural Method listed on page 28 include "some are not environmentally begun" and ________.',
    ['Cultural method disadvantages'],
    {
      only: 'mc',
      opts: [
        'Leached groundwater contamination and toxic crop drift',
        'High special equipment cost and high biotype selection',
        'Requires expert laboratory supervision for supply',
      ],
    }
  ),
  withAlt(
    'im-24',
    'ipm-methods',
    'Home labor utilization, low equipment cost, ecologically safe, and good component of IPM',
    'The four advantages listed for the Mechanical Method on page 29 are ________.',
    ['Mechanical method advantages'],
    {
      only: 'mc',
      opts: [
        'Limited application, continuous use, rarely effective, and labor intensive',
        'Reduced beneficial insects and food residues',
        'Permanent self-sustaining pest eradication with no labor',
      ],
    }
  ),
  withAlt(
    'im-25',
    'ipm-methods',
    'Fungi, Bacteria, Predatory nematodes, Protozoa, Tardigrades, Turbellarians, Collembolans, and Predatory Mites',
    'The Bio Control Agents chart (Walia and Bajaj, 2013, p. 29) lists which eight groups of biological control agents?',
    ['Eight bio control agents'],
    {
      only: 'mc',
      opts: [
        'Monocrotophos, endosulfan, carbaryl, malathion, thiram, glyphosate, and mancozeb',
        'Rodents, bats, monkeys, birds, and Philippine wild pigs',
        'Crabgrass, purslane, pigweed, dandelion, and nutsedge',
      ],
    }
  ),
  withAlt(
    'im-26',
    'ipm-methods',
    'Cost-effectiveness, Timeless and Flexibility, Quality/quantity/price of produce, and Prevention problem',
    'The four advantages listed for Chemical Control on page 30 are ________.',
    ['Chemical control advantages'],
    {
      only: 'mc',
      opts: [
        'No extra cost, no cost inputs, and no special equipment',
        'Home labor utilization and no toxicity or residue problems',
        'Zero non-target effects and permanent biological persistence',
      ],
    }
  ),
  withAlt(
    'im-27',
    'ipm-methods',
    'POISON (Cat. 1–2), DANGER (Cat. 3), CAUTION (Cat. 4)',
    'In the p. 30 pesticide color-code table, what warning text appears inside the diamond labels for Categories 1–2, Category 3, and Category 4?',
    ['POISON, DANGER, CAUTION'],
    {
      only: 'mc',
      opts: [
        'CAUTION (Cat. 1–2), POISON (Cat. 3), DANGER (Cat. 4)',
        'DANGER (Cat. 1), CAUTION (Cat. 2–3), POISON (Cat. 4)',
        'TOXIC (Cat. 1), HAZARD (Cat. 2), SAFE (Cat. 3–4)',
      ],
    }
  ),
  withAlt(
    'im-28',
    'ipm-methods',
    'Monocrotophos, zinc phosphide, and ethyl mercury acetate',
    'In the p. 30 pesticide color-code table, which chemicals are listed under Category 1 (Red label, Extremely toxic)?',
    ['Monocrotophos, zinc phosphide, ethyl mercury acetate'],
    {
      only: 'mc',
      opts: [
        'Endosulfan, carbaryl, and quinalphos',
        'Malathion, thiram, and glyphosate',
        'Mancozeb, oxyfluorfen, and mosquito repellant oils',
      ],
    }
  ),
  withAlt(
    'im-29',
    'ipm-methods',
    'Endosulfan, carbaryl, and quinalphos',
    'In the p. 30 pesticide color-code table, which chemicals are listed under Category 2 (Yellow label, Highly toxic)?',
    ['Endosulfan, carbaryl, quinalphos'],
    {
      only: 'mc',
      opts: [
        'Monocrotophos, zinc phosphide, and ethyl mercury acetate',
        'Malathion, thiram, and glyphosate',
        'Mancozeb, oxyfluorfen, and mosquito repellant oils',
      ],
    }
  ),
  withAlt(
    'im-30',
    'ipm-methods',
    'Malathion, thiram, and glyphosate',
    'In the p. 30 pesticide color-code table, which chemicals are listed under Category 3 (Blue label, Moderately toxic)?',
    ['Malathion, thiram, glyphosate'],
    {
      only: 'mc',
      opts: [
        'Monocrotophos, zinc phosphide, and ethyl mercury acetate',
        'Endosulfan, carbaryl, and quinalphos',
        'Mancozeb, oxyfluorfen, and mosquito repellant oils',
      ],
    }
  ),
  withAlt(
    'im-31',
    'ipm-methods',
    'Mancozeb, oxyfluorfen, and mosquito repellant oils and liquids',
    'In the p. 30 pesticide color-code table, which chemicals are listed under Category 4 (Green label, Slightly toxic)?',
    ['Mancozeb, oxyfluorfen, mosquito repellant oils'],
    {
      only: 'mc',
      opts: [
        'Monocrotophos, zinc phosphide, and ethyl mercury acetate',
        'Endosulfan, carbaryl, and quinalphos',
        'Malathion, thiram, and glyphosate',
      ],
    }
  ),
];

export interface DiagramLabel {
  label: string;
  group: string;
  definition: string;
  alt?: string[];
}

export interface DiagramGuide {
  id: string;
  topic: string;
  title: string;
  sourceRef: string;
  image: string;
  caption: string;
  labels: DiagramLabel[];
}

export interface MindMapBranch {
  name: string;
  badge: string;
  tone: 'emerald' | 'amber' | 'sky' | 'rose';
  points: string[];
}

export interface MindMapGuide {
  id: string;
  topic: string;
  title: string;
  rootLabel: string;
  rootNote: string;
  branches: MindMapBranch[];
}

export interface LessonGallerySpecies {
  marker: string;
  scientificName: string;
  authority?: string;
  separator: string;
  commonName: string;
  image: string;
  altText: string;
}

export interface LessonGalleryGuide {
  id: string;
  topic: string;
  sectionHeading: string;
  subsectionHeading: string;
  paragraph: string;
  listLeadIn: string;
  species: LessonGallerySpecies[];
  caption: string;
}

export interface LessonSectionBlock {
  subheading: string;
  body: string;
  image?: string;
  imageAlt?: string;
  imageCaption?: string;
  gallery?: Array<{
    marker: string;
    title: string;
    scientificName?: string;
    image: string;
    altText: string;
  }>;
  galleryCaption?: string;
  bullets?: string[];
}

export interface LessonVisualSection {
  id: string;
  topic: string;
  heading: string;
  subtitle?: string;
  blocks: LessonSectionBlock[];
}

export const DIAGRAMS: DiagramGuide[] = [
  {
    id: 'insect-anatomy',
    topic: 'arthropods-insects',
    title: 'Insect Anatomy (External & Cutaway)',
    sourceRef: 'Wigglesworth, Vincent Brian (2023) · Lesson 3.2b (p. 14)',
    image: '/diagrams/insect-anatomy.jpg',
    caption:
      'Labeled diagram showing the 3 major body regions (head, thorax, abdomen), head sensory/mouthpart structures, leg segments, respiratory openings, and internal/posterior organs.',
    labels: [
      {
        label: 'Head',
        group: 'Major Regions',
        definition:
          'Anterior body region that bears the mouthparts, compound eyes, ocelli, and a pair of antennae.',
      },
      {
        label: 'Thorax',
        group: 'Major Regions',
        definition:
          'Three-segmented middle region that usually bears three pairs of legs (hence "Hexapoda") in adults and usually one or two pairs of wings.',
      },
      {
        label: 'Abdomen',
        group: 'Major Regions',
        definition:
          'Many-segmented posterior region that contains the digestive, excretory, and reproductive organs.',
      },
      {
        label: 'Compound eye',
        group: 'Head & Sensory',
        definition:
          'Large paired faceted eye on the side of the head.',
      },
      {
        label: 'Ocelli',
        group: 'Head & Sensory',
        definition:
          'Small simple eyes positioned on the upper front of the head.',
        alt: ['Ocellus'],
      },
      {
        label: 'Antenna',
        group: 'Head & Sensory',
        definition:
          'Segmented sensory appendage on the head (insects bear one pair).',
        alt: ['Antennae'],
      },
      {
        label: 'Labrum',
        group: 'Mouthparts',
        definition:
          'Front upper-lip plate covering the front of the insect mouthparts.',
      },
      {
        label: 'Mandible',
        group: 'Mouthparts',
        definition:
          'Paired jaw structure positioned directly behind the labrum.',
      },
      {
        label: 'Maxilla',
        group: 'Mouthparts',
        definition:
          'Paired mouthpart located between the mandible and the labium.',
      },
      {
        label: 'Labium',
        group: 'Mouthparts',
        definition:
          'Rear lower-lip mouthpart positioned behind the maxilla.',
      },
      {
        label: 'Femur',
        group: 'Leg & Respiration',
        definition:
          'Thick upper leg segment nearest the body shown in the diagram.',
      },
      {
        label: 'Tibia',
        group: 'Leg & Respiration',
        definition:
          'Slender middle leg segment between the femur and the tarsus.',
      },
      {
        label: 'Tarsus',
        group: 'Leg & Respiration',
        definition:
          'Segmented terminal foot portion at the tip of the insect leg.',
      },
      {
        label: 'Spiracle',
        group: 'Leg & Respiration',
        definition:
          'External breathing opening arranged along the lateral body segments.',
      },
      {
        label: 'Nerve cord',
        group: 'Internal & Posterior',
        definition:
          'Ventral longitudinal nerve tract running along the lower interior of the body.',
      },
      {
        label: 'Ovary',
        group: 'Internal & Posterior',
        definition:
          'Egg-producing female reproductive organ inside the abdomen.',
      },
      {
        label: 'Oviduct',
        group: 'Internal & Posterior',
        definition:
          'Duct connecting the ovary toward the posterior reproductive opening.',
      },
      {
        label: 'Spermatheca',
        group: 'Internal & Posterior',
        definition:
          'Sac connected to the female reproductive tract inside the abdomen.',
      },
      {
        label: 'Rectum',
        group: 'Internal & Posterior',
        definition:
          'Terminal rear chamber of the digestive tract inside the posterior abdomen.',
      },
      {
        label: 'Cercus',
        group: 'Internal & Posterior',
        definition:
          'Pointed sensory appendage projecting at the dorsal rear tip of the abdomen.',
      },
      {
        label: 'Ovipositor (folded)',
        group: 'Internal & Posterior',
        definition:
          'Folded egg-laying appendage extending at the ventral rear tip of the abdomen.',
        alt: ['Ovipositor'],
      },
    ],
  },
  {
    id: 'mite-anatomy',
    topic: 'arthropods-insects',
    title: 'Mite Anatomy (Ventral View)',
    sourceRef: 'Walter, D. and Proctor, H.C. (2013) · Lesson 3.2b (p. 14)',
    image: '/diagrams/mite-anatomy.jpg',
    caption:
      'Labeled diagram showing the two mite body regions (Gnathosoma / Capitulum and Idiosoma), anterior mouthparts, eight legs with seven distal parts, ventral plates, striations, and setae.',
    labels: [
      {
        label: 'Gnathosoma / Capitulum',
        group: 'Body Regions & Mouthparts',
        definition:
          'Anterior mouthpart complex projecting at the front of the mite (bearing hypostome, chelicerae, and palpus).',
        alt: ['Gnathosoma', 'Capitulum'],
      },
      {
        label: 'Hypostome',
        group: 'Body Regions & Mouthparts',
        definition:
          'Median ventral mouthpart structure centered at the base/midline of the gnathosoma.',
      },
      {
        label: 'Chelicerae',
        group: 'Body Regions & Mouthparts',
        definition:
          'Paired central mouthparts projecting forward between the palpi.',
      },
      {
        label: 'Palpus',
        group: 'Body Regions & Mouthparts',
        definition:
          'Paired lateral sensory appendage flanking the chelicerae on the gnathosoma.',
        alt: ['Palpi'],
      },
      {
        label: 'Idiosoma',
        group: 'Body Regions & Mouthparts',
        definition:
          'Fused main body trunk behind the gnathosoma that bears the four pairs of legs and ventral plates.',
      },
      {
        label: 'Coxa',
        group: 'Leg Segments (Base to Tip)',
        definition:
          '1st (basal) leg segment anchored directly to the underside of the idiosoma.',
      },
      {
        label: 'Trochanter',
        group: 'Leg Segments (Base to Tip)',
        definition:
          '2nd leg segment located between the coxa and the femur.',
      },
      {
        label: 'Femur',
        group: 'Leg Segments (Base to Tip)',
        definition:
          '3rd leg segment located between the trochanter and the genu.',
      },
      {
        label: 'Genu',
        group: 'Leg Segments (Base to Tip)',
        definition:
          '4th (knee-like) leg segment situated between the femur and the tibia.',
      },
      {
        label: 'Tibia',
        group: 'Leg Segments (Base to Tip)',
        definition:
          '5th leg segment situated between the genu and the tarsus.',
      },
      {
        label: 'Tarsus',
        group: 'Leg Segments (Base to Tip)',
        definition:
          '6th (terminal) leg segment bearing the claw and caruncle at its tip.',
      },
      {
        label: 'Claw',
        group: 'Leg Segments (Base to Tip)',
        definition:
          'Hooked structure at the distal tip of the mite tarsus.',
      },
      {
        label: 'Caruncle',
        group: 'Leg Segments (Base to Tip)',
        definition:
          'Pad-like terminal structure paired with the claw at the tip of the tarsus.',
      },
      {
        label: 'Sternal Plate',
        group: 'Ventral Plates & Surface',
        definition:
          'Anterior ventral plate positioned between the front leg bases.',
      },
      {
        label: 'Genital Plate',
        group: 'Ventral Plates & Surface',
        definition:
          'Large central ventral plate located behind the sternal plate.',
      },
      {
        label: 'Anal Plate',
        group: 'Ventral Plates & Surface',
        definition:
          'Posterior ventral plate located behind the genital plate.',
      },
      {
        label: 'Striations',
        group: 'Ventral Plates & Surface',
        definition:
          'Fine parallel ridged lines visible across the cuticle of the idiosoma.',
      },
      {
        label: 'Setae',
        group: 'Ventral Plates & Surface',
        definition:
          'Hair-like bristles projecting along the margin of the idiosoma and legs.',
      },
    ],
  },
];

export const MIND_MAPS: MindMapGuide[] = [
  {
    id: 'arthropoda-split',
    topic: 'arthropods-insects',
    title: 'Visual Mind Map: Phylum Arthropoda → Insects vs. Mites',
    rootLabel: 'Phylum Arthropoda (~84% of all known animal species)',
    rootNote:
      'Shared traits: segmented bodies, jointed legs, and external skeletons (exoskeletons). Studied in Entomology alongside arachnids, myriapods, and crustaceans.',
    branches: [
      {
        name: 'Class Insecta (Hexapoda)',
        badge: '>1M global species · >24,000 in Britain',
        tone: 'emerald',
        points: [
          '3 major body regions: Head, 3-segmented Thorax, many-segmented Abdomen',
          '3 pairs of legs (6 legs, "Hexapoda") on the thorax; usually 1 or 2 pairs of wings',
          'Head bears 1 pair of antennae, compound eyes, ocelli, and mouthparts (labrum, mandible, maxilla, labium)',
          'Leg segments shown in diagram: Femur → Tibia → Tarsus',
          'Abdomen & breathing: Spiracles, nerve cord, rectum, ovary, oviduct, spermatheca, cercus, ovipositor (folded)',
        ],
      },
      {
        name: 'Mites (Chelicerata)',
        badge: 'Old English: "very small creature"',
        tone: 'amber',
        points: [
          'Member of Chelicerata (with scorpions, pseudoscorpions, spiders)',
          '2 main body regions shown in diagram: Gnathosoma / Capitulum (anterior) + Idiosoma (main body)',
          '4 pairs of jointed legs (8 legs shown in Walter & Proctor diagram); wingless and without antennae',
          'Mouthparts on Gnathosoma: Hypostome, Chelicerae, and Palpus',
          'Leg segments shown: Coxa → Trochanter → Femur → Genu → Tibia → Tarsus (+ Claw & Caruncle)',
          'Ventral & surface features: Sternal Plate, Genital Plate, Anal Plate, Striations, Setae',
        ],
      },
    ],
  },
];

export const LESSON_GALLERIES: LessonGalleryGuide[] = [
  {
    id: 'major-vertebrate-rodents',
    topic: 'vertebrate-pests',
    sectionHeading: 'A. Major Vertebrate Pests',
    subsectionHeading: '1. Rodents',
    paragraph:
      'Rodentia is an order of mammals also known as rodents, characterized by two constantly growing incisors in the upper and lower jaws which must be kept short by gnawing. These teeth are used for cutting wood, biting through the skin of fruit or for defense. Some species have historically been pests, eating seeds stored by people, those in the field and spreading disease.',
    listLeadIn:
      'There are five species of rodents which are considered as major rodent pests:',
    species: [
      {
        marker: 'A',
        scientificName: 'Rattus rattus complex',
        authority: '(Means)',
        separator: '–',
        commonName: 'common rice field rat',
        image: '/diagrams/rodent-a.jpg',
        altText: 'Specimen A: Rattus rattus complex (Means), common rice field rat',
      },
      {
        marker: 'B',
        scientificName: 'Rattus argentiventer',
        separator: '–',
        commonName: 'Asian rice field rat',
        image: '/diagrams/rodent-b.jpg',
        altText: 'Specimen B: Rattus argentiventer, Asian rice field rat',
      },
      {
        marker: 'C',
        scientificName: 'Rattus exulans',
        separator: '–',
        commonName: 'Polynesian rat or bush rat',
        image: '/diagrams/rodent-c.jpg',
        altText: 'Specimen C: Rattus exulans, Polynesian rat or bush rat',
      },
      {
        marker: 'D',
        scientificName: 'Rattus norvegicus',
        authority: '(Berkenhont)',
        separator: '–',
        commonName: 'Norway rat',
        image: '/diagrams/rodent-d.jpg',
        altText: 'Specimen D: Rattus norvegicus (Berkenhont), Norway rat',
      },
      {
        marker: 'E',
        scientificName: 'Mus musculus castaneus',
        authority: '(Waterhouse)',
        separator: '-',
        commonName: 'Philippine house mouse',
        image: '/diagrams/rodent-e.jpg',
        altText: 'Specimen E: Mus musculus castaneus (Waterhouse), Philippine house mouse',
      },
    ],
    caption:
      'Figure 1. Visual reference of the five major rodent pest species (A–E) under Order Rodentia.',
  },
];

export const LESSON_SECTIONS: LessonVisualSection[] = [
  {
    id: 'importance-and-management-of-insects',
    topic: 'arthropods-insects',
    heading: '3.2e: Importance of Insect',
    subtitle: 'Why are insects important? (Lesson 3.2e–3.2f, pp. 18–19)',
    blocks: [
      {
        subheading: '1. Pollination and food production',
        body: 'Insects play a key role in producing agricultural crops. Insect-pollinated plants attract insects with nectar to then carry pollen to other plants and fertilize them to create seeds and fruit.',
        image: '/diagrams/importance-1-pollination.jpg',
        imageAlt: 'Butterfly feeding on nectar and pollinating a flower',
        imageCaption: 'Insect pollinator visiting flower blossoms.',
      },
      {
        subheading: '2. Biological control of more harmful insects',
        body: 'Some insects are predators that feed on other invertebrates that may cause harm to humans or human crops.',
        image: '/diagrams/importance-2-biocontrol.jpg',
        imageAlt: 'Predatory ladybird beetle approaching a small insect pest on a leaf',
        imageCaption: 'Predatory insect acting as biological control against crop pests.',
      },
      {
        subheading: '3. Animal feed',
        body: 'Insects have a huge importance in the natural food chain, as they are a primary food source for many other animals.',
        image: '/diagrams/importance-3-animal-feed.jpg',
        imageAlt: 'Close-up of an insect head showing large patterned compound eyes',
        imageCaption: 'Insects serve as a primary food source in the natural food chain.',
      },
      {
        subheading: '4. Recycling and waste clearance',
        body: 'Lots of insects will eat and help to break down dead and decaying debris which can clog or infect soil and water streams. Their role in recycling is very important as this break down of waste helps create healthy, fertile soil.',
        image: '/diagrams/importance-4-recycling.jpg',
        imageAlt: 'Fly resting beneath a green leaf',
        imageCaption: 'Decomposer/scavenger insect helping recycle decaying organic debris.',
      },
      {
        subheading: '5. Insect protein',
        body: "In some parts of the world, insects are considered a delicacy and regular addition to one's everyday diet.",
        image: '/diagrams/importance-5-protein.jpg',
        imageAlt: 'Bowls of prepared edible insects served alongside food on a wooden board',
        imageCaption: 'Edible insects used as a protein food source.',
      },
      {
        subheading: '3.2f: Strategies or programs for insect management',
        body: 'Recommended strategies and cultural/ecological programs for managing insect pests:',
        bullets: [
          'Crop rotation',
          'Trap crops',
          'Crop diversity',
          'Inter-cropping',
          'Resistant/tolerant varieties',
          'Planting time',
          'Cultivation',
          'Mulching, sanitation',
          'Other tools, such as beneficial organisms, to minimize pest problems.',
          'Maintain plant health using soil, water, and fertility management.',
        ],
      },
    ],
  },
  {
    id: 'minor-vertebrate-pests',
    topic: 'vertebrate-pests',
    heading: 'B. Minor Vertebrate Pests',
    subtitle: 'Lesson 3.2g (pp. 21–22) · Bats, Monkeys, Birds, and Philippine wild pig',
    blocks: [
      {
        subheading: '2. Bats',
        body: 'The Philippine has around 56 species of bats and is home to the smallest and the largest bats among the 1,000 species in the world. The smallest bat in the world is the Philippine bamboo bat. The world’s largest bats are the giant flying fox (Acerodon jubatus) and golden crown flying fox (Pteropus vampyrus).',
        image: '/diagrams/minor-bats.jpg',
        imageAlt: 'Reference photographs of bats in flight and roosting',
        imageCaption: 'Reference views of bat species.',
      },
      {
        subheading: '3. Monkeys',
        body: 'This Order contains all the species commonly related to the lemurs, monkeys, apes and humans. In the Philippines, the major pest belonging to this Order are the crab-eating Macaque (Raffles, 1821).',
        image: '/diagrams/minor-monkey.jpg',
        imageAlt: 'Crab-eating Macaque (Raffles, 1821) perched on a branch',
        imageCaption: 'Crab-eating Macaque (Raffles, 1821).',
      },
      {
        subheading: '4. Birds',
        body: 'Birds belong to class Aves of Phylum Chordata. They are the only animals with feathers and the mostly highly specialized among the vertebrates. As a group, they are adapted to aerial life with some exceptions. Feet and beaks vary according to modes of life and different kinds of food. Grain eating birds have become important agricultural pests.',
        image: '/diagrams/minor-bird.jpg',
        imageAlt: 'Grain-eating bird perched on a branch',
        imageCaption: 'Representative grain-eating bird (Class Aves).',
      },
      {
        subheading: '5. Philippine wild pig',
        body: 'Two Philippine wild pig species listed under minor vertebrate pests:',
        gallery: [
          {
            marker: 'A',
            title: 'Visayan Warty Pig',
            scientificName: 'Sus cebifrons',
            image: '/diagrams/wild-pig-a.jpg',
            altText: 'A. Visayan Warty Pig (Sus cebifrons)',
          },
          {
            marker: 'B',
            title: 'Philippine Warty Pig',
            scientificName: 'Sus philippensis',
            image: '/diagrams/wild-pig-b.jpg',
            altText: 'B. Philippine Warty Pig (Sus philippensis)',
          },
        ],
        galleryCaption:
          'Figure 2. Comparison of Philippine wild pig species: A. Visayan Warty Pig (Sus cebifrons) and B. Philippine Warty Pig (Sus philippensis).',
      },
    ],
  },
];

export { clue, idc, withAlt, tfc };
