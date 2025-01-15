import numpy as np
from noise import snoise3
import trimesh
from PIL import Image, ImageDraw
import os
import random
from typing import Tuple, List
import argparse
from scipy.ndimage import gaussian_filter


class AsteroidGenerator:
    def __init__(self, resolution: Tuple[int, int] = (2048, 2048)):
        self.width, self.height = resolution

    def generate_noise_layer(self, scale: float, octaves: int, persistence: float) -> np.ndarray:
        """Generate seamless noise layer using 3D Simplex noise."""
        noise_layer = np.zeros((self.height, self.width))
        for y in range(self.height):
            for x in range(self.width):
                theta = 2 * np.pi * x / self.width
                phi = np.pi * y / self.height
                nx = np.sin(phi) * np.cos(theta)
                ny = np.sin(phi) * np.sin(theta)
                nz = np.cos(phi)
                noise_layer[y][x] = snoise3(
                    nx * scale, ny * scale, nz * scale, octaves=octaves, persistence=persistence
                )
        return noise_layer

    def generate_crater(self, size: int, rim_height: float = 0.5, depth: float = -1.0) -> np.ndarray:
        """Generate a single crater with a rim and interior."""
        crater = np.zeros((size, size))
        center = size // 2
        radius = size // 2
        for y in range(size):
            for x in range(size):
                dist = np.sqrt((x - center) ** 2 + (y - center) ** 2)
                if dist < radius:
                    if dist > radius * 0.7:
                        # Raised rim
                        crater[y][x] = rim_height * (1 - (dist - radius * 0.7) / (radius * 0.3))
                    else:
                        # Interior depression
                        crater[y][x] = depth * (1 - dist / (radius * 0.7)) ** 2
        return crater

    def apply_craters(self, height_map: np.ndarray, crater_count: int, size_range: Tuple[int, int]) -> np.ndarray:
        """Apply randomly distributed craters to the height map."""
        for _ in range(crater_count):
            size = random.randint(size_range[0], size_range[1])
            crater = self.generate_crater(size)
            x = random.randint(0, self.width - size)
            y = random.randint(0, self.height - size)
            height_map[y : y + size, x : x + size] += crater
        return height_map

    def generate_height_map(self, noise_scale: float, octaves: int, persistence: float, crater_count: int, size_range: Tuple[int, int]) -> np.ndarray:
        """Generate a height map with craters and procedural noise."""
        base_noise = self.generate_noise_layer(noise_scale, octaves, persistence)
        height_map = gaussian_filter(base_noise, sigma=5)
        height_map = self.apply_craters(height_map, crater_count, size_range)
        # Normalize to 0-1 range
        height_map = (height_map - np.min(height_map)) / (np.max(height_map) - np.min(height_map))
        return height_map

    def generate_normal_map(self, height_map: np.ndarray) -> np.ndarray:
        """Generate a normal map from the height map."""
        normal_map = np.zeros((self.height, self.width, 3), dtype=np.float32)
        sobel_x = np.gradient(height_map, axis=1)
        sobel_y = np.gradient(height_map, axis=0)
        normal_map[..., 0] = -sobel_x
        normal_map[..., 1] = -sobel_y
        normal_map[..., 2] = 1.0
        norm = np.linalg.norm(normal_map, axis=2)
        normal_map /= np.expand_dims(norm, axis=2)
        normal_map = (normal_map * 0.5 + 0.5) * 255
        return normal_map.astype(np.uint8)

    def generate_albedo_map(self, height_map: np.ndarray, base_color: Tuple[int, int, int], variation: float) -> np.ndarray:
        """Generate an albedo (color) map based on the height map."""
        albedo_map = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        noise_layer = self.generate_noise_layer(10.0, 4, 0.5)
        for y in range(self.height):
            for x in range(self.width):
                intensity = height_map[y, x]
                color_variation = (noise_layer[y, x] * 2 - 1) * variation
                albedo_map[y, x] = np.clip(
                    np.array(base_color) + color_variation * 255 * intensity, 0, 255
                )
        return albedo_map

    def generate_mesh(self, height_map: np.ndarray, polygon_count: int) -> trimesh.Trimesh:
        """Generate a 3D mesh based on the height map."""
        sphere = trimesh.creation.icosphere(subdivisions=3)
        vertices = sphere.vertices.copy()
        for i, vertex in enumerate(vertices):
            u = 0.5 + np.arctan2(vertex[2], vertex[0]) / (2 * np.pi)
            v = 0.5 - np.arcsin(vertex[1]) / np.pi
            x = int(u * self.width) % self.width
            y = int(v * self.height) % self.height
            displacement = height_map[y, x] * 0.2
            vertices[i] *= (1.0 + displacement)
        return trimesh.Trimesh(vertices=vertices, faces=sphere.faces)

    def save_textures(self, height_map: np.ndarray, normal_map: np.ndarray, albedo_map: np.ndarray, output_dir: str):
        """Save the generated textures as PNG files."""
        os.makedirs(output_dir, exist_ok=True)
        Image.fromarray((height_map * 255).astype(np.uint8)).save(os.path.join(output_dir, "height_map.png"))
        Image.fromarray(normal_map).save(os.path.join(output_dir, "normal_map.png"))
        Image.fromarray(albedo_map).save(os.path.join(output_dir, "albedo_map.png"))

    def save_mesh(self, mesh: trimesh.Trimesh, output_path: str):
        """Save the generated mesh as an OBJ file."""
        mesh.export(output_path)

    def generate_asteroid(self, preset_name: str, output_dir: str):
        """Generate an asteroid with textures and 3D model."""
        presets = {
            "deimos": {"noise_scale": 4.0, "octaves": 6, "persistence": 0.5, "crater_count": 40, "size_range": (20, 80), "base_color": (139, 125, 130), "variation": 0.2},
            "phobos": {"noise_scale": 5.0, "octaves": 8, "persistence": 0.4, "crater_count": 60, "size_range": (30, 100), "base_color": (120, 110, 100), "variation": 0.3},
        }
        if preset_name not in presets:
            raise ValueError(f"Unknown preset: {preset_name}")
        preset = presets[preset_name]
        height_map = self.generate_height_map(preset["noise_scale"], preset["octaves"], preset["persistence"], preset["crater_count"], preset["size_range"])
        normal_map = self.generate_normal_map(height_map)
        albedo_map = self.generate_albedo_map(height_map, preset["base_color"], preset["variation"])
        mesh = self.generate_mesh(height_map, 5000)
        self.save_textures(height_map, normal_map, albedo_map, output_dir)
        self.save_mesh(mesh, os.path.join(output_dir, f"{preset_name}.obj"))


def main():
    parser = argparse.ArgumentParser(description="Generate procedural asteroids.")
    parser.add_argument("--preset", choices=["deimos", "phobos"], default="deimos", help="Asteroid preset type.")
    parser.add_argument("--output", default="asteroid_output", help="Output directory.")
    args = parser.parse_args()

    generator = AsteroidGenerator()
    generator.generate_asteroid(args.preset, args.output)


if __name__ == "__main__":
    main()
