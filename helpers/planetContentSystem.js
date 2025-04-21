/**
 * planetContentSystem.js
 * Manages planet-specific content panels that appear when docked at a planet.
 */

const PlanetContentSystem = (function() {
    // Private variables
    let scene;
    let camera;
    let renderer;
    let contentPanels = [];
    let isDocked = false;
    let currentPlanet = null;
    let raycaster;
    let mouse;
    let clickableObjects = [];
    let detailPanelElement = null;
    
    // Content for each planet
    const planetContent = {
        earth: {
            panels: [
                {
                    title: "About Me",
                    content: "Self-motivated and results-oriented Senior Product Manager with over 5+ years of commensurate experience in product management, data analytics, product optimization, and business development initiatives with a direct emphasis on using mobile application development, web architecture, and user experience to achieve business targets and a personal interest in games as a service and games systems designs",
                    position: { x: 0, y: 0, z: -20 }  // Closer behind docking position
                },
                {
                    title: "Skills",
                    content: "Product Management, Data Analytics, Product Optimization, Business Development, Mobile App Development, Web Architecture, User Experience, Games as a Service, Game Systems Design",
                    position: { x: -20, y: 0, z: 0 }  // Closer to the left
                },
                {
                    title: "Projects",
                    content: "Led development of multiple successful mobile applications, Optimized user experience for web platforms, Implemented data-driven product strategies, Managed cross-functional teams for game development projects",
                    position: { x: 20, y: 0, z: 0 }  // Closer to the right
                }
            ]
        }
    };
    
    /**
     * Initialize the planet content system
     * @param {Object} sceneRef - Three.js scene
     * @param {Object} cameraRef - Camera
     * @param {Object} rendererRef - Three.js renderer
     */
    function init(sceneRef, cameraRef, rendererRef) {
        scene = sceneRef;
        camera = cameraRef;
        renderer = rendererRef;
        
        // Initialize raycaster for click detection
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
        
        // Set up click event listener
        renderer.domElement.addEventListener('click', handleClick);
        
        console.log('Planet Content System initialized with interactivity');
    }
    
    /**
     * Handle click events on panels
     * @param {Event} event - The click event
     */
    function handleClick(event) {
        // Only handle clicks when docked
        if (!isDocked) return;
        
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
        
        // Update the picking ray
        raycaster.setFromCamera(mouse, camera);
        
        // Find intersections with clickable objects
        const intersects = raycaster.intersectObjects(clickableObjects, false);
        
        if (intersects.length > 0) {
            const panel = contentPanels.find(p => p.mesh === intersects[0].object);
            if (panel) {
                showDetailPanel(panel.data);
            }
        }
    }
    
    /**
     * Create HTML detail panel for a clicked panel
     * @param {Object} panelData - The panel data to display
     */
    function showDetailPanel(panelData) {
        // Create or get the detail panel container
        if (!detailPanelElement) {
            detailPanelElement = document.createElement('div');
            detailPanelElement.id = 'content-detail-panel';
            detailPanelElement.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 800px;
                background: rgba(34, 40, 49, 0.98);
                border: 3px solid #00A3E0;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
                color: white;
                font-family: Arial, sans-serif;
                z-index: 1000;
                padding: 20px;
                display: none;
                max-height: 80vh;
                overflow-y: auto;
            `;
            document.body.appendChild(detailPanelElement);
        }
        
        // Set content
        detailPanelElement.innerHTML = `
            <div style="position: relative;">
                <h2 style="color: #00A3E0; margin-top: 0; padding-right: 40px; font-size: 28px;">${panelData.title}</h2>
                <button id="close-detail-panel" style="
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: #00A3E0;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    font-size: 20px;
                    line-height: 1;
                    cursor: pointer;
                ">×</button>
                <div style="line-height: 1.6; font-size: 18px; margin-top: 15px;">
                    ${panelData.content}
                </div>
            </div>
        `;
        
        // Show the panel
        detailPanelElement.style.display = 'block';
        
        // Add close button event listener
        document.getElementById('close-detail-panel').addEventListener('click', hideDetailPanel);
        
        // Add escape key listener
        document.addEventListener('keydown', handleEscapeKey);
    }
    
    /**
     * Handle Escape key press to close detail panel
     * @param {Event} event - The keydown event
     */
    function handleEscapeKey(event) {
        if (event.key === 'Escape') {
            hideDetailPanel();
        }
    }
    
    /**
     * Hide the detail panel
     */
    function hideDetailPanel() {
        if (detailPanelElement) {
            detailPanelElement.style.display = 'none';
        }
        
        // Remove escape key listener
        document.removeEventListener('keydown', handleEscapeKey);
    }
    
    /**
     * Create a content panel
     * @param {Object} panelData - Panel data including position
     * @returns {Object} The created panel
     */
    function createContentPanel(panelData) {
        const panelGeometry = new THREE.PlaneGeometry(25, 18);
        
        // Create canvas for the panel content
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1536;
        const context = canvas.getContext('2d');
        
        // Set background
        context.fillStyle = 'rgba(34, 40, 49, 0.95)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add border
        context.strokeStyle = '#00A3E0';
        context.lineWidth = 8;
        context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
        
        // Add title
        context.font = 'bold 96px Arial';
        context.fillStyle = '#00A3E0';
        context.textAlign = 'center';
        context.fillText(panelData.title, canvas.width / 2, 120);
        
        // Add content with word wrap
        context.font = '64px Arial';
        context.fillStyle = '#FFFFFF';
        context.textAlign = 'left';
        
        const words = panelData.content.split(' ');
        let line = '';
        let y = 240;
        const maxWidth = canvas.width - 120;
        const lineHeight = 80;
        
        words.forEach(word => {
            const testLine = line + word + ' ';
            const metrics = context.measureText(testLine);
            if (metrics.width > maxWidth) {
                context.fillText(line, 60, y);
                line = word + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        });
        context.fillText(line, 60, y);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide
        });
        
        // Create mesh
        const panelMesh = new THREE.Mesh(panelGeometry, material);
        
        // Make mesh clickable
        panelMesh.userData.clickable = true;
        panelMesh.userData.panelData = panelData;
        panelMesh.userData.isContentPanel = true;
        clickableObjects.push(panelMesh);
        
        // Create a container for the panel
        const container = new THREE.Object3D();
        container.userData.isContentPanel = true;
        container.add(panelMesh);
        
        // Set absolute position
        container.position.set(
            panelData.position.x,
            panelData.position.y,
            panelData.position.z
        );
        
        // Add container to scene
        scene.add(container);
        
        // Store panel reference
        contentPanels.push({
            container: container,
            mesh: panelMesh,
            data: panelData,
            isContentPanel: true
        });
        
        return container;
    }
    
    /**
     * Show content panels for current docking position
     */
    function showPanels() {
        hideAllPanels();
        
        // Get panels for the current planet
        const planetName = currentPlanet ? currentPlanet.userData.name.toLowerCase() : null;
        const planetData = planetContent[planetName];
        
        if (!planetData) return;
        
        planetData.panels.forEach(panelData => {
            createContentPanel(panelData);
        });
    }
    
    /**
     * Force remove all panel-related objects from the scene
     */
    function forceCleanupScene() {
        // Traverse the entire scene to find and remove any remaining panels
        scene.traverse((object) => {
            if (object.userData && object.userData.isContentPanel) {
                if (object.parent) {
                    object.parent.remove(object);
                }
                if (object.material) {
                    if (object.material.map) {
                        object.material.map.dispose();
                    }
                    object.material.dispose();
                }
                if (object.geometry) {
                    object.geometry.dispose();
                }
            }
        });

        // Force scene to update
        scene.updateMatrixWorld(true);
        
        // Clear any remaining references
        clickableObjects.length = 0;
        contentPanels.length = 0;
    }
    
    /**
     * Hide all content panels
     */
    function hideAllPanels() {
        console.log('PlanetContentSystem: Hiding all panels, count:', contentPanels.length);
        
        // Store a temporary reference to all panels we need to clean up
        const panelsToRemove = [...contentPanels];
        
        // Clear arrays first to prevent any further updates
        clickableObjects.length = 0;
        contentPanels.length = 0;
        
        // Now clean up each panel
        panelsToRemove.forEach(panel => {
            try {
                // Remove the container from the scene
                if (panel.container) {
                    scene.remove(panel.container);
                    
                    // Also remove mesh from container
                    if (panel.mesh && panel.mesh.parent === panel.container) {
                        panel.container.remove(panel.mesh);
                    }
                }
                
                // Handle material and geometry disposal
                if (panel.mesh) {
                    if (panel.mesh.material) {
                        if (panel.mesh.material.map) {
                            panel.mesh.material.map.dispose();
                        }
                        panel.mesh.material.dispose();
                    }
                    if (panel.mesh.geometry) {
                        panel.mesh.geometry.dispose();
                    }
                }
                
                // If for some reason the mesh is directly in the scene, remove it
                if (panel.mesh && panel.mesh.parent === scene) {
                    scene.remove(panel.mesh);
                }
            } catch (e) {
                console.error('Error removing panel:', e);
            }
        });
        
        // Force additional cleanup of any remaining panels
        forceCleanupScene();
        
        // Hide detail panel
        hideDetailPanel();
    }
    
    /**
     * Set docking state and update content visibility
     * @param {boolean} docked - Whether the rocket is docked
     * @param {Object} planet - The planet the rocket is docked at
     */
    function setDockingState(docked, planet) {
        // Force cleanup first, regardless of state
        hideAllPanels();
        forceCleanupScene();
        
        // Update state
        isDocked = docked;
        currentPlanet = planet;
        
        // If docking, show new panels
        if (isDocked) {
            showPanels();
        }
    }
    
    /**
     * Update the planet content system
     */
    function update() {
        // Force-check docking state
        const dockingSystemAvailable = typeof DockingSystem !== 'undefined';
        const systemDocked = dockingSystemAvailable && typeof DockingSystem.isDocked === 'function' 
            ? DockingSystem.isDocked() 
            : false;
        
        // If we should be undocked, force cleanup
        if (!systemDocked && isDocked) {
            setDockingState(false, null);
            return;
        }
        
        // Only update panels if we're docked
        if (isDocked) {
            contentPanels.forEach(panel => {
                if (!panel.mesh || !panel.container) return;
                
                try {
                    // Make panel face the camera
                    const dockingCamera = dockingSystemAvailable && DockingSystem.getDockingCamera 
                        ? DockingSystem.getDockingCamera() 
                        : camera;
                    panel.mesh.lookAt(dockingCamera.position);
                    panel.mesh.up.set(0, 1, 0);
                } catch (e) {
                    console.error('Error updating panel:', e);
                }
            });
        }
    }
    
    // Public methods
    return {
        /**
         * Initialize the planet content system
         * @param {Object} sceneInstance - The Three.js scene
         * @param {Object} cameraInstance - The camera
         * @param {Object} rendererInstance - The renderer
         */
        init: function(sceneInstance, cameraInstance, rendererInstance) {
            init(sceneInstance, cameraInstance, rendererInstance);
        },
        
        /**
         * Set docking state
         * @param {boolean} docked - Whether the rocket is docked
         * @param {Object} planet - The planet the rocket is docked at
         */
        setDockingState: function(docked, planet) {
            setDockingState(docked, planet);
        },
        
        /**
         * Update the planet content system
         */
        update: function() {
            update();
        },
        
        /**
         * Hide detail panel - exposed for external calls
         */
        hideDetailPanel: function() {
            hideDetailPanel();
        }
    };
})();

// Initialize if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('PlanetContentSystem module loaded');
} else {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('PlanetContentSystem module loaded');
    });
} 