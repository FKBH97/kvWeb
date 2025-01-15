import numpy as np
from noise import snoise3
from PIL import Image, ImageDraw, ImageFilter
import argparse
import os
import math
from typing import List, Tuple, Dict


class PlanetaryRingGenerator:
    def __init__(self, width: int = 2048, height: int = 512):
        self.width = width
        self.height = height

        # Predefined presets for Saturn and Uranus rings
        self.presets = {
            "saturn": {
                "colors": [(230, 220, 190), (210, 200, 170), (190, 180, 160)],
                "gaps": [0.2, 0.4, 0.6],
                "gap_widths": [0.03, 0.05, 0.02],
                "density": 0.8,
                "transparency": 0.7,
                "noise_scale": 20.0,
            },
            "uranus": {
                "colors": [(200, 220, 255), (180, 200, 240), (160, 180, 220)],
                "gaps": [0.3, 0.5, 0.7],
                "gap_widths": [0.05, 0.04, 0.03],
                "density": 0.5,
                "transparency": 0.5,
                "noise_scale": 30.0,
            },
        }

    def generate_noise_layer(self, scale: float, octaves: int, time: float = 0.0) -> np.ndarray:
        """Generate a noise layer using 3D Simplex noise."""
        noise = np.zeros((self.height, self.width))
        for y in range(self.height):
            for x in range(self.width):
                # Radial coordinates for better ring patterns
                r = y / self.height
                theta = 2 * math.pi * x / self.width
                noise[y][x] = snoise3(
                    r * scale,
                    theta * scale,
                    time,
                    octaves=octaves,
                    persistence=0.5,
                )
        return noise

    def generate_ring_pattern(
        self, density: float, gaps: List[float], gap_widths: List[float], noise_scale: float, time: float = 0.0
    ) -> np.ndarray:
        """Generate the basic ring pattern with gaps."""
        pattern = np.ones((self.height, self.width)) * density
        noise = self.generate_noise_layer(noise_scale, 4, time)

        # Apply gaps
        for gap, width in zip(gaps, gap_widths):
            gap_center = int(gap * self.height)
            gap_half_width = int(width * self.height / 2)
            for y in range(self.height):
                if abs(y - gap_center) < gap_half_width:
                    fade = 1 - ((gap_half_width - abs(y - gap_center)) / gap_half_width)
                    pattern[y, :] *= fade

        # Combine with noise for realistic variation
        pattern = (pattern + noise) / 2
        return pattern

    def apply_colors_and_transparency(
        self, pattern: np.ndarray, colors: List[Tuple[int, int, int]], transparency: float
    ) -> Image.Image:
        """Apply colors and transparency to the ring pattern."""
        image = Image.new("RGBA", (self.width, self.height), (0, 0, 0, 0))
        pixels = image.load()
        pattern = (pattern - pattern.min()) / (pattern.max() - pattern.min())

        for y in range(self.height):
            for x in range(self.width):
                value = pattern[y][x]
                radial = 1 - abs((y - self.height / 2) / (self.height / 2))
                color_idx = min(int(value * len(colors)), len(colors) - 1)
                color = colors[color_idx]

                # Adjust brightness based on radial distance
                r, g, b = color
                r, g, b = int(r * radial), int(g * radial), int(b * radial)
                alpha = int(value * 255 * transparency * radial)

                pixels[x, y] = (r, g, b, alpha)

        return image

    def generate_frame(self, preset: Dict, time: float = 0.0) -> Image.Image:
        """Generate a single frame of the ring system."""
        pattern = self.generate_ring_pattern(
            preset["density"],
            preset["gaps"],
            preset["gap_widths"],
            preset["noise_scale"],
            time,
        )
        return self.apply_colors_and_transparency(pattern, preset["colors"], preset["transparency"])

    def generate_rings(self, preset_name: str, output_path: str, frames: int = 1, animation_speed: float = 1.0):
        """Generate the complete ring system, static or animated."""
        if preset_name not in self.presets:
            raise ValueError(f"Unknown preset: {preset_name}")

        preset = self.presets[preset_name]
        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

        if frames == 1:
            image = self.generate_frame(preset)
            image.save(output_path)
            print(f"Generated static ring texture: {output_path}")
        else:
            frame_list = []
            for i in range(frames):
                time = i * animation_speed / frames
                frame = self.generate_frame(preset, time)
                frame_list.append(frame)

            frame_list[0].save(
                output_path,
                save_all=True,
                append_images=frame_list[1:],
                duration=100,
                loop=0,
            )
            print(f"Generated animated ring texture: {output_path}")


def parse_resolution(resolution_str: str) -> Tuple[int, int]:
    width, height = map(int, resolution_str.split("x"))
    return width, height


def main():
    parser = argparse.ArgumentParser(description="Generate procedural planetary ring textures")
    parser.add_argument("--preset", choices=["saturn", "uranus"], default="saturn", help="Ring preset type")
    parser.add_argument("--resolution", default="2048x512", help="Texture resolution (WxH)")
    parser.add_argument("--frames", type=int, default=1, help="Number of animation frames")
    parser.add_argument("--animation_speed", type=float, default=1.0, help="Animation speed multiplier")
    parser.add_argument("--output", default="rings.png", help="Output file path")

    args = parser.parse_args()
    width, height = parse_resolution(args.resolution)
    generator = PlanetaryRingGenerator(width, height)
    generator.generate_rings(args.preset, args.output, frames=args.frames, animation_speed=args.animation_speed)


if __name__ == "__main__":
    main()
