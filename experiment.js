// Ali Çağan Kaya, 2026
// Minimal Turkish vowel identification task using jsPsych.

// jsPsych init, progress bar
const jsPsych = initJsPsych({ show_progress_bar: true });

const vowels = ['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü'];
const conditions = ['intact', 'silent_centre', 'centre_only'];
const timeline = [];


timeline.push({
  type: jsPsychHtmlButtonResponse,

  stimulus: `
    <h2>About this experiment</h2>

    <p>
      This experiment was designed by Ali Çağan Kaya
      for the Ethics and Experimental Design (SL9AE085) course
      at Université Paris Cité.
    </p>

    <p>
      The aim of this experiment is to adapt the
      vowel identification paradigm proposed by
      Jenkins, Strange, and Edman (1983) to Turkish
      in order to better understand the role of dynamic
      acoustic information in vowel perception in the language.
    </p>

    <p>
      The experiment uses three conditions:
      <strong>intact vowels</strong>, in which the
      entire signal is preserved;
      <strong>silent-centre vowels</strong>, in which
      the central 50% is replaced with silence; and
      <strong>centre-only vowels</strong>, in which
      only the central 50% is preserved.
    </p>

    <p>
      The stimuli were synthesised using Praat
      through the Parselmouth Python library.
      Participants will listen to the stimuli
      and identify which of the eight Turkish
      vowels they perceive.
    </p>
  `,

  choices: ['Continue']
});


timeline.push({
  type: jsPsychHtmlButtonResponse,

  stimulus: `
    <h2>Stimulus Conditions</h2>

    <p>
      The experiment uses three versions of each vowel:
    </p>

    <h3>1. Normal (Intact)</h3>
    <img src="images/normal.png"
         alt="Normal vowel waveform"
         class="stimulus-image">

    <h3>2. Silent-centre</h3>
    <img src="images/silent-centre.png"
         alt="Silent-centre vowel waveform"
         class="stimulus-image">

    <h3>3. Centre-only</h3>
    <img src="images/centre-only.png"
         alt="Centre-only vowel waveform"
         class="stimulus-image">

  `,

  choices: ['Continue']
});



let participantCode = '';

// One stimulus per condition
const stimuli = [];

for (let i = 0; i < vowels.length; i++) {
  for (const condition of conditions) {
    const number = String(i + 1).padStart(2, '0');

    stimuli.push({
      vowel: vowels[i],
      condition: condition,
      file: `audio/${number}_${condition}.wav`
    });
  }
}

// Load recordings
timeline.push({
  type: jsPsychPreload,
  audio: stimuli.map(item => item.file),
  continue_after_error: false
});

// Part. code
timeline.push({
  type: jsPsychSurveyText,
  preamble: '<h2>Turkish Vowel Identification</h2>',
  questions: [
    {
      prompt: 'Participant code:',
      name: 'participant',
      required: true
    }
  ],
  on_finish: function(data) {
    participantCode = data.response.participant.trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40) || 'anonymous';

    jsPsych.data.addProperties({
      participant_code: participantCode
    });
  }
});

// Instruction
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Instructions</h2>
    <p>You will hear one Turkish vowel at a time.</p>
    <p>Select the letter you hear: a, e, ı, i, o, ö, u, or ü.</p>
    <p>You can click a button or press a number from 1 to 8.</p>
    <p>Press Space to replay a sound.</p>
    <p>First, try three practice trials.</p>
  `,
  choices: ['Begin practice']
});

// Trial
function makeTrial(item, phase, number, total) {
  let replayCount = 0;
  let responseMethod = 'mouse';
  let keyHandler;
  let player;

  return {
    type: jsPsychAudioButtonResponse,

    stimulus: item.file,
    choices: vowels,

    // Grid layout fro buttons
    button_layout: 'grid',
    grid_columns: 4,
    grid_rows: 2,

    // This does not let the participant to misclick or early click
    response_allowed_while_playing: false,

    prompt: `
      <p>${phase === 'practice' ? 'Practice' : 'Main experiment'}:
         ${number} / ${total}</p>
      <h3>Which vowel did you hear?</h3>
      <p>Number keys 1–8 correspond to the buttons above.</p>
      <button id="replay-button" type="button">
        Replay sound (Space)
      </button>
    `,

    // Information stored with this trial
    data: {
      task: 'identification',
      phase: phase,
      target_vowel: item.vowel,
      condition: item.condition,
      stimulus_file: item.file
    },

    on_load: function() {
      // Reply function
      player = new Audio(item.file);

      const replay = () => {
        player.pause();
        player.currentTime = 0;
        player.play().catch(err => console.error('Replay failed:', err));
        replayCount++;
      };

      document.getElementById('replay-button')
        .addEventListener('click', replay);

      // Shortcuts
      keyHandler = event => {
        if (event.repeat ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey) return;

        if (event.code === 'Space') {
          event.preventDefault();
          replay();
        }

        else if (/^[1-8]$/.test(event.key)) {
          const index = Number(event.key) - 1;

          const button = document.querySelector(
            `#jspsych-audio-button-response-btngroup [data-choice="${index}"]`
          );

          // Ignore key presses before trial time begins, bugs
          if (button && !button.disabled) {
            event.preventDefault();
            responseMethod = 'keyboard';
            button.click();
          }
        }
      };

      window.addEventListener('keydown', keyHandler);
    },

    on_finish: function(data) {
      // Remove shortcuts
      window.removeEventListener('keydown', keyHandler);

      if (player) player.pause();

      // Attach vowel to response
      data.response_vowel = vowels[data.response];

      // Accuracy
      data.correct = data.response_vowel === item.vowel;

      // Reply count, method (shortcut, normal)
      data.replay_count = replayCount;
      data.response_method = responseMethod;
    }
  };
}

// PRACTICE
// Three normal vowels
const practice = stimuli.filter(item =>
  item.condition === 'intact' &&
  ['a', 'i', 'u'].includes(item.vowel)
);

practice.forEach((item, i) => {
  timeline.push(makeTrial(item, 'practice', i + 1, practice.length));
});

// Intermission
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Practice complete</h2>
    <p>The experiment now begins.</p>
    <p>Some sounds may be incomplete.</p>
    <p>Choose the closest vowel, even if you are uncertain.</p>
  `,
  choices: ['Start main trials']
});

// MAIN EXPERIMENT
// Randomise!
const mainTrials = jsPsych.randomization.shuffle(stimuli);

mainTrials.forEach((item, i) => {
  timeline.push(makeTrial(item, 'main', i + 1, mainTrials.length));
});

// Final screen, data export
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Finished!</h2>
    <p>Thank you for participating!!</p>
    <p>Please download your responses as a CSV file.</p>
  `,
  choices: ['Download CSV'],

  on_finish: function() {
    jsPsych.data.get()
      .filter({ task: 'identification' })
      .localSave('csv', `stage-3-${participantCode}-results.csv`);
  }
});

// Run
jsPsych.run(timeline);
