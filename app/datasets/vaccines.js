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
