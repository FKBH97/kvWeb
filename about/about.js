/**
 * about.js
 * Main entry point for the About page
 * With improved corona and planetary orbits
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

/**
 * Initialize the About page
 */
function init() {
  console.log('Initializing About page...');
  
  try {
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
    
    // Initialize sun with enhanced corona
    sun = SunSetup.init(scene);
    
    // Initialize planets
    const planets = PlanetSetup.init(scene);
    
    // Start the animation loop with our update function
    SceneSetup.startAnimationLoop(update);
    
    // Mark as initialized
    isInitialized = true;
    
    // Log success
    console.log('About page initialized successfully.');
    
    // Set up keyboard event listeners for development
    setupKeyboardControls();
    
  } catch (error) {
    // Log any initialization errors
    console.error('Error initializing About page:', error);
    
    // Display error message to user
    showErrorMessage('Failed to initialize 3D view. Please check your browser compatibility.');
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
    // Update sun corona animation using the advanced effect
    if (sun && SunSetup.animateSunCorona) {
      SunSetup.animateSunCorona(timeElapsed);
    }
    
    // Update planet positions if PlanetSetup exists
    if (PlanetSetup && PlanetSetup.updatePlanetPositions) {
      PlanetSetup.updatePlanetPositions(timeElapsed);
    }
    
    // Update debug panel if visible
    updateDebugPanel();
    
  } catch (error) {
    // Log any update errors
    console.error('Error in update loop:', error);
    
    // Continue execution - don't halt the animation loop
  }
}

/**
 * Update the debug panel information if visible
 */
function updateDebugPanel() {
  const debugPanel = document.getElementById('debug-panel');
  if (!debugPanel || debugPanel.classList.contains('hidden')) {
    return;
  }
  
  const fpsCounter = document.getElementById('fps-counter');
  if (fpsCounter) {
    const fps = Math.round(1000 / (performance.now() - lastFrameTime || 1));
    fpsCounter.textContent = fps;
  }
  
  const positionDisplay = document.getElementById('position-display');
  if (positionDisplay && camera) {
    positionDisplay.textContent = `X: ${camera.position.x.toFixed(1)}, Y: ${camera.position.y.toFixed(1)}, Z: ${camera.position.z.toFixed(1)}`;
  }
  
  const nearestObject = document.getElementById('nearest-object');
  if (nearestObject && camera && PlanetSetup && PlanetSetup.getPlanets) {
    let nearest = 'None';
    let minDistance = Infinity;
    
    // Check distance to sun
    if (sun) {
      const distance = camera.position.distanceTo(sun.position);
      nearest = `Sun (${distance.toFixed(1)} units)`;
      minDistance = distance;
    }
    
    // Check distances to planets
    const planets = PlanetSetup.getPlanets();
    if (planets) {
      planets.forEach(planetObj => {
        if (planetObj.planet) {
          const distance = camera.position.distanceTo(planetObj.planet.position);
          if (distance < minDistance) {
            minDistance = distance;
            nearest = `${planetObj.planet.userData.name} (${distance.toFixed(1)} units)`;
          }
        }
      });
    }
    
    nearestObject.textContent = nearest;
  }
}

/**
 * Set up keyboard controls for development/testing
 */
function setupKeyboardControls() {
  document.addEventListener('keydown', function(event) {
    // Press 'D' to toggle debug panel
    if (event.key === 'd' || event.key === 'D') {
      const debugPanel = document.getElementById('debug-panel');
      if (debugPanel) {
        debugPanel.classList.toggle('hidden');
        console.log('Debug panel toggled');
      }
    }
    
    // Press '+' to speed up animation
    if (event.key === '+' || event.key === '=') {
      animationSpeed = Math.min(animationSpeed * 1.5, 10);
      showNotification(`Animation speed: ${animationSpeed.toFixed(1)}x`);
    }
    
    // Press '-' to slow down animation
    if (event.key === '-' || event.key === '_') {
      animationSpeed = Math.max(animationSpeed / 1.5, 0.1);
      showNotification(`Animation speed: ${animationSpeed.toFixed(1)}x`);
    }
    
    // Press '0' to reset animation speed
    if (event.key === '0') {
      animationSpeed = 1.0;
      showNotification('Animation speed reset to 1.0x');
    }
    
    // Press 'R' to reset camera position
    if (event.key === 'r' || event.key === 'R') {
      if (camera) {
        camera.position.set(0, 30, 90);
        camera.lookAt(0, 0, 0);
        if (SceneSetup.getControls()) {
          SceneSetup.getControls().target.set(0, 0, 0);
        }
        showNotification('Camera position reset');
      }
    }
  });
}

/**
 * Display error message to user
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
  const notificationContainer = document.getElementById('notification-container');
  
  if (notificationContainer) {
    notificationContainer.classList.remove('hidden');
    
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.innerHTML = `<strong>Error:</strong> ${message}`;
    
    notificationContainer.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.5s forwards';
      setTimeout(() => {
        notificationContainer.removeChild(notification);
        
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
    if (camera) {
      camera.position.set(0, 30, 90);
      camera.lookAt(0, 0, 0);
      if (SceneSetup.getControls()) {
        SceneSetup.getControls().target.set(0, 0, 0);
      }
    }
  }
};