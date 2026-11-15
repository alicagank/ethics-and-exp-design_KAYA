// Ali Çağan Kaya, 2026
// Minimal Turkish vowel identification task using jsPsych.

// jsPsych init
const jsPsych = initJsPsych();

// Eight Turkish vowel response options
const choices = ['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü'];

// Stimulus list
const vowels = [
  { vowel: 'a', file: 'audio/01_intact.wav' },
  { vowel: 'e', file: 'audio/02_intact.wav' },
  { vowel: 'ı', file: 'audio/03_intact.wav' },
];

// The timeline
const timeline = [];

// Preload the eight audio files
timeline.push({
  type: jsPsychPreload,
  audio: vowels.map(item => item.file)
});

// Instructions screen
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Turkish Vowel Identification</h2>
    <p>Listen to each sound and identify the vowel you hear.</p>
    <p>You will first complete three practice trials.</p>
  `,
  choices: ['Begin practice']
});

// Function for creating an identification trial
function makeTrial(item, phase) {
  return {
    type: jsPsychAudioButtonResponse,

    stimulus: item.file,
    choices: choices,

    // Arrange the grid layout and buttons
    button_layout: 'grid',
    grid_columns: 4,
    grid_rows: 2,

    // Participants must hear the entire sound
    response_allowed_while_playing: false,

    prompt: `<p>Which vowel did you hear?</p>
             <p>${phase === 'practice' ? 'Practice trial' : ''}</p>`,

    // Information recorded with the response
    data: {
      task: 'identification',
      phase: phase,
      target_vowel: item.vowel
    },

    on_finish: function(data) {
      // jsPsych records button indices starting from 0
      // Convert the index into a vowel letter
      data.response_vowel = choices[data.response];

      // Compare the response with the intended vowel
      data.correct = data.response_vowel === item.vowel;
    }
  };
}

// PRACTICE PHASE before the real deal
// Use three familiar vowels
const practice = vowels.filter(item =>
  ['a', 'i', 'u'].includes(item.vowel)
);

for (const item of practice) {
  timeline.push(makeTrial(item, 'practice'));
}

// Instructions before the main experiment
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Practice completed!</h2>
    <p>You will now hear eight vowels.</p>
    <p>Select the vowel you hear after each sound.</p>
  `,
  choices: ['Begin experiment']
});

// MAIN EXPERIMENT
// Randomise
const shuffledVowels = jsPsych.randomization.shuffle(vowels);

for (const item of shuffledVowels) {
  timeline.push(makeTrial(item, 'main'));
}

// Final screen and data export
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Experiment completed!</h2>
    <p>Thank you for participating.</p>
    <p>Click below to download your results.</p>
  `,
  choices: ['Download CSV'],

  on_finish: function() {
    jsPsych.data.get()
      .filter({ task: 'identification' })
      .localSave('csv', 'stage-2-vowel-results.csv');
  }
});

// Start the experiment
jsPsych.run(timeline);
