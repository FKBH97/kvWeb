# **06_Debug_Mode.md**

## **📌 Debug Mode & Logging Strategy**
This document outlines how **debugging tools and event logging** will work to **track player actions, detect errors, and improve development workflow**.

---

## **1️⃣ Overview of Debug Mode & Logging System**
Debug Mode allows **real-time tracking of key gameplay events**, while the logging system **records important actions for debugging and analytics**.

```plaintext
Debug Mode → Displays real-time info (FPS, orbits, object IDs)
Logging System → Stores player actions (boost use, docking events, page transitions)
```

✔ **Debug Mode helps developers test gameplay in real-time**.  
✔ **Logging System tracks critical events for debugging & provides fallback solutions**.  

---

## **2️⃣ Debug Mode (`debugMode.js`)**
**Goal:** Provide an **in-game toggleable mode** that displays **real-time information** about the scene, movement, and system status.

✅ **Debug Mode Activation**
- [ ] Pressing **`D` key** toggles Debug Mode on/off.  
- [ ] A **floating debug panel** appears when enabled.  

✅ **Displayed Debug Information**
- [ ] **FPS Counter** → Shows current frame rate.  
- [ ] **Current Position & Speed** → Rocket coordinates & velocity.  
- [ ] **Active Planet & Distance** → Name of the nearest celestial body.  
- [ ] **Object IDs** → Identifiers for all loaded assets (planets, sun, models).  
- [ ] **Orbit Paths (Toggleable)** → Shows planetary orbits in real-time.  

✅ **Debug UI Controls**
- [ ] Press **`O` key** to toggle orbit path visibility.  
- [ ] Press **`L` key** to open **logging console overlay**.  
- [ ] Press **`X` key** to reset rocket position (for debugging stuck movement).  

✅ **Testing & Debugging**
- [ ] Confirm **FPS counter updates live**.  
- [ ] Verify **all debug information displays correctly**.  
- [ ] Ensure **debug mode does not affect normal gameplay**.  

---

## **3️⃣ Logging System (`loggingSystem.js`)**
**Goal:** Record **key gameplay events** for debugging, tracking player interactions, and potential analytics.

✅ **Logged Events**
- [ ] **Boost Activation** → Logs when boost is used & duration.  
- [ ] **Docking Events** → Logs when player docks & undocks from a planet.  
- [ ] **FTL Jumps** → Tracks when a player initiates an FTL transition.  
- [ ] **Planet Interactions** → Logs when a player gets close to a planet.  
- [ ] **Game Errors** → Captures unexpected behaviors or crashes.  

✅ **Logging Output Formats**
- [ ] **Console Logging** → Displays real-time logs in the browser console.  
- [ ] **Overlay Log Viewer** → Displays logs in-game when `L` is pressed.  
- [ ] **JSON File Output (Optional Future Feature)** → Saves logs to a local JSON file for debugging.  

✅ **Testing & Debugging**
- [ ] Ensure **logs appear in the console when events happen**.  
- [ ] Confirm **log overlay updates dynamically when opened**.  
- [ ] Test **multiple log entries to ensure performance is not impacted**.  

---

## **4️⃣ Data Flow & Dependencies**
- **Rocket movement & player actions** → Trigger logs & debug updates.  
- **Docking system changes** → Trigger log entries for UI events.  
- **FTL transitions** → Mark page jumps in the log system.  

✅ **Modular & non-intrusive logging**—does not affect gameplay performance.  

---

## **📌 ✅ Next Step: Error Handling & Debugging Strategy**
Would you like **any refinements or additions** before moving to **Error Handling & Debugging Strategy**? 🚀📜

