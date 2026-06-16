export type CareerPath = {
  id: string;
  title: string;
  summary: string;
  focusSubjects: string[];
  interestKeywords?: string[];
  bursaryFields?: string[];
  sourceConfidence?: "verified" | "sample" | "needs_check";
  gradeTargets: { grade: 10 | 11 | 12; marks: string[] };
  programmeExamples: {
    institution: string;
    programme: string;
    aps: number;
    note: string;
    sourceStatus?: "verified" | "sample" | "needs_check";
  }[];
};

export const careerPaths: CareerPath[] = [
  {
    id: "engineering",
    title: "Engineering and Physical Sciences",
    summary: "Keep Mathematics and Physical Sciences strong from Grade 10 so you still have room to improve by Grade 12.",
    focusSubjects: ["Mathematics", "Physical Sciences", "English Home Language / First Additional Language"],
    gradeTargets: {
      grade: 10,
      marks: ["Aim for 60%+ in Mathematics and Physical Sciences.", "Build a stable English mark because most programmes still check language.", "Treat Life Orientation as support, not a substitute for core subjects."]
    },
    programmeExamples: [
      { institution: "Nelson Mandela University", programme: "Bachelor of Engineering Technology (Civil Engineering)", aps: 37, note: "NMU quick guide lists AS 370, with Mathematics or Technical Maths 60% and Physical Science or Technical Science 50%.", sourceStatus: "verified" },
      { institution: "Tshwane University of Technology", programme: "BEngTech Engineering Technology", aps: 28, note: "TUT first-year guide lists engineering technology routes with English, Mathematics or Technical Mathematics, and Physical Sciences or Technical Sciences; some disciplines require higher APS.", sourceStatus: "verified" },
      { institution: "University of Cape Town", programme: "BSc Engineering", aps: 36, note: "Competitive route with Mathematics and Physical Sciences thresholds." },
      { institution: "North-West University", programme: "BEng", aps: 34, note: "Prospectus-backed engineering route with strong Maths and Physical Sciences expectations." }
    ]
  },
  {
    id: "commerce",
    title: "Commerce and Accounting",
    summary: "Commerce pathways reward steady marks in Mathematics, English, and Accounting or Business Studies.",
    focusSubjects: ["Mathematics", "English Home Language / First Additional Language", "Accounting", "Business Studies"],
    gradeTargets: {
      grade: 10,
      marks: ["Aim for 55%+ in Mathematics and English.", "If you take Accounting, keep it above 60% to stay competitive.", "Start checking whether your preferred university uses Mathematics or Mathematical Literacy."]
    },
    programmeExamples: [
      { institution: "Nelson Mandela University", programme: "BCom (Accounting)", aps: 41, note: "NMU quick guide lists BCom Accounting routes with AS 410 and Mathematics requirements.", sourceStatus: "verified" },
      { institution: "North-West University", programme: "BCom in Accounting", aps: 24, note: "Lower APS entry route but still requires Mathematics." },
      { institution: "University of Johannesburg", programme: "BCom Accounting", aps: 28, note: "UJ’s prospectus snippet shows the programme at APS 28 with English and Mathematics." },
      { institution: "University of Venda", programme: "BCom in Business Information Systems", aps: 32, note: "Good option if you want accounting-adjacent business and systems work." },
      { institution: "University of Pretoria", programme: "BCom specialising in Business Management", aps: 30, note: "Business-focused route with Mathematics and English requirements." },
      { institution: "University of Pretoria", programme: "BCom specialising in Financial Management Sciences", aps: 32, note: "Stronger APS target for finance, auditing, and taxation pathways." }
    ]
  },
  {
    id: "law",
    title: "Law and Public Service",
    summary: "Law pathways are sensitive to language marks, and some options also need Mathematics.",
    focusSubjects: ["English Home Language / First Additional Language", "Mathematics", "History", "Business Studies"],
    gradeTargets: {
      grade: 10,
      marks: ["Keep English at 60%+ because law is language heavy.", "If you want BCom Law or LLB options, keep Mathematics above 50%.", "Use Grade 11 to decide whether you are aiming for a direct LLB or a route through BA/BCom Law."]
    },
    programmeExamples: [
      { institution: "Tshwane University of Technology", programme: "Diploma in Legal Support", aps: 20, note: "TUT first-year guide lists Legal Support as a practical law-adjacent diploma route with language requirements.", sourceStatus: "verified" },
      { institution: "North-West University", programme: "BA in Law", aps: 28, note: "Language-based law route with selection rules." },
      { institution: "North-West University", programme: "BCom in Law", aps: 30, note: "Needs Mathematics as part of the subject profile." },
      { institution: "University of Johannesburg", programme: "Bachelor of Arts", aps: 27, note: "A broad humanities route that can support later law studies." },
      { institution: "University of Pretoria", programme: "BA specialising in Law", aps: 34, note: "Alternative route to the LLB with a higher APS target." },
      { institution: "University of Pretoria", programme: "LLB", aps: 35, note: "Direct law route with a strong APS requirement." }
    ]
  },
  {
    id: "it-data",
    title: "IT, Information Systems, and Data",
    summary: "Tech pathways usually expect solid Mathematics, English, and often IT or Computer Applications Technology.",
    focusSubjects: ["Mathematics", "English Home Language / First Additional Language", "Information Technology", "Computer Applications Technology"],
    gradeTargets: {
      grade: 10,
      marks: ["Keep Mathematics above 60% if possible.", "Aim for 55%+ in English and your technology subject.", "Use Grade 11 to decide whether you are aiming for programming, systems, or business-technology degrees."]
    },
    programmeExamples: [
      { institution: "Nelson Mandela University", programme: "Bachelor of Information Technology", aps: 37, note: "NMU quick guide lists BIT at AS 370 with Mathematics or Technical Mathematics at 50%.", sourceStatus: "verified" },
      { institution: "Tshwane University of Technology", programme: "Diploma in Computer Science / Information Technology", aps: 26, note: "TUT first-year guide lists Computer Science and Information Technology diplomas at APS 26 with Mathematics or Technical Mathematics, and APS 28 with Mathematical Literacy.", sourceStatus: "verified" },
      { institution: "University of Pretoria", programme: "BCom specialising in Information Systems", aps: 30, note: "Business + systems route with Mathematics and English requirements." },
      { institution: "University of Venda", programme: "BCom in Business Information Systems", aps: 32, note: "UNIVEN’s BIS route links business studies with information systems and project management." },
      { institution: "University of Johannesburg", programme: "BSc Computer Science", aps: 30, note: "Good benchmark if you want a pure computing pathway." }
    ]
  },
  {
    id: "design",
    title: "Design, Media, and Visual Communication",
    summary: "Design pathways are often APS plus portfolio and subject-specific checks, so learners need to keep options open until Grade 12.",
    focusSubjects: ["English Home Language / First Additional Language", "Visual Arts", "Design", "Mathematics"],
    gradeTargets: {
      grade: 10,
      marks: ["Aim for solid English and creative subject marks because many design programmes also look at portfolio work.", "Keep Mathematics above 50% if you want technical design or engineering-linked design options.", "Use Grade 11 to decide whether you are targeting product design, fashion, or visual communication."]
    },
    programmeExamples: [
      { institution: "Cape Peninsula University of Technology", programme: "Product and Industrial Design", aps: 28, note: "CPUT’s design faculty lists this as APS 28." },
      { institution: "Cape Peninsula University of Technology", programme: "Visual Communication Design", aps: 28, note: "CPUT’s design pages list a minimum APS of 28 for this route." }
    ]
  },
  {
    id: "science",
    title: "Science and Health Preparation",
    summary: "Science and health routes need consistency across Mathematics, Physical Sciences, and Life Sciences.",
    focusSubjects: ["Mathematics", "Physical Sciences", "Life Sciences", "English Home Language / First Additional Language"],
    gradeTargets: {
      grade: 10,
      marks: ["Try to keep Mathematics and Physical Sciences above 60%.", "Life Sciences matters early if you want health or biology routes.", "By Grade 11 you should know whether you are aiming for science, health, or engineering."]
    },
    programmeExamples: [
      { institution: "Nelson Mandela University", programme: "BSc (Dietetics)", aps: 39, note: "NMU quick guide lists BSc Dietetics at AS 390 with Mathematics and Physical Sciences at 60%.", sourceStatus: "verified" },
      { institution: "Tshwane University of Technology", programme: "Bachelor of Radiography in Diagnostics", aps: 30, note: "TUT Health Sciences routes require programme-specific subject checks and early closing-date verification.", sourceStatus: "needs_check" },
      { institution: "University of Pretoria", programme: "BSc Biological Sciences", aps: 30, note: "A science pathway that still expects strong Maths and Physical Sciences." },
      { institution: "University of Johannesburg", programme: "Bachelor of Radiation Therapy", aps: 31, note: "A health-science route with strict subject thresholds and placement constraints." },
      { institution: "Cape Peninsula University of Technology", programme: "BSc Diagnostic Radiography", aps: 30, note: "CPUT considers APS 30 with Maths, Life Sciences, Physical Sciences, and English." },
      { institution: "University of Cape Town", programme: "BSc Engineering", aps: 36, note: "Shown here as a high-end benchmark for science-heavy study." }
    ]
  },
  {
    id: "medicine-health",
    title: "Medicine, Nursing, and Health Sciences",
    summary: "Health routes are competitive and usually require strong Mathematics, Life Sciences, Physical Sciences, and English.",
    focusSubjects: ["Mathematics", "Life Sciences", "Physical Sciences", "English Home Language / First Additional Language"],
    interestKeywords: ["medicine", "nursing", "health", "doctor", "pharmacy", "radiography", "physiotherapy"],
    bursaryFields: ["Medicine", "Health Sciences", "Nursing", "Science"],
    sourceConfidence: "sample",
    gradeTargets: {
      grade: 10,
      marks: ["Aim for 70%+ in Mathematics and Life Sciences if possible.", "Keep Physical Sciences above 65% to preserve health-science options.", "Use Grade 11 to confirm NBT, selection, and placement requirements."]
    },
    programmeExamples: [
      { institution: "Nelson Mandela University", programme: "BSc (Dietetics)", aps: 39, note: "NMU quick guide lists AS 390 with Mathematics and Physical Sciences at 60%.", sourceStatus: "verified" },
      { institution: "Tshwane University of Technology", programme: "Bachelor of Radiography in Diagnostics", aps: 30, note: "TUT lists Radiography under Health Sciences; verify the exact current APS, subject table, and closing date before applying.", sourceStatus: "needs_check" },
      { institution: "University of Johannesburg", programme: "Bachelor of Radiation Therapy", aps: 31, note: "A health-science route with strict selection and placement limits.", sourceStatus: "sample" },
      { institution: "Cape Peninsula University of Technology", programme: "BSc Diagnostic Radiography", aps: 30, note: "Requires Maths, Life Sciences, Physical Sciences, and English checks.", sourceStatus: "sample" },
      { institution: "University of Pretoria", programme: "BSc Biological Sciences", aps: 30, note: "A broader biological sciences route that can support later health interests.", sourceStatus: "sample" }
    ]
  },
  {
    id: "education",
    title: "Education and Teaching",
    summary: "Teaching routes need steady language marks, subject confidence, and a clear choice of phase or teaching specialisation.",
    focusSubjects: ["English Home Language / First Additional Language", "Mathematics", "Life Sciences", "History"],
    interestKeywords: ["education", "teaching", "teacher", "children", "school"],
    bursaryFields: ["Education / Teaching", "initial teacher education"],
    sourceConfidence: "sample",
    gradeTargets: {
      grade: 10,
      marks: ["Keep English above 60% because teaching is communication-heavy.", "Protect the subject you may want to teach later.", "Check Funza Lushaka and university phase requirements early."]
    },
    programmeExamples: [
      { institution: "Nelson Mandela University", programme: "Bachelor of Education: Foundation Phase", aps: 35, note: "NMU quick guide lists Foundation Phase at AS 350/365/365 with English, Afrikaans or isiXhosa, and maths-related requirements.", sourceStatus: "verified" },
      { institution: "Nelson Mandela University", programme: "Bachelor of Education: Intermediate Phase", aps: 37, note: "NMU quick guide lists Intermediate Phase at AS 370/385/385 with language and maths-related requirements.", sourceStatus: "verified" },
      { institution: "University of Pretoria", programme: "BEd Foundation Phase Teaching", aps: 28, note: "Teaching options vary by phase and language requirements.", sourceStatus: "needs_check" },
      { institution: "North-West University", programme: "BEd Senior and FET Teaching", aps: 24, note: "Subject combinations matter for senior/FET teaching.", sourceStatus: "needs_check" }
    ]
  },
  {
    id: "agriculture-environment",
    title: "Agriculture, Environment, and Food Systems",
    summary: "Agriculture and environmental routes combine Life Sciences, Geography, Mathematics, and science problem-solving.",
    focusSubjects: ["Life Sciences", "Geography", "Mathematics", "Physical Sciences"],
    interestKeywords: ["agriculture", "environment", "climate", "plants", "animals", "food", "farming"],
    bursaryFields: ["Agriculture", "Environmental Science", "Science"],
    sourceConfidence: "sample",
    gradeTargets: {
      grade: 10,
      marks: ["Keep Life Sciences and Geography above 60% if they are available.", "Maintain Mathematics for broader university and bursary options.", "Use practical projects or volunteering to test the route."]
    },
    programmeExamples: [
      { institution: "Nelson Mandela University", programme: "BSc (Environmental Sciences)", aps: 41, note: "NMU quick guide lists Environmental Sciences routes at AS 410, with extended curriculum options at AS 370.", sourceStatus: "verified" },
      { institution: "University of Pretoria", programme: "BScAgric", aps: 30, note: "Agriculture options often combine science and applied field work.", sourceStatus: "needs_check" },
      { institution: "University of Venda", programme: "Environmental Sciences route", aps: 30, note: "Environmental routes usually check Maths and science readiness.", sourceStatus: "needs_check" }
    ]
  },
  {
    id: "social-sciences",
    title: "Social Sciences, Psychology, and Humanities",
    summary: "Humanities routes reward language, reading, research, and steady marks across essay-based subjects.",
    focusSubjects: ["English Home Language / First Additional Language", "History", "Geography", "Life Sciences"],
    interestKeywords: ["psychology", "social work", "community", "humanities", "history", "research"],
    bursaryFields: ["Humanities", "Social Sciences", "Multiple fields"],
    sourceConfidence: "sample",
    gradeTargets: {
      grade: 10,
      marks: ["Keep English above 60% and build strong essay structure.", "Use Grade 11 to decide whether you want psychology, social work, politics, or broader humanities.", "Check whether Maths is needed for your preferred institution."]
    },
    programmeExamples: [
      { institution: "Nelson Mandela University", programme: "Bachelor of Social Work", aps: 35, note: "NMU undergraduate guide lists BSW at AS 350/365/365 with Mathematics 40% or Mathematical Literacy 65%, plus departmental selection.", sourceStatus: "verified" },
      { institution: "Nelson Mandela University", programme: "BA (Development Studies)", aps: 35, note: "NMU quick guide lists Development Studies at AS 350/365/350 with Mathematics 40% or Mathematical Literacy 70%.", sourceStatus: "verified" },
      { institution: "University of Johannesburg", programme: "Bachelor of Arts", aps: 27, note: "Broad humanities route that can support later specialisation.", sourceStatus: "sample" },
      { institution: "University of Pretoria", programme: "BA specialising in Psychology", aps: 30, note: "Psychology routes may be competitive and progression-limited.", sourceStatus: "needs_check" }
    ]
  },
  {
    id: "tvet-artisan",
    title: "TVET, Artisan, and Technical Trades",
    summary: "Technical routes can lead to trades, apprenticeships, and diplomas, especially when learners enjoy practical work.",
    focusSubjects: ["Mathematics", "Physical Sciences", "Engineering Graphics and Design", "Electrical Technology"],
    interestKeywords: ["artisan", "trade", "plumbing", "electrical", "mechanic", "technical", "tvet"],
    bursaryFields: ["TVET", "Engineering", "Technical"],
    sourceConfidence: "sample",
    gradeTargets: {
      grade: 10,
      marks: ["Keep Mathematics or Mathematical Literacy stable depending on the route.", "Protect technical subjects where your school offers them.", "Compare TVET certificates, diplomas, apprenticeships, and university of technology routes."]
    },
    programmeExamples: [
      { institution: "Nelson Mandela University", programme: "Dip: IT (Software Development)", aps: 33, note: "NMU quick guide lists Software Development diploma routes at AS 330 with Mathematics 40% or Mathematical Literacy 60% depending on route.", sourceStatus: "verified" },
      { institution: "Tshwane University of Technology", programme: "Diploma in Civil Engineering", aps: 26, note: "TUT first-year guide lists engineering diploma routes with English, Mathematics or Technical Mathematics, and Physical Sciences or Technical Sciences.", sourceStatus: "verified" },
      { institution: "Public TVET colleges", programme: "Engineering Studies / Artisan route", aps: 20, note: "Entry rules vary by college, programme level, and trade.", sourceStatus: "needs_check" },
      { institution: "Universities of Technology", programme: "Engineering diploma routes", aps: 24, note: "Diploma routes can still require Maths and Physical Sciences.", sourceStatus: "needs_check" }
    ]
  },
  {
    id: "hospitality-tourism",
    title: "Hospitality, Tourism, and Events",
    summary: "Hospitality routes value communication, service, business awareness, and practical experience.",
    focusSubjects: ["English Home Language / First Additional Language", "Tourism", "Hospitality Studies", "Business Studies"],
    interestKeywords: ["tourism", "hospitality", "events", "hotel", "travel", "food"],
    bursaryFields: ["Hospitality", "Tourism", "Business"],
    sourceConfidence: "sample",
    gradeTargets: {
      grade: 10,
      marks: ["Keep English and Business Studies steady.", "Use practical exposure to test whether service work suits you.", "Check whether the route is certificate, diploma, or degree based."]
    },
    programmeExamples: [
      { institution: "Nelson Mandela University", programme: "Diploma in Tourism Management-related Business Studies", aps: 33, note: "NMU George Campus includes tourism and business studies advanced diploma routes; learners must verify the exact diploma and campus.", sourceStatus: "needs_check" },
      { institution: "Tshwane University of Technology", programme: "Diploma in Hospitality Management / Tourism Management", aps: 24, note: "TUT first-year guide lists hospitality, tourism, and event management routes around APS 24 with English and maths-related checks.", sourceStatus: "verified" },
      { institution: "Universities of Technology", programme: "Hospitality Management diploma", aps: 24, note: "Diploma entry and practical placement rules vary by institution.", sourceStatus: "needs_check" },
      { institution: "Public TVET colleges", programme: "Tourism / Hospitality programmes", aps: 18, note: "TVET options can be practical and work-integrated.", sourceStatus: "needs_check" }
    ]
  },
  {
    id: "sport-science",
    title: "Sport Science and Human Movement",
    summary: "Sport science combines Life Sciences, physical performance, health knowledge, and communication.",
    focusSubjects: ["Life Sciences", "Physical Sciences", "Mathematics", "English Home Language / First Additional Language"],
    interestKeywords: ["sport", "fitness", "physiology", "coaching", "movement"],
    bursaryFields: ["Sport Science", "Health Sciences", "Science"],
    sourceConfidence: "sample",
    gradeTargets: {
      grade: 10,
      marks: ["Keep Life Sciences above 60% if possible.", "Maintain Maths or Physical Sciences for health-linked options.", "Build evidence through sport participation, coaching, or wellness projects."]
    },
    programmeExamples: [
      { institution: "Nelson Mandela University", programme: "BHMS (Human Movement Science)", aps: 35, note: "NMU undergraduate guide lists Human Movement Science among Health Sciences qualifications; verify current AS and subject rules before applying.", sourceStatus: "needs_check" },
      { institution: "Tshwane University of Technology", programme: "Diploma in Sport Management", aps: 24, note: "TUT first-year guide lists Sport Management with English and maths-related admission checks.", sourceStatus: "verified" },
      { institution: "University of Pretoria", programme: "Sport science-related route", aps: 30, note: "Health and sport pathways often have selection or placement constraints.", sourceStatus: "needs_check" },
      { institution: "North-West University", programme: "Human Movement Science route", aps: 24, note: "Programme naming and admission rules vary by campus.", sourceStatus: "needs_check" }
    ]
  },
  {
    id: "public-admin",
    title: "Public Administration and Development",
    summary: "Public administration routes suit learners interested in government, policy, community services, and operations.",
    focusSubjects: ["English Home Language / First Additional Language", "Business Studies", "History", "Geography"],
    interestKeywords: ["government", "public service", "policy", "administration", "community", "development"],
    bursaryFields: ["Public Administration", "Commerce", "Humanities"],
    sourceConfidence: "sample",
    gradeTargets: {
      grade: 10,
      marks: ["Keep English above 60% and build report-writing confidence.", "Business Studies and History can help with institutions, policy, and administration.", "Use university and TVET comparisons to choose between degree, diploma, or certificate routes."]
    },
    programmeExamples: [
      { institution: "Nelson Mandela University", programme: "BAdmin (Public Administration)", aps: 35, note: "NMU quick guide lists BAdmin Public Administration under Industrial Psychology/Public Administration routes with AS 350.", sourceStatus: "verified" },
      { institution: "Tshwane University of Technology", programme: "Diploma in Public Affairs", aps: 20, note: "TUT first-year guide lists Public Affairs diploma routes including Administration of State and Local Government around APS 20.", sourceStatus: "verified" },
      { institution: "University of Pretoria", programme: "Public Management-related route", aps: 30, note: "Public management options are institution-specific and must be verified.", sourceStatus: "needs_check" },
      { institution: "Universities of Technology", programme: "Public Management diploma", aps: 22, note: "Diploma routes vary by institution and campus.", sourceStatus: "needs_check" }
    ]
  }
];
