insert into public.subjects (name, grade, curriculum)
select subject_name, grade, 'CAPS'
from unnest(array[
  'Accounting',
  'Agricultural Management Practices',
  'Agricultural Sciences',
  'Agricultural Technology',
  'Business Studies',
  'Civil Technology',
  'Computer Applications Technology',
  'Consumer Studies',
  'Dance Studies',
  'Design',
  'Dramatic Arts',
  'Economics',
  'Electrical Technology',
  'Engineering Graphics and Design',
  'English Home Language',
  'English First Additional Language',
  'English Second Additional Language',
  'Geography',
  'History',
  'Information Technology',
  'isiNdebele Home Language',
  'isiXhosa Home Language',
  'isiZulu Home Language',
  'Sepedi Home Language',
  'Sesotho Home Language',
  'Setswana Home Language',
  'Siswati Home Language',
  'Tshivenda Home Language',
  'Xitsonga Home Language',
  'Mathematics',
  'Mathematical Literacy',
  'Physical Sciences',
  'Life Sciences',
  'Life Orientation',
  'Hospitality Studies',
  'Mechanical Technology',
  'Music',
  'Religion Studies',
  'Technical Mathematics',
  'Technical Sciences',
  'Tourism',
  'Visual Arts'
]) as subject_name
cross join generate_series(10, 12) as grade
on conflict (name, grade, curriculum) do nothing;

insert into public.topics (subject_id, name, caps_term, grade)
select s.id, topic_name, caps_term, s.grade
from public.subjects s
join lateral (
  values
    ('Mathematics', 'Functions and graphs', 1),
    ('Mathematics', 'Calculus basics', 3),
    ('Physical Sciences', 'Newton''s laws and momentum', 1),
    ('Physical Sciences', 'Electric circuits', 3),
    ('Life Sciences', 'Genetics and inheritance', 2),
    ('Accounting', 'Companies financial statements', 2),
    ('Geography', 'Climate and weather', 1),
    ('Business Studies', 'Business environments', 1)
) topic(subject_name, topic_name, caps_term) on topic.subject_name = s.name
on conflict (subject_id, name, grade) do nothing;

insert into public.caps_content_sections (
  subject,
  grade,
  term,
  topic,
  section_title,
  section_summary,
  section_text,
  source_type,
  source_title,
  source_url,
  page_start,
  page_end,
  keywords,
  version,
  last_verified_at
) values
(
  'All subjects',
  null,
  null,
  'CAPS policy',
  'What CAPS is',
  'CAPS is the official DBE curriculum and assessment policy for approved school subjects.',
  'The Curriculum and Assessment Policy Statement is the single official policy document for learning and teaching in South African schools. It defines the curriculum and the assessment approach for approved subjects.',
  'caps',
  'DBE CAPS policy',
  'https://www.education.gov.za/Curriculum/CurriculumAssessmentPolicyStatements%28CAPS%29.aspx',
  null,
  null,
  array['policy', 'curriculum', 'assessment', 'official'],
  1,
  '2026-06-10'
),
(
  'Mathematics',
  12,
  1,
  'Functions',
  'Functions and graphs',
  'Use the DBE Mind the Gap and past papers to practise domain, range, intercepts, and transformations.',
  'Start with the rule of the function, identify the domain and range, then describe intercepts and transformations step by step. When answering exam questions, show each substitution clearly and check the graph against the given conditions.',
  'mind-the-gap',
  'Grade 12 Mathematics Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  1,
  8,
  array['functions', 'graphs', 'domain', 'range', 'transformations'],
  1,
  '2026-06-10'
),
(
  'Mathematics',
  12,
  2,
  'Trigonometry',
  'Trigonometric equations',
  'Focus on identities, angle reduction, and equation solving in CAPS exam style.',
  'Use the basic identities first, reduce the equation to a familiar ratio, and solve for the angle carefully. In the exam, list every identity used and show the algebra before choosing the final angle values.',
  'mind-the-gap',
  'Grade 12 Mathematics Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  9,
  16,
  array['trigonometry', 'identities', 'equations'],
  1,
  '2026-06-10'
),
(
  'Geography',
  12,
  1,
  'Maps and GIS',
  'Topographic and GIS questions',
  'Practice map reading, scale, relief, and GIS interpretation with the DBE guidance.',
  'Read the question carefully, identify the map symbol or GIS feature, and refer to the legend before answering. For calculation questions, show the formula, substitute the map values, and write the answer with the correct units.',
  'mind-the-gap',
  'Grade 12 Geography Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  1,
  10,
  array['maps', 'gis', 'scale', 'topographic'],
  1,
  '2026-06-10'
),
(
  'Accounting',
  12,
  3,
  'Financial statements',
  'Financial statements and ratios',
  'Use the correct format, totals, and adjustments before calculating ratios.',
  'Start with the source documents, move into the journals, and then present the financial statements in the prescribed format. When calculating ratios, state the formula, substitute the values, and comment on what the answer means for the business.',
  'mind-the-gap',
  'Grade 12 Accounting Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  1,
  12,
  array['financial statements', 'ratios', 'journals'],
  1,
  '2026-06-10'
),
(
  'Physical Sciences',
  12,
  2,
  'Electricity',
  'Circuits, current, and resistance',
  'Solve electricity questions by starting with Ohm''s law and identifying the circuit correctly.',
  'Read the circuit carefully, identify series or parallel connections, and choose the correct formula before calculating. Show units clearly and explain what the answer means in the context of the circuit.',
  'mind-the-gap',
  'Grade 12 Physical Sciences Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  17,
  26,
  array['electricity', 'circuits', 'ohms law', 'resistance'],
  1,
  '2026-06-10'
),
(
  'Life Sciences',
  12,
  2,
  'Genetics',
  'Inheritance and genetic crosses',
  'Follow the allele notation, draw the crosses, and explain how traits are inherited.',
  'Set out the parent genotypes first, then complete the Punnett square or genetic cross step by step. When explaining inheritance, use the correct terms for dominant, recessive, genotype, and phenotype.',
  'mind-the-gap',
  'Grade 12 Life Sciences Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  15,
  24,
  array['genetics', 'inheritance', 'punnett square', 'alleles'],
  1,
  '2026-06-10'
),
(
  'Life Sciences',
  12,
  1,
  'DNA and cell division',
  'DNA, meiosis, and chromosome behaviour',
  'Connect DNA structure to meiosis and explain how variation is created.',
  'Describe the role of DNA, chromosomes, and genes before explaining how meiosis produces variation. In exam questions, keep the sequence of events clear and use the correct biological terminology throughout.',
  'mind-the-gap',
  'Grade 12 Life Sciences Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  1,
  14,
  array['dna', 'meiosis', 'chromosomes', 'variation'],
  1,
  '2026-06-10'
),
(
  'Life Sciences',
  12,
  2,
  'Reproduction',
  'Human reproduction and hormonal control',
  'Explain reproductive organs, hormones, and fertilisation in CAPS language.',
  'Identify the organs first, then explain the pathway of gamete production, fertilisation, and development. When hormones are involved, mention the gland, the hormone, and the effect in the body.',
  'mind-the-gap',
  'Grade 12 Life Sciences Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  25,
  34,
  array['reproduction', 'hormones', 'fertilisation'],
  1,
  '2026-06-10'
),
(
  'Life Sciences',
  12,
  3,
  'Ecology',
  'Population ecology and ecosystems',
  'Work through food chains, nutrient cycles, population graphs, and ecosystem interactions.',
  'Start with the organism''s role in the ecosystem, then explain how energy and nutrients move through the system. For graph questions, state the trend, identify the reason, and support the answer with the correct ecological terms.',
  'mind-the-gap',
  'Grade 12 Life Sciences Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  35,
  46,
  array['ecology', 'ecosystems', 'food chains', 'graphs'],
  1,
  '2026-06-10'
),
(
  'Life Sciences',
  12,
  4,
  'Evolution',
  'Evolution by natural selection',
  'Use natural selection, adaptation, and evidence to explain evolutionary change.',
  'Explain the variation in a population, then show how environmental pressure leads to survival and reproduction of better-adapted organisms. In long questions, link the process to adaptation and support the answer with evidence from the source or scenario.',
  'mind-the-gap',
  'Grade 12 Life Sciences Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  47,
  56,
  array['evolution', 'natural selection', 'adaptation'],
  1,
  '2026-06-10'
),
(
  'Business Studies',
  12,
  1,
  'Business environments',
  'Business environments and problem solving',
  'Use CAPS language to classify environments and propose practical responses.',
  'Identify whether the issue is internal or external, then explain the effect on the business and suggest a realistic strategy. In exam questions, link the problem, the impact, and the solution clearly.',
  'mind-the-gap',
  'Grade 12 Business Studies Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  1,
  10,
  array['business environments', 'problem solving', 'strategy'],
  1,
  '2026-06-10'
),
(
  'Economics',
  12,
  3,
  'Macroeconomics',
  'Inflation and policy responses',
  'Explain inflation using the correct economic language and show the policy effect.',
  'Define inflation, identify the cause, and then explain how fiscal or monetary policy can influence prices. In evaluation questions, mention both positive and negative effects before concluding.',
  'mind-the-gap',
  'Grade 12 Economics Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  11,
  20,
  array['inflation', 'policy', 'macroeconomics'],
  1,
  '2026-06-10'
),
(
  'History',
  12,
  4,
  'Source-based questions',
  'Source analysis and essays',
  'Use the source, provenance, and context to build a stronger answer.',
  'Read the source, identify the message, then support your answer with evidence from the source and your own knowledge. For essays, build a clear argument with a short introduction, supporting paragraphs, and a conclusion.',
  'mind-the-gap',
  'Grade 12 History Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  1,
  18,
  array['source-based', 'essays', 'context'],
  1,
  '2026-06-10'
),
(
  'Mathematical Literacy',
  12,
  2,
  'Financial mathematics',
  'Financial calculations and interpretation',
  'Work through percentages, interest, and graphs carefully, then interpret the result.',
  'Choose the correct formula, show substitution clearly, and keep units and rounding accurate. For data and graph questions, state what the trend means before giving the final answer.',
  'mind-the-gap',
  'Grade 12 Mathematical Literacy Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  5,
  14,
  array['financial maths', 'graphs', 'interpretation'],
  1,
  '2026-06-10'
),
(
  'English First Additional Language',
  12,
  1,
  'Comprehension',
  'Comprehension and summary writing',
  'Read the passage carefully, answer the literal questions first, then infer meaning from context.',
  'Read the question, locate the evidence in the text, and answer in full sentences. For summary writing, keep to the key ideas and avoid copying long phrases unless the question allows it.',
  'mind-the-gap',
  'Grade 12 English First Additional Language Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  1,
  12,
  array['comprehension', 'summary', 'context'],
  1,
  '2026-06-10'
),
(
  'Business Studies',
  12,
  2,
  'Conflict and management',
  'Conflict management and business responses',
  'Explain the conflict, its cause, and the business response using CAPS terminology.',
  'State the cause of the conflict, describe how it affects the workplace, and then give a realistic management response. In exam answers, connect the problem to the response instead of listing points separately.',
  'mind-the-gap',
  'Grade 12 Business Studies Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  11,
  18,
  array['conflict', 'management', 'workplace'],
  1,
  '2026-06-10'
),
(
  'Economics',
  12,
  2,
  'Market structures',
  'Perfect competition and monopoly',
  'Compare market structures and explain how they affect price and competition.',
  'Identify the market structure first, then use the features to explain how firms set prices and compete. In evaluation questions, mention the strengths and weaknesses of the structure before giving a conclusion.',
  'mind-the-gap',
  'Grade 12 Economics Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  21,
  30,
  array['market structures', 'monopoly', 'competition'],
  1,
  '2026-06-10'
),
(
  'History',
  12,
  2,
  'Apartheid South Africa',
  'Apartheid source analysis',
  'Use source evidence and historical context to answer apartheid questions accurately.',
  'Read the source carefully, identify the message and bias where relevant, and support the response with your own knowledge. For essays, build a timeline of events and write one clear argument per paragraph.',
  'mind-the-gap',
  'Grade 12 History Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  19,
  30,
  array['apartheid', 'source analysis', 'context'],
  1,
  '2026-06-10'
),
(
  'Mathematics',
  12,
  3,
  'Calculus',
  'Differentiation and optimisation',
  'Differentiate carefully and show the algebra before setting the derivative to zero.',
  'Use the differentiation rule correctly, simplify the expression, and then solve for stationary points. If the question asks for maxima or minima, explain the reason based on the sign or second derivative test.',
  'mind-the-gap',
  'Grade 12 Mathematics Mind the Gap',
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  17,
  26,
  array['calculus', 'differentiation', 'optimisation'],
  1,
  '2026-06-10'
)
on conflict (source_url, section_title, version) do nothing;

with life_sciences_groups as (
  select * from (
    values
      (
        'DNA and genetics'::text,
        1,
        'Grade 12 Life Sciences Mind the Gap'::text,
        1,
        array[
          'DNA structure',
          'Base pairing',
          'DNA replication',
          'Chromosomes and genes',
          'Meiosis stages',
          'Variation',
          'Mutations',
          'Monohybrid crosses',
          'Dihybrid crosses',
          'Pedigrees and karyotypes'
        ]::text[],
        array['dna', 'genes', 'chromosomes', 'inheritance']::text[],
        'Use the CAPS language for heredity, chromosome behaviour, and variation.'::text
      ),
      (
        'Reproduction and development'::text,
        2,
        'Grade 12 Life Sciences Mind the Gap'::text,
        21,
        array[
          'Reproductive systems',
          'Gamete formation',
          'Menstrual cycle',
          'Fertilisation and implantation',
          'Pregnancy and development',
          'Contraception',
          'Hormones in reproduction',
          'Birth and labour',
          'Fertility and infertility',
          'Adolescent health'
        ]::text[],
        array['reproduction', 'hormones', 'fertilisation', 'development']::text[],
        'Use the CAPS language for organs, hormones, fertilisation, and development.'::text
      ),
      (
        'Human physiology'::text,
        2,
        'Grade 12 Life Sciences Mind the Gap'::text,
        41,
        array[
          'Digestion and nutrition',
          'Gas exchange and respiration',
          'Circulation and blood',
          'Immunity and disease',
          'Excretion and osmoregulation',
          'Nervous system',
          'Endocrine system',
          'Homeostasis',
          'Skeleton and muscles',
          'Vitamin and mineral balance'
        ]::text[],
        array['human body', 'physiology', 'homeostasis', 'systems']::text[],
        'Use the CAPS language for organ systems, control, and feedback.'::text
      ),
      (
        'Ecology and conservation'::text,
        3,
        'Grade 12 Life Sciences Mind the Gap'::text,
        61,
        array[
          'Ecosystems',
          'Food chains and webs',
          'Energy flow',
          'Nutrient cycles',
          'Population ecology',
          'Succession',
          'Biodiversity',
          'Conservation strategies',
          'Sampling techniques',
          'Human impact and pollution'
        ]::text[],
        array['ecology', 'ecosystems', 'conservation', 'population']::text[],
        'Use the CAPS language for ecosystems, population change, and conservation.'::text
      ),
      (
        'Evolution and classification'::text,
        4,
        'Grade 12 Life Sciences Mind the Gap'::text,
        81,
        array[
          'Natural selection',
          'Adaptation',
          'Speciation',
          'Fossil evidence',
          'Classification hierarchy',
          'Phylogenetic trees',
          'Human evolution',
          'Antibiotic resistance',
          'Evidence for evolution',
          'Biotechnology and ethics'
        ]::text[],
        array['evolution', 'classification', 'adaptation', 'selection']::text[],
        'Use the CAPS language for evolutionary change, classification, and evidence.'::text
      )
  ) as g(topic, term, source_title, page_start, focus_areas, keywords, intro)
)
insert into public.caps_content_sections (
  subject,
  grade,
  term,
  topic,
  section_title,
  section_summary,
  section_text,
  source_type,
  source_title,
  source_url,
  page_start,
  page_end,
  keywords,
  version,
  last_verified_at
)
select
  'Life Sciences',
  12,
  g.term,
  g.topic,
  focus_area || case when variant = 'explained' then ' explained' else ' exam method' end,
  case
    when variant = 'explained' then g.intro || ' Start with ' || lower(focus_area) || ', then build the answer in a clear CAPS sequence.'
    else 'Answer ' || lower(focus_area) || ' questions by showing the step-by-step CAPS method and using the correct command words.'
  end,
  case
    when variant = 'explained' then 'Start with ' || lower(focus_area) || ' and define the core idea in one sentence. Then explain how it fits into ' || lower(g.topic) || ' using the correct biological terms, and finish with one short example or comparison to show understanding.'
    else 'Read the command word, identify the biological process or structure in ' || lower(focus_area) || ', and answer in short ordered steps. If there is a diagram or graph, label or describe it first, then explain the function, sequence, or trend before you conclude.'
  end,
  'mind-the-gap',
  g.source_title,
  'https://www.education.gov.za/Curriculum/LearningandTeachingSupportMaterials%28LTSM%29/MindtheGapStudyGuides.aspx',
  g.page_start + ((focus_index - 1) * 2),
  g.page_start + ((focus_index - 1) * 2),
  array_cat(array_cat(g.keywords, regexp_split_to_array(lower(focus_area), '\s+')), array[variant]::text[]),
  1,
  '2026-06-10'
from life_sciences_groups g
cross join lateral unnest(g.focus_areas) with ordinality as f(focus_area, focus_index)
cross join lateral (values ('explained'::text), ('exam method'::text)) as v(variant)
on conflict (source_url, section_title, version) do nothing;

insert into public.aps_rules (
  institution_name,
  programme_name,
  rule_json,
  minimum_subject_requirements_json,
  source_url,
  last_verified_at
) values
(
  'Sample University',
  'BSc Engineering Foundation Track',
  '{"method":"nsc_levels","includeLifeOrientation":false,"minimumTotal":34,"sampleData":true}'::jsonb,
  '[{"subject":"Mathematics","minMark":60},{"subject":"Physical Sciences","minMark":60},{"subject":"English Home Language","minMark":50}]'::jsonb,
  'https://example.edu/admissions/sample-engineering',
  '2026-01-15'
),
(
  'Sample Metro University',
  'BCom Accounting',
  '{"method":"nsc_levels","includeLifeOrientation":false,"minimumTotal":30,"sampleData":true}'::jsonb,
  '[{"subject":"Mathematics","minMark":50},{"subject":"English Home Language","minMark":50},{"subject":"Accounting","minMark":60}]'::jsonb,
  'https://example.edu/admissions/sample-commerce',
  '2026-01-15'
)
on conflict (institution_name, programme_name) do nothing;

insert into public.bursaries (
  name,
  provider,
  field_of_study,
  funding_type,
  study_levels,
  eligibility_criteria_json,
  min_average,
  min_subject_requirements_json,
  province_requirements,
  citizenship_requirements,
  deadline,
  official_status,
  application_url,
  required_documents_json,
  source_url,
  last_verified_at,
  last_checked_at,
  application_window,
  summary,
  notes
) values
(
  'Sample STEM Future Bursary',
  'MatricSA Demo Foundation',
  'Engineering',
  'bursary',
  array['undergraduate'],
  '["South African citizen","Financial need"]'::jsonb,
  65,
  '[{"subject":"Mathematics","minMark":60},{"subject":"Physical Sciences","minMark":60}]'::jsonb,
  array['Gauteng','Limpopo','Mpumalanga'],
  'South African citizen or permanent resident',
  '2026-09-30',
  'open',
  'https://example.org/sample-stem-bursary',
  '["ID document","Latest school report","Proof of residence"]'::jsonb,
  'https://example.org/sample-stem-bursary',
  '2026-01-15',
  '2026-06-08',
  'Apply through the official portal before the closing date.',
  'General STEM funding for school leavers.',
  'Use the source page for the live cycle.'
),
(
  'Sample Commerce Access Award',
  'MatricSA Demo Trust',
  'Commerce',
  'scholarship',
  array['undergraduate'],
  '["South African citizen","Strong academic results"]'::jsonb,
  60,
  '[{"subject":"Accounting","minMark":60}]'::jsonb,
  array['All provinces'],
  'South African citizen',
  '2026-08-15',
  'open',
  'https://example.org/sample-commerce-award',
  '["ID document","Grade 11 final report","Motivation letter"]'::jsonb,
  'https://example.org/sample-commerce-award',
  '2026-01-15',
  '2026-06-08',
  'Check the provider site for the current intake.',
  'Commerce support award.',
  'Application timing changes every year.'
);

insert into public.past_papers (
  grade,
  subject_id,
  year,
  exam_session,
  paper_number,
  paper_url,
  memo_url,
  source_name,
  source_url
)
select
  12,
  s.id,
  2024,
  'November',
  case when s.name = 'Life Sciences' then 'Paper 2' else 'Paper 1' end,
  'https://www.education.gov.za/?link=599&mid=1741&tabid=593',
  'https://www.education.gov.za/?link=599&mid=1741&tabid=593',
  'Department of Basic Education NSC Past Examination Papers',
  'https://www.education.gov.za/?link=599&mid=1741&tabid=593'
from public.subjects s
where s.grade = 12 and s.name in ('Mathematics', 'Physical Sciences', 'Life Sciences');

insert into public.paper_questions (
  past_paper_id,
  question_number,
  topic_id,
  difficulty,
  marks,
  question_text_optional,
  page_number,
  memo_page_number
)
select p.id, 'Sample metadata only', t.id, 'medium', 12, null, 5, 4
from public.past_papers p
join public.subjects s on s.id = p.subject_id
join public.topics t on t.subject_id = s.id
where s.name = 'Mathematics' and t.name = 'Functions and graphs'
limit 1;
