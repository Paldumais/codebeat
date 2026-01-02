/**
 * Parser module for CodeBeat pattern syntax
 * Handles parsing of instrument patterns and note sequences
 */

/**
 * Parse a single line of code into instrument and pattern
 * Splits on FIRST colon only to preserve note durations like C4:8
 * @param {string} line - Raw line of code
 * @param {number} lineNumber - Line number for error reporting
 * @returns {object|null} - Parsed result with instrument, pattern, and warnings
 */
export function parseLine(line, lineNumber) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('--')) {
        return null;
    }
    
    // Split on FIRST colon only (critical bug fix)
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
        return {
            error: true,
            message: `Line ${lineNumber}: Missing colon separator`,
            line: lineNumber
        };
    }
    
    const instrumentName = trimmed.substring(0, colonIndex).trim().toLowerCase();
    const patternStr = trimmed.substring(colonIndex + 1).trim();
    
    if (!instrumentName || !patternStr) {
        return {
            error: true,
            message: `Line ${lineNumber}: Incomplete instrument definition`,
            line: lineNumber
        };
    }
    
    return {
        instrument: instrumentName,
        patternStr: patternStr,
        line: lineNumber
    };
}

/**
 * Parse a pattern string into an array of note objects
 * @param {string} patternStr - Pattern string to parse
 * @param {string} instrument - Instrument name
 * @param {number} lineNumber - Line number for error reporting
 * @returns {object} - Parsed pattern array and warnings
 */
export function parsePattern(patternStr, instrument, lineNumber) {
    const pattern = [];
    const warnings = [];
    let i = 0;
    
    while (i < patternStr.length) {
        const char = patternStr[i];
        let note = null;
        let consumed = 1;
        
        if (char === '(') {
            // Random note selection group
            const endIndex = patternStr.indexOf(')', i);
            if (endIndex === -1) {
                warnings.push(`Line ${lineNumber}: Unclosed random group starting at position ${i}`);
                // Skip to end of string
                consumed = patternStr.length - i;
            } else {
                const content = patternStr.substring(i + 1, endIndex);
                const options = content.split('|').map(s => s.trim()).filter(s => s);
                if (options.length === 0) {
                    warnings.push(`Line ${lineNumber}: Empty random group at position ${i}`);
                } else {
                    note = { random: options };
                }
                consumed = endIndex - i + 1;
            }
        } else if (char === '?' && pattern.length > 0) {
            // Probabilistic trigger
            const lastNote = pattern[pattern.length - 1];
            let probability = 0.5;
            const probChar = patternStr[i + 1];
            if (probChar && /[1-9]/.test(probChar)) {
                probability = parseInt(probChar, 10) / 10;
                consumed = 2;
            }
            note = Math.random() < probability ? lastNote : null;
        } else if (instrument === 'synth' || instrument === 'bass') {
            // Melodic instruments - parse note with optional duration
            const noteMatch = patternStr.substring(i).match(/^([A-G][b#]?\d+)(?::(\d+))?/);
            if (noteMatch) {
                note = { 
                    note: noteMatch[1], 
                    duration: noteMatch[2] ? `${noteMatch[2]}n` : '16n' 
                };
                consumed = noteMatch[0].length;
            } else if (char !== '-' && char !== '.' && char !== ' ') {
                // Unexpected character for melodic instrument
                warnings.push(`Line ${lineNumber}: Unexpected token '${char}' at position ${i} for ${instrument}`);
            }
        } else {
            // Drum instruments
            if (/[1-9]/.test(char)) {
                note = { velocity: parseInt(char) / 9 };
            } else if (char === '*') {
                // Shorthand for medium hit
                note = { velocity: 0.7 };
            } else if (char === 'o' || char === 'O') {
                // Shorthand for accent
                note = { velocity: 0.9 };
            }
            // '-', '.', and ' ' are rests (null)
        }
        
        pattern.push(note);
        i += consumed;
    }
    
    return { pattern, warnings };
}

/**
 * Parse full code and return instrument patterns with warnings
 * @param {string} code - Full code string
 * @param {Array<string>} validInstruments - Array of valid instrument names
 * @returns {object} - Parsed instruments and warnings
 */
export function parseCode(code, validInstruments) {
    const lines = code.split('\n');
    const instruments = new Map();
    const warnings = [];
    const errors = [];
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const parsed = parseLine(line, lineNumber);
        
        if (!parsed) return; // Skip empty/comment lines
        
        if (parsed.error) {
            errors.push(parsed.message);
            return;
        }
        
        const { instrument, patternStr } = parsed;
        
        // Check for unknown instruments
        if (!validInstruments.includes(instrument)) {
            warnings.push(`Line ${lineNumber}: Unknown instrument '${instrument}'`);
            return;
        }
        
        // Parse the pattern
        const { pattern, warnings: patternWarnings } = parsePattern(patternStr, instrument, lineNumber);
        
        warnings.push(...patternWarnings);
        instruments.set(instrument, pattern);
    });
    
    return { instruments, warnings, errors };
}
