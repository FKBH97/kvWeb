/**
 * hudManager.js
 * Manages all HUD elements, notifications, and UI updates.
 */

const HudManager = (function() {
    // Private variables
    let speedIndicator;
    let boostIndicator;
    let planetInfo;
    let dockingPrompt;
    let aiCopilot;
    let ftlButton;
    
    // Notification system
    let notificationContainer;
    let notificationQueue = [];
    let notificationActive = false;
    let notificationTimer = null;
    
    // Fun facts about planets for the AI copilot
    const planetFacts = {
        mercury: [
            "Mercury is the closest planet to the Sun.",
            "A day on Mercury (176 Earth days) is longer than its year (88 Earth days).",
            "Mercury has a thin exosphere instead of a true atmosphere.",
            "Despite being close to the Sun, Mercury has ice in permanently shadowed craters."
        ],
        venus: [
            "Venus rotates backwards compared to other planets.",
            "Venus is the hottest planet in our solar system, despite not being closest to the Sun.",
            "A day on Venus is longer than its year.",
            "Venus has crushing atmospheric pressure, about 90 times that of Earth."
        ],
        earth: [
            "Earth is the only planet not named after a god.",
            "Earth's atmosphere is 78% nitrogen and 21% oxygen.",
            "Earth is the only planet known to have liquid water on its surface.",
            "Earth's magnetic field protects us from harmful solar radiation."
        ],
        mars: [
            "Mars has the largest volcano in the solar system, Olympus Mons.",
            "Mars has two tiny moons, Phobos and Deimos.",
            "The red color of Mars comes from iron oxide (rust) in its soil.",
            "Mars has seasons and polar ice caps like Earth."
        ],
        jupiter: [
            "Jupiter is the largest planet in our solar system.",
            "Jupiter has the strongest magnetic field of all the planets.",
            "The Great Red Spot on Jupiter is a storm that has been raging for over 300 years.",
            "Jupiter has at least 79 moons."
        ],
        saturn: [
            "Saturn's rings are made mostly of ice particles with some rocky debris.",
            "Saturn is the least dense planet in our solar system—it would float in water.",
            "Saturn has over 80 moons, including Titan, which has its own atmosphere.",
            "Saturn's days are just 10.7 hours long despite being a gas giant."
        ],
        uranus: [
            "Uranus rotates on its side due to a past collision.",
            "Uranus is the coldest planet in our solar system despite not being the furthest from the Sun.",
            "Uranus appears blue-green due to methane in its atmosphere.",
            "Uranus has 13 known rings and 27 known moons."
        ],
        neptune: [
            "Neptune has the strongest winds in the solar system, reaching up to 1,200 mph.",
            "Neptune was the first planet to be discovered through mathematical prediction rather than observation.",
            "Neptune completes one orbit around the Sun every 165 Earth years.",
            "Neptune has a dark storm similar to Jupiter's Great Red Spot, called the Great Dark Spot."
        ],
        luna: [
            "The Moon (Luna) is Earth's only natural satellite.",
            "The same side of the Moon always faces Earth due to tidal locking.",
            "The Moon has no atmosphere and thus no weather.",
            "The Moon's gravity affects Earth's tides."
        ]
    };
    
    /**
     * Show a random fun fact about a planet
     * @param {string} planetName - Name of the planet
     */
    function showRandomFact(planetName) {
        try {
            if (!planetFacts[planetName]) return;
            
            const facts = planetFacts[planetName];
            const randomFact = facts[Math.floor(Math.random() * facts.length)];
            
            displayAIMessage(`Fun fact about ${planetName.charAt(0).toUpperCase() + planetName.slice(1)}: ${randomFact}`);
        } catch (error) {
            console.error('Error showing random fact:', error);
        }
    }
    
    /**
     * Display a message in the AI copilot area
     * @param {string} message - Message to display
     */
    function displayAIMessage(message) {
        if (!aiCopilot) return;
        
        const messageElement = document.getElementById('ai-message');
        if (messageElement) {
            messageElement.textContent = message;
            
            // Show the AI copilot panel
            aiCopilot.classList.remove('hidden');
            
            // Hide after 10 seconds
            setTimeout(() => {
                aiCopilot.classList.add('hidden');
            }, 10000);
        }
    }
    
    /**
     * Animate a notification appearing and disappearing
     * @param {string} message - Message to display in notification
     * @param {string} type - Type of notification (info, warning, error)
     */
    function showNotificationElement(message, type = 'info') {
        if (!notificationContainer) return;
        
        // Make container visible
        notificationContainer.classList.remove('hidden');
        
        // Create notification
        const notification = document.createElement('div');
        notification.classList.add('notification');
        
        // Add type-specific classes
        if (type === 'error') {
            notification.classList.add('notification-error');
        } else if (type === 'warning') {
            notification.classList.add('notification-warning');
        }
        
        notification.textContent = message;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Remove after a delay
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.5s forwards';
            setTimeout(() => {
                if (notification.parentNode === notificationContainer) {
                    notificationContainer.removeChild(notification);
                }
                
                // Hide container if no more notifications
                if (notificationContainer.children.length === 0) {
                    notificationContainer.classList.add('hidden');
                }
                
                // Process next notification in queue
                notificationActive = false;
                processNotificationQueue();
            }, 500);
        }, 3000);
    }
    
    /**
     * Process the notification queue
     */
    function processNotificationQueue() {
        if (notificationActive || notificationQueue.length === 0) return;
        
        notificationActive = true;
        const nextNotification = notificationQueue.shift();
        showNotificationElement(nextNotification.message, nextNotification.type);
    }
    
    // Public methods
    return {
        /**
         * Initialize HUD manager and get references to HUD elements
         */
        init: function() {
            // Get references to all HUD elements
            speedIndicator = document.getElementById('speed-indicator');
            boostIndicator = document.getElementById('boost-indicator');
            planetInfo = document.getElementById('planet-info');
            dockingPrompt = document.getElementById('docking-prompt');
            aiCopilot = document.getElementById('ai-copilot');
            ftlButton = document.getElementById('ftl-button');
            notificationContainer = document.getElementById('notification-container');
            
            // Log initialization
            console.log('HUD Manager initialized');
            
            // Set initial values
            this.updateSpeed(0);
            this.updateBoostStatus('ready');
            this.updatePlanetInfo('none');
            
            // Set up FTL button click handler
            if (ftlButton) {
                ftlButton.addEventListener('click', () => {
                    if (typeof FTLSystem !== 'undefined' && FTLSystem.openFTLMenu) {
                        FTLSystem.openFTLMenu();
                    } else {
                        this.showNotification('FTL system not available', 'warning');
                    }
                });
            }
            
            // Display welcome message
            setTimeout(() => {
                this.showNotification('Welcome to the Space Exploration System!');
                
                setTimeout(() => {
                    displayAIMessage('Use WASD keys to navigate, SHIFT to boost, and E to dock when near a planet.');
                }, 3000);
            }, 1000);
        },
        
        /**
         * Update the speed indicator
         * @param {number} speed - Current speed
         */
        updateSpeed: function(speed) {
            if (!speedIndicator) return;
            
            const speedValue = document.getElementById('speed-value');
            if (speedValue) {
                speedValue.textContent = speed.toFixed(2);
                
                // Add visual indication of speed
                if (speed > 0.8) {
                    speedValue.style.color = '#FF5555'; // High speed
                } else if (speed > 0.4) {
                    speedValue.style.color = '#FFAA55'; // Medium speed
                } else {
                    speedValue.style.color = '#AAFFAA'; // Low speed
                }
            }
        },
        
        /**
         * Update the boost status indicator
         * @param {string} status - Boost status ('ready', 'active', 'cooldown')
         */
        updateBoostStatus: function(status) {
            if (!boostIndicator) return;
            
            const boostStatus = document.getElementById('boost-status');
            if (boostStatus) {
                if (status === 'active') {
                    boostStatus.textContent = 'ACTIVE';
                    boostStatus.style.color = '#00FF00'; // Green for active
                    
                    // Add blinking animation
                    boostStatus.style.animation = 'pulse 0.5s infinite alternate';
                } else if (status === 'cooldown') {
                    boostStatus.textContent = 'COOLDOWN';
                    boostStatus.style.color = '#FFA500'; // Orange for cooldown
                    
                    // Add different animation for cooldown
                    boostStatus.style.animation = 'pulse 1.5s infinite alternate';
                } else {
                    boostStatus.textContent = 'READY';
                    boostStatus.style.color = '#00A3E0'; // Blue for ready
                    
                    // Remove animation
                    boostStatus.style.animation = 'none';
                }
            }
        },
        
        /**
         * Update the planet info display
         * @param {string} planetName - Name of the nearest planet
         * @param {number} distance - Distance to the planet (optional)
         */
        updatePlanetInfo: function(planetName, distance) {
            if (!planetInfo) return;
            
            const planetNameElement = document.getElementById('planet-name');
            if (planetNameElement) {
                if (planetName === 'none' || !planetName) {
                    planetNameElement.textContent = 'NONE';
                } else {
                    // Format the planet name
                    const formattedName = planetName.charAt(0).toUpperCase() + planetName.slice(1);
                    
                    // Show distance if provided
                    if (distance !== undefined) {
                        planetNameElement.textContent = `${formattedName} (${distance.toFixed(1)})`;
                    } else {
                        planetNameElement.textContent = formattedName;
                    }
                    
                    // Show a random fact about the planet with a 20% chance
                    if (Math.random() < 0.2) {
                        showRandomFact(planetName.toLowerCase());
                    }
                }
            }
        },
        
        /**
         * Show or hide the docking prompt
         * @param {boolean} show - Whether to show the prompt
         * @param {string} planetName - Name of the planet to dock with (optional)
         */
        updateDockingPrompt: function(show, planetName) {
            if (!dockingPrompt) return;
            
            if (show) {
                dockingPrompt.classList.remove('hidden');
                
                // If planet name is provided, include it in the prompt
                const dockingText = document.getElementById('docking-text');
                if (dockingText && planetName) {
                    dockingText.textContent = `PRESS E TO DOCK WITH ${planetName.toUpperCase()}`;
                } else if (dockingText) {
                    dockingText.textContent = 'PRESS E TO DOCK';
                }
                
                // Show a notification
                this.showNotification(`${planetName || 'Planet'} docking available`);
                
                // Show an AI message
                displayAIMessage(`We're in range to dock with ${planetName || 'the planet'}. Press E to initiate docking sequence.`);
            } else {
                dockingPrompt.classList.add('hidden');
            }
        },
        
        /**
         * Show a notification message
         * @param {string} message - Message to display
         * @param {string} type - Type of notification (info, warning, error)
         */
        showNotification: function(message, type = 'info') {
            // Add to queue
            notificationQueue.push({ message, type });
            
            // Try to process
            if (!notificationActive) {
                processNotificationQueue();
            }
        },
        
        /**
         * Display an AI copilot message
         * @param {string} message - Message to display
         */
        showAIMessage: function(message) {
            displayAIMessage(message);
        },
        
        /**
         * Update the entire HUD with current data
         * @param {Object} data - Data to update the HUD with
         */
        updateHUD: function(data) {
            try {
                if (data.speed !== undefined) {
                    this.updateSpeed(data.speed);
                }
                
                if (data.boostStatus) {
                    this.updateBoostStatus(data.boostStatus);
                }
                
                if (data.nearestPlanet) {
                    this.updatePlanetInfo(data.nearestPlanet.name, data.nearestPlanet.distance);
                }
                
                if (data.canDock !== undefined) {
                    this.updateDockingPrompt(data.canDock, data.nearestPlanet?.name);
                }
            } catch (error) {
                console.error('Error updating HUD:', error);
            }
        },
        
        /**
         * Show an "FTL jump ready" notification
         */
        notifyFTLReady: function() {
            this.showNotification('FTL jump ready');
            displayAIMessage('FTL jump capabilities are now online. Click the FTL button to travel to another system.');
        }
    };
})();

// Initialize if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    HudManager.init();
} else {
    document.addEventListener('DOMContentLoaded', HudManager.init.bind(HudManager));
}