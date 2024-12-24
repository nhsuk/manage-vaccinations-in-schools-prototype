import schoolsData from '../datasets/schools.js'

export default [
  {
    code: 'RYG',
    name: 'Coventry and Warwickshire Partnership NHS Trust',
    email: 'example@covwarkpt.nhs.uk',
    tel: '01632 960000',
    privacyPolicyUrl: 'https://www.covwarkpt.nhs.uk/download.cfm?ver=8286',
    password: 'secret',
    clinic_ids: ['X99999'],
    school_urns: Object.keys(schoolsData)
  }
]
