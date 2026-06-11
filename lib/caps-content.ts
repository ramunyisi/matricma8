export type CapsContentCategory =
  | "CAPS policy"
  | "Mind the Gap"
  | "Workbooks"
  | "Digital content";

export type CapsContentItem = {
  subject: string;
  grade: "all" | 10 | 11 | 12;
  category: CapsContentCategory;
  title: string;
  summary: string;
  sourceUrl: string;
  tags: string[];
};

export type CapsContentSection = {
  id?: string;
  subject: string;
  grade: "all" | 10 | 11 | 12;
  term?: number;
  topic: string;
  sectionTitle: string;
  sectionSummary: string;
  sectionText: string;
  sourceType: "caps" | "mind-the-gap" | "workbook" | "digital";
  sourceTitle: string;
  sourceUrl: string;
  pageStart?: number;
  pageEnd?: number;
  keywords: string[];
  version: number;
  lastVerifiedAt?: string;
};

const DBE_CAPS_URL = "https://www.education.gov.za/Curriculum/CurriculumAssessmentPolicyStatements%28CAPS%29.aspx";
const DBE_MIND_THE_GAP_URL = "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx";
const DBE_WORKBOOKS_URL = "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/Workbooks.aspx";
const DBE_DIGITAL_CONTENT_URL = "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/DigitalContent.aspx";

export const capsContentLibrary: CapsContentItem[] = [
  {
    subject: "All subjects",
    grade: "all",
    category: "CAPS policy",
    title: "CAPS policy overview",
    summary: "Official DBE CAPS policy page and subject documents for Grades R-12.",
    sourceUrl: DBE_CAPS_URL,
    tags: ["policy", "curriculum", "assessment", "official"]
  },
  {
    subject: "All subjects",
    grade: 12,
    category: "Mind the Gap",
    title: "Mind the Gap Grade 12 study guides",
    summary: "DBE Grade 12 CAPS-aligned study guides for revision and exam preparation.",
    sourceUrl: DBE_MIND_THE_GAP_URL,
    tags: ["grade 12", "revision", "study guide", "exam prep"]
  },
  {
    subject: "All subjects",
    grade: "all",
    category: "Workbooks",
    title: "DBE workbooks",
    summary: "DBE workbook resources for learner practice and classroom support.",
    sourceUrl: DBE_WORKBOOKS_URL,
    tags: ["practice", "workbook", "learner support"]
  },
  {
    subject: "All subjects",
    grade: "all",
    category: "Digital content",
    title: "DBE digital content",
    summary: "Official DBE digital learning resources and support material.",
    sourceUrl: DBE_DIGITAL_CONTENT_URL,
    tags: ["digital", "online", "support material"]
  },
  {
    subject: "Mathematics",
    grade: 12,
    category: "Mind the Gap",
    title: "Grade 12 Mathematics Mind the Gap",
    summary: "Use the DBE Mathematics guide alongside past papers for CAPS-aligned revision.",
    sourceUrl: DBE_MIND_THE_GAP_URL,
    tags: ["mathematics", "functions", "trigonometry", "statistics"]
  },
  {
    subject: "Physical Sciences",
    grade: 12,
    category: "Mind the Gap",
    title: "Grade 12 Physical Sciences Mind the Gap",
    summary: "Use the DBE Physical Sciences guide and DBE papers for exam-style practice.",
    sourceUrl: DBE_MIND_THE_GAP_URL,
    tags: ["physics", "chemistry", "exam practice"]
  },
  {
    subject: "Life Sciences",
    grade: 12,
    category: "Mind the Gap",
    title: "Grade 12 Life Sciences Mind the Gap",
    summary: "Use the DBE Life Sciences guide for CAPS revision and answer structure.",
    sourceUrl: DBE_MIND_THE_GAP_URL,
    tags: ["life sciences", "biology", "revision"]
  },
  {
    subject: "Accounting",
    grade: 12,
    category: "Mind the Gap",
    title: "Grade 12 Accounting Mind the Gap",
    summary: "DBE Accounting revision material for journal entries, financial statements, and exam technique.",
    sourceUrl: DBE_MIND_THE_GAP_URL,
    tags: ["accounting", "journals", "financial statements"]
  },
  {
    subject: "Geography",
    grade: 12,
    category: "Mind the Gap",
    title: "Grade 12 Geography Mind the Gap",
    summary: "Use the DBE Geography guide for maps, case studies, and structured answers.",
    sourceUrl: DBE_MIND_THE_GAP_URL,
    tags: ["geography", "maps", "case studies"]
  },
  {
    subject: "English Home Language",
    grade: 12,
    category: "Mind the Gap",
    title: "Grade 12 English Home Language Mind the Gap",
    summary: "DBE English HL revision support for literature, language, and writing tasks.",
    sourceUrl: DBE_MIND_THE_GAP_URL,
    tags: ["english", "literature", "writing"]
  },
  {
    subject: "English First Additional Language",
    grade: 12,
    category: "Mind the Gap",
    title: "Grade 12 English First Additional Language Mind the Gap",
    summary: "DBE English FAL revision support for comprehension, summary writing, and language use.",
    sourceUrl: DBE_MIND_THE_GAP_URL,
    tags: ["english fal", "comprehension", "summary writing"]
  },
  {
    subject: "isiZulu Home Language",
    grade: 12,
    category: "Mind the Gap",
    title: "Grade 12 isiZulu Home Language Mind the Gap",
    summary: "DBE isiZulu HL revision support for literature, language, and exam preparation.",
    sourceUrl: DBE_MIND_THE_GAP_URL,
    tags: ["isizulu", "home language", "revision"]
  },
  {
    subject: "Physical Sciences",
    grade: 12,
    category: "Mind the Gap",
    title: "Grade 12 Physical Sciences Mind the Gap: Electricity",
    summary: "Use the DBE guide for circuits, current, resistance, and power calculations.",
    sourceUrl: DBE_MIND_THE_GAP_URL,
    tags: ["electricity", "circuits", "current", "resistance"]
  },
  {
    subject: "Life Sciences",
    grade: 12,
    category: "Mind the Gap",
    title: "Grade 12 Life Sciences Mind the Gap: Genetics",
    summary: "Use the DBE guide for inheritance, meiosis, and genetic crosses.",
    sourceUrl: DBE_MIND_THE_GAP_URL,
    tags: ["genetics", "inheritance", "meiosis"]
  },
  {
    subject: "Business Studies",
    grade: 12,
    category: "Mind the Gap",
    title: "Grade 12 Business Studies Mind the Gap",
    summary: "Use the DBE guide for business environments, ownership, and exam structure.",
    sourceUrl: DBE_MIND_THE_GAP_URL,
    tags: ["business environments", "ownership", "entrepreneurship"]
  },
  {
    subject: "Economics",
    grade: 12,
    category: "Mind the Gap",
    title: "Grade 12 Economics Mind the Gap",
    summary: "Use the DBE guide for inflation, fiscal policy, and market structures.",
    sourceUrl: DBE_MIND_THE_GAP_URL,
    tags: ["inflation", "fiscal policy", "market structures"]
  },
  {
    subject: "History",
    grade: 12,
    category: "Mind the Gap",
    title: "Grade 12 History Mind the Gap",
    summary: "Use the DBE guide for source-based questions and essay structure.",
    sourceUrl: DBE_MIND_THE_GAP_URL,
    tags: ["source-based", "essay", "history"]
  },
  {
    subject: "Mathematical Literacy",
    grade: 12,
    category: "Mind the Gap",
    title: "Grade 12 Mathematical Literacy Mind the Gap",
    summary: "Use the DBE guide for financial maths, graphs, and interpretive questions.",
    sourceUrl: DBE_MIND_THE_GAP_URL,
    tags: ["financial maths", "graphs", "interpretation"]
  }
];

const baseCapsContentSections: CapsContentSection[] = [
  {
    subject: "All subjects",
    grade: "all",
    topic: "CAPS policy",
    sectionTitle: "What CAPS is",
    sectionSummary: "CAPS is the official DBE curriculum and assessment policy for approved school subjects.",
    sectionText:
      "The Curriculum and Assessment Policy Statement is the single official policy document for learning and teaching in South African schools. It defines the curriculum and the assessment approach for approved subjects.",
    sourceType: "caps",
    sourceTitle: "DBE CAPS policy",
    sourceUrl: "https://www.education.gov.za/Curriculum/CurriculumAssessmentPolicyStatements%28CAPS%29.aspx",
    keywords: ["policy", "curriculum", "assessment", "official"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Mathematics",
    grade: 12,
    term: 1,
    topic: "Functions",
    sectionTitle: "Functions and graphs",
    sectionSummary: "Use the DBE Mind the Gap and past papers to practise domain, range, intercepts, and transformations.",
    sectionText:
      "Start with the rule of the function, identify the domain and range, then describe intercepts and transformations step by step. When answering exam questions, show each substitution clearly and check the graph against the given conditions.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Mathematics Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 1,
    pageEnd: 8,
    keywords: ["functions", "graphs", "domain", "range", "transformations"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Mathematics",
    grade: 12,
    term: 2,
    topic: "Trigonometry",
    sectionTitle: "Trigonometric equations",
    sectionSummary: "Focus on identities, angle reduction, and equation solving in CAPS exam style.",
    sectionText:
      "Use the basic identities first, reduce the equation to a familiar ratio, and solve for the angle carefully. In the exam, list every identity used and show the algebra before choosing the final angle values.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Mathematics Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 9,
    pageEnd: 16,
    keywords: ["trigonometry", "identities", "equations"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Geography",
    grade: 12,
    term: 1,
    topic: "Maps and GIS",
    sectionTitle: "Topographic and GIS questions",
    sectionSummary: "Practice map reading, scale, relief, and GIS interpretation with the DBE guidance.",
    sectionText:
      "Read the question carefully, identify the map symbol or GIS feature, and refer to the legend before answering. For calculation questions, show the formula, substitute the map values, and write the answer with the correct units.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Geography Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 1,
    pageEnd: 10,
    keywords: ["maps", "gis", "scale", "topographic"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Accounting",
    grade: 12,
    term: 3,
    topic: "Financial statements",
    sectionTitle: "Financial statements and ratios",
    sectionSummary: "Use the correct format, totals, and adjustments before calculating ratios.",
    sectionText:
      "Start with the source documents, move into the journals, and then present the financial statements in the prescribed format. When calculating ratios, state the formula, substitute the values, and comment on what the answer means for the business.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Accounting Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 1,
    pageEnd: 12,
    keywords: ["financial statements", "ratios", "journals"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "English Home Language",
    grade: 12,
    term: 4,
    topic: "Essay writing",
    sectionTitle: "Essay structure and style",
    sectionSummary: "Plan, draft, and edit with a clear introduction, body, and conclusion.",
    sectionText:
      "Keep the argument focused on the question. Use a clear introduction, develop one idea per paragraph, and finish with a conclusion that answers the task directly. In literature questions, support every claim with evidence from the text.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 English Home Language Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 1,
    pageEnd: 14,
    keywords: ["essay", "writing", "literature", "language"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Physical Sciences",
    grade: 12,
    term: 2,
    topic: "Electricity",
    sectionTitle: "Circuits, current, and resistance",
    sectionSummary: "Solve electricity questions by starting with Ohm's law and identifying the circuit correctly.",
    sectionText:
      "Read the circuit carefully, identify series or parallel connections, and choose the correct formula before calculating. Show units clearly and explain what the answer means in the context of the circuit.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Physical Sciences Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 17,
    pageEnd: 26,
    keywords: ["electricity", "circuits", "ohms law", "resistance"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Life Sciences",
    grade: 12,
    term: 2,
    topic: "Genetics",
    sectionTitle: "Inheritance and genetic crosses",
    sectionSummary: "Follow the allele notation, draw the crosses, and explain how traits are inherited.",
    sectionText:
      "Set out the parent genotypes first, then complete the Punnett square or genetic cross step by step. When explaining inheritance, use the correct terms for dominant, recessive, genotype, and phenotype.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Life Sciences Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 15,
    pageEnd: 24,
    keywords: ["genetics", "inheritance", "punnett square", "alleles"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Life Sciences",
    grade: 12,
    term: 1,
    topic: "DNA and cell division",
    sectionTitle: "DNA, meiosis, and chromosome behaviour",
    sectionSummary: "Connect DNA structure to meiosis and explain how variation is created.",
    sectionText:
      "Describe the role of DNA, chromosomes, and genes before explaining how meiosis produces variation. In exam questions, keep the sequence of events clear and use the correct biological terminology throughout.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Life Sciences Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 1,
    pageEnd: 14,
    keywords: ["dna", "meiosis", "chromosomes", "variation"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Life Sciences",
    grade: 12,
    term: 2,
    topic: "Reproduction",
    sectionTitle: "Human reproduction and hormonal control",
    sectionSummary: "Explain reproductive organs, hormones, and fertilisation in CAPS language.",
    sectionText:
      "Identify the organs first, then explain the pathway of gamete production, fertilisation, and development. When hormones are involved, mention the gland, the hormone, and the effect in the body.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Life Sciences Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 25,
    pageEnd: 34,
    keywords: ["reproduction", "hormones", "fertilisation"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Life Sciences",
    grade: 12,
    term: 3,
    topic: "Ecology",
    sectionTitle: "Population ecology and ecosystems",
    sectionSummary: "Work through food chains, nutrient cycles, population graphs, and ecosystem interactions.",
    sectionText:
      "Start with the organism's role in the ecosystem, then explain how energy and nutrients move through the system. For graph questions, state the trend, identify the reason, and support the answer with the correct ecological terms.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Life Sciences Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 35,
    pageEnd: 46,
    keywords: ["ecology", "ecosystems", "food chains", "graphs"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Life Sciences",
    grade: 12,
    term: 4,
    topic: "Evolution",
    sectionTitle: "Evolution by natural selection",
    sectionSummary: "Use natural selection, adaptation, and evidence to explain evolutionary change.",
    sectionText:
      "Explain the variation in a population, then show how environmental pressure leads to survival and reproduction of better-adapted organisms. In long questions, link the process to adaptation and support the answer with evidence from the source or scenario.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Life Sciences Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 47,
    pageEnd: 56,
    keywords: ["evolution", "natural selection", "adaptation"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Business Studies",
    grade: 12,
    term: 1,
    topic: "Business environments",
    sectionTitle: "Business environments and problem solving",
    sectionSummary: "Use CAPS language to classify environments and propose practical responses.",
    sectionText:
      "Identify whether the issue is internal or external, then explain the effect on the business and suggest a realistic strategy. In exam questions, link the problem, the impact, and the solution clearly.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Business Studies Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 1,
    pageEnd: 10,
    keywords: ["business environments", "problem solving", "strategy"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Economics",
    grade: 12,
    term: 3,
    topic: "Macroeconomics",
    sectionTitle: "Inflation and policy responses",
    sectionSummary: "Explain inflation using the correct economic language and show the policy effect.",
    sectionText:
      "Define inflation, identify the cause, and then explain how fiscal or monetary policy can influence prices. In evaluation questions, mention both positive and negative effects before concluding.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Economics Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 11,
    pageEnd: 20,
    keywords: ["inflation", "policy", "macroeconomics"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "History",
    grade: 12,
    term: 4,
    topic: "Source-based questions",
    sectionTitle: "Source analysis and essays",
    sectionSummary: "Use the source, provenance, and context to build a stronger answer.",
    sectionText:
      "Read the source, identify the message, then support your answer with evidence from the source and your own knowledge. For essays, build a clear argument with a short introduction, supporting paragraphs, and a conclusion.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 History Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 1,
    pageEnd: 18,
    keywords: ["source-based", "essays", "context"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Mathematical Literacy",
    grade: 12,
    term: 2,
    topic: "Financial mathematics",
    sectionTitle: "Financial calculations and interpretation",
    sectionSummary: "Work through percentages, interest, and graphs carefully, then interpret the result.",
    sectionText:
      "Choose the correct formula, show substitution clearly, and keep units and rounding accurate. For data and graph questions, state what the trend means before giving the final answer.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Mathematical Literacy Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 5,
    pageEnd: 14,
    keywords: ["financial maths", "graphs", "interpretation"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "English First Additional Language",
    grade: 12,
    term: 1,
    topic: "Comprehension",
    sectionTitle: "Comprehension and summary writing",
    sectionSummary: "Read the passage carefully, answer the literal questions first, then infer meaning from context.",
    sectionText:
      "Read the question, locate the evidence in the text, and answer in full sentences. For summary writing, keep to the key ideas and avoid copying long phrases unless the question allows it.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 English First Additional Language Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 1,
    pageEnd: 12,
    keywords: ["comprehension", "summary", "context"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Business Studies",
    grade: 12,
    term: 2,
    topic: "Conflict and management",
    sectionTitle: "Conflict management and business responses",
    sectionSummary: "Explain the conflict, its cause, and the business response using CAPS terminology.",
    sectionText:
      "State the cause of the conflict, describe how it affects the workplace, and then give a realistic management response. In exam answers, connect the problem to the response instead of listing points separately.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Business Studies Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 11,
    pageEnd: 18,
    keywords: ["conflict", "management", "workplace"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Economics",
    grade: 12,
    term: 2,
    topic: "Market structures",
    sectionTitle: "Perfect competition and monopoly",
    sectionSummary: "Compare market structures and explain how they affect price and competition.",
    sectionText:
      "Identify the market structure first, then use the features to explain how firms set prices and compete. In evaluation questions, mention the strengths and weaknesses of the structure before giving a conclusion.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Economics Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 21,
    pageEnd: 30,
    keywords: ["market structures", "monopoly", "competition"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "History",
    grade: 12,
    term: 2,
    topic: "Apartheid South Africa",
    sectionTitle: "Apartheid source analysis",
    sectionSummary: "Use source evidence and historical context to answer apartheid questions accurately.",
    sectionText:
      "Read the source carefully, identify the message and bias where relevant, and support the response with your own knowledge. For essays, build a timeline of events and write one clear argument per paragraph.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 History Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 19,
    pageEnd: 30,
    keywords: ["apartheid", "source analysis", "context"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  },
  {
    subject: "Mathematics",
    grade: 12,
    term: 3,
    topic: "Calculus",
    sectionTitle: "Differentiation and optimisation",
    sectionSummary: "Differentiate carefully and show the algebra before setting the derivative to zero.",
    sectionText:
      "Use the differentiation rule correctly, simplify the expression, and then solve for stationary points. If the question asks for maxima or minima, explain the reason based on the sign or second derivative test.",
    sourceType: "mind-the-gap",
    sourceTitle: "Grade 12 Mathematics Mind the Gap",
    sourceUrl: "https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx",
    pageStart: 17,
    pageEnd: 26,
    keywords: ["calculus", "differentiation", "optimisation"],
    version: 1,
    lastVerifiedAt: "2026-06-10"
  }
];

export const capsContentSections: CapsContentSection[] = [...baseCapsContentSections, ...lifeSciencesCapsSections];

export function getCapsContentForCoach(subjectName?: string, grade?: number, limit = 6) {
  const normalizedSubject = normalize(subjectName ?? "");
  const items = capsContentLibrary.filter((item) => {
    const matchesSubject =
      !normalizedSubject ||
      normalize(item.subject).includes(normalizedSubject) ||
      normalizedSubject.includes(normalize(item.subject));
    const matchesGrade = !grade || item.grade === "all" || item.grade === grade;
    return matchesSubject && matchesGrade;
  });

  const prioritized = [
    ...items.filter((item) => item.category === "Mind the Gap"),
    ...items.filter((item) => item.category !== "Mind the Gap")
  ];

  return prioritized.slice(0, limit).map((item) => ({
    subject: item.subject,
    grade: item.grade,
    category: item.category,
    title: item.title,
    summary: item.summary,
    sourceUrl: item.sourceUrl,
    tags: item.tags
  }));
}

export function summarizeCapsContentForPrompt(subjectName?: string, grade?: number, limit = 6) {
  const items = getCapsContentForCoach(subjectName, grade, limit);
  if (items.length === 0) return [];
  return items;
}

export function getCapsSectionsForCoach(subjectName?: string, grade?: number, query?: string, limit = 5) {
  const normalizedSubject = normalize(subjectName ?? "");
  const normalizedQuery = normalize(query ?? "");

  const items = capsContentSections.filter((item) => {
    const matchesSubject =
      !normalizedSubject ||
      normalize(item.subject).includes(normalizedSubject) ||
      normalizedSubject.includes(normalize(item.subject));
    const matchesGrade = !grade || item.grade === "all" || item.grade === grade;
    const haystack = [item.topic, item.sectionTitle, item.sectionSummary, item.sectionText, ...item.keywords].join(" ").toLowerCase();
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    return matchesSubject && matchesGrade && matchesQuery;
  });

  const prioritized = [
    ...items.filter((item) => item.subject !== "All subjects"),
    ...items.filter((item) => item.subject === "All subjects")
  ];

  return prioritized.slice(0, limit);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
import { lifeSciencesCapsSections } from "@/lib/caps-life-sciences";
