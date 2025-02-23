/**
 * @readonly
 * @enum {string}
 */
const vaccineSideEffect = {
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
      vaccineSideEffect.BlockedNose,
      vaccineSideEffect.Headache,
      vaccineSideEffect.Tiredness,
      vaccineSideEffect.AppetiteLoss
    ],
    healthQuestionKeys: [
      'Asthma',
      'AsthmaSteroids',
      'AsthmaAdmitted',
      'RecentFluVaccination',
      'ImmuneSystem',
      'HouseholdImmuneSystem',
      'EggAllergy',
      'MedicationAllergies',
      'Aspirin',
      'Support'
    ],
    preScreenQuestionKeys: [
      'isHappy',
      'isVaccinated',
      'isWell',
      'isAllergic',
      'isMedicated'
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
      vaccineSideEffect.PainSite,
      vaccineSideEffect.Headache,
      vaccineSideEffect.Dizzy,
      vaccineSideEffect.Sick,
      vaccineSideEffect.Rash,
      vaccineSideEffect.Irritable,
      vaccineSideEffect.Drowsy,
      vaccineSideEffect.AppetiteLoss,
      vaccineSideEffect.Temperature,
      vaccineSideEffect.Unwell
    ],
    healthQuestionKeys: [
      'Allergy',
      'MedicalConditions',
      'PreviousReaction',
      'Support'
    ],
    preScreenQuestionKeys: [
      'isHappy',
      'isVaccinated',
      'isWell',
      'isAllergic',
      'isMedicated'
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
      vaccineSideEffect.Bruising,
      vaccineSideEffect.TemperatureShiver,
      vaccineSideEffect.SickFeeling,
      vaccineSideEffect.PainArms
    ],
    healthQuestionKeys: [
      'Allergy',
      'MedicalConditions',
      'PreviousReaction',
      'Support'
    ],
    preScreenQuestionKeys: [
      'isHappy',
      'isVaccinated',
      'isWell',
      'isAllergic',
      'isPregnant'
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
      vaccineSideEffect.PainSite,
      vaccineSideEffect.Dizzy,
      vaccineSideEffect.SickFeeling,
      vaccineSideEffect.Temperature,
      vaccineSideEffect.Headache
    ],
    healthQuestionKeys: [
      'Bleeding',
      'RecentTdIpvVaccination',
      'PreviousReaction',
      'Support'
    ],
    preScreenQuestionKeys: [
      'isHappy',
      'isVaccinated',
      'isWell',
      'isAllergic',
      'isMedicated',
      'isPregnant'
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
      vaccineSideEffect.PainSite,
      vaccineSideEffect.Headache,
      vaccineSideEffect.SickFeeling,
      vaccineSideEffect.Rash,
      vaccineSideEffect.Irritable,
      vaccineSideEffect.Drowsy,
      vaccineSideEffect.AppetiteLoss,
      vaccineSideEffect.Unwell
    ],
    healthQuestionKeys: [
      'Bleeding',
      'RecentMenAcwyVaccination',
      'PreviousReaction',
      'Support'
    ],
    preScreenQuestionKeys: [
      'isHappy',
      'isVaccinated',
      'isWell',
      'isAllergic',
      'isMedicated'
    ]
  }
}
