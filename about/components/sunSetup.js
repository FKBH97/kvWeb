/**
 * sunSetup.js
 * Creates the sun with an animated corona effect
 * Enhanced version with advanced corona visualization
 */

const SunSetup = (function() {
    // Private variables
    let sun, corona, sunLight;
    let scene;
    let animationStep = 0;
    
    // Animation parameters
    const ANIMATION_SPEED = 0.005;
    const CORONA_PULSE_AMPLITUDE = 0.05;

    // ImprovedNoise implementation for better corona effect
    class ImprovedNoise {
      constructor() {
        this.p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,
            23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,
            174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,
            133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,
            89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,
            202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,
            248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,
            178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,
            14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,
            93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
        
        for (let i = 0; i < 256; i++) {
          this.p[256 + i] = this.p[i];
        }
      }
    
      fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
      }
    
      lerp(t, a, b) {
        return a + t * (b - a);
      }
    
      grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
      }
    
      noise(x, y, z) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
    
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
    
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);
    
        const A = this.p[X] + Y, AA = this.p[A] + Z, AB = this.p[A + 1] + Z;
        const B = this.p[X + 1] + Y, BA = this.p[B] + Z, BB = this.p[B + 1] + Z;
    
        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z),
                                                     this.grad(this.p[BA], x - 1, y, z)),
                                        this.lerp(u, this.grad(this.p[AB], x, y - 1, z),
                                                     this.grad(this.p[BB], x - 1, y - 1, z))),
                           this.lerp(v, this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1),
                                                     this.grad(this.p[BA + 1], x - 1, y, z - 1)),
                                        this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1),
                                                     this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))));
      }
    }

    /**
     * Create an improved corona effect using noise-based distortion
     * @returns {Object} Three.js mesh with update function
     */
    function getCorona() {
        const radius = 12;
        const material = new THREE.MeshBasicMaterial({
            color: 0xffff99,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.4
        });
        
        const geo = new THREE.IcosahedronGeometry(radius, 6);
        const mesh = new THREE.Mesh(geo, material);
        const noise = new ImprovedNoise();

        let v3 = new THREE.Vector3();
        let p = new THREE.Vector3();
        let pos = geo.attributes.position;
        pos.usage = THREE.DynamicDrawUsage;
        const len = pos.count;

        function update(t) {
            for (let i = 0; i < len; i += 1) {
                p.fromBufferAttribute(pos, i).normalize();
                v3.copy(p).multiplyScalar(3.0);
                let ns = noise.noise(v3.x + Math.cos(t), v3.y + Math.sin(t), v3.z + t);
                v3.copy(p)
                    .setLength(radius)
                    .addScaledVector(p, ns * 0.4);
                pos.setXYZ(i, v3.x, v3.y, v3.z);
            }
            pos.needsUpdate = true;
        }
        
        mesh.userData.update = update;
        mesh.name = 'advanced-corona';
        return mesh;
    }
    
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
            
            // Load the sun texture - hardcoded path
            const sunTexture = new THREE.TextureLoader().load('assets/planets/sun/sun_map.jpg', 
                undefined, 
                undefined, 
                function(err) {
                    console.log('Sun texture could not be loaded, using basic material');
                }
            );
            
            // Create sun geometry
            const sunGeometry = new THREE.SphereGeometry(10, 64, 64);
            
            // Create sun material
            const sunMaterial = new THREE.MeshBasicMaterial({
                map: sunTexture,
                color: 0xFFDD66 // Fallback color if texture fails
            });
            
            // Create sun mesh
            sun = new THREE.Mesh(sunGeometry, sunMaterial);
            sun.position.set(0, 0, 0);
            scene.add(sun);
            
            // Create advanced corona effect
            corona = getCorona();
            sun.add(corona);
            
            // Add sun light
            sunLight = new THREE.PointLight(0xFFFFFF, 2, 0, 2);
            sun.add(sunLight);
            
            // Add ambient light
            scene.add(new THREE.AmbientLight(0x404040, 0.5));
            
            console.log('Sun and advanced corona initialized successfully');
            
            return sun;
        },
        
        /**
         * Animate the sun's corona effect
         */
        animateSunCorona: function(time) {
            if (!corona) return;
            
            // Use the time parameter if provided, otherwise use internal animation step
            if (time !== undefined) {
                // Update corona using advanced noise-based animation
                if (corona.userData && corona.userData.update) {
                    corona.userData.update(time * 0.1);
                }
            } else {
                // Legacy animation for backward compatibility
                animationStep += ANIMATION_SPEED;
                
                // Scale corona in a pulsing pattern
                const pulseScale = 1 + Math.sin(animationStep) * CORONA_PULSE_AMPLITUDE;
                corona.scale.set(pulseScale, pulseScale, pulseScale);
            }
            
            // Rotate sun slowly
            if (sun) {
                sun.rotation.y += 0.001;
            }
        },
        
        /**
         * Get the sun object with controls
         */
        getSun: function() {
            return {
                mesh: sun,
                corona: corona,
                light: sunLight,
                setRadius: function(radius) {
                    if (!sun) return this;
                    sun.scale.set(radius/10, radius/10, radius/10);
                    return this;
                },
                setLightIntensity: function(intensity) {
                    if (sunLight) sunLight.intensity = intensity;
                    return this;
                },
                // Add method to get the corona
                getCorona: function() {
                    return corona;
                },
                // Add method to update the corona
                updateCorona: function(time) {
                    if (corona && corona.userData && corona.userData.update) {
                        corona.userData.update(time);
                    }
                    return this;
                }
            };
        }
    };
})();