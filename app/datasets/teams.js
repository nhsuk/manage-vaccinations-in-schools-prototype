import schools from './schools.js'

export default [
  {
    id: '001',
    ods: 'RYG',
    name: 'Coventry and Warwickshire Partnership NHS Trust',
    email: 'example@covwarkpt.nhs.uk',
    tel: '01632 960000',
    privacyPolicyUrl: 'https://www.covwarkpt.nhs.uk/download.cfm?ver=8286',
    password: 'secret',
    clinic_ids: ['X99999'],
    school_urns: Object.keys(schools)
  }
]
