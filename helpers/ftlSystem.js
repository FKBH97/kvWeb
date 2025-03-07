/**
 * ftlSystem.js
 * Handles FTL menu, transitions, and page navigation.
 */

const FTLSystem = (function() {
    // Private variables
    let ftlMenuOpen = false;
    let transitioning = false;
    let ftlMenu = null;
    let ftlOverlay = null;
    
    // Available destinations
    const destinations = [
        {
            name: 'About',
            description: 'The main solar system with planetary reference models.',
            path: '/about/',
            icon: '🪐'
        },
        {
            name: 'Projects',
            description: 'A showcase of projects represented as unique planets.',
            path: '/projects/',
            icon: '🌌'
        },
        {
            name: 'Exploration',
            description: 'Coming soon: Procedurally generated planets to explore.',
            path: '#',
            disabled: true,
            icon: '🚀'
        }
    ];
    
    /**
     * Create the FTL menu
     */
    function createFTLMenu() {
        if (ftlMenu) return;
        
        // Create menu container
        ftlMenu = document.createElement('div');
        ftlMenu.id = 'ftl-menu';
        ftlMenu.className = 'ftl-ui hidden';
        ftlMenu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            max-width: 700px;
            background-color: rgba(24, 30, 49, 0.95);
            border: 2px solid #550088;
            border-radius: 10px;
            padding: 20px;
            color: #FFFFFF;
            z-index: 200;
            display: flex;
            flex-direction: column;
            gap: 15px;
            box-shadow: 0 0 30px rgba(85, 0, 136, 0.5);
        `;
        
        // Add heading
        const heading = document.createElement('h2');
        heading.textContent = 'FTL Navigation System';
        heading.style.cssText = `
            margin: 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #550088;
            color: #550088;
            text-align: center;
            text-shadow: 0 0 10px rgba(85, 0, 136, 0.7);
        `;
        ftlMenu.appendChild(heading);
        
        // Add description
        const description = document.createElement('p');
        description.textContent = 'Select a destination for FTL jump:';
        description.style.cssText = `
            font-size: 16px;
            margin: 0;
            text-align: center;
        `;
        ftlMenu.appendChild(description);
        
        // Add destinations list
        const destinationsList = document.createElement('div');
        destinationsList.className = 'ftl-destinations';
        destinationsList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-top: 10px;
        `;
        
        // Add each destination
        destinations.forEach(destination => {
            const destinationItem = document.createElement('div');
            destinationItem.className = `ftl-destination ${destination.disabled ? 'disabled' : ''}`;
            destinationItem.style.cssText = `
                background-color: rgba(55, 65, 95, 0.7);
                border: 1px solid ${destination.disabled ? '#555555' : '#550088'};
                border-radius: 8px;
                padding: 15px;
                display: flex;
                align-items: center;
                gap: 15px;
                cursor: ${destination.disabled ? 'not-allowed' : 'pointer'};
                transition: background-color 0.3s, transform 0.2s;
                opacity: ${destination.disabled ? '0.6' : '1'};
            `;
            
            if (!destination.disabled) {
                destinationItem.onmouseover = function() {
                    this.style.backgroundColor = 'rgba(85, 65, 145, 0.7)';
                    this.style.transform = 'scale(1.02)';
                };
                destinationItem.onmouseout = function() {
                    this.style.backgroundColor = 'rgba(55, 65, 95, 0.7)';
                    this.style.transform = 'scale(1)';
                };
                destinationItem.onclick = function() {
                    initiateFTLJump(destination);
                };
            }
            
            // Add icon
            const icon = document.createElement('div');
            icon.className = 'ftl-destination-icon';
            icon.textContent = destination.icon;
            icon.style.cssText = `
                font-size: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 50px;
            `;
            destinationItem.appendChild(icon);
            
            // Add content
            const content = document.createElement('div');
            content.className = 'ftl-destination-content';
            content.style.cssText = `
                flex-grow: 1;
            `;
            
            const name = document.createElement('h3');
            name.textContent = destination.name;
            name.style.cssText = `
                margin: 0 0 5px 0;
                font-size: 18px;
                color: #FFFFFF;
            `;
            content.appendChild(name);
            
            const desc = document.createElement('p');
            desc.textContent = destination.description;
            desc.style.cssText = `
                margin: 0;
                font-size: 14px;
                color: #CCCCCC;
            `;
            content.appendChild(desc);
            
            destinationItem.appendChild(content);
            
            // Add status
            if (window.location.pathname.endsWith(destination.path)) {
                const status = document.createElement('div');
                status.className = 'ftl-destination-status';
                status.textContent = 'Current Location';
                status.style.cssText = `
                    padding: 4px 8px;
                    background-color: #550088;
                    color: #FFFFFF;
                    font-size: 12px;
                    border-radius: 4px;
                `;
                destinationItem.appendChild(status);
                destinationItem.style.backgroundColor = 'rgba(85, 0, 136, 0.3)';
                destinationItem.style.cursor = 'default';
                destinationItem.onmouseover = null;
                destinationItem.onmouseout = null;
                destinationItem.onclick = null;
            } else if (destination.disabled) {
                const status = document.createElement('div');
                status.className = 'ftl-destination-status';
                status.textContent = 'Unavailable';
                status.style.cssText = `
                    padding: 4px 8px;
                    background-color: #555555;
                    color: #FFFFFF;
                    font-size: 12px;
                    border-radius: 4px;
                `;
                destinationItem.appendChild(status);
            }
            
            destinationsList.appendChild(destinationItem);
        });
        
        ftlMenu.appendChild(destinationsList);
        
        // Add close button
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: center;
            margin-top: 15px;
        `;
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Cancel Jump';
        closeButton.style.cssText = `
            background-color: #333333;
            color: #FFFFFF;
            border: none;
            border-radius: 5px;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
        `;
        closeButton.onmouseover = function() {
            this.style.backgroundColor = '#444444';
        };
        closeButton.onmouseout = function() {
            this.style.backgroundColor = '#333333';
        };
        closeButton.onclick = function() {
            closeFTLMenu();
        };
        
        buttonContainer.appendChild(closeButton);
        ftlMenu.appendChild(buttonContainer);
        
        // Add to document
        document.body.appendChild(ftlMenu);
        
        // Create overlay
        createFTLOverlay();
    }
    
    /**
     * Create the FTL transition overlay for visual effects
     */
    function createFTLOverlay() {
        if (ftlOverlay) return;
        
        ftlOverlay = document.createElement('div');
        ftlOverlay.id = 'ftl-overlay';
        ftlOverlay.className = 'hidden';
        ftlOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(ellipse at center, rgba(85, 0, 136, 0) 0%, rgba(85, 0, 136, 0.8) 100%);
            z-index: 150;
            opacity: 0;
            transition: opacity 0.5s;
            pointer-events: none;
        `;
        
        // Add light streak effects
        for (let i = 0; i < 20; i++) {
            const streak = document.createElement('div');
            streak.className = 'ftl-streak';
            
            // Random positioning and sizing
            const size = Math.random() * 3 + 1;
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            const angle = Math.random() * 360;
            const delay = Math.random() * 0.5;
            
            streak.style.cssText = `
                position: absolute;
                left: ${left}%;
                top: ${top}%;
                width: ${size}px;
                height: ${size * (Math.random() * 20 + 10)}px;
                background-color: rgba(255, 255, 255, 0.8);
                transform: rotate(${angle}deg);
                opacity: 0;
                box-shadow: 0 0 10px 2px rgba(85, 0, 136, 0.8);
                animation: ftlStreak 1.5s ${delay}s ease-in infinite;
            `;
            
            ftlOverlay.appendChild(streak);
        }
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ftlStreak {
                0% {
                    opacity: 0;
                    transform: translateX(-100px) rotate(${Math.random() * 360}deg);
                }
                20% {
                    opacity: 0.8;
                }
                100% {
                    opacity: 0;
                    transform: translateX(${window.innerWidth + 200}px) rotate(${Math.random() * 360}deg);
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(ftlOverlay);
    }
    
    /**
     * Show the FTL menu
     */
    function showFTLMenu() {
        if (!ftlMenu) createFTLMenu();
        
        ftlMenu.classList.remove('hidden');
        ftlMenuOpen = true;
        
        // Disable rocket controls if available
        if (typeof RocketControls !== 'undefined' && RocketControls.setEnabled) {
            RocketControls.setEnabled(false);
        }
        
        // Log event
        if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logEvent) {
            LoggingSystem.logEvent('ftl_menu_opened', {
                time: Date.now()
            });
        }
    }
    
    /**
     * Close the FTL menu
     */
    function closeFTLMenu() {
        if (!ftlMenu) return;
        
        ftlMenu.classList.add('hidden');
        ftlMenuOpen = false;
        
        // Re-enable rocket controls if available
        if (typeof RocketControls !== 'undefined' && RocketControls.setEnabled) {
            RocketControls.setEnabled(true);
        }
    }
    
    /**
     * Initiate an FTL jump to the selected destination
     * @param {Object} destination - The destination to jump to
     */
    function initiateFTLJump(destination) {
        if (transitioning || destination.disabled) return;
        if (window.location.pathname.endsWith(destination.path)) {
            closeFTLMenu();
            return;
        }
        
        transitioning = true;
        
        // Log event
        if (typeof LoggingSystem !== 'undefined' && LoggingSystem.logEvent) {
            LoggingSystem.logEvent('ftl_jump_initiated', {
                destination: destination.name,
                path: destination.path,
                time: Date.now()
            });
        }
        
        // Show notification
        if (typeof HudManager !== 'undefined' && HudManager.showNotification) {
            HudManager.showNotification(`FTL jump to ${destination.name} initiated`);
        }
        
        // Hide menu
        if (ftlMenu) {
            ftlMenu.classList.add('hidden');
        }
        
        // Show overlay with animation
        if (!ftlOverlay) createFTLOverlay();
        ftlOverlay.classList.remove('hidden');
        
        // Animate overlay
        setTimeout(() => {
            ftlOverlay.style.opacity = '1';
            
            // Play sound if available
            // const ftlSound = new Audio('assets/audio/ftl_jump.mp3');
            // ftlSound.play();
            
            // Navigate after animation
            setTimeout(() => {
                window.location.href = destination.path;
            }, 1500);
        }, 100);
    }
    
    // Public methods
    return {
        /**
         * Initialize the FTL system
         */
        init: function() {
            console.log('FTL System initialized');
            
            // Create FTL menu
            createFTLMenu();
            
            // Add listener to FTL button in HUD
            const ftlButton = document.getElementById('ftl-button');
            if (ftlButton) {
                ftlButton.addEventListener('click', this.openFTLMenu.bind(this));
            }
            
            // Register keyboard shortcut (F key)
            if (typeof InputManager !== 'undefined' && InputManager.registerKeyListener) {
                InputManager.registerKeyListener('f', function(isPressed) {
                    if (isPressed && !transitioning) {
                        if (ftlMenuOpen) {
                            closeFTLMenu();
                        } else {
                            showFTLMenu();
                        }
                    }
                });
            }
            
            return this;
        },
        
        /**
         * Open the FTL menu
         */
        openFTLMenu: function() {
            if (transitioning) return;
            
            showFTLMenu();
        },
        
        /**
         * Close the FTL menu
         */
        closeFTLMenu: function() {
            closeFTLMenu();
        },
        
        /**
         * Check if FTL menu is open
         * @returns {boolean} Whether the FTL menu is open
         */
        isMenuOpen: function() {
            return ftlMenuOpen;
        },
        
        /**
         * Check if an FTL transition is in progress
         * @returns {boolean} Whether an FTL transition is in progress
         */
        isTransitioning: function() {
            return transitioning;
        },
        
        /**
         * Get available destinations
         * @returns {Array} Available destinations
         */
        getDestinations: function() {
            return destinations.slice(); // Return a copy
        }
    };
})();

// Initialize if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    FTLSystem.init();
} else {
    document.addEventListener('DOMContentLoaded', FTLSystem.init.bind(FTLSystem));
}