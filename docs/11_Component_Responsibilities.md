# **11_Component_Responsibilities.md**

## **📌 Component Responsibilities & Expected Outputs**
This document defines **the role of each component**, what data it processes, and what it outputs to ensure **a structured and modular codebase**.

---

## **1️⃣ Overview of Component Responsibilities**
Each component **performs a specific function**, reducing redundancy and making debugging easier.

```plaintext
User Actions → Movement & Input → HUD & UI Updates → Docking & Planets → Scene Rendering
```

✔ **Components only handle their assigned tasks** (no overlapping logic).  
✔ **Data flows efficiently between systems to prevent bottlenecks.**  

---

## **2️⃣ Full Component Breakdown & Expected Outputs**

### **🟢 Core Systems**
| **Component**        | **Responsibility** | **Inputs & Outputs** |
|----------------------|------------------|-----------------|
| `sceneSetup.js` | Initializes **Three.js scene, lighting, and camera** | **Input:** Objects from `planetSetup.js`, `sunSetup.js`, `starfield.js` <br> **Output:** Fully rendered scene |
| `rocketControls.js` | Handles **movement, boosting, collision detection** | **Input:** User controls <br> **Output:** Updates player position, sends boost status to `hudManager.js` |
| `hudManager.js` | Displays **HUD elements (planet info, AI messages, boost availability, fun facts)** | **Input:** Data from `rocketControls.js`, `dockingSystem.js`, `planetSetup.js` <br> **Output:** UI updates, on-screen notifications |
| `dockingSystem.js` | Detects **when the rocket is near a planet**, enables docking | **Input:** Rocket position <br> **Output:** Enables docking UI, locks rocket controls when docked |
| `ftlSystem.js` | Handles **FTL menu & page transitions** | **Input:** User FTL selection <br> **Output:** Starts FTL animation, loads new scene |
| `inputManager.js` | Manages **all keyboard inputs** (e.g., movement, boost, debug mode) | **Input:** User keypresses <br> **Output:** Sends action triggers to `rocketControls.js`, `debugMode.js`, `ftlSystem.js` |

### **🟡 Environment & Celestial Bodies**
| **Component**        | **Responsibility** | **Inputs & Outputs** |
|----------------------|------------------|-----------------|
| `planetSetup.js` | Generates **hardcoded planets & their orbits** | **Input:** Static planet data <br> **Output:** Adds planets to `sceneSetup.js` |
| `sunSetup.js` | Creates the **sun with animated corona** | **Input:** Sun texture & animation parameters <br> **Output:** Adds sun to `sceneSetup.js` |
| `starfield.js` | Creates a **slightly animated background starfield** | **Input:** Star position data <br> **Output:** Animated background for scene |
| `ringSystem.js` | Adds **planetary rings (Saturn, Uranus, etc.)** | **Input:** Texture and transparency maps <br> **Output:** Attaches rings to specific planets |

### **🔵 HUD & UI Systems**
| **Component**        | **Responsibility** | **Inputs & Outputs** |
|----------------------|------------------|-----------------|
| `hudManager.js` | Controls **all on-screen HUD elements** | **Input:** Data from `rocketControls.js`, `dockingSystem.js`, `planetSetup.js` <br> **Output:** Updates on-screen elements |
| `hudRenderer.js` | Handles **drawing HUD elements in Three.js or HTML** | **Input:** UI textures & HUD data <br> **Output:** Renders HUD elements smoothly |
| `uiOverlay.js` | Manages **interactive UI overlays (docking info, fun facts)** | **Input:** Player interactions <br> **Output:** Displays pop-ups and menus |

### **🛠️ Debug & Logging Systems**
| **Component**        | **Responsibility** | **Inputs & Outputs** |
|----------------------|------------------|-----------------|
| `debugMode.js` | Enables **debug mode** (FPS counter, orbit paths, object IDs) | **Input:** Developer keypress <br> **Output:** On-screen debugging tools |
| `loggingSystem.js` | Logs **key events** (docking, boost activation, location changes) | **Input:** Rocket actions, UI events <br> **Output:** Stores logs, can be displayed in debug mode |
| `errorHandler.js` | Handles **game errors and crashes** | **Input:** Unexpected system failures <br> **Output:** Prevents game crashes, logs errors |

### **🟣 Shared & Asset Management**
| **Component**        | **Responsibility** | **Inputs & Outputs** |
|----------------------|------------------|-----------------|
| `assetLoader.js` | Loads **textures, models, and audio files** | **Input:** Asset paths <br> **Output:** Ensures assets are available in memory |
| `preloader.js` | Preloads **critical assets** for fast loading | **Input:** List of assets to load <br> **Output:** Reduces in-game loading time |

### **🌍 About & Projects Page Files**
| **File** | **Responsibility** |
|----------------|---------------------------------------------|
| `index.html` | Root HTML file for rendering the About & Projects Pages |
| `about.js` | Main entry point that initializes About Page logic |
| `projects.js` | Main entry point that initializes Projects Page logic |
| `about-styles.css` | CSS styling specific to About Page |
| `projects-styles.css` | CSS styling specific to Projects Page |
| `assets/planets/` | Stores planetary textures for About & Projects Pages |
| `assets/models/` | Stores 3D models for moons, planets, and objects |

---

## **3️⃣ Data Flow & Dependencies**
Each system **only interacts where necessary**, ensuring **maintainability**.

✔ **Movement updates speed & position** → HUD reflects this.  
✔ **Docking system listens for proximity events** → Enables prompts & locks controls.  
✔ **FTL system overrides normal movement** → Prevents manual navigation during transitions.  
✔ **HUD updates depend on multiple sources** → Pulls from `rocketControls.js`, `dockingSystem.js`, and `planetSetup.js`.  

✅ **Minimizes dependencies between components to ensure flexibility and easy debugging.**

