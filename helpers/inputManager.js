/**
 * inputManager.js
 * Centralized handler for all keyboard inputs across the application.
 */

const InputManager = (function() {
    // Private variables
    let keys = {}; // Store state of all keys
    let listeners = {}; // Event listeners for key actions
    let enabled = true; // Global toggle for input processing
    
    // Public methods
    return {
        /**
         * Initialize input manager and set up listeners
         */
        init: function() {
            // Set up event listeners
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
            document.addEventListener('keyup', this.handleKeyUp.bind(this));
            
            console.log('Input Manager initialized');
        },
        
        /**
         * Handle keydown events
         * @param {Event} event - KeyboardEvent
         */
        handleKeyDown: function(event) {
            // Store key state
            keys[event.key.toLowerCase()] = true;
            
            // Skip processing if disabled
            if (!enabled) return;
            
            // Trigger any registered listeners
            if (listeners[event.key.toLowerCase()]) {
                listeners[event.key.toLowerCase()].forEach(callback => callback(true));
            }
            
            // Check for debugging keys that should always work
            if (event.key === 'd' || event.key === 'D') {
                // Debug mode toggle - always works
                return;
            }
        },
        
        /**
         * Handle keyup events
         * @param {Event} event - KeyboardEvent
         */
        handleKeyUp: function(event) {
            // Store key state
            keys[event.key.toLowerCase()] = false;
            
            // Skip processing if disabled
            if (!enabled) return;
            
            // Trigger any registered listeners
            if (listeners[event.key.toLowerCase()]) {
                listeners[event.key.toLowerCase()].forEach(callback => callback(false));
            }
        },
        
        /**
         * Check if a key is currently pressed
         * @param {string} key - Key to check (lowercase)
         * @returns {boolean} True if key is pressed
         */
        isKeyPressed: function(key) {
            return enabled && keys[key.toLowerCase()] === true;
        },
        
        /**
         * Register a callback for a specific key
         * @param {string} key - Key to listen for
         * @param {Function} callback - Function to call when key state changes
         */
        registerKeyListener: function(key, callback) {
            key = key.toLowerCase();
            if (!listeners[key]) {
                listeners[key] = [];
            }
            listeners[key].push(callback);
        },
        
        /**
         * Unregister all callbacks for a specific key
         * @param {string} key - Key to stop listening for
         */
        unregisterKeyListeners: function(key) {
            key = key.toLowerCase();
            listeners[key] = [];
        },
        
        /**
         * Enable or disable all input processing
         * @param {boolean} isEnabled - Whether inputs should be processed
         */
        setEnabled: function(isEnabled) {
            enabled = isEnabled;
            
            // If disabling, reset all key states
            if (!enabled) {
                keys = {};
            }
        },
        
        /**
         * Check if input processing is enabled
         * @returns {boolean} Whether inputs are being processed
         */
        isEnabled: function() {
            return enabled;
        },
        
        /**
         * Get an object containing all currently pressed keys
         * @returns {Object} Object with keys as properties
         */
        getPressedKeys: function() {
            const pressedKeys = {};
            
            for (const key in keys) {
                if (keys[key]) {
                    pressedKeys[key] = true;
                }
            }
            
            return pressedKeys;
        },
        
        /**
         * Reset all key states
         */
        resetKeys: function() {
            keys = {};
        }
    };
})();