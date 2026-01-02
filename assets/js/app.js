/**
 * Main application module for CodeBeat
 * Coordinates audio, parsing, and UI
 */

import { parseCode } from './parser.js';
import { 
    setupAudio, 
    updateEffects, 
    updateWaveform, 
    createSequences, 
    stopSequences,
    setupTransportLoop
} from './audio.js';
import { 
    createInstrumentIndicator, 
    flashIndicator, 
    updateCaret, 
    resetCaret,
    showDiagnostics,
    showStatus,
    showFeedback,
    toggleAccordion,
    setupKeyboardShortcuts,
    setupAccordionKeyboard,
    updatePlayButton,
    updateWaveformButtons
} from './ui.js';

export class CodeBeat {
    constructor() {
        this.elements = {
            codeEditor: document.getElementById('code-editor'),
            playButton: document.getElementById('play-button'),
            playText: document.getElementById('play-text'),
            playIcon: document.getElementById('play-icon'),
            tempoSlider: document.getElementById('tempo-slider'),
            tempoDisplay: document.getElementById('tempo-display'),
            progressCaret: document.getElementById('progress-caret'),
            pulseIndicator: document.querySelector('.bpm-pulse-indicator'),
            presetSelector: document.getElementById('preset-selector'),
            saveButton: document.getElementById('save-button'),
            waveformSelector: document.getElementById('waveform-selector'),
            reverbSlider: document.getElementById('reverb-slider'),
            delaySlider: document.getElementById('delay-slider'),
            swingSlider: document.getElementById('swing-slider'),
            filterCutoffSlider: document.getElementById('filter-cutoff-slider'),
            filterResonanceSlider: document.getElementById('filter-resonance-slider'),
            instrumentIndicators: document.getElementById('instrument-indicators'),
            accordionContainer: document.getElementById('accordion-container'),
            statusBar: document.getElementById('status-bar'),
        };

        this.state = {
            isPlaying: false,
            isInitialized: false,
            sequences: new Map(),
            synths: {},
            effects: {},
            transportEventId: null,
        };

        this.stopIconSVG = `<svg id="stop-icon" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M6.25 5A1.25 1.25 0 005 6.25v7.5A1.25 1.25 0 006.25 15h7.5A1.25 1.25 0 0015 13.75v-7.5A1.25 1.25 0 0013.75 5h-7.5zM6.5 6.5h7v7h-7v-7z" /></svg>`;
        this.playIconSVG = this.elements.playIcon.innerHTML;

        this.validInstruments = ['kick', 'snare', 'hihat', 'tom', 'synth', 'bass'];

        this.presets = {
            funk: `-- Modern Funk --
-- Instruments: kick, hihat, tom, synth, bass --

kick: 9-.7-..7.9-7.7..
hihat:*-*-*-*-*-*-*-*-
tom: ..............o.
synth:C4:16-.G4:16-.A#4:16-C5:16-
bass: C2---G2---A#2--C3---`,
            trap: `-- Trap Beat --

kick: 9---7---9-7-9---
hihat:*-*-*-*?*-*-*-*?*-
synth:G4:8--F4:8--D#4:8--C4:8
bass: G1:4----G1:4----`,
            generative: `-- Generative Melody --

kick: 9--5?3--9--5?8--
hihat:*-*?*-*?*-*?*-*?*-
synth:(C4|D4|E4|G4|A4)--(C4|D4|E4|G4|A4)--(C4|D4|E4|G4|A4)--(C4|D4|E4|G4|A4)-
bass: C2:2------G1:2------`,
            house: `-- House Groove --

kick: 9-5-9-5-9-5-9-5
hihat:--7---7---7---7-
synth:C3-E3-G3-B3-C4-B3-G3-E3
bass: C2:16-C2:16-C2:16-C2:16-C2:16-C2:16-C2:16-C2:16`,
        };
        
        this.init();
    }

    init() {
        this.populatePresets();
        this.setupEventListeners();
        this.loadPreset('funk');
        this.updateTempo();
        showStatus(this.elements.statusBar, '✓ Ready', 'success');
    }
    
    populatePresets() {
        for (const key in this.presets) {
            const option = new Option(key.charAt(0).toUpperCase() + key.slice(1), key);
            this.elements.presetSelector.add(option);
        }
        if (localStorage.getItem('codebeat_custom')) {
            this.elements.presetSelector.add(new Option('Custom Beat', 'custom'));
        }
    }

    setupAudioContext() {
        const { synths, effects } = setupAudio();
        this.state.synths = synths;
        this.state.effects = effects;
        this.updateEffectsFromUI();
        this.state.isInitialized = true;
    }

    setupEventListeners() {
        // Play/Stop button
        this.elements.playButton.addEventListener('click', () => this.togglePlayback());
        
        // Tempo control
        this.elements.tempoSlider.addEventListener('input', () => this.updateTempo());
        
        // Swing control
        this.elements.swingSlider.addEventListener('input', () => this.updateSwing());
        
        // Preset selection
        this.elements.presetSelector.addEventListener('change', (e) => this.loadPreset(e.target.value));
        
        // Save button
        this.elements.saveButton.addEventListener('click', () => this.saveCustomPreset());
        
        // Effects sliders
        this.elements.reverbSlider.addEventListener('input', () => this.updateEffectsFromUI());
        this.elements.delaySlider.addEventListener('input', () => this.updateEffectsFromUI());
        this.elements.filterCutoffSlider.addEventListener('input', () => this.updateEffectsFromUI());
        this.elements.filterResonanceSlider.addEventListener('input', () => this.updateEffectsFromUI());
        
        // Waveform selector
        this.elements.waveformSelector.addEventListener('click', (e) => {
            const button = e.target.closest('.wave-button');
            if (button && this.state.isInitialized) {
                updateWaveform(this.state.synths, button.dataset.wave);
                updateWaveformButtons(button);
            }
        });

        // Accordion
        this.elements.accordionContainer.addEventListener('click', (e) => {
            const header = e.target.closest('.accordion-header');
            if (header) toggleAccordion(header);
        });
        
        setupAccordionKeyboard(this.elements.accordionContainer);
        
        // Keyboard shortcuts
        setupKeyboardShortcuts({
            togglePlay: () => this.togglePlayback(),
            save: () => this.saveCustomPreset()
        });
    }

    loadPreset(name) {
        let code = name === 'custom' ? localStorage.getItem('codebeat_custom') : this.presets[name];
        if (code) {
            this.elements.codeEditor.value = code;
            if (this.state.isPlaying) {
                this.parseAndPlay();
            }
        }
    }

    saveCustomPreset() {
        localStorage.setItem('codebeat_custom', this.elements.codeEditor.value);
        if (![...this.elements.presetSelector.options].some(o => o.value === 'custom')) {
             this.elements.presetSelector.add(new Option('Custom Beat', 'custom'));
        }
        this.elements.presetSelector.value = 'custom';
        showFeedback(this.elements.saveButton, '✓ Preset saved!');
    }

    updateTempo() {
        const bpm = parseInt(this.elements.tempoSlider.value, 10);
        this.elements.tempoDisplay.textContent = bpm;
        this.elements.pulseIndicator.style.animationDuration = `${60 / bpm}s`;
        if (this.state.isInitialized) {
            Tone.Transport.bpm.value = bpm;
        }
    }
    
    updateSwing() {
        if (this.state.isInitialized) {
            Tone.Transport.swing = parseInt(this.elements.swingSlider.value) / 100;
        }
    }

    updateEffectsFromUI() {
        if (!this.state.isInitialized) return;
        
        updateEffects(this.state.effects, {
            reverb: parseInt(this.elements.reverbSlider.value),
            delay: parseInt(this.elements.delaySlider.value),
            filterCutoff: parseInt(this.elements.filterCutoffSlider.value),
            filterResonance: parseInt(this.elements.filterResonanceSlider.value)
        });
    }

    async togglePlayback() {
        if (!this.state.isInitialized) {
            await Tone.start();
            this.setupAudioContext();
        }
        
        this.state.isPlaying = !this.state.isPlaying;
        updatePlayButton(this.elements, this.state.isPlaying, this.stopIconSVG, this.playIconSVG);
        
        if (this.state.isPlaying) {
            this.parseAndPlay();
            showStatus(this.elements.statusBar, '▶ Playing', 'info');
        } else {
            this.stopMusic();
            showStatus(this.elements.statusBar, '⏸ Stopped', 'info');
        }
    }

    parseAndPlay() {
        this.resetSequencer();
        
        const code = this.elements.codeEditor.value;
        const { instruments, warnings, errors } = parseCode(code, this.validInstruments);
        
        // Show diagnostics
        showDiagnostics(this.elements.statusBar, warnings, errors);
        
        // Don't play if there are errors
        if (errors.length > 0) {
            this.state.isPlaying = false;
            updatePlayButton(this.elements, false, this.stopIconSVG, this.playIconSVG);
            return;
        }
        
        // Create indicators
        instruments.forEach((pattern, instrument) => {
            createInstrumentIndicator(this.elements.instrumentIndicators, instrument);
        });
        
        // Create sequences
        const { sequences, longestPattern } = createSequences(
            instruments,
            this.state.synths,
            (instrument) => flashIndicator(instrument)
        );
        
        this.state.sequences = sequences;
        
        // Setup transport loop
        if (longestPattern > 0) {
            this.state.transportEventId = setupTransportLoop(
                longestPattern,
                () => updateCaret(this.elements.progressCaret, this.elements.codeEditor)
            );
        }
        
        Tone.Transport.start();
    }

    resetSequencer() {
        // Stop and dispose sequences
        stopSequences(this.state.sequences);
        
        // Cancel all transport events
        Tone.Transport.cancel(0);
        
        // Clear indicators
        if (this.elements.instrumentIndicators) {
            this.elements.instrumentIndicators.innerHTML = '';
        }
        
        // Reset caret
        resetCaret(this.elements.progressCaret);
    }
    
    stopMusic() {
        this.resetSequencer();
        Tone.Transport.stop();
        Tone.Transport.position = 0;
    }
}
