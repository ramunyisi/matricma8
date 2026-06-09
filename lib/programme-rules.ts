import type { ApsRule } from "@/lib/types";

export const programmeRules: ApsRule[] = [
  rule("uct-bsc-eng", "University of Cape Town", "BSc Engineering", 36, [
    ["Mathematics", 70],
    ["Physical Sciences", 60],
    ["English Home Language", 50]
  ], "https://uct.ac.za/students/applications", {
    prospectusUrl: "https://uct.ac.za/sites/default/files/media/documents/2027-uct-undergraduate-prospectus-1-april-2026.pdf",
    prospectusNotes: [
      "UCT APS is out of 600 and excludes Life Orientation, AP subjects, and non-official NSC subjects.",
      "Bachelor's degree entry needs at least 4 subjects at rating 4 (50-59%) or better in four 20-credit NSC subjects.",
      "Applicants in South Africa normally write the NBTs; Health Sciences applicants write them wherever they live."
    ]
  }),
  rule("uct-bcom", "University of Cape Town", "Bachelor of Commerce", 32, [
    ["Mathematics", 60],
    ["English Home Language", 50]
  ], "https://uct.ac.za/students/applications", {
    prospectusUrl: "https://uct.ac.za/sites/default/files/media/documents/2027-uct-undergraduate-prospectus-1-april-2026.pdf",
    prospectusNotes: [
      "UCT encourages applicants to make two choices to improve admission chances.",
      "Different faculties and programmes have different entrance requirements.",
      "UCT APS is out of 600 and excludes Life Orientation, AP subjects, and non-official NSC subjects."
    ]
  }),
  rule("wits-engineering", "University of the Witwatersrand", "BSc Engineering", 36, [
    ["Mathematics", 70],
    ["Physical Sciences", 70],
    ["English Home Language", 50]
  ], "https://www.wits.ac.za/undergraduate/entry-requirements/admission-requirements-nsc/"),
  rule("wits-bcom", "University of the Witwatersrand", "Bachelor of Commerce", 34, [
    ["Mathematics", 60],
    ["English Home Language", 50]
  ], "https://www.wits.ac.za/undergraduate/entry-requirements/admission-requirements-nsc/"),
  rule("up-bsc", "University of Pretoria", "BSc Biological Sciences", 30, [
    ["Mathematics", 50],
    ["Physical Sciences", 50],
    ["English Home Language", 50]
  ], "https://www.up.ac.za/programmes", {
    prospectusUrl: "https://drupalwebprod-files.up.ac.za/Public/2026-01/UP_UG%20Prospectus%202027_NSC-IEB_DevV5_web_0.pdf?VersionId=mFTqP2HthIDn48ISjWf4b4g6CtdE6beU",
    prospectusNotes: [
      "Applications open on 1 April of the year before study starts.",
      "All UP undergraduate programmes are number-limited.",
      "Apply with final Grade 11 results and final admission is based on final NSC/IEB results.",
      "Veterinary Science closes on 31 May; all other faculties close on 30 June.",
      "FLY@UP Assist awards are based on the six best subjects excluding Life Orientation."
    ]
  }),
  rule("up-bcom", "University of Pretoria", "BCom", 30, [
    ["Mathematics", 50],
    ["English Home Language", 50]
  ], "https://www.up.ac.za/programmes", {
    prospectusUrl: "https://drupalwebprod-files.up.ac.za/Public/2026-01/UP_UG%20Prospectus%202027_NSC-IEB_DevV5_web_0.pdf?VersionId=mFTqP2HthIDn48ISjWf4b4g6CtdE6beU",
    prospectusNotes: [
      "UP programmes are number-limited and minimum requirements do not guarantee admission.",
      "First- and second-choice programmes should both meet minimum requirements and selection guidelines.",
      "FLY@UP Assist includes an award based on your six best subjects excluding Life Orientation."
    ]
  }),
  rule("up-bcom-law", "University of Pretoria", "BCom specialising in Law", 32, [
    ["English Home Language / English First Additional Language", 50],
    ["Mathematics", 50]
  ], "https://www.up.ac.za/programmes/undergraduate/bcom-specialising-law/2026", {
    prospectusUrl: "https://drupalwebprod-files.up.ac.za/Public/2026-01/UP_UG%20Prospectus%202027_NSC-IEB_DevV5_web_0.pdf?VersionId=mFTqP2HthIDn48ISjWf4b4g6CtdE6beU",
    prospectusNotes: [
      "This programme is number-limited and the minimum requirements do not guarantee admission.",
      "Apply with final Grade 11 results if you are still in Grade 12.",
      "Final admission is based on your final NSC/IEB results and the faculty selection process."
    ]
  }),
  rule("up-bcom-is", "University of Pretoria", "BCom specialising in Information Systems", 30, [
    ["English Home Language / English First Additional Language", 50],
    ["Mathematics", 50]
  ], "https://www.up.ac.za/programmes/programme/07130173/year/2026/print/pdf", {
    prospectusUrl: "https://drupalwebprod-files.up.ac.za/Public/2026-01/UP_UG%20Prospectus%202027_NSC-IEB_DevV5_web_0.pdf?VersionId=mFTqP2HthIDn48ISjWf4b4g6CtdE6beU",
    prospectusNotes: [
      "UP requires English Home Language or English First Additional Language and Mathematics for this programme.",
      "The programme combines information systems with economic and management sciences.",
      "Minimum requirements do not guarantee admission."
    ]
  }),
  rule("up-bcom-bm", "University of Pretoria", "BCom specialising in Business Management", 30, [
    ["English Home Language / English First Additional Language", 50],
    ["Mathematics", 40]
  ], "https://www.up.ac.za/programmes/programme/07130068/year/2026/print/pdf", {
    prospectusUrl: "https://drupalwebprod-files.up.ac.za/Public/2026-01/UP_UG%20Prospectus%202027_NSC-IEB_DevV5_web_0.pdf?VersionId=mFTqP2HthIDn48ISjWf4b4g6CtdE6beU",
    prospectusNotes: [
      "UP states this programme is intended for students who want to become business leaders, managers, or entrepreneurs.",
      "Minimum requirements do not guarantee admission.",
      "The programme is presented in English."
    ]
  }),
  rule("up-bcom-fms", "University of Pretoria", "BCom specialising in Financial Management Sciences", 32, [
    ["English Home Language / English First Additional Language", 50],
    ["Mathematics", 50]
  ], "https://www.up.ac.za/programmes/undergraduate/bcom-specialising-financial-management-sciences/2025", {
    prospectusUrl: "https://drupalwebprod-files.up.ac.za/Public/2026-01/UP_UG%20Prospectus%202027_NSC-IEB_DevV5_web_0.pdf?VersionId=mFTqP2HthIDn48ISjWf4b4g6CtdE6beU",
    prospectusNotes: [
      "UP says this degree combines financial management, internal auditing, and taxation.",
      "Minimum requirements do not guarantee admission.",
      "The programme is accredited by ACCA, CIMA, and the Institute of Internal Auditors."
    ]
  }),
  rule("up-ba-law", "University of Pretoria", "BA specialising in Law", 34, [
    ["English Home Language / English First Additional Language", 50]
  ], "https://www.up.ac.za/programmes/undergraduate/ba-specialising-law/2025", {
    prospectusUrl: "https://drupalwebprod-files.up.ac.za/Public/2026-01/UP_UG%20Prospectus%202027_NSC-IEB_DevV5_web_0.pdf?VersionId=mFTqP2HthIDn48ISjWf4b4g6CtdE6beU",
    prospectusNotes: [
      "This is an alternative route toward the LLB degree.",
      "The programme is full-time and some modules are offered after hours.",
      "Minimum requirements do not guarantee admission."
    ]
  }),
  rule("up-llb", "University of Pretoria", "LLB", 35, [
    ["English Home Language / English First Additional Language", 60]
  ], "https://www.up.ac.za/programmes/undergraduate/bachelor-of-laws-llb/2025", {
    prospectusUrl: "https://drupalwebprod-files.up.ac.za/Public/2026-01/UP_UG%20Prospectus%202027_NSC-IEB_DevV5_web_0.pdf?VersionId=mFTqP2HthIDn48ISjWf4b4g6CtdE6beU",
    prospectusNotes: [
      "UP offers the LLB as a direct route to a recognised legal qualification.",
      "BCom specialising in Law and BA specialising in Law are listed as alternative routes into the LLB pathway.",
      "Minimum requirements do not guarantee admission."
    ]
  }),
  rule("uj-bcom-accounting", "University of Johannesburg", "BCom Accounting", 28, [
    ["English Home Language / English First Additional Language", 50],
    ["Mathematics", 50]
  ], "https://www.uj.ac.za/wp-content/uploads/2026/04/uj_undergrad_prospectus2027.pdf", {
    prospectusUrl: "https://www.uj.ac.za/wp-content/uploads/2026/04/uj_undergrad_prospectus2027.pdf",
    prospectusNotes: [
      "UJ lists Accounting at APS 28 with English 4 and Mathematics 4 in the prospectus snippet.",
      "The university uses the required programme subjects when calculating APS eligibility.",
      "Admission is still subject to space in the enrolment management plan."
    ]
  }),
  rule("uj-ba", "University of Johannesburg", "Bachelor of Arts", 27, [
    ["English Home Language / English First Additional Language", 60]
  ], "https://www.uj.ac.za/university-courses/bachelor-of-arts/", {
    prospectusUrl: "https://www.uj.ac.za/wp-content/uploads/2026/04/uj_undergrad_prospectus2027.pdf",
    prospectusNotes: [
      "UJ lists a minimum APS of 27 for the Bachelor of Arts route.",
      "The course page snippet shows English at 60%+.",
      "Use the faculty page for the exact major requirements."
    ]
  }),
  rule("uj-bsc-life-env", "University of Johannesburg", "BSc Life and Environmental Sciences", 30, [
    ["English Home Language / English First Additional Language", 50],
    ["Mathematics", 60],
    ["Physical Sciences", 50],
    ["Life Sciences", 50]
  ], "https://www.uj.ac.za/university-courses/bsc-in-life-and-environmental-sciences-zoology-and-physiology/", {
    prospectusUrl: "https://www.uj.ac.za/wp-content/uploads/2026/04/uj_undergrad_prospectus2027.pdf",
    prospectusNotes: [
      "UJ shows this science route at minimum APS 30.",
      "The page snippet lists English 5, Mathematics 5 or 6, Physical Sciences 4, and Life Sciences 4.",
      "Check the exact major because the faculty can vary the route."
    ]
  }),
  rule("uj-radiation-therapy", "University of Johannesburg", "Bachelor of Radiation Therapy", 31, [
    ["English Home Language / English First Additional Language", 50],
    ["Mathematics", 50],
    ["Physical Sciences", 50],
    ["Life Sciences", 60]
  ], "https://www.uj.ac.za/university-courses/bachelor-of-radiation-therapy/", {
    prospectusUrl: "https://www.uj.ac.za/wp-content/uploads/2026/04/uj_undergrad_prospectus2027.pdf",
    prospectusNotes: [
      "UJ shows this programme at minimum APS 31.",
      "The course page snippet lists English 5, Mathematics 4, Physical Sciences 4, and Life Sciences 5.",
      "Selection also depends on clinical placement availability."
    ]
  }),
  rule("uj-computer-science", "University of Johannesburg", "BSc Computer Science", 30, [
    ["Mathematics", 60],
    ["English Home Language", 50]
  ], "https://www.uj.ac.za/admission-aid/undergraduate/"),
  rule("nwu-engineering", "North-West University", "BEng", 34, [
    ["Mathematics", 70],
    ["Physical Sciences", 60],
    ["English Home Language", 50]
  ], "https://studies.nwu.ac.za/undergraduate-studies/start-your-journey", {
    prospectusUrl: "https://studies.nwu.ac.za/sites/studies.nwu.ac.za/files/files/undergrad/2027-Grade-12-prospectus.pdf",
    prospectusNotes: [
      "APS is calculated from the six best subjects, excluding Life Orientation.",
      "Bachelor's degree admission requires at least 50% in any four 20-credit subjects.",
      "Subject-specific faculty requirements still apply and may be more competitive.",
      "NWU also offers an Interest-Index tool and campus visit booking."
    ]
  }),
  rule("nwu-bcom-law", "North-West University", "BCom in Law", 30, [
    ["Home Language", 60],
    ["First Additional Language", 60],
    ["Mathematics", 50]
  ], "https://studies.nwu.ac.za/undergraduate-studies/law-2027", {
    prospectusUrl: "https://studies.nwu.ac.za/sites/studies.nwu.ac.za/files/files/undergrad/2027-Grade-12-prospectus.pdf",
    prospectusNotes: [
      "NWU says the APS for BCom in Law is 30.",
      "The programme is selection-based and capacity is limited.",
      "Mathematics level 4 is required."
    ]
  }),
  rule("nwu-ba-law", "North-West University", "BA in Law", 28, [
    ["Home Language", 60],
    ["First Additional Language", 60]
  ], "https://studies.nwu.ac.za/undergraduate-studies/law-2027", {
    prospectusUrl: "https://studies.nwu.ac.za/sites/studies.nwu.ac.za/files/files/undergrad/2027-Grade-12-prospectus.pdf",
    prospectusNotes: [
      "NWU says the APS for BA in Law is 28.",
      "The programme is selection-based and capacity is limited.",
      "This is one of the direct routes into the LLB pathway."
    ]
  }),
  rule("nwu-llb", "North-West University", "LLB", 30, [
    ["Home Language", 60],
    ["First Additional Language", 60]
  ], "https://studies.nwu.ac.za/undergraduate-studies/law-2027", {
    prospectusUrl: "https://studies.nwu.ac.za/sites/studies.nwu.ac.za/files/files/undergrad/2027-Grade-12-prospectus.pdf",
    prospectusNotes: [
      "NWU says the APS for the LLB is 30.",
      "The programme is selection-based and capacity is limited.",
      "This is the main direct law route."
    ]
  }),
  rule("nwu-bcom-accounting", "North-West University", "BCom in Accounting", 24, [
    ["Mathematics", 40]
  ], "https://studies.nwu.ac.za/undergraduate-studies/economic-and-management-sciences-2027", {
    prospectusUrl: "https://studies.nwu.ac.za/sites/studies.nwu.ac.za/files/files/undergrad/2027-Grade-12-prospectus.pdf",
    prospectusNotes: [
      "NWU lists BCom in Accounting at APS 24.",
      "Mathematics level 3 is required in the prospectus listing.",
      "The programme is campus-specific and should be checked against the faculty page."
    ]
  }),
  rule("nwu-bcom", "North-West University", "BCom", 26, [
    ["Mathematics", 50],
    ["English Home Language", 50]
  ], "https://studies.nwu.ac.za/undergraduate-studies/start-your-journey", {
    prospectusUrl: "https://studies.nwu.ac.za/sites/studies.nwu.ac.za/files/files/undergrad/2027-Grade-12-prospectus.pdf",
    prospectusNotes: [
      "APS is calculated from the six best subjects, excluding Life Orientation.",
      "Bachelor's degree admission requires at least 50% in any four 20-credit subjects.",
      "Minimum requirements do not guarantee admission; faculty-specific and selection rules still apply."
    ]
  }),
  rule("cput-diagnostic-radiography", "Cape Peninsula University of Technology", "BSc Diagnostic Radiography", 30, [
    ["English Home Language / English First Additional Language", 50],
    ["Mathematics", 50],
    ["Life Sciences", 50],
    ["Physical Sciences", 50]
  ], "https://www.cput.ac.za/faculties/fhws/departments/medical-imaging-and-therapeutic-sciences", {
    prospectusUrl: "https://www.cput.ac.za/study-at-cput/undergraduate/prospectus",
    prospectusNotes: [
      "CPUT says a minimum APS of 30 is considered and higher APS is preferred.",
      "Diagnostic Radiography, Radiation Therapy, and Diagnostic Ultrasound share the same minimum entrance pattern on the department page.",
      "International applicants should check SAQA evaluation rules."
    ]
  }),
  rule("cput-product-design", "Cape Peninsula University of Technology", "Product and Industrial Design", 28, [
    ["English Home Language / English First Additional Language", 50]
  ], "https://www.cput.ac.za/faculties/fid/departments/applied-design/product-and-industrial-design", {
    prospectusUrl: "https://www.cput.ac.za/study-at-cput/undergraduate/prospectus",
    prospectusNotes: [
      "CPUT states a minimum APS of 28 for Product and Industrial Design.",
      "The programme is industry-facing and sits inside the design faculty.",
      "Use the official course page for portfolio or additional selection details."
    ]
  }),
  rule("univen-bcom-bis", "University of Venda", "BCom in Business Information Systems", 32, [
    ["English Home Language / English First Additional Language", 50],
    ["Mathematics", 40]
  ], "https://www.univen.ac.za/faculties/management-commerce-and-law/business-information-systems/", {
    prospectusUrl: "https://www.univen.ac.za/wp-content/uploads/2026/03/2027-Univen-Undergraduate-Prospectus.pdf",
    prospectusNotes: [
      "UNIVEN says the programme requires APS 32 or above excluding Life Orientation.",
      "Mathematics is strongly recommended; Mathematical Literacy may be considered by discretion with an extended route.",
      "English at level 4 is required and limited spaces are available."
    ]
  }),
  rule("uwc-bsc", "University of the Western Cape", "BSc", 30, [
    ["Mathematics", 50],
    ["Physical Sciences", 50],
    ["English Home Language", 50]
  ], "https://www.uwc.ac.za/admission-and-financial-aid/apply"),
  rule("uwc-bcom", "University of the Western Cape", "BCom", 28, [
    ["Mathematics", 50],
    ["English Home Language", 50]
  ], "https://www.uwc.ac.za/admission-and-financial-aid/apply"),
  rule("cput-engineering", "Cape Peninsula University of Technology", "Engineering Technology", 30, [
    ["Mathematics", 50],
    ["Physical Sciences", 50],
    ["English Home Language", 50]
  ], "https://www.cput.ac.za/study/apply"),
  rule("dut-engineering", "Durban University of Technology", "Engineering", 28, [
    ["Mathematics", 50],
    ["Physical Sciences", 50],
    ["English Home Language", 50]
  ], "https://www.cao.ac.za"),
  rule("unisa-bcom", "University of South Africa", "BCom", 21, [
    ["Mathematics", 50],
    ["English Home Language", 50]
  ], "https://www.unisa.ac.za/sites/corporate/default/Apply-for-admission/Undergraduate-qualifications/Admission-requirements"),
  rule("unisa-ba", "University of South Africa", "BA", 20, [
    ["English Home Language", 50]
  ], "https://www.unisa.ac.za/sites/corporate/default/Apply-for-admission/Undergraduate-qualifications/Admission-requirements")
];

function rule(
  id: string,
  institutionName: string,
  programmeName: string,
  minimumTotal: number,
  requirements: Array<[string, number]>,
  sourceUrl: string,
  extra?: Pick<ApsRule, "prospectusUrl" | "prospectusNotes">
): ApsRule {
  return {
    id,
    institutionName,
    programmeName,
    ruleJson: {
      method: "nsc_levels",
      includeLifeOrientation: false,
      minimumTotal
    },
    minimumSubjectRequirementsJson: requirements.map(([subject, minMark]) => ({ subject, minMark })),
    sourceUrl,
    lastVerifiedAt: "2026-06-08",
    ...extra,
    sampleData: true
  };
}
