import { ProgrammeType } from '../enums.js'

export default {
  [ProgrammeType.Flu]: {
    type: ProgrammeType.Flu,
    name: 'Flu',
    title: 'Children’s flu',
    vaccineName: 'Children’s flu vaccine',
    information: {
      startPage:
        'Use this service to give or refuse consent for your child to have a flu vaccination.\n\nThis vaccination is recommended for school age children every year.\n\n## About the children’s flu vaccine\n\nThe children’s flu vaccine helps protect children against flu. Vaccinating children also protects others who are vulnerable to flu, such as babies and older people.\n\nThe vaccine is given as a nasal spray. This gives the most effective protection.\n\nSome children can have an injection instead, for example if they:\n\n- have had a serious allergic reaction to a previous dose of the nasal spray vaccine\n- have a severe egg allergy\n- have asthma that’s being treated with long-term steroid tablets\n- do not use gelatine or other animal products',
      description:
        'The vaccine protects against flu, which can cause serious health problems such as bronchitis and pneumonia. It is recommended for children from Reception to Year 11 every year.',
      url: 'https://www.nhs.uk/vaccinations/child-flu-vaccine/'
    },
    guidance: {
      url: 'https://www.gov.uk/government/publications/flu-vaccination-leaflets-and-posters',
      hint: 'including in other languages and alternative formats, including BSL and Braille'
    },
    yearGroups: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    vaccine_smomeds: ['43208811000001106', '40085011000001101'],
    nhseSyncable: true
  },
  [ProgrammeType.HPV]: {
    type: ProgrammeType.HPV,
    name: 'HPV',
    title: 'Human papillomavirus (HPV)',
    vaccineName: 'HPV vaccine',
    information: {
      startPage:
        'The HPV vaccine helps to prevent HPV related cancers from developing in boys and girls.\n\nThe number of doses you need depends on your age and how well your immune system works. Young people usually only need 1 dose.',
      description:
        'The HPV vaccine helps protect boys and girls against cancers caused by HPV, including:\n- cervical cancer\n- some mouth and throat (head and neck) cancers\n- some cancers of the anal and genital areas\n\nThe HPV vaccine has been given to girls since 2008. Following its success at helping prevent cervical cancers, it was introduced to boys in 2019 to help prevent HPV-related cancers that affect them.\n\nYoung people usually only need 1 dose.',
      url: 'https://www.nhs.uk/conditions/vaccinations/hpv-human-papillomavirus-vaccine/'
    },
    guidance: {
      url: 'https://www.gov.uk/government/publications/hpv-vaccine-vaccination-guide-leaflet',
      hint: 'including in other languages and alternative formats, including BSL and Braille'
    },
    sequence: ['1P', '2P', '3P'],
    sequenceDefault: '1P',
    yearGroups: [8],
    catchupYearGroups: [9, 10, 11],
    vaccine_smomeds: ['33493111000001108'],
    nhseSyncable: true
  },
  [ProgrammeType.TdIPV]: {
    type: ProgrammeType.TdIPV,
    name: 'Td/IPV',
    title: 'Td/IPV (3-in-1 teenage booster)',
    vaccineName: 'Td/IPV vaccine',
    information: {
      startPage:
        'The Td/IPV vaccine (also called the 3-in-1 teenage booster) helps protect against tetanus, diphtheria and polio.\n\nIt boosts the protection provided by the [6-in-1 vaccine](https://www.nhs.uk/vaccinations/6-in-1-vaccine/) and [4-in-1 pre-school booster vaccine](https://www.nhs.uk/vaccinations/4-in-1-preschool-booster-vaccine/).',
      description:
        'The Td/IPV vaccine (also called the 3-in-1 teenage booster) helps protect against tetanus, diphtheria and polio.\n\nIt’s offered at around 13 or 14 years old (school year 9 or 10). It boosts the protection provided by the [6-in-1 vaccine](https://www.nhs.uk/vaccinations/6-in-1-vaccine/) and [4-in-1 pre-school booster vaccine](https://www.nhs.uk/vaccinations/4-in-1-preschool-booster-vaccine/).',
      url: 'https://www.nhs.uk/vaccinations/td-ipv-vaccine-3-in-1-teenage-booster/'
    },
    guidance: {
      url: 'https://www.gov.uk/government/publications/a-guide-to-the-3-in-1-teenage-booster-tdipv',
      hint: 'with links to information in other languages'
    },
    sequence: ['1P', '2P', '3P', '1B', '2B'],
    sequenceDefault: '2B',
    yearGroups: [9],
    catchupYearGroups: [10, 11],
    vaccine_smomeds: ['7374311000001101'],
    nhseSyncable: false
  },
  [ProgrammeType.MenACWY]: {
    type: ProgrammeType.MenACWY,
    name: 'MenACWY',
    title: 'MenACWY',
    vaccineName: 'MenACWY vaccine',
    information: {
      startPage:
        'The MenACWY vaccine helps protect against meningitis and sepsis. It is recommended for all teenagers. Most people only need one dose of the vaccine.',
      description:
        'The MenACWY vaccine helps protect against life-threatening illnesses including meningitis, sepsis and septicaemia (blood poisoning).\n\nIt is recommended for all teenagers. Most people only need 1 dose of the vaccine.',
      url: 'https://www.nhs.uk/vaccinations/menacwy-vaccine/'
    },
    guidance: {
      url: 'https://www.gov.uk/government/publications/menacwy-vaccine-information-for-young-people',
      hint: 'with links to information in other languages'
    },
    yearGroups: [9],
    catchupYearGroups: [10, 11],
    vaccine_smomeds: ['39779611000001104'],
    nhseSyncable: false
  },
  [ProgrammeType.MMR]: {
    type: ProgrammeType.MMR,
    name: 'MMR',
    title: 'Measles, mumps and rubella (MMR)',
    vaccineName: 'MMR vaccine',
    emailNames: {
      default: 'MMR catch-up',
      invite: 'MMR (measles, mumps and rubella) catch-up'
    },
    information: {
      startPage:
        'The MMR vaccine protects against measles, mumps and rubella. Having 2 doses gives lasting protection against all 3 illnesses. If you’re not sure how many doses your child has had, having further doses will not cause any harm. If your child has had 2 doses, please confirm this using the consent request form.\n\nResearch has shown there is no link between the MMR vaccine and autism.',
      description:
        'The MMR vaccine protects against measles, mumps and rubella. Having 2 doses gives lasting protection against all 3 illnesses. If you’re not sure how many doses your child has had, having further doses will not cause any harm.\n\nResearch has shown there is no link between the MMR vaccine and autism.',
      url: 'https://www.nhs.uk/vaccinations/mmr-vaccine/'
    },
    guidance: {
      url: 'https://www.gov.uk/government/publications/mmr-for-all-general-leaflet',
      hint: 'including in other languages'
    },
    sequence: ['1P', '2P'],
    sequenceDefault: '1P',
    yearGroups: [8],
    catchupYearGroups: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    vaccine_smomeds: ['13968211000001108', '34925111000001104'],
    nhseSyncable: true
  }
}
