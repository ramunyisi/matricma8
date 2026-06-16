export type UniversityDirectoryItem = {
  name: string;
  shortName: string;
  province: string;
  city: string;
  type: "Traditional university" | "University of technology" | "Comprehensive university";
  websiteUrl: string;
  applicationUrl: string;
  apsInfoUrl: string;
  apsCalculatorUrl?: string;
  applicationSystem?: string;
  prospectusUrl?: string;
  prospectusHighlights?: string[];
  prospectusNotes?: string[];
  contactEmail?: string;
  contactPhone?: string;
};

export const universities: UniversityDirectoryItem[] = [
  {
    name: "Cape Peninsula University of Technology",
    shortName: "CPUT",
    province: "Western Cape",
    city: "Cape Town",
    type: "University of technology",
    websiteUrl: "https://www.cput.ac.za",
    applicationUrl: "https://www.cput.ac.za/study/apply",
    apsInfoUrl: "https://www.cput.ac.za/study-at-cput/undergraduate/prospectus",
    prospectusUrl: "https://www.cput.ac.za/study-at-cput/undergraduate/prospectus",
    prospectusHighlights: [
      "2027 applications open on 11 May 2026.",
      "Most undergraduate certificate and diploma applications close on 30 September 2026 for South African applicants and 31 August 2026 for non-South African applicants.",
      "Exceptions include Dental Assisting and Emergency Medical Care, which close earlier.",
      "The prospectus and qualification pages advise learners to check subject and mark requirements before applying.",
      "Full acceptance depends on final Grade 12 results."
    ],
    prospectusNotes: [
      "CPUT offers a career-focused university of technology pathway with more than 70 programmes.",
      "Some health and design qualifications have programme-specific APS and subject requirements that are higher than the general application guidance."
    ]
  },
  {
    name: "Central University of Technology",
    shortName: "CUT",
    province: "Free State",
    city: "Bloemfontein",
    type: "University of technology",
    websiteUrl: "https://www.cut.ac.za",
    applicationUrl: "https://www.cut.ac.za/application-process",
    apsInfoUrl: "https://www.cut.ac.za/application-process"
  },
  {
    name: "Durban University of Technology",
    shortName: "DUT",
    province: "KwaZulu-Natal",
    city: "Durban",
    type: "University of technology",
    websiteUrl: "https://www.dut.ac.za",
    applicationUrl: "https://www.cao.ac.za",
    apsInfoUrl: "https://www.dut.ac.za/student_portal/student_registration/prospectus/",
    applicationSystem: "CAO"
  },
  {
    name: "Mangosuthu University of Technology",
    shortName: "MUT",
    province: "KwaZulu-Natal",
    city: "Umlazi",
    type: "University of technology",
    websiteUrl: "https://www.mut.ac.za",
    applicationUrl: "https://www.cao.ac.za",
    apsInfoUrl: "https://www.mut.ac.za/prospectus/",
    applicationSystem: "CAO"
  },
  {
    name: "Nelson Mandela University",
    shortName: "NMU",
    province: "Eastern Cape",
    city: "Gqeberha",
    type: "Comprehensive university",
    websiteUrl: "https://www.mandela.ac.za",
    applicationUrl: "https://www.mandela.ac.za/Study-at-Mandela/Application",
    apsInfoUrl: "https://www.mandela.ac.za/Study-at-Mandela/Admission/Undergraduate",
    prospectusUrl: "https://socialdev.mandela.ac.za/socialdev/media/Store/documents/Undergrad/Mandela_Uni-Undergrad-Guide.pdf",
    prospectusHighlights: [
      "NMU uses an Applicant Score (AS) for admission planning; Life Orientation is excluded and the score is calculated from six subjects.",
      "The AS calculation must include Home Language, First Additional Language, and Mathematics, Mathematical Literacy, or Technical Mathematics.",
      "Provisional admission is based on final Grade 11, Grade 12 June, or Grade 12 September results; the final decision uses final NSC/IEB results.",
      "Some programmes add selection steps such as a portfolio, interview, fitness test, medical test, or departmental selection.",
      "Most NMU programmes do not require NBTs, but learners must check programme-specific requirements where NBT results are listed.",
      "NMU offers extended curriculum programmes that allow learners who do not meet mainstream minimums to complete the same qualification over a longer period with added academic support.",
      "Applicants need their own cellphone number and valid personal email address for the two-part online application process.",
      "The undergraduate guide lists certified ID and latest school results among key supporting documents for application finalisation.",
      "The A-Z undergraduate quick guide lists NMU campuses including South, North, Second Avenue, Missionvale, Bird Street, Ocean Sciences, and George."
    ],
    prospectusNotes: [
      "Selected NMU programme benchmarks from the A-Z quick guide include Civil Engineering AS 370 with Mathematics or Technical Mathematics at 60% and Physical Science or Technical Science at 50%; BIT AS 370 with Mathematics or Technical Mathematics at 50%; BEd Foundation Phase AS 350/365/365 with language and maths-related requirements; BSW AS 350/365/365 with Mathematics 40% or Mathematical Literacy 65%; BSc Dietetics AS 390 with Mathematics and Physical Sciences at 60%.",
      "NMU states that meeting minimum requirements does not guarantee admission because programme capacity and selection rules still apply.",
      "Contact centre: 041 504 1111; application support emails include info@mandela.ac.za and onlineapplications@mandela.ac.za."
    ],
    contactEmail: "info@mandela.ac.za",
    contactPhone: "+27 (0)41 504 1111"
  },
  {
    name: "North-West University",
    shortName: "NWU",
    province: "North West",
    city: "Potchefstroom",
    type: "Traditional university",
    websiteUrl: "https://www.nwu.ac.za",
    applicationUrl: "https://studies.nwu.ac.za/studies/apply",
    apsInfoUrl: "https://studies.nwu.ac.za/undergraduate-studies/start-your-journey",
    apsCalculatorUrl: "https://studies.nwu.ac.za/studies/aps-calculator",
    prospectusUrl: "https://studies.nwu.ac.za/sites/studies.nwu.ac.za/files/files/undergrad/2027-Grade-12-prospectus.pdf",
    prospectusHighlights: [
      "Campuses: Potchefstroom, Mahikeng, and Vanderbijlpark.",
      "APS is calculated from the six best subjects, excluding Life Orientation.",
      "Bachelor's degree admission requires at least 50% in any four 20-credit subjects.",
      "Language of tuition subject requirement is 50% where applicable.",
      "Academic Merit Bursary thresholds: 85-100% pays 100% of tuition; 80-84.99% pays 75%; 75-79.99% pays 25%.",
      "Residence placement is a two-step process: indicate interest in your application, then apply after a conditional offer."
    ],
    prospectusNotes: [
      "NWU says minimum requirements do not guarantee admission; faculty-specific and selection rules still apply.",
      "NSFAS or another bursary may exempt students from the residence deposit if proof is provided.",
      "NWU also offers an Interest-Index tool and campus visit booking for learners unsure what to study."
    ],
    contactEmail: "studies@nwu.ac.za",
    contactPhone: "+27 (0) 60 070 2606"
  },
  {
    name: "Rhodes University",
    shortName: "RU",
    province: "Eastern Cape",
    city: "Makhanda",
    type: "Traditional university",
    websiteUrl: "https://www.ru.ac.za",
    applicationUrl: "https://www.ru.ac.za/admissiongateway/application/",
    apsInfoUrl: "https://www.ru.ac.za/admissiongateway/application/"
  },
  {
    name: "Sefako Makgatho Health Sciences University",
    shortName: "SMU",
    province: "Gauteng",
    city: "Ga-Rankuwa",
    type: "Traditional university",
    websiteUrl: "https://www.smu.ac.za",
    applicationUrl: "https://www.smu.ac.za/students/apply/",
    apsInfoUrl: "https://www.smu.ac.za/students/apply/"
  },
  {
    name: "Sol Plaatje University",
    shortName: "SPU",
    province: "Northern Cape",
    city: "Kimberley",
    type: "Traditional university",
    websiteUrl: "https://www.spu.ac.za",
    applicationUrl: "https://www.spu.ac.za/index.php/how-to-apply/",
    apsInfoUrl: "https://www.spu.ac.za/index.php/how-to-apply/"
  },
  {
    name: "Stellenbosch University",
    shortName: "SU",
    province: "Western Cape",
    city: "Stellenbosch",
    type: "Traditional university",
    websiteUrl: "https://www.sun.ac.za",
    applicationUrl: "https://www.sun.ac.za/english/maties/apply",
    apsInfoUrl: "https://www.sun.ac.za/english/maties/apply"
  },
  {
    name: "Tshwane University of Technology",
    shortName: "TUT",
    province: "Gauteng",
    city: "Pretoria",
    type: "University of technology",
    websiteUrl: "https://www.tut.ac.za",
    applicationUrl: "https://www.tut.ac.za/study-at-tut/i-want-to-study/apply",
    apsInfoUrl: "https://online.tut.ac.za/hubfs/TUT_APS.pdf",
    prospectusUrl: "https://www.tut.ac.za/media/tshwane-interim/site-content/documents/First-Year-Course_Information.pdf",
    prospectusHighlights: [
      "TUT first-year applications for 2027 open on 1 April 2026 and programmes may close earlier once capacity is reached.",
      "Life Orientation and achievement level 1 are not considered in the TUT APS calculation.",
      "General TUT admission guidance requires English Home Language or First Additional Language at minimum level 3, plus programme-specific Mathematics, Technical Mathematics, Mathematical Literacy, Physical Sciences, Technical Sciences, or other subjects.",
      "Bachelor's degree routes generally require at least four subjects at level 4, while diploma routes generally require at least four subjects at level 3.",
      "Applicants may use Grade 11 or Grade 12 mid-year results for provisional selection, but final admission depends on final Grade 12 results.",
      "The prospectus lists programme-specific APS, campus, subject, and closing-date rules across Engineering, ICT, Health Sciences, Management Sciences, Humanities, and other faculties."
    ],
    prospectusNotes: [
      "Selected TUT examples from the first-year course information guide include Diploma in Computer Science and Diploma in Information Technology at APS 26 with Mathematics or Technical Mathematics, or APS 28 with Mathematical Literacy; Public Affairs diploma routes around APS 20; Sport Management around APS 24; and Hospitality, Tourism, or Event Management routes around APS 24.",
      "Engineering and Health Sciences programmes can carry stricter subject thresholds and earlier closing dates, so learners should verify the exact programme table before applying."
    ]
  },
  {
    name: "University of Cape Town",
    shortName: "UCT",
    province: "Western Cape",
    city: "Cape Town",
    type: "Traditional university",
    websiteUrl: "https://www.uct.ac.za",
    applicationUrl: "https://uct.ac.za/students/applications",
    apsInfoUrl: "https://uct.ac.za/students/applications",
    apsCalculatorUrl: "https://publicaccess.uct.ac.za/psc/public/EMPLOYEE/SA/c/UCT_PUBLIC_MENU.UCT_SS_APS_CALC.GBL?FolderPath=PORTAL_ROOT_OBJECT.NUI_STRUCTURE_CONTENT.PORTAL_GROUPLETS.UCT_PUBLIC.UCT_SS_APS_CALC_GBL&IgnoreParamTempl=FolderPath%2CIsFolder&IsFolder=false&page=UCT_SS_APS_CALC",
    prospectusUrl: "https://www.uct.ac.za/students/prospective-students/undergraduate-prospectus",
    prospectusHighlights: [
      "UCT undergraduate applications for 2027 open in April and close on 31 July 2026.",
      "UCT APS is out of 600 and excludes Life Orientation, AP subjects, and non-official NSC subjects.",
      "Bachelor's degree entry requires at least 4 subjects at rating 4 (50-59%) or better in four 20-credit NSC subjects.",
      "Different faculties and programmes have different entrance requirements.",
      "Applicants normally resident or at school in South Africa must write the NBTs; Health Sciences applicants must write them wherever they live.",
      "UCT encourages applicants to make two choices to improve admission chances."
    ],
    prospectusNotes: [
      "The prospectus describes UCT as a guide for school leavers and other first-degree applicants.",
      "Applicants to undergraduate LLB from outside South Africa must write the AL part of the NBT.",
      "Contact the Undergraduate Admissions Office at admissions@uct.ac.za or +27 (0)21 650 2128."
    ],
    contactEmail: "admissions@uct.ac.za",
    contactPhone: "+27 (0)21 650 2128"
  },
  {
    name: "University of Fort Hare",
    shortName: "UFH",
    province: "Eastern Cape",
    city: "Alice",
    type: "Traditional university",
    websiteUrl: "https://www.ufh.ac.za",
    applicationUrl: "https://www.ufh.ac.za/apply/",
    apsInfoUrl: "https://www.ufh.ac.za/StudyUFH/Pages/AdmissionRequirements.aspx",
    apsCalculatorUrl: "https://www.ufh.ac.za/StudyUFH/Pages/AdmissionRequirements.aspx"
  },
  {
    name: "University of the Free State",
    shortName: "UFS",
    province: "Free State",
    city: "Bloemfontein",
    type: "Traditional university",
    websiteUrl: "https://www.ufs.ac.za",
    applicationUrl: "https://apply.ufs.ac.za/Application/Start",
    apsInfoUrl: "https://www.ufs.ac.za/prospective"
  },
  {
    name: "University of Johannesburg",
    shortName: "UJ",
    province: "Gauteng",
    city: "Johannesburg",
    type: "Comprehensive university",
    websiteUrl: "https://www.uj.ac.za",
    applicationUrl: "https://www.uj.ac.za/admission-aid/undergraduate/",
    apsInfoUrl: "https://www.uj.ac.za/admission-aid/undergraduate/",
    apsCalculatorUrl: "https://www.uj.ac.za/admission-aid/undergraduate/important-information-before-you-apply/",
    prospectusUrl: "https://www.uj.ac.za/wp-content/uploads/2026/04/uj_undergrad_prospectus2027.pdf",
    prospectusHighlights: [
      "UJ offers at least 178 undergraduate programmes across eight faculties and one college.",
      "Provisional admission is based on final Grade 11 results for current matric learners, with final admission based on final Grade 12 results.",
      "UJ ranks applicants from highest to lowest APS when making final selections.",
      "Subjects used to calculate APS must include the required programme subjects.",
      "The undergraduate pages include an APS calculator and faculty-specific entry rules."
    ],
    prospectusNotes: [
      "UJ warns applicants not to trust third parties promising admission in return for payment.",
      "Applicants currently upgrading Grade 12 results must declare that during the application process."
    ],
    contactEmail: "mylife@uj.ac.za",
    contactPhone: "+27 11 559 4555"
  },
  {
    name: "University of KwaZulu-Natal",
    shortName: "UKZN",
    province: "KwaZulu-Natal",
    city: "Durban",
    type: "Traditional university",
    websiteUrl: "https://ukzn.ac.za",
    applicationUrl: "https://www.cao.ac.za",
    apsInfoUrl: "https://applications.ukzn.ac.za/Undergraduate-Application-Information/Undergraduate-Prospectus",
    applicationSystem: "CAO"
  },
  {
    name: "University of Limpopo",
    shortName: "UL",
    province: "Limpopo",
    city: "Mankweng",
    type: "Traditional university",
    websiteUrl: "https://www.ul.ac.za",
    applicationUrl: "https://www.ul.ac.za",
    apsInfoUrl: "https://www.ul.ac.za"
  },
  {
    name: "University of Mpumalanga",
    shortName: "UMP",
    province: "Mpumalanga",
    city: "Mbombela",
    type: "Traditional university",
    websiteUrl: "https://www.ump.ac.za",
    applicationUrl: "https://www.ump.ac.za/Study-with-us/Application",
    apsInfoUrl: "https://www.ump.ac.za/Study-with-us/Programmes"
  },
  {
    name: "University of Pretoria",
    shortName: "UP",
    province: "Gauteng",
    city: "Pretoria",
    type: "Traditional university",
    websiteUrl: "https://www.up.ac.za",
    applicationUrl: "https://www.up.ac.za/online-application",
    apsInfoUrl: "https://www.up.ac.za/programmes",
    prospectusUrl: "https://drupalwebprod-files.up.ac.za/Public/2026-01/UP_UG%20Prospectus%202027_NSC-IEB_DevV5_web_0.pdf?VersionId=mFTqP2HthIDn48ISjWf4b4g6CtdE6beU",
    prospectusHighlights: [
      "Applications open on 1 April of the year before study starts.",
      "All UP undergraduate programmes are number-limited.",
      "Apply with your final Grade 11 results and final admission is based on final NSC/IEB results.",
      "Veterinary Science closes on 31 May; all other faculties close on 30 June.",
      "English is the official language of tuition unless a programme requires another language.",
      "FLY@UP Assist First-Year Awards are based on the six best subjects excluding Life Orientation."
    ],
    prospectusNotes: [
      "Meeting minimum requirements does not guarantee admission.",
      "First- and second-choice programmes should both meet minimum requirements and selection guidelines.",
      "Award A for FLY@UP Assist is based on a six-subject average; Award B adds subject rewards for strong maths and physical sciences results."
    ],
    contactEmail: "ssc@up.ac.za",
    contactPhone: "+27 (0)12 420 3111"
  },
  {
    name: "University of South Africa",
    shortName: "UNISA",
    province: "National",
    city: "Distance learning",
    type: "Comprehensive university",
    websiteUrl: "https://www.unisa.ac.za",
    applicationUrl: "https://www.unisa.ac.za/apply",
    apsInfoUrl: "https://www.unisa.ac.za/sites/corporate/default/Apply-for-admission/Undergraduate-qualifications/Admission-requirements"
  },
  {
    name: "University of the Western Cape",
    shortName: "UWC",
    province: "Western Cape",
    city: "Bellville",
    type: "Traditional university",
    websiteUrl: "https://www.uwc.ac.za",
    applicationUrl: "https://www.uwc.ac.za/admission-and-financial-aid/apply",
    apsInfoUrl: "https://www.uwc.ac.za/admission-and-financial-aid/apply",
    apsCalculatorUrl: "https://www.uwc.ac.za/admission-and-financial-aid/apply"
  },
  {
    name: "University of the Witwatersrand",
    shortName: "Wits",
    province: "Gauteng",
    city: "Johannesburg",
    type: "Traditional university",
    websiteUrl: "https://www.wits.ac.za",
    applicationUrl: "https://www.wits.ac.za/undergraduate/apply-to-wits/",
    apsInfoUrl: "https://www.wits.ac.za/undergraduate/entry-requirements/admission-requirements-nsc/",
    apsCalculatorUrl: "https://www.wits.ac.za/undergraduate/entry-requirements/admission-requirements-nsc/"
  },
  {
    name: "University of Zululand",
    shortName: "UNIZULU",
    province: "KwaZulu-Natal",
    city: "KwaDlangezwa",
    type: "Comprehensive university",
    websiteUrl: "https://www.unizulu.ac.za",
    applicationUrl: "https://www.unizulu.ac.za/apply/",
    apsInfoUrl: "https://www.unizulu.ac.za/apply/"
  },
  {
    name: "University of Venda",
    shortName: "UNIVEN",
    province: "Limpopo",
    city: "Thohoyandou",
    type: "Comprehensive university",
    websiteUrl: "https://www.univen.ac.za",
    applicationUrl: "https://www.univen.ac.za/students/how-to-apply/",
    apsInfoUrl: "https://www.univen.ac.za/students/student-support-services/how-to-apply/general-information/",
    prospectusUrl: "https://www.univen.ac.za/wp-content/uploads/2026/03/2027-Univen-Undergraduate-Prospectus.pdf",
    prospectusHighlights: [
      "UNIVEN says the undergraduate prospectus is a guide for school leavers and others seeking a first degree.",
      "The university minimum for bachelor-degree study is APS 26, excluding Life Orientation, with at least four recognized NSC 20-credit subjects at rating 4 or above.",
      "All programmes are offered full-time.",
      "The School of Management Sciences says bachelor-degree applicants should meet APS 32 with English at level 4, and extended programmes may consider APS 28-31.",
      "The Department of Business Information Systems lists BCom in Business Information Systems at APS 32 or above and gives priority to scores above 32."
    ],
    prospectusNotes: [
      "UNIVEN provides faculty contact people for the 2027 prospectus, including management, science, and health sciences enquiries.",
      "The university notes that meeting minimum requirements does not guarantee admission and may require a selection or entrance test."
    ],
    contactEmail: "undergraduateadmission1@univen.ac.za",
    contactPhone: "+27 15 962 8959"
  },
  {
    name: "Vaal University of Technology",
    shortName: "VUT",
    province: "Gauteng",
    city: "Vanderbijlpark",
    type: "University of technology",
    websiteUrl: "https://www.vut.ac.za",
    applicationUrl: "https://www.vut.ac.za/apply-to-vut/",
    apsInfoUrl: "https://www.vut.ac.za/apply-to-vut/"
  },
  {
    name: "Walter Sisulu University",
    shortName: "WSU",
    province: "Eastern Cape",
    city: "Mthatha",
    type: "Comprehensive university",
    websiteUrl: "https://www.wsu.ac.za",
    applicationUrl: "https://www.wsu.ac.za/index.php/study-with-us/application-info",
    apsInfoUrl: "https://www.wsu.ac.za/index.php/study-with-us/application-info"
  }
];

export function filterUniversities(query: string, province: string, type: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return universities.filter((university) => {
    if (province !== "All" && university.province !== province) return false;
    if (type !== "All" && university.type !== type) return false;
    if (terms.length === 0) return true;

    const haystack = [
      university.name,
      university.shortName,
      university.province,
      university.city,
      university.type,
      university.applicationSystem
    ].join(" ").toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
