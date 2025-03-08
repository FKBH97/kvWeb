/**
 * about.js
 * Main entry point for the About page
 * Handles scene setup, planets, rocket navigation, and UI
 */

// Wait for DOM to load before initializing
document.addEventListener('DOMContentLoaded', init);

// Global variables
let scene, camera, renderer;
let isInitialized = false;
let timeElapsed = 0;
let sun;
let lastFrameTime = 0;
let animationSpeed = 1.0; // Can be adjusted for faster/slower simulation
let rocketInitialized = false;

/**
 * Initialize the About page
 */
async function init() {
  console.log('Initializing About page...');
  
  try {
    // Initialize debugging first for early error reporting
    if (typeof DebugMode !== 'undefined') {
      DebugMode.init();
      DebugMode.log('Starting initialization sequence');
    }
    
    // Initialize the Three.js scene
    scene = SceneSetup.initializeScene('scene-container', {
      cameraPosition: { x: 0, y: 30, z: 90 }, // Adjusted for better view of solar system
      enableOrbitControls: true // Enable for development
    });
    
    // Get references to camera and renderer for easier access
    camera = SceneSetup.getCamera();
    renderer = SceneSetup.getRenderer();
    
    // Remove test sphere from scene
    if (window.testSphere) {
      scene.remove(window.testSphere);
      window.testSphere = null;
    }
    
    // Initialize input manager first
    if (typeof InputManager !== 'undefined') {
      InputManager.init();
      console.log('Input Manager initialized');
    } else {
      console.warn('InputManager not available - controls may be limited');
    }
    
    // Initialize HUD manager
    if (typeof HudManager !== 'undefined') {
      HudManager.init();
      console.log('HUD Manager initialized');
    } else {
      console.warn('HudManager not available - UI updates will be limited');
    }
    
    // Initialize logging system
    if (typeof LoggingSystem !== 'undefined') {
      LoggingSystem.init();
      console.log('Logging System initialized');
    } else {
      console.warn('LoggingSystem not available - event logging will be disabled');
    }
    
    // Initialize starfield
    if (typeof Starfield !== 'undefined') {
      Starfield.init(scene);
      console.log('Starfield initialized');
    } else {
      console.warn('Starfield not available - background will be empty');
    }
    
    // Initialize sun with enhanced corona
    if (typeof SunSetup !== 'undefined') {
      sun = SunSetup.init(scene);
      console.log('Sun initialized');
    } else {
      console.warn('SunSetup not available - using placeholder sun');
      // Create placeholder sun if SunSetup not available
      createPlaceholderSun();
    }
    
    // Initialize planets
    if (typeof PlanetSetup !== 'undefined') {
      PlanetSetup.init(scene);
      console.log('Planets initialized');
    } else {
      console.error('PlanetSetup not available - solar system cannot be created');
      showErrorMessage('Failed to initialize planets - PlanetSetup not found');
    }
    
    // Initialize rocket navigation system
    await initRocketSystem();
    
    // Initialize docking system
    if (typeof DockingSystem !== 'undefined') {
      DockingSystem.init();
      console.log('Docking System initialized');
    } else {
      console.warn('DockingSystem not available - docking with planets will be disabled');
    }
    
    // Initialize FTL system
    if (typeof FTLSystem !== 'undefined') {
      FTLSystem.init();
      console.log('FTL System initialized');
    } else {
      console.warn('FTLSystem not available - FTL jumps will be disabled');
    }
    
    // Make sure no UI panels are showing at startup
    hideAllUIPanels();
    
    // Start the animation loop with our update function
    SceneSetup.startAnimationLoop(update);
    
    // Mark as initialized
    isInitialized = true;
    
    // Log success
    console.log('About page initialized successfully.');
    if (typeof DebugMode !== 'undefined') {
      DebugMode.log('Initialization complete');
    }
    
    // Set up keyboard event listeners for development
    setupKeyboardControls();
    
  } catch (error) {
    // Log any initialization errors
    console.error('Error initializing About page:', error);
    
    // Display error message to user
    showErrorMessage('Failed to initialize 3D view. Please check your browser compatibility and reload the page.');
    
    if (typeof DebugMode !== 'undefined') {
      DebugMode.logError('Initialization failed', error);
    }
  }
}

/**
 * Hide all UI panels at startup to ensure clean state
 */
function hideAllUIPanels() {
  // Hide docking panel if it exists
  const dockingPanel = document.getElementById('planet-info-panel');
  if (dockingPanel) {
    dockingPanel.classList.add('hidden');
    dockingPanel.style.display = 'none';
  }
  
  // Hide FTL menu if it exists
  const ftlMenu = document.getElementById('ftl-menu');
  if (ftlMenu) {
    ftlMenu.classList.add('hidden');
    ftlMenu.style.display = 'none';
  }
  
  // Hide docking prompt
  const dockingPrompt = document.getElementById('docking-prompt');
  if (dockingPrompt) {
    dockingPrompt.classList.add('hidden');
  }
  
  // Hide AI copilot
  const aiCopilot = document.getElementById('ai-copilot');
  if (aiCopilot) {
    aiCopilot.classList.add('hidden');
  }
}

/**
 * Create a placeholder sun if SunSetup is not available
 */
function createPlaceholderSun() {
  const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFDD66,
    emissive: 0xFF9900,
    emissiveIntensity: 0.5
  });
  
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(0, 0, 0);
  scene.add(sun);
  
  console.log('Placeholder sun created');
}

/**
 * Initialize the rocket navigation system
 */
async function initRocketSystem() {
  console.log('Initializing rocket navigation system...');
  
  try {
    // Skip if rocket controls are not available
    if (typeof RocketControls === 'undefined') {
      console.warn('RocketControls not available - rocket navigation will be disabled');
      return;
    }
    
    // Initialize rocket controls with scene and camera
    await RocketControls.init(scene, camera);
    console.log('Rocket controls initialized');
    
    // Register docking key (E) handling
    if (typeof InputManager !== 'undefined' && typeof DockingSystem !== 'undefined') {
      InputManager.registerKeyListener('e', function(isPressed) {
        const dockingPrompt = document.getElementById('docking-prompt');
        if (isPressed && dockingPrompt && !dockingPrompt.classList.contains('hidden')) {
          DockingSystem.initiateDocking();
        }
      });
    }
    
    // Set up logging for boost activation if LoggingSystem exists
    if (typeof LoggingSystem !== 'undefined') {
      LoggingSystem.logEvent('rocket_initialized', {
        position: RocketControls.getPosition()
      });
    }
    
    rocketInitialized = true;
    
    console.log('Rocket system initialized successfully');
  } catch (error) {
    console.error('Error initializing rocket system:', error);
    
    // Show error notification
    showErrorMessage('Failed to initialize rocket system. Some navigation features may be disabled.');
    
    if (typeof DebugMode !== 'undefined') {
      DebugMode.logError('Rocket initialization failed', error);
    }
  }
}

/**
 * Main update function called every frame
 * @param {number} timestamp - Current timestamp from requestAnimationFrame
 */
function update(timestamp) {
  // Calculate delta time for smooth animation
  const deltaTime = timestamp - lastFrameTime || 0;
  lastFrameTime = timestamp;
  
  // Scale by animation speed factor (seconds)
  const deltaSeconds = (deltaTime / 1000) * animationSpeed;
  
  // Safely increment time (with a cap to prevent huge jumps if tab was inactive)
  timeElapsed += Math.min(deltaSeconds, 0.1);
  
  try {
    // Update starfield if available
    if (typeof Starfield !== 'undefined' && Starfield.update) {
      Starfield.update(timeElapsed);
    }
    
    // Update sun corona animation if available
    if (sun && typeof SunSetup !== 'undefined' && SunSetup.animateSunCorona) {
      SunSetup.animateSunCorona(timeElapsed);
    }
    
    // Update planet positions if available
    if (typeof PlanetSetup !== 'undefined' && PlanetSetup.updatePlanetPositions) {
      PlanetSetup.updatePlanetPositions(deltaSeconds);
    }
    
    // Update rocket system
    updateRocketSystem(timestamp, deltaSeconds);
    
    // Update debug panel if available
    if (typeof DebugMode !== 'undefined' && DebugMode.update) {
      DebugMode.update(timestamp);
    }
    
  } catch (error) {
    // Log any update errors
    console.error('Error in update loop:', error);
    
    // Log with debugging system if available
    if (typeof DebugMode !== 'undefined') {
      DebugMode.logError('Update loop error', error);
    }
    
    // Continue execution - don't halt the animation loop
  }
}

/**
 * Update the rocket system
 * @param {number} timestamp - Current timestamp
 * @param {number} deltaSeconds - Time since last frame in seconds
 */
function updateRocketSystem(timestamp, deltaSeconds) {
  if (!rocketInitialized) return;
  
  try {
    // Update rocket controls
    if (typeof RocketControls !== 'undefined' && RocketControls.update) {
      RocketControls.update(timestamp);
    }
  } catch (error) {
    console.error('Error updating rocket system:', error);
    
    // Log with debugging system if available
    if (typeof DebugMode !== 'undefined') {
      DebugMode.logError('Rocket system update failed', error);
    }
  }
}

/**
 * Set up keyboard controls for development/testing
 */
function setupKeyboardControls() {
  // Use InputManager if available
  if (typeof InputManager !== 'undefined') {
    // Register keys for animation speed control
    InputManager.registerKeyListener('=', function(isPressed) {
      if (isPressed) {
        animationSpeed = Math.min(animationSpeed * 1.5, 10);
        showNotification(`Animation speed: ${animationSpeed.toFixed(1)}x`);
      }
    });
    
    InputManager.registerKeyListener('-', function(isPressed) {
      if (isPressed) {
        animationSpeed = Math.max(animationSpeed / 1.5, 0.1);
        showNotification(`Animation speed: ${animationSpeed.toFixed(1)}x`);
      }
    });
    
    InputManager.registerKeyListener('0', function(isPressed) {
      if (isPressed) {
        animationSpeed = 1.0;
        showNotification('Animation speed reset to 1.0x');
      }
    });
    
    // Reset camera position
    InputManager.registerKeyListener('r', function(isPressed) {
      if (isPressed) {
        resetCamera();
      }
    });
    
    // Reset rocket position
    InputManager.registerKeyListener('x', function(isPressed) {
      if (isPressed && rocketInitialized && typeof RocketControls !== 'undefined') {
        RocketControls.resetPosition();
        showNotification('Rocket position reset');
      }
    });
  } else {
    // Fallback to direct event listeners if InputManager is not available
    document.addEventListener('keydown', function(event) {
      // Animation speed controls
      if (event.key === '+' || event.key === '=') {
        animationSpeed = Math.min(animationSpeed * 1.5, 10);
        showNotification(`Animation speed: ${animationSpeed.toFixed(1)}x`);
      }
      
      if (event.key === '-' || event.key === '_') {
        animationSpeed = Math.max(animationSpeed / 1.5, 0.1);
        showNotification(`Animation speed: ${animationSpeed.toFixed(1)}x`);
      }
      
      if (event.key === '0') {
        animationSpeed = 1.0;
        showNotification('Animation speed reset to 1.0x');
      }
      
      // Reset camera position
      if (event.key === 'r' || event.key === 'R') {
        resetCamera();
      }
      
      // Toggle orbit lines
      if (event.key === 'o' || event.key === 'O') {
        if (typeof PlanetSetup !== 'undefined' && PlanetSetup.toggleOrbitLines) {
          const orbitsVisible = PlanetSetup.toggleOrbitLines();
          showNotification(`Orbit lines ${orbitsVisible ? 'shown' : 'hidden'}`);
        }
      }
      
      // Reset rocket position
      if ((event.key === 'x' || event.key === 'X') && 
          rocketInitialized && 
          typeof RocketControls !== 'undefined') {
        RocketControls.resetPosition();
        showNotification('Rocket position reset');
      }
    });
  }
}

/**
 * Reset camera to default position
 */
function resetCamera() {
  if (camera) {
    camera.position.set(0, 30, 90);
    camera.lookAt(0, 0, 0);
    
    if (typeof SceneSetup !== 'undefined' && SceneSetup.getControls) {
      const controls = SceneSetup.getControls();
      if (controls) {
        controls.target.set(0, 0, 0);
      }
    }
    
    showNotification('Camera position reset');
  }
}

/**
 * Display error message to user
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
  // Try to use HudManager if available
  if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
    HudManager.showNotification(message, 'error');
    return;
  }
  
  // Fallback to direct DOM manipulation
  const notificationContainer = document.getElementById('notification-container');
  
  if (notificationContainer) {
    notificationContainer.classList.remove('hidden');
    
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.innerHTML = `<strong>Error:</strong> ${message}`;
    notification.style.color = '#FF5555';
    notification.style.borderLeft = '4px solid #FF0000';
    
    notificationContainer.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.5s forwards';
      setTimeout(() => {
        if (notification.parentNode === notificationContainer) {
          notificationContainer.removeChild(notification);
        }
        
        // Hide container if no more notifications
        if (notificationContainer.children.length === 0) {
          notificationContainer.classList.add('hidden');
        }
      }, 500);
    }, 5000);
  } else {
    // Fallback to alert if notification container doesn't exist
    alert(`Error: ${message}`);
  }
}

/**
 * Display a notification message
 * @param {string} message - Message to display
 */
function showNotification(message) {
  // Try to use HudManager if available
  if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
    HudManager.showNotification(message);
    return;
  }
  
  // Fallback to direct DOM manipulation
  const notificationContainer = document.getElementById('notification-container');
  
  if (notificationContainer) {
    notificationContainer.classList.remove('hidden');
    
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = message;
    
    notificationContainer.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.5s forwards';
      setTimeout(() => {
        if (notification.parentNode === notificationContainer) {
          notificationContainer.removeChild(notification);
        }
        
        // Hide container if no more notifications
        if (notificationContainer.children.length === 0) {
          notificationContainer.classList.add('hidden');
        }
      }, 500);
    }, 3000);
  }
}

// Export functions for potential use by other modules
window.AboutPage = {
  init,
  update,
  setAnimationSpeed: function(speed) {
    animationSpeed = speed;
    return animationSpeed;
  },
  getAnimationSpeed: function() {
    return animationSpeed;
  },
  resetCamera: function() {
    resetCamera();
  },
  resetRocket: function() {
    if (rocketInitialized && typeof RocketControls !== 'undefined') {
      RocketControls.resetPosition();
    }
  }
};