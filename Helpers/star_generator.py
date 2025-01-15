import numpy as np
from PIL import Image, ImageFilter
import noise
import os
import imageio
imageio.plugins
import math
from typing import Tuple, Dict, List
import argparse

class StarGenerator:
    def __init__(self, width: int = 2048, height: int = 1024):
        self.width = width
        self.height = height
        self.star_types = {
            'red_giant': {
                'base_color': (255, 50, 0),
                'feature_scale': 3.0,
                'granule_scale': 50.0,
                'spot_frequency': 0.4,
                'pulsation_amplitude': 0.2,
                'rotation_speed': 1.0,
            },
            'main_sequence': {
                'base_color': (255, 220, 0),
                'feature_scale': 1.5,
                'granule_scale': 100.0,
                'spot_frequency': 0.6,
                'pulsation_amplitude': 0.1,
                'rotation_speed': 0.8,
            },
            'white_dwarf': {
                'base_color': (220, 220, 255),
                'feature_scale': 0.8,
                'granule_scale': 200.0,
                'spot_frequency': 0.2,
                'pulsation_amplitude': 0.05,
                'rotation_speed': 0.3,
            },
            'blue_star': {
                'base_color': (50, 100, 255),
                'feature_scale': 2.0,
                'granule_scale': 80.0,
                'spot_frequency': 0.3,
                'pulsation_amplitude': 0.15,
                'rotation_speed': 1.2,
            },
        }

    def generate_noise_layer(self, scale: float, time_offset: float = 0.0, octaves: int = 6) -> np.ndarray:
        """Generates Perlin noise for dynamic textures."""
        noise_map = np.zeros((self.height, self.width))
        for y in range(self.height):
            for x in range(self.width):
                noise_map[y][x] = noise.snoise3(
                    x / scale,
                    y / scale,
                    time_offset,
                    octaves=octaves,
                    persistence=0.5,
                )
        return noise_map

    def generate_starspots(self, params: Dict, time: float) -> np.ndarray:
        """Generate starspots that dynamically move and rotate."""
        spots = np.zeros((self.height, self.width))
        num_spots = int(params['spot_frequency'] * 20)
        for _ in range(num_spots):
            angle = time * params['rotation_speed'] * 2 * math.pi
            x = int(self.width / 2 + math.cos(angle) * np.random.randint(0, self.width // 4))
            y = int(self.height / 2 + math.sin(angle) * np.random.randint(0, self.height // 4))
            radius = np.random.randint(10, 30) * params['feature_scale']
            spot_mask = np.zeros((self.height, self.width))
            y_indices, x_indices = np.ogrid[:self.height, :self.width]
            mask = ((x_indices - x)**2 + (y_indices - y)**2 <= radius**2)
            spot_mask[mask] = np.random.uniform(0.2, 0.8)
            spots = np.maximum(spots, spot_mask)
        return spots

    def apply_radial_gradient(self, image: np.ndarray, pulsation: float) -> np.ndarray:
        """Applies a radial gradient and pulsation effect to the star."""
        center_x, center_y = self.width // 2, self.height // 2
        max_distance = math.sqrt(center_x**2 + center_y**2)
        for y in range(self.height):
            for x in range(self.width):
                distance = math.sqrt((x - center_x)**2 + (y - center_y)**2)
                fade = max(0, 1 - distance / max_distance)
                image[y][x] *= fade * (1.0 + pulsation)
        return image

    def blend_layers(self, noise_layer: np.ndarray, spots: np.ndarray, params: Dict) -> np.ndarray:
        """Blend multiple layers (noise, spots, granules) into a final composite."""
        blended = noise_layer * 0.7 + spots * 0.3
        normalized = (blended - blended.min()) / (blended.max() - blended.min())
        return normalized

    def generate_frame(self, star_type: str, time: float) -> Image.Image:
        """Generate a single frame of the star animation."""
        params = self.star_types[star_type]
        granules = self.generate_noise_layer(params['granule_scale'], time)
        spots = self.generate_starspots(params, time)
        combined = self.blend_layers(granules, spots, params)
        pulsation = params['pulsation_amplitude'] * math.sin(time * 2 * math.pi)
        combined = self.apply_radial_gradient(combined, pulsation)

        # Apply color and return the image
        base_color = params['base_color']
        image = Image.new('RGB', (self.width, self.height))
        pixels = image.load()
        for y in range(self.height):
            for x in range(self.width):
                intensity = combined[y][x]
                r = int(base_color[0] * intensity)
                g = int(base_color[1] * intensity)
                b = int(base_color[2] * intensity)
                pixels[x, y] = (r, g, b)
        return image.filter(ImageFilter.GaussianBlur(radius=2))

    def generate_animation(self, star_type: str, num_frames: int, output_path: str):
        """Generates an animation with dynamic behavior."""
        frames = []
        for i in range(num_frames):
            time = i / num_frames
            frame = self.generate_frame(star_type, time)
            frames.append(frame)
        if output_path.endswith('.gif'):
            frames[0].save(output_path, save_all=True, append_images=frames[1:], duration=100, loop=0)
        elif output_path.endswith('.mp4'):
            frames_array = [np.array(frame) for frame in frames]
            imageio.mimsave(output_path, frames_array, fps=30)
        else:
            os.makedirs(output_path, exist_ok=True)
            for i, frame in enumerate(frames):
                frame.save(f"{output_path}/frame_{i:03d}.png")

def parse_resolution(resolution_str: str) -> Tuple[int, int]:
    """Parse resolution input (e.g., '2048x1024')."""
    width, height = map(int, resolution_str.lower().split('x'))
    return width, height

def main():
    parser = argparse.ArgumentParser(description="Generate star textures and animations.")
    parser.add_argument('--type', choices=['red_giant', 'main_sequence', 'white_dwarf', 'blue_star'], 
                        required=True, help="Star type.")
    parser.add_argument('--resolution', default='2048x1024', help="Resolution (e.g., '2048x1024').")
    parser.add_argument('--frames', type=int, default=1, help="Number of animation frames.")
    parser.add_argument('--output', default='star.png', help="Output file path.")
    args = parser.parse_args()

    width, height = parse_resolution(args.resolution)
    generator = StarGenerator(width, height)
    if args.frames == 1:
        frame = generator.generate_frame(args.type, 0)
        frame.save(args.output)
    else:
        generator.generate_animation(args.type, args.frames, args.output)

if __name__ == '__main__':
    main()
