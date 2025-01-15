import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import getStarfield from "./src/getStarfield.js";
import { getFresnelMat } from "./src/getFresnelMat.js";

// Set up the scene, camera, and renderer
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 2000);
camera.position.set(0, 10, 50); // Start at a distance to view the field
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Add inertia
controls.dampingFactor = 0.05; // Adjust damping for smooth movement
controls.rotateSpeed = 0.5; // Adjust rotation sensitivity
controls.zoomSpeed = 1.2; // Adjust zoom sensitivity
controls.minDistance = 5; // Minimum zoom distance
controls.maxDistance = 200; // Maximum zoom distance

// Lighting
const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(-50, 50, 50);
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x404040); // Soft ambient light
scene.add(ambientLight);

// Starfield
const stars = getStarfield({ numStars: 5000 });
scene.add(stars);

// Texture loader
const loader = new THREE.TextureLoader();

// Planet parameters
const planetParams = {
  minSize: 0.5,
  maxSize: 3.0,
  minDistance: 30,
  maxDistance: 150,
};

// Array to store planets
const planets = [];

// Load planet configurations from folder naming convention
function loadPlanetConfigs(basePath) {
  const configs = [];
  const planetTypes = ["gas", "star", "planet", "asteroid", "ring"];
  const folderRegex = new RegExp(`(${planetTypes.join("|")})_\\d+`);

  // Mockup for dynamically loading folder structure
  const planetFolders = Array.from(fs.readdirSync(basePath)).filter((folder) =>
    folderRegex.test(folder)
  );

  planetFolders.forEach((folder) => {
    const planetType = folder.split("_")[0];
    const distance = THREE.MathUtils.randFloat(
      planetParams.minDistance,
      planetParams.maxDistance
    );
    const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const phi = THREE.MathUtils.randFloat(-Math.PI / 4, Math.PI / 4);

    configs.push({
      position: new THREE.Vector3(
        distance * Math.sin(theta) * Math.cos(phi),
        distance * Math.sin(phi),
        distance * Math.cos(theta) * Math.cos(phi)
      ),
      size: THREE.MathUtils.randFloat(planetParams.minSize, planetParams.maxSize),
      rotationSpeed: THREE.MathUtils.randFloat(0.001, 0.003),
      cloudRotationSpeed: THREE.MathUtils.randFloat(0.0005, 0.0015),
      textures: {
        base: `${basePath}/${folder}/00_planet_base_map.jpg`,
        specular: `${basePath}/${folder}/02_planet_specular_map.jpg`,
        bump: `${basePath}/${folder}/01_planet_bump_map.jpg`,
        clouds: `${basePath}/${folder}/03_planet_cloud_map.jpg`,
        alphaClouds: `${basePath}/${folder}/04_translucent_cloud_map.png`,
        nightLights: `${basePath}/${folder}/05_planet_light_map.jpg`,
      },
      type: planetType,
    });
  });

  return configs;
}

// Function to create a planet
function createPlanet(config) {
  const group = new THREE.Group();
  group.position.copy(config.position);
  scene.add(group);

  // Planet geometry and material
  const geometry = new THREE.SphereGeometry(config.size, 64, 64);
  const material = new THREE.MeshPhongMaterial({
    map: loader.load(config.textures.base),
    specularMap: loader.load(config.textures.specular),
    bumpMap: loader.load(config.textures.bump),
    bumpScale: 0.04,
  });
  const planetMesh = new THREE.Mesh(geometry, material);
  group.add(planetMesh);

  // Clouds
  if (config.textures.clouds) {
    const cloudsMaterial = new THREE.MeshStandardMaterial({
      map: loader.load(config.textures.clouds),
      transparent: true,
      alphaMap: loader.load(config.textures.alphaClouds),
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const cloudsMesh = new THREE.Mesh(geometry, cloudsMaterial);
    cloudsMesh.scale.setScalar(1.01);
    group.add(cloudsMesh);
  }

  // Night lights
  if (config.textures.nightLights) {
    const nightMaterial = new THREE.MeshBasicMaterial({
      map: loader.load(config.textures.nightLights),
      blending: THREE.AdditiveBlending,
    });
    const nightMesh = new THREE.Mesh(geometry, nightMaterial);
    group.add(nightMesh);
  }

  // Fresnel glow
  const fresnelMat = getFresnelMat();
  const glowMesh = new THREE.Mesh(geometry, fresnelMat);
  glowMesh.scale.setScalar(1.02);
  group.add(glowMesh);

  // Rings (for ringed planets)
  if (config.type === "ring") {
    const ringGeometry = new THREE.RingGeometry(
      config.size * 1.5,
      config.size * 2.5,
      64
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      map: loader.load(config.textures.alphaClouds),
      transparent: true,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2;
    group.add(ringMesh);
  }

  return {
    group,
    planetMesh,
    rotationSpeed: config.rotationSpeed,
    cloudRotationSpeed: config.cloudRotationSpeed,
    name: config.type,
  };
}

// Generate planets from configs
const basePath = "./kvWeb/Planets";
const planetConfigs = loadPlanetConfigs(basePath);
planetConfigs.forEach((config) => {
  const planet = createPlanet(config);
  planets.push(planet);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Rotate planets and clouds independently
  planets.forEach((planet) => {
    planet.planetMesh.rotation.y += planet.rotationSpeed;
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

// Handle resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
