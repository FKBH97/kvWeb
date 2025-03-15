/**
 * debugMode.js
 * Provides debugging tools and real-time information displays
 * for development and testing purposes.
 */

const DebugMode = (function() {
    // Private variables
    let enabled = false;
    let debugPanel;
    let fpsValues = [];
    let lastFrameTime = 0;
    let frameCount = 0;
    let fpsUpdateInterval = 500; // Update FPS display every 500ms
    let lastFpsUpdate = 0;
    
    // Debug elements
    let fpsCounter;
    let positionDisplay;
    let nearestObjectDisplay;
    let rocketInfoDisplay;
    let errorLogDisplay;
    
    // Public methods
    return {
        /**
         * Initialize debug mode
         */
        init: function() {
            console.log('Debug Mode initialized');
            
            // Register D key to toggle debug mode
            if (typeof InputManager !== 'undefined' && InputManager.registerKeyListener) {
                InputManager.registerKeyListener('d', function(isPressed) {
                    if (isPressed) {
                        this.toggle();
                    }
                }.bind(this));
                
                // O key to toggle orbit paths
                InputManager.registerKeyListener('o', function(isPressed) {
                    if (isPressed && this.isEnabled() && typeof PlanetSetup !== 'undefined') {
                        if (PlanetSetup.toggleOrbitLines) {
                            const orbitsVisible = PlanetSetup.toggleOrbitLines();
                            this.log(`Orbit paths ${orbitsVisible ? 'shown' : 'hidden'}`);
                        } else {
                            this.logError('toggleOrbitLines not available in PlanetSetup');
                        }
                    }
                }.bind(this));
                
                // L key to show logs
                InputManager.registerKeyListener('l', function(isPressed) {
                    if (isPressed && this.isEnabled()) {
                        this.toggleLogOverlay();
                    }
                }.bind(this));
                
                // X key to reset position
                InputManager.registerKeyListener('x', function(isPressed) {
                    if (isPressed && this.isEnabled() && typeof RocketControls !== 'undefined') {
                        if (RocketControls.resetPosition) {
                            RocketControls.resetPosition();
                            this.log('Rocket position reset');
                        } else {
                            this.logError('resetPosition not available in RocketControls');
                        }
                    }
                }.bind(this));
            } else {
                console.warn('InputManager not available. Debug key bindings disabled.');
                
                // Fallback to direct DOM event listener
                document.addEventListener('keydown', function(event) {
                    if (event.key === 'd' || event.key === 'D') {
                        this.toggle();
                    }
                }.bind(this));
            }
            
            // Create debug panel if it doesn't exist
            this.createDebugPanel();
        },
        
        /**
         * Create the debug panel if it doesn't exist
         */
        createDebugPanel: function() {
            // Check if panel already exists
            debugPanel = document.getElementById('debug-panel');
            
            if (!debugPanel) {
                // Create panel
                debugPanel = document.createElement('div');
                debugPanel.id = 'debug-panel';
                debugPanel.className = 'hidden';
                document.body.appendChild(debugPanel);
                
                // FPS Counter
                const fpsElement = document.createElement('div');
                fpsElement.className = 'debug-element';
                fpsElement.innerHTML = 'FPS: <span id="fps-counter">0</span>';
                debugPanel.appendChild(fpsElement);
                
                // Position Display
                const positionElement = document.createElement('div');
                positionElement.className = 'debug-element';
                positionElement.innerHTML = 'Position: <span id="position-display">X: 0, Y: 0, Z: 0</span>';
                debugPanel.appendChild(positionElement);
                
                // Nearest Object Display
                const nearestElement = document.createElement('div');
                nearestElement.className = 'debug-element';
                nearestElement.innerHTML = 'Nearest: <span id="nearest-object">None</span>';
                debugPanel.appendChild(nearestElement);
                
                // Rocket Info Display
                const rocketElement = document.createElement('div');
                rocketElement.className = 'debug-element';
                rocketElement.id = 'rocket-info';
                rocketElement.innerHTML = 'Rocket: <span id="rocket-status">Not initialized</span>';
                debugPanel.appendChild(rocketElement);
                
                // Error Log Display
                const errorLogElement = document.createElement('div');
                errorLogElement.className = 'debug-element error-log hidden';
                errorLogElement.id = 'error-log';
                errorLogElement.innerHTML = '<strong>Error Log:</strong><div id="error-messages"></div>';
                debugPanel.appendChild(errorLogElement);
                
                // Add styles if needed
                this.addDebugStyles();
            }
            
            // Store references to elements
            fpsCounter = document.getElementById('fps-counter');
            positionDisplay = document.getElementById('position-display');
            nearestObjectDisplay = document.getElementById('nearest-object');
            rocketInfoDisplay = document.getElementById('rocket-status');
            errorLogDisplay = document.getElementById('error-messages');
        },
        
        /**
         * Add necessary styles for debug elements
         */
        addDebugStyles: function() {
            // Check if styles already exist
            if (document.getElementById('debug-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'debug-styles';
            style.textContent = `
                #debug-panel {
                    position: absolute;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(0, 0, 0, 0.8);
                    color: #fff;
                    padding: 10px;
                    border-radius: 5px;
                    font-family: monospace;
                    z-index: 1000;
                    max-width: 80%;
                }
                .debug-element {
                    margin: 5px 0;
                }
                .error-log {
                    max-height: 150px;
                    overflow-y: auto;
                    padding: 5px;
                    border-top: 1px solid #555;
                    margin-top: 10px;
                }
                .error-message {
                    color: #ff4444;
                    margin: 2px 0;
                    font-size: 12px;
                }
                .hidden {
                    display: none;
                }
            `;
            document.head.appendChild(style);
        },
        
        /**
         * Toggle debug mode visibility
         */
        toggle: function() {
            if (!debugPanel) {
                this.createDebugPanel();
            }
            
            enabled = !enabled;
            debugPanel.classList.toggle('hidden');
            
            console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
            
            // Show orbit lines when debug mode is enabled if available
            if (enabled && typeof PlanetSetup !== 'undefined' && PlanetSetup.toggleOrbitLines) {
                if (!PlanetSetup.areOrbitLinesVisible()) {
                    PlanetSetup.toggleOrbitLines();
                }
            }
            
            return enabled;
        },
        
        /**
         * Toggle log overlay visibility
         */
        toggleLogOverlay: function() {
            const errorLog = document.getElementById('error-log');
            if (errorLog) {
                errorLog.classList.toggle('hidden');
            }
        },
        
        /**
         * Check if debug mode is enabled
         * @returns {boolean} Whether debug mode is enabled
         */
        isEnabled: function() {
            return enabled;
        },
        
        /**
         * Update debug information
         * @param {number} timestamp - Current timestamp
         */
        update: function(timestamp) {
            if (!enabled || !debugPanel) return;
            
            // Calculate FPS
            if (timestamp) {
                const elapsed = timestamp - lastFrameTime;
                lastFrameTime = timestamp;
                
                if (elapsed > 0) {
                    // Only update FPS display periodically to avoid excessive DOM updates
                    if (timestamp - lastFpsUpdate > fpsUpdateInterval) {
                        const fps = Math.round(1000 / elapsed);
                        if (fpsCounter) {
                            fpsCounter.textContent = fps;
                        }
                        lastFpsUpdate = timestamp;
                    }
                }
            }
            
            // Update camera position display
            if (positionDisplay && typeof SceneSetup !== 'undefined') {
                const camera = SceneSetup.getCamera();
                if (camera) {
                    positionDisplay.textContent = `X: ${camera.position.x.toFixed(1)}, Y: ${camera.position.y.toFixed(1)}, Z: ${camera.position.z.toFixed(1)}`;
                }
            }
            
            // Update nearest object display
            this.updateNearestObject();
            
            // Update rocket info
            this.updateRocketInfo();
        },
        
        /**
         * Update nearest object information
         */
        updateNearestObject: function() {
            if (!nearestObjectDisplay) return;
            
            try {
                const camera = SceneSetup.getCamera();
                if (!camera) return;
                
                let nearest = 'None';
                let minDistance = Infinity;
                
                // Check distance to sun
                if (typeof SunSetup !== 'undefined' && SunSetup.getSun) {
                    const sun = SunSetup.getSun();
                    if (sun) {
                        const distance = camera.position.distanceTo(sun.position);
                        nearest = `Sun (${distance.toFixed(1)} units)`;
                        minDistance = distance;
                    }
                }
                
                // Check distances to planets
                if (typeof PlanetSetup !== 'undefined' && PlanetSetup.getPlanets) {
                    const planets = PlanetSetup.getPlanets();
                    if (planets && planets.length > 0) {
                        planets.forEach(planetObj => {
                            if (planetObj.planet) {
                                const distance = camera.position.distanceTo(planetObj.planet.position);
                                if (distance < minDistance) {
                                    minDistance = distance;
                                    nearest = `${planetObj.planet.userData.name} (${distance.toFixed(1)} units)`;
                                }
                            }
                        });
                    }
                }
                
                nearestObjectDisplay.textContent = nearest;
            } catch (error) {
                console.error('Error updating nearest object:', error);
            }
        },
        
        /**
         * Update rocket information
         */
        updateRocketInfo: function() {
            if (!rocketInfoDisplay) return;
            
            try {
                if (typeof RocketControls === 'undefined') {
                    rocketInfoDisplay.textContent = 'Not initialized';
                    return;
                }
                
                if (!RocketControls.getPosition || !RocketControls.getSpeed) {
                    rocketInfoDisplay.textContent = 'API unavailable';
                    return;
                }
                
                const position = RocketControls.getPosition();
                const speed = RocketControls.getSpeed();
                const boost = RocketControls.isBoostActive ? RocketControls.isBoostActive() : 'unknown';
                
                if (position) {
                    rocketInfoDisplay.textContent = 
                        `Pos: (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}) | ` +
                        `Speed: ${speed.toFixed(1)} | ` +
                        `Boost: ${boost}`;
                } else {
                    rocketInfoDisplay.textContent = 'Position data unavailable';
                }
            } catch (error) {
                console.error('Error updating rocket info:', error);
                rocketInfoDisplay.textContent = 'Error getting data';
            }
        },
        
        /**
         * Log a debug message to the console and debug panel
         * @param {string} message - Message to log
         */
        log: function(message) {
            console.log(`[DEBUG] ${message}`);
            
            if (!enabled) return;
            
            // Show a temporary notification if HudManager is available
            if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
                HudManager.showNotification(message);
            }
        },
        
        /**
         * Log an error message to the console and debug panel
         * @param {string} message - Error message to log
         * @param {Error} error - Error object (optional)
         */
        logError: function(message, error) {
            if (error) {
                console.error(`[DEBUG ERROR] ${message}`, error);
            } else {
                console.error(`[DEBUG ERROR] ${message}`);
            }
            
            if (!errorLogDisplay) return;
            
            // Add error to the log
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            errorLogDisplay.appendChild(errorElement);
            
            // Scroll to bottom
            errorLogDisplay.scrollTop = errorLogDisplay.scrollHeight;
            
            // Make sure error log is visible
            const errorLog = document.getElementById('error-log');
            if (errorLog && errorLog.classList.contains('hidden')) {
                errorLog.classList.remove('hidden');
            }
            
            // Show a temporary notification if HudManager is available
            if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
                HudManager.showNotification(`ERROR: ${message}`, 'error');
            }
        },

                // Add this function to debugMode.js near the end of the public methods return block
        // (before the final closing brace and parenthesis):

        /**
         * Toggle collision visualization spheres around planets
         */
        toggleCollisionSpheres: function() {
            if (!scene) {
                console.warn('No scene available for collision visualization');
                return false;
            }
            
            // Check if visualization already exists
            const existingSpheres = scene.children.filter(child => 
                child.name && child.name.startsWith('collisionSphere_'));
            
            if (existingSpheres.length > 0) {
                // Remove existing visualization
                existingSpheres.forEach(sphere => {
                    scene.remove(sphere);
                });
                console.log('Collision spheres hidden');
                return false;
            } else {
                // Create visualization
                if (typeof PlanetSetup !== 'undefined' && PlanetSetup.getPlanets) {
                    const planets = PlanetSetup.getPlanets();
                    if (!planets || planets.length === 0) {
                        console.warn('No planets found for collision visualization');
                        return false;
                    }
                    
                    // Add collision sphere for each planet
                    planets.forEach(planetObj => {
                        if (!planetObj.planet) return;
                        
                        const planet = planetObj.planet;
                        const planetRadius = planet.userData.radius || 
                            (planet.geometry ? planet.geometry.parameters.radius : 1);
                        
                        // Get collision distance from RocketControls if available
                        let collisionDistance = 8.0; // Default
                        if (typeof RocketControls !== 'undefined' && 
                            RocketControls.getCollisionDistance) {
                            collisionDistance = RocketControls.getCollisionDistance();
                        }
                        
                        // Create visualization sphere
                        const sphereGeometry = new THREE.SphereGeometry(
                            planetRadius + collisionDistance, 32, 32);
                        const sphereMaterial = new THREE.MeshBasicMaterial({
                            color: 0xFF0000,
                            transparent: true,
                            opacity: 0.1,
                            wireframe: true
                        });
                        
                        const collisionSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                        collisionSphere.name = `collisionSphere_${planet.userData.name}`;
                        
                        // Position at planet
                        collisionSphere.position.copy(planet.position);
                        
                        // Make collision sphere follow planet in its orbit
                        planet.parent.add(collisionSphere);
                    });
                    
                    console.log('Collision spheres visible');
                    return true;
                }
            }
            
            return false;
        },
        
        /**
         * Clear all error messages
         */
        clearErrors: function() {
            if (errorLogDisplay) {
                errorLogDisplay.innerHTML = '';
            }
        },
        
        /**
         * Check if a specific feature or component is available
         * @param {string} componentName - Name of the component
         * @returns {boolean} Whether the component is available
         */
        checkComponent: function(componentName) {
            try {
                const isAvailable = typeof window[componentName] !== 'undefined';
                this.log(`Component ${componentName} is ${isAvailable ? 'available' : 'NOT available'}`);
                return isAvailable;
            } catch (error) {
                this.logError(`Error checking component ${componentName}`, error);
                return false;
            }
        },
        
        /**
         * Diagnose script loading issues
         */
        diagnoseScriptLoading: function() {
            const scripts = document.querySelectorAll('script');
            const loadedScripts = [];
            
            scripts.forEach(script => {
                loadedScripts.push({
                    src: script.src || 'inline',
                    loaded: script.complete,
                    errorEvent: Boolean(script.onerror)
                });
            });
            
            console.table(loadedScripts);
            this.log(`Diagnosed ${scripts.length} scripts. See console for details.`);
        }
    };
})();

// Initialize if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    DebugMode.init();
} else {
    document.addEventListener('DOMContentLoaded', DebugMode.init.bind(DebugMode));
}