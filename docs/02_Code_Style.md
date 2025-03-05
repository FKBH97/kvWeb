# **02_Code_Style.md**

## **📌 Code Style & Formatting Rules**
This document outlines the **code formatting and structuring rules** to maintain readability and maintainability.

### **1️⃣ General Formatting Rules**
✅ **Indentation:** **2 spaces per indentation level** (no tabs).
✅ **Line Length:** **Max 100 characters per line** (split long lines logically).
✅ **Brackets `{}` & Parentheses `()` Placement:**
- **Functions & Loops:** Opening `{` goes **on the same line** as function/loop definition.
- **Objects & Arrays:** Opening `{` or `[` is **on a new line** for clarity.

### **2️⃣ Variable & Function Naming**
✅ **Use `camelCase` for variables & functions**
```javascript
let planetOrbitSpeed = 0.05;
function updatePlanetPosition() { ... }
```

✅ **Use `ALL_CAPS_SNAKE_CASE` for constants**
```javascript
const MAX_PLANET_COUNT = 10;
```

✅ **Avoid `snake_case` or `PascalCase` for variables/functions**
```javascript
let planet_orbit_speed = 0.05; // ❌ Wrong
function UpdatePlanetPosition() { ... } // ❌ Wrong
```

---

### **3️⃣ Commenting Guidelines**
✅ **Example: Good Commenting**
```javascript
// Calculate new planet position based on orbit speed
planet.position.x = Math.cos(timeElapsed * planet.orbitSpeed) * planet.distance;
```

❌ **Example: Bad Commenting (Too Obvious)**
```javascript
// Loop through each planet
for (let i = 0; i < planets.length; i++) {  // ❌ Unnecessary comment
    // Get the current planet
    let planet = planets[i];  // ❌ Too obvious
}
```

---

### **4️⃣ Function Structure & Readability**
✅ **Example: Good Structure**
```javascript
function checkDockingStatus(player, planet) {
  if (!player || !planet) return;  // ✅ Early return for invalid data

  let distance = calculateDistance(player.position, planet.position);
  if (distance < DOCKING_THRESHOLD) {
    initiateDocking();
  }
}
```

❌ **Example: Bad Structure (Nested Too Deep)**
```javascript
function checkDockingStatus(player, planet) {
  if (player && planet) {
    let distance = calculateDistance(player.position, planet.position);
    if (distance < DOCKING_THRESHOLD) {
      initiateDocking();
    }
  }
}
```

---

### **5️⃣ Object & Array Formatting**
✅ **Example: Good Formatting**
```javascript
const planetData = {
  name: "Mars",
  texture: "mars.jpg",
  size: 0.53,
  distance: 15,
};
```

❌ **Example: Missing Trailing Comma**
```javascript
const planetData = {
  name: "Mars",
  texture: "mars.jpg",
  size: 0.53,
  distance: 15
};  // ❌ Harder to track changes in Git
```

---

### **6️⃣ Import & Export Guidelines**
✅ **Example: Named Exports (Best for Multiple Functions)**
```javascript
// planetSetup.js
export function createPlanet() { ... }
export function updatePlanetOrbit() { ... }
```
```javascript
// about.js
import { createPlanet, updatePlanetOrbit } from "./components/planetSetup.js";
```

❌ **Example: Default Export (Avoid Unless Necessary)**
```javascript
// planetSetup.js
export default function createPlanet() { ... }  // ❌ Avoid default export unless necessary
```

---

### **7️⃣ File Organization & Structure**
✅ **Example: Correct File Organization**
```plaintext
helpers/
│── sceneSetup.js   # Handles Three.js scene
│── hudManager.js   # Manages HUD logic
│── rocketControls.js   # Handles movement & input
```

❌ **Example: Incorrect File Organization (Mixing Unrelated Functions)**
```plaintext
helpers/
│── gameFunctions.js   # ❌ Bad: Too generic, holds unrelated logic
```

---

## **📌 Next Steps**
This document should be followed strictly throughout development to maintain **code consistency and readability**.

