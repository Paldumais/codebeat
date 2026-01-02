/**
 * UI module for CodeBeat
 * Handles DOM manipulation, user feedback, and visual updates
 */

/**
 * Create instrument indicator in the sidebar
 * @param {HTMLElement} container - Container element for indicators
 * @param {string} instrument - Instrument name
 */
export function createInstrumentIndicator(container, instrument) {
    if (!container) return;
    
    const indicatorWrapper = document.createElement('div');
    indicatorWrapper.className = 'flex items-center space-x-2';
    
    const indicatorDot = document.createElement('div');
    indicatorDot.id = `indicator-${instrument}`;
    indicatorDot.className = 'note-indicator w-2 h-2 rounded-full bg-gray-600';
    
    const indicatorLabel = document.createElement('span');
    indicatorLabel.className = 'font-mono text-xs text-gray-400';
    indicatorLabel.textContent = instrument.substring(0, 5);
    
    indicatorWrapper.appendChild(indicatorDot);
    indicatorWrapper.appendChild(indicatorLabel);
    container.appendChild(indicatorWrapper);
}

/**
 * Flash indicator for an instrument
 * @param {string} instrument - Instrument name
 */
export function flashIndicator(instrument) {
    const indicator = document.getElementById(`indicator-${instrument}`);
    if (indicator) {
        indicator.classList.add('active');
        setTimeout(() => indicator.classList.remove('active'), 100);
    }
}

/**
 * Update caret position
 * @param {HTMLElement} caret - Caret element
 * @param {HTMLElement} editor - Editor element
 */
export function updateCaret(caret, editor) {
    if (!caret || !editor) return;
    
    const editorWidth = editor.clientWidth - 32; // Account for padding
    if (editorWidth > 0) {
        const progress = Tone.Transport.progress;
        caret.style.transform = `translateX(${progress * editorWidth}px)`;
    }
}

/**
 * Reset caret to start position
 * @param {HTMLElement} caret - Caret element
 */
export function resetCaret(caret) {
    if (caret) {
        caret.style.transform = 'translateX(0px)';
    }
}

/**
 * Show diagnostics/warnings in the status bar
 * @param {HTMLElement} statusBar - Status bar element
 * @param {Array<string>} warnings - Array of warning messages
 * @param {Array<string>} errors - Array of error messages
 */
export function showDiagnostics(statusBar, warnings, errors) {
    if (!statusBar) return;
    
    if (errors.length > 0) {
        statusBar.className = 'px-4 py-2 text-xs bg-red-900/50 border-b border-red-700 text-red-200';
        statusBar.textContent = `❌ ${errors.length} error${errors.length > 1 ? 's' : ''}: ${errors[0]}`;
        statusBar.title = errors.join('\n');
    } else if (warnings.length > 0) {
        statusBar.className = 'px-4 py-2 text-xs bg-yellow-900/50 border-b border-yellow-700 text-yellow-200';
        statusBar.textContent = `⚠️ ${warnings.length} warning${warnings.length > 1 ? 's' : ''}: ${warnings[0]}`;
        statusBar.title = warnings.join('\n');
    } else {
        statusBar.className = 'px-4 py-2 text-xs bg-green-900/50 border-b border-green-700 text-green-200';
        statusBar.textContent = '✓ Ready';
        statusBar.title = '';
    }
}

/**
 * Show status message in the status bar
 * @param {HTMLElement} statusBar - Status bar element
 * @param {string} message - Status message
 * @param {string} type - Type: 'info', 'success', 'warning', 'error'
 */
export function showStatus(statusBar, message, type = 'info') {
    if (!statusBar) return;
    
    const typeClasses = {
        info: 'bg-blue-900/50 border-blue-700 text-blue-200',
        success: 'bg-green-900/50 border-green-700 text-green-200',
        warning: 'bg-yellow-900/50 border-yellow-700 text-yellow-200',
        error: 'bg-red-900/50 border-red-700 text-red-200'
    };
    
    statusBar.className = `px-4 py-2 text-xs border-b ${typeClasses[type] || typeClasses.info}`;
    statusBar.textContent = message;
}

/**
 * Show temporary feedback message
 * @param {HTMLElement} element - Element to show feedback near
 * @param {string} message - Message to show
 * @param {number} duration - Duration in ms
 */
export function showFeedback(element, message, duration = 2000) {
    if (!element) return;
    
    const feedback = document.createElement('div');
    feedback.className = 'fixed z-50 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300';
    feedback.textContent = message;
    feedback.style.opacity = '0';
    
    const rect = element.getBoundingClientRect();
    feedback.style.top = `${rect.top - 40}px`;
    feedback.style.left = `${rect.left + rect.width / 2}px`;
    feedback.style.transform = 'translateX(-50%)';
    
    document.body.appendChild(feedback);
    
    // Fade in
    setTimeout(() => {
        feedback.style.opacity = '1';
    }, 10);
    
    // Fade out and remove
    setTimeout(() => {
        feedback.style.opacity = '0';
        setTimeout(() => {
            feedback.remove();
        }, 300);
    }, duration);
}

/**
 * Toggle accordion section with accessibility
 * @param {HTMLElement} header - Accordion header button
 */
export function toggleAccordion(header) {
    if (!header) return;
    
    const content = header.nextElementSibling;
    const icon = header.querySelector('svg');
    const isExpanded = header.getAttribute('aria-expanded') === 'true';
    
    // Close all accordions
    document.querySelectorAll('.accordion-header').forEach(h => {
        h.setAttribute('aria-expanded', 'false');
        const c = h.nextElementSibling;
        if (c) c.style.maxHeight = null;
        const i = h.querySelector('svg');
        if (i) i.style.transform = 'rotate(0deg)';
    });
    
    // Open this one if it wasn't expanded
    if (!isExpanded) {
        header.setAttribute('aria-expanded', 'true');
        content.style.maxHeight = content.scrollHeight + 'px';
        if (icon) icon.style.transform = 'rotate(180deg)';
    }
}

/**
 * Setup keyboard event handlers
 * Note: Should only be called once during initialization to avoid duplicate listeners
 * @param {object} handlers - Object with handler functions
 */
export function setupKeyboardShortcuts(handlers) {
    // Use a named function so we can potentially remove it later
    const keyboardHandler = (e) => {
        // Ctrl/Cmd + Enter: Toggle playback
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (handlers.togglePlay) handlers.togglePlay();
        }
        
        // Ctrl/Cmd + S: Save preset
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (handlers.save) handlers.save();
        }
    };
    
    document.addEventListener('keydown', keyboardHandler);
    
    // Return the handler so it can be removed if needed
    return keyboardHandler;
}

/**
 * Setup accordion keyboard navigation
 * @param {HTMLElement} container - Accordion container
 */
export function setupAccordionKeyboard(container) {
    if (!container) return;
    
    container.addEventListener('keydown', (e) => {
        const header = e.target.closest('.accordion-header');
        if (!header) return;
        
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleAccordion(header);
        }
    });
}

/**
 * Update play button state
 * @param {object} elements - Object with playButton, playText, playIcon elements
 * @param {boolean} isPlaying - Playing state
 * @param {string} stopIconSVG - SVG for stop icon
 * @param {string} playIconSVG - SVG for play icon
 */
export function updatePlayButton(elements, isPlaying, stopIconSVG, playIconSVG) {
    if (!elements.playButton) return;
    
    if (isPlaying) {
        elements.playText.textContent = 'Stop';
        elements.playIcon.innerHTML = stopIconSVG;
        elements.pulseIndicator.classList.add('playing');
        elements.playButton.setAttribute('aria-label', 'Stop playback');
    } else {
        elements.playText.textContent = 'Play';
        elements.playIcon.innerHTML = playIconSVG;
        elements.pulseIndicator.classList.remove('playing');
        elements.playButton.setAttribute('aria-label', 'Start playback');
    }
}

/**
 * Update waveform button selection
 * @param {HTMLElement} selectedButton - Button that was clicked
 */
export function updateWaveformButtons(selectedButton) {
    if (!selectedButton) return;
    
    document.querySelectorAll('.wave-button').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('bg-gray-700/80', 'hover:bg-gray-700');
        btn.setAttribute('aria-pressed', 'false');
    });
    
    selectedButton.classList.add('bg-indigo-600', 'text-white');
    selectedButton.classList.remove('bg-gray-700/80', 'hover:bg-gray-700');
    selectedButton.setAttribute('aria-pressed', 'true');
}
