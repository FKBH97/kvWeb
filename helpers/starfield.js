/**
 * starfield.js
 * Creates a slightly animated background starfield for space scenes.
 */

const Starfield = (function() {
    // Private variables
    let scene;
    let stars;
    let starCount = 5000;
    let starField;
    let animationSpeed = 0.0001;
    
        /**
     * Create a star particle system
     * @param {number} count - Number of stars to create
     * @returns {Object} THREE.Points object containing the stars
     */
        /**
     * Create a star particle system
     * @param {number} count - Number of stars to create
     * @returns {Object} THREE.Points object containing the stars
     */
    function createStars(count) {
        // Create geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        // Generate random positions, colors, and sizes
        for (let i = 0; i < count; i++) {
            // Use a sphere distribution for stars
            const distance = Math.pow(Math.random(), 0.5) * 500; // Power for balanced distribution
            const theta = Math.random() * Math.PI * 2; // Random angle around y-axis
            const phi = Math.acos(2 * Math.random() - 1); // Random angle from y-axis
            
            // Convert spherical to Cartesian coordinates
            const x = distance * Math.sin(phi) * Math.cos(theta);
            const y = distance * Math.sin(phi) * Math.sin(theta);
            const z = distance * Math.cos(phi);
            
            // Set positions
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            // Set colors (most stars white, some with slight color)
            const colorChoice = Math.random();
            if (colorChoice > 0.95) {
                // Blue stars (hot, young stars)
                colors[i * 3] = 0.6 + Math.random() * 0.4;
                colors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
                colors[i * 3 + 2] = 1.0;
            } else if (colorChoice > 0.9) {
                // Red stars (cool, old stars)
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.4 + Math.random() * 0.3;
                colors[i * 3 + 2] = 0.4 + Math.random() * 0.3;
            } else if (colorChoice > 0.85) {
                // Yellow stars (sun-like)
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
                colors[i * 3 + 2] = 0.4 + Math.random() * 0.3;
            } else {
                // White stars (most common)
                const shade = 0.8 + Math.random() * 0.2;
                colors[i * 3] = shade;
                colors[i * 3 + 1] = shade;
                colors[i * 3 + 2] = shade;
            }
            
            // Set sizes (most small, some larger)
            const sizeChoice = Math.random();
            if (sizeChoice > 0.99) {
                // Very bright stars
                sizes[i] = 3.0 + Math.random() * 2.0;
            } else if (sizeChoice > 0.95) {
                // Bright stars
                sizes[i] = 2.0 + Math.random() * 1.0;
            } else if (sizeChoice > 0.8) {
                // Medium stars
                sizes[i] = 1.0 + Math.random() * 0.5;
            } else {
                // Small stars (most common)
                sizes[i] = 0.1 + Math.random() * 0.5;
            }
        }
        
        // Add attributes to geometry
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create material with correct shaders for Three.js r133
        const starMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                starTexture: { value: createStarTexture() } // Renamed to avoid conflict
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    
                    // Slight twinkling effect
                    float twinkle = sin(time + position.x * 100.0) * 0.1 + 0.9;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * twinkle * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                uniform sampler2D starTexture;
                
                void main() {
                    gl_FragColor = vec4(vColor, 1.0) * texture2D(starTexture, gl_PointCoord);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false
        });
        
        // Create points object
        const points = new THREE.Points(geometry, starMaterial);
        points.frustumCulled = false; // Prevent stars from disappearing
        
        return points;
    }
    
    /**
     * Create a circular gradient texture for stars
     * @returns {Object} THREE.Texture for stars
     */
    function createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    // Public methods
    return {
        /**
         * Initialize the starfield
         * @param {Object} sceneInstance - Three.js scene
         * @param {number} count - Number of stars (optional)
         */
        init: function(sceneInstance, count) {
            if (!sceneInstance) {
                console.error('Scene instance is required for Starfield.init()');
                return null;
            }
            
            scene = sceneInstance;
            
            // Set star count if provided
            if (count) {
                starCount = count;
            }
            
            try {
                // Create star field
                starField = createStars(starCount);
                
                // Add to scene
                scene.add(starField);
                
                console.log(`Starfield initialized with ${starCount} stars`);
                
                return starField;
            } catch (error) {
                console.error('Error initializing starfield:', error);
                return null;
            }
        },
        
        /**
         * Update starfield animation
         * @param {number} time - Current time for animation
         */
        update: function(time) {
            if (!starField || !starField.material.uniforms) return;
            
            // Update time uniform for twinkling effect
            starField.material.uniforms.time.value = time * animationSpeed;
            
            // Subtle rotation
            starField.rotation.y += 0.0001;
            starField.rotation.x += 0.00005;
        },
        
        /**
         * Set animation speed
         * @param {number} speed - New animation speed
         */
        setAnimationSpeed: function(speed) {
            animationSpeed = speed;
            return this;
        },
        
        /**
         * Get the starfield object
         * @returns {Object} THREE.Points object containing the stars
         */
        getStarfield: function() {
            return starField;
        },
        
        /**
         * Set the visibility of the starfield
         * @param {boolean} visible - Whether the starfield should be visible
         */
        setVisible: function(visible) {
            if (starField) {
                starField.visible = visible;
            }
            return this;
        }
    };
})();