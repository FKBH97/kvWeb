/**
 * about.js
 * Main entry point for the About page
 * Initializes the scene and coordinates all components
 */

// Wait for DOM to load before initializing
document.addEventListener('DOMContentLoaded', init);

// Global variables
let scene, camera, renderer;
let isInitialized = false;

/**
 * Initialize the About page
 */
function init() {
  console.log('Initializing About page...');
  
  try {
    // Initialize the Three.js scene
    scene = SceneSetup.initializeScene('scene-container', {
      cameraPosition: { x: 0, y: 15, z: 30 },
      enableOrbitControls: true // Enable for development
    });
    
    // Get references to camera and renderer for easier access
    camera = SceneSetup.getCamera();
    renderer = SceneSetup.getRenderer();
    
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
 */
function update() {
  // This will be expanded in future phases
  // For now, it's just a placeholder for the animation loop
  
  // Rotate the test sphere if it exists (for visual confirmation)
  if (window.testSphere) {
    window.testSphere.rotation.y += 0.01;
  }
}

/**
 * Set up keyboard controls for development/testing
 */
function setupKeyboardControls() {
  document.addEventListener('keydown', function(event) {
    // Press 'D' to toggle debug panel (will be implemented fully in debug mode phase)
    if (event.key === 'd' || event.key === 'D') {
      const debugPanel = document.getElementById('debug-panel');
      if (debugPanel) {
        debugPanel.classList.toggle('hidden');
        console.log('Debug panel toggled');
      }
    }
    
    // Add more development keyboard shortcuts as needed
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

// Export functions for potential use by other modules
window.AboutPage = {
  init,
  update
};