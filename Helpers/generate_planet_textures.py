import numpy as np
from scipy.ndimage import gaussian_filter, binary_dilation, binary_erosion
from PIL import Image, ImageFilter, ImageEnhance
from noise import snoise2
import os
import random

# Texture Generator Class
class TextureGenerator:
    def __init__(self, width, height, seed=None, color_palette=None):
        self.width = width
        self.height = height
        self.seed = seed if seed is not None else np.random.randint(0, 1000000)
        self.color_palette = color_palette or {
            'ocean': np.array([0, 0, 128], dtype=np.uint8),
            'beach': np.array([194, 178, 128], dtype=np.uint8),
            'forest': np.array([34, 139, 34], dtype=np.uint8),
            'grassland': np.array([124, 252, 0], dtype=np.uint8),
            'mountain': np.array([139, 137, 137], dtype=np.uint8),
            'snow': np.array([255, 255, 255], dtype=np.uint8),
            'desert': np.array([210, 180, 140], dtype=np.uint8),
            'savanna': np.array([189, 183, 107], dtype=np.uint8),
        }

    def normalize_array(self, array):
        """Normalize an array to range [0, 1]."""
        array_min = np.min(array)
        array_max = np.max(array)
        if array_max - array_min == 0:
            return np.zeros_like(array)
        return (array - array_min) / (array_max - array_min)

    def fade_near_poles(self, texture):
        """Apply fading near poles to reduce distortion, supporting RGB and grayscale images."""
        pole_fade = np.linspace(1, 0, self.height // 2)
        fade_mask = np.concatenate((pole_fade, pole_fade[::-1]))
        if len(texture.shape) == 3:  # RGB image
            fade_mask = fade_mask.reshape(self.height, 1, 1)
            fade_mask = np.broadcast_to(fade_mask, texture.shape)
        else:  # Grayscale image
            fade_mask = fade_mask.reshape(self.height, 1)
            fade_mask = np.broadcast_to(fade_mask, texture.shape)
        return (texture * fade_mask).astype(np.uint8)

    def generate_noise_map(self, scale, octaves, persistence, lacunarity):
        """Generate a 2D noise map using Perlin noise."""
        x_coords, y_coords = np.meshgrid(
            np.linspace(0, self.width / scale, self.width),
            np.linspace(0, self.height / scale, self.height)
        )

        noise_map = np.zeros((self.height, self.width))
        max_amplitude = 0
        amplitude = 1
        frequency = 1

        for _ in range(octaves):
            noise_layer = np.vectorize(
                lambda x, y: snoise2(x * frequency, y * frequency, base=self.seed)
            )(x_coords, y_coords)
            noise_map += amplitude * noise_layer
            max_amplitude += amplitude
            amplitude *= persistence
            frequency *= lacunarity

        return self.normalize_array(noise_map / max_amplitude)

    def apply_latitude_compensation(self, noise_map):
        """Compensate for polar distortions by scaling noise based on latitude."""
        latitude_factor = np.cos(np.linspace(-np.pi / 2, np.pi / 2, self.height)).reshape(-1, 1)
        return noise_map * (latitude_factor * 0.5 + 0.5)

    def generate_base_map(self, elevation_map):
        """Generate a base map with biome colors."""
        
        temperature = self.generate_noise_map(scale=300, octaves=4, persistence=0.5, lacunarity=2.0)
        moisture = self.generate_noise_map(scale=200, octaves=4, persistence=0.5, lacunarity=2.0)
        elevation = gaussian_filter(elevation_map, sigma=5)

        biome_colors = {
            'ocean': np.array([0, 0, 128], dtype=np.uint8),
            'beach': np.array([194, 178, 128], dtype=np.uint8),
            'forest': np.array([34, 139, 34], dtype=np.uint8),
            'grassland': np.array([124, 252, 0], dtype=np.uint8),
            'mountain': np.array([139, 137, 137], dtype=np.uint8),
            'snow': np.array([255, 255, 255], dtype=np.uint8),
            'desert': np.array([210, 180, 140], dtype=np.uint8),
            'savanna': np.array([189, 183, 107], dtype=np.uint8),
        }

        img = np.zeros((self.height, self.width, 3), dtype=np.uint8)

        for y in range(self.height):
            for x in range(self.width):
                elev, temp, moist = elevation[y, x], temperature[y, x], moisture[y, x]
                if elev < 0.4:
                    color = self.color_palette['ocean']
                elif elev < 0.45:
                    color = self.color_palette['beach']
                elif elev > 0.8:
                    color = self.color_palette['snow'] if temp < 0.3 else self.color_palette['mountain']
                elif moist > 0.7:
                    color = self.color_palette['forest']
                elif temp > 0.7:
                    color = self.color_palette['desert']
                else:
                    color = self.color_palette['grassland']
                img[y, x] = color

        img = self.fade_near_poles(img)
        return Image.fromarray(img)

    def generate_bump_map(self, elevation_map):
        """Generate a bump map with geological features."""
        bump_map = gaussian_filter(elevation_map, sigma=1)
        bump_map = self.normalize_array(bump_map)
        bump_img = Image.fromarray((bump_map * 255).astype(np.uint8))
        bump_img = bump_img.filter(ImageFilter.UnsharpMask(radius=2, percent=150))
        enhancer = ImageEnhance.Contrast(bump_img)
        return enhancer.enhance(1.3)

    def generate_specular_map(self, elevation_map):
        """Generate a specular map based on biome reflectivity."""
        specular_map = np.zeros((self.height, self.width))
        for y in range(self.height):
            for x in range(self.width):
                elev = elevation_map[y, x]
                if elev < 0.4:  # Ocean
                    specular_map[y, x] = 0.8
                elif elev > 0.8:  # Snow
                    specular_map[y, x] = 0.6
                else:  # Land
                    specular_map[y, x] = 0.3

        specular_map = self.normalize_array(specular_map)
        return Image.fromarray((specular_map * 255).astype(np.uint8))

    def generate_light_map(self, elevation_map):
        """Generate a light map based on population density."""
        land_mask = elevation_map > 0.4
        light_map = np.zeros((self.height, self.width))

        for _ in range(self.width * self.height // 100000):
            x, y = np.random.randint(0, self.width), np.random.randint(0, self.height)
            if land_mask[y, x]:
                radius = np.random.randint(5, 20)
                intensity = np.random.uniform(0.2, 0.8)
                self.add_light_cluster(light_map, x, y, radius, intensity)

        light_map = gaussian_filter(light_map, sigma=2.0)
        light_map = self.normalize_array(light_map)
        return Image.fromarray((light_map * 255).astype(np.uint8))

    def add_light_cluster(self, light_map, center_x, center_y, radius, intensity):
        """Add a light cluster to the map."""
        y_min, y_max = max(0, center_y - radius), min(self.height, center_y + radius)
        x_min, x_max = max(0, center_x - radius), min(self.width, center_x + radius)
        y_coords, x_coords = np.meshgrid(range(y_min, y_max), range(x_min, x_max), indexing='ij')
        distances = np.sqrt((x_coords - center_x) ** 2 + (y_coords - center_y) ** 2)
        falloff = np.exp(-distances ** 2 / (2 * (radius / 3) ** 2)) * intensity
        light_map[y_min:y_max, x_min:x_max] = np.maximum(light_map[y_min:y_max, x_min:x_max], falloff)

    def generate_refined_cloud_map(self, cloud_density=0.6, gap_frequency=0.4, smoothing=2.0):
        """
        Generate a high-resolution cloud map with varied density and visible gaps.
        
        Args:
            cloud_density (float): Overall cloud coverage (0.0 to 1.0).
            gap_frequency (float): Frequency of gaps in the cloud layer (0.0 to 1.0).
            smoothing (float): Smoothing factor for blending clouds.

        Returns:
            numpy.ndarray: Refined cloud map with gaps and natural variation.
        """
        # Base and detail cloud layers
        base_clouds = self.generate_noise_map(scale=200, octaves=6, persistence=0.7, lacunarity=2.0)
        detail_clouds = self.generate_noise_map(scale=100, octaves=4, persistence=0.5, lacunarity=2.0)

        # Combine layers
        cloud_map = base_clouds * 0.6 + detail_clouds * 0.4

        # Create gap mask
        gap_mask = self.generate_noise_map(scale=300, octaves=3, persistence=0.5, lacunarity=2.5)
        gap_threshold = 1.0 - gap_frequency
        cloud_map[gap_mask < gap_threshold] = 0  # Apply gaps to the cloud map

        # Adjust density
        cloud_map *= cloud_density

        # Smooth edges
        cloud_map = gaussian_filter(cloud_map, sigma=smoothing)

        # Normalize and enhance contrast
        cloud_map = self.normalize_array(cloud_map)
        cloud_map = np.power(cloud_map, 1.5)

        return cloud_map
    
    def generate_translucent_cloud_map(self):
        """Generate a translucent cloud map with alpha channel."""
        cloud_map = self.generate_refined_cloud_map()
        alpha_channel = (cloud_map * 204 + 51).astype(np.uint8)
        rgba = np.zeros((self.height, self.width, 4), dtype=np.uint8)
        rgba[..., :3] = 255  # White clouds
        rgba[..., 3] = alpha_channel
        return Image.fromarray(rgba, mode="RGBA")

    def save_textures(self, output_dir="planet_textures"):
        """Generate and save all textures."""
        os.makedirs(output_dir, exist_ok=True)

        elevation_map = self.generate_noise_map(scale=400, octaves=6, persistence=0.6, lacunarity=2.0)
        elevation_map = self.apply_latitude_compensation(elevation_map)

        base_map = self.generate_base_map(elevation_map)
        base_map.save(f"{output_dir}/00_planet_base_map.jpg", quality=95)

        bump_map = self.generate_bump_map(elevation_map)
        bump_map.save(f"{output_dir}/01_planet_bump_map.jpg", quality=95)

        specular_map = self.generate_specular_map(elevation_map)
        specular_map.save(f"{output_dir}/02_planet_specular_map.jpg", quality=95)

        refined_cloud_map = self.generate_refined_cloud_map()
        refined_cloud_img = Image.fromarray((refined_cloud_map * 255).astype(np.uint8))
        refined_cloud_img.save(f"{output_dir}/03_planet_cloud_map.jpg", quality=95)

        translucent_cloud_map = self.generate_translucent_cloud_map()
        translucent_cloud_map.save(f"{output_dir}/04_translucent_cloud_map.png", quality=95)

        light_map = self.generate_light_map(elevation_map)
        light_map.save(f"{output_dir}/05_planet_light_map.jpg", quality=95)

        print(f"Textures saved to {output_dir}")

# Main Execution
if __name__ == "__main__":
    generator = TextureGenerator(width=2048, height=1024)
    generator.save_textures()
