/**
 * loggingSystem.js
 * Records key gameplay events and actions for debugging and analytics.
 */

const LoggingSystem = (function() {
    // Private variables
    let logs = [];
    let isEnabled = true;
    let maxLogEntries = 1000; // Limit the size of the log array
    let isLogOverlayOpen = false;
    let logOverlay = null;
    
    // Event types and their importance levels
    const eventTypes = {
        // Core events
        game_initialized: { level: 'info', description: 'Game initialized' },
        error: { level: 'error', description: 'Error occurred' },
        warning: { level: 'warning', description: 'Warning occurred' },
        
        // Rocket events
        rocket_initialized: { level: 'info', description: 'Rocket initialized' },
        rocket_position_reset: { level: 'info', description: 'Rocket position reset' },
        boost_activated: { level: 'info', description: 'Boost activated' },
        boost_ended: { level: 'info', description: 'Boost ended' },
        boost_cooldown_started: { level: 'info', description: 'Boost cooldown started' },
        boost_cooldown_ended: { level: 'info', description: 'Boost cooldown ended' },
        collision_detected: { level: 'warning', description: 'Collision detected' },
        
        // Planet events
        planet_approached: { level: 'info', description: 'Planet approached' },
        docking_available: { level: 'info', description: 'Docking available' },
        docking_initiated: { level: 'info', description: 'Docking initiated' },
        docking_completed: { level: 'info', description: 'Docking completed' },
        undocking_initiated: { level: 'info', description: 'Undocking initiated' },
        undocking_completed: { level: 'info', description: 'Undocking completed' },
        
        // Navigation events
        ftl_menu_opened: { level: 'info', description: 'FTL menu opened' },
        ftl_jump_initiated: { level: 'info', description: 'FTL jump initiated' },
        ftl_jump_completed: { level: 'info', description: 'FTL jump completed' },
        
        // Debug events
        debug_mode_toggled: { level: 'debug', description: 'Debug mode toggled' },
        orbit_lines_toggled: { level: 'debug', description: 'Orbit lines toggled' }
    };
    
    /**
     * Create a log overlay for viewing logs in-game
     */
    function createLogOverlay() {
        // Create overlay container if it doesn't exist
        if (!logOverlay) {
            logOverlay = document.createElement('div');
            logOverlay.id = 'log-overlay';
            logOverlay.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 800px;
                height: 70%;
                background-color: rgba(0, 0, 0, 0.9);
                border: 1px solid #00A3E0;
                border-radius: 5px;
                color: #FFFFFF;
                font-family: monospace;
                padding: 20px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            `;
            
            // Add header
            const header = document.createElement('div');
            header.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 10px;
                border-bottom: 1px solid #555;
                margin-bottom: 10px;
            `;
            
            const title = document.createElement('h2');
            title.textContent = 'Event Log';
            title.style.margin = '0';
            
            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            closeButton.style.cssText = `
                background-color: #333;
                color: #FFF;
                border: 1px solid #555;
                padding: 5px 10px;
                cursor: pointer;
                border-radius: 3px;
            `;
            closeButton.onclick = function() {
                toggleLogOverlay();
            };
            
            header.appendChild(title);
            header.appendChild(closeButton);
            logOverlay.appendChild(header);
            
            // Add filter controls
            const controls = document.createElement('div');
            controls.style.cssText = `
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
            `;
            
            // Add filter by level
            const levelFilter = document.createElement('select');
            levelFilter.id = 'log-level-filter';
            levelFilter.style.cssText = `
                background-color: #333;
                color: #FFF;
                border: 1px solid #555;
                padding: 5px;
                border-radius: 3px;
            `;
            
            const levels = ['all', 'debug', 'info', 'warning', 'error'];
            levels.forEach(level => {
                const option = document.createElement('option');
                option.value = level;
                option.textContent = level.charAt(0).toUpperCase() + level.slice(1);
                levelFilter.appendChild(option);
            });
            
            levelFilter.onchange = function() {
                updateLogDisplay();
            };
            
            const filterLabel = document.createElement('label');
            filterLabel.textContent = 'Filter by level:';
            filterLabel.style.cssText = `
                color: #CCC;
                display: flex;
                align-items: center;
            `;
            filterLabel.appendChild(levelFilter);
            
            // Add search box
            const searchBox = document.createElement('input');
            searchBox.type = 'text';
            searchBox.id = 'log-search';
            searchBox.placeholder = 'Search logs...';
            searchBox.style.cssText = `
                background-color: #333;
                color: #FFF;
                border: 1px solid #555;
                padding: 5px;
                border-radius: 3px;
                flex-grow: 1;
            `;
            
            searchBox.oninput = function() {
                updateLogDisplay();
            };
            
            const searchLabel = document.createElement('label');
            searchLabel.textContent = 'Search:';
            searchLabel.style.cssText = `
                color: #CCC;
                display: flex;
                align-items: center;
                flex-grow: 1;
            `;
            searchLabel.appendChild(searchBox);
            
            controls.appendChild(filterLabel);
            controls.appendChild(searchLabel);
            
            // Add clear button
            const clearButton = document.createElement('button');
            clearButton.textContent = 'Clear Logs';
            clearButton.style.cssText = `
                background-color: #333;
                color: #FFF;
                border: 1px solid #555;
                padding: 5px 10px;
                cursor: pointer;
                border-radius: 3px;
            `;
            clearButton.onclick = function() {
                clearLogs();
                updateLogDisplay();
            };
            
            controls.appendChild(clearButton);
            logOverlay.appendChild(controls);
            
            // Add log content area
            const logContent = document.createElement('div');
            logContent.id = 'log-content';
            logContent.style.cssText = `
                overflow-y: auto;
                flex-grow: 1;
                font-size: 12px;
                line-height: 1.4;
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.3);
                border-radius: 3px;
            `;
            
            logOverlay.appendChild(logContent);
            
            // Add to document body
            document.body.appendChild(logOverlay);
        }
        
        // Hide by default
        logOverlay.style.display = 'none';
    }
    
    /**
     * Toggle the log overlay visibility
     */
    function toggleLogOverlay() {
        if (!logOverlay) {
            createLogOverlay();
        }
        
        isLogOverlayOpen = !isLogOverlayOpen;
        logOverlay.style.display = isLogOverlayOpen ? 'flex' : 'none';
        
        if (isLogOverlayOpen) {
            updateLogDisplay();
        }
    }
    
    /**
     * Update the log display with filtered logs
     */
    function updateLogDisplay() {
        if (!logOverlay) return;
        
        const logContent = document.getElementById('log-content');
        if (!logContent) return;
        
        // Get filter values
        const levelFilter = document.getElementById('log-level-filter');
        const searchBox = document.getElementById('log-search');
        
        const level = levelFilter ? levelFilter.value : 'all';
        const searchTerm = searchBox ? searchBox.value.toLowerCase() : '';
        
        // Filter logs
        const filteredLogs = logs.filter(log => {
            // Filter by level
            if (level !== 'all') {
                const eventInfo = eventTypes[log.event] || { level: 'info' };
                if (eventInfo.level !== level) {
                    return false;
                }
            }
            
            // Filter by search term
            if (searchTerm && !JSON.stringify(log).toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            return true;
        });
        
        // Clear current display
        logContent.innerHTML = '';
        
        // Display filtered logs
        filteredLogs.forEach((log, index) => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            // Determine entry color based on level
            const eventInfo = eventTypes[log.event] || { level: 'info' };
            let color;
            
            switch (eventInfo.level) {
                case 'error':
                    color = '#FF5555';
                    break;
                case 'warning':
                    color = '#FFAA55';
                    break;
                case 'debug':
                    color = '#AAAAAA';
                    break;
                default:
                    color = '#FFFFFF';
            }
            
            logEntry.style.cssText = `
                margin-bottom: 4px;
                padding: 2px 0;
                border-bottom: 1px solid #333;
                color: ${color};
                display: flex;
            `;
            
            // Format timestamp
            const date = new Date(log.timestamp);
            const timestamp = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
            
            // Create timestamp element
            const timestampElement = document.createElement('span');
            timestampElement.textContent = timestamp;
            timestampElement.style.width = '100px';
            timestampElement.style.color = '#888';
            logEntry.appendChild(timestampElement);
            
            // Create event element
            const eventElement = document.createElement('span');
            eventElement.textContent = log.event;
            eventElement.style.width = '180px';
            eventElement.style.fontWeight = 'bold';
            logEntry.appendChild(eventElement);
            
            // Create data element
            const dataElement = document.createElement('span');
            
            // Format the data
            let dataText = '';
            if (log.data) {
                if (typeof log.data === 'string') {
                    dataText = log.data;
                } else {
                    // Format position specially if it exists
                    if (log.data.position) {
                        const pos = log.data.position;
                        dataText += `position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}) `;
                    }
                    
                    // Add other data
                    Object.keys(log.data).forEach(key => {
                        if (key !== 'position') {
                            dataText += `${key}: ${JSON.stringify(log.data[key])} `;
                        }
                    });
                }
            }
            
            dataElement.textContent = dataText;
            dataElement.style.flexGrow = '1';
            logEntry.appendChild(dataElement);
            
            logContent.appendChild(logEntry);
        });
        
        // Scroll to bottom
        logContent.scrollTop = logContent.scrollHeight;
    }
    
    /**
     * Clear all logs
     */
    function clearLogs() {
        logs = [];
        console.log('Logs cleared');
    }
    
    // Public methods
    return {
        /**
         * Initialize the logging system
         */
        init: function() {
            console.log('Logging System initialized');
            
            // Create the log overlay
            createLogOverlay();
            
            // Register keyboard event for log overlay
            if (typeof InputManager !== 'undefined' && InputManager.registerKeyListener) {
                InputManager.registerKeyListener('l', function(isPressed) {
                    if (isPressed && typeof DebugMode !== 'undefined' && DebugMode.isEnabled()) {
                        toggleLogOverlay();
                    }
                });
            } else {
                // Fallback to direct DOM event listener
                document.addEventListener('keydown', function(event) {
                    if ((event.key === 'l' || event.key === 'L') && 
                        typeof DebugMode !== 'undefined' && 
                        DebugMode.isEnabled()) {
                        toggleLogOverlay();
                    }
                });
            }
            
            // Log initialization
            this.logEvent('game_initialized', {
                time: Date.now(),
                url: window.location.href
            });
            
            return this;
        },
        
        /**
         * Log an event
         * @param {string} event - Event type
         * @param {Object} data - Additional event data
         */
        logEvent: function(event, data = {}) {
            if (!isEnabled) return;
            
            // Create log entry
            const logEntry = {
                timestamp: Date.now(),
                event: event,
                data: data
            };
            
            // Add to logs
            logs.push(logEntry);
            
            // Trim logs if exceeding maximum
            if (logs.length > maxLogEntries) {
                logs = logs.slice(logs.length - maxLogEntries);
            }
            
            // Log to console
            const eventInfo = eventTypes[event] || { level: 'info', description: event };
            
            // Format console log based on level
            switch (eventInfo.level) {
                case 'error':
                    console.error(`[LOG] ${event}:`, data);
                    break;
                case 'warning':
                    console.warn(`[LOG] ${event}:`, data);
                    break;
                case 'debug':
                    console.debug(`[LOG] ${event}:`, data);
                    break;
                default:
                    console.log(`[LOG] ${event}:`, data);
            }
            
            // Update log display if open
            if (isLogOverlayOpen) {
                updateLogDisplay();
            }
        },
        
        /**
         * Log an error
         * @param {string} message - Error message
         * @param {Error} error - Error object
         */
        logError: function(message, error) {
            this.logEvent('error', {
                message: message,
                error: error ? error.toString() : 'No error details',
                stack: error && error.stack ? error.stack : 'No stack trace'
            });
        },
        
        /**
         * Log a warning
         * @param {string} message - Warning message
         * @param {Object} data - Additional warning data
         */
        logWarning: function(message, data = {}) {
            this.logEvent('warning', {
                message: message,
                ...data
            });
        },
        
        /**
         * Enable or disable logging
         * @param {boolean} enabled - Whether logging should be enabled
         */
        setEnabled: function(enabled) {
            isEnabled = enabled;
            return this;
        },
        
        /**
         * Check if logging is enabled
         * @returns {boolean} Whether logging is enabled
         */
        isEnabled: function() {
            return isEnabled;
        },
        
        /**
         * Get all logs
         * @returns {Array} Array of log entries
         */
        getLogs: function() {
            return logs.slice(); // Return a copy
        },
        
        /**
         * Toggle the log overlay
         */
        toggleLogOverlay: function() {
            toggleLogOverlay();
        },
        
        /**
         * Clear all logs
         */
        clearLogs: function() {
            clearLogs();
        },
        
        /**
         * Set maximum number of log entries to keep
         * @param {number} max - Maximum number of log entries
         */
        setMaxLogEntries: function(max) {
            maxLogEntries = max;
            
            // Trim logs if needed
            if (logs.length > maxLogEntries) {
                logs = logs.slice(logs.length - maxLogEntries);
            }
            
            return this;
        }
    };
})();

// Initialize if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    LoggingSystem.init();
} else {
    document.addEventListener('DOMContentLoaded', LoggingSystem.init.bind(LoggingSystem));
}