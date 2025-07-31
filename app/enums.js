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
export const Activity = {
  Consent: 'Get consent',
  Triage: 'Triage health questions',
  Register: 'Register attendance',
  Record: 'Record vaccination',
  DoNotRecord: 'Do not vaccinate',
  Report: 'Report vaccination'
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
  GivenForInjection: 'Consent given for injected vaccine',
  GivenForNasalSpray: 'Consent given for nasal spray',
  Declined: 'Follow up requested',
  Refused: 'Consent refused',
  FinalRefusal: 'Refusal confirmed'
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
  Hidden: 'Hidden',
  Invalid: 'Invalid',
  Sensitive: 'Sensitive',
  GillickNoNotify: 'Gillick no notify'
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
export const PatientOutcome = {
  Vaccinated: 'Vaccinated',
  CouldNotVaccinate: 'Could not vaccinate',
  NoOutcomeYet: 'No outcome yet'
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
  IsAllergic: 'has no allergies which would prevent vaccination',
  IsVaccinated: 'has not already had this vaccination',
  IsHappy: 'knows what the vaccination is for, and is happy to have it'
}

/**
 * @readonly
 * @enum {string}
 */
export const ProgrammeStatus = {
  Planned: 'Planned',
  Current: 'Current',
  Completed: 'Completed'
}

/**
 * @readonly
 * @enum {string}
 */
export const ProgrammeType = {
  Flu: 'Flu',
  HPV: 'HPV',
  TdIPV: 'Td/IPV',
  MenACWY: 'MenACWY'
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
    primaryProgrammeTypes: [ProgrammeType.Flu],
    term: SchoolTerm.Autumn
  },
  HPV: {
    name: 'HPV',
    active: false,
    adolescent: true,
    primaryProgrammeTypes: [ProgrammeType.HPV],
    term: SchoolTerm.Spring
  },
  Doubles: {
    name: 'MenACWY & Td/IPV',
    active: false,
    adolescent: true,
    primaryProgrammeTypes: [ProgrammeType.MenACWY, ProgrammeType.TdIPV],
    catchupProgrammeTypes: [ProgrammeType.HPV],
    term: SchoolTerm.Summer
  }
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
  OnlyFluInjection: 'Consent given for flu injection',
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
export const ScreenVaccinationMethod = {
  NasalOnly: 'The parent has consented to the nasal spray only',
  InjectionOnly: 'The parent has consented to the injected vaccine only',
  NasalOrInjection:
    'The parent has consented to the injected vaccine being offered if the nasal spray is not suitable'
}

/**
 * @readonly
 * @enum {string}
 */
export const ScreenOutcome = {
  Vaccinate: 'Safe to vaccinate',
  VaccinateInjection: 'Safe to vaccinate with injected vaccine',
  VaccinateNasal: 'Safe to vaccinate with nasal spray',
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
  Planned: 'Sessions scheduled',
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
export const TriageOutcome = {
  Needed: 'Triage needed',
  Completed: 'Triage completed',
  NotNeeded: 'No triage needed'
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
  Processing: 'Processing',
  Complete: 'Completed',
  Invalid: 'Invalid'
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
  Contraindications: 'Had contraindications',
  Refused: 'Refused vaccine',
  Absent: 'Absent from the session',
  Unwell: 'Unwell',
  NoConsent: 'Unable to contact parent',
  LateConsent: 'Consent received too late'
}

/**
 * @readonly
 * @enum {string}
 */
export const VaccinationMethod = {
  Nasal: 'Nasal spray',
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
export const VaccineMethod = {
  Nasal: 'Nasal spray',
  Injection: 'Injection'
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
