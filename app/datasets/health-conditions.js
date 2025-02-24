import { HealthQuestion } from '../models/vaccine.js'

export default {
  adhd: {
    [HealthQuestion.MedicalConditions]:
      'My child was diagnosed with ADHD and has difficulty focusing and paying attention.',
    triageNote:
      'Spoke with parent, child diagnosed with ADHD and takes medication. Vaccinator should be aware of child’s condition and accommodate by allowing extra time for the child to settle, using clear communication and providing a calm environment. Monitor for any adverse reactions during and after vaccine administration.'
  },
  anaemia: {
    [HealthQuestion.MedicalConditions]:
      'My child was diagnosed with anaemia and has low iron levels.',
    [HealthQuestion.MedicationAllergies]:
      'My child takes iron supplements to manage their anaemia.',
    triageNote:
      'Spoke with parent, child diagnosed with anaemia and takes iron supplements. Vaccinator needs to be aware and ensure iron levels are monitored during and after vaccine administration.'
  },
  anxietyDisorder: {
    [HealthQuestion.MedicalConditions]:
      'My child has an anxiety disorder and experiences excessive worry and fear on a regular basis.',
    [HealthQuestion.MedicationAllergies]:
      'My child takes medication to manage their anxiety and prevent panic attacks.',
    [HealthQuestion.Support]:
      'My child becomes extremely anxious in public settings. I’d like for them to be vaccinated in a private space and not rushed through the vaccination.',
    triageNote:
      'Spoke with parent. Child has an anxiety disorder, takes medication to manage it. No medical issues that would impact vaccine administration. It is safe to vaccinate.'
  },
  asthma: {
    [HealthQuestion.Asthma]:
      'My child was diagnosed with asthma a few months ago and it has been quite challenging for them. They have struggled with breathing difficulties and have needed to use their inhaler several times a day.',
    [HealthQuestion.AsthmaSteroids]:
      'My child takes medication every day to manage their asthma',
    triageNote:
      'Spoke with parent. Child has asthma, takes daily medication. Safe to give vaccine'
  },
  asthmaAndAllergies: {
    [HealthQuestion.Asthma]:
      'My child has asthma and multiple allergies, including environmental and food allergies.',
    [HealthQuestion.AsthmaSteroids]:
      'My child takes medication to manage their asthma and prevent breathing difficulties. They also carry an EpiPen in case of anaphylactic reactions.',
    [HealthQuestion.Support]:
      'My child has a history of anaphylactic reactions and must avoid certain foods and environments to prevent reactions.',
    triageNote:
      'Spoke with parent. Safe to vaccinate, but monitor for adverse reactions'
  },
  autism: {
    [HealthQuestion.MedicalConditions]:
      'My child has autism spectrum disorder and has difficulty with social interactions and communication.',
    [HealthQuestion.MedicationAllergies]:
      'My child does not take medication, but receives therapy to help with their autism.',
    [HealthQuestion.Support]:
      'My child becomes extremely anxious in public settings. I’d like for them to be vaccinated in a private space and not rushed through the vaccination.',
    triageNote:
      'Spoke with parent, child has autism spectrum disorder and sensory processing disorder. Child does not take medication but receives therapy. Vaccinator should be aware of child’s conditions, especially the sensory processing disorder, and take extra care during vaccine administration to minimize any discomfort. Monitor for any adverse reactions during and after vaccine administration.'
  },
  badExperience: {
    [HealthQuestion.PreviousReaction]:
      'My child recently had a bad reaction to a different vaccine.',
    [HealthQuestion.Support]:
      'My child had a bad experience with a vaccine before, I just want to make sure they are comfortable and safe',
    triageNote:
      'I have spoken to the parent and they mentioned that the child had a bad experience with a vaccine before. It is important to ensure the child is comfortable and at ease during the vaccine process. I suggest discussing any concerns with the child and addressing them before proceeding with the vaccine. It is safe to give the vaccine with these measures in place.'
  },
  badReaction: {
    [HealthQuestion.PreviousReaction]:
      'My child recently had a bad reaction to a different vaccine.',
    [HealthQuestion.Support]:
      'My child recently had a bad reaction to a different vaccine. I just want to make sure we are extra cautious with this.',
    triageNote:
      'Spoke with parent, confirmed bad reaction from previous vaccine. Vaccine was a COVID-19 vaccination and the reaction was swelling at the site of vaccination. Safe to vaccinate with caution. Monitor for adverse reactions post-vaccination.'
  },
  bleedingDisorder: {
    [HealthQuestion.Bleeding]:
      'My child has frequent nose bleeds, but our doctor says its nothing to be worried about.',
    [HealthQuestion.MedicalConditions]:
      'My child has a bleeding disorder and can easily bruise or bleed.',
    [HealthQuestion.MedicationAllergies]:
      'My child takes medication to manage their bleeding disorder and prevent excessive bleeding.',
    triageNote:
      'Spoke with parent, child has bleeding disorder and takes medication to manage. Vaccinator needs to be aware and cautious when administering vaccine to prevent excessive bleeding.'
  },
  chronicIllness: {
    [HealthQuestion.MedicalConditions]:
      'My child has a chronic illness and requires ongoing medical treatment.',
    [HealthQuestion.Immunosuppressant]:
      'My child takes immunosuppressant medication to manage their chronic illness and prevent complications.',
    [HealthQuestion.Support]:
      'My child also has a history of hospitalizations due to their chronic illness.',
    triageNote:
      'Spoke with parent. Safe to vaccinate, but monitor for adverse reactions'
  },
  chronicPain: {
    [HealthQuestion.MedicalConditions]:
      'My child has chronic pain due to a previous injury and struggles with discomfort daily.',
    [HealthQuestion.MedicationAllergies]:
      'My child takes pain medication to manage their chronic pain and improve their quality of life.',
    triageNote:
      'Spoke with parent, child has chronic pain due to previous injury and takes medication. Vaccinator should be aware of child’s condition and take extra care during vaccine administration to minimize any discomfort. Monitor for any adverse reactions during and after vaccine administration.'
  },
  coeliacDisease: {
    [HealthQuestion.EggAllergy]:
      'My child has coeliac disease and must follow a strict gluten-free diet.',
    [HealthQuestion.MedicalConditions]:
      'My child has coeliac disease and must follow a strict gluten-free diet.',
    [HealthQuestion.MedicationAllergies]:
      'My child does not take medication, but follows a strict gluten-free diet to manage their coeliac disease.',
    triageNote:
      'Spoke with parent. Safe to vaccinate, but monitor for adverse reactions'
  },
  covid19: {
    [HealthQuestion.HouseholdImmuneSystem]:
      'Their grandmother lives with us, and has recently got covid.',
    triageNote:
      'Spoke with parent. Child has sufficiently recovered. It is safe to vaccinate'
  },
  depression: {
    [HealthQuestion.MedicalConditions]:
      'My child has depression and experiences feelings of sadness and hopelessness on a regular basis.',
    [HealthQuestion.MedicationAllergies]:
      'My child takes medication to manage their depression and improve their mood.',
    triageNote:
      'Spoke with parent. Child has depression, takes medication to manage it, has made progress with therapy. No medical issues that would impact vaccine administration. It is safe to vaccinate.'
  },
  diabetes: {
    [HealthQuestion.MedicalConditions]:
      'My child has type 1 diabetes and requires daily insulin injections.',
    [HealthQuestion.MedicationAllergies]:
      'My child takes insulin injections multiple times a day to manage their diabetes.',
    triageNote: 'Spoke with parent, it is safe to vaccinate'
  },
  dogBite: {
    [HealthQuestion.RecentTdIpvVaccination]:
      'My child was bitten by a dog last summer and got a Tetanus jab when we visited A&E.'
  },
  dyslexia: {
    [HealthQuestion.MedicalConditions]:
      'My child has dyslexia and has difficulty with reading and writing.',
    [HealthQuestion.MedicationAllergies]:
      'My child does not take medication, but receives extra support in school to help with their dyslexia.',
    triageNote:
      'Spoke with parent. Child has dyslexia, does not take medication for it, receives extra support in school. No medical issues that would impact vaccine administration. It is safe to vaccinate.'
  },
  eczema: {
    [HealthQuestion.MedicalConditions]:
      'My child has eczema and has skin irritation and redness on a regular basis.',
    [HealthQuestion.MedicationAllergies]:
      'My child uses topical ointments to manage their eczema and prevent skin irritation.',
    triageNote:
      'Spoke with parent. Safe to vaccinate, but monitor for adverse reactions'
  },
  epilepsy: {
    [HealthQuestion.MedicalConditions]:
      'My child has epilepsy and has seizures on a regular basis.',
    [HealthQuestion.MedicationAllergies]:
      'My child takes anti-seizure medication twice a day to manage their epilepsy.',
    triageNote: 'Spoke with parent, it is safe to vaccinate'
  },
  fainting: {
    [HealthQuestion.PreviousReaction]:
      'My child has a history of fainting after receiving injections.',
    [HealthQuestion.Support]:
      'My child has a history of fainting after receiving injections. I’d like for them to be vaccinated in a private space and not rushed through the vaccination.',
    triageNote:
      'I have spoken to the parent and gathered that the child has a history of fainting after receiving injections. It is recommended to observe the child for 15 minutes after the vaccine is given, to monitor for any adverse reactions. The vaccine can be safely given with this precaution in place.'
  },
  foodAllergy: {
    [HealthQuestion.Allergy]:
      'My child has a food allergy to dairy products and had an anaphylactic reaction in the past.',
    [HealthQuestion.EggAllergy]:
      'My child has an allergy to dairy products and had an anaphylactic reaction in the past.',
    [HealthQuestion.MedicationAllergies]:
      'My child carries an EpiPen with them at all times in case of another reaction.',
    triageNote:
      'Spoke with parent. Safe to vaccinate, but monitor for adverse reactions'
  },
  heartCondition: {
    [HealthQuestion.MedicalConditions]:
      'My child was born with a heart condition and has had several surgeries to repair it.',
    [HealthQuestion.MedicationAllergies]:
      'My child takes medication to manage their heart condition and prevent further issues.',
    triageNote: 'Spoke with parent, it is safe to vaccinate'
  },
  learningDisability: {
    [HealthQuestion.MedicalConditions]:
      'My child has a learning disability and has difficulty with reading, writing, and other academic skills.',
    [HealthQuestion.MedicationAllergies]:
      'My child does not take medication, but receives extra support in school to help with their learning disability.',
    [HealthQuestion.Support]:
      'My child becomes extremely anxious in public settings. I’d like for them to be vaccinated in a private space and not rushed through the vaccination.',
    triageNote:
      'Vaccinator should be aware of the child’s learning disability and provide appropriate support to ensure a smooth vaccination experience'
  },
  migraines: {
    [HealthQuestion.MedicalConditions]:
      'My child suffers from migraines and has severe headaches on a regular basis.',
    [HealthQuestion.MedicationAllergies]:
      'My child takes medication to manage their migraines and prevent headaches.',
    triageNote:
      'Spoke with parent. Safe to vaccinate, but monitor for adverse reactions'
  },
  nutAllergy: {
    [HealthQuestion.Allergy]:
      'My child has a severe nut allergy and has had an anaphylactic reaction in the past. This is something that is extremely important to me and my husband. We make sure to always have an EpiPen on hand and have educated our child about their allergy.',
    [HealthQuestion.MedicalConditions]:
      'My child has a severe nut allergy, which is their only existing medical condition that we are aware of.',
    triageNote:
      'Spoke with parent. Safe to vaccinate, but monitor for adverse reactions'
  },
  surgery: {
    [HealthQuestion.Support]:
      'Our child recently had surgery and is still recovering. We want to make sure it’s safe for them to get the vaccine.',
    triageNote:
      'Spoke with parent. Child has sufficiently recovered. It is safe to vaccinate'
  }
}
