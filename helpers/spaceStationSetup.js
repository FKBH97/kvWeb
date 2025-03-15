/**
 * spaceStationSetup.js
 * Creates and manages the space station object in the scene.
 */

const SpaceStationSetup = (function() {
    // Private variables
    let scene;
    let spaceStation;
    let orbitTarget; // Planet that the space station orbits
    let orbitPivot; // Pivot for orbital rotation
    let orbitSpeed = 0.0005; // Slow orbit speed
    let rotationSpeed = 0.0003; // Slow self-rotation speed
    let initialized = false;
    
    // Space station settings
    const stationSettings = {
        scaleFactor: 0.5, // Adjust based on model size
        orbitDistance: 12, // Distance from target planet
        orbitHeight: 3, // Height above orbital plane
        initialOrbitAngle: Math.PI / 4, // Initial position in orbit
        modelPath: 'sharedAssets/models/spaceStation.glb',
        dockingDistance: 10 // Distance at which docking becomes available
    };
    
    /**
     * Create the space station
     * @returns {Promise} Resolves when space station is created
     */
    function createSpaceStation() {
        return new Promise((resolve, reject) => {
            try {
                // Create a model loader
                const modelLoader = new THREE.GLTFLoader();
                
                console.log('Loading space station model from:', stationSettings.modelPath);
                
                modelLoader.load(
                    stationSettings.modelPath,
                    function(gltf) {
                        spaceStation = gltf.scene;
                        
                        // Apply scale
                        spaceStation.scale.set(
                            stationSettings.scaleFactor,
                            stationSettings.scaleFactor,
                            stationSettings.scaleFactor
                        );
                        
                        // Set custom userData for docking system
                        spaceStation.userData = {
                            name: 'spaceStation',
                            type: 'station',
                            dockable: true
                        };
                        
                        // Setup orbit
                        setupOrbit();
                        
                        console.log('Space station loaded successfully');
                        resolve(spaceStation);
                    },
                    function(xhr) {
                        console.log((xhr.loaded / xhr.total * 100) + '% space station loaded');
                    },
                    function(error) {
                        console.error('Error loading space station:', error);
                        createFallbackStation();
                        reject(error);
                    }
                );
            } catch (error) {
                console.error('Failed to create space station:', error);
                createFallbackStation();
                reject(error);
            }
        });
    }
    
    /**
     * Create a fallback space station if the model fails to load
     */
    function createFallbackStation() {
        console.log('Creating fallback space station');
        
        // Create a simple station with basic geometry
        const stationGroup = new THREE.Group();
        stationGroup.name = 'fallbackSpaceStation';
        
        // Main body - cylinder
        const bodyGeometry = new THREE.CylinderGeometry(2, 2, 5, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2; // Rotate to horizontal
        stationGroup.add(body);
        
        // Center sphere
        const sphereGeometry = new THREE.SphereGeometry(2.5, 16, 16);
        const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        stationGroup.add(sphere);
        
        // Solar panels
        const panelGeometry = new THREE.BoxGeometry(10, 0.1, 3);
        const panelMaterial = new THREE.MeshPhongMaterial({ color: 0x2244AA });
        
        const panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
        panel1.position.set(6, 0, 0);
        stationGroup.add(panel1);
        
        const panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
        panel2.position.set(-6, 0, 0);
        stationGroup.add(panel2);
        
        // Set userData
        stationGroup.userData = {
            name: 'spaceStation',
            type: 'station',
            dockable: true
        };
        
        spaceStation = stationGroup;
        
        // Setup orbit
        setupOrbit();
    }
    
    /**
     * Setup the orbit for the space station
     */
    function setupOrbit() {
        if (!spaceStation) return;
        
        // Find a target to orbit (preferably Earth)
        let earthFound = false;
        
        if (typeof PlanetSetup !== 'undefined' && PlanetSetup.getPlanets) {
            const planets = PlanetSetup.getPlanets();
            
            if (planets && planets.length > 0) {
                // Try to find Earth (3rd planet, index 2)
                if (planets.length > 2) {
                    const earth = planets[2].planet;
                    if (earth && earth.userData && earth.userData.name === 'earth') {
                        orbitTarget = earth;
                        earthFound = true;
                        console.log('Space station will orbit Earth');
                    }
                }
                
                // If Earth not found, use the first planet
                if (!earthFound) {
                    orbitTarget = planets[0].planet;
                    console.log(`Space station will orbit ${orbitTarget.userData.name}`);
                }
            }
        }
        
        // If no planets were found, orbit the origin
        if (!orbitTarget) {
            console.log('No planets found, space station will orbit origin');
            orbitTarget = { position: new THREE.Vector3(0, 0, 0) };
        }
        
        // Create an orbit pivot
        orbitPivot = new THREE.Object3D();
        orbitPivot.position.copy(orbitTarget.position || new THREE.Vector3(0, 0, 0));
        
        // Position the space station at its orbit distance
        spaceStation.position.set(stationSettings.orbitDistance, stationSettings.orbitHeight, 0);
        
        // Apply initial rotation
        orbitPivot.rotation.y = stationSettings.initialOrbitAngle;
        
        // Add station to pivot, and pivot to scene
        orbitPivot.add(spaceStation);
        scene.add(orbitPivot);
    }
    
    // Public methods
    return {
        /**
         * Initialize the space station
         * @param {Object} sceneInstance - Three.js scene
         * @returns {Promise} Resolves when initialization is complete
         */
        init: async function(sceneInstance) {
            if (initialized) {
                console.warn('Space station already initialized');
                return Promise.resolve(spaceStation);
            }
            
            if (!sceneInstance) {
                console.error('Scene instance is required for SpaceStationSetup.init()');
                return Promise.reject('Missing scene parameter');
            }
            
            scene = sceneInstance;
            
            try {
                await createSpaceStation();
                initialized = true;
                return spaceStation;
            } catch (error) {
                console.error('Space station initialization failed:', error);
                return Promise.reject(error);
            }
        },
        
        /**
         * Update space station orbit and rotation
         * @param {number} deltaTime - Time since last frame in seconds
         */
        update: function(deltaTime) {
            if (!initialized || !spaceStation || !orbitPivot) return;
            
            // Update orbit position
            orbitPivot.rotation.y += orbitSpeed * deltaTime;
            
            // Update station self-rotation
            spaceStation.rotation.y += rotationSpeed * deltaTime;
        },
        
        /**
         * Get the space station object
         * @returns {Object} THREE.Object3D representing the space station
         */
        getSpaceStation: function() {
            return spaceStation;
        },
        
        /**
         * Check if the space station is initialized
         * @returns {boolean} Whether the space station is initialized
         */
        isInitialized: function() {
            return initialized;
        },
        
        /**
         * Set orbit speed
         * @param {number} speed - New orbit speed
         */
        setOrbitSpeed: function(speed) {
            orbitSpeed = speed;
            return this;
        },
        
        /**
         * Set rotation speed
         * @param {number} speed - New rotation speed
         */
        setRotationSpeed: function(speed) {
            rotationSpeed = speed;
            return this;
        },
        
        /**
         * Get the docking distance for the space station
         * @returns {number} Docking distance
         */
        getDockingDistance: function() {
            return stationSettings.dockingDistance;
        }
    };
})();

// Initialize if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // Don't auto-initialize, let main script handle it
    console.log('SpaceStationSetup module loaded');
} else {
    document.addEventListener('DOMContentLoaded', function() {
        // Don't auto-initialize, let main script handle it
        console.log('SpaceStationSetup module loaded');
    });
}