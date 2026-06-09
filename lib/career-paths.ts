export type CareerPath = {
  id: string;
  title: string;
  summary: string;
  focusSubjects: string[];
  gradeTargets: { grade: 10 | 11 | 12; marks: string[] };
  programmeExamples: {
    institution: string;
    programme: string;
    aps: number;
    note: string;
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
      { institution: "University of Pretoria", programme: "BSc Biological Sciences", aps: 30, note: "A science pathway that still expects strong Maths and Physical Sciences." },
      { institution: "University of Johannesburg", programme: "Bachelor of Radiation Therapy", aps: 31, note: "A health-science route with strict subject thresholds and placement constraints." },
      { institution: "Cape Peninsula University of Technology", programme: "BSc Diagnostic Radiography", aps: 30, note: "CPUT considers APS 30 with Maths, Life Sciences, Physical Sciences, and English." },
      { institution: "University of Cape Town", programme: "BSc Engineering", aps: 36, note: "Shown here as a high-end benchmark for science-heavy study." }
    ]
  }
];
