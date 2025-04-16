/**
 * dockingSystem.js
 * Handles docking with planets, including checking proximity, docking, and undocking.
 */

const DockingSystem = (function() {
    // Private variables
    let scene;
    let camera;
    let renderer;
    let isDocked = false;
    let currentPlanet = null;
    let dockingAnimationProgress = 0;
    let dockingInterface = null;
    let planetInfoPanel = null;
    let dockingCamera = null;
    let mainCamera = null; // Store reference to main camera
    let cameraTiltX = 0;
    let cameraTiltY = 0;
    const MAX_TILT = Math.PI / 4; // 45 degrees
    const TILT_SPEED = 0.02;
    
    // Message throttling
    let lastMessageTime = 0;
    let lastPlanetMessage = '';
    const MESSAGE_COOLDOWN = 3000; // 3 seconds between messages
    
    // Constants
    const DOCKING_DISTANCE = 30.0;
    const DOCKING_ANIMATION_DURATION = 2000; // ms
    const STATION_DOCK_DISTANCE = 10.0; // Distance to detect space station docking
    
    // Flag to track if the rocket has moved from its initial position
    let hasRocketMoved = false;
    let initialRocketPosition = null;
    
    // Docking checks
    let dockingChecksActive = false;
    
    /**
     * Create the planet info panel that appears when docked
     */
    function createPlanetInfoPanel() {
        if (planetInfoPanel) return;
        
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
            display: none;
            flex-direction: column;
            gap: 15px;
        `;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.id = 'planet-info-close-button';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            color: #00A3E0;
            font-size: 24px;
            cursor: pointer;
            padding: 5px 10px;
            transition: color 0.3s;
        `;
        closeButton.onmouseover = function() {
            this.style.color = '#FFFFFF';
        };
        closeButton.onmouseout = function() {
            this.style.color = '#00A3E0';
        };
        // We'll attach the click handler in showDockingInterface
        planetInfoPanel.appendChild(closeButton);
        
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
        undockButton.id = 'planet-info-undock-button';
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
        // We'll attach the click handler in showDockingInterface
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

            // Start a continuous update to keep the rocket fixed relative to the space station
            if (rocket) {
                const station = getNearestSpaceStation();
                if (station) {
                    const stationPos = new THREE.Vector3();
                    station.getWorldPosition(stationPos);
                    
                    // Position rocket slightly offset from station
                    const offset = new THREE.Vector3(2, 0, 0);
                    offset.applyQuaternion(station.quaternion);
                    rocket.position.copy(stationPos).add(offset);
                    
                    // Make rocket face the planet
                    const planetPos = new THREE.Vector3();
                    currentPlanet.getWorldPosition(planetPos);
                    const direction = new THREE.Vector3().subVectors(planetPos, rocket.position).normalize();
                    const matrix = new THREE.Matrix4().lookAt(direction, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
                    rocket.quaternion.setFromRotationMatrix(matrix);
                }
            }
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
     * Activate docking checks
     */
    function activateDockingChecks() {
        dockingChecksActive = true;
        console.log('Docking checks activated');
        
        // Add debug logging for docking checks
        setInterval(() => {
            if (dockingChecksActive) {
                console.log('Docking checks status:', {
                    active: dockingChecksActive,
                    currentPlanet: currentPlanet ? currentPlanet.userData.name : 'none',
                    isDocked: isDocked
                });
            }
        }, 5000); // Log every 5 seconds
    }
    
    /**
     * Initialize the docking system
     * @param {Object} sceneRef - Three.js scene
     * @param {Object} cameraRef - Main camera
     * @param {Object} rendererRef - Three.js renderer
     */
    function init(sceneRef, cameraRef, rendererRef) {
        scene = sceneRef;
        camera = cameraRef;
        mainCamera = cameraRef; // Store main camera reference
        renderer = rendererRef;
        
        // Create docking camera with closer view
        dockingCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Create planet info panel
        createPlanetInfoPanel();
        
        // Register key listener for docking/undocking
        document.addEventListener('keydown', handleDockingKey.bind(this));
        
        // Register arrow key listeners for camera tilting
        document.addEventListener('keydown', handleCameraTilt.bind(this));
        document.addEventListener('keyup', handleCameraTilt.bind(this));
        
        // Start docking checks
        activateDockingChecks();
        
        // Store initial rocket position if available
        if (typeof RocketControls !== 'undefined') {
            initialRocketPosition = RocketControls.getPosition().clone();
        }
    }
    
    /**
     * Handle space key press for docking/undocking
     * @param {KeyboardEvent} event - The keyboard event
     */
    function handleDockingKey(event) {
        if (event.code === 'Space') {
            console.log('Space key pressed, isDocked:', isDocked, 'canDock:', canDock());
            
            if (isDocked) {
                console.log('Attempting to undock...');
                exitDocking();
            } else if (canDock()) {
                console.log('Attempting to dock...');
                initiateDocking();
            } else {
                console.log('Cannot dock: not close enough to a space station');
                if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
                    HudManager.showNotification('Not close enough to dock', 'warning');
                }
            }
        }
    }
    
    /**
     * Handle camera tilt input
     */
    function handleCameraTilt(event) {
        if (!isDocked) return;
        
        const isKeyDown = event.type === 'keydown';
        
        switch(event.key) {
            case 'ArrowLeft':
                cameraTiltX = isKeyDown ? -TILT_SPEED : 0;
                break;
            case 'ArrowRight':
                cameraTiltX = isKeyDown ? TILT_SPEED : 0;
                break;
            case 'ArrowUp':
                cameraTiltY = isKeyDown ? TILT_SPEED : 0;
                break;
            case 'ArrowDown':
                cameraTiltY = isKeyDown ? -TILT_SPEED : 0;
                break;
        }
    }
    
    /**
     * Check if docking is possible
     * @returns {boolean} Whether docking is possible
     */
    function canDock() {
        if (!currentPlanet || isDocked) return false;
        
        // Get rocket position
        const rocketPos = RocketControls.getPosition();
        
        // Get planet position
        const planetPos = new THREE.Vector3();
        if (currentPlanet.getWorldPosition) {
            currentPlanet.getWorldPosition(planetPos);
        } else if (currentPlanet.position) {
            planetPos.copy(currentPlanet.position);
        } else {
            console.warn('Planet has no position property or getWorldPosition method');
            return false;
        }
        
        // Calculate distance to planet
        const distance = rocketPos.distanceTo(planetPos);
        const planetRadius = currentPlanet.userData.radius || 5;
        
        // Use planet radius for docking distance
        const dockingDistance = planetRadius * 2.5;
        console.log(`Distance to planet: ${distance.toFixed(2)}, threshold: ${dockingDistance.toFixed(2)}`);
        
        return distance <= dockingDistance;
    }
    
    /**
     * Get the nearest space station to the rocket
     * @returns {Object} The nearest space station object or null
     */
    function getNearestSpaceStation() {
        if (!currentPlanet || !currentPlanet.userData.spaceStations) {
            console.log('No space stations data for planet:', currentPlanet?.userData?.name);
            return null;
        }
        
        const rocketPos = RocketControls.getPosition();
        let nearestStation = null;
        let nearestDistance = Infinity;
        
        // Log the space stations array for debugging
        console.log('Space stations for planet:', currentPlanet.userData.name, currentPlanet.userData.spaceStations);
        
        currentPlanet.userData.spaceStations.forEach(stationData => {
            if (!stationData.station) {
                console.log('Station data missing station object:', stationData);
                return;
            }
            
            const stationPos = new THREE.Vector3();
            stationData.station.getWorldPosition(stationPos);
            
            const distance = rocketPos.distanceTo(stationPos);
            console.log(`Station distance: ${distance.toFixed(2)}`);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestStation = stationData.station;
            }
        });
        
        if (nearestStation) {
            console.log(`Found nearest station at distance: ${nearestDistance.toFixed(2)}`);
        } else {
            console.log('No valid stations found');
        }
        
        return nearestStation;
    }
    
    /**
     * Update docking camera position
     */
    function updateDockingCamera() {
        if (!isDocked || !currentPlanet) return;

        // Get planet position
        const planetPosition = new THREE.Vector3();
        if (currentPlanet.getWorldPosition) {
            currentPlanet.getWorldPosition(planetPosition);
        } else if (currentPlanet.position) {
            planetPosition.copy(currentPlanet.position);
        } else {
            console.warn('Planet has no position property or getWorldPosition method');
            return;
        }

        // Get space station position
        const station = getNearestSpaceStation();
        if (!station) {
            console.warn('No space station found for planet:', currentPlanet.userData.name);
            return;
        }
        
        // Get the station's world position
        const stationPosition = new THREE.Vector3();
        station.getWorldPosition(stationPosition);
        
        // Calculate direction from station to planet
        const directionToPlanet = new THREE.Vector3().subVectors(planetPosition, stationPosition).normalize();
        
        // Calculate camera position behind the station relative to planet direction
        const cameraOffset = new THREE.Vector3().copy(directionToPlanet).multiplyScalar(-40); // 40 units behind station
        
        // Apply camera tilt
        const tiltMatrix = new THREE.Matrix4();
        tiltMatrix.makeRotationX(cameraTiltY);
        tiltMatrix.multiply(new THREE.Matrix4().makeRotationY(cameraTiltX));
        
        // Apply tilt to the offset
        const tiltedOffset = cameraOffset.clone().applyMatrix4(tiltMatrix);
        
        // Set camera position relative to station
        dockingCamera.position.copy(stationPosition).add(tiltedOffset);
        
        // Make camera look at planet with slight offset for better perspective
        const lookAtOffset = new THREE.Vector3(0, 2, 0); // Slight upward offset
        dockingCamera.lookAt(planetPosition.clone().add(lookAtOffset));
        
        // Log camera position for debugging
        console.log('Camera position updated:', {
            stationPos: stationPosition.toArray(),
            cameraPos: dockingCamera.position.toArray(),
            planetPos: planetPosition.toArray(),
            directionToPlanet: directionToPlanet.toArray()
        });
    }
    
    /**
     * Initiate docking with the current planet
     */
    function initiateDocking() {
        if (isDocked || !currentPlanet) return;
        
        console.log(`Initiating docking with ${currentPlanet.userData.name}`);
        
        // Get the nearest space station
        const station = getNearestSpaceStation();
        if (!station) {
            console.error('No space station found for docking');
            return;
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
        
        // Switch to docking camera and position it properly
        if (renderer && mainCamera && dockingCamera) {
            // Get planet position
            const planetPos = new THREE.Vector3();
            if (currentPlanet.getWorldPosition) {
                currentPlanet.getWorldPosition(planetPos);
            } else if (currentPlanet.position) {
                planetPos.copy(currentPlanet.position);
            }
            
            // Get station orientation
            const stationQuaternion = new THREE.Quaternion();
            station.getWorldQuaternion(stationQuaternion);
            
            // Position camera behind the station
            const cameraOffset = new THREE.Vector3(0, 0, -10);
            cameraOffset.applyQuaternion(stationQuaternion);
            
            // Set camera position
            dockingCamera.position.copy(stationPos).add(cameraOffset);
            
            // Make camera look at planet
            dockingCamera.lookAt(planetPos);
            
            // Switch to docking camera
            camera = dockingCamera;
            renderer.render(scene, camera);
            console.log('Switched to docking camera');
        }
        
        // Show docking UI
        showDockingInterface();
        
        // Set docked state
        isDocked = true;
        
        // Start docking animation
        dockingAnimationFrameId = requestAnimationFrame(runDockingAnimation);
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
            
            // Attach event handlers using addEventListener for better reliability
            const closeButton = document.getElementById('planet-info-close-button');
            if (closeButton) {
                // Remove any existing event listeners
                closeButton.replaceWith(closeButton.cloneNode(true));
                const newCloseButton = document.getElementById('planet-info-close-button');
                
                // Add the new event listener
                newCloseButton.addEventListener('click', function() {
                    console.log('Close button clicked - hiding modal only');
                    planetInfoPanel.classList.add('hidden');
                    planetInfoPanel.style.display = 'none';
                    
                    // Show a reminder that spacebar can be used to undock
                    if (typeof HudManager !== 'undefined') {
                        HudManager.showNotification('Press SPACE to undock when ready');
                    }
                });
            }
            
            // Attach event handler to undock button
            const undockButton = document.getElementById('planet-info-undock-button');
            if (undockButton) {
                // Remove any existing event listeners
                undockButton.replaceWith(undockButton.cloneNode(true));
                const newUndockButton = document.getElementById('planet-info-undock-button');
                
                // Add the new event listener
                newUndockButton.addEventListener('click', function() {
                    console.log('Undock button clicked');
                    exitDocking();
                });
            }
        }
        
        // Show docking notification
        if (typeof HudManager !== 'undefined') {
            HudManager.showNotification(`Docked at ${currentPlanet.userData.name}`);
            HudManager.showAIMessage(`
                Welcome to ${currentPlanet.userData.name}! You are now docked at a space station.
                Use arrow keys to adjust the camera view.
                Press SPACE to undock when you're ready to continue your journey.
            `);
        }
    }
    
    /**
     * Start checking for docking proximity
     */
    function startDockingChecks() {
        dockingChecksActive = true;
        console.log('Docking checks started');
    }
    
    /**
     * Stop checking for docking proximity
     */
    function stopDockingChecks() {
        dockingChecksActive = false;
        console.log('Docking checks stopped');
    }
    
    /**
     * Exit docking mode
     */
    function exitDocking() {
        if (!isDocked) return;
        
        console.log('Exiting docking mode');
        
        // Reset docking state
        isDocked = false;
        
        // Switch back to main camera
        if (mainCamera) {
            camera = mainCamera;
        }
        
        // Hide docking UI
        if (planetInfoPanel) {
            planetInfoPanel.classList.add('hidden');
            planetInfoPanel.style.display = 'none';
        }
        
        // Re-enable rocket controls
        if (typeof RocketControls !== 'undefined') {
            RocketControls.setEnabled(true);
        }
        
        // Show undocking notification
        if (typeof HudManager !== 'undefined') {
            HudManager.showNotification('Undocked successfully');
        }
        
        // Reset current planet
        currentPlanet = null;
    }
    
    // Public methods
    return {
        /**
         * Initialize the docking system
         * @param {Object} sceneInstance - The Three.js scene
         * @param {Object} cameraInstance - The main camera
         * @param {Object} rendererInstance - The renderer
         */
        init: function(sceneInstance, cameraInstance, rendererInstance) {
            scene = sceneInstance;
            camera = cameraInstance;
            renderer = rendererInstance;
            mainCamera = cameraInstance;
            
            // Create docking camera
            dockingCamera = new THREE.PerspectiveCamera(
                75, // FOV
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            
            // Create planet info panel
            createPlanetInfoPanel();
            
            // Register key listener for docking/undocking
            document.addEventListener('keydown', function(event) {
                if (event.code === 'Space') {
                    handleDockingKey(event);
                }
            });
            
            // Register key listeners for camera tilt
            document.addEventListener('keydown', handleCameraTilt);
            document.addEventListener('keyup', handleCameraTilt);
            
            // Start docking checks
            this.startDockingChecks();
            
            // Store initial rocket position if available
            if (typeof RocketControls !== 'undefined') {
                initialRocketPosition = RocketControls.getPosition().clone();
            }
            
            console.log('Docking system initialized');
        },
        
        /**
         * Check if the rocket is close enough to dock with a planet
         * @param {Object} rocket - The rocket object
         * @param {Object} planet - The planet object
         * @returns {boolean} Whether docking is possible
         */
        checkDockingProximity: function(rocket, planet) {
            if (!rocket || !planet) return false;
            
            // Get rocket position
            const rocketPos = rocket.getWorldPosition(new THREE.Vector3());
            
            // Get planet position
            const planetPos = new THREE.Vector3();
            if (planet.getWorldPosition) {
                planet.getWorldPosition(planetPos);
            } else if (planet.position) {
                planetPos.copy(planet.position);
            } else {
                console.warn('Planet has no position property or getWorldPosition method');
                return false;
            }
            
            // Calculate distance to planet
            const distance = rocketPos.distanceTo(planetPos);
            const planetRadius = planet.userData.radius || 5;
            
            // Use planet radius for docking distance
            const dockingDistance = planetRadius * 2.5;
            
            // Update current planet if within docking range
            if (distance <= dockingDistance) {
                currentPlanet = planet;
                
                // Update HUD
                if (typeof HudManager !== 'undefined') {
                    HudManager.updatePlanetInfo(planet.userData.name);
                }
                
                return true;
            }
            
            return false;
        },
        
        /**
         * Update the docking system
         */
        update: function() {
            if (!isDocked) return;
            
            // Update docking camera
            updateDockingCamera();
            
            // Update UI elements
            if (planetInfoPanel && !planetInfoPanel.classList.contains('hidden')) {
                // Keep UI updated
            }
        },
        
        /**
         * Check if the rocket is currently docked
         * @returns {boolean} Whether the rocket is docked
         */
        isDocked: function() {
            return isDocked;
        },
        
        /**
         * Get the current planet the rocket is docked at
         * @returns {Object} The current planet or null if not docked
         */
        getCurrentPlanet: function() {
            return currentPlanet;
        },
        
        /**
         * Get the docking camera
         * @returns {Object} The docking camera
         */
        getDockingCamera: function() {
            return dockingCamera;
        },
        
        /**
         * Start checking for docking proximity
         */
        startDockingChecks: function() {
            dockingChecksActive = true;
            console.log('Docking checks started');
        },
        
        /**
         * Stop checking for docking proximity
         */
        stopDockingChecks: function() {
            dockingChecksActive = false;
            console.log('Docking checks stopped');
        }
    };
})();

// Initialize if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // Don't auto-initialize, let main script handle it
    console.log('DockingSystem module loaded');
} else {
    document.addEventListener('DOMContentLoaded', function() {
        // Don't auto-initialize, let main script handle it
        console.log('DockingSystem module loaded');
    });
}