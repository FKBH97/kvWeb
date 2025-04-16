/**
 * planetSetup.js
 * Creates hardcoded planets with accurate orbits and rotations
 * With hardcoded texture paths for each planet
 * UPDATED: Fixed planet orbits around the sun
 */

const PlanetSetup = (function() {
    // Private variables
    let scene;
    let planets = [];
    let moons = [];
    let textureLoader;
    let orbitLines = []; // Store orbit visualization lines
    let showOrbits = false; // Toggle for orbit visualization
    let timeElapsed = 0; // Track elapsed time for animations

    // Hardcoded texture paths for each planet and texture type
    const planetTexturePaths = {
        mercury: {
            map: "assets/planets/mercury/mercury_map.jpg",
            bump: "assets/planets/mercury/mercury_bump.jpg",
            normal: "assets/planets/mercury/mercury_normal.jpg",
            specular: "assets/planets/mercury/mercury_specular.jpg"
        },
        venus: {
            map: "assets/planets/venus/venus_map.jpg",
            bump: "assets/planets/venus/venus_bump.jpg",
            normal: "assets/planets/venus/venus_normal.jpg",
            specular: "assets/planets/venus/venus_specular.jpg"
        },
        earth: {
            map: "assets/planets/earth/earth_map.jpg",
            bump: "assets/planets/earth/earth_bump.jpg",
            normal: "assets/planets/earth/earth_normal.jpg",
            specular: "assets/planets/earth/earth_specular.jpg",
            clouds: "assets/planets/earth/earth_clouds.jpg",
            cloudtrans: "assets/planets/earth/earth_cloudtrans.jpg",
            lights: "assets/planets/earth/earth_lights.jpg"
        },
        mars: {
            map: "assets/planets/mars/mars_map.jpg",
            bump: "assets/planets/mars/mars_bump.jpg",
            normal: "assets/planets/mars/mars_normal.jpg",
            specular: "assets/planets/mars/mars_specular.jpg"
        },
        jupiter: {
            map: "assets/planets/jupiter/jupiter_map.jpg",
            bump: "assets/planets/jupiter/jupiter_bump.jpg",
            normal: "assets/planets/jupiter/jupiter_normal.jpg",
            specular: "assets/planets/jupiter/jupiter_specular.jpg"
        },
        saturn: {
            map: "assets/planets/saturn/saturn_map.jpg",
            bump: "assets/planets/saturn/saturn_bump.jpg",
            normal: "assets/planets/saturn/saturn_normal.jpg",
            specular: "assets/planets/saturn/saturn_specular.jpg",
            ringcolor: "assets/planets/saturn/saturn_ringcolor.jpg",
            ringtrans: "assets/planets/saturn/saturn_ringtrans.gif"
        },
        uranus: {
            map: "assets/planets/uranus/uranus_map.jpg",
            bump: "assets/planets/uranus/uranus_bump.jpg",
            normal: "assets/planets/uranus/uranus_normal.jpg",
            specular: "assets/planets/uranus/uranus_specular.jpg",
            ringcolor: "assets/planets/uranus/uranus_ringcolor.jpg",
            ringtrans: "assets/planets/uranus/uranus_ringtrans.gif"
        },
        neptune: {
            map: "assets/planets/neptune/neptune_map.jpg",
            bump: "assets/planets/neptune/neptune_bump.jpg",
            normal: "assets/planets/neptune/neptune_normal.jpg",
            specular: "assets/planets/neptune/neptune_specular.jpg"
        },
        luna: {
            map: "assets/planets/luna/luna_map.jpg",
            bump: "assets/planets/luna/luna_bump.jpg"
            
        }
    };
    
    // Hardcoded moon model paths
    const moonModelPaths = {
        phobos: "assets/models/phobos.obj",
        deimos: "assets/models/deimos.obj"
    };
    
    // Space station model path
    const spaceStationModelPath = "/sharedAssets/models/spaceStation.glb";
    
    // Hardcoded paths for sun textures
    const sunTexturePaths = {
        map: "assets/planets/sun/sun_map.jpg",
        emissive: "assets/planets/sun/sun_emissive.jpg",
        corona: "assets/planets/sun/sun_corona.jpg"
    };
    
    // Planetary data for the solar system
    // Values for size and distance are scaled for visualization
    const planetaryData = [
        {
            name: "mercury",
            radius: 16,
            distance: 150,  // Reduced from 200
            rotationSpeed: 0.0005,
            orbitSpeed: 0.0008,
            axialTilt: 0.03,
            orbitalInclination: 12.23,
            hasRings: false,
            moons: []
        },
        {
            name: "venus",
            radius: 30,
            distance: 277,  // Reduced from 320
            rotationSpeed: 0.0002,
            orbitSpeed: 0.0006,
            axialTilt: 0.01,
            orbitalInclination: 5.92,
            hasRings: false,
            moons: []
        },
        {
            name: "earth",
            radius: 32,
            distance: 385,  // Reduced from 450
            hasAtmosphere: true,
            atmosphereColor: 0x7098DA,
            atmosphereOpacity: 0.2,
            hasCloudLayer: true,
            rotationSpeed: 0.0007,
            orbitSpeed: 0.0005,
            axialTilt: 0.41,
            orbitalInclination: 0.0,
            hasRings: false,
            moons: [
                {
                    name: "luna",
                    radius: 8,
                    distance: 50,
                    rotationSpeed: 0.008,
                    orbitSpeed: 0.015,
                    isModel: false
                }
            ]
        },
        {
            name: "mars",
            radius: 24,
            distance: 585,  // Reduced from 600
            rotationSpeed: 0.0007,
            orbitSpeed: 0.0004,
            axialTilt: 0.44,
            orbitalInclination: 3.23,
            hasRings: false,
            moons: [
                {
                    name: "phobos",
                    radius: 0.04,
                    distance: 30,
                    rotationSpeed: 0.01,
                    orbitSpeed: 0.02,
                    isModel: true
                },
                {
                    name: "deimos",
                    radius: 0.03,
                    distance: 40,
                    rotationSpeed: 0.008,
                    orbitSpeed: 0.015,
                    isModel: true
                }
            ]
        },
        {
            name: "jupiter",
            radius: 100,
            distance: 1000,  // Reduced from 2000
            rotationSpeed: 0.001,
            orbitSpeed: 0.0002,
            axialTilt: 0.5,
            orbitalInclination: 2.29,
            hasRings: false,
            moons: []
        },
        {
            name: "saturn",
            radius: 80,
            distance: 1500,  // Reduced from 3682
            rotationSpeed: 0.0009,
            orbitSpeed: 0.00015,
            axialTilt: 0.47,
            orbitalInclination: 4.35,
            hasRings: true,
            ringSize: 2.5,
            moons: []
        },
        {
            name: "uranus",
            radius: 50,
            distance: 2000,  // Reduced from 7398
            rotationSpeed: 0.0008,
            orbitSpeed: 0.0001,
            axialTilt: 1.71,
            orbitalInclination: 1.34,
            hasRings: true,
            ringSize: 1.8,
            moons: []
        },
        {
            name: "neptune",
            radius: 46,
            distance: 2500,  // Reduced from 11561
            rotationSpeed: 0.0008,
            orbitSpeed: 0.00008,
            axialTilt: 0.49,
            orbitalInclination: 3.09,
            hasRings: false,
            moons: []
        }
    ];
  
    /**
     * Load a texture with error handling, supports various formats
     * @param {string} path - Path to the texture file
     * @returns {Object} Three.js texture or null if loading fails
     */
    function loadTexture(path) {
        if (!path) return null;
        
        try {
            if (!textureLoader) {
                textureLoader = new THREE.TextureLoader();
            }
            
            const texture = textureLoader.load(
                path,
                function(loadedTexture) {
                    // Success callback
                },
                function(xhr) {
                    // Progress callback
                },
                function(error) {
                    console.error(`Error loading texture ${path}:`, error);
                    return null;
                }
            );
            
            return texture;
        } catch (error) {
            console.error(`Error setting up texture ${path}:`, error);
            return null;
        }
    }
    
    /**
     * Create a planet material with fallback options
     * @param {Object} planetData - Data for the planet
     * @returns {Object} Three.js material
     */
    function createPlanetMaterial(planetData) {
        const planetName = planetData.name;
        const texturePaths = planetTexturePaths[planetName];
        
        if (!texturePaths) {
            return createFallbackMaterial(planetName);
        }
        
        // Try to load the map texture
        const mapTexture = loadTexture(texturePaths.map);
        
        if (!mapTexture) {
            return createFallbackMaterial(planetName);
        }
        
        // Create base material with map texture
        const material = new THREE.MeshBasicMaterial({
            map: mapTexture
        });
        
        return material;
    }
    
    /**
     * Create a fallback material for a planet
     * @param {string} planetName - Name of the planet
     * @returns {Object} Three.js material
     */
    function createFallbackMaterial(planetName) {
        return new THREE.MeshBasicMaterial({
            color: getPlanetColor(planetName)
        });
    }
    
    /**
     * Get a fallback color for a planet
     * @param {string} planetName - Name of the planet
     * @returns {number} Three.js color
     */
    function getPlanetColor(planetName) {
        const colors = {
            mercury: 0xAAAAAA, // Gray
            venus: 0xE6E6AA,   // Yellowish
            earth: 0x6699FF,   // Blue
            mars: 0xDD6633,    // Reddish
            jupiter: 0xDDCCAA, // Tan
            saturn: 0xEEDDCC,  // Light tan
            uranus: 0x99EEFF,  // Light blue
            neptune: 0x3377FF, // Dark blue
            luna: 0xCCCCCC     // Light gray
        };
        
        return colors[planetName] || 0xFFFFFF;
    }
    
    /**
     * Create a planet mesh with provided parameters
     * @param {Object} planetData - Data for the planet to create
     * @returns {Object} The planet mesh
     */
    function createPlanetMesh(planetData) {
        const geometry = new THREE.SphereGeometry(
            planetData.radius, 
            32, // width segments
            32  // height segments
        );
        
        // Create planet material with improved settings
        const material = createPlanetMaterial(planetData);
        material.side = THREE.FrontBack; // Make both sides visible
        
        const planet = new THREE.Mesh(geometry, material);
        planet.name = planetData.name;
        
        // Add planet data to the mesh for reference
        planet.userData = {
            name: planetData.name,
            radius: planetData.radius,
            orbitDistance: planetData.distance,
            orbitSpeed: planetData.orbitSpeed,
            rotationSpeed: planetData.rotationSpeed,
            axialTilt: planetData.axialTilt,
            moons: [],
            spaceStations: [], // Add space stations array
            id: Math.random().toString(36).substr(2, 9) // Add unique ID for docking system
        };
        
        // Apply axial tilt
        planet.rotation.x = planetData.axialTilt;
        
        // Add atmosphere if planet has one
        if (planetData.hasAtmosphere) {
            const atmosphere = addAtmosphere(planet, planetData);
            if (atmosphere) {
                atmosphere.frustumCulled = false;
            }
        }
        
        // Add cloud layer if planet has one
        if (planetData.hasCloudLayer) {
            const clouds = addCloudLayer(planet, planetData);
            if (clouds) {
                clouds.frustumCulled = false;
            }
        }
        
        // Add night lights for Earth
        if (planetData.name === "earth") {
            addNightLights(planet, planetData);
        }
        
        return planet;
    }
    
    /**
     * Create orbit lines to visualize planet orbits
     * @param {Object} planetData - The planet's data
     * @returns {Object} Three.js line mesh
     */
    function createOrbitLine(planetData) {
        const orbitSegments = 128;
        const orbitRadius = planetData.distance;
        
        // Create orbit geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(orbitSegments * 3);
        
        // Generate orbit path
        for (let i = 0; i < orbitSegments; i++) {
            const angle = (i / orbitSegments) * Math.PI * 2;
            const x = Math.cos(angle) * orbitRadius;
            const z = Math.sin(angle) * orbitRadius;
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = 0; // Keep orbit line flat
            positions[i * 3 + 2] = z;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create orbit material
        const material = new THREE.LineBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.3
        });
        
        // Create orbit line
        const orbitLine = new THREE.Line(geometry, material);
        orbitLine.userData.planetName = planetData.name;
        
        // Set visibility based on showOrbits flag
        orbitLine.visible = showOrbits;
        
        return orbitLine;
    }
    
    /**
     * Add an atmosphere effect to a planet
     * @param {Object} planet - The planet mesh
     * @param {Object} planetData - The planet's data
     */
    function addAtmosphere(planet, planetData) {
        // Create slightly larger sphere for atmosphere
        const atmosphereGeometry = new THREE.SphereGeometry(
            planetData.radius * 1.025,
            32,
            32
        );
        
        // Create transparent material for atmosphere effect
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: planetData.atmosphereColor || 0x88AAFF,
            transparent: true,
            opacity: planetData.atmosphereOpacity || 0.2,
            side: THREE.BackSide
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        planet.add(atmosphere);
        
        return atmosphere;
    }
    
    /**
     * Add a cloud layer to a planet
     * @param {Object} planet - The planet mesh
     * @param {Object} planetData - The planet's data
     */
    function addCloudLayer(planet, planetData) {
        const planetName = planetData.name;
        const texturePaths = planetTexturePaths[planetName];
        
        if (!texturePaths || !texturePaths.clouds) return;
        
        // Load cloud texture
        const cloudTexture = loadTexture(texturePaths.clouds);
        
        if (!cloudTexture) return;
        
        // Create slightly larger sphere for clouds
        const cloudGeometry = new THREE.SphereGeometry(
            planetData.radius * 1.01,
            32,
            32
        );
        
        // Create cloud material
        let cloudMaterial;
        
        if (texturePaths.cloudtrans) {
            const cloudTransTexture = loadTexture(texturePaths.cloudtrans);
            
            cloudMaterial = new THREE.MeshBasicMaterial({
                map: cloudTexture,
                alphaMap: cloudTransTexture,
                transparent: true,
                opacity: 0.8
            });
        } else {
            cloudMaterial = new THREE.MeshBasicMaterial({
                map: cloudTexture,
                transparent: true,
                opacity: 0.8
            });
        }
        
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        planet.add(clouds);
        
        // Store clouds reference for animation
        planet.userData.clouds = clouds;
        
        return clouds;
    }
    
    /**
     * Add night lights to Earth
     * @param {Object} planet - The planet mesh (Earth)
     * @param {Object} planetData - The planet's data
     */
    function addNightLights(planet, planetData) {
        const texturePaths = planetTexturePaths.earth;
        
        if (!texturePaths || !texturePaths.lights) return;
        
        // Load lights texture
        const lightsTexture = loadTexture(texturePaths.lights);
        
        if (!lightsTexture) return;
        
        // Create slightly larger sphere for lights
        const lightsGeometry = new THREE.SphereGeometry(
            planetData.radius * 1.001,
            32,
            32
        );
        
        // Create material for lights
        const lightsMaterial = new THREE.MeshBasicMaterial({
            map: lightsTexture,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        const lights = new THREE.Mesh(lightsGeometry, lightsMaterial);
        planet.add(lights);
    }
    
    /**
     * Create a planet's ring system
     * @param {Object} planet - The planet mesh
     * @param {Object} planetData - The planet's data including ring info
     */
    function createRingSystem(planet, planetData) {
        if (!planetData.hasRings) return;
        
        // Create ring geometry
        const ringGeometry = new THREE.RingGeometry(
            planetData.radius * 1.2, 
            planetData.radius * planetData.ringSize, 
            64
        );
        
        // Modify UVs to ensure texture wraps correctly on ring
        const pos = ringGeometry.attributes.position;
        const uv = ringGeometry.attributes.uv;
        
        for (let i = 0; i < pos.count; i++) {
            const vertex = new THREE.Vector3();
            vertex.fromBufferAttribute(pos, i);
            
            // Project vertex onto ring plane
            const dist = vertex.length();
            
            // Remap UVs
            uv.setX(i, (dist - planetData.radius * 1.2) / 
                      (planetData.radius * planetData.ringSize - planetData.radius * 1.2));
            uv.setY(i, 0.5);
        }
        
        const texturePaths = planetTexturePaths[planetData.name];
        let ringMaterial;
        
        if (texturePaths && texturePaths.ringcolor) {
            // Try to load ring textures
            const ringColorTexture = loadTexture(texturePaths.ringcolor);
            
            if (ringColorTexture) {
                if (texturePaths.ringtrans) {
                    const ringTransTexture = loadTexture(texturePaths.ringtrans);
                    
                    if (ringTransTexture) {
                        ringMaterial = new THREE.MeshBasicMaterial({
                            map: ringColorTexture,
                            alphaMap: ringTransTexture,
                            transparent: true,
                            opacity: 0.9,
                            side: THREE.DoubleSide
                        });
                    } else {
                        ringMaterial = new THREE.MeshBasicMaterial({
                            map: ringColorTexture,
                            transparent: true,
                            opacity: 0.9,
                            side: THREE.DoubleSide
                        });
                    }
                } else {
                    ringMaterial = new THREE.MeshBasicMaterial({
                        map: ringColorTexture,
                        transparent: true,
                        opacity: 0.9,
                        side: THREE.DoubleSide
                    });
                }
            } else {
                // Fallback material
                ringMaterial = createFallbackRingMaterial(planetData.name);
            }
        } else {
            // Fallback material
            ringMaterial = createFallbackRingMaterial(planetData.name);
        }
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // Orient horizontally
        
        // Add the ring to the planet
        planet.add(ring);
        
        return ring;
    }
    
    /**
     * Create a fallback material for rings if texture loading fails
     * @param {string} planetName - Name of the planet
     * @returns {Object} Ring material
     */
    function createFallbackRingMaterial(planetName) {
        let color;
        
        // Different colors based on planet
        if (planetName === "saturn") {
            color = 0xEEDDCC; // Light tan
        } else if (planetName === "uranus") {
            color = 0x99EEFF; // Light blue
        } else {
            color = 0xCCCCCC; // Generic gray
        }
        
        return new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
    }
    
    /**
     * Create a moon for a planet
     * @param {Object} moonData - Data for the moon
     * @param {Object} planet - The parent planet
     */
    function createMoon(moonData, planet) {
        if (moonData.isModel) {
            // Load 3D model for the moon
            if (typeof THREE.OBJLoader !== 'undefined') {
                const loader = new THREE.OBJLoader();
                const modelPath = moonModelPaths[moonData.name];
                
                if (modelPath) {
                    loader.load(
                        modelPath,
                        function(object) {
                            // Scale the model to match the moon's radius
                            const scale = moonData.radius / 10; // Adjust based on model size
                            object.scale.set(scale, scale, scale);
                            
                            // Add moon data to the object
                            object.userData = {
                                name: moonData.name,
                                orbitDistance: moonData.distance,
                                orbitSpeed: moonData.orbitSpeed,
                                rotationSpeed: moonData.rotationSpeed,
                                parent: planet
                            };
                            
                            // Set initial position
                            object.position.set(moonData.distance, 0, 0);
                            
                            // Create a pivot for orbit
                            const pivot = new THREE.Object3D();
                            planet.add(pivot);
                            pivot.add(object);
                            
                            // Store reference to the moon
                            moons.push({
                                moon: object,
                                pivot: pivot,
                                data: moonData
                            });
                            
                            planet.userData.moons.push({
                                moon: object,
                                pivot: pivot
                            });
                        },
                        undefined,
                        function(error) {
                            console.error(`Error loading moon model ${moonData.name}:`, error);
                            createSimpleMoon(moonData, planet);
                        }
                    );
                } else {
                    console.warn(`No model path found for moon ${moonData.name}, using simple sphere`);
                    createSimpleMoon(moonData, planet);
                }
            } else {
                console.warn('OBJLoader not available, using simple sphere for moon');
                createSimpleMoon(moonData, planet);
            }
        } else {
            // Create a simple sphere for the moon
            const geometry = new THREE.SphereGeometry(
                moonData.radius, 
                16, // Less detail for moons
                16
            );
            
            // Try to load moon texture
            const moonTexture = loadTexture(planetTexturePaths[moonData.name]?.map);
            
            // Create material
            const material = moonTexture ? 
                new THREE.MeshBasicMaterial({ map: moonTexture }) :
                new THREE.MeshBasicMaterial({ color: getPlanetColor(moonData.name) });
            
            const moon = new THREE.Mesh(geometry, material);
            
            // Add moon data to the mesh
            moon.userData = {
                name: moonData.name,
                orbitDistance: moonData.distance,
                orbitSpeed: moonData.orbitSpeed,
                rotationSpeed: moonData.rotationSpeed,
                parent: planet
            };
            
            // Set initial position
            moon.position.set(moonData.distance, 0, 0);
            
            // Create a pivot for orbit
            const pivot = new THREE.Object3D();
            planet.add(pivot);
            pivot.add(moon);
            
            // Store reference to the moon
            moons.push({
                moon: moon,
                pivot: pivot,
                data: moonData
            });
            
            planet.userData.moons.push({
                moon: moon,
                pivot: pivot
            });
        }
    }
    
    /**
     * Create a simple sphere moon (fallback for missing models)
     * @param {Object} moonData - Data for the moon
     * @param {Object} planet - The parent planet
     */
    function createSimpleMoon(moonData, planet) {
        const geometry = new THREE.SphereGeometry(
            moonData.radius, 
            16, // Less detail for moons
            16
        );
        
        // Use a basic material
        const material = new THREE.MeshBasicMaterial({
            color: getPlanetColor(moonData.name) || 0xCCCCCC
        });
        
        const moon = new THREE.Mesh(geometry, material);
        
        // Add moon data to the mesh
        moon.userData = {
            name: moonData.name,
            orbitDistance: moonData.distance,
            orbitSpeed: moonData.orbitSpeed,
            rotationSpeed: moonData.rotationSpeed,
            parent: planet
        };
        
        // Set initial position
        moon.position.set(moonData.distance, 0, 0);
        
        // Create a pivot for orbit
        const pivot = new THREE.Object3D();
        planet.add(pivot);
        pivot.add(moon);
        
        // Store reference to the moon
        moons.push({
            moon: moon,
            pivot: pivot,
            data: moonData
        });
        
        planet.userData.moons.push({
            moon: moon,
            pivot: pivot
        });
    }

    /**
     * Create a fallback space station using basic geometry
     * @param {Object} planetData - Data for the parent planet
     * @param {Object} pivot - The pivot point for the station's orbit
     * @returns {Object} The space station mesh
     */
    function createFallbackSpaceStation(planetData, pivot) {
        // Create a simple station using basic shapes
        const stationGroup = new THREE.Group();
        
        // Main cylinder body
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        stationGroup.add(body);
        
        // Solar panels
        const panelGeometry = new THREE.BoxGeometry(3, 0.1, 1);
        const panelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2244AA,
            shininess: 100
        });
        
        const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        leftPanel.position.x = -1.5;
        stationGroup.add(leftPanel);
        
        const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        rightPanel.position.x = 1.5;
        stationGroup.add(rightPanel);
        
        return stationGroup;
    }

    function createSpaceStation(planetData, planet) {
        try {
            // Create a pivot for orbit that's a child of the planet
            const pivot = new THREE.Object3D();
            pivot.name = `${planetData.name}StationPivot`;
            planet.add(pivot);
            
            // Set up orbit parameters
            const orbitDistance = planetData.radius * 2.5;
            const orbitSpeed = 0.0005;
            const orbitHeight = planetData.radius * 0.3;
            
            // Random starting angle and inclination
            const startAngle = Math.random() * Math.PI * 2;
            pivot.rotation.y = startAngle;
            const inclination = (Math.random() * 0.2) - 0.1;
            pivot.rotation.x = inclination;
            
            // Try to load the GLTF model
            if (typeof THREE.GLTFLoader !== 'undefined') {
                const loader = new THREE.GLTFLoader();
                
                loader.load(
                    spaceStationModelPath,
                    function(gltf) {
                        const spaceStation = gltf.scene;
                        setupSpaceStation(spaceStation, planetData, pivot, orbitDistance, orbitHeight, orbitSpeed);
                    },
                    undefined,
                    function(error) {
                        console.warn(`Using fallback station for ${planetData.name} due to loading error:`, error);
                        const fallbackStation = createFallbackSpaceStation(planetData, pivot);
                        setupSpaceStation(fallbackStation, planetData, pivot, orbitDistance, orbitHeight, orbitSpeed);
                    }
                );
            } else {
                console.warn('GLTFLoader not available, using fallback station');
                const fallbackStation = createFallbackSpaceStation(planetData, pivot);
                setupSpaceStation(fallbackStation, planetData, pivot, orbitDistance, orbitHeight, orbitSpeed);
            }
        } catch (error) {
            console.error(`Error creating space station for ${planetData.name}:`, error);
        }
    }
    
    /**
     * Set up a space station with the correct scale, position, and lighting
     */
    function setupSpaceStation(station, planetData, pivot, orbitDistance, orbitHeight, orbitSpeed) {
        // Scale based on planet size but ensure minimum visibility
        const baseScale = Math.max(0.2, planetData.radius * 0.03);
        station.scale.set(baseScale, baseScale, baseScale);
        
        // Position station at its orbit distance
        station.position.x = orbitDistance;
        station.position.y = orbitHeight;
        
        // Rotate the station to face "forward" in its orbit
        station.rotation.y = Math.PI / 2;
        
        // Ensure the station is always visible
        station.traverse(function(child) {
            if (child.isMesh) {
                child.frustumCulled = false;
            }
        });
        
        // Add a light to make the station more visible
        const stationLight = new THREE.PointLight(0xFFFFFF, 0.8, orbitDistance * 3);
        stationLight.position.set(0, 0, 0);
        station.add(stationLight);
        
        // Add station to pivot
        pivot.add(station);
        
        // Store reference for animation
        const planet = pivot.parent;
        if (!planet.userData.spaceStations) {
            planet.userData.spaceStations = [];
        }
        
        planet.userData.spaceStations.push({
            pivot: pivot,
            station: station,
            orbitSpeed: orbitSpeed
        });
    }
    
    // Public methods
    return {
        /**
         * Initialize the planetary system
         * @param {Object} sceneInstance - The Three.js scene
         */
        init: function(sceneInstance) {
            if (!sceneInstance) {
                console.error('Scene instance is required for PlanetSetup.init()');
                return;
            }
            
            scene = sceneInstance;
            planets = [];
            moons = [];
            orbitLines = [];
            textureLoader = new THREE.TextureLoader();
            
            // Create orbit group to hold all planets and their orbits
            const orbitGroup = new THREE.Group();
            orbitGroup.name = "solarSystem";
            scene.add(orbitGroup);
            
            // Create planets with improved visibility settings
            planetaryData.forEach((planetData, index) => {
                // Create orbit line first (to be behind planets)
                const orbitLine = createOrbitLine(planetData);
                orbitLines.push(orbitLine);
                orbitGroup.add(orbitLine);
                
                // Create planet pivot for orbit
                const planetPivot = new THREE.Object3D();
                planetPivot.name = `${planetData.name}Orbit`;
                
                // Calculate a unique starting angle for each planet
                const startAngle = (index / planetaryData.length) * Math.PI * 2;
                planetPivot.rotation.y = startAngle;
                
                if (planetData.orbitalInclination) {
                    planetPivot.rotation.x = planetData.orbitalInclination;
                }
                
                orbitGroup.add(planetPivot);
                
                // Create the planet with improved materials
                const planet = createPlanetMesh(planetData);
                
                // Ensure planet is always visible
                planet.frustumCulled = false;
                
                // Add planet to pivot
                planetPivot.add(planet);
                
                // Position planet at its orbital distance
                planet.position.x = planetData.distance;
                
                // Add to planets array for animation
                planets.push({
                    planet: planet,
                    pivot: planetPivot,
                    data: planetData
                });
                
                // Add rings if the planet has them
                if (planetData.hasRings) {
                    const rings = createRingSystem(planet, planetData);
                    if (rings) {
                        rings.frustumCulled = false;
                    }
                }
                
                // Create moons for the planet
                if (planetData.moons && planetData.moons.length > 0) {
                    planetData.moons.forEach(moonData => {
                        const moon = createMoon(moonData, planet);
                        if (moon) {
                            moon.frustumCulled = false;
                        }
                    });
                }
                
                // Create a space station orbiting the planet
                createSpaceStation(planetData, planet);
            });
            
            return planets;
        },
        
        /**
         * Update planet and moon positions for animation
         * Call this in the render loop
         * @param {number} deltaTime - Time since last frame in seconds
         * @param {number} timeElapsed - Total elapsed time for animations
         */
        updatePlanetPositions: function(deltaTime, timeElapsed) {
            // Update each planet's position
            planets.forEach(planetObj => {
                const planet = planetObj.planet;
                const pivot = planetObj.pivot;
                const data = planetObj.data;
                
                // Use the actual deltaTime for frame-rate independent movement
                pivot.rotation.y += data.orbitSpeed * .16;
                
                // Update planet rotation
                planet.rotation.y += data.rotationSpeed * .16;
                
                // Update cloud rotation if planet has clouds
                if (planet.userData.clouds) {
                    planet.userData.clouds.rotation.y += data.rotationSpeed * 1.1 * deltaTime;
                }
                
                // Update space stations if planet has them
                if (planet.userData.spaceStations && planet.userData.spaceStations.length > 0) {
                    planet.userData.spaceStations.forEach(stationData => {
                        stationData.pivot.rotation.y += stationData.orbitSpeed * .16;
                        
                        // Add slight wobble for realistic station movement
                        const station = stationData.station;
                        if (station) {
                            station.rotation.z = Math.sin(timeElapsed * 0.5) * 0.03;
                        }
                    });
                }
            });
            
            // Update each moon's position
            moons.forEach(moonObj => {
                const pivot = moonObj.pivot;
                const moon = moonObj.moon;
                const data = moon.userData;
                
                // Use deltaTime for moons too
                pivot.rotation.y += data.orbitSpeed * .16;
                moon.rotation.y += data.rotationSpeed * .16;
            });
        },
        
        /**
         * Toggle orbit line visibility
         */
        toggleOrbitLines: function() {
            showOrbits = !showOrbits;
            
            orbitLines.forEach(line => {
                line.visible = showOrbits;
            });
            
            return showOrbits;
        },
        
        /**
         * Get all planet objects
         * @returns {Array} The planet objects
         */
        getPlanets: function() {
            return planets;
        },
        
        /**
         * Find a planet by name
         * @param {string} name - The name of the planet to find
         * @returns {Object} The planet object or null if not found
         */
        getPlanetByName: function(name) {
            const planet = planets.find(p => p.planet.userData.name === name);
            return planet ? planet.planet : null;
        },
        
        /**
         * Get hardcoded texture paths
         * @returns {Object} The texture paths
         */
        getTexturePaths: function() {
            return {
                planets: planetTexturePaths,
                moons: moonModelPaths,
                sun: sunTexturePaths
            };
        },
        
        /**
         * Get the orbit lines
         * @returns {Array} The orbit line objects
         */
        getOrbitLines: function() {
            return orbitLines;
        },
        
        /**
         * Check if orbit lines are visible
         * @returns {boolean} True if orbit lines are visible
         */
        areOrbitLinesVisible: function() {
            return showOrbits;
        },

        /**
         * Get the nearest planet to a position
         * @param {THREE.Vector3} position - The position to check from
         * @returns {Object} The nearest planet object and distance
         */
        getNearestPlanet: function(position) {
            let nearestPlanet = null;
            let nearestDistance = Infinity;
            
            planets.forEach(planetObj => {
                if (!planetObj.planet) return;
                
                const planet = planetObj.planet;
                const planetPosition = new THREE.Vector3();
                
                // Get planet position - handle both cases where getWorldPosition exists or not
                if (typeof planet.getWorldPosition === 'function') {
                    planet.getWorldPosition(planetPosition);
                } else if (planet.position) {
                    planetPosition.copy(planet.position);
                } else {
                    console.warn('Planet has no position property or getWorldPosition method');
                    return;
                }
                
                const distance = planetPosition.distanceTo(position);
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestPlanet = planet;
                }
            });
            
            return {
                planet: nearestPlanet,
                distance: nearestDistance
            };
        },

        /**
         * Get all space stations for a planet
         * @param {Object} planet - The planet to get stations for
         * @returns {Array} Array of space station objects
         */
        getSpaceStations: function(planet) {
            if (!planet || !planet.userData) return [];
            return planet.userData.spaceStations || [];
        }
    };

})();