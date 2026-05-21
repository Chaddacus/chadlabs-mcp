import type { ClassifyFixture, AppealFixture } from "./types.js";

/* Synthetic denial-text fixtures. All names + member IDs are fake. */
export const CLASSIFY_FIXTURES: ClassifyFixture[] = [
  {
    id: "c-mn-001",
    denial_text:
      "After review of the submitted documentation, we have determined that the requested service does not meet our medical necessity criteria for the submitted diagnosis. The clinical information provided does not establish that this service is medically necessary for the member's condition.",
    expected_reason_code: "MN-001",
  },
  {
    id: "c-mn-002",
    denial_text:
      "The level of care requested is not supported by the submitted clinical documentation. Inpatient admission criteria are not met; an outpatient setting would be appropriate for this member's condition.",
    expected_reason_code: "MN-002",
  },
  {
    id: "c-mn-003",
    denial_text:
      "The requested therapy is considered experimental and investigational. Per our coverage policy, treatments that are not yet FDA-approved for the specific indication are not covered under this plan.",
    expected_reason_code: "MN-003",
  },
  {
    id: "c-mn-004",
    denial_text:
      "Frequency limit exceeded. The member has reached the maximum of 30 physical therapy visits per benefit year under this plan.",
    expected_reason_code: "MN-004",
  },
  {
    id: "c-cv-001",
    denial_text:
      "This service is explicitly excluded under the member's current benefit plan. Cosmetic procedures of this type are listed in the plan's exclusions section.",
    expected_reason_code: "CV-001",
  },
  {
    id: "c-cv-002",
    denial_text:
      "The requested benefit does not exist in the member's plan design. Adult dental services are not offered under this plan.",
    expected_reason_code: "CV-002",
  },
  {
    id: "c-cv-003",
    denial_text:
      "The rendering provider is not in our network. The member's plan does not cover out-of-network services except in emergency situations.",
    expected_reason_code: "CV-003",
  },
  {
    id: "c-cv-004",
    denial_text:
      "Member eligibility check failed. The member's coverage was terminated on 2026-02-28; service was rendered on 2026-04-05, after the termination date.",
    expected_reason_code: "CV-004",
  },
  {
    id: "c-doc-001",
    denial_text:
      "We were unable to process this claim because required clinical documentation was not received. Please resubmit with the complete office visit notes from the date of service.",
    expected_reason_code: "DOC-001",
  },
  {
    id: "c-doc-002",
    denial_text:
      "The submitted clinical records do not support the diagnosis billed. Documentation does not establish the diabetes severity required for the J-code dispensed.",
    expected_reason_code: "DOC-002",
  },
  {
    id: "c-doc-003",
    denial_text:
      "Progress notes for the treatment period are absent from the submitted documentation. Please provide therapy progress notes covering dates 2026-03-01 through 2026-03-29.",
    expected_reason_code: "DOC-003",
  },
  {
    id: "c-adm-001",
    denial_text:
      "Claim was received past the timely filing deadline. Claims must be submitted within 90 days of the date of service per our provider agreement.",
    expected_reason_code: "ADM-001",
  },
  {
    id: "c-adm-002",
    denial_text:
      "This claim has been previously processed. Our records indicate a duplicate of claim number CLM-291847 paid on 2026-04-12.",
    expected_reason_code: "ADM-002",
  },
  {
    id: "c-adm-003",
    denial_text:
      "Incorrect billing code submitted. The CPT code on the claim does not accurately reflect the procedure described in the submitted operative report.",
    expected_reason_code: "ADM-003",
  },
  {
    id: "c-form-001",
    denial_text:
      "The requested drug is not on the member's formulary. A formulary alternative is available. Please consider substitution or submit a formulary exception request.",
    expected_reason_code: "FORM-001",
  },
  {
    id: "c-form-002",
    denial_text:
      "Step therapy required for this medication. The member must try the formulary-preferred agent for at least 4 weeks before this drug is covered.",
    expected_reason_code: "FORM-002",
  },
  {
    id: "c-form-003",
    denial_text:
      "Quantity limit exceeded. The prescribed 90-day supply exceeds the formulary quantity limit of 30 days for this medication.",
    expected_reason_code: "FORM-003",
  },
  {
    id: "c-pa-001",
    denial_text:
      "Prior authorization was required for this service and was not obtained prior to service delivery. Retrospective review may be available; please submit clinical documentation for consideration.",
    expected_reason_code: "PA-001",
  },
  {
    id: "c-pa-002",
    denial_text:
      "Prior authorization PA-87223401 on file but expired on 2026-03-15. Service rendered 2026-04-02 is outside the authorization period. Please request renewal.",
    expected_reason_code: "PA-002",
  },
];

/* Synthetic appeal-letter fixtures. Each has a hand-written rubric describing
 * what a "good" letter should cover for THIS specific denial. */
export const APPEAL_FIXTURES: AppealFixture[] = [
  {
    id: "a-mn-001",
    denial: {
      payer: "UnitedHealthcare",
      claim_id: "CLM-TEST-00001",
      member_id: "MBR-TEST-0001",
      denial_reason_code: "MN-001",
      denial_reason_text: "Service not medically necessary for the submitted diagnosis.",
      raw_excerpt:
        "After review of the submitted documentation, we have determined that the requested service does not meet our medical necessity criteria for the submitted diagnosis (M54.5).",
      date_of_service: "2026-04-15",
    },
    clinical_facts: {
      diagnosis_codes: ["M54.5", "M51.27"],
      prior_treatments_tried: [
        "6 weeks of NSAIDs",
        "8 sessions of physical therapy",
        "Epidural steroid injection 2026-02-10",
      ],
      clinical_summary:
        "Patient reports chronic low-back pain with right L5 radiculopathy unresponsive to conservative therapy. MRI shows L4-L5 disc herniation with nerve root impingement.",
      supporting_citations: [
        "NASS Coverage Policy Recommendations for Lumbar Discectomy",
        "Member's MRI report dated 2026-03-22",
      ],
    },
    rubric:
      "The letter MUST: (1) cite MN-001 by exact code, (2) name at least one of: NSAIDs trial, PT, ESI as evidence step therapy was completed, (3) reference the MRI finding of nerve root impingement, (4) request either an overturn of the denial or a peer-to-peer review, (5) avoid inventing diagnoses or outcomes not in the input, (6) suggest at least one attachment (the MRI report, the PT notes, or the NASS guideline). The letter should NOT make medical recommendations or claim the procedure is risk-free.",
  },
  {
    id: "a-pa-001",
    denial: {
      payer: "Aetna",
      claim_id: "CLM-TEST-00002",
      member_id: "MBR-TEST-0002",
      denial_reason_code: "PA-001",
      denial_reason_text: "Prior authorization was required and not obtained.",
      raw_excerpt:
        "Prior authorization was required for this service per the member's benefit plan. No PA was on file at the time of service. Retrospective review may be available.",
      date_of_service: "2026-03-29",
    },
    clinical_facts: {
      diagnosis_codes: ["G47.33"],
      prior_treatments_tried: ["Behavioral sleep hygiene counseling", "Trial of positional therapy"],
      clinical_summary:
        "Patient referred for in-lab polysomnography for evaluation of suspected obstructive sleep apnea after STOP-BANG score of 6.",
      supporting_citations: ["AASM Clinical Practice Guideline for diagnostic testing for adult OSA"],
    },
    rubric:
      "The letter MUST: (1) cite PA-001, (2) acknowledge the missing PA, (3) request retrospective review (since the denial language explicitly allows it), (4) reference the AASM guideline OR the STOP-BANG score as justification, (5) suggest attaching the AASM guideline and the office-visit note documenting clinical suspicion. The letter should ARGUE that the test was clinically appropriate, not just procedurally challenge the missing PA.",
  },
  {
    id: "a-cv-002",
    denial: {
      payer: "Cigna",
      claim_id: "CLM-TEST-00003",
      member_id: "MBR-TEST-0003",
      denial_reason_code: "CV-002",
      denial_reason_text: "Out-of-network provider; not covered under this plan.",
      raw_excerpt:
        "The rendering provider is out of network. The member's plan does not cover out-of-network services except in emergency situations.",
      date_of_service: "2026-04-02",
    },
    clinical_facts: {
      diagnosis_codes: ["I21.4"],
      prior_treatments_tried: [],
      clinical_summary:
        "Patient presented to ED with acute chest pain and elevated troponin; ECG showed NSTEMI. Closest in-network cath lab was 90 minutes away; nearest hospital was selected. Cardiology consult provided emergent care including PCI.",
      supporting_citations: ["No Surprises Act emergency-services protections (CMS-9909-IFC)"],
    },
    rubric:
      "The letter MUST: (1) cite CV-002, (2) invoke the No Surprises Act emergency-services exception, (3) reference the NSTEMI diagnosis and the time-critical nature of emergency cardiac intervention, (4) request the claim be reprocessed under in-network terms per the federal protection, (5) suggest attaching the ED note + the cath lab procedure note. Should NOT argue cost or relative-network comparisons — the argument is the emergency exception.",
  },
  {
    id: "a-doc-001",
    denial: {
      payer: "Humana",
      claim_id: "CLM-TEST-00004",
      member_id: "MBR-TEST-0004",
      denial_reason_code: "DOC-001",
      denial_reason_text: "Clinical documentation missing or incomplete.",
      raw_excerpt:
        "We did not receive the required office-visit notes for the date of service. Please resubmit with complete documentation.",
      date_of_service: "2026-04-08",
    },
    clinical_facts: {
      diagnosis_codes: ["E11.9"],
      prior_treatments_tried: ["Metformin monotherapy 6 months"],
      clinical_summary: "Type 2 diabetes follow-up; HbA1c 8.7. Continuous glucose monitor initiated.",
      supporting_citations: [],
    },
    rubric:
      "The letter MUST: (1) cite DOC-001, (2) confirm the records will be attached/resubmitted, (3) request reprocessing rather than a substantive overturn (since the issue is documentation, not medical judgment), (4) keep the tone administrative — this is fixing a paperwork issue, not arguing medical necessity. Should NOT pad with clinical-necessity arguments; the denial is documentation-only.",
  },
  {
    id: "a-form-001",
    denial: {
      payer: "Anthem BCBS",
      claim_id: "CLM-TEST-00005",
      member_id: "MBR-TEST-0005",
      denial_reason_code: "FORM-001",
      denial_reason_text: "Drug not on formulary.",
      raw_excerpt:
        "The prescribed medication is non-formulary. Please consider a formulary alternative or request a formulary exception.",
      date_of_service: "2026-04-14",
    },
    clinical_facts: {
      diagnosis_codes: ["G43.709"],
      prior_treatments_tried: [
        "Topiramate 100mg — discontinued due to cognitive side effects",
        "Propranolol 80mg — inadequate response after 12 weeks",
      ],
      clinical_summary:
        "Chronic migraine, ≥15 headache days/month. Two formulary preventives tried with inadequate response or intolerance.",
      supporting_citations: ["AAN/AHS Practice Guideline Update: pharmacologic treatment for chronic migraine"],
    },
    rubric:
      "The letter MUST: (1) cite FORM-001, (2) name both prior preventives tried with specific reasons for failure (cognitive side effects, inadequate response), (3) request a formulary exception (not just a substitution), (4) reference the AAN/AHS guideline, (5) suggest attaching the chart notes showing the prior trials. Should explicitly request 'formulary exception' as the remedy.",
  },
];
