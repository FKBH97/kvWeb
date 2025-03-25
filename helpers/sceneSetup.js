/**
 * sceneSetup.js
 * Initializes Three.js scene, lighting, and camera.
 * Handles renderer setup and scene management.
 */

// Namespace to avoid global scope pollution
const SceneSetup = (function() {
    // Private variables
    let scene, renderer, camera, controls;
    let container;
    let animationFrameId;
    let isInitialized = false;
    
    // Default settings
    const defaultSettings = {
      cameraPosition: { x: 0, y: 15, z: 30 },
      backgroundColor: 0x000000, // Black background for space
      ambientLightColor: 0x404040, // Soft ambient light
      directionalLightColor: 0xFFFFFF, // White directional light (sun)
      directionalLightIntensity: 1.0,
      enableOrbitControls: true // For development/debugging
    };
    
    // Public methods
    return {
      /**
       * Initialize the Three.js scene
       * @param {string} containerId - ID of the container element
       * @param {Object} settings - Optional settings to override defaults
       */
      initializeScene: function(containerId = 'scene-container', settings = {}) {
        if (isInitialized) {
          console.warn('Scene is already initialized.');
          return;
        }
        
        // Merge default settings with provided settings
        const config = { ...defaultSettings, ...settings };
        
        // Get container
        container = document.getElementById(containerId);
        if (!container) {
          console.error(`Container element with id "${containerId}" not found.`);
          return;
        }
        
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(config.backgroundColor);
        
        // Set up renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);
        
        // Set up camera
        const aspect = container.clientWidth / container.clientHeight;
        camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        camera.position.set(
          config.cameraPosition.x,
          config.cameraPosition.y,
          config.cameraPosition.z
        );
        camera.lookAt(0, 0, 0);
        
        // Set up orbit controls for debugging if enabled
        if (config.enableOrbitControls && typeof THREE.OrbitControls !== 'undefined') {
          controls = new THREE.OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;
        }
        
        // Add lighting
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(config.ambientLightColor);
        scene.add(ambientLight);
        
        // Directional light to simulate sun
        const directionalLight = new THREE.DirectionalLight(
          config.directionalLightColor, 
          config.directionalLightIntensity
        );
        directionalLight.position.set(5, 10, 7);
        scene.add(directionalLight);
        
        // Add placeholder object to confirm scene is active
        this.addPlaceholderObject();
        
        // Set up window resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Mark as initialized
        isInitialized = true;
        
        // Log success
        console.log('Scene initialized successfully.');
        
        // Return scene for further modifications
        return scene;
      },
      
      /**
       * Add a placeholder sphere to confirm scene rendering
       */
      addPlaceholderObject: function() {
        const geometry = new THREE.SphereGeometry(5, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
          color: 0x1E88E5,
          metalness: 0.3,
          roughness: 0.6
        });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
        
        // Add this to window for easy access in console for debugging
        window.testSphere = sphere;
      },
      
      /**
       * Handle window resize events
       */
      handleResize: function() {
        if (!camera || !renderer || !container) return;
        
        // Update camera aspect ratio
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        
        // Update renderer size
        renderer.setSize(container.clientWidth, container.clientHeight);
      },
      
      /**
       * Start animation loop
       * @param {Function} updateCallback - Custom update function called each frame
       */
      startAnimationLoop: function(updateCallback) {
        if (!scene || !camera || !renderer) {
          console.error('Scene not initialized. Call initializeScene first.');
          return;
        }
        
        // Animation loop
        const animate = () => {
          animationFrameId = requestAnimationFrame(animate);
          
          // Update orbit controls if they exist
          if (controls) {
            controls.update();
          }
          
          // Call custom update function if provided
          if (typeof updateCallback === 'function') {
            updateCallback();
          }
          
          // Render the scene
          renderer.render(scene, camera);
        };
        
        // Start the animation loop
        animate();
      },
      
      /**
       * Stop animation loop
       */
      stopAnimationLoop: function() {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      },
      
      /**
       * Clean up resources
       */
      dispose: function() {
        // Stop animation loop
        this.stopAnimationLoop();
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        // Dispose of OrbitControls
        if (controls) {
          controls.dispose();
        }
        
        // Clear the container
        if (container && renderer) {
          container.removeChild(renderer.domElement);
        }
        
        // Reset variables
        scene = null;
        renderer = null;
        camera = null;
        controls = null;
        container = null;
        isInitialized = false;
      },
      
      /**
       * Get the camera instance
       * @returns {THREE.Camera} The camera instance
       */
      getCamera: function() {
        return camera;
      },
      
      /**
       * Get the renderer instance
       * @returns {THREE.WebGLRenderer} The renderer instance
       */
      getRenderer: function() {
        return renderer;
      },
      
      /**
       * Get the orbit controls instance
       * @returns {THREE.OrbitControls} The orbit controls instance
       */
      getControls: function() {
        return controls;
      }
    };
  })();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SceneSetup;
}