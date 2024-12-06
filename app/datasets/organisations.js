import schoolsData from '../datasets/schools.js'

export default [
  {
    code: 'RYG',
    name: 'Coventry and Warwickshire Partnership NHS Trust',
    email: 'example@covwarkpt.nhs.uk',
    tel: '01632 960000',
    clinic_ids: ['X99999'],
    school_urns: Object.keys(schoolsData)
  }
]
