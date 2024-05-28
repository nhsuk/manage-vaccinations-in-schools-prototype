import { fakerEN_GB as faker } from '@faker-js/faker'
import vaccines from '../datasets/vaccines.js'

export class HealthQuestion {
  static Aspirin = 'Does the child take regular aspirin?'
  static Allergy = 'Does the child have any severe allergies?'
  static Asthma = 'Has the child been diagnosed with asthma?'
  static AsthmaAdmitted =
    'Has the child been admitted to intensive care for their asthma?'
  static AsthmaSteroids =
    'Has the child taken any oral steroids for their asthma in the last 2 weeks?'
  static EggAllergy =
    'Has the child ever been admitted to intensive care due an allergic reaction to egg?'
  static Immunosuppressant =
    'Does the child take any immunosuppressant medication?'
  static ImmuneSystem =
    'Does the child have a disease or treatment that severely affects their immune system?'
  static HouseholdImmuneSystem =
    'Is anyone in the child’s household currently having treatment that severely affects their immune system?'
  static MedicationAllergies =
    'Does the child have any allergies to medication?'
  static MedicalConditions =
    'Does the child have any medical conditions for which they receive treatment?'
  static PreviousReaction =
    'Has the child ever had a severe reaction to any medicines, including vaccines?'
  static RecentFluVaccination =
    'Has the child had a flu vaccination in the last 5 months?'
}

export class PreScreenQuestion {
  static isAllergic = 'Do you have any allergies?'
  static isPregnant = 'Could you be pregnant?'
  static isWell = 'Are you feeling well?'
  static isHappy =
    'Do you know what the vaccination is for and are you ok to have it?'
}

export class VaccineMethod {
  static Nasal = 'Nasal spray'
  static Injection = 'Injection'
}

/**
 * @class Vaccine
 * @property {string} gtin - GTIN
 * @property {string} type - Type
 * @property {string} name - Name
 * @property {string} brand - Brand
 * @property {string} supplier - Supplier
 * @property {number} dose - Dosage
 * @property {VaccineMethod} method - Method
 * @property {Array[string]} healthQuestionKeys - Health question keys
 * @property {Array[string]} preScreenQuestionKeys - Pre-screening question keys
 * @function brandWithName - Get brand with vaccine type
 * @function healthQuestions - Health questions
 * @function preScreenQuestions - Pre-screening questions
 * @function ns - Namespace
 * @function uri - URL
 */
export class Vaccine {
  constructor(options) {
    this.gtin = options?.gtin || faker.string.numeric(14)
    this.type = options.type
    this.name = options.name
    this.brand = options.brand
    this.supplier = options.supplier
    this.dose = options.dose
    this.method = options.method
    this.healthQuestionKeys = options.healthQuestionKeys
    this.preScreenQuestionKeys = options.preScreenQuestionKeys
  }

  get brandWithName() {
    return `${this.brand} (${this.name})`
  }

  get formattedDose() {
    return `${this.dose} ml`
  }

  get healthQuestions() {
    return vaccines[this.gtin].healthQuestionKeys.map(
      (key) => HealthQuestion[key]
    )
  }

  get preScreenQuestions() {
    return vaccines[this.gtin].preScreenQuestionKeys.map(
      (key) => PreScreenQuestion[key]
    )
  }

  get ns() {
    return 'vaccine'
  }

  get uri() {
    return `/vaccines/${this.gtin}`
  }
}
