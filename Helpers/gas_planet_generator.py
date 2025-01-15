import numpy as np
from noise import snoise2
from PIL import Image, ImageDraw, ImageFilter
import random
import argparse
from typing import List, Tuple

class GasPlanetGenerator:
    def __init__(self, width: int = 2048, height: int = 1024):
        self.width = width
        self.height = height
        self.planet_types = {
            'jupiter': {
                'colors': [(255, 255, 255), (255, 200, 100), (255, 150, 50), (200, 100, 50), (150, 50, 50)],
                'band_frequency': 2.0,
                'storm_density': 0.8,
                'turbulence': 0.6
            },
            'saturn': {
                'colors': [(255, 220, 180), (230, 200, 150), (200, 180, 140), (180, 160, 120)],
                'band_frequency': 1.5,
                'storm_density': 0.3,
                'turbulence': 0.4
            },
            'uranus': {
                'colors': [(200, 255, 255), (150, 220, 255), (100, 180, 220), (50, 150, 200)],
                'band_frequency': 1.0,
                'storm_density': 0.1,
                'turbulence': 0.2
            },
            'neptune': {
                'colors': [(30, 60, 255), (20, 40, 200), (10, 30, 180), (5, 20, 150)],
                'band_frequency': 1.2,
                'storm_density': 0.4,
                'turbulence': 0.5
            }
        }

    def generate_noise(self, scale: float, octaves: int, persistence: float, lacunarity: float) -> np.ndarray:
        """Generate 2D Perlin noise."""
        noise = np.zeros((self.height, self.width))
        for y in range(self.height):
            for x in range(self.width):
                noise[y][x] = snoise2(x / scale, y / scale, octaves=octaves, persistence=persistence, lacunarity=lacunarity, repeatx=self.width, repeaty=self.height)
        return noise

    def generate_bands(self, frequency: float, turbulence: float) -> np.ndarray:
        """Generate horizontal bands with turbulence."""
        base_bands = self.generate_noise(scale=100 / frequency, octaves=4, persistence=0.5, lacunarity=2.0)
        turbulence_noise = self.generate_noise(scale=50, octaves=6, persistence=0.6, lacunarity=2.5)
        return base_bands + turbulence_noise * turbulence

    def generate_storms(self, density: float, size_range: Tuple[int, int]) -> Image.Image:
        """Generate storm systems."""
        storms = Image.new("L", (self.width, self.height))
        draw = ImageDraw.Draw(storms)
        num_storms = int(density * 20)  # Adjust the storm count
        for _ in range(num_storms):
            x = random.randint(0, self.width)
            y = random.randint(0, self.height)
            size = random.randint(size_range[0], size_range[1])
            draw.ellipse([x - size, y - size, x + size, y + size], fill=random.randint(200, 255))
        return storms.filter(ImageFilter.GaussianBlur(radius=size_range[1] / 4))

    def blend_colors(self, noise_map: np.ndarray, colors: List[Tuple[int, int, int]]) -> Image.Image:
        """Blend colors based on noise values."""
        image = Image.new("RGB", (self.width, self.height))
        pixels = image.load()
        normalized_noise = (noise_map - noise_map.min()) / (noise_map.max() - noise_map.min())
        for y in range(self.height):
            for x in range(self.width):
                value = normalized_noise[y][x]
                color_index = int(value * (len(colors) - 1))
                pixels[x, y] = colors[color_index]
        return image

    def generate_planet(self, planet_type: str, output_file: str):
        """Generate a complete planet texture."""
        if planet_type not in self.planet_types:
            raise ValueError(f"Unknown planet type: {planet_type}")

        params = self.planet_types[planet_type]
        # Generate base bands
        bands = self.generate_bands(params['band_frequency'], params['turbulence'])

        # Generate storms
        storms = self.generate_storms(params['storm_density'], (50, 150))

        # Blend colors
        base_image = self.blend_colors(bands, params['colors'])

        # Composite storms
        final_image = Image.composite(base_image, base_image.filter(ImageFilter.GaussianBlur(3)), storms)

        # Save the texture
        final_image.save(output_file)
        print(f"Generated {planet_type} texture saved as {output_file}")

def main():
    parser = argparse.ArgumentParser(description="Generate realistic gas giant textures.")
    parser.add_argument("--type", choices=["jupiter", "saturn", "uranus", "neptune"], default="jupiter", help="Type of planet to generate")
    parser.add_argument("--width", type=int, default=2048, help="Width of the texture")
    parser.add_argument("--height", type=int, default=1024, help="Height of the texture")
    parser.add_argument("--output", default="planet_texture.png", help="Output file name")
    args = parser.parse_args()

    generator = GasPlanetGenerator(width=args.width, height=args.height)
    generator.generate_planet(args.type, args.output)

if __name__ == "__main__":
    main()
