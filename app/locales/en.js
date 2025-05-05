import {
  Activity,
  ConsentOutcome,
  PatientOutcome,
  ScreenOutcome,
  TriageOutcome
} from '../models/patient-session.js'
import { ProgrammeType } from '../models/programme.js'
import { ReplyDecision, ReplyRefusal } from '../models/reply.js'
import { RegistrationOutcome } from '../models/session.js'

/**
 * @returns {import("i18n").LocaleCatalog}
 */
export const en = {
  actions: {
    label: 'Actions',
    change: 'Change',
    remove: 'Remove',
    review: 'Review',
    update: 'Update',
    archive: 'Archive'
  },
  address: {
    label: 'Address',
    addressLine1: {
      label: 'Address line 1'
    },
    addressLine2: {
      label: 'Address line 2'
    },
    addressLevel1: {
      label: 'Town or city'
    },
    postalCode: {
      label: 'Postcode'
    }
  },
  form: {
    confirm: 'Save changes',
    continue: 'Continue'
  },
  error: {
    title: 'There is a problem'
  },
  account: {
    'change-role': {
      title: 'Select a role',
      label: 'Change role'
    },
    'reset-password': {
      title: 'Reset your password',
      confirm: 'Reset password'
    },
    'sign-in': {
      title: 'Log in',
      confirm: 'Log in'
    },
    'sign-out': {
      title: 'Log out'
    },
    password: {
      forgot: 'I’ve forgotten my password',
      label: 'Password'
    },
    email: {
      label: 'Email address'
    },
    cis2: {
      unlock: 'I need to unlock my smartcard',
      method: {
        label: 'Select your login method',
        smartcard: 'Smartcard',
        hello: 'Windows Hello',
        key: 'Security key',
        ipad: 'iPad app',
        authenticator: 'Authenticator app',
        nhsMail: 'NHSmail',
        passkey: 'Passkey (private beta)'
      },
      terms: {
        heading: 'Agree to our terms of use',
        description:
          'By continuing, you agree to our [terms and conditions](https://digital.nhs.uk/services/care-identity-service/registration-authority-users/registration-authority-help/privacy-notice#terms-and-conditions)'
      },
      remember: {
        label: 'Remember my selection',
        hint: 'Do not check this box if you are on a shared computer'
      }
    },
    permissions: {
      org: {
        title: 'Your organisation is not using this service yet',
        description: '{{ra}} is not currently set up to use Mavis.'
      },
      user: {
        title: 'You do not have permission to use this service'
      }
    }
  },
  batch: {
    new: {
      label: 'Add a new batch',
      title: 'Add batch',
      confirm: 'Add batch',
      success: 'Batch {{batch.id}} added'
    },
    edit: {
      title: 'Edit batch {{batch.id}}',
      confirm: 'Save changes',
      success: 'Batch {{batch.id}} updated'
    },
    action: {
      title: 'Are you sure you want to %s this batch?',
      description: 'This operation cannot be undone.',
      cancel: 'No, return to vaccines',
      confirm: 'Yes, %s this batch'
    },
    archive: {
      success: 'Batch {{batch.id}} archived'
    },
    createdAt: {
      label: 'Entered date'
    },
    updatedAt: {
      label: 'Updated date'
    },
    expiry: {
      label: 'Expiry date',
      hint: 'For example, 27 10 2025'
    },
    id: {
      label: 'Batch ID'
    }
  },
  capture: {
    [Activity.Register]: {
      label: 'Register',
      count: {
        one: '%s child still to register',
        other: '[0] No children still to register|%s children still to register'
      }
    },
    [Activity.Consent]: {
      label: 'Get consent',
      count: {
        one: '%s child need consent',
        other: '[0] No children need consent|%s children need consent'
      }
    },
    [Activity.Triage]: {
      label: 'Triage',
      count: {
        one: '%s child needing triage',
        other: '[0] No children needing triage|%s children needing triage'
      }
    },
    [Activity.Record]: {
      label: 'Vaccinate',
      count: {
        one: '%s child ready to vaccinate',
        other:
          '[0] No children ready to vaccinate|%s children ready to vaccinate'
      }
    }
  },
  clinic: {
    new: {
      title: 'Add a new clinic',
      confirm: 'Add clinic',
      success: '{{clinic.name}} created'
    },
    edit: {
      label: 'Edit',
      title: 'Edit clinic',
      confirm: 'Save changes',
      success: '{{clinic.name}} updated'
    },
    action: {
      title: 'Are you sure you want to %s this clinic?',
      description: 'This operation cannot be undone.',
      confirm: 'Yes, %s this clinic',
      cancel: 'No, return to clinics'
    },
    delete: {
      label: 'Delete',
      success: 'Clinic deleted'
    },
    name: {
      label: 'Name'
    },
    address: {
      label: 'Address'
    },
    count: {
      one: '%s clinic',
      other: '[0] No clinics|%s clinics'
    }
  },
  cohort: {
    label: 'Cohorts',
    list: {
      title: 'All cohorts'
    },
    upload: {
      label: 'Import child records'
    },
    unselect: {
      confirm: 'Remove from cohort',
      success: '{{patient.fullName}} removed from {{cohort.name}} cohort'
    },
    patients: {
      count: {
        one: '%s child',
        other: '[0] No children|%s children'
      }
    },
    yearGroup: {
      label: 'Year group'
    },
    count: {
      one: '%s cohort',
      other: '[0] No cohorts|%s cohorts'
    },
    name: {
      label: 'Name'
    }
  },
  child: {
    label: 'Child',
    nhsn: {
      label: 'NHS number'
    },
    fullName: {
      label: 'Full name'
    },
    preferredFirstName: {
      label: 'Preferred first name'
    },
    preferredLastName: {
      label: 'Preferred last name'
    },
    preferredName: {
      label: 'Preferred name'
    },
    fullAndPreferredNames: {
      label: 'Name'
    },
    dob: {
      label: 'Date of birth'
    },
    dobWithAge: {
      label: 'Date of birth'
    },
    gender: {
      label: 'Gender'
    },
    address: {
      label: 'Home address'
    },
    postalCode: {
      label: 'Postcode'
    },
    school: {
      label: 'School'
    },
    gpSurgery: {
      label: 'GP surgery'
    },
    parent: {
      label: 'Parent'
    }
  },
  consent: {
    label: 'Consent response',
    count: {
      one: '%s unmatched consent response',
      other: '[0] No unmatched consent responses|%s unmatched consent responses'
    },
    warning: {
      text: {
        one: '%s unmatched consent response for this session needs review',
        other: '%s unmatched consent responses for this session need review'
      }
    },
    results:
      '{count, plural, =0{No responses matching your search criteria were found} one{Showing <b>{from}</b> to <b>{to}</b> of <b>{count}</b> response} other{Showing <b>{from}</b> to <b>{to}</b> of <b>{count}</b> responses}}',
    [ConsentOutcome.NoResponse]: {
      label: 'No response',
      title: 'No response',
      count: {
        one: '%s child without a response',
        other:
          '[0] No children without a response|%s children without a response'
      }
    },
    [ConsentOutcome.NoRequest]: {
      label: 'Request failed',
      title: 'Request failed',
      count: {
        one: '%s child whose request failed',
        other:
          '[0] No children whose request failed|%s children whose request failed'
      }
    },
    [ConsentOutcome.Inconsistent]: {
      label: 'Conflicts',
      title: 'Conflicting consent',
      count: {
        one: '%s child with conflicting consent',
        other:
          '[0] No children with conflicting consent|%s children with conflicting consent'
      }
    },
    [ConsentOutcome.Given]: {
      label: 'Consent given',
      title: 'Ready for vaccinator',
      count: {
        one: '%s child with consent given',
        other:
          '[0] No children with consent given|%s children with consent given'
      }
    },
    [ConsentOutcome.Refused]: {
      label: 'Refused',
      title: 'Consent refused',
      count: {
        one: '%s child with consent refused',
        other:
          '[0] No children with consent refused|%s children with consent refused'
      }
    },
    [ConsentOutcome.FinalRefusal]: {
      label: 'Refusal confirmed',
      title: 'Refusal confirmed',
      count: {
        one: '%s child with no consent response',
        other:
          '[0] No children with no consent response|%s children with no consent response'
      }
    },
    list: {
      label: 'Unmatched responses',
      title: 'Unmatched consent responses',
      description:
        'Review incoming consent responses that can’t be automatically matched'
    },
    show: {
      title: 'Consent response from %s'
    },
    match: {
      label: 'Match',
      title: 'Search for a child record to match with {{child.fullName}}',
      caption: 'Consent response from {{parent.formatted.fullName}}'
    },
    link: {
      title: 'Link consent response with child record?',
      caption: 'Consent response from {{parent.fullName}}',
      summary: 'Compare child details',
      confirm: 'Link response with record',
      success:
        'Consent response from {{consent.parent.fullName}} linked to [{{patient.fullName}}]({{patient.uri}})’s record'
    },
    add: {
      label: 'Create new record',
      title: 'Create a new child record from this consent response?',
      caption: 'Consent response from {{parent.fullName}}',
      confirm: 'Create a new record from response',
      success:
        '[{{patient.fullName}}]({{patient.uri}})’s record created from a consent response from {{consent.parent.fullName}}'
    },
    invalidate: {
      label: 'Archive',
      caption: 'Consent response from {{consent.fullName}}',
      title: 'Archive response',
      description:
        'The unmatched response will be hidden. This operation cannot be undone.',
      confirm: 'Archive response',
      success: 'Consent response from {{consent.fullName}} archived'
    },
    start: {
      title: {
        single: 'Give or refuse consent for a %s',
        multiple: 'Give or refuse consent for the %s'
      },
      more: `Find out more about the {{programme.name}} vaccine`,
      confirm: {
        title: 'Give or refuse consent',
        buttonText: 'Start now'
      },
      otherMethods: {
        title: 'Other ways to give consent',
        description:
          'The quickest way to give or refuse consent is online, using this service. This will take less than 5 minutes.\n\nIf you cannot use the service, you can respond over the phone using the number given in the consent request you got by email.'
      }
    },
    closed: {
      title: 'You can no longer submit a consent response',
      description:
        'The deadline for responding has passed.\n\n## You can still book a clinic appointment\n\nContact {{organisation.email}} to book a clinic appointment.'
    },
    new: {
      'check-answers': {
        confirm: 'Confirm',
        title: 'Check and confirm'
      }
    },
    createdAt: {
      label: 'Response date'
    },
    child: {
      title: 'What is your child’s name?',
      label: 'Child',
      summary: 'About your child',
      description:
        'Give the name on your child’s birth certificate. If it’s changed, give the name held by your child’s GP.',
      firstName: {
        label: 'First name',
        hint: 'Or given name'
      },
      lastName: {
        label: 'Last name',
        hint: 'Or family name'
      },
      hasPreferredName: {
        label: 'Do they use a different name in school?',
        yes: 'Yes',
        no: 'No'
      },
      preferredFirstName: {
        label: 'Preferred first name'
      },
      preferredLastName: {
        label: 'Preferred last name'
      },
      fullAndPreferredNames: {
        label: 'Child’s name'
      },
      gpSurgery: {
        label: 'Name of GP surgery'
      },
      dob: {
        title: 'What is your child’s date of birth?',
        label: 'Child’s date of birth',
        hint: 'For example, 27 3 2012'
      },
      'confirm-school': {
        title: 'Confirm your child’s school',
        label: 'Is this their school?',
        yes: 'Yes, they go to this school',
        no: 'No, they go to a different school'
      },
      'home-schooled': {
        title: 'Is your child home-schooled?',
        yes: 'Yes',
        no: 'No, they go to a school'
      },
      school: {
        title: 'What school does your child go to?',
        label: 'Select a school',
        description:
          'You can only use this service if your child’s school is listed here. If it’s not, contact {{organisation.email}}. If you’ve moved recently, it’s important to mention this.'
      },
      address: {
        title: 'Home address',
        label: 'Child’s home address',
        hint: 'Give the child’s primary address. We use this to confirm their identity.'
      }
    },
    parent: {
      summary: 'About you',
      title: 'About you',
      label: 'Parent',
      fullName: {
        label: 'Full name'
      },
      relationship: {
        label: 'Relationship to child'
      },
      notify: {
        label: 'Send notifications'
      },
      email: {
        label: 'Email address',
        hint: 'We will use this to send you confirmation messages'
      },
      tel: {
        label: 'Phone number',
        hint: 'Someone from the vaccinations team might call you if they have questions'
      },
      sms: {
        label: "Tick this box if you'd like to get updates by text message"
      },
      contactPreference: {
        title: 'If we need to contact you',
        label: 'Do you have any communication needs?',
        yes: 'Yes',
        no: 'No',
        description:
          'Let us know if you have any communication needs you’d like us to be aware of – for example, a hearing or visual impairment.'
      },
      contactPreferenceDetails: {
        label: 'Give details'
      },
      relationshipOther: {
        label: 'Relationship to the child',
        hint: 'For example, carer'
      },
      hasParentalResponsibility: {
        label: 'Do you have parental responsibility?',
        hint: 'This means you have legal rights and duties relating to the child'
      }
    },
    programme: {
      label: 'Programme'
    },
    decision: {
      summary: 'Consent for the {{session.vaccination}}',
      title:
        'Do you agree to your child having the {{session.vaccinationTitle}}?',
      label: 'Decision',
      hint: {
        Flu: 'The nasal flu spray contains gelatine which comes from pigs.'
      },
      yes: {
        single: 'Yes, I agree',
        double: 'Yes, I agree to them having both vaccinations',
        multiple: 'Yes, I agree to them having all vaccinations'
      },
      some: {
        double: 'I agree to them having one of the vaccinations',
        multiple: 'I agree to them having some of the vaccinations'
      },
      no: 'No'
    },
    consultation: {
      title: {
        one: 'Your child may be able to have the vaccination outside of school',
        other:
          'Your child may be able to have the vaccinations outside of school'
      },
      description: {
        one: 'For example, they may be able to have the vaccination in a clinic.',
        other:
          'For example, they may be able to have the vaccinations in a clinic.'
      },
      label: 'Discuss options',
      legend:
        'Would you like a member of the team to contact you to discuss your options?',
      yes: 'Yes, I’m happy for someone to contact me',
      no: 'No'
    },
    refusalReason: {
      title: 'Please tell us why you do not agree to your child having the %s',
      label: 'Refusal reason',
      alreadyGiven: {
        one: ReplyRefusal.AlreadyGiven,
        other: ReplyRefusal.AlreadyGiven.replace('Vaccine', 'Vaccines')
      },
      gettingElsewhere: {
        one: ReplyRefusal.GettingElsewhere,
        other: ReplyRefusal.GettingElsewhere.replace('Vaccine', 'Vaccines')
      }
    },
    refusalReasonDetails: {
      label: 'Refusal details',
      title: {
        [ReplyRefusal.AlreadyGiven]:
          'Where did the child get their vaccination?',
        [ReplyRefusal.GettingElsewhere]:
          'Where will the child get their vaccination?',
        [ReplyRefusal.Medical]:
          'What medical reasons prevent the child from being vaccinated?'
      }
    },
    healthAnswers: {
      label: 'Answers to health questions',
      yes: 'Yes',
      no: 'No',
      details: 'Give details',
      hint: {
        Allergy: false,
        Aspirin: 'Also known as Salicylate therapy',
        Asthma: false,
        AsthmaSteroids: 'Include the steroid name, dose and length of course',
        AsthmaAdmitted: false,
        Bleeding: false,
        EggAllergy: false,
        ImmuneSystem: false,
        Immunosuppressant: false,
        HouseholdImmuneSystem: false,
        PreviousReaction: false,
        MedicalConditions: false,
        MedicationAllergies: false,
        RecentFluVaccination: false,
        RecentMenAcwyVaccination:
          'It’s usually given once in Year 9 or 10. Some children may have had it before travelling abroad.',
        RecentTdIpvVaccination:
          'Most children will not have had this vaccination since their 4-in-1 pre-school booster',
        Support: 'For example, they’re autistic, or extremely anxious'
      }
    },
    note: {
      label: 'Notes'
    },
    summary: {
      label: 'Response'
    },
    confirmation: {
      title: {
        [ReplyDecision.Given]: 'Consent confirmed',
        [ReplyDecision.OnlyMenACWY]:
          'Consent for the MenACWY vaccination confirmed',
        [ReplyDecision.OnlyTdIPV]:
          'Consent for the Td/IPV vaccination confirmed',
        [ReplyDecision.Refused]: 'Refusal confirmed'
      },
      text: {
        [ReplyDecision.Given]:
          '{{consent.child.fullName}} is due to get the {{session.vaccination}} at school on {{session.summary.datesDisjunction}}',
        [ReplyDecision.OnlyMenACWY]:
          '{{consent.child.fullName}} is due to get the MenACWY vaccination at school on {{session.summary.datesDisjunction}}',
        [ReplyDecision.OnlyTdIPV]:
          '{{consent.child.fullName}} is due to get the Td/IPV vaccination at school on {{session.summary.datesDisjunction}}',
        [ReplyDecision.Refused]:
          'You’ve told us that you do not want {{consent.child.fullName}} to get the {{session.vaccination}} at school'
      },
      triage: {
        // TODO: Parent may have given consent for two vaccinations for doubles
        // so text should say either ‘vaccination is’ or ‘vaccinations are’
        [ReplyDecision.Given]:
          'As you answered ‘yes’ to one or more of the health questions, we need to check the {{session.vaccination}} is suitable for {{consent.child.fullName}}. We’ll review your answers and get in touch again soon.',
        [ReplyDecision.OnlyMenACWY]:
          'As you answered ‘yes’ to one or more of the health questions, we need to check the MenACWY vaccination is suitable for {{consent.child.fullName}}. We’ll review your answers and get in touch again soon.',
        [ReplyDecision.OnlyTdIPV]:
          'As you answered ‘yes’ to one or more of the health questions, we need to check the Td/IPV vaccination is suitable for {{consent.child.fullName}}. We’ll review your answers and get in touch again soon.'
      },
      description: 'We’ve sent a confirmation to <{{consent.parent.email}}>.'
    },
    actions: {
      label: 'Actions'
    }
  },
  download: {
    new: {
      label: 'Download vaccination report',
      'check-answers': {
        confirm: 'Download vaccination report',
        title: 'Check and confirm',
        summary: 'Requested download'
      }
    },
    dates: {
      title: 'Select a vaccination date range'
    },
    startAt: {
      label: 'From',
      hint: 'For example, 27 10 2024'
    },
    endAt: {
      label: 'Until',
      hint: 'For example, 27 10 2025'
    },
    format: {
      title: 'Select file format',
      label: 'File format'
    },
    organisations: {
      title: 'Select providers',
      label: 'Providers'
    },
    vaccinations: {
      label: 'Records'
    }
  },
  emails: {
    consent: {
      invite: {
        label: 'Invitation',
        name: 'Vaccinations on {{session.summary.dates}}'
      },
      'invite-catch-up': {
        label: 'Invitation (catch-up)',
        name: 'Vaccinations on {{session.summary.dates}}'
      },
      'invite-reminder': {
        label: 'Reminder',
        name: 'Please respond to our request for consent by {{session.formatted.firstDate}}'
      },
      'invite-subsequent-reminder': {
        label: 'Subsequent reminder',
        name: 'There’s still time for your child to be vaccinated against {{session.immunisation}}'
      },
      'invite-clinic': {
        label: 'Clinic booking',
        name: 'Booking a clinic appointment for your child’s {{session.vaccination}}'
      },
      'invite-clinic-reminder': {
        label: 'Clinic booking reminder',
        name: 'Your child can still get their {{session.vaccination}} at a clinic'
      },
      'invite-clinic-consent': {
        label: 'Clinic invitation',
        name: 'We still need consent for your child’s {{session.vaccination}}'
      },
      'consent-given': {
        label: 'Consent given',
        name: '{{session.vaccinationTitle}} on {{session.summary.dates}}'
      },
      'consent-given-changed-school': {
        label: 'Consent given (changed school)',
        name: 'Your child’s {{session.vaccination}}'
      },
      'consent-conflicts': {
        label: 'Consent conflicts',
        name: 'Your child will not have their {{session.vaccination}}'
      },
      'consent-refused': {
        label: 'Consent refused',
        name: '{{session.vaccinationTitle}} on {{session.summary.dates}}'
      },
      'consent-refused-injection': {
        label: 'Consent refused (flu injection)',
        name: '{{session.vaccinationTitle}} on {{session.summary.dates}}'
      },
      'consent-needs-triage': {
        label: 'Consent needs triage',
        name: '{{session.vaccinationTitle}} on {{session.summary.dates}}'
      },
      'triage-vaccinate': {
        label: 'Vaccinate',
        name: 'Your child can have the {{session.vaccination}} on {{session.summary.dates}}'
      },
      'triage-delay-vaccination': {
        label: 'Delay vaccination',
        name: 'Please book a clinic appointment for your child’s {{session.vaccination}}'
      },
      'triage-do-not-vaccinate': {
        label: 'Do not vaccinate',
        name: 'Your child will not have the {{session.vaccination}} in school'
      },
      'record-reminder': {
        label: 'Reminder',
        name: '{{consent.child.fullName}} will get their {{session.vaccination}} on {{session.summary.dates}}'
      },
      'record-vaccinated': {
        label: 'Vaccinated',
        name: 'Your child had their {{programme.name}} vaccination today'
      },
      'record-vaccinated-many': {
        label: 'Vaccinated (many)',
        name: 'Your child had their {{session.vaccination}} today'
      },
      'record-could-not-vaccinate': {
        label: 'Could not vaccinate',
        name: 'Your child did not have their {{session.vaccination}} today'
      },
      'information-child': {
        label: 'Information for students',
        name: 'You can get an {{session.vaccination}} on {{session.summary.dates}}'
      }
    }
  },
  event: {
    createdAt: {
      label: 'Date'
    },
    note: {
      label: 'Note'
    },
    outcome: {
      label: 'Outcome'
    }
  },
  healthAnswers: {
    label: 'All answers to health questions'
  },
  home: {
    show: {
      title: 'Home'
    }
  },
  notice: {
    label: 'Notice',
    list: {
      label: 'Notices',
      title: 'Important notices'
    },
    delete: {
      success: 'Notice archived'
    },
    count: {
      one: '%s notice',
      other: '[0] No notices|%s notices'
    },
    warning: {
      one: '%s important notice needs attention',
      other: '%s important notices need attention'
    },
    createdAt: {
      label: 'Date'
    },
    action: {
      title: 'Are you sure you want to %s the notice on this patient?',
      description: 'This operation cannot be undone.',
      confirm: 'Yes, %s this notice',
      cancel: 'No, return to notices'
    }
  },
  organisation: {
    show: {
      label: 'Your organisation',
      title: 'Your organisation',
      description: 'Manage your organisation’s settings'
    },
    edit: {
      success: 'Organisation settings updated'
    },
    contact: {
      title: 'Contact details',
      summary: 'Contact details'
    },
    clinics: {
      title: 'Clinics',
      summary: 'Clinics',
      new: {
        title: 'Add a new clinic'
      }
    },
    schools: {
      title: 'Schools',
      summary: 'Schools',
      new: {
        title: 'Add a new school'
      }
    },
    sessions: {
      title: 'Sessions',
      defaults: 'Session defaults',
      password: 'Shared password',
      text: 'You can change these values when scheduling new sessions.'
    },
    reminders: {
      title: 'Consent reminders'
    },
    name: {
      label: 'Name'
    },
    code: {
      label: 'ODC code'
    },
    tel: {
      label: 'Phone number'
    },
    email: {
      label: 'Email address'
    },
    privacyPolicyUrl: {
      label: 'Privacy policy',
      hint: 'Linked to from consent forms and consent request emails'
    },
    sessionOpenWeeks: {
      title: 'When should parents get a request to give consent?',
      label: 'Consent request',
      hint: 'Enter the number of weeks before the first session takes place'
    },
    sessionReminderWeeks: {
      title: 'When should parents get a reminder to give consent?',
      label: 'Consent reminders',
      hint: 'Enter the number of weeks before a session takes place'
    },
    password: {
      label: 'Shared password',
      title: 'Shared password',
      hint: 'Use this password to unlock offline vaccination spreadsheets. Don’t share it with anyone outside your team.'
    }
  },
  report: {
    label: 'Programme outcome',
    [PatientOutcome.NoOutcomeYet]: {
      title: 'No programme outcome yet',
      label: 'No programme yet',
      count: {
        one: '%s child without a programme outcome yet',
        other:
          '[0] No children without a programme outcome|%s children without a programme outcome yet'
      }
    },
    [PatientOutcome.Vaccinated]: {
      label: 'Vaccinated',
      title: 'Vaccinated',
      count: {
        one: '%s child vaccinated',
        other: '[0] No children vaccinated|%s children vaccinated'
      }
    },
    [PatientOutcome.CouldNotVaccinate]: {
      label: 'Not vaccinated',
      title: 'Do not vaccinate',
      count: {
        one: '%s child could not be vaccinated',
        other:
          '[0] No children could not be vaccinated|%s children could not be vaccinated'
      }
    }
  },
  parent: {
    label: 'Parent or guardian',
    fullName: {
      label: 'Name'
    },
    sms: {
      label: 'Get updates by text message',
      true: 'Yes',
      false: 'No'
    },
    relationship: {
      label: 'Relationship'
    },
    hasParentalResponsibility: {
      label: 'Parental responsibility',
      hint: 'They have the legal rights and duties relating to the child'
    },
    email: {
      label: 'Email address'
    },
    tel: {
      label: 'Phone number'
    },
    contactPreference: {
      label: 'Communication needs'
    },
    relationshipOther: {
      label: 'Give details',
      hint: 'For example, carer'
    },
    notify: {
      title:
        'Does the child want their parent or guardian to get confirmation of the vaccination?',
      label: 'Notify parent'
    }
  },
  patient: {
    label: 'Child record',
    list: {
      label: 'Children',
      title: 'Children',
      description:
        'Use this area to:\n- find child records\n- view child vaccinations'
    },
    show: {
      title: 'Child record'
    },
    edit: {
      title: 'Edit child record',
      summary: 'Child’s details',
      success: 'Child record updated'
    },
    events: {
      title: 'Activity log'
    },
    lastReminderDate: {
      label: 'Last reminder sent'
    },
    results:
      '{count, plural, =0{No children matching your search criteria were found} one{Showing <b>{from}</b> to <b>{to}</b> of <b>{count}</b> record} other{Showing <b>{from}</b> to <b>{to}</b> of <b>{count}</b> children}}',
    count: {
      one: '%s child',
      other: '[0] No children|%s children'
    },
    search: {
      label: 'Find children',
      dob: 'Child’s date of birth',
      hasMissingNhsNumber: 'Missing NHS number'
    },
    nhsn: {
      label: 'NHS number',
      title: 'What is the child’s NHS number?'
    },
    hasMissingNhsNumber: {
      label: 'Missing NHS number',
      count: {
        one: '%s record is without an NHS number',
        other:
          '[0] No records without an NHS number|%s records without an NHS number'
      }
    },
    fullNameAndNhsn: {
      label: 'Name and NHS number'
    },
    fullName: {
      label: 'Full name',
      title: 'What is the child’s name?'
    },
    firstName: {
      label: 'First name'
    },
    lastName: {
      label: 'Last name'
    },
    preferredNames: {
      label: 'Known as'
    },
    dob: {
      label: 'Date of birth',
      title: 'What is the child’s date of birth?',
      hint: 'For example, 27 3 2017'
    },
    dobWithAge: {
      label: 'Date of birth'
    },
    dod: {
      label: 'Date of death'
    },
    gender: {
      label: 'Gender',
      title: 'What is the child’s gender?'
    },
    address: {
      label: 'Address',
      title: 'What is the child’s home address?'
    },
    postalCode: {
      label: 'Postcode'
    },
    gpSurgery: {
      label: 'GP surgery',
      title: 'Who is the child’s GP?'
    },
    school: {
      label: 'School',
      title: 'What school does the child go to?'
    },
    yearGroup: {
      label: 'Year group'
    },
    yearGroupWithRegistration: {
      label: 'Year group'
    },
    parents: {
      label: 'Parents or guardians'
    },
    vaccinations: {
      label: 'Vaccinations'
    },
    parent: {
      label: 'Parent or guardian',
      fullName: {
        label: 'Name'
      },
      relationship: {
        label: 'Relationship to child'
      },
      notify: {
        label: 'Send notifications'
      },
      email: {
        label: 'Email address'
      },
      tel: {
        label: 'Phone number'
      },
      relationshipOther: {
        label: 'Relationship to the child',
        hint: 'For example, carer'
      }
    },
    parent1: {
      label: 'First parent or guardian',
      title: 'Details for first parent or guardian'
    },
    parent2: {
      label: 'Second parent or guardian',
      title: 'Details for second parent or guardian'
    },
    status: {
      label: 'Status'
    }
  },
  patientSession: {
    show: {
      title: 'Child record'
    },
    events: {
      title: 'Activity log',
      count: {
        one: '%s event',
        other: '[0] No events|%s events'
      }
    },
    consent: {
      title: 'Consent for %s',
      label: 'Consent status'
    },
    screen: {
      label: 'Triage status'
    },
    register: {
      label: 'Registration status'
    },
    outcome: {
      label: 'Session outcome'
    },
    report: {
      label: 'Programme outcome'
    },
    information: {
      label: 'Notes'
    },
    nextActivityPerProgramme: {
      label: 'Action required'
    },
    outstandingVaccinations: {
      message:
        '{count, plural, one{You still need to record an outcome for {names}} other{You still need to record outcomes for {names}}}'
    },
    gillick: {
      label: 'Gillick assessment',
      text: 'Before you make your assessment, you should give {{patient.firstName}} a chance to ask questions.',
      new: {
        title: 'Assess Gillick competence',
        confirm: 'Complete your assessment',
        success: 'Gillick assessment added'
      },
      edit: {
        title: 'Edit Gillick competence',
        confirm: 'Update your assessment',
        success: 'Gillick assessment updated'
      },
      q1: {
        label: 'The child knows which vaccination they will have'
      },
      q2: {
        label: 'The child knows which disease the vaccination protects against'
      },
      q3: {
        label: 'The child knows what could happen if they got the disease'
      },
      q4: {
        label: 'The child knows how the injection will be given'
      },
      q5: {
        label: 'The child knows which side effects they might experience'
      },
      note: {
        label: 'Assessment notes'
      }
    },
    invite: {
      label: 'Send consent request',
      success:
        'Consent request sent to {{parent.formatted.fullNameAndRelationship}}'
    },
    responses: {
      label: 'Consent responses'
    },
    preScreen: {
      label: 'Pre-screening checks',
      description: '{{patient.firstName}} has confirmed that they:',
      check: {
        error:
          'Select if the child has confirmed all pre-screening statements are true',
        label:
          '{{patient.firstName}} has confirmed the above statements are true'
      },
      ready: {
        error:
          'Select if the child is ready for their {{programme.name}} vaccination',
        label:
          'Is {{patient.firstName}} ready for their {{programme.name}} vaccination?',
        hint: 'Pre-screening checks must be completed for vaccination to go ahead',
        yes: 'Yes',
        no: 'No'
      },
      injectionSite: {
        error: 'Select an injection site',
        label: 'Where will the injection be given?'
      },
      confirm: 'Continue',
      note: {
        label: 'Pre-screening notes'
      }
    },
    vaccination: {
      title: 'Record as already vaccinated'
    },
    registration: {
      label: 'Is {{patient.fullName}} attending today’s session?',
      title: 'Update attendance',
      present: 'Yes, they are attending today’s session',
      absent: 'No, they are absent from today’s session',
      pending: 'They have not been registered yet',
      actions: {
        label: 'Attending?',
        present: {
          label: 'Attending',
          title: 'Register {{patient.fullName}} as attending'
        },
        absent: {
          label: 'Absent',
          title: 'Register {{patient.fullName}} as absent'
        }
      },
      success: {
        [RegistrationOutcome.Present]:
          '{{patientSession.patient.fullName}} is attending today’s session.',
        [RegistrationOutcome.Absent]:
          '{{patientSession.patient.fullName}} has been recorded as absent from today’s session.'
      }
    }
  },
  programme: {
    label: 'Programme',
    list: {
      label: 'Programmes',
      title: 'Programmes',
      description:
        'Use this area to:\n- organise vaccination sessions\n- report vaccinations'
    },
    show: {
      label: 'Overview',
      title: 'Overview'
    },
    cohorts: {
      label: 'Cohorts',
      title: 'Cohorts'
    },
    consentPdf: {
      label: 'Paper consent form'
    },
    patientSessions: {
      label: 'Children',
      title: 'Children',
      count: {
        one: '%s child',
        other: '[0] No children|%s children'
      }
    },
    sessions: {
      label: 'Sessions',
      title: 'Sessions',
      count: {
        one: '%s session organised',
        other: '[0] No sessions organised|%s sessions organised'
      }
    },
    vaccinations: {
      label: 'Vaccinations',
      title: 'Vaccinations',
      count: {
        one: '%s vaccination record',
        other: '[0] No vaccination records|%s vaccination records'
      }
    },
    name: {
      label: 'Programme'
    },
    type: {
      label: 'Programme type'
    },
    vaccines: {
      label: 'Vaccines given'
    }
  },
  record: {
    label: 'Child record',
    list: {
      title: 'Records',
      caption: 'Child Health Information Service'
    },
    show: {
      summary: 'Details'
    },
    results:
      '{count, plural, =0{No records matching your search criteria were found} one{Showing <b>{from}</b> to <b>{to}</b> of <b>{count}</b> record} other{Showing <b>{from}</b> to <b>{to}</b> of <b>{count}</b> records}}',
    count: {
      one: '%s record',
      other: '%s records'
    },
    nhsn: {
      label: 'NHS number'
    },
    fullName: {
      label: 'Full name'
    },
    dob: {
      label: 'Date of birth'
    },
    dod: {
      label: 'Date of death'
    },
    gender: {
      label: 'Gender'
    },
    address: {
      label: 'Address'
    },
    postalCode: {
      label: 'Postcode'
    },
    gpSurgery: {
      label: 'GP surgery'
    },
    school: {
      label: 'School'
    },
    yearGroup: {
      label: 'Year group'
    },
    parents: {
      label: 'Parents or guardians'
    },
    vaccinations: {
      label: 'Vaccinations'
    }
  },
  remind: {
    new: {
      title: 'Send reminder'
    }
  },
  reply: {
    label: 'Response',
    show: {
      title: 'Consent response from %s'
    },
    new: {
      title: 'Get verbal consent',
      'check-answers': {
        title: 'Check and confirm'
      },
      success: 'Consent response from {{reply.fullName}} added'
    },
    edit: {
      success: 'Consent response from {{reply.fullName}} updated'
    },
    'follow-up': {
      label: 'Follow up',
      caption: 'Consent response from {{reply.fullName}}',
      title: 'Follow up refusal',
      decision: {
        label: 'Does their original decision still stand?'
      }
    },
    invalidate: {
      label: 'Mark as invalid',
      caption: 'Consent response from {{reply.fullName}}',
      title: 'Mark response as invalid',
      description: 'This operation cannot be undone.',
      confirm: 'Mark response as invalid',
      success: 'Consent response from {{reply.fullName}} marked as invalid'
    },
    withdraw: {
      label: 'Withdraw consent',
      caption: 'Consent response from {{reply.fullName}}',
      title: 'Withdraw consent',
      confirm: 'Withdraw consent',
      success: 'Consent response from {{reply.fullName}} withdrawn'
    },
    createdAt: {
      label: 'Date'
    },
    createdBy: {
      label: 'Recorded by'
    },
    respondent: {
      title: 'Who are you trying to get consent from?',
      label: 'Parent or guardian',
      new: 'Add a new parental contact'
    },
    child: {
      label: 'Child'
    },
    parent: {
      title: {
        new: 'Details for parent or guardian',
        edit: 'Details for {{parent.formatted.fullNameAndRelationship}}'
      },
      label: 'Parent'
    },
    programme: {
      label: 'Programme',
      title: {
        Child: 'Which vaccination is the child giving consent for?',
        Parent: 'Which vaccination are they giving consent for?'
      }
    },
    method: {
      title: 'How was the response given?',
      label: 'Method'
    },
    decision: {
      label: 'Decision',
      title: {
        Child: 'Does the child agree to having the {{programme.name}} vaccine?',
        Parent:
          'Do they agree to {{patient.firstName}} having the {{programme.name}} vaccine?'
      }
    },
    invalid: {
      label: 'Invalid response'
    },
    healthAnswers: {
      label: 'Answers to health questions',
      title: 'Answers to health questions',
      details: 'Give details'
    },
    refusalReason: {
      label: 'Reason for refusal',
      title: 'Why do they not agree?'
    },
    refusalReasonOther: {
      label: 'Give details'
    },
    refusalReasonDetails: {
      label: 'Refusal details',
      title: {
        [ReplyRefusal.AlreadyGiven]:
          'Where did the child get their vaccination?',
        [ReplyRefusal.GettingElsewhere]:
          'Where will the child get their vaccination?',
        [ReplyRefusal.Medical]:
          'What medical reasons prevent the child from being vaccinated?'
      }
    },
    note: {
      title: 'Notes',
      label: 'Notes'
    },
    outcome: {
      title: 'Update consent response'
    },
    confirmed: {
      label: 'Confirm consent refusal?'
    }
  },
  school: {
    list: {
      title: 'Schools',
      caption: 'Local authority'
    },
    show: {
      summary: 'School details'
    },
    name: {
      label: 'Name'
    },
    phase: {
      label: 'Phase'
    },
    urn: {
      label: 'URN'
    },
    address: {
      label: 'Address'
    },
    count: {
      one: '%s school',
      other: '[0] No schools|%s schools'
    },
    primary: {
      count: {
        one: '%s primary school',
        other: '[0] No primary schools|%s primary schools'
      }
    },
    secondary: {
      count: {
        one: '%s secondary school',
        other: '[0] No secondary schools|%s secondary schools'
      }
    },
    records: {
      label: 'Children',
      count: {
        one: '%s child',
        other: '[0] No children|%s children'
      }
    }
  },
  search: {
    label: 'Search',
    options: 'Options',
    advanced: 'Advanced filters',
    results: 'Search results',
    confirm: 'Update results',
    clear: 'Clear filters'
  },
  session: {
    label: 'Sessions',
    count: {
      one: '%s session',
      other: '[0] No sessions|%s sessions'
    },
    show: {
      label: 'Overview',
      summary: 'Session overview'
    },
    edit: {
      title: 'Edit session',
      summary: 'Session details',
      programme: {
        title: 'Which programmes is this session part of?'
      },
      dates: {
        title: 'When will sessions be held?'
      },
      success: '{{session.name}} updated'
    },
    consent: {
      label: 'Consent',
      title: 'Review consent responses'
    },
    screen: {
      label: 'Triage',
      title: 'Review triage statuses'
    },
    register: {
      label: 'Register',
      title: 'Register attendance',
      information: 'You can register attendance when a session is in progress.'
    },
    record: {
      label: 'Record vaccinations',
      title: 'Record vaccinations',
      information: 'You can record vaccinations when a session is in progress.'
    },
    outcome: {
      label: 'Session outcomes',
      title: 'Review session outcomes'
    },
    report: {
      label: 'Programme outcome',
      title: 'Programme outcome'
    },
    'upload-class-list': {
      title: 'Import class lists'
    },
    list: {
      label: 'Sessions',
      title: 'Sessions',
      description:
        'Use this area to:\n- review consent responses\n- triage health records\n- record vaccinations\n- review session outcomes',
      active: {
        label: 'Today',
        count: {
          one: '%s session today',
          other: '[0] No sessions today|%s sessions today'
        }
      },
      completed: {
        label: 'Completed',
        count: {
          one: '%s location with all session dates completed',
          other:
            '[0] No locations with all session dates completed|%s locations with all session dates completed'
        }
      },
      planned: {
        label: 'Scheduled',
        count: {
          one: '%s location with sessions scheduled',
          other:
            '[0] No locations with sessions scheduled|%s locations with sessions scheduled'
        }
      },
      unplanned: {
        label: 'Unscheduled',
        count: {
          one: '%s location with no sessions scheduled',
          other:
            '[0] No locations with no sessions scheduled|%s locations with no sessions scheduled'
        }
      },
      closed: {
        label: 'Closed',
        count: {
          one: '%s location with closed sessions',
          other:
            '[0] No locations with closed sessions|%s locations with closed sessions'
        }
      }
    },
    consents: {
      label: 'Unmatched responses',
      warning: 'You need to review unmatched consent responses for this session'
    },
    address: {
      label: 'Address'
    },
    consentForms: {
      label: 'Consent forms'
    },
    consentWindow: {
      label: 'Consent period'
    },
    schedule: {
      title: 'Schedule sessions',
      description: 'Add dates for this school.'
    },
    patients: {
      label: 'Cohort',
      count: {
        one: '%s child in session cohort',
        other: '[0] No children in session cohort|%s children in session cohort'
      }
    },
    patientsRefused: {
      label: 'Consent refused'
    },
    patientsVaccinated: {
      label: 'Vaccinated'
    },
    patientsToGetConsent: {
      label: 'No consent response'
    },
    patientsToResolveConsent: {
      label: 'Conflicting consent'
    },
    patientsToTriage: {
      label: 'Triage needed'
    },
    patientsToRegister: {
      label: 'Register attendance'
    },
    patientsToRecord: {
      label: 'Ready for vaccinator'
    },
    activities: {
      label: 'Action required'
    },
    date: {
      label: 'Session date',
      hint: 'For example, 27 3 2024'
    },
    dates: {
      label: 'Session dates'
    },
    school: {
      label: 'School'
    },
    school_urn: {
      label: 'School URN'
    },
    location: {
      label: 'Location'
    },
    programmes: {
      label: 'Programmes'
    },
    status: {
      label: 'Status'
    },
    type: {
      label: 'Type'
    },
    consentUrl: {
      label: 'Online consent form'
    },
    details: {
      label: 'Details'
    },
    openAt: {
      title: 'When should parents get a request to give consent?',
      label: 'Consent requests',
      hint: 'For example, 27 3 2025'
    },
    reminderWeeks: {
      title: 'When should parents get a reminder to give consent?',
      label: 'Consent reminders',
      hint: 'Enter the number of weeks before a session takes place'
    },
    offline: {
      title: 'Record offline',
      description:
        'If the internet connection at the vaccination session is unreliable, you can record offline using a spreadsheet.\n\nYou need to download the blank spreadsheet ahead of the session while you still have internet access.\n\nTo upload a completed spreadsheet, go to the ‘Vaccinations’ area. You also need an internet connection to upload the spreadsheet.',
      confirm: 'Download spreadsheet',
      vaccinator: {
        label: 'Vaccinator',
        firstName: 'First name',
        lastName: 'Last name'
      }
    },
    close: {
      title: 'Close session',
      description:
        'All sessions for this school have been completed.\n\nWhen you close this session, the following children will be invited to community clinics:',
      confirm: 'Close session',
      success: '{{session.name}} has been closed'
    },
    closingSummary: {
      noConsentRequest: {
        count: {
          one: '%s child whose parents did not receive a consent request',
          other:
            '[0] No children whose parents did not receive a consent request|%s children whose parents did not receive a consent request'
        }
      },
      noConsentResponse: {
        count: {
          one: '%s child whose parents did not give a consent response',
          other:
            '[0] No children whose parents did not give a consent response|%s children whose parents did not give a consent response'
        }
      },
      couldNotVaccinate: {
        count: {
          one: '%s child who could not be vaccinated',
          other:
            '[0] No children who could not be vaccinated|%s children who could not be vaccinated'
        }
      }
    },
    defaultBatch: {
      label:
        'Change default batch<span class="nhsuk-u-visually-hidden"> for {{vaccine.brand}}</span> ',
      title: 'Select a default batch for this session',
      success: 'Default batch updated',
      count: {
        one: 'Default batch',
        other: 'Default batches'
      }
    }
  },
  texts: {
    consent: {
      invite: {
        label: 'Invitation',
        name: 'Inviting parent to give or refuse consent',
        text: 'Give or refuse consent for {{consent.child.fullName}} to have their {{session.vaccination}}:\n\n[https://give-or-refuse-consent.nhs.uk/{{session.id}}]({{session.consentUrl}}/start)\n\nYou need to do this by {{session.formatted.openAt}}.\n\nResponding will take less than 5 minutes.'
      },
      'invite-clinic': {
        label: 'Clinic booking',
        name: 'Inviting parent to book a clinic appointment',
        text: 'Our records show that {{consent.child.fullAndPreferredNames}} has not been vaccinated against {{session.immunisation}}.\n\nTo book this vaccination in a clinic, go to https://www.swiftqueue.co.uk/userlogin.php\n\nYou’ll need to register for a Swiftqueue account first.'
      },
      'invite-clinic-reminder': {
        label: 'Clinic booking reminder',
        name: 'Reminding parent to book a clinic appointment',
        text: "It’s not too late for {{consent.child.fullAndPreferredNames}} to get their {{session.vaccination}}.\n\nBook a clinic slot by going to https://www.swiftqueue.co.uk/userlogin.php\n\nYou'll need to register for a Swiftqueue account first."
      },
      'invite-clinic-consent': {
        label: 'Clinic invitation',
        name: 'Inviting parent to give consent for a clinic appointment',
        text: 'You recently booked a clinic appointment for {{consent.child.fullAndPreferredNames}}.\n\nPlease give consent for them to get the {{session.vaccination}} by going to https://give-or-refuse-consent.nhs.uk/{{session.id}}.'
      },
      'invite-reminder': {
        label: 'Reminder',
        name: 'Reminding parent to give or refuse consent',
        text: 'We recently asked for your consent to vaccinate your child against {{session.immunisation}}.\n\nGo to [https://give-or-refuse-consent.nhs.uk/{{session.id}}]({{session.consentUrl}}/start) to submit a response. This will take less than 5 minutes.'
      },
      'consent-given': {
        label: 'Consent given',
        name: 'Confirmation that consent has been given',
        text: 'You’ve given consent for {{consent.child.firstName}} to get their {{session.vaccination}} at school on {{session.summary.remainingDates}}. Please let them know what to expect.\n\nIf anything changes, phone {{organisation.tel}}.'
      },
      'consent-given-child': {
        label: 'Consent given (child)',
        name: 'Confirmation that consent has been given',
        text: 'Your parent or guardian has agreed for you to have the {{session.vaccination}} at school on {{session.summary.remainingDates}}.'
      },
      'consent-refused': {
        label: 'Consent refused',
        name: 'Confirmation that consent has been refused',
        text: 'You’ve refused to give consent for {{consent.child.fullName}} to have their {{session.vaccination}}.\n\nYou can give feedback about the ‘Give or refuse consent’ service by completing our short survey:\n\n<https://feedback.digital.nhs.uk/jfe/form/SV_3fICo6frMvUZX1k>\n\nYour feedback will help us improve the service.'
      },
      'record-reminder': {
        label: 'Reminder',
        name: 'Reminder (to go out the day before the vaccination)',
        text: '{{consent.child.firstName}} will get their {{session.vaccination}} at school tomorrow ({{session.formatted.nextDate}}). Please make sure they have breakfast and encourage them to wear a short-sleeved shirt.'
      },
      'record-reminder-child': {
        label: 'Reminder (child)',
        name: 'Reminder (to go out the day before the vaccination)',
        text: 'You’re due to get your {{session.vaccination}} at school tomorrow ({{session.formatted.nextDate}}). Please wear a short-sleeved shirt and make sure you eat something before the session.'
      },
      'record-vaccinated': {
        label: 'Vaccinated',
        name: 'Child has been vaccinated',
        text: '{{consent.child.firstName}} had their {{session.vaccination}} at school today. They might have some side effects, including bruising or itching at the injection site, a high temperature, nausea, or pain in the arms, hands, or fingers.\n\nIf you’re concerned, contact your GP in the usual way.'
      },
      'record-could-not-vaccinate': {
        label: 'Could not vaccinate',
        name: 'Child did not get their vaccination despite having consent',
        text: '{{consent.child.firstName}} did not have their {{session.vaccination}} at school today. This was because {{reason}}.\n\nIf you’d still like them to be vaccinated on a different date, contact our team by calling [{{organisation.tel}}](#), or email [{{organisation.email}}](#).'
      }
    }
  },
  triage: {
    title: 'Triage',
    label: 'Is it safe to vaccinate {{patient.firstName}}?',
    confirm: 'Save triage',
    edit: {
      title: 'Update triage outcome',
      success: 'Triage outcome updated'
    },
    note: {
      label: 'Triage notes'
    },
    outcome: {
      label: 'Outcome',
      [ScreenOutcome.Vaccinate]: 'Yes, it’s safe to vaccinate',
      [ScreenOutcome.DoNotVaccinate]: 'No, do not vaccinate',
      [ScreenOutcome.DelayVaccination]:
        'No, delay vaccination (and invite to clinic)',
      [ScreenOutcome.NeedsTriage]: 'No, keep in triage'
    },
    [TriageOutcome.Needed]: {
      label: 'Triage needed',
      count: {
        one: '%s child needing triage',
        other: '[0] No children needing triage|%s children needing triage'
      }
    },
    [TriageOutcome.Completed]: {
      label: 'Triage completed',
      count: {
        one: '%s child with triage completed',
        other:
          '[0] No children with triage completed|%s children with triage completed'
      }
    },
    [TriageOutcome.NotNeeded]: {
      label: 'No triage needed',
      count: {
        one: '%s child with no triage needed',
        other:
          '[0] No children with no triage needed|%s children with no triage needed'
      }
    }
  },
  upload: {
    label: 'Record import',
    count: {
      one: '%s import',
      other: '[0] No imports|%s imports'
    },
    list: {
      label: 'Import',
      title: 'Import records',
      description:
        'Import child, cohort and vaccination records and see important notices'
    },
    recent: {
      label: 'Recent imports',
      title: 'Recent imports'
    },
    reviews: {
      label: 'Import issues',
      title: 'Import issues',
      count: {
        one: '%s imported record needs review',
        other:
          '[0] No imported records need review|%s imported records need review'
      }
    },
    notices: {
      label: 'Important notices'
    },
    show: {
      title: 'Import ({{upload.formatted.createdAt}})',
      summary: 'Details'
    },
    new: {
      label: 'Import records',
      success: 'Records imported for processing'
    },
    review: {
      title: 'Review duplicate child record',
      duplicate: {
        label: 'Duplicate record',
        record: 'Duplicate child record',
        vaccination: 'Duplicate vaccination record'
      },
      original: {
        label: 'Existing record',
        record: 'Existing child record',
        vaccination: 'Existing vaccination record'
      },
      decision: {
        label: 'Which record do you want to keep?',
        duplicate: {
          label: 'Use duplicate record',
          hint: 'The duplicate record will replace the existing child record.'
        },
        original: {
          label: 'Keep previously imported record',
          hint: 'The existing record will be kept and the duplicate record will be discarded.'
        }
      },
      confirm: 'Resolve duplicate',
      success: 'Record updated with values from duplicate record',
      issue: {
        label: 'Issue to review',
        title: 'This record needs reviewing',
        text: 'A field in a duplicate record does not match an existing child record'
      }
    },
    file: {
      title: 'Import {{type}}',
      label: 'Upload file',
      description: {
        report:
          'You can import vaccination records by uploading:\n\n- a Mavis CSV file\n- a SystmOne file',
        other:
          'The file you upload should use the Mavis CSV format for {{type}}'
      },
      format: 'How to format your Mavis CSV file for {{type}}',
      errors: {
        invalid: 'The selected file must be a CSV'
      }
    },
    school: {
      label: 'School',
      title: 'Which school is this class list for?'
    },
    yearGroups: {
      label: 'Year groups',
      title: 'Which year groups do you want to import class list records for?'
    },
    summary: {
      title: 'Are you sure you want to import these {{type}}?',
      description: 'The uploaded file contains {{size}} records.',
      confirm: 'Import {{type}}',
      cancel: 'Cancel'
    },
    errors: {
      title: 'Records could not be imported',
      description:
        'The records could not be imported due to errors in the CSV file. When fixing these errors, note that the header does not count as a row.'
    },
    devoid: {
      label: 'Omitted records',
      description: 'All records in this CSV file had already been imported.'
    },
    duplicates: {
      label: 'Duplicate records'
    },
    invalid: {
      label: 'Missing vaccination'
    },
    incomplete: {
      label: 'Incomplete',
      count: {
        one: '%s record without an NHS number will use information from the Personal Demographics Service (PDS)',
        other:
          '[0] No records without NHS numbers will use information from the Personal Demographics Service (PDS)|%s records without NHS numbers will use information from the Personal Demographics Service (PDS)'
      }
    },
    id: {
      label: 'ID'
    },
    createdAt: {
      label: 'Imported on'
    },
    createdBy: {
      label: 'Imported by'
    },
    programme: {
      label: 'Programme'
    },
    type: {
      label: 'Type',
      title: 'What type of records are you importing?',
      hint: {
        Cohort:
          'Records of children from a CHIS, local authority or school, used to create cohorts',
        Report:
          'Records of previous vaccinations to be reported to GPs and/or NHS England',
        School: 'Records of children from a school, used to update cohorts'
      }
    },
    status: {
      label: 'Status'
    },
    vaccinations: {
      label: 'Vaccination records'
    },
    records: {
      label: 'Records',
      count: {
        one: '%s record imported',
        other: '[0] No records imported|%s records imported'
      }
    },
    issue: {
      label: 'Issue to review',
      title: 'This record needs reviewing',
      text: 'A field in a duplicate record does not match that in a previously imported record'
    }
  },
  manual: {
    show: {
      title: 'Service guidance',
      description: 'How to use this service'
    }
  },
  move: {
    list: {
      label: 'School moves',
      title: 'School moves',
      description: 'Review children who have moved schools'
    },
    show: {
      title: 'Review school move',
      confirm: 'Update child record',
      decision: {
        label: 'Update the child’s record with this new information?',
        ignore: 'Ignore new information',
        switch: 'Update record with new school'
      },
      session: {
        label: 'Move {{firstName}} to the upcoming school session?',
        hint: 'There are upcoming sessions at {{school}} on {{dates}}',
        clinic: 'No, keep them in the community clinic',
        school: 'Yes, move them to the upcoming school session'
      }
    },
    ignore: {
      success: '{{move.patient.fullName}}’s school move ignored'
    },
    switch: {
      success: '{{move.patient.fullName}}’s record updated with new school'
    },
    count: {
      one: '%s school move',
      other: '[0] No school moves|%s school moves'
    },
    results:
      '{count, plural, =0{No school moves matching your search criteria were found} one{Showing <b>{from}</b> to <b>{to}</b> of <b>{count}</b> school move} other{Showing <b>{from}</b> to <b>{to}</b> of <b>{count}</b> school moves}}',
    createdAt: {
      label: 'Updated'
    },
    from: {
      label: 'School joined from'
    },
    to: {
      label: 'School moved to'
    },
    source: {
      label: 'Updated in'
    },
    movement: {
      label: 'Move'
    }
  },
  user: {
    list: {
      title: 'Users',
      caption: 'Care Identity Service'
    },
    show: {
      summary: 'User details'
    },
    uid: {
      label: 'User ID'
    },
    fullName: {
      label: 'Name'
    },
    email: {
      label: 'Email address'
    },
    firstName: {
      label: 'First name'
    },
    lastName: {
      label: 'Last name'
    },
    role: {
      label: 'Role'
    }
  },
  vaccination: {
    label: 'Vaccination record',
    show: {
      summary: 'Vaccination details'
    },
    results:
      '{count, plural, =0{No vaccinations matching your search criteria were found} one{Showing <b>{from}</b> to <b>{to}</b> of <b>{count}</b> vaccination} other{Showing <b>{from}</b> to <b>{to}</b> of <b>{count}</b> vaccinations}}',
    count: {
      one: '%s vaccination record',
      other: '[0] No vaccination records|%s vaccination records'
    },
    administer: {
      title: 'How was the {{programme.name}} vaccination given?'
    },
    decline: {
      title: 'Why was the {{programme.name}} vaccination not given?'
    },
    upload: {
      label: 'Import vaccination records'
    },
    new: {
      'check-answers': {
        title: 'Check and confirm',
        summary: 'Vaccination details',
        callout: 'Vaccination was not given'
      },
      success: 'Vaccination outcome recorded for {{programme.name}}'
    },
    edit: {
      title: 'Edit vaccination record',
      summary: 'Vaccination details',
      success: 'Vaccination record updated'
    },
    createdAt: {
      label: 'Vaccination date',
      title: 'When was the {{programme.name}} vaccination given?'
    },
    createdAt_date: {
      label: 'Date',
      hint: 'For example, 27 10 2025'
    },
    createdAt_time: {
      label: 'Time',
      hint: 'For example, 13 15'
    },
    createdBy: {
      label: 'Vaccinator',
      title: 'Who was the vaccinator?'
    },
    updatedAt: {
      label: 'Record updated'
    },
    location: {
      label: 'Location',
      title: 'Where was the {{programme.name}} vaccination given?',
      hint: 'Enter name and address'
    },
    outcome: {
      label: 'Outcome',
      title: 'Vaccination outcome',
      Vaccinated: 'Vaccinated',
      PartVaccinated: 'Partially vaccinated',
      Absent: 'They were absent from the session',
      AlreadyVaccinated: 'They have already had the vaccine',
      Contraindications: 'They had contraindications',
      Refused: 'They refused it',
      Unwell: 'They were not well enough'
    },
    injection: {
      title: 'How was the {{programme.name}} vaccination given?'
    },
    method: {
      label: 'Method'
    },
    site: {
      label: 'Site'
    },
    programme: {
      label: 'Programme'
    },
    protocol: {
      label: 'Protocol'
    },
    batch: {
      label: 'Batch',
      title: 'Batch'
    },
    batch_id: {
      title: 'Which batch did you use for the {{programme.name}} vaccination?',
      label: 'Batch ID',
      default: 'Default to this batch for this session'
    },
    note: {
      label: 'Notes',
      hint: 'For example, if the child had a reaction to the vaccine',
      title: 'Notes'
    },
    dose: {
      label: 'Dose volume',
      title: 'What was the dose amount for the {{programme.name}} vaccination?'
    },
    dosage: {
      title: 'Did they get the full dose?',
      full: 'Yes, they got the full dose',
      half: 'No, they got half a dose'
    },
    sequence: {
      label: 'Dose sequence',
      title: {
        [ProgrammeType.HPV]: 'Which does of the HPV vaccination was this?',
        [ProgrammeType.TdIPV]:
          'Which dose of a tetanus-containing vaccine was this?'
      }
    },
    vaccine_snomed: {
      title: 'Vaccine',
      label: 'Vaccine'
    },
    review: {
      title: 'Review duplicate vaccination record',
      duplicate: {
        label: 'Duplicate record',
        record: 'Duplicate child record',
        vaccination: 'Duplicate vaccination record'
      },
      original: {
        label: 'Previously imported record',
        record: 'Previously imported child record',
        vaccination: 'Previously imported vaccination record'
      },
      decision: {
        label: 'Which record do you want to keep?',
        duplicate: {
          label: 'Use duplicate record',
          hint: 'The duplicate record will replace the previously imported record.'
        },
        original: {
          label: 'Keep previously imported record',
          hint: 'The previously imported record will be kept and the duplicate record will be discarded.'
        }
      },
      confirm: 'Resolve duplicate'
    }
  },
  vaccine: {
    list: {
      label: 'Vaccines',
      title: 'Vaccines',
      description: 'Add and edit vaccine batches'
    },
    show: {
      summary: 'Vaccine details',
      delete: 'Delete vaccine'
    },
    new: {
      title: 'Add a new vaccine'
    },
    action: {
      title: 'Are you sure you want to %s this vaccine?',
      description: 'This operation cannot be undone.',
      confirm: 'Yes, %s this vaccine',
      cancel: 'No, return to vaccine'
    },
    success: {
      delete: 'Vaccine deleted'
    },
    id: {
      label: 'Batch'
    },
    createdAt: {
      label: 'Entered date'
    },
    snomed: {
      label: 'SNOMED code'
    },
    brand: {
      label: 'Brand'
    },
    manufacturer: {
      label: 'Manufacturer'
    },
    type: {
      label: 'Vaccine'
    },
    method: {
      label: 'Method'
    },
    dose: {
      label: 'Dose'
    },
    healthQuestions: {
      label: 'Health questions'
    },
    preScreenQuestions: {
      label: 'Pre-screening questions'
    }
  }
}
