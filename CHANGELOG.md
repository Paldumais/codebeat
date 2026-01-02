# Changelog

All notable changes to the CodeBeat project will be documented in this file.

## [Unreleased] - 2026-01-02

### Added
- **Keyboard Shortcuts**:
  - `Ctrl/Cmd + Enter`: Toggle Play/Stop
  - `Ctrl/Cmd + S`: Save custom preset
- **Status Bar**: Real-time status and diagnostics display above the editor
  - Shows parsing errors and warnings with line numbers
  - Displays play/stop status
  - Provides visual feedback for save operations
- **Accessibility Improvements**:
  - ARIA labels and descriptions for all interactive elements
  - Proper `aria-expanded` and `aria-controls` for accordion navigation
  - Full keyboard navigation support for accordion sections
  - Focus-visible styling for better keyboard navigation visibility
  - Skip link for screen reader users
  - Accessible names for all form controls and sliders
- **Enhanced Parser**:
  - Line number tracking for error reporting
  - Warnings for unknown instruments
  - Warnings for malformed random groups (unclosed parentheses)
  - Warnings for unexpected tokens in synth/bass patterns
  - Better error messages with context

### Fixed
- **Critical Parser Bug**: Instrument line parsing now splits on the **first colon only**, preserving note durations like `C4:8` in patterns
- **Transport Event Cleanup**: Improved reliability when stopping playback - all sequences and transport events are properly disposed
- **Caret Performance**: Reduced caret update frequency from `128n` (32nd notes) to `8n` (8th notes) for better performance

### Changed
- **Modular Architecture**: Refactored monolithic inline script into ES6 modules:
  - `assets/js/app.js` - Main CodeBeat class and initialization
  - `assets/js/parser.js` - Pattern parsing with improved error handling
  - `assets/js/audio.js` - Tone.js setup and audio management
  - `assets/js/ui.js` - UI helpers and DOM manipulation
  - `assets/css/app.css` - Custom styles (focus-visible, accessibility)
- **Improved UI Feedback**:
  - Save button now shows visual confirmation
  - Play/Stop button has clear aria-label states
  - BPM display is now a live region for screen readers
- **Better Code Organization**: Separated concerns for easier maintenance and testing

### Technical Details

#### Bug Fixes
**Before**: 
```javascript
const [instrumentName, patternStr] = line.split(':');
```
This would incorrectly split `synth:C4:8` into `['synth', 'C4', '8']`, breaking note durations.

**After**:
```javascript
const colonIndex = trimmed.indexOf(':');
const instrumentName = trimmed.substring(0, colonIndex);
const patternStr = trimmed.substring(colonIndex + 1);
```
Now correctly splits `synth:C4:8` into `instrument='synth'` and `pattern='C4:8'`.

#### Performance Improvements
- Caret updates reduced from every 32nd note to every 8th note
- More efficient DOM manipulation with better scoping
- Cleaner memory management with proper disposal of Tone.js objects

#### Accessibility Enhancements
- All interactive elements now have appropriate ARIA attributes
- Waveform buttons use `aria-pressed` to indicate state
- Accordion properly implements the ARIA accordion pattern
- All sliders have descriptive labels for screen readers

## [1.0.0] - 2025-01-01

### Initial Release
- Basic beat maker with text-based syntax
- Six instruments: kick, snare, hihat, tom, synth, bass
- Probabilistic and generative sequencing
- Master controls: BPM, Swing
- Audio effects: Reverb, Delay, Filter
- Preset system with local storage
- Responsive UI with visual indicators
