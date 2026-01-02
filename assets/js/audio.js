/**
 * Audio module for CodeBeat
 * Handles Tone.js setup, audio synthesis, and sequencing
 */

/**
 * Setup audio context and synthesizers
 * @returns {object} - Synths and effects objects
 */
export function setupAudio() {
    // Master Effects Chain: Filter -> Reverb -> Delay -> Destination
    const filter = new Tone.Filter(20000, "lowpass");
    const reverb = new Tone.Reverb(2.5);
    const delay = new Tone.PingPongDelay("8n", 0.2);
    filter.chain(reverb, delay, Tone.Destination);
    const masterBus = filter;
    
    const synths = {
        kick: new Tone.MembraneSynth({ 
            pitchDecay: 0.05, 
            octaves: 10, 
            oscillator: { type: "sine" }, 
            envelope: { 
                attack: 0.001, 
                decay: 0.4, 
                sustain: 0.01, 
                release: 1.4, 
                attackCurve: "exponential" 
            } 
        }).connect(masterBus),
        snare: new Tone.NoiseSynth({ 
            noise: { type: 'white' }, 
            envelope: { attack: 0.005, decay: 0.1, sustain: 0 } 
        }).connect(masterBus),
        hihat: new Tone.MetalSynth({ 
            frequency: 300, 
            envelope: { attack: 0.001, decay: 0.1, release: 0.01 }, 
            harmonicity: 5.1, 
            modulationIndex: 32, 
            resonance: 4000, 
            octaves: 1.5 
        }).connect(masterBus),
        tom: new Tone.MembraneSynth({ 
            pitchDecay: 0.1, 
            octaves: 4 
        }).connect(masterBus),
        synth: new Tone.PolySynth(Tone.Synth, { 
            oscillator: { type: 'fatsawtooth' }, 
            envelope: { 
                attack: 0.02, 
                decay: 0.3, 
                sustain: 0.6, 
                release: 1 
            } 
        }).connect(masterBus),
        bass: new Tone.MonoSynth({ 
            oscillator: { type: 'fmsquare' }, 
            envelope: { 
                attack: 0.01, 
                decay: 0.2, 
                sustain: 0.4, 
                release: 0.8 
            } 
        }).connect(masterBus),
    };
    
    const effects = { filter, reverb, delay };
    
    return { synths, effects };
}

/**
 * Update audio effects parameters
 * @param {object} effects - Effects object
 * @param {object} values - Object with reverb, delay, filterCutoff, filterResonance values (0-100)
 */
export function updateEffects(effects, values) {
    if (!effects) return;
    
    if (values.reverb !== undefined) {
        effects.reverb.wet.value = values.reverb / 100;
    }
    
    if (values.delay !== undefined) {
        effects.delay.feedback.value = values.delay / 110;
    }
    
    if (values.filterCutoff !== undefined) {
        // Logarithmic mapping for filter frequency
        const cutoffValue = values.filterCutoff / 100; // 0 to 1
        const minFreq = 40;
        const maxFreq = 20000;
        effects.filter.frequency.value = minFreq * Math.pow(maxFreq / minFreq, cutoffValue);
    }
    
    if (values.filterResonance !== undefined) {
        effects.filter.Q.value = (values.filterResonance / 100) * 20;
    }
}

/**
 * Update synth waveform
 * @param {object} synths - Synths object
 * @param {string} waveform - Waveform type
 */
export function updateWaveform(synths, waveform) {
    if (synths && synths.synth) {
        synths.synth.set({ oscillator: { type: waveform } });
    }
}

/**
 * Trigger a note for an instrument
 * @param {object} synths - Synths object
 * @param {string} instrument - Instrument name
 * @param {object} value - Note value object
 * @param {number} time - Time to trigger
 */
export function triggerNote(synths, instrument, value, time) {
    if (!synths || !synths[instrument]) return;
    
    let finalValue = value;
    
    // Handle random note selection
    if (value.random) {
        const randomNote = value.random[Math.floor(Math.random() * value.random.length)];
        // Parse the random note selection
        if (instrument === 'synth' || instrument === 'bass') {
            const noteMatch = randomNote.match(/^([A-G][b#]?\d+)(?::(\d+))?/);
            if (noteMatch) {
                finalValue = { 
                    note: noteMatch[1], 
                    duration: noteMatch[2] ? `${noteMatch[2]}n` : '16n' 
                };
            } else {
                return; // Invalid note in random group
            }
        } else {
            // For drums, random groups don't make sense, but handle gracefully
            return;
        }
    }
    
    // Trigger the appropriate synth
    if (instrument === 'synth') {
        synths.synth.triggerAttackRelease(finalValue.note, finalValue.duration, time);
    } else if (instrument === 'bass') {
        synths.bass.triggerAttackRelease(finalValue.note, finalValue.duration, time);
    } else {
        // Drum instruments
        synths[instrument].triggerAttackRelease('C1', '8n', time, finalValue.velocity);
    }
}

/**
 * Create and start sequences for all instruments
 * @param {Map} instruments - Map of instrument patterns
 * @param {object} synths - Synths object
 * @param {function} onNoteCallback - Callback when note is triggered (instrument, time)
 * @returns {object} - Object with sequences Map and longest pattern length
 */
export function createSequences(instruments, synths, onNoteCallback) {
    const sequences = new Map();
    let longestPattern = 0;
    
    instruments.forEach((pattern, instrument) => {
        if (!synths[instrument]) return;
        
        if (pattern.length > longestPattern) {
            longestPattern = pattern.length;
        }
        
        const seq = new Tone.Sequence((time, value) => {
            if (value) {
                triggerNote(synths, instrument, value, time);
                if (onNoteCallback) {
                    Tone.Draw.schedule(() => onNoteCallback(instrument, time), time);
                }
            }
        }, pattern, '16n').start(0);
        
        sequences.set(instrument, seq);
    });
    
    return { sequences, longestPattern };
}

/**
 * Stop and dispose all sequences
 * @param {Map} sequences - Map of sequences to stop
 */
export function stopSequences(sequences) {
    if (sequences) {
        sequences.forEach(seq => {
            seq.stop();
            seq.dispose();
        });
        sequences.clear();
    }
}

/**
 * Setup transport loop and caret updates
 * @param {number} longestPattern - Length of longest pattern
 * @param {function} caretCallback - Callback for caret updates
 * @returns {number} - Event ID for the scheduled repeat
 */
export function setupTransportLoop(longestPattern, caretCallback) {
    if (longestPattern > 0) {
        Tone.Transport.loop = true;
        Tone.Transport.loopEnd = `${longestPattern}*16n`;
        
        // Use quarter notes for caret updates (more reasonable than 128n)
        const eventId = Tone.Transport.scheduleRepeat(time => {
            Tone.Draw.schedule(() => caretCallback(), time);
        }, '8n'); // Update every 8th note for smooth but not excessive updates
        
        return eventId;
    }
    return null;
}
