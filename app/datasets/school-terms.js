import { SchoolTerm } from '../enums.js'

export default {
  2023: {
    [SchoolTerm.Autumn]: { from: '2023-09-03', to: '2023-12-21' },
    [SchoolTerm.Spring]: { from: '2024-01-07', to: '2024-04-12' },
    [SchoolTerm.Summer]: { from: '2024-04-29', to: '2024-07-21' }
  },
  2024: {
    [SchoolTerm.Autumn]: { from: '2024-09-02', to: '2024-12-20' },
    [SchoolTerm.Spring]: { from: '2025-01-06', to: '2025-04-11' },
    [SchoolTerm.Summer]: { from: '2025-04-28', to: '2025-07-20' }
  },
  2025: {
    [SchoolTerm.Autumn]: { from: '2025-09-01', to: '2025-12-19' },
    [SchoolTerm.Spring]: { from: '2026-01-05', to: '2026-04-10' },
    [SchoolTerm.Summer]: { from: '2026-04-27', to: '2026-07-19' }
  }
}
