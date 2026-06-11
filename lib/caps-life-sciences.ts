import type { CapsContentSection } from "@/lib/types";

type LifeSciencesGroup = {
  pageStart: number;
  term: 1 | 2 | 3 | 4;
  topic: string;
  sourceTitle: string;
  focusAreas: string[];
  keywords: string[];
  intro: string;
};

const DBE_MIND_THE_GAP_URL = "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx";

const groups: LifeSciencesGroup[] = [
  {
    pageStart: 1,
    term: 1,
    topic: "DNA and genetics",
    sourceTitle: "Grade 12 Life Sciences Mind the Gap",
    focusAreas: [
      "DNA structure",
      "Base pairing",
      "DNA replication",
      "Chromosomes and genes",
      "Meiosis stages",
      "Variation",
      "Mutations",
      "Monohybrid crosses",
      "Dihybrid crosses",
      "Pedigrees and karyotypes"
    ],
    keywords: ["dna", "genes", "chromosomes", "inheritance"],
    intro: "Use the CAPS language for heredity, chromosome behaviour, and variation."
  },
  {
    pageStart: 21,
    term: 2,
    topic: "Reproduction and development",
    sourceTitle: "Grade 12 Life Sciences Mind the Gap",
    focusAreas: [
      "Reproductive systems",
      "Gamete formation",
      "Menstrual cycle",
      "Fertilisation and implantation",
      "Pregnancy and development",
      "Contraception",
      "Hormones in reproduction",
      "Birth and labour",
      "Fertility and infertility",
      "Adolescent health"
    ],
    keywords: ["reproduction", "hormones", "fertilisation", "development"],
    intro: "Use the CAPS language for organs, hormones, fertilisation, and development."
  },
  {
    pageStart: 41,
    term: 2,
    topic: "Human physiology",
    sourceTitle: "Grade 12 Life Sciences Mind the Gap",
    focusAreas: [
      "Digestion and nutrition",
      "Gas exchange and respiration",
      "Circulation and blood",
      "Immunity and disease",
      "Excretion and osmoregulation",
      "Nervous system",
      "Endocrine system",
      "Homeostasis",
      "Skeleton and muscles",
      "Vitamin and mineral balance"
    ],
    keywords: ["human body", "physiology", "homeostasis", "systems"],
    intro: "Use the CAPS language for organ systems, control, and feedback."
  },
  {
    pageStart: 61,
    term: 3,
    topic: "Ecology and conservation",
    sourceTitle: "Grade 12 Life Sciences Mind the Gap",
    focusAreas: [
      "Ecosystems",
      "Food chains and webs",
      "Energy flow",
      "Nutrient cycles",
      "Population ecology",
      "Succession",
      "Biodiversity",
      "Conservation strategies",
      "Sampling techniques",
      "Human impact and pollution"
    ],
    keywords: ["ecology", "ecosystems", "conservation", "population"],
    intro: "Use the CAPS language for ecosystems, population change, and conservation."
  },
  {
    pageStart: 81,
    term: 4,
    topic: "Evolution and classification",
    sourceTitle: "Grade 12 Life Sciences Mind the Gap",
    focusAreas: [
      "Natural selection",
      "Adaptation",
      "Speciation",
      "Fossil evidence",
      "Classification hierarchy",
      "Phylogenetic trees",
      "Human evolution",
      "Antibiotic resistance",
      "Evidence for evolution",
      "Biotechnology and ethics"
    ],
    keywords: ["evolution", "classification", "adaptation", "selection"],
    intro: "Use the CAPS language for evolutionary change, classification, and evidence."
  }
];

export const lifeSciencesCapsSections: CapsContentSection[] = groups.flatMap((group, groupIndex) =>
  group.focusAreas.flatMap((focus, focusIndex) => {
    const basePage = group.pageStart + focusIndex * 2;
    const focusSlug = focus.toLowerCase();

    return [
      {
        subject: "Life Sciences",
        grade: 12,
        term: group.term,
        topic: group.topic,
        sectionTitle: `${focus} explained`,
        sectionSummary: `${group.intro} Start with ${focusSlug}, then build the answer in a clear CAPS sequence.`,
        sectionText:
          `Start with ${focusSlug} and define the core idea in one sentence. Then explain how it fits into ${group.topic.toLowerCase()} using the correct biological terms, and finish with one short example or comparison to show understanding.`,
        sourceType: "mind-the-gap",
        sourceTitle: group.sourceTitle,
        sourceUrl: DBE_MIND_THE_GAP_URL,
        pageStart: basePage,
        pageEnd: basePage,
        keywords: [...group.keywords, ...normalizeKeywords(focus), "explanation"],
        version: 1,
        lastVerifiedAt: "2026-06-10"
      },
      {
        subject: "Life Sciences",
        grade: 12,
        term: group.term,
        topic: group.topic,
        sectionTitle: `${focus} exam method`,
        sectionSummary: `Answer ${focusSlug} questions by showing the step-by-step CAPS method and using the correct command words.`,
        sectionText:
          `Read the command word, identify the biological process or structure in ${focusSlug}, and answer in short ordered steps. If there is a diagram or graph, label or describe it first, then explain the function, sequence, or trend before you conclude.`,
        sourceType: "mind-the-gap",
        sourceTitle: group.sourceTitle,
        sourceUrl: DBE_MIND_THE_GAP_URL,
        pageStart: basePage,
        pageEnd: basePage,
        keywords: [...group.keywords, ...normalizeKeywords(focus), "exam method"],
        version: 1,
        lastVerifiedAt: "2026-06-10"
      }
    ];
  })
);

function normalizeKeywords(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);
}
