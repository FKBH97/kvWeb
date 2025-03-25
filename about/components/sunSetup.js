/**
 * sunSetup.js - Simple implementation without requiring ImprovedNoise
 */

const SunSetup = (function() {
    // Private variables
    let scene;
    let sun;
    let corona;
    let outerCorona;
    let sunLight;
    
    // Constants
    const SUN_RADIUS = 75;
    const CORONA_RADIUS = 80;
    const OUTER_CORONA_RADIUS = 85;
    
    return {
        /**
         * Initialize the sun and its components
         * @param {Object} sceneInstance - The Three.js scene instance
         */
        init: function(sceneInstance) {
            if (!sceneInstance) {
                console.error('Scene instance is required for SunSetup.init()');
                return null;
            }
            
            scene = sceneInstance;
            
            try {
                // Load the sun texture
                const textureLoader = new THREE.TextureLoader();
                const sunTexture = textureLoader.load('assets/planets/sun/sun_map.jpg');
                
                // Create sun geometry and material
                const sunGeometry = new THREE.SphereGeometry(SUN_RADIUS, 64, 64);
                const sunMaterial = new THREE.MeshPhongMaterial({
                    map: sunTexture,
                    color: 0xFFDD66,
                    emissive: 0xFF9900,
                    emissiveIntensity: 0.5
                });
                
                // Create sun mesh
                sun = new THREE.Mesh(sunGeometry, sunMaterial);
                sun.position.set(0, 0, 0);
                
                // Add userData radius for collision detection
                sun.userData = {
                    name: "sun",
                    radius: SUN_RADIUS
                };
                
                scene.add(sun);
                
                // Create main corona effect
                const coronaGeometry = new THREE.SphereGeometry(CORONA_RADIUS, 32, 32);
                const coronaMaterial = new THREE.MeshBasicMaterial({
                    color: 0xFF9900,
                    side: THREE.BackSide,
                    transparent: true,
                    opacity: 0.7,
                    blending: THREE.AdditiveBlending
                });
                
                corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
                sun.add(corona);
                
                // Create outer corona effect
                const outerCoronaGeometry = new THREE.SphereGeometry(OUTER_CORONA_RADIUS, 32, 32);
                const outerCoronaMaterial = new THREE.MeshBasicMaterial({
                    color: 0xFF5500,
                    side: THREE.BackSide,
                    transparent: true,
                    opacity: 0.3,
                    blending: THREE.AdditiveBlending
                });
                
                outerCorona = new THREE.Mesh(outerCoronaGeometry, outerCoronaMaterial);
                sun.add(outerCorona);
                
                // Add sun light
                sunLight = new THREE.PointLight(0xFFFFFF, 2, 0, 2);
                sun.add(sunLight);
                
                // Add lens flare effect (optional)
                this.addLensFlare(sun.position);
                
                console.log('Sun and corona initialized successfully');
                
                return sun;
                
            } catch (error) {
                console.error('Error initializing sun:', error);
                
                // Create a fallback basic sun if textures fail
                const fallbackSun = new THREE.Mesh(
                    new THREE.SphereGeometry(SUN_RADIUS, 32, 32),
                    new THREE.MeshBasicMaterial({ color: 0xFFDD66 })
                );
                fallbackSun.position.set(0, 0, 0);
                
                // Add userData radius for collision detection
                fallbackSun.userData = {
                    name: "sun",
                    radius: SUN_RADIUS
                };
                
                scene.add(fallbackSun);
                
                sun = fallbackSun;
                return fallbackSun;
            }
        },
        
        /**
         * Add a simple lens flare to the sun (optional enhancement)
         */
        addLensFlare: function(position) {
            // Check if Lensflare is available from THREE
            if (!THREE.Lensflare) {
                return;
            }
            
            const textureLoader = new THREE.TextureLoader();
            const textureFlare0 = textureLoader.load('assets/lens_flare/lensflare0.png');
            const textureFlare1 = textureLoader.load('assets/lens_flare/lensflare1.png');
            
            const lensflare = new THREE.Lensflare();
            lensflare.addElement(new THREE.LensflareElement(textureFlare0, 500, 0, new THREE.Color(0xFFFFFF)));
            lensflare.addElement(new THREE.LensflareElement(textureFlare1, 60, 0.6));
            lensflare.addElement(new THREE.LensflareElement(textureFlare1, 70, 0.7));
            lensflare.addElement(new THREE.LensflareElement(textureFlare1, 120, 0.9));
            lensflare.addElement(new THREE.LensflareElement(textureFlare1, 70, 1.0));
            
            sunLight.add(lensflare);
        },
        
        /**
         * Animate the sun's corona effect
         * @param {number} time - Current animation time
         */
        animateSunCorona: function(time) {
            if (!sun) return;
            
            // Rotate sun slowly
            sun.rotation.y += 0.001;
            
            // Animate corona
            if (corona) {
                corona.scale.set(
                    1 + 0.05 * Math.sin(time * 0.5),
                    1 + 0.05 * Math.sin(time * 0.7),
                    1 + 0.05 * Math.sin(time * 0.3)
                );
            }
            
            // Animate outer corona with different phase
            if (outerCorona) {
                outerCorona.scale.set(
                    1 + 0.07 * Math.sin(time * 0.3 + 1),
                    1 + 0.07 * Math.sin(time * 0.5 + 2),
                    1 + 0.07 * Math.sin(time * 0.2)
                );
            }
        },
        
        /**
         * Get the sun object
         * @returns {Object} The sun mesh
         */
        getSun: function() {
            return sun;
        }
    };
})();