/**
 * planetContentSystem.js
 * Manages planet-specific content panels that appear when docked at a planet.
 */

console.log('planetContentSystem.js loaded');

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
        mercury: {
            panels: [
                {
                    title: "Mercury Facts",
                    content: "Mercury is the smallest and innermost planet in the Solar System. Its orbital period around the Sun is only 87.97 Earth days, the shortest of all the planets. Mercury is one of four terrestrial planets in the Solar System, and is a rocky body like Earth.",
                    position: { x: 0, y: 0, z: -20 }  // Closer behind docking position
                },
                {
                    title: "Mercury Exploration",
                    content: "Mercury has been visited by two spacecraft: Mariner 10 and MESSENGER. MESSENGER became the first spacecraft to orbit Mercury, mapping its entire surface. The planet's surface resembles that of the Moon, with numerous impact craters and no natural satellites of its own.",
                    position: { x: -20, y: 0, z: 0 }  // Closer to the left
                },
                {
                    title: "Mercury Environment",
                    content: "Mercury has no atmosphere to retain heat, causing extreme temperature variations. Surface temperatures range from 100 K (-173 °C) at night to 700 K (427 °C) during the day. The planet has a weak magnetic field, about 1% as strong as Earth's.",
                    position: { x: 20, y: 0, z: 0 }  // Closer to the right
                }
            ]
        },
        venus: {
            panels: [
                {
                    title: "Venus Facts",
                    content: "Venus is the second planet from the Sun and is Earth's closest planetary neighbor. It's often called Earth's twin because of their similar size and mass, but Venus has a thick toxic atmosphere filled with carbon dioxide and clouds of sulfuric acid.",
                    position: { x: 0, y: 0, z: -20 }
                },
                {
                    title: "Venus Exploration",
                    content: "Venus has been explored by numerous spacecraft, including Venera, Mariner, Pioneer Venus, and Magellan. The Soviet Venera program achieved the first successful landing on another planet in 1970. Venus's surface is hidden beneath a thick atmosphere, making it difficult to observe from Earth.",
                    position: { x: -20, y: 0, z: 0 }
                },
                {
                    title: "Venus Environment",
                    content: "Venus has the hottest surface of any planet in the Solar System, with a mean temperature of 737 K (464 °C). The planet's atmosphere creates a greenhouse effect that keeps the surface extremely hot. Venus rotates very slowly, with one day lasting 243 Earth days.",
                    position: { x: 20, y: 0, z: 0 }
                }
            ]
        },
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
        },
        mars: {
            panels: [
                {
                    title: "Mars Facts",
                    content: "Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System. It's often called the 'Red Planet' due to its reddish appearance, which is caused by iron oxide (rust) on its surface. Mars has two small moons, Phobos and Deimos.",
                    position: { x: 0, y: 0, z: -20 }
                },
                {
                    title: "Mars Exploration",
                    content: "Mars has been explored by numerous spacecraft, including rovers like Sojourner, Spirit, Opportunity, Curiosity, and Perseverance. These missions have revealed that Mars once had liquid water on its surface and may have supported microbial life in the past.",
                    position: { x: -20, y: 0, z: 0 }
                },
                {
                    title: "Mars Environment",
                    content: "Mars has a thin atmosphere, primarily composed of carbon dioxide. The planet's surface features include the largest volcano in the Solar System (Olympus Mons), a canyon system (Valles Marineris), and polar ice caps. Mars experiences dust storms that can cover the entire planet.",
                    position: { x: 20, y: 0, z: 0 }
                }
            ]
        },
        jupiter: {
            panels: [
                {
                    title: "Jupiter Facts",
                    content: "Jupiter is the fifth planet from the Sun and the largest in the Solar System. It's a gas giant with a mass more than two and a half times that of all the other planets combined. Jupiter's iconic Great Red Spot is a giant storm that has been raging for at least 400 years.",
                    position: { x: 0, y: 0, z: -20 }
                },
                {
                    title: "Jupiter Exploration",
                    content: "Jupiter has been visited by several spacecraft, including Pioneer, Voyager, Galileo, and Juno. The Galileo mission was the first to orbit Jupiter and drop a probe into its atmosphere. Juno is currently studying Jupiter's composition, gravity field, magnetic field, and polar magnetosphere.",
                    position: { x: -20, y: 0, z: 0 }
                },
                {
                    title: "Jupiter Moons",
                    content: "Jupiter has 79 known moons, with the four largest (Io, Europa, Ganymede, and Callisto) known as the Galilean moons. Europa is of particular interest to scientists because it has a subsurface ocean that might harbor life. Ganymede is the largest moon in the Solar System.",
                    position: { x: 20, y: 0, z: 0 }
                }
            ]
        },
        saturn: {
            panels: [
                {
                    title: "Saturn Facts",
                    content: "Saturn is the sixth planet from the Sun and the second-largest in the Solar System. It's known for its prominent ring system, which consists of ice particles, rocky debris, and dust. Saturn is another gas giant with a beautiful appearance due to its rings and numerous moons.",
                    position: { x: 0, y: 0, z: -20 }
                },
                {
                    title: "Saturn Exploration",
                    content: "Saturn has been visited by four spacecraft: Pioneer 11, Voyager 1, Voyager 2, and Cassini. The Cassini mission spent 13 years orbiting Saturn, studying its rings, moons, and atmosphere. Cassini's most famous discovery was the geysers of water ice on the moon Enceladus.",
                    position: { x: -20, y: 0, z: 0 }
                },
                {
                    title: "Saturn Rings",
                    content: "Saturn's rings are made up of billions of particles, ranging in size from tiny grains to mountain-sized chunks. The rings are divided into several sections, with gaps between them. The largest gap, known as the Cassini Division, is about 4,800 kilometers wide.",
                    position: { x: 20, y: 0, z: 0 }
                }
            ]
        },
        uranus: {
            panels: [
                {
                    title: "Uranus Facts",
                    content: "Uranus is the seventh planet from the Sun and the third-largest in the Solar System. It's an ice giant with a unique feature: it rotates on its side, with its axis of rotation nearly parallel to its orbital plane. This gives it extreme seasons that last for about 20 years.",
                    position: { x: 0, y: 0, z: -20 }
                },
                {
                    title: "Uranus Exploration",
                    content: "Uranus has been visited by only one spacecraft: Voyager 2, which flew by the planet in 1986. The mission revealed that Uranus has a complex magnetic field, a system of rings, and 27 known moons. Most of what we know about Uranus comes from this single flyby.",
                    position: { x: -20, y: 0, z: 0 }
                },
                {
                    title: "Uranus Environment",
                    content: "Uranus has a pale blue-green color due to methane in its atmosphere. The planet has a cold atmosphere with temperatures as low as -224°C, making it the coldest planetary atmosphere in the Solar System. Uranus also has a system of 13 rings.",
                    position: { x: 20, y: 0, z: 0 }
                }
            ]
        },
        neptune: {
            panels: [
                {
                    title: "Neptune Facts",
                    content: "Neptune is the eighth and farthest known planet from the Sun. It's the fourth-largest planet by diameter and the third-most-massive. Neptune is another ice giant with a similar composition to Uranus, but with a more active atmosphere.",
                    position: { x: 0, y: 0, z: -20 }
                },
                {
                    title: "Neptune Exploration",
                    content: "Neptune has been visited by only one spacecraft: Voyager 2, which flew by the planet in 1989. The mission discovered Neptune's Great Dark Spot, a storm similar to Jupiter's Great Red Spot, and six new moons. Neptune's largest moon, Triton, was found to have active geysers.",
                    position: { x: -20, y: 0, z: 0 }
                },
                {
                    title: "Neptune Environment",
                    content: "Neptune has the strongest winds in the Solar System, reaching speeds of 2,100 km/h. The planet has a system of rings, though they are much fainter than Saturn's. Neptune's atmosphere is primarily composed of hydrogen and helium, with traces of methane that give it its blue color.",
                    position: { x: 20, y: 0, z: 0 }
                }
            ]
        },
        luna: {
            panels: [
                {
                    title: "Luna Facts",
                    content: "Luna, or the Moon, is Earth's only natural satellite. It's the fifth-largest satellite in the Solar System and the largest relative to its parent planet. The Moon is responsible for ocean tides and has a stabilizing effect on Earth's axial tilt.",
                    position: { x: 0, y: 0, z: -20 }
                },
                {
                    title: "Luna Exploration",
                    content: "The Moon was first visited by the Soviet Luna program in 1959. The Apollo program, particularly Apollo 11 in 1969, achieved the first human landing on the Moon. Six Apollo missions landed on the Moon, with the last one in 1972. The Moon has also been explored by numerous robotic missions.",
                    position: { x: -20, y: 0, z: 0 }
                },
                {
                    title: "Luna Environment",
                    content: "The Moon has no atmosphere, so its surface is directly exposed to space. Temperatures on the Moon range from -233°C at night to 123°C during the day. The Moon's surface is covered in regolith, a layer of loose rock and dust, and features numerous impact craters.",
                    position: { x: 20, y: 0, z: 0 }
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
        if (!sceneRef || !cameraRef || !rendererRef) {
            console.error('PlanetContentSystem: Missing required references', {
                scene: !!sceneRef,
                camera: !!cameraRef,
                renderer: !!rendererRef
            });
            return;
        }

        scene = sceneRef;
        camera = cameraRef;
        renderer = rendererRef;
        
        console.log('PlanetContentSystem initialized with:', {
            scene: scene.uuid,
            camera: camera.uuid,
            renderer: renderer.domElement.id
        });
        
        // Initialize raycaster for click detection
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
        
        // Set up click event listener
        if (renderer.domElement) {
            renderer.domElement.addEventListener('click', handleClick);
            console.log('Click event listener added to renderer');
        } else {
            console.error('Renderer DOM element not found');
        }
        
        // Clear any existing panels
        hideAllPanels();
        
        console.log('Planet Content System initialization complete');
    }
    
    /**
     * Handle click events on panels
     * @param {Event} event - The click event
     */
    function handleClick(event) {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
        
        // Update the picking ray
        raycaster.setFromCamera(mouse, camera);
        
        // Find intersections with clickable objects
        const intersects = raycaster.intersectObjects(clickableObjects, false);
        
        if (intersects.length > 0) {
            console.log('Panel clicked:', intersects[0].object.userData.panelData.title);
            const panel = contentPanels.find(
                p => p.meshFront === intersects[0].object || p.meshBack === intersects[0].object
            );
            if (panel) {
                showDetailPanel(panel.data);
            }
        }
    }
    
    /**
     * Set docking state and handle panel visibility
     * @param {boolean} docked - Whether the system is docked
     * @param {Object} planet - The planet object when docked
     */
    function setDockingState(docked, planet) {
        console.log('Setting docking state:', { 
            docked, 
            planet: planet?.userData?.name,
            scene: !!scene,
            camera: !!camera,
            renderer: !!renderer
        });
        
        isDocked = docked;
        currentPlanet = planet;
        
        // Hide all existing panels first
        hideAllPanels();
        
        if (docked && planet) {
            // Show panels only for the docked planet
            const planetName = planet.userData.name.toLowerCase();
            console.log(`Looking for content for planet: ${planetName}`);
            console.log(`Available planet content:`, Object.keys(planetContent));
            
            if (planetContent[planetName]) {
                console.log(`Found content for ${planetName} with ${planetContent[planetName].panels.length} panels`);
                
                // Create panels with proper positioning
                planetContent[planetName].panels.forEach(panelData => {
                    console.log(`Creating panel: ${panelData.title}`);
                    const panel = createContentPanel(panelData, planet);
                    if (panel) {
                        // Make panel visible and ensure it's added to the scene
                        panel.visible = true;
                        panel.traverse(child => {
                            if (child.isMesh) {
                                child.visible = true;
                                child.material.transparent = true;
                                child.material.opacity = 0.98;
                            }
                        });
                        
                        // Ensure panel is added to scene if not already
                        if (!panel.parent) {
                            scene.add(panel);
                        }
                        
                        console.log(`Panel created and made visible: ${panelData.title}`);
                    } else {
                        console.error(`Failed to create panel: ${panelData.title}`);
                    }
                });
                
                // Force a scene update
                scene.updateMatrixWorld(true);
                console.log(`Created panels for docked planet: ${planetName}`);
            } else {
                console.warn(`No content found for planet: ${planetName}`);
            }
        } else {
            console.log(`Not creating panels: docked=${docked}, planet=${planet ? planet.userData.name : 'none'}`);
        }
    }
    
    /**
     * Create HTML detail panel for a clicked panel
     * @param {Object} panelData - The panel data to display
     */
    function showDetailPanel(panelData) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 999;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: rgba(34, 40, 49, 0.98);
            border: 3px solid #00A3E0;
            border-radius: 15px;
            padding: 30px;
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            color: white;
            font-family: Arial, sans-serif;
            box-shadow: 0 0 30px rgba(0, 163, 224, 0.3);
        `;
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 15px;
            right: 15px;
            background: #00A3E0;
            color: white;
            border: none;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            font-size: 24px;
            line-height: 1;
            cursor: pointer;
            transition: background-color 0.3s;
        `;
        closeButton.onmouseover = () => closeButton.style.background = '#0077B3';
        closeButton.onmouseout = () => closeButton.style.background = '#00A3E0';
        closeButton.onclick = () => {
            document.body.removeChild(overlay);
            document.removeEventListener('keydown', handleEscapeKey);
        };
        
        // Create title
        const title = document.createElement('h2');
        title.textContent = panelData.title;
        title.style.cssText = `
            color: #00A3E0;
            margin: 0 0 20px 0;
            font-size: 32px;
            padding-right: 40px;
        `;
        
        // Create content
        const content = document.createElement('div');
        content.textContent = panelData.content;
        content.style.cssText = `
            line-height: 1.8;
            font-size: 18px;
            color: #FFFFFF;
        `;
        
        // Assemble modal
        modal.appendChild(closeButton);
        modal.appendChild(title);
        modal.appendChild(content);
        overlay.appendChild(modal);
        
        // Add to document
        document.body.appendChild(overlay);
        
        // Add escape key listener
        document.addEventListener('keydown', handleEscapeKey);
        
        // Add click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', handleEscapeKey);
            }
        });
    }
    
    /**
     * Handle Escape key press to close detail panel
     * @param {Event} event - The keydown event
     */
    function handleEscapeKey(event) {
        if (event.key === 'Escape') {
            const overlay = document.querySelector('div[style*="position: fixed"]');
            if (overlay) {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', handleEscapeKey);
            }
        }
    }
    
    /**
     * Create a content panel
     * @param {Object} panelData - Panel data including position
     * @param {Object} planet - The planet object to attach the panel to
     * @returns {Object} The created panel
     */
    function createContentPanel(panelData, planet) {
        if (!scene || !camera || !planet) {
            console.error('Cannot create panel: missing required references', {
                scene: !!scene,
                camera: !!camera,
                planet: !!planet
            });
            return null;
        }

        console.log(`Creating panel "${panelData.title}" for planet ${planet.userData.name}`);
        
        // Create panel geometry - increased size from 10x6 to 15x9
        const panelGeometry = new THREE.PlaneGeometry(15, 9);
        
        // Create canvas for panel content - increased resolution
        const canvas = document.createElement('canvas');
        canvas.width = 1024;  // Increased from 512
        canvas.height = 1024; // Increased from 512
        const ctx = canvas.getContext('2d');
        
        // Draw panel background
        ctx.fillStyle = 'rgba(34, 40, 49, 0.95)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw title
        ctx.fillStyle = '#00A3E0';
        ctx.font = 'bold 48px Arial';  // Increased font size
        ctx.textAlign = 'center';
        ctx.fillText(panelData.title, canvas.width / 2, 100);  // Increased y position
        
        // Draw content
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '32px Arial';  // Increased font size
        const words = panelData.content.split(' ');
        let line = '';
        let y = 200;  // Increased starting y position
        
        words.forEach(word => {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > canvas.width - 80) {  // Increased margin
                ctx.fillText(line, canvas.width / 2, y);
                line = word + ' ';
                y += 60;  // Increased line spacing
            } else {
                line = testLine;
            }
        });
        ctx.fillText(line, canvas.width / 2, y);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.98,
            side: THREE.FrontSide // Only front side for each mesh
        });
        // For the back, use the same material (not mirrored)
        const backMaterial = material.clone();
        backMaterial.side = THREE.FrontSide;
        
        // Create mesh for front
        const panelMeshFront = new THREE.Mesh(panelGeometry, material);
        panelMeshFront.userData.clickable = true;
        panelMeshFront.userData.panelData = panelData;
        panelMeshFront.userData.isContentPanel = true;
        clickableObjects.push(panelMeshFront);
        
        // Create mesh for back (rotated 180deg around Y)
        const panelMeshBack = new THREE.Mesh(panelGeometry, backMaterial);
        panelMeshBack.rotation.y = Math.PI;
        panelMeshBack.userData.clickable = true;
        panelMeshBack.userData.panelData = panelData;
        panelMeshBack.userData.isContentPanel = true;
        clickableObjects.push(panelMeshBack);
        
        // Create a container for the panel
        const container = new THREE.Object3D();
        container.userData.isContentPanel = true;
        container.add(panelMeshFront);
        container.add(panelMeshBack);
        
        // Calculate position relative to planet
        const planetRadius = planet.userData.radius || 5;
        const scaleFactor = planetRadius / 5;
        const panelDistance = planetRadius * 2.5;  // Increased from 2 to 2.5 for better visibility
        
        const scaledPosition = new THREE.Vector3(
            panelData.position.x * scaleFactor,
            panelData.position.y * scaleFactor,
            panelData.position.z * scaleFactor
        ).normalize().multiplyScalar(panelDistance);
        
        // Get planet's world position
        const planetPos = new THREE.Vector3();
        if (planet.getWorldPosition) {
            planet.getWorldPosition(planetPos);
        } else if (planet.position) {
            planetPos.copy(planet.position);
        }
        
        // Set position relative to planet
        container.position.copy(planetPos).add(scaledPosition);
        console.log(`Panel "${panelData.title}" position:`, container.position);
        
        // Make panel face the camera initially
        if (camera) {
            container.lookAt(camera.position);
            console.log(`Panel "${panelData.title}" is facing camera at:`, camera.position);
        }
        
        // Add container to scene
        scene.add(container);
        console.log(`Panel "${panelData.title}" added to scene.`);
        
        // Store panel reference
        contentPanels.push({
            container: container,
            mesh: panelMeshFront, // For backward compatibility
            meshFront: panelMeshFront,
            meshBack: panelMeshBack,
            data: panelData,
            planet: planet,
            isContentPanel: true
        });
        
        // Ensure panel is visible
        container.visible = true;
        container.traverse(child => {
            if (child.isMesh) {
                child.visible = true;
                child.material.transparent = true;
                child.material.opacity = 0.98;
            }
        });
        
        // Force a scene update
        scene.updateMatrixWorld(true);
        
        console.log(`Panel created successfully: ${panelData.title}`);
        return container;
    }
    
    /**
     * Update panel positions and visibility
     */
    function update() {
        // Only update panels if docked
        if (!isDocked || !currentPlanet) return;
        
        // Update all panels to follow their planets
        contentPanels.forEach(panel => {
            if (panel.container && panel.planet) {
                const planetPos = new THREE.Vector3();
                if (panel.planet.getWorldPosition) {
                    panel.planet.getWorldPosition(planetPos);
                } else if (panel.planet.position) {
                    planetPos.copy(panel.planet.position);
                }
                
                // Calculate panel position relative to planet
                const planetRadius = panel.planet.userData.radius || 5;
                const scaleFactor = planetRadius / 5;
                const panelDistance = planetRadius * 3;
                
                const scaledPosition = new THREE.Vector3(
                    panel.data.position.x * scaleFactor,
                    panel.data.position.y * scaleFactor,
                    panel.data.position.z * scaleFactor
                ).normalize().multiplyScalar(panelDistance);
                
                // Update panel position
                panel.container.position.copy(planetPos).add(scaledPosition);
                
                // Make panel face the camera
                if (camera) {
                    panel.container.lookAt(camera.position);
                }
                
                // Ensure panel is visible
                panel.container.visible = true;
                panel.container.traverse(child => {
                    if (child.isMesh) {
                        child.visible = true;
                    }
                });
            }
        });
    }
    
    /**
     * Hide all content panels
     */
    function hideAllPanels() {
        console.log('Hiding all panels');
        
        // Remove all panels from the scene
        contentPanels.forEach(panel => {
            if (panel.container && panel.container.parent) {
                panel.container.parent.remove(panel.container);
            }
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
        });
        
        // Clear the panels array
        contentPanels = [];
        
        // Clear clickable objects
        clickableObjects = [];
        
        // Hide detail panel if visible
        if (detailPanelElement) {
            detailPanelElement.style.display = 'none';
        }
        
        // Force scene to update
        scene.updateMatrixWorld(true);
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
        
        setDockingState: function(docked, planet) {
            console.log('PlanetContentSystem.setDockingState called with:', {docked, planet});
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
        },
        
        /**
         * Hide all content panels
         */
        hideAllPanels: function() {
            hideAllPanels();
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