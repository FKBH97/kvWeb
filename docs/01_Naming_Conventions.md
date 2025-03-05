# **01_Naming_Conventions.md**

## **📌 Naming Conventions & File Structure**
This document defines the **standardized naming rules** for files, variables, functions, and classes to ensure consistency across the project.

### **1️⃣ General Naming Rules**
🚀 Maintains:

- **`camelCase.js`** for JavaScript files (e.g., `planetSetup.js`).
- **`kebab-case.css`** for CSS files (e.g., `hud-styles.css`).
- **`PascalCase`** for classes (e.g., `PlanetManager`).
- **Helper script names remain unchanged** (e.g., `hudManager.js`, `ftlSystem.js`).

### **2️⃣ Updated Project Directory Structure**
```plaintext
kvWeb/
├── about/                     # About Page directory
│   ├── index.html             # Root HTML file
│   ├── about.js               # Entry point for About logic
│   ├── styles/
│   │   ├── about-styles.css   # CSS styling specific to About
│   ├── assets/
│   │   ├── planets/           # About Page planets (textured planets)
│   │   │   ├── earth/         # Textures for Earth
│   │   │   ├── mars/          # Textures for Mars
│   │   │   ├── jupiter/       # Textures for Jupiter
│   │   │   ├── luna/          # Luna (Earth's Moon, generated as a planet)
│   │   ├── models/            # 3D models for planets, moons, and other objects
│   │   │   ├── phobos.obj     # Mars' moon Phobos (3D model)
│   │   │   ├── deimos.obj     # Mars' moon Deimos (3D model)
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
│   │   ├── planets/           # Projects Page planets (custom GLB planets)
│   │   │   ├── projectA/      # Planet for Project A
│   │   │   ├── projectB/      # Planet for Project B
│   │   │   ├── projectC/      # Planet for Project C
│
├── helpers/                   # Universal helper scripts (used across pages)
│   ├── sceneSetup.js          # Three.js scene setup (renderer, camera, lights)
│   ├── rocketControls.js      # Rocket movement & boost logic
│   ├── hudManager.js          # Universal HUD (planet info, notifications)
│   ├── dockingSystem.js       # Handles docking across all pages
│   ├── ftlSystem.js           # Universal FTL page transition logic
│
├── planet_gen/                # Planetary generator for procedural planets
├── planets/                   # Storage for all planetary assets
├── .gitignore                 # Exclude unnecessary files
├── README.md                  # Project documentation
```

### **3️⃣ Best Practices for Clear Prompts**
🔹 **Use clear sectioning**
```plaintext
🚀 Change Request: Update File Paths  
- About planets should go in: `kvWeb/about/assets/planets/{planet}/`
- Project planets should go in: `kvWeb/projects/assets/planets/{planet}/`
```
**Why?** → Using bullet points makes it easier to extract instructions.

🔹 **Use `[UPDATE]` or `[QUESTION]` for clarity**
```plaintext
[UPDATE] Move all helper scripts to `helpers/` instead of `about/`
[QUESTION] Should I keep the FTL button placement consistent across pages?
```
**Why?** → This lets me instantly categorize and respond accordingly.

