export default {
  // Flu vaccines
  // https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1107978/Influenza-green-book-chapter19-16September22.pdf
  '05000456078276': {
    gtin: '05000456078276',
    type: 'Flu',
    brand: 'Fluenz Tetra',
    manufacturer: 'AstraZeneca UK Ltd',
    leaflet: 'https://www.medicines.org.uk/emc/files/pil.15790.pdf',
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
  5000123114115: {
    gtin: '5000123114115',
    type: 'Flu',
    brand: 'Fluarix Tetra',
    manufacturer: 'GlaxoSmithKline UK Ltd',
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
  '00191778001693': {
    gtin: '00191778001693',
    type: 'HPV',
    brand: 'Gardasil 9',
    manufacturer: 'Merck Sharp & Dohme (UK) Ltd',
    leaflet: 'https://www.medicines.org.uk/emc/files/pil.7330.pdf',
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
  // 3-in-1 and MenACWY vaccines
  // Possible others: Pediacel, Repevax, Infanrix IPV
  // https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/147952/Green-Book-Chapter-15.pdf
  3664798042948: {
    gtin: '3664798042948',
    type: 'TdIPV',
    brand: 'Revaxis',
    manufacturer: 'Sanofi',
    leaflet: 'https://www.medicines.org.uk/emc/files/pil.5581.pdf',
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
      'isMedicated'
    ]
  },
  // Menveo, Nimenrix and MenQuadfi
  // https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1076053/Meningococcal-greenbook-chapter-22_17May2022.pdf
  5415062370568: {
    gtin: '5415062370568',
    type: 'MenACWY',
    brand: 'Nimenrix',
    manufacturer: 'Pfizer Ltd',
    leaflet: 'https://www.medicines.org.uk/emc/files/pil.4118.pdf',
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
