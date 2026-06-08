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
  rule("uj-bcom-accounting", "University of Johannesburg", "BCom Accounting", 30, [
    ["Mathematics", 60],
    ["English Home Language", 50],
    ["Accounting", 60]
  ], "https://www.uj.ac.za/admission-aid/undergraduate/"),
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
