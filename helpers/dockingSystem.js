/**
 * dockingSystem.js
 * Handles docking with planets, including checking proximity, docking, and undocking.
 */

const DockingSystem = (function() {
    // Private variables
    let isDocked = false;
    let currentPlanet = null;
    let dockingAnimationFrameId = null;
    let dockingStartPosition = null;
    let dockingTargetPosition = null;
    let dockingAnimationProgress = 0;
    
    // Constants
    const DOCKING_DISTANCE = 8.0; // Distance at which docking becomes available
    const DOCKING_ANIMATION_DURATION = 3000; // In milliseconds
    
    // Info panel elements
    let planetInfoPanel = null;
    
    /**
     * Create the planet info panel that appears when docked
     */
    function createPlanetInfoPanel() {
        if (planetInfoPanel) return;
        
        // Create the panel
        planetInfoPanel = document.createElement('div');
        planetInfoPanel.id = 'planet-info-panel';
        planetInfoPanel.className = 'docked-ui hidden';
        planetInfoPanel.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            max-width: 600px;
            background-color: rgba(34, 40, 49, 0.95);
            border: 2px solid #00A3E0;
            border-radius: 10px;
            padding: 20px;
            color: #FFFFFF;
            z-index: 100;
            display: none; /* Explicitly set to none to ensure it's hidden */
            flex-direction: column;
            gap: 15px;
        `;
        
        // Add the heading
        const heading = document.createElement('h2');
        heading.id = 'planet-info-heading';
        heading.style.cssText = `
            margin: 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #00A3E0;
            color: #00A3E0;
            text-align: center;
        `;
        planetInfoPanel.appendChild(heading);
        
        // Add the description
        const description = document.createElement('div');
        description.id = 'planet-info-description';
        description.style.cssText = `
            font-size: 16px;
            line-height: 1.5;
        `;
        planetInfoPanel.appendChild(description);
        
        // Add facts section
        const factsHeading = document.createElement('h3');
        factsHeading.textContent = 'Planetary Facts';
        factsHeading.style.cssText = `
            margin: 10px 0 5px 0;
            color: #00A3E0;
        `;
        planetInfoPanel.appendChild(factsHeading);
        
        const factsList = document.createElement('ul');
        factsList.id = 'planet-facts-list';
        factsList.style.cssText = `
            margin: 0;
            padding-left: 20px;
        `;
        planetInfoPanel.appendChild(factsList);
        
        // Add undock button
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: center;
            margin-top: 15px;
        `;
        
        const undockButton = document.createElement('button');
        undockButton.textContent = 'Undock';
        undockButton.style.cssText = `
            background-color: #00A3E0;
            color: #FFFFFF;
            border: none;
            border-radius: 5px;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
        `;
        undockButton.onmouseover = function() {
            this.style.backgroundColor = '#0085B5';
        };
        undockButton.onmouseout = function() {
            this.style.backgroundColor = '#00A3E0';
        };
        undockButton.onclick = function() {
            DockingSystem.exitDocking();
        };
        
        buttonContainer.appendChild(undockButton);
        planetInfoPanel.appendChild(buttonContainer);
        
        // Add to the document
        document.body.appendChild(planetInfoPanel);
    }
    
    /**
     * Update the planet info panel with data from the current planet
     */
    function updatePlanetInfoPanel() {
        if (!planetInfoPanel || !currentPlanet) return;
        
        const planetName = currentPlanet.userData.name;
        
        // Update heading
        const heading = document.getElementById('planet-info-heading');
        if (heading) {
            heading.textContent = planetName.charAt(0).toUpperCase() + planetName.slice(1);
        }
        
        // Update description
        const description = document.getElementById('planet-info-description');
        if (description) {
            description.innerHTML = getPlanetDescription(planetName);
        }
        
        // Update facts
        const factsList = document.getElementById('planet-facts-list');
        if (factsList) {
            factsList.innerHTML = '';
            
            const facts = getPlanetFacts(planetName);
            facts.forEach(fact => {
                const listItem = document.createElement('li');
                listItem.textContent = fact;
                listItem.style.marginBottom = '5px';
                factsList.appendChild(listItem);
            });
        }
        
        // Show the panel
        planetInfoPanel.classList.remove('hidden');
        planetInfoPanel.style.display = 'flex';
    }
    
    /**
     * Get a description for a planet
     * @param {string} planetName - Name of the planet
     * @returns {string} HTML description of the planet
     */
    function getPlanetDescription(planetName) {
        const descriptions = {
            mercury: `Mercury is the smallest and innermost planet in the Solar System. It has a cratered surface and no atmosphere to retain heat, resulting in dramatic temperature variations—from scorching 800°F (430°C) during the day to freezing -290°F (-180°C) at night.`,
            
            venus: `Venus is the second planet from the Sun and Earth's closest planetary neighbor. It's similar in size to Earth but has a thick, toxic atmosphere filled with carbon dioxide and sulfuric acid clouds, creating a runaway greenhouse effect that makes it the hottest planet in our solar system.`,
            
            earth: `Earth, our home planet, is the third planet from the Sun and the only astronomical object known to harbor life. With its diverse ecosystems, abundant liquid water, and protective atmosphere, Earth supports an incredible variety of life forms and habitats.`,
            
            mars: `Mars, the fourth planet from the Sun, is known as the "Red Planet" due to iron oxide (rust) that colors its surface. With its thin atmosphere, polar ice caps, and evidence of ancient rivers and lakes, Mars remains the prime target in the search for past or present extraterrestrial life.`,
            
            jupiter: `Jupiter, the fifth planet from the Sun, is a gas giant and the largest planet in our solar system—so large that all other planets could fit inside it. Its atmosphere features the iconic Great Red Spot, a storm that has been raging for hundreds of years.`,
            
            saturn: `Saturn is the sixth planet from the Sun and is known for its stunning ring system, composed primarily of ice particles with some rocky debris. Despite being the second-largest planet, Saturn is the least dense—it would float in water if you could find a large enough ocean.`,
            
            uranus: `Uranus is the seventh planet from the Sun and rotates on its side due to a past collision. This ice giant has a pale blue-green color from methane in its atmosphere and features a complex system of rings and 27 known moons.`,
            
            neptune: `Neptune, the eighth and most distant planet from the Sun, is a dark, cold world with the strongest winds in the solar system. This ice giant appears blue due to methane in its atmosphere and was the first planet discovered through mathematical predictions rather than direct observation.`,
            
            luna: `Luna, Earth's only natural satellite, is the fifth-largest moon in the solar system. Its gravitational influence is responsible for Earth's tides and the gradual slowing of our planet's rotation. The Moon is the only celestial body beyond Earth that humans have physically visited.`
        };
        
        return descriptions[planetName.toLowerCase()] || 
            `Information about ${planetName} is currently unavailable in the database.`;
    }
    
    /**
     * Get facts about a planet
     * @param {string} planetName - Name of the planet
     * @returns {Array} Array of facts about the planet
     */
    function getPlanetFacts(planetName) {
        const facts = {
            mercury: [
                "Mercury orbits the Sun every 88 Earth days.",
                "A day on Mercury lasts 176 Earth days.",
                "Mercury's surface resembles our Moon with many impact craters.",
                "Despite being close to the Sun, Mercury has ice in permanently shadowed craters at its poles.",
                "Mercury has no atmosphere but instead has a thin exosphere."
            ],
            
            venus: [
                "Venus rotates backwards compared to other planets.",
                "A day on Venus is longer than its year.",
                "Venus has the thickest atmosphere of the terrestrial planets.",
                "The atmospheric pressure on Venus is 92 times that of Earth.",
                "Venus is the hottest planet with surface temperatures around 900°F (475°C)."
            ],
            
            earth: [
                "Earth is the only planet not named after a Greek or Roman deity.",
                "71% of Earth's surface is covered by water.",
                "Earth's atmosphere is 78% nitrogen and 21% oxygen.",
                "Earth's magnetic field protects us from solar radiation.",
                "Earth is the only known planet with active plate tectonics."
            ],
            
            mars: [
                "Mars has the largest volcano in the solar system, Olympus Mons.",
                "Mars has two small moons, Phobos and Deimos.",
                "A year on Mars is 687 Earth days.",
                "Mars has seasons similar to Earth due to its axial tilt.",
                "Mars' atmosphere is primarily carbon dioxide."
            ],
            
            jupiter: [
                "Jupiter has the strongest magnetic field of any planet.",
                "Jupiter has at least 79 moons, including the four large Galilean moons.",
                "The Great Red Spot is a storm that has been raging for over 300 years.",
                "Jupiter's day is only about 10 hours long despite its size.",
                "Jupiter emits more energy than it receives from the Sun."
            ],
            
            saturn: [
                "Saturn's rings are mostly made of ice particles, with some rocky debris.",
                "Saturn has at least 82 moons, including Titan, which has its own atmosphere.",
                "Saturn's average density is less than water, so it would float if placed in a giant bathtub.",
                "Saturn has the most extensive ring system of any planet.",
                "Winds on Saturn can reach speeds of 1,800 km/h (1,100 mph)."
            ],
            
            uranus: [
                "Uranus rotates on its side with an axial tilt of 98 degrees.",
                "Uranus appears blue-green due to methane in its atmosphere.",
                "Uranus has 13 known rings and 27 known moons.",
                "Uranus is the coldest planetary atmosphere in the solar system, despite not being the most distant planet.",
                "Uranus is the only planet named after a Greek deity rather than a Roman one."
            ],
            
            neptune: [
                "Neptune has the strongest winds in the solar system, reaching up to 2,100 km/h (1,300 mph).",
                "Neptune was predicted mathematically before it was observed directly.",
                "Neptune takes 165 Earth years to orbit the Sun.",
                "Neptune has a Great Dark Spot similar to Jupiter's Great Red Spot.",
                "Neptune has 14 known moons, with Triton being the largest."
            ],
            
            luna: [
                "The Moon is gradually moving away from Earth at a rate of about 3.8 cm per year.",
                "The same side of the Moon always faces Earth due to tidal locking.",
                "The Moon has no atmosphere, so its surface experiences extreme temperature variations.",
                "The Moon has a small core, making its overall density lower than Earth's.",
                "The first human landing on the Moon was on July 20, 1969, by Apollo 11 astronauts."
            ]
        };
        
        return facts[planetName.toLowerCase()] || [
            `Information about ${planetName} is currently being updated in the database.`,
            `Check back later for more facts about ${planetName}.`
        ];
    }
    
    /**
     * Run the docking animation
     * @param {number} timestamp - Current animation timestamp
     */
    function runDockingAnimation(timestamp) {
        if (!dockingStartPosition || !dockingTargetPosition || !currentPlanet) {
            cancelAnimationFrame(dockingAnimationFrameId);
            dockingAnimationFrameId = null;
            return;
        }
        
        // Calculate progress (0 to 1)
        const elapsed = timestamp - dockingAnimationProgress;
        const progress = Math.min(elapsed / DOCKING_ANIMATION_DURATION, 1);
        
        // Get rocket if available
        const rocket = typeof RocketControls !== 'undefined' ? RocketControls.getRocketObject() : null;
        
        if (rocket) {
            // Use easing function for smoother animation
            const easedProgress = easeInOutCubic(progress);
            
            // Interpolate position
            const currentPosition = new THREE.Vector3().lerpVectors(
                dockingStartPosition,
                dockingTargetPosition,
                easedProgress
            );
            
            // Update rocket position
            rocket.position.copy(currentPosition);
            
            // Gradually rotate to face the planet
            const startQuaternion = new THREE.Quaternion().copy(rocket.quaternion);
            
            // Create a quaternion that looks from the rocket to the planet
            const targetQuaternion = new THREE.Quaternion();
            const direction = new THREE.Vector3().subVectors(currentPlanet.position, currentPosition).normalize();
            const matrix = new THREE.Matrix4().lookAt(direction, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
            targetQuaternion.setFromRotationMatrix(matrix);
            
            // Interpolate rotation
            rocket.quaternion.slerpQuaternions(startQuaternion, targetQuaternion, easedProgress);
        }
        
        // Check if animation is complete
        if (progress < 1) {
            dockingAnimationFrameId = requestAnimationFrame(runDockingAnimation);
        } else {
            // Animation complete, update UI
            if (typeof HudManager !== 'undefined') {
                HudManager.showNotification('Docking complete');
                HudManager.showAIMessage(`Welcome to ${currentPlanet.userData.name}. You can explore the planet or undock to continue your journey.`);
            }
            
            // Show planet info panel
            updatePlanetInfoPanel();
            
            // Log docking complete
            if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logEvent) {
                LoggingSystem.logEvent('docking_completed', {
                    planet: currentPlanet.userData.name,
                    time: Date.now()
                });
            }
            
            // Clear animation references
            dockingAnimationFrameId = null;
            dockingStartPosition = null;
            dockingTargetPosition = null;
            dockingAnimationProgress = 0;
        }
    }
    
    /**
     * Cubic easing function for smooth animations
     * @param {number} t - Progress from 0 to 1
     * @returns {number} Eased value
     */
    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // Public methods
    return {
        /**
         * Initialize docking system
         */
        init: function() {
            console.log('Docking System initialized');
            
            // Create planet info panel
            createPlanetInfoPanel();
            
            // IMPORTANT: Make sure the panel starts hidden
            if (planetInfoPanel) {
                planetInfoPanel.classList.add('hidden');
                planetInfoPanel.style.display = 'none';
            }
            
            // Register keyboard event for undocking
            if (typeof InputManager !== 'undefined' && InputManager.registerKeyListener) {
                InputManager.registerKeyListener('e', function(isPressed) {
                    if (isPressed && isDocked) {
                        this.exitDocking();
                    }
                }.bind(this));
            }
            
            return this;
        },
        
        /**
         * Check if the rocket is close enough to a planet to dock
         * @param {Object} planet - The planet to check
         * @param {number} distance - Distance to the planet
         */
        checkDockingProximity: function(planet, distance) {
            // Skip if already docked
            if (isDocked) return;
            
            // Get planet radius
            const planetRadius = planet.geometry ? planet.geometry.parameters.radius || 1 : 1;
            
            // Calculate docking threshold based on planet size
            const dockingThreshold = planetRadius + DOCKING_DISTANCE;
            
            if (distance < dockingThreshold) {
                // Enable docking prompt
                if (typeof HudManager !== 'undefined' && HudManager.updateDockingPrompt) {
                    HudManager.updateDockingPrompt(true, planet.userData.name);
                }
                
                // Add event to log if first time approaching this planet
                if (currentPlanet !== planet && typeof LoggingSystem !== 'undefined' && LoggingSystem.logEvent) {
                    LoggingSystem.logEvent('docking_available', {
                        planet: planet.userData.name,
                        distance: distance,
                        threshold: dockingThreshold
                    });
                }
                
                // Update current planet
                currentPlanet = planet;
            } else if (currentPlanet === planet) {
                // Disable docking prompt when moving away
                if (typeof HudManager !== 'undefined' && HudManager.updateDockingPrompt) {
                    HudManager.updateDockingPrompt(false);
                }
                
                // Reset current planet
                currentPlanet = null;
            }
        },
        
        /**
         * Initiate docking with the current planet
         */
        initiateDocking: function() {
            if (isDocked || !currentPlanet) return;
            
            console.log(`Initiating docking with ${currentPlanet.userData.name}`);
            
            try {
                // Log docking initiation
                if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logEvent) {
                    LoggingSystem.logEvent('docking_initiated', {
                        planet: currentPlanet.userData.name,
                        time: Date.now()
                    });
                }
                
                // Get rocket and planet positions
                let rocketPosition;
                if (typeof RocketControls !== 'undefined' && RocketControls.getPosition) {
                    rocketPosition = RocketControls.getPosition();
                } else {
                    // Fallback if RocketControls not available
                    rocketPosition = new THREE.Vector3(0, 0, 0);
                }
                
                const planetPosition = currentPlanet.position.clone();
                
                // Calculate docking position (slightly above planet surface)
                const planetRadius = currentPlanet.geometry ? 
                    currentPlanet.geometry.parameters.radius || 1 : 1;
                
                // Direction from planet to rocket
                const direction = new THREE.Vector3()
                    .subVectors(rocketPosition, planetPosition)
                    .normalize();
                
                // Docking position is planet position + direction * (radius + offset)
                const dockingOffset = 1.5; // Slightly above surface
                const dockingPosition = planetPosition.clone().add(
                    direction.multiplyScalar(planetRadius + dockingOffset)
                );
                
                // Store animation parameters
                dockingStartPosition = rocketPosition.clone();
                dockingTargetPosition = dockingPosition.clone();
                dockingAnimationProgress = performance.now();
                
                // Disable rocket controls during docking
                if (typeof RocketControls !== 'undefined' && RocketControls.setEnabled) {
                    RocketControls.setEnabled(false);
                }
                
                // Disable input system during docking
                if (typeof InputManager !== 'undefined' && InputManager.setEnabled) {
                    InputManager.setEnabled(false);
                }
                
                // Hide docking prompt
                if (typeof HudManager !== 'undefined' && HudManager.updateDockingPrompt) {
                    HudManager.updateDockingPrompt(false);
                }
                
                // Show docking notification
                if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
                    HudManager.showNotification(`Docking with ${currentPlanet.userData.name}`);
                    HudManager.showAIMessage(`Initiating docking sequence with ${currentPlanet.userData.name}. Please stand by...`);
                }
                
                // Start docking animation
                dockingAnimationFrameId = requestAnimationFrame(runDockingAnimation);
                
                // Set docked state
                isDocked = true;
                
            } catch (error) {
                console.error('Error initiating docking:', error);
                
                // Log error
                if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logError) {
                    LoggingSystem.logError('Docking failed', error);
                }
                
                // Show error notification
                if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
                    HudManager.showNotification('Docking failed - system error', 'error');
                }
                
                // Reset docking state
                isDocked = false;
                currentPlanet = null;
                dockingAnimationFrameId = null;
                dockingStartPosition = null;
                dockingTargetPosition = null;
                
                // Re-enable controls
                if (typeof RocketControls !== 'undefined' && RocketControls.setEnabled) {
                    RocketControls.setEnabled(true);
                }
                
                if (typeof InputManager !== 'undefined' && InputManager.setEnabled) {
                    InputManager.setEnabled(true);
                }
            }
        },
        
        /**
         * Exit docking and return to normal flight
         */
        exitDocking: function() {
            if (!isDocked || !currentPlanet) return;
            
            console.log(`Exiting docking with ${currentPlanet.userData.name}`);
            
            try {
                // Log undocking
                if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logEvent) {
                    LoggingSystem.logEvent('undocking_initiated', {
                        planet: currentPlanet.userData.name,
                        time: Date.now()
                    });
                }
                
                // Show notification
                if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
                    HudManager.showNotification(`Undocking from ${currentPlanet.userData.name}`);
                    HudManager.showAIMessage('Undocking sequence initiated. Returning to normal flight controls.');
                }
                
                // Hide planet info panel
                if (planetInfoPanel) {
                    planetInfoPanel.classList.add('hidden');
                    planetInfoPanel.style.display = 'none';
                }
                
                // Move the rocket slightly away from the planet to prevent immediate re-docking
                if (typeof RocketControls !== 'undefined') {
                    const rocketPosition = RocketControls.getPosition();
                    const planetPosition = currentPlanet.position.clone();
                    
                    // Direction from planet to rocket
                    const direction = new THREE.Vector3()
                        .subVectors(rocketPosition, planetPosition)
                        .normalize();
                    
                    // Calculate undock position (move further away from planet)
                    const undockPosition = rocketPosition.clone().add(
                        direction.multiplyScalar(2.0)
                    );
                    
                    // Get rocket object and update position
                    const rocket = RocketControls.getRocketObject();
                    if (rocket) {
                        rocket.position.copy(undockPosition);
                    }
                }
                
                // Re-enable rocket controls
                if (typeof RocketControls !== 'undefined' && RocketControls.setEnabled) {
                    RocketControls.setEnabled(true);
                }
                
                // Re-enable input system
                if (typeof InputManager !== 'undefined' && InputManager.setEnabled) {
                    InputManager.setEnabled(true);
                }
                
                // Log undocking complete
                if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logEvent) {
                    LoggingSystem.logEvent('undocking_completed', {
                        planet: currentPlanet.userData.name,
                        time: Date.now()
                    });
                }
                
                // Reset docking state
                isDocked = false;
                const previousPlanet = currentPlanet;
                currentPlanet = null;
                
                // Show temporary message after undocking
                setTimeout(() => {
                    if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
                        HudManager.showNotification(`Departed from ${previousPlanet.userData.name}`);
                    }
                }, 2000);
                
            } catch (error) {
                console.error('Error exiting docking:', error);
                
                // Log error
                if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logError) {
                    LoggingSystem.logError('Undocking failed', error);
                }
                
                // Show error notification
                if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
                    HudManager.showNotification('Undocking failed - system error', 'error');
                }
                
                // Force reset docking state in case of error
                isDocked = false;
                currentPlanet = null;
                
                // Force re-enable controls in case of error
                if (typeof RocketControls !== 'undefined' && RocketControls.setEnabled) {
                    RocketControls.setEnabled(true);
                }
                
                if (typeof InputManager !== 'undefined' && InputManager.setEnabled) {
                    InputManager.setEnabled(true);
                }
                
                // Hide planet info panel
                if (planetInfoPanel) {
                    planetInfoPanel.classList.add('hidden');
                    planetInfoPanel.style.display = 'none';
                }
            }
        },
        
        /**
         * Check if the rocket is currently docked
         * @returns {boolean} Docked status
         */
        isDocked: function() {
            return isDocked;
        },
        
        /**
         * Get the current docked planet
         * @returns {Object} Current planet or null if not docked
         */
        getCurrentPlanet: function() {
            return currentPlanet;
        },
        
        /**
         * Get the docking distance threshold
         * @returns {number} Docking distance
         */
        getDockingDistance: function() {
            return DOCKING_DISTANCE;
        }
    };
})();

// Initialize if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    DockingSystem.init();
} else {
    document.addEventListener('DOMContentLoaded', DockingSystem.init.bind(DockingSystem));
}