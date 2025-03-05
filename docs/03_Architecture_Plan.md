# ✅ Finalized Architecture Plan (Maximum Detail & Accuracy)

This document fully defines how all components interact in the About Page. Every system, method, and connection is included to ensure clarity, maintainability, and expansion readiness. 🚀🏗️

## 📌 1️⃣ High-Level System Overview

The About Page follows a modular architecture, where each component handles a specific responsibility and communicates with others efficiently.

### 🔹 Core Architectural Principles:
- ✔ **Separation of Concerns** → Each script is responsible for a single system, reducing complexity.
- ✔ **Reusability** → Shared logic lives in helpers/ for use across all pages.
- ✔ **Scalability** → The system is designed for future expansion while remaining easy to maintain.

## 📌 2️⃣ Component Interaction Flow

### 🔹 How Systems Communicate (Event-Based Flow)

```
User Actions → Rocket Moves → HUD Updates → Docking & Planets Respond → Scene Updates
```

1️⃣ User navigates → Movement is handled by rocketControls.js.  
2️⃣ HUD updates in real-time → hudManager.js displays speed, planet info, AI messages, docking prompts.  
3️⃣ Docking system reacts → If near a planet, dockingSystem.js enables interaction.  
4️⃣ Starfield and sun animations continue in the background → starfield.js & sunSetup.js.  
5️⃣ Logging system records key events → loggingSystem.js stores flight data, interactions, and boosts.  

## 📌 3️⃣ Component Responsibilities & Expected Outputs

Each system has a clear responsibility, ensuring organized development and debugging.

| Component | Responsibility | Inputs & Outputs |
|-----------|----------------|------------------|
| `sceneSetup.js` | Initializes Three.js scene, lighting, and camera | **Input:** Adds objects from `planetSetup.js`, `sunSetup.js`, and `starfield.js`<br>**Output:** Fully rendered scene |
| `rocketControls.js` | Handles movement, boosting, collision detection | **Input:** User controls<br>**Output:** Updated player position, sends boost status to `hudManager.js` |
| `hudManager.js` | Displays HUD elements (planet info, AI messages, boost availability, fun facts) | **Input:** Data from `rocketControls.js`, `dockingSystem.js`, `planetSetup.js`<br>**Output:** UI updates, on-screen notifications |
| `dockingSystem.js` | Detects when the rocket is near a planet, enables docking | **Input:** Rocket position<br>**Output:** Enables docking UI, locks rocket controls when docked |
| `ftlSystem.js` | Handles FTL menu & page transitions | **Input:** User FTL selection<br>**Output:** Starts FTL animation, loads new scene |
| `planetSetup.js` | Generates hardcoded planets & their orbits | **Input:** Static planet data<br>**Output:** Adds planets to `sceneSetup.js` |
| `sunSetup.js` | Creates the sun with animated corona | **Input:** Sun texture & animation parameters<br>**Output:** Adds sun to `sceneSetup.js` |
| `debugMode.js` | Enables debug mode (FPS counter, orbit paths, object IDs) | **Input:** Developer keypress<br>**Output:** On-screen debugging tools |
| `loggingSystem.js` | Logs key events (docking, boost activation, location changes) | **Input:** Rocket actions, UI events<br>**Output:** Stores logs, can be displayed in debug mode |
| `starfield.js` | Creates a slightly animated background starfield | **Input:** Star position data<br>**Output:** Animated background for scene |

## 📌 4️⃣ Data Flow Across Components

Each system exchanges data using structured communication.

### 1️⃣ Rocket movement updates the HUD
- `rocketControls.js` → Sends position & speed to `hudManager.js`.
- `hudManager.js` → Displays current planet proximity & status.

### 2️⃣ Docking interactions trigger UI updates
- `dockingSystem.js` → Enables UI prompts when near planets.
- `hudManager.js` → Displays "Press E to Dock" message.

### 3️⃣ FTL system overrides normal movement
- `ftlSystem.js` → When activated, prevents movement & starts transition.
- `sceneSetup.js` → Removes current scene objects & loads new assets.

### 4️⃣ Debug Mode & Logging work together
- `debugMode.js` → Can display live logs from `loggingSystem.js`.
- `loggingSystem.js` → Records actions but doesn't affect gameplay.

✅ Ensures modular, efficient communication between systems.

## 📌 5️⃣ Key Design Considerations

- ✔ Helper scripts (`helpers/`) store all reusable logic → Prevents redundancy across pages.
- ✔ Hardcoded planets (`planetSetup.js`) ensure fixed layouts → No unexpected generation issues.
- ✔ Minimal interdependency between scripts → If one component fails, others remain functional.
- ✔ Future expansion is built-in → New pages can reuse HUD, logging, rocket controls without major rewrites.

## 📌 ✅ Next Step: Logic Flow & Method Interactions


