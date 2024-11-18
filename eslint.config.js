import xGovukConfig from '@x-govuk/eslint-config'

export default [
  ...xGovukConfig,
  {
    files: ['**/*.js'],
    rules: {
      'accessor-pairs': ['error', { enforceForClassMembers: false }],
      camelcase: 'off',
      'no-continue': 'off'
    }
  },
  {
    ignores: [
      'public',
      'app/data.js' // https://github.com/eslint/eslint/discussions/15305
    ]
  }
]
