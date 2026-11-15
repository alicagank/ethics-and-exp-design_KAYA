// Ali Çağan Kaya, 2026
// Minimal Turkish vowel identification task using jsPsych.

const jsPsych = initJsPsych({
  on_finish: () => {
    document.body.innerHTML = '<main class="done">Finished. The CSV should have downloaded.</main>';
  }
});

const vowels = [
  { vowel: 'a', file: 'audio/a.wav' },
  { vowel: 'i', file: 'audio/i.wav' },
  { vowel: 'u', file: 'audio/u.wav' }
];

const timeline = [];

// Load the sounds
timeline.push({
  type: jsPsychPreload,
  audio: vowels.map(item => item.file)
});

// Instruction screen
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: '<h2>Turkish Vowel Identification</h2>' +
            '<p>Listen to each sound and select the vowel you heard.</p>' +
            '<p>This first sketch uses only <strong>a, i, u</strong>.</p>',
  choices: ['Start']
});

// One sound three vowels
for (const item of vowels) {
  timeline.push({
    type: jsPsychAudioButtonResponse,
    stimulus: item.file,
    choices: ['a', 'i', 'u'],
    response_allowed_while_playing: false,
    prompt: '<p>Which vowel did you hear?</p>',
    data: { task: 'identification', target_vowel: item.vowel },
    on_finish: (data) => {
      const choices = ['a', 'i', 'u'];
      data.response_vowel = choices[data.response];
      data.correct = data.response_vowel === item.vowel;
    }
  });
}

// Export the recorded identification trials
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: '<h2>Finished!</h2><p>Download your responses as a CSV file.</p>',
  choices: ['Download CSV!'],
  on_finish: () => {
    jsPsych.data.get().filter({ task: 'identification' })
      .localSave('csv', 'stage-1-vowel-results.csv');
  }
});

jsPsych.run(timeline);
