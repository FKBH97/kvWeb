# 🚀 Space Exploration Project  

## 📌 Overview  
A **fully interactive space simulation** built with **Three.js**, featuring planetary systems, rocket navigation, HUD interfaces, and an expandable universe for future gameplay additions.  

## 🌟 Features  
✔ **Real-time space navigation** with movement, boost, and docking  
✔ **HUD system** with planet info, AI messages, and fun facts  
✔ **Sun with animated corona** and orbiting planets  
✔ **FTL travel system** for transitioning between pages  
✔ **Expandable architecture** supporting future procedural planets, AI combat, and multiplayer  

---

## 🛠️ Tech Stack  
- **Three.js** → 3D rendering engine  
- **JavaScript (ES6+)** → Core logic and interactions  
- **HTML/CSS** → UI and page structure  
- **Git & GitHub** → Version control  

---

## 📂 Project Structure  
```plaintext
kvWeb/
├── about/                     # About Page directory
│   ├── index.html             # Root HTML file
│   ├── about.js               # Entry point for About logic
│   ├── styles/
│   │   ├── about-styles.css   # CSS styling specific to About
│   ├── assets/
│   │   ├── planets/           # Textures for planets
│   │   ├── models/            # 3D models (moons, objects)
│   ├── components/            # Page-specific logic
│   │   ├── planetSetup.js     # Hardcoded planets for About
│   │   ├── sunSetup.js        # Sun & corona animation
│
├── projects/                  # Projects Page directory
│   ├── index.html
│   ├── projects.js
│   ├── styles/
│   │   ├── projects-styles.css
│   ├── assets/
│   │   ├── planets/           # Custom project planets (GLB models)
│
├── helpers/                   # Universal helper scripts
│   ├── sceneSetup.js          # Three.js scene setup (renderer, camera, lights)
│   ├── rocketControls.js      # Rocket movement & boost logic
│   ├── hudManager.js          # Universal HUD (planet info, notifications)
│   ├── dockingSystem.js       # Handles docking across all pages
│   ├── ftlSystem.js           # Universal FTL page transition logic
│
├── shared/assets/             # Common assets used across pages
│   ├── hud/                   # HUD elements (icons, UI textures)
│   ├── audio/                 # Sound effects (boost, FTL)
│   ├── models/                # Shared 3D models used across pages
│
├── docs/                      # Project Documentation
│   ├── 01_Naming_Conventions.md
│   ├── 02_Code_Style.md
│   ├── 03_Architecture_Plan.md
│   ├── 04_Logic_Flow.md
│   ├── 05_Development_Phases.md
│   ├── 06_Debug_Mode.md
│   ├── 07_Error_Handling.md
│   ├── 08_UI_Themes.md
│   ├── 09_Asset_Management.md
│   ├── 10_Performance_Optimization.md
│   ├── 11_Component_Responsibilities.md
│   ├── 12_Scalability_Roadmap.md
│   ├── 13_Security_Handling.md
│
├── README.md                  # Project overview & instructions
├── .gitignore                 # Files to exclude from Git
