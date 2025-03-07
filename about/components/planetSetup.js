/**
 * planetSetup.js
 * Creates hardcoded planets with accurate orbits and rotations
 * With hardcoded texture paths for each planet
 */

const PlanetSetup = (function() {
  // Private variables
  let scene;
  let planets = [];
  let moons = [];
  let textureLoader;
  
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
          bump: "assets/planets/luna/luna_bump.jpg",
          
      }
  };
  
  // Hardcoded moon model paths
  const moonModelPaths = {
      phobos: "assets/models/phobos.obj",
      deimos: "assets/models/deimos.obj"
  };
  
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
          radius: 0.8,
          distance: 15,
          rotationSpeed: 0.005,
          orbitSpeed: 0.008,
          axialTilt: 0.03,
          hasRings: false,
          moons: []
      },
      {
          name: "venus",
          radius: 1.5,
          distance: 22,
          rotationSpeed: 0.002,
          orbitSpeed: 0.006,
          axialTilt: 0.01,
          hasRings: false,
          moons: []
      },
      {
          name: "earth",
          radius: 1.6,
          distance: 30,
          hasAtmosphere: true,
          atmosphereColor: 0x7098DA,
          atmosphereOpacity: 0.2,
          hasCloudLayer: true,
          rotationSpeed: 0.007,
          orbitSpeed: 0.005,
          axialTilt: 0.41,
          hasRings: false,
          moons: [
              {
                  name: "luna",
                  radius: 0.4,
                  distance: 3,
                  rotationSpeed: 0.008,
                  orbitSpeed: 0.015,
                  isModel: false
              }
          ]
      },
      {
          name: "mars",
          radius: 1.2,
          distance: 38,
          rotationSpeed: 0.007,
          orbitSpeed: 0.004,
          axialTilt: 0.44,
          hasRings: false,
          moons: [
              {
                  name: "phobos",
                  radius: 0.002,
                  distance: 2,
                  rotationSpeed: 0.01,
                  orbitSpeed: 0.02,
                  isModel: true
              },
              {
                  name: "deimos",
                  radius: 0.0015,
                  distance: 3,
                  rotationSpeed: 0.008,
                  orbitSpeed: 0.015,
                  isModel: true
              }
          ]
      },
      {
          name: "jupiter",
          radius: 5,
          distance: 60,
          rotationSpeed: 0.01,
          orbitSpeed: 0.002,
          axialTilt: 0.05,
          hasRings: false,
          moons: []
      },
      {
          name: "saturn",
          radius: 4,
          distance: 80,
          rotationSpeed: 0.009,
          orbitSpeed: 0.0015,
          axialTilt: 0.47,
          hasRings: true,
          ringSize: 2.5, // Multiplier relative to planet radius
          moons: []
      },
      {
          name: "uranus",
          radius: 2.5,
          distance: 100,
          rotationSpeed: 0.008,
          orbitSpeed: 0.001,
          axialTilt: 1.71, // Uranus has an extreme axial tilt
          hasRings: true,
          ringSize: 1.8,
          moons: []
      },
      {
          name: "neptune",
          radius: 2.3,
          distance: 115,
          rotationSpeed: 0.008,
          orbitSpeed: 0.0008,
          axialTilt: 0.49,
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
          
          console.log(`Attempting to load texture: ${path}`);
          
          const texture = textureLoader.load(
              path,
              function(loadedTexture) {
                  console.log(`Successfully loaded texture: ${path}`);
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
      
      // Create planet material
      const material = createPlanetMaterial(planetData);
      
      const planet = new THREE.Mesh(geometry, material);
      
      // Add planet data to the mesh for reference
      planet.userData = {
          name: planetData.name,
          orbitDistance: planetData.distance,
          orbitSpeed: planetData.orbitSpeed,
          rotationSpeed: planetData.rotationSpeed,
          axialTilt: planetData.axialTilt,
          moons: []
      };
      
      // Apply axial tilt
      planet.rotation.x = planetData.axialTilt;
      
      // Add atmosphere if planet has one
      if (planetData.hasAtmosphere) {
          addAtmosphere(planet, planetData);
      }
      
      // Add cloud layer if planet has one
      if (planetData.hasCloudLayer) {
          addCloudLayer(planet, planetData);
      }
      
      // Add night lights for Earth
      if (planetData.name === "earth") {
          addNightLights(planet, planetData);
      }
      
      return planet;
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
          // For Phobos and Deimos
          const modelPath = moonModelPaths[moonData.name];
          
          if (modelPath) {
              // Try to load the model
              const loader = new THREE.OBJLoader();
              
              loader.load(
                  modelPath,
                  function(object) {
                      // Scale model appropriately
                      object.scale.set(moonData.radius, moonData.radius, moonData.radius);
                      
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
                  function(xhr) {
                      // Progress callback
                      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                  },
                  function(error) {
                      console.error(`Error loading moon model: ${moonData.name}`, error);
                      // Fall back to simple sphere
                      createSimpleMoon(moonData, planet);
                  }
              );
          } else {
              // Fall back to simple sphere
              createSimpleMoon(moonData, planet);
          }
      } else {
          // For Luna
          createTexturedMoon(moonData, planet);
      }
  }
  
  /**
   * Create a textured moon (Luna)
   * @param {Object} moonData - Data for the moon
   * @param {Object} planet - The parent planet
   */
  function createTexturedMoon(moonData, planet) {
      const geometry = new THREE.SphereGeometry(
          moonData.radius, 
          16, // Less detail for moons
          16
      );
      
      // Try to load moon texture
      const texturePaths = planetTexturePaths[moonData.name];
      let material;
      
      if (texturePaths && texturePaths.map) {
          const texture = loadTexture(texturePaths.map);
          
          if (texture) {
              material = new THREE.MeshBasicMaterial({
                  map: texture
              });
          } else {
              material = new THREE.MeshBasicMaterial({
                  color: getPlanetColor(moonData.name)
              });
          }
      } else {
          material = new THREE.MeshBasicMaterial({
              color: getPlanetColor(moonData.name)
          });
      }
      
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
          textureLoader = new THREE.TextureLoader();
          
          // Create each planet
          planetaryData.forEach(planetData => {
              const planet = createPlanetMesh(planetData);
              
              // Position planet at its orbital distance
              // Initial positions are distributed around the sun
              const angle = Math.random() * Math.PI * 2;
              planet.position.x = Math.cos(angle) * planetData.distance;
              planet.position.z = Math.sin(angle) * planetData.distance;
              
              // Add to scene
              scene.add(planet);
              
              // Add to planets array for animation
              planets.push({
                  planet: planet,
                  data: planetData
              });
              
              // Add rings if the planet has them
              if (planetData.hasRings) {
                  createRingSystem(planet, planetData);
              }
              
              // Create moons for the planet
              if (planetData.moons && planetData.moons.length > 0) {
                  planetData.moons.forEach(moonData => {
                      createMoon(moonData, planet);
                  });
              }
          });
          
          console.log('Planetary system initialized with', planets.length, 'planets and', moons.length, 'moons');
          
          return planets;
      },
      
      /**
       * Update planet and moon positions for animation
       * Call this in the render loop
       */
      updatePlanetPositions: function(timeElapsed) {
          // Update each planet's position
          planets.forEach(planetObj => {
              const planet = planetObj.planet;
              const data = planet.userData;
              
              // Update planet orbit
              const orbitRadius = data.orbitDistance;
              const orbitAngle = timeElapsed * data.orbitSpeed;
              
              planet.position.x = Math.cos(orbitAngle) * orbitRadius;
              planet.position.z = Math.sin(orbitAngle) * orbitRadius;
              
              // Update planet rotation
              planet.rotation.y += data.rotationSpeed;
              
              // Update cloud rotation if planet has clouds
              if (planet.userData.clouds) {
                  planet.userData.clouds.rotation.y += data.rotationSpeed * 1.1; // Clouds rotate slightly faster
              }
          });
          
          // Update each moon's position
          moons.forEach(moonObj => {
              const pivot = moonObj.pivot;
              const moon = moonObj.moon;
              const data = moon.userData;
              
              // Update moon orbit by rotating the pivot
              pivot.rotation.y += data.orbitSpeed;
              
              // Update moon rotation
              moon.rotation.y += data.rotationSpeed;
          });
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
      }
  };
})();