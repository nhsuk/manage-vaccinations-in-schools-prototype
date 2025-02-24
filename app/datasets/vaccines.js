/**
 * @readonly
 * @enum {string}
 */
const VaccineSideEffect = {
  AppetiteLoss: 'loss of appetite',
  BlockedNose: 'a runny or blocked nose',
  Bruising: 'bruising or itching at the site of the injection',
  Dizzy: 'dizziness',
  Drowsy: 'feeling drowsy',
  Headache: 'a headache',
  Irritable: 'feeling irritable',
  PainArms: 'pain in the arms, hands, fingers',
  PainSite: 'pain, swelling or itchiness where the injection was given',
  Rash: 'a rash',
  Sick: 'feeling or being sick',
  SickFeeling: 'feeling sick (nausea)',
  Tiredness: 'general tiredness',
  Temperature: 'a high temperature',
  TemperatureShiver: 'a high temperature, or feeling hot and shivery',
  Unwell: 'generally feeling unwell'
}

/**
 * @readonly
 * @enum {string}
 */
export const HealthQuestion = {
  Aspirin: 'Does the child take regular aspirin?',
  Allergy: 'Does the child have any severe allergies?',
  Asthma: 'Has the child been diagnosed with asthma?',
  AsthmaAdmitted:
    'Has the child been admitted to intensive care for their asthma?',
  AsthmaSteroids:
    'Has the child taken any oral steroids for their asthma in the last 2 weeks?',
  Bleeding:
    'Does the child have a bleeding disorder or another medical condition they receive treatment for?',
  EggAllergy:
    'Has the child ever been admitted to intensive care due an allergic reaction to egg?',
  Immunosuppressant: 'Does the child take any immunosuppressant medication?',
  ImmuneSystem:
    'Does the child have a disease or treatment that severely affects their immune system?',
  HouseholdImmuneSystem:
    'Is anyone in the child’s household currently having treatment that severely affects their immune system?',
  MedicationAllergies: 'Does the child have any allergies to medication?',
  MedicalConditions:
    'Does the child have any medical conditions for which they receive treatment?',
  PreviousReaction:
    'Has the child ever had a severe reaction to any medicines, including vaccines?',
  RecentFluVaccination:
    'Has the child had a flu vaccination in the last 5 months?',
  RecentMenAcwyVaccination:
    'Has the child had a meningitis (MenACWY) vaccination in the last 5 years?',
  RecentTdIpvVaccination:
    'Has the child had a tetanus, diphtheria and polio vaccination in the last 5 years?',
  Support: 'Does the child need extra support during vaccination sessions?'
}

/**
 * @readonly
 * @enum {string}
 */
export const PreScreenQuestion = {
  IsAllergic:
    'Has the child confirmed they have no allergies which would prevent vaccination?',
  IsPregnant: 'Has the child confirmed they’re not pregnant?',
  IsMedicated:
    'Has the child confirmed they’re not taking any medication which prevents vaccination?',
  IsVaccinated:
    'Has the child confirmed they have not already had this vaccination?',
  IsWell: 'Is the child is feeling well?',
  IsHappy:
    'Does the child know what the vaccination is for, and are they happy to have it?'
}

export default {
  // Flu vaccines
  // https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1107978/Influenza-green-book-chapter19-16September22.pdf
  '43208811000001106': {
    snomed: '43208811000001106',
    type: 'Flu',
    brand: 'Fluenz Trivalent',
    manufacturer: 'AstraZeneca UK Ltd',
    leaflet: {
      url: 'https://www.medicines.org.uk/emc/files/pil.15790.pdf',
      size: '197KB'
    },
    method: 'Nasal spray',
    dose: 0.2,
    sideEffects: [
      VaccineSideEffect.BlockedNose,
      VaccineSideEffect.Headache,
      VaccineSideEffect.Tiredness,
      VaccineSideEffect.AppetiteLoss
    ],
    healthQuestions: [
      HealthQuestion.Asthma,
      HealthQuestion.AsthmaSteroids,
      HealthQuestion.AsthmaAdmitted,
      HealthQuestion.RecentFluVaccination,
      HealthQuestion.ImmuneSystem,
      HealthQuestion.HouseholdImmuneSystem,
      HealthQuestion.EggAllergy,
      HealthQuestion.MedicationAllergies,
      HealthQuestion.Aspirin
    ],
    preScreenQuestions: [
      PreScreenQuestion.IsHappy,
      PreScreenQuestion.IsVaccinated,
      PreScreenQuestion.IsWell,
      PreScreenQuestion.IsAllergic,
      PreScreenQuestion.IsMedicated
    ]
  },
  '40085011000001101': {
    snomed: '40085011000001101',
    type: 'Flu',
    brand: 'Cell-based Quadrivalent',
    manufacturer: 'Seqirus UK Limited',
    leaflet: {
      url: 'https://www.medicines.org.uk/emc/files/pil.12882.pdf',
      size: '174KB'
    },
    method: 'Injection',
    dose: 0.5,
    sideEffects: [
      VaccineSideEffect.PainSite,
      VaccineSideEffect.Headache,
      VaccineSideEffect.Dizzy,
      VaccineSideEffect.Sick,
      VaccineSideEffect.Rash,
      VaccineSideEffect.Irritable,
      VaccineSideEffect.Drowsy,
      VaccineSideEffect.AppetiteLoss,
      VaccineSideEffect.Temperature,
      VaccineSideEffect.Unwell
    ],
    healthQuestions: [
      HealthQuestion.Allergy,
      HealthQuestion.MedicalConditions,
      HealthQuestion.PreviousReaction
    ],
    preScreenQuestions: [
      PreScreenQuestion.IsHappy,
      PreScreenQuestion.IsVaccinated,
      PreScreenQuestion.IsWell,
      PreScreenQuestion.IsAllergic,
      PreScreenQuestion.IsMedicated
    ]
  },
  // HPV vaccines
  // Possible others: Gardasil, Cervarix
  // https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1065283/HPV-greenbook-chapter-18a.pdf
  '33493111000001108': {
    snomed: '33493111000001108',
    type: 'HPV',
    brand: 'Gardasil 9',
    manufacturer: 'Merck Sharp & Dohme (UK) Ltd',
    leaflet: {
      url: 'https://www.medicines.org.uk/emc/files/pil.7330.pdf',
      size: '110KB'
    },
    method: 'Injection',
    dose: 0.5,
    sequenceLimit: 3,
    sideEffects: [
      VaccineSideEffect.Bruising,
      VaccineSideEffect.TemperatureShiver,
      VaccineSideEffect.SickFeeling,
      VaccineSideEffect.PainArms
    ],
    healthQuestions: [
      HealthQuestion.Allergy,
      HealthQuestion.MedicalConditions,
      HealthQuestion.PreviousReaction
    ],
    preScreenQuestions: [
      PreScreenQuestion.IsHappy,
      PreScreenQuestion.IsVaccinated,
      PreScreenQuestion.IsWell,
      PreScreenQuestion.IsAllergic,
      PreScreenQuestion.IsPregnant
    ]
  },
  // 3-in-1 vaccines
  // Possible others: Pediacel, Repevax, Infanrix IPV
  // https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/147952/Green-Book-Chapter-15.pdf
  '7374311000001101': {
    snomed: '7374311000001101',
    type: 'TdIPV',
    brand: 'Revaxis',
    manufacturer: 'Sanofi',
    leaflet: {
      url: 'https://www.medicines.org.uk/emc/files/pil.5581.pdf',
      size: '2.64MB'
    },
    method: 'Injection',
    dose: 0.5,
    sideEffects: [
      VaccineSideEffect.PainSite,
      VaccineSideEffect.Dizzy,
      VaccineSideEffect.SickFeeling,
      VaccineSideEffect.Temperature,
      VaccineSideEffect.Headache
    ],
    healthQuestions: [
      HealthQuestion.Bleeding,
      HealthQuestion.Allergy,
      HealthQuestion.PreviousReaction,
      HealthQuestion.RecentTdIpvVaccination
    ],
    preScreenQuestions: [
      PreScreenQuestion.IsHappy,
      PreScreenQuestion.IsVaccinated,
      PreScreenQuestion.IsWell,
      PreScreenQuestion.IsAllergic,
      PreScreenQuestion.IsMedicated,
      PreScreenQuestion.IsPregnant
    ]
  },
  // MenACWY vaccines
  // Possible others: Menveo, Nimenrix
  // https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1076053/Meningococcal-greenbook-chapter-22_17May2022.pdf
  '39779611000001104': {
    snomed: '39779611000001104',
    type: 'MenACWY',
    brand: 'MenQuadfi',
    manufacturer: 'Sanofi',
    leaflet: {
      url: 'https://www.medicines.org.uk/emc/files/pil.12818.pdf',
      size: '177KB'
    },
    method: 'Injection',
    dose: 0.5,
    sideEffects: [
      VaccineSideEffect.PainSite,
      VaccineSideEffect.Headache,
      VaccineSideEffect.SickFeeling,
      VaccineSideEffect.Rash,
      VaccineSideEffect.Irritable,
      VaccineSideEffect.Drowsy,
      VaccineSideEffect.AppetiteLoss,
      VaccineSideEffect.Unwell
    ],
    healthQuestions: [
      HealthQuestion.Bleeding,
      HealthQuestion.Allergy,
      HealthQuestion.PreviousReaction,
      HealthQuestion.RecentMenAcwyVaccination
    ],
    preScreenQuestions: [
      PreScreenQuestion.IsHappy,
      PreScreenQuestion.IsVaccinated,
      PreScreenQuestion.IsWell,
      PreScreenQuestion.IsAllergic,
      PreScreenQuestion.IsMedicated
    ]
  }
}
