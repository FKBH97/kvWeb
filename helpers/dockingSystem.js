/**
 * dockingSystem.js
 * Handles docking with planets, including checking proximity, docking, and undocking.
 */

const DockingSystem = (function() {
    // Private variables
    let isDocked = false;
    let currentPlanet = null;
    let dockingStartPosition = null;
    let dockingTargetPosition = null;
    let dockingAnimationProgress = 0;
    let dockingAnimationFrameId = null;
    let planetInfoPanel = null;
    
    // Message throttling
    let lastMessageTime = 0;
    let lastPlanetMessage = '';
    const MESSAGE_COOLDOWN = 3000; // 3 seconds between messages
    
    // Docking camera setup
    let dockingCamera = null;
    let mainCamera = null;
    let scene = null;
    let renderer = null;
    
    // Constants
    const DOCKING_DISTANCE = 30.0;
    const DOCKING_ANIMATION_DURATION = 2000; // ms
    const STATION_DOCK_DISTANCE = 10.0; // Distance to detect space station docking
    
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
    
    /**
     * Initialize the docking system
     * @param {Object} sceneInstance - Three.js scene
     * @param {Object} mainCameraInstance - Main game camera
     * @param {Object} rendererInstance - Three.js renderer
     */
    function init(sceneInstance, mainCameraInstance, rendererInstance) {
        scene = sceneInstance;
        mainCamera = mainCameraInstance;
        renderer = rendererInstance;
        
        // Create docking camera
        dockingCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        
        // Create planet info panel
        createPlanetInfoPanel();
        
        // Add key listener for docking/undocking
        if (typeof InputManager !== 'undefined') {
            InputManager.registerKeyListener('e', handleDockingKey);
        }
    }
    
    /**
     * Handle E key press for docking/undocking
     * @param {boolean} isPressed - Whether the key is pressed
     */
    function handleDockingKey(isPressed) {
        if (!isPressed) return; // Only handle key down
        
        if (isDocked) {
            exitDocking();
        } else if (canDock()) {
            initiateDocking();
        }
    }
    
    /**
     * Check if docking is possible
     * @returns {boolean} Whether docking is possible
     */
    function canDock() {
        if (!currentPlanet || isDocked) return false;
        
        // Get the nearest space station
        const station = getNearestSpaceStation();
        if (!station) return false;
        
        // Check distance to station
        const rocketPos = RocketControls.getPosition();
        const stationPos = new THREE.Vector3();
        station.getWorldPosition(stationPos);
        
        const distance = rocketPos.distanceTo(stationPos);
        return distance < STATION_DOCK_DISTANCE;
    }
    
    /**
     * Get the nearest space station to the rocket
     * @returns {Object} The nearest space station object or null
     */
    function getNearestSpaceStation() {
        if (!currentPlanet || !currentPlanet.userData.spaceStations) return null;
        
        const rocketPos = RocketControls.getPosition();
        let nearestStation = null;
        let nearestDistance = Infinity;
        
        currentPlanet.userData.spaceStations.forEach(stationData => {
            if (!stationData.station) return;
            
            const stationPos = new THREE.Vector3();
            stationData.station.getWorldPosition(stationPos);
            
            const distance = rocketPos.distanceTo(stationPos);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestStation = stationData.station;
            }
        });
        
        return nearestStation;
    }
    
    /**
     * Update docking camera position
     */
    function updateDockingCamera() {
        if (!isDocked || !currentPlanet) return;
        
        const station = getNearestSpaceStation();
        if (!station) return;
        
        // Position camera to view both station and planet
        const stationPos = new THREE.Vector3();
        station.getWorldPosition(stationPos);
        
        const planetPos = new THREE.Vector3();
        currentPlanet.getWorldPosition(planetPos);
        
        // Calculate camera position
        const offset = new THREE.Vector3().subVectors(stationPos, planetPos).normalize();
        const cameraPos = stationPos.clone().add(offset.multiplyScalar(20));
        cameraPos.y += 10; // Raise camera slightly
        
        dockingCamera.position.copy(cameraPos);
        dockingCamera.lookAt(stationPos);
    }
    
    /**
     * Initiate docking with the current planet
     */
    function initiateDocking() {
        if (isDocked || !currentPlanet || !canDock()) return;
        
        console.log(`Initiating docking with ${currentPlanet.userData.name}`);
        
        try {
            // Log docking initiation
            if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logEvent) {
                LoggingSystem.logEvent('docking_initiated', {
                    planet: currentPlanet.userData.name,
                    time: Date.now()
                });
            }
            
            // Get the nearest space station
            const station = getNearestSpaceStation();
            if (!station) {
                throw new Error('No space station found for docking');
            }
            
            // Get station position
            const stationPos = new THREE.Vector3();
            station.getWorldPosition(stationPos);
            
            // Store animation parameters
            dockingStartPosition = RocketControls.getPosition().clone();
            dockingTargetPosition = stationPos.clone();
            dockingAnimationProgress = performance.now();
            
            // Disable rocket controls
            if (typeof RocketControls !== 'undefined') {
                RocketControls.setEnabled(false);
            }
            
            // Switch to docking camera
            if (renderer) {
                renderer.render(scene, dockingCamera);
            }
            
            // Show docking UI
            showDockingInterface();
            
            // Set docked state
            isDocked = true;
            
            // Start docking animation
            dockingAnimationFrameId = requestAnimationFrame(runDockingAnimation);
            
        } catch (error) {
            console.error('Error initiating docking:', error);
            exitDocking();
        }
    }
    
    /**
     * Show the docking interface
     */
    function showDockingInterface() {
        if (!currentPlanet) return;
        
        // Update planet info panel
        updatePlanetInfoPanel();
        
        // Show the panel
        if (planetInfoPanel) {
            planetInfoPanel.classList.remove('hidden');
            planetInfoPanel.style.display = 'block';
        }
        
        // Show docking notification
        if (typeof HudManager !== 'undefined') {
            HudManager.showNotification(`Docked at ${currentPlanet.userData.name} Station`);
            HudManager.showAIMessage(`Welcome to ${currentPlanet.userData.name} Station. Press E to undock.`);
        }
    }
    
    /**
     * Show a notification with throttling
     * @param {string} message - The message to show
     * @param {string} type - The type of message (normal, warning, error)
     * @param {boolean} force - Whether to bypass throttling
     */
    function showThrottledNotification(message, type = 'normal', force = false) {
        const now = Date.now();
        
        // Always show error messages and forced messages
        if (type === 'error' || force) {
            if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
                HudManager.showNotification(message, type);
            }
            lastMessageTime = now;
            return;
        }
        
        // For normal messages, check cooldown and duplicate messages
        if (now - lastMessageTime >= MESSAGE_COOLDOWN && message !== lastPlanetMessage) {
            if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
                HudManager.showNotification(message, type);
            }
            lastMessageTime = now;
            lastPlanetMessage = message;
        }
    }
    
    // Public methods
    return {
        init: init,
        checkDockingProximity: function(planet, distance) {
            // Skip if already docked
            if (isDocked) return;
            
            // Get planet radius and check if it has a space station
            const planetRadius = planet.geometry ? planet.geometry.parameters.radius || 1 : 1;
            const hasStation = planet.userData.spaceStations && planet.userData.spaceStations.length > 0;
            
            // Calculate docking threshold based on planet size
            const dockingThreshold = planetRadius * 3 + DOCKING_DISTANCE;
            
            if (distance < dockingThreshold) {
                // Show planet information regardless of station presence
                if (typeof HudManager !== 'undefined') {
                    if (HudManager.updateDockingPrompt && hasStation) {
                        HudManager.updateDockingPrompt(true, planet.userData.name);
                    }
                    
                    const message = hasStation ? 
                        `Approaching ${planet.userData.name} Station` : 
                        `Entering ${planet.userData.name}'s orbit`;
                        
                    if (currentPlanet !== planet) {
                        showThrottledNotification(message, 'normal', true); // Force first encounter message
                    }
                }
                
                // Log event if first time approaching
                if (currentPlanet !== planet && typeof LoggingSystem !== 'undefined') {
                    LoggingSystem.logEvent('approaching_planet', {
                        planet: planet.userData.name,
                        hasStation: hasStation,
                        distance: distance
                    });
                }
                
                // Update current planet
                currentPlanet = planet;
                
            } else if (currentPlanet === planet) {
                // Disable docking prompt when moving away
                if (typeof HudManager !== 'undefined' && HudManager.updateDockingPrompt) {
                    HudManager.updateDockingPrompt(false);
                }
                
                // Show departure message
                showThrottledNotification(`Leaving ${planet.userData.name}'s vicinity`);
                
                // Reset current planet
                currentPlanet = null;
                lastPlanetMessage = ''; // Reset last message to allow new approaches
            }
        },
        
        update: function() {
            if (isDocked) {
                updateDockingCamera();
            }
        },
        
        isDocked: function() {
            return isDocked;
        },
        
        getCurrentPlanet: function() {
            return currentPlanet;
        },
        
        getDockingCamera: function() {
            return dockingCamera;
        },
        
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
        }
    };
})();

// Initialize if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    DockingSystem.init();
} else {
    document.addEventListener('DOMContentLoaded', DockingSystem.init.bind(DockingSystem));
}