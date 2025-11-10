/**
 * @readonly
 * @enum {string}
 */
export const AcademicYear = {
  Y2023: '2023 to 2024',
  Y2024: '2024 to 2025',
  Y2025: '2025 to 2026'
}

/**
 * @readonly
 * @enum {string}
 */
export const ArchiveRecordReason = {
  Deceased: 'The child was reported as deceased',
  Duplicate: 'It’s a duplicate',
  Error: 'It was imported in error',
  Moved: 'The child has moved out of the area',
  Other: 'Other'
}

/**
 * @readonly
 * @enum {string}
 */
export const AuditEventType = {
  Note: 'Session note',
  Notice: 'Notice',
  Pinned: 'Pinned session note',
  Reminder: 'Reminder'
}

/**
 * @readonly
 * @enum {string}
 */
export const ConsentOutcome = {
  NoRequest: 'Request failed',
  NoResponse: 'No response',
  Inconsistent: 'Conflicting consent',
  Given: 'Consent given',
  GivenForAlternativeInjection: 'Consent given for injected vaccine',
  GivenForIntranasal: 'Consent given for nasal spray',
  Declined: 'Follow up requested',
  Refused: 'Consent refused',
  FinalRefusal: 'Refusal confirmed'
}

/**
 * @readonly
 * @enum {string}
 */
export const ConsentVaccineCriteria = {
  AlternativeInjectionOnly: 'Gelatine-free injected vaccine only',
  Either: 'No preference',
  IntranasalOnly: 'Nasal spray only'
}

/**
 * @readonly
 * @enum {string}
 */
export const ConsentWindow = {
  Opening: 'Opening',
  Open: 'Open',
  Closed: 'Closed',
  None: 'Session not scheduled'
}

/**
 * @readonly
 * @enum {string}
 */
export const DownloadFormat = {
  CSV: 'CSV',
  CarePlus: 'XLSX for CarePlus (System C)',
  SystmOne: 'XLSX for SystmOne (TPP)'
}

/**
 * @readonly
 * @enum {string}
 */
export const EthnicGroup = {
  White: 'White',
  Mixed: 'Mixed or multiple ethnic groups',
  Asian: 'Asian or Asian British',
  Black: 'Black, African, Caribbean or Black British',
  Other: 'Other ethnic group',
  Withheld: 'Prefer not to say'
}

/**
 * @readonly
 * @enum {string}
 */
export const EthnicBackgroundWhite = {
  British: 'English, Welsh, Scottish, Northern Irish or British',
  Irish: 'Irish',
  GRT: 'Gypsy or Irish Traveller',
  Other: 'Any other White background'
}

/**
 * @readonly
 * @enum {string}
 */
export const EthnicBackgroundMixed = {
  WhiteBlack: 'White and Black Caribbean',
  WhiteAfrican: 'White and Black African',
  WhiteAsian: 'White and Asian',
  Other: 'Any other mixed or multiple ethnic background'
}

/**
 * @readonly
 * @enum {string}
 */
export const EthnicBackgroundAsian = {
  Indian: 'Indian',
  Pakistani: 'Pakistani',
  Bangladeshi: 'Bangladeshi',
  Chinese: 'Chinese',
  Other: 'Any other Asian background'
}

/**
 * @readonly
 * @enum {string}
 */
export const EthnicBackgroundBlack = {
  African: 'African',
  Caribbean: 'Caribbean',
  Other: 'Any other Black, African or Caribbean background'
}

/**
 * @readonly
 * @enum {string}
 */
export const EthnicBackgroundOther = {
  Arab: 'Arab',
  Other: 'Any other ethnic group'
}

/**
 * @typedef {EthnicBackgroundWhite | EthnicBackgroundMixed | EthnicBackgroundAsian | EthnicBackgroundBlack | EthnicBackgroundOther} EthnicBackground
 */

/**
 * @readonly
 * @enum {string}
 */
export const Gender = {
  Female: 'Female',
  Male: 'Male',
  NotKnown: 'Not known',
  NotSpecified: 'Not specified'
}

/**
 * @readonly
 * @enum {string}
 */
export const GillickCompetent = {
  True: 'Child assessed as Gillick competent',
  False: 'Child assessed as not Gillick competent'
}

/**
 * @readonly
 * @enum {string}
 */
export const InstructionOutcome = {
  Given: 'PSD added',
  Needed: 'PSD not added'
}

/**
 * @readonly
 * @enum {string}
 */
export const MoveSource = {
  Cohort: 'Cohort record',
  Consent: 'Consent response',
  School: 'Class list',
  External: 'Another SAIS team'
}

/**
 * @readonly
 * @enum {string}
 */
export const NoticeType = {
  Deceased: 'Deceased',
  Invalid: 'Invalid',
  NoNotify: 'Do not notify parents',
  Sensitive: 'Sensitive'
}

/**
 * @readonly
 * @enum {string}
 */
export const NotifyEmailStatus = {
  Delivered: 'Delivered',
  Permanent: 'Email address does not exist',
  Temporary: 'Inbox not accepting messages right now',
  Technical: 'Technical failure'
}

/**
 * @readonly
 * @enum {string}
 */
export const NotifySmsStatus = {
  Delivered: 'Delivered',
  Permanent: 'Not delivered',
  Temporary: 'Phone not accepting messages right now',
  Technical: 'Technical failure'
}

/**
 * @readonly
 * @enum {boolean|number}
 */
export const OrganisationDefaults = {
  SessionOpenWeeks: 3,
  SessionReminderWeeks: 1,
  SessionRegistration: true
}

/**
 * @readonly
 * @enum {string}
 */
export const ParentalRelationship = {
  Mum: 'Mum',
  Dad: 'Dad',
  Guardian: 'Guardian',
  Fosterer: 'Foster carer',
  Other: 'Other',
  Unknown: 'Unknown'
}

/**
 * @readonly
 * @enum {string}
 */
export const PatientStatus = {
  Ineligible: 'Not eligible',
  Consent: 'Needs consent',
  Refused: 'Has refusal',
  Triage: 'Needs triage',
  Due: 'Due vaccination',
  Deferred: 'Could not vaccinate',
  PartiallyVaccinated: 'Partially vaccinated',
  Vaccinated: 'Fully vaccinated'
}

/**
 * @readonly
 * @enum {string}
 */
export const PatientConsentStatus = {
  NotScheduled: 'No request',
  Scheduled: 'Request scheduled',
  Failed: 'Request failed',
  NoResponse: 'No response',
  FollowUp: 'Follow-up requested'
}

/**
 * @readonly
 * @enum {string}
 */
export const PatientRefusedStatus = {
  Conflict: 'Consent conflict',
  Refusal: 'Consent refused'
}

/**
 * @readonly
 * @enum {string}
 */
export const PatientDeferredStatus = {
  Contraindicated: 'Contraindicated',
  DelayVaccination: 'Vaccination delayed',
  ChildAbsent: 'Child absent',
  ChildContraindicated: 'Child contraindicated',
  ChildRefused: 'Child refused',
  ChildUnwell: 'Child unwell'
}

/**
 * @readonly
 * @enum {string}
 */
export const PatientVaccinatedStatus = {
  Vaccinated: 'Vaccinated',
  AlreadyVaccinated: 'Already vaccinated'
}

/**
 * @readonly
 * @enum {string}
 */
export const PreScreenQuestion = {
  IsWell: 'is not acutely unwell',
  IsPregnant: 'is not pregnant',
  IsMedicated: 'is not taking any medication which prevents vaccination',
  IsAsthmatic:
    'if they have asthma, has not had a flare-up of symptoms in the past 72 hours, including wheezing or needing to use a reliever inhaler more than usual',
  IsHappy: 'knows what the vaccination is for, and agrees to have it',
  IsNotContraindicated:
    'has no other contraindications which prevent vaccination'
}

/**
 * @readonly
 * @enum {string}
 */
export const ProgrammeType = {
  Flu: 'Flu',
  HPV: 'HPV',
  TdIPV: 'Td/IPV',
  MenACWY: 'MenACWY',
  MMR: 'MMR'
}

/**
 * @readonly
 * @enum {string}
 */
export const SchoolTerm = {
  Autumn: 'Autumn',
  Spring: 'Spring',
  Summer: 'Summer'
}

/**
 * @readonly
 * @enum {object}
 */
export const ProgrammePreset = {
  SeasonalFlu: {
    name: 'Flu',
    active: true,
    programmeTypes: [ProgrammeType.Flu],
    term: SchoolTerm.Autumn
  },
  HPV: {
    name: 'HPV',
    active: true,
    adolescent: true,
    programmeTypes: [ProgrammeType.HPV],
    term: SchoolTerm.Spring
  },
  Doubles: {
    name: 'MenACWY & Td/IPV',
    active: true,
    adolescent: true,
    programmeTypes: [ProgrammeType.MenACWY, ProgrammeType.TdIPV],
    term: SchoolTerm.Summer
  },
  MMR: {
    name: 'MMR',
    active: true,
    programmeTypes: [ProgrammeType.MMR],
    term: SchoolTerm.Spring
  }
}

/**
 * @readonly
 * @enum {string}
 */
export const RecordVaccineCriteria = {
  Any: 'Either',
  AlternativeInjectionOnly: 'Alternative injection',
  IntranasalOnly: 'Nasal spray'
}

/**
 * @readonly
 * @enum {string}
 */
export const RegistrationOutcome = {
  Pending: 'Not registered yet',
  Present: 'Attending session',
  Absent: 'Absent from session',
  Complete: 'Completed session'
}

/**
 * @readonly
 * @enum {string}
 */
export const ReplyDecision = {
  NoResponse: 'No response',
  Given: 'Consent given',
  OnlyAlternativeInjection: 'Consent given for flu injection',
  OnlyMenACWY: 'Consent given for MenACWY only',
  OnlyTdIPV: 'Consent given for Td/IPV only',
  Declined: 'Follow up requested',
  Refused: 'Consent refused'
}

/**
 * @readonly
 * @enum {string}
 */
export const ReplyMethod = {
  Website: 'Online',
  Phone: 'By phone',
  Paper: 'Paper form',
  InPerson: 'In person'
}

/**
 * @readonly
 * @enum {string}
 */
export const ReplyRefusal = {
  Gelatine: 'Vaccine contains gelatine',
  AlreadyGiven: 'Vaccine already received',
  GettingElsewhere: 'Vaccine will be given elsewhere',
  Medical: 'Medical reasons',
  OutsideSchool: 'Don’t want vaccination in school',
  Personal: 'Personal choice',
  Other: 'Other'
}

/**
 * @readonly
 * @enum {string}
 */
export const SchoolPhase = {
  Primary: 'Primary',
  Secondary: 'Secondary'
}

/**
 * @readonly
 * @enum {string}
 */
export const ScreenVaccineCriteria = {
  AlternativeInjection: 'The parent has consented to the injected vaccine only',
  Either:
    'The parent has consented to the injected vaccine being offered if the nasal spray is not suitable',
  Intranasal: 'The parent has consented to the nasal spray only'
}

/**
 * @readonly
 * @enum {string}
 */
export const ScreenOutcome = {
  Vaccinate: 'Safe to vaccinate',
  VaccinateAlternativeInjection:
    'Safe to vaccinate with gelatine-free injection',
  VaccinateIntranasal: 'Safe to vaccinate with nasal spray',
  NeedsTriage: 'Needs triage',
  DelayVaccination: 'Delay vaccination',
  DoNotVaccinate: 'Do not vaccinate'
}

/**
 * @readonly
 * @enum {string}
 */
export const SessionStatus = {
  Unplanned: 'No sessions scheduled',
  Planned: 'Scheduled session dates',
  Completed: 'All session dates completed',
  Closed: 'Closed'
}

/**
 * @readonly
 * @enum {string}
 */
export const SessionType = {
  School: 'School session',
  Clinic: 'Community clinic'
}

/**
 * @readonly
 * @enum {string}
 */
export const UploadType = {
  Cohort: 'Child records',
  School: 'Class list records',
  Report: 'Vaccination records'
}

/**
 * @readonly
 * @enum {string}
 */
export const UploadStatus = {
  Approved: 'Approved',
  Devoid: 'No new records',
  Failed: 'Failed',
  Invalid: 'Invalid',
  Processing: 'Processing',
  Review: 'Needs review'
}

/**
 * @readonly
 * @enum {string}
 */
export const UserRole = {
  Nurse: 'Nurse',
  NursePrescriber: 'Prescribing nurse',
  Pharmacist: 'Pharmacist',
  HCA: 'Healthcare assistant',
  MedicalSecretary: 'Medical secretary',
  DataConsumer: 'Data consumer'
}

/**
 * @readonly
 * @enum {string}
 */
export const VaccinationOutcome = {
  Vaccinated: 'Vaccinated',
  PartVaccinated: 'Partially vaccinated',
  AlreadyVaccinated: 'Already had the vaccine',
  Contraindications: 'Child contraindicated',
  Refused: 'Child refused',
  Absent: 'Child absent',
  Unwell: 'Child unwell'
}

/**
 * @readonly
 * @enum {string}
 */
export const VaccinationMethod = {
  Intranasal: 'Nasal spray',
  Intramuscular: 'Intramuscular (IM) injection',
  Subcutaneous: 'Subcutaneous injection'
}

/**
 * @readonly
 * @enum {string}
 */
export const VaccinationSite = {
  Nose: 'Nose',
  ArmLeftUpper: 'Left arm (upper position)',
  ArmLeftLower: 'Left arm (lower position)',
  ArmRightUpper: 'Right arm (upper position)',
  ArmRightLower: 'Right arm (lower position)',
  ThighLeft: 'Left thigh',
  ThighRight: 'Right thigh',
  Other: 'Other'
}

/**
 * @readonly
 * @enum {string}
 */
export const VaccinationProtocol = {
  PGD: 'Patient Group Direction (PGD)',
  PSD: 'Patient Specific Direction (PSD)',
  National: 'National protocol'
}

/**
 * @readonly
 * @enum {string}
 */
export const VaccinationSyncStatus = {
  CannotSync: 'Cannot sync',
  NotSynced: 'Not synced',
  Pending: 'Pending',
  Synced: 'Synced',
  Failed: 'Failed'
}

/**
 * @readonly
 * @enum {string}
 */
export const VaccineCriteria = {
  AlternativeInjection: 'Gelatine-free injection',
  Injection: 'Injection',
  Intranasal: 'Nasal spray'
}

/**
 * @readonly
 * @enum {string}
 */
export const VaccineMethod = {
  Injection: 'Injection',
  Intranasal: 'Nasal spray'
}

/**
 * @readonly
 * @enum {string}
 */
export const VaccineSideEffect = {
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
