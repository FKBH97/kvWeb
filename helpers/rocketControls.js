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
    const ACCELERATION_FACTOR = 0.01; // Reduced from 0.02
    const MAX_SPEED = 0.25; // Reduced from 1.0
    const FRICTION = 0.93; // Increased friction (reduced from 0.95)
    const BOOST_MULTIPLIER = 1; // Reduced from 2.5
    const BOOST_DURATION = 2000; // ms
    const BOOST_COOLDOWN = 5000; // ms
    
    // Boost state
    let boostActive = false;
    let boostStartTime = 0;
    let boostEndTime = 0;
    let boostCooldownEnd = 0;
    
    // Collision parameters
    const COLLISION_DISTANCE = 8.0; // Increased to work with larger planets
    
    // Cache for planet objects (updated each frame)
    let planets = [];
    
    // Reference to the sun object (updated when checking collisions)
    let sun = null;
    
    // Model loader
    let modelLoader;
    
    /**
     * Load the rocket model
     * @returns {Promise} Resolves with the loaded model
     */
    function loadRocketModel() {
        return new Promise((resolve, reject) => {
            if (!modelLoader) {
                modelLoader = new THREE.GLTFLoader();
            }
            
            modelLoader.load(
                '/sharedAssets/models/rocket.glb',
                (gltf) => {
                    const model = gltf.scene;
                    model.scale.set(0.5, 0.5, 0.5); // Adjust scale as needed
                    model.rotation.x = Math.PI / 2; // Rotate to face forward
                    resolve(model);
                },
                undefined,
                (error) => {
                    console.error('Error loading rocket model:', error);
                    reject(error);
                }
            );
        });
    }
    
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
     * Add engine flame to the rocket
     */
    function addEngineFlame() {
        // Remove any existing flare
        if (rocket.userData && rocket.userData.flare) {
            const oldFlare = rocket.userData.flare;
            rocket.remove(oldFlare);
        }
        
        if (rocketLight) {
            rocket.remove(rocketLight);
        }
        
        // Create new flare
        const flareGeometry = new THREE.SphereGeometry(0.3, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const flareMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF6600, 
            transparent: true,
            opacity: 0.8
        });
        
        // Position the flare at the back of the rocket, considering the Z-scale inversion
        const flare = new THREE.Mesh(flareGeometry, flareMaterial);
        flare.name = 'engineFlare';
        
        // With Z-scale inverted, the back is now in the positive Z direction
        flare.position.set(0, 0, -1.0);
        rocket.add(flare);
        
        // Add light for the engine
        rocketLight = new THREE.PointLight(0xFF6600, 1, 5);
        rocketLight.position.copy(flare.position);
        rocket.add(rocketLight);
        
        // Store reference to the flare for animation
        rocket.userData.flare = flare;
        
        return flare;
    }
    
    /**
     * Update the engine flame position based on movement
     */
    function updateEngineFlame() {
        if (!rocket || !rocket.userData || !rocket.userData.flare) return;
        
        // With our Z-scale inversion, the flame should stay at a fixed position
        // relative to the rocket model, no need for dynamic repositioning
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
            // Small idle flare - FIXED: No random variation when idle
            const idleScale = 0.4; // Removed random variation to prevent spasming
            flare.scale.set(idleScale, idleScale, idleScale);
            
            // Dim engine light
            if (rocketLight) {
                rocketLight.intensity = 0.5;
            }
        }
    }
    
    /**
     * Check for collisions with planets and the sun, and prevent movement
     * @param {THREE.Vector3} newPosition - The proposed new position
     * @returns {THREE.Vector3} Adjusted position after collision check
     */
    function checkCollisions(newPosition) {
        let adjustedPosition = newPosition.clone();
        let collisionOccurred = false;
        
        // First check collision with the sun if available
        if (!sun && typeof SunSetup !== 'undefined' && SunSetup.getSun) {
            sun = SunSetup.getSun();
        }
        
        if (sun) {
            const sunPosition = sun.position.clone();
            
            // Get the actual sun radius from userData or SunSetup
            const sunRadius = (sun.userData && sun.userData.radius) || 
                            (typeof SunSetup !== 'undefined' && SunSetup.SUN_RADIUS) || 
                            150; // Increased fallback radius
            
            // Use a larger collision distance for the sun (it's hotter!)
            const sunCollisionDistance = sunRadius * 0.8; // Make collision distance relative to sun size
            
            const distance = sunPosition.distanceTo(newPosition);
            const minDistance = sunRadius + sunCollisionDistance;
            
            // Add debug logging when very close to the sun
            if (distance < sunRadius * 3) {
                console.log(`Near Sun: distance=${distance.toFixed(2)}, radius=${sunRadius.toFixed(2)}, min=${minDistance.toFixed(2)}`);
            }
            
            if (distance < minDistance) {
                collisionOccurred = true;
                
                // Calculate direction from sun to rocket
                const pushDirection = new THREE.Vector3()
                    .subVectors(newPosition, sunPosition)
                    .normalize();
                
                // Push the rocket out to valid position with a little extra margin for the sun
                adjustedPosition = sunPosition.clone().add(
                    pushDirection.multiplyScalar(minDistance + 2)
                );
                
                // Dramatic velocity reduction for sun collision (it's hot!)
                velocity.multiplyScalar(0.2); // More dramatic velocity reduction
                
                // Notify HUD if available
                if (typeof HudManager !== 'undefined') {
                    if (HudManager.showNotification) {
                        // More dramatic warning for the sun
                        HudManager.showNotification('WARNING: Extreme temperatures detected!', 'error');
                    }
                    
                    // Solar flare message
                    if (HudManager.showAIMessage) {
                        HudManager.showAIMessage('Caution! Solar flares detected. Heat shields at maximum capacity!');
                    }
                }
                
                // Log collision if LoggingSystem is available
                if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logEvent) {
                    LoggingSystem.logEvent('collision_detected', {
                        object: 'sun',
                        position: adjustedPosition,
                        time: Date.now()
                    });
                }
                
                // Add camera shake effect for collision feedback - more dramatic for the sun
                if (camera) {
                    // Store original camera position
                    const originalPos = camera.position.clone();
                    
                    // Stronger shake for sun collision
                    const shakeAmount = 0.4;
                    camera.position.x += (Math.random() - 0.5) * shakeAmount;
                    camera.position.y += (Math.random() - 0.5) * shakeAmount;
                    camera.position.z += (Math.random() - 0.5) * shakeAmount;
                    
                    // Return to original position after a short delay
                    setTimeout(() => {
                        if (camera) {
                            camera.position.lerp(originalPos, 0.5);
                        }
                    }, 100);
                }
                
                // Return early if we've collided with the sun
                return adjustedPosition;
            }
        }
        
        // Continue with existing planet collision detection
        // Always update planets array to ensure we have the latest positions
        if (typeof PlanetSetup !== 'undefined' && PlanetSetup.getPlanets) {
            planets = PlanetSetup.getPlanets() || [];
        }
        
        if (!planets || planets.length === 0) return adjustedPosition;
        
        // Check collision with planets
        for (const planetObj of planets) {
            if (!planetObj.planet) continue;
            
            const planet = planetObj.planet;
            
            // Get the planet's world position by combining pivot and planet positions
            const worldPosition = new THREE.Vector3();
            planet.getWorldPosition(worldPosition);
            
            // Get planet radius from userData, geometry, or fallback
            const planetRadius = (planet.userData && planet.userData.radius) || 
                               (planet.geometry && planet.geometry.parameters.radius) || 
                               5; // Fallback radius
            
            // Increase COLLISION_DISTANCE for better detection
            const COLLISION_DISTANCE = planetRadius * 0.5; // Make collision distance relative to planet size
            
            const distance = worldPosition.distanceTo(adjustedPosition);
            const minDistance = planetRadius + COLLISION_DISTANCE;
            
            // Add debug logging when very close to a planet
            if (distance < planetRadius * 3) {
                console.log(`Near ${planet.userData.name}: distance=${distance.toFixed(2)}, radius=${planetRadius.toFixed(2)}, min=${minDistance.toFixed(2)}, pos=(${worldPosition.x.toFixed(1)}, ${worldPosition.y.toFixed(1)}, ${worldPosition.z.toFixed(1)})`);
            }
            
            if (distance < minDistance) {
                collisionOccurred = true;
                
                // Calculate direction from planet to rocket using world position
                const pushDirection = new THREE.Vector3()
                    .subVectors(adjustedPosition, worldPosition)
                    .normalize();
                
                // Push the rocket out to valid position with more margin
                adjustedPosition = worldPosition.clone().add(
                    pushDirection.multiplyScalar(minDistance + 1)
                );
                
                // Reduce velocity more dramatically on collision
                velocity.multiplyScalar(0.3);
                
                // Notify HUD if available
                if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
                    HudManager.showNotification(`Proximity warning: ${planet.userData.name}`);
                }
                
                // Add visual feedback for collision
                if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
                    HudManager.showNotification(`COLLISION with ${planet.userData.name}!`, 'error');
                }
                
                // Log collision if LoggingSystem is available
                if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logEvent) {
                    LoggingSystem.logEvent('collision_detected', {
                        planet: planet.userData.name,
                        position: adjustedPosition,
                        time: Date.now()
                    });
                }
                
                // Add camera shake effect for collision feedback
                if (camera) {
                    // Store original camera position
                    const originalPos = camera.position.clone();
                    
                    // Small random displacement
                    const shakeAmount = 0.2;
                    camera.position.x += (Math.random() - 0.5) * shakeAmount;
                    camera.position.y += (Math.random() - 0.5) * shakeAmount;
                    camera.position.z += (Math.random() - 0.5) * shakeAmount;
                    
                    // Return to original position after a short delay
                    setTimeout(() => {
                        if (camera) {
                            camera.position.lerp(originalPos, 0.5);
                        }
                    }, 100);
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
        
        // STEP 1: Get the rocket's current movement direction
        let forwardDirection;
        
        if (velocity.length() > 0.01) {
            // Use actual movement direction when moving
            forwardDirection = velocity.clone().normalize();
        } else {
            // Default forward direction based on current orientation
            forwardDirection = new THREE.Vector3(0, 0, -1);
            forwardDirection.applyQuaternion(rocket.quaternion);
        }
        
        // STEP 2: Force camera position BEHIND the rocket
        const backwardDirection = forwardDirection.clone().negate();
        
        // Position camera behind and slightly above the rocket
        const cameraDistance = 10; // Increased distance for better view
        const cameraHeight = 3; // Increased height for better view
        
        const cameraPosition = position.clone()
            .add(backwardDirection.multiplyScalar(cameraDistance))
            .add(new THREE.Vector3(0, cameraHeight, 0));
        
        // STEP 3: Smoothly move camera to this position
        camera.position.lerp(cameraPosition, 0.1);
        
        // STEP 4: Look at the rocket's position plus a bit of its forward direction
        const lookTarget = position.clone().add(
            forwardDirection.clone().multiplyScalar(5) // Increased look-ahead distance
        );
        
        camera.lookAt(lookTarget);
        
        // STEP 5: Update FOV for speed effect
        if (boostActive) {
            const targetFOV = 85; // Increased FOV for boost
            camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.05);
            camera.updateProjectionMatrix();
        } else {
            const targetFOV = 75;
            camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.05);
            camera.updateProjectionMatrix();
        }
    }
    
    /**
     * Initialize the rocket controls
     * @param {Object} sceneInstance - The Three.js scene
     * @param {Object} cameraInstance - The Three.js camera
     */
    async function init(sceneInstance, cameraInstance) {
        scene = sceneInstance;
        camera = cameraInstance;
        
        try {
            // Try to load the rocket model
            rocket = await loadRocketModel();
        } catch (error) {
            console.warn('Using fallback rocket model:', error);
            rocket = createSimpleRocket();
        }
        
        scene.add(rocket);
        
        // Add engine flame
        addEngineFlame();
        
        // Set initial position
        rocket.position.copy(position);
        
        // Log initialization if LoggingSystem is available
        if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logEvent) {
            LoggingSystem.logEvent('rocket_initialized', {
                position: position,
                time: Date.now()
            });
        }
    }
    
    // Public methods
    return {
        /**
         * Initialize rocket controls
         * @param {Object} sceneInstance - Three.js scene
         * @param {Object} cameraInstance - Three.js camera
         * @returns {Promise} Resolves when initialization is complete
         */
        init: init,
        
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
                
                // Track if any movement keys are pressed
                let isAnyMovementKeyPressed = false;
                
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
                    
                    // Check if any movement key is pressed
                    isAnyMovementKeyPressed = isThrusting || isMovingLeft || isMovingRight || 
                                             isMovingUp || isMovingDown || isMovingBack;
                    
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
                
                // Apply stronger friction/damping when no keys are pressed
                if (!isAnyMovementKeyPressed) {
                    velocity.multiplyScalar(0.9); // Stronger damping when idle
                    
                    // If velocity is very small, just zero it out to prevent jitter
                    if (velocity.length() < 0.01) {
                        velocity.set(0, 0, 0);
                    }
                } else {
                    // Normal friction when moving
                    velocity.multiplyScalar(FRICTION);
                }
                
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
                
                // Update engine flame position
                updateEngineFlame();
                
                // Update HUD speed if HudManager is available
                if (typeof HudManager !== 'undefined' && HudManager.updateSpeed) {
                    HudManager.updateSpeed(currentSpeed);
                }
                
                // Check for nearby planets and update docking proximity
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
                    
                    // Important: Make sure there's no residual momentum
                    if (rocket.userData.velocity) {
                        rocket.userData.velocity = new THREE.Vector3(0, 0, 0);
                    }
                    
                    // Reset the thrust effects to idle state
                    updateThrustEffects(false, false);
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
         * Inspect the model structure for debugging
         * @returns {string} Status message
         */
        inspectModelStructure: function() {
            if (!rocket) return "No rocket model found";
            
            // Helper function to print object hierarchy
            function printStructure(object, depth = 0) {
                const indent = ' '.repeat(depth * 2);
                const info = {
                    name: object.name || 'unnamed',
                    type: object.type,
                    children: object.children ? object.children.length : 0,
                    position: object.position ? [
                        object.position.x.toFixed(2),
                        object.position.y.toFixed(2), 
                        object.position.z.toFixed(2)
                    ] : null,
                    rotation: object.rotation ? [
                        object.rotation.x.toFixed(2),
                        object.rotation.y.toFixed(2),
                        object.rotation.z.toFixed(2)
                    ] : null
                };
                
                console.log(`${indent}${info.name} (${info.type}) - Children: ${info.children}`);
                console.log(`${indent}  Position: ${info.position}, Rotation: ${info.rotation}`);
                
                // Recursively process children
                if (object.children && object.children.length > 0) {
                    object.children.forEach(child => {
                        printStructure(child, depth + 1);
                    });
                }
            }
            
            console.log("MODEL STRUCTURE:");
            printStructure(rocket);
            
            return "Model structure printed to console";
        },
        
        /**
         * Check for nearby planets and update docking proximity
         */
        checkNearbyPlanets: function() {
            if (!DockingSystem || typeof DockingSystem.checkDockingProximity !== 'function') {
                console.warn('DockingSystem not available for proximity check');
                return;
            }
            
            // Get current rocket position
            const rocketPosition = this.getCurrentPosition();
            
            // Find the nearest planet
            let nearestPlanet = null;
            let nearestDistance = Infinity;
            
            for (const planetObj of planets) {
                if (!planetObj.planet) continue;
                
                const planet = planetObj.planet;
                
                // Get the planet's world position
                const planetPosition = new THREE.Vector3();
                planet.getWorldPosition(planetPosition);
                
                // Calculate distance to planet
                const distance = planetPosition.distanceTo(rocketPosition);
                
                // Update nearest planet if this one is closer
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestPlanet = planet;
                }
                
                // Log distances for debugging
                if (distance < 1000) { // Only log when reasonably close
                    console.log(`Distance to ${planet.userData.name}: ${distance.toFixed(2)}, position: (${planetPosition.x.toFixed(2)}, ${planetPosition.y.toFixed(2)}, ${planetPosition.z.toFixed(2)})`);
                }
            }
            
            // If we found a nearest planet, check docking proximity
            if (nearestPlanet) {
                DockingSystem.checkDockingProximity(nearestPlanet, nearestDistance);
            }
        },
        
        /**
         * Fine-tune the rocket's orientation in real-time
         * @param {string} axis - 'x', 'y', or 'z' axis to adjust
         * @param {number} amount - Amount to adjust in radians (use small values like 0.1)
         */
        adjustRocketOrientation: function(axis, amount) {
            if (!rocket) return;
            
            amount = amount || 0.1; // Default small adjustment
            
            switch(axis.toLowerCase()) {
                case 'x':
                    rocket.rotation.x += amount;
                    break;
                case 'y':
                    rocket.rotation.y += amount;
                    break;
                case 'z':
                    rocket.rotation.z += amount;
                    break;
            }
            
            console.log(`Rocket rotation: X=${rocket.rotation.x.toFixed(2)}, Y=${rocket.rotation.y.toFixed(2)}, Z=${rocket.rotation.z.toFixed(2)}`);
            return {x: rocket.rotation.x, y: rocket.rotation.y, z: rocket.rotation.z};
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
         * Get the current collision distance setting
         * @returns {number} Current collision distance
         */
        getCollisionDistance: function() {
            return COLLISION_DISTANCE;
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
        },
        
        /**
         * Get the rocket's current position
         * @returns {THREE.Vector3} The rocket's position
         */
        getCurrentPosition: function() {
            return position.clone();
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