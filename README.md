CodeBeat - A Generative Music Sequencer
CodeBeat is a browser-based beat maker that lets you craft dynamic, generative rhythms and melodies using a simple, text-based syntax. Built with HTML, Tailwind CSS, and Tone.js, it offers a unique way to experiment with music production directly in your web browser.

Features
Live-Coding Sequencer: Edit patterns in real-time and hear your changes instantly.

Powerful Generative Tools: Use probabilistic triggers (?3 for 30% chance) and random note selection ((C4|E4|G4)) to create ever-evolving patterns.

Six Built-in Instruments: Includes Kick, Snare, Hihat, Tom, a polyphonic Synth, and a monophonic Bass synth.

Full Suite of Master Controls: Adjust BPM, Swing, and sculpt your sound with master effects like Reverb, Delay, and a resonant Low-Pass Filter.

Customizable Synth Engine: Choose from Saw, Square, Sine, and Triangle waveforms for the main synth.

Presets and Saving: Load built-in presets to get started quickly, or save your own unique beats to your browser's local storage.

Modern UI: A sleek, responsive interface with visual indicators that flash with each note played.

How It Works
Define patterns for each instrument using an intuitive syntax.

Example:

-- A simple generative beat --
kick: 9--5?2--9--5?8
snare: ----9?6-------
synth: (C4|E4|G4|A4)---(C4|E4|G4)---

Drums: Use numbers 1-9 for velocity and ? for probability.

Synths: Define notes like C4, specify duration with C4:8, or create random melodies with (C4|E4|G4).

Tech Stack
Frontend: HTML5, Tailwind CSS

Audio & Sequencing: JavaScript with the powerful Tone.js library for Web Audio API management.
