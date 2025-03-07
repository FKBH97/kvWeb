/**
 * rocketControls.js
 * Handles rocket movement, boosting, and collision detection.
 * Requires InputManager.js to be loaded first.
 */

const RocketControls = (function() {
    // Private variables
    let scene, camera;
    let rocket; // The rocket 3D object
    let rocketModel; // The loaded model
    let rocketLight; // Light attached to the rocket
    
    // Movement parameters
    let position = new THREE.Vector3(0, 0, 50); // Start position
    let velocity = new THREE.Vector3(0, 0, 0);
    let acceleration = new THREE.Vector3(0, 0, 0);
    
    // Constants
    const ACCELERATION_FACTOR = 0.02;
    const MAX_SPEED = 1.0;
    const FRICTION = 0.95; // Dampening factor
    const BOOST_MULTIPLIER = 2.5;
    const BOOST_DURATION = 2000; // ms
    const BOOST_COOLDOWN = 5000; // ms
    
    // Boost state
    let boostActive = false;
    let boostStartTime = 0;
    let boostEndTime = 0;
    let boostCooldownEnd = 0;
    
    // Collision parameters
    const COLLISION_DISTANCE = 3.0; // Minimum distance to planets
    
    // Cache for planet objects (updated each frame)
    let planets = [];
    
    // Model loader
    let modelLoader;
    
    /**
     * Create a simple rocket model as fallback
     * @returns {Object} THREE.Object3D representing the rocket
     */
    function createSimpleRocket() {
        // Create a group to hold rocket parts
        const rocketGroup = new THREE.Group();
        
        // Create the rocket body
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 1, 4, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xCCCCCC, shininess: 100 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0;
        rocketGroup.add(body);
        
        // Create the rocket nose cone
        const noseGeometry = new THREE.ConeGeometry(0.5, 2, 8);
        const noseMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000, shininess: 100 });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.y = 3;
        rocketGroup.add(nose);
        
        // Create wings
        const wingGeometry = new THREE.BoxGeometry(2, 0.2, 1);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x3366FF, shininess: 100 });
        
        // Left wing
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-1, -1, 0);
        rocketGroup.add(leftWing);
        
        // Right wing
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(1, -1, 0);
        rocketGroup.add(rightWing);
        
        // Create engine flare
        const flareGeometry = new THREE.SphereGeometry(0.7, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const flareMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF6600, 
            transparent: true,
            opacity: 0.8
        });
        const flare = new THREE.Mesh(flareGeometry, flareMaterial);
        flare.position.y = -2;
        flare.rotation.x = Math.PI;
        rocketGroup.add(flare);
        
        // Add a point light for the engine
        const engineLight = new THREE.PointLight(0xFF6600, 1, 10);
        engineLight.position.set(0, -2, 0);
        rocketGroup.add(engineLight);
        rocketLight = engineLight;
        
        // Store reference to the flare for animation
        rocketGroup.userData.flare = flare;
        
        // Rotate to face forward direction
        rocketGroup.rotation.x = Math.PI / 2;
        
        return rocketGroup;
    }
    
    /**
     * Create rocket thrust effects
     * @param {boolean} isAccelerating - Whether the rocket is accelerating
     * @param {boolean} isBoosting - Whether boost is active
     */
    function updateThrustEffects(isAccelerating, isBoosting) {
        if (!rocket || !rocket.userData.flare) return;
        
        const flare = rocket.userData.flare;
        
        if (isAccelerating) {
            // Scale flare based on acceleration and boost
            const boostMultiplier = isBoosting ? 1.5 : 1.0;
            const scaleBase = 0.7 + Math.random() * 0.3; // Add some variation
            
            flare.scale.set(
                scaleBase * boostMultiplier,
                (scaleBase + 0.3) * boostMultiplier, 
                scaleBase * boostMultiplier
            );
            
            // Update engine light intensity
            if (rocketLight) {
                rocketLight.intensity = isBoosting ? 2.0 : 1.0;
            }
        } else {
            // Small idle flare
            const idleScale = 0.4 + Math.random() * 0.1;
            flare.scale.set(idleScale, idleScale, idleScale);
            
            // Dim engine light
            if (rocketLight) {
                rocketLight.intensity = 0.5;
            }
        }
    }
    
    /**
     * Check for collisions with planets and prevent movement
     * @param {THREE.Vector3} newPosition - The proposed new position
     * @returns {THREE.Vector3} Adjusted position after collision check
     */
    function checkCollisions(newPosition) {
        if (!planets || planets.length === 0) return newPosition;
        
        // First, check if we need to update the planet cache
        if (typeof PlanetSetup !== 'undefined' && PlanetSetup.getPlanets) {
            planets = PlanetSetup.getPlanets() || [];
        }
        
        // Check collision with planets
        let adjustedPosition = newPosition.clone();
        let collisionOccurred = false;
        
        for (const planetObj of planets) {
            if (!planetObj.planet) continue;
            
            const planet = planetObj.planet;
            const planetPosition = planet.position.clone();
            const planetRadius = planet.geometry.parameters.radius || 1;
            const distance = planetPosition.distanceTo(newPosition);
            
            // Consider planet radii and a safety margin for collision
            const minDistance = planetRadius + COLLISION_DISTANCE;
            
            if (distance < minDistance) {
                collisionOccurred = true;
                
                // Calculate direction from planet to rocket
                const pushDirection = new THREE.Vector3()
                    .subVectors(newPosition, planetPosition)
                    .normalize();
                
                // Push the rocket out to valid position
                adjustedPosition = planetPosition.clone().add(
                    pushDirection.multiplyScalar(minDistance + 0.1)
                );
                
                // Reduce velocity as a result of collision
                velocity.multiplyScalar(0.6);
                
                // Notify HUD if available
                if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
                    HudManager.showNotification(`Proximity warning: ${planet.userData.name}`);
                }
                
                // Log collision if LoggingSystem is available
                if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logEvent) {
                    LoggingSystem.logEvent('collision_detected', {
                        planet: planet.userData.name,
                        position: adjustedPosition,
                        time: Date.now()
                    });
                }
                
                break; // Handle one collision at a time
            }
        }
        
        return adjustedPosition;
    }
    
    /**
     * Update the camera to follow the rocket
     */
    function updateCamera() {
        if (!camera || !rocket) return;
        
        // Get rocket's forward direction
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(rocket.quaternion);
        
        // Position the camera behind and slightly above the rocket
        const cameraOffset = new THREE.Vector3(0, 2, 8);
        const cameraPosition = position.clone().add(
            cameraOffset.applyQuaternion(rocket.quaternion)
        );
        
        // Smooth camera movement
        camera.position.lerp(cameraPosition, 0.1);
        
        // Make camera look at a point ahead of the rocket
        const lookAtPosition = position.clone().add(
            forward.multiplyScalar(10)
        );
        camera.lookAt(lookAtPosition);
    }
    
    // Public methods
    return {
        /**
         * Initialize rocket controls
         * @param {Object} sceneInstance - Three.js scene
         * @param {Object} cameraInstance - Three.js camera
         * @returns {Promise} Resolves when initialization is complete
         */
        init: async function(sceneInstance, cameraInstance) {
            if (!sceneInstance || !cameraInstance) {
                console.error('Scene and camera are required for RocketControls.init()');
                return Promise.reject('Missing required parameters');
            }
            
            scene = sceneInstance;
            camera = cameraInstance;
            
            // Check if InputManager is available
            if (typeof InputManager === 'undefined') {
                console.error('InputManager is required for RocketControls');
                return Promise.reject('InputManager not found');
            }
            
            try {
                // Create a simple rocket model as a placeholder
                rocket = createSimpleRocket();
                rocket.position.copy(position);
                scene.add(rocket);
                
                console.log('Rocket initialized successfully with placeholder model');
                
                // Try to load the actual rocket model
                /* NOTE: This part would load your actual model
                modelLoader = new THREE.GLTFLoader();
                
                try {
                    const loadedModel = await new Promise((resolve, reject) => {
                        modelLoader.load(
                            'assets/models/rocket.glb',
                            resolve,
                            undefined,
                            reject
                        );
                    });
                    
                    rocketModel = loadedModel.scene;
                    
                    // Replace placeholder with actual model
                    scene.remove(rocket);
                    rocket = rocketModel;
                    
                    // Position and scale the model
                    rocket.position.copy(position);
                    rocket.scale.set(0.5, 0.5, 0.5);
                    
                    // Add to scene
                    scene.add(rocket);
                    
                    console.log('Rocket model loaded successfully');
                } catch (modelError) {
                    console.warn('Failed to load rocket model, using placeholder:', modelError);
                }
                */
                
                // Initialize the position to a good starting point
                this.resetPosition();
                
                // Log successful initialization
                if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logEvent) {
                    LoggingSystem.logEvent('rocket_initialized', {
                        position: position,
                        time: Date.now()
                    });
                }
                
                return Promise.resolve();
            } catch (error) {
                console.error('Error initializing rocket controls:', error);
                return Promise.reject(error);
            }
        },
        
        /**
         * Update rocket position and rotation based on input
         * @param {number} timestamp - Current timestamp for frame
         */
        update: function(timestamp) {
            if (!rocket || !scene) {
                return;
            }
            
            try {
                // Check if input is available
                const inputAvailable = typeof InputManager !== 'undefined' && InputManager.isKeyPressed;
                
                if (inputAvailable) {
                    // Reset acceleration
                    acceleration.set(0, 0, 0);
                    
                    // Movement controls
                    const isThrusting = InputManager.isKeyPressed('w');
                    const isMovingLeft = InputManager.isKeyPressed('a');
                    const isMovingRight = InputManager.isKeyPressed('d');
                    const isMovingUp = InputManager.isKeyPressed('q');
                    const isMovingDown = InputManager.isKeyPressed('e');
                    const isMovingBack = InputManager.isKeyPressed('s');
                    
                    // Check boost key
                    const boostKeyPressed = InputManager.isKeyPressed('shift');
                    
                    // Check if boost should activate
                    if (boostKeyPressed && !boostActive && timestamp > boostCooldownEnd) {
                        boostActive = true;
                        boostStartTime = timestamp;
                        boostEndTime = timestamp + BOOST_DURATION;
                        
                        // Update HUD
                        if (typeof HudManager !== 'undefined' && HudManager.updateBoostStatus) {
                            HudManager.updateBoostStatus('active');
                        }
                        
                        // Log boost activation
                        if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logEvent) {
                            LoggingSystem.logEvent('boost_activated', {
                                position: position,
                                time: Date.now()
                            });
                        }
                        
                        // Show notification
                        if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
                            HudManager.showNotification('Boost activated!');
                        }
                    }
                    
                    // Check if boost should deactivate
                    if (boostActive && timestamp > boostEndTime) {
                        boostActive = false;
                        boostCooldownEnd = timestamp + BOOST_COOLDOWN;
                        
                        // Update HUD
                        if (typeof HudManager !== 'undefined' && HudManager.updateBoostStatus) {
                            HudManager.updateBoostStatus('cooldown');
                        }
                        
                        // Show notification
                        if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
                            HudManager.showNotification('Boost cooldown');
                        }
                    }
                    
                    // Update HUD cooldown status
                    if (!boostActive && timestamp > boostCooldownEnd) {
                        if (typeof HudManager !== 'undefined' && HudManager.updateBoostStatus) {
                            HudManager.updateBoostStatus('ready');
                        }
                    }
                    
                    // Calculate acceleration based on input
                    if (isThrusting) {
                        // Apply forward acceleration in the direction the rocket is facing
                        const forward = new THREE.Vector3(0, 0, -1);
                        forward.applyQuaternion(rocket.quaternion);
                        
                        const thrustAmount = ACCELERATION_FACTOR * (boostActive ? BOOST_MULTIPLIER : 1.0);
                        acceleration.add(forward.multiplyScalar(thrustAmount));
                    }
                    
                    // Apply side-to-side rotation
                    if (isMovingLeft) {
                        rocket.rotation.y += 0.03;
                    }
                    if (isMovingRight) {
                        rocket.rotation.y -= 0.03;
                    }
                    
                    // Apply up/down rotation
                    if (isMovingUp) {
                        rocket.rotation.x += 0.02;
                    }
                    if (isMovingDown) {
                        rocket.rotation.x -= 0.02;
                    }
                    
                    // Apply backward deceleration
                    if (isMovingBack) {
                        // Slow down by applying reverse acceleration
                        const forward = new THREE.Vector3(0, 0, -1);
                        forward.applyQuaternion(rocket.quaternion);
                        
                        // Only apply braking if we're moving
                        if (velocity.length() > 0.01) {
                            acceleration.add(forward.multiplyScalar(-ACCELERATION_FACTOR * 0.7));
                        }
                    }
                    
                    // Update thrust effects
                    updateThrustEffects(isThrusting, boostActive);
                } else {
                    // No input available, apply friction only
                    updateThrustEffects(false, false);
                }
                
                // Apply acceleration to velocity
                velocity.add(acceleration);
                
                // Apply friction/damping
                velocity.multiplyScalar(FRICTION);
                
                // Limit maximum speed
                const currentSpeed = velocity.length();
                const maxSpeed = MAX_SPEED * (boostActive ? BOOST_MULTIPLIER : 1.0);
                
                if (currentSpeed > maxSpeed) {
                    velocity.normalize().multiplyScalar(maxSpeed);
                }
                
                // Calculate new position
                const newPosition = position.clone().add(velocity);
                
                // Check for collisions with planets
                const adjustedPosition = checkCollisions(newPosition);
                
                // Update position
                position.copy(adjustedPosition);
                rocket.position.copy(position);
                
                // Update HUD speed if HudManager is available
                if (typeof HudManager !== 'undefined' && HudManager.updateSpeed) {
                    HudManager.updateSpeed(currentSpeed);
                }
                
                // Check if we're near a planet for docking
                this.checkNearbyPlanets();
                
                // Update camera to follow the rocket
                updateCamera();
            } catch (error) {
                console.error('Error in rocket controls update:', error);
            }
        },
        
        /**
         * Reset rocket position to a safe starting point
         */
        resetPosition: function() {
            try {
                // Set position near Earth (3rd planet)
                if (typeof PlanetSetup !== 'undefined' && PlanetSetup.getPlanets) {
                    const planets = PlanetSetup.getPlanets();
                    
                    if (planets && planets.length >= 3) {
                        const earth = planets[2].planet; // Earth should be the 3rd planet
                        
                        if (earth) {
                            const earthPosition = earth.position.clone();
                            
                            // Position a safe distance from Earth
                            position.set(
                                earthPosition.x + 10,
                                earthPosition.y + 5,
                                earthPosition.z + 10
                            );
                        } else {
                            // Fallback position
                            position.set(30, 5, 30);
                        }
                    } else {
                        // Fallback position
                        position.set(30, 5, 30);
                    }
                } else {
                    // Default position if PlanetSetup is not available
                    position.set(0, 5, 50);
                }
                
                // Reset velocity and acceleration
                velocity.set(0, 0, 0);
                acceleration.set(0, 0, 0);
                
                // Reset boost state
                boostActive = false;
                boostCooldownEnd = 0;
                
                // Update rocket position
                if (rocket) {
                    rocket.position.copy(position);
                    
                    // Reset rotation
                    rocket.rotation.set(Math.PI / 2, 0, 0);
                }
                
                // Update HUD
                if (typeof HudManager !== 'undefined') {
                    if (HudManager.updateSpeed) {
                        HudManager.updateSpeed(0);
                    }
                    if (HudManager.updateBoostStatus) {
                        HudManager.updateBoostStatus('ready');
                    }
                }
                
                // Log the reset
                if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logEvent) {
                    LoggingSystem.logEvent('rocket_position_reset', {
                        position: position,
                        time: Date.now()
                    });
                }
                
                console.log('Rocket position reset');
            } catch (error) {
                console.error('Error resetting rocket position:', error);
            }
        },
        
        /**
         * Check if we're near any planets for docking
         */
        checkNearbyPlanets: function() {
            if (!planets || planets.length === 0 || !position) return;
            
            try {
                // Skip if DockingSystem is not available
                if (typeof DockingSystem === 'undefined' || !DockingSystem.checkDockingProximity) {
                    return;
                }
                
                // Find the nearest planet
                let nearestPlanet = null;
                let nearestDistance = Infinity;
                
                for (const planetObj of planets) {
                    if (!planetObj.planet) continue;
                    
                    const planet = planetObj.planet;
                    const planetPosition = planet.position.clone();
                    const distance = planetPosition.distanceTo(position);
                    
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestPlanet = planet;
                    }
                }
                
                // Check docking proximity if we found a planet
                if (nearestPlanet) {
                    DockingSystem.checkDockingProximity(nearestPlanet, nearestDistance);
                }
            } catch (error) {
                console.error('Error checking nearby planets:', error);
            }
        },
        
        /**
         * Get current rocket position
         * @returns {THREE.Vector3} Current position
         */
        getPosition: function() {
            return position.clone();
        },
        
        /**
         * Get current rocket velocity vector
         * @returns {THREE.Vector3} Current velocity
         */
        getVelocity: function() {
            return velocity.clone();
        },
        
        /**
         * Get current rocket speed
         * @returns {number} Current speed
         */
        getSpeed: function() {
            return velocity.length();
        },
        
        /**
         * Check if boost is currently active
         * @returns {boolean} Boost status
         */
        isBoostActive: function() {
            return boostActive;
        },
        
        /**
         * Get the rocket 3D object
         * @returns {Object} THREE.Object3D representing the rocket
         */
        getRocketObject: function() {
            return rocket;
        },
        
        /**
         * Enable or disable controls
         * @param {boolean} enabled - Whether controls should be enabled
         */
        setEnabled: function(enabled) {
            // This would be used by the docking system
            // when the player is docked at a planet
            if (!enabled) {
                velocity.set(0, 0, 0);
                acceleration.set(0, 0, 0);
                updateThrustEffects(false, false);
            }
        }
    };
})();

// Ensure initialization when the document is fully loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // This will be called by the main script (about.js)
} else {
    document.addEventListener('DOMContentLoaded', function() {
        // This will be called by the main script (about.js)
    });
}