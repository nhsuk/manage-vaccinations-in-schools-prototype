# Manage vaccinations in schools prototype

A point of care (POC) prototype, built using the [NHS.UK Prototype Rig](https://github.com/x-govuk/nhsuk-prototype-rig).

Point of Care Systems record data when someone is vaccinated, including product and batch details, and the recording of adverse reactions.

<https://digital.nhs.uk/coronavirus/vaccinations/training-and-onboarding/point-of-care>

## Requirements

Node.js v20

## Installation

1. Clone this repository

2. Install the dependencies and create data:\
   `npm install`

3. Start the application:\
   `npm run dev`

## Creating session data

Session data uses pre-compiled JSON files saved to a `.data` folder.

To regenerate this data run:\
`npm run create-data`
