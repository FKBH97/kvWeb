import os
import sys
import argparse
import random
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
from tqdm import tqdm
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Helper to resolve script path dynamically
def get_script_dir():
    return Path(__file__).resolve().parent

# Add script directory to sys.path for imports
script_dir = get_script_dir()
if script_dir not in sys.path:
    sys.path.append(str(script_dir))

# Import generator modules
try:
    from gas_planet_generator import GasPlanetGenerator
    from star_generator import StarGenerator
    from asteroid_generator import AsteroidGenerator
    from generate_planet_textures import TextureGenerator
    from ring_generator import PlanetaryRingGenerator
except ImportError as e:
    logger.error(f"Failed to import generator modules: {e}")
    sys.exit(1)

# Picklable task handler
def generate_planet_task(task):
    try:
        planet_type, folder, params, generator_class = task
        folder.mkdir(parents=True, exist_ok=True)

        # Save parameters
        params_file = folder / "parameters.json"
        with params_file.open("w") as f:
            json.dump(params, f, indent=4)

        # Generate planet
        generator = generator_class(**params)
        generator.generate(output_path=str(folder))

        return f"Successfully generated {folder.name}"
    except Exception as e:
        return f"Failed to generate {folder.name}: {str(e)}"

# Main planet generator manager
class PlanetGeneratorManager:
    def __init__(self, base_dir="kvWeb/Planets", resolution=(2048, 1024), workers=None, skip_existing=True):
        self.base_dir = Path(base_dir).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.resolution = resolution
        self.workers = workers or os.cpu_count()
        self.skip_existing = skip_existing

        self.naming_conventions = {
            "gas": "gas",
            "star": "star",
            "terrestrial": "planet",
            "asteroid": "asteroid",
            "ringed": "ring"
        }

        self.generators = {
            "gas": GasPlanetGenerator,
            "star": StarGenerator,
            "terrestrial": TextureGenerator,
            "asteroid": AsteroidGenerator,
            "ringed": PlanetaryRingGenerator
        }

    def get_next_folder_number(self, planet_type):
        """Determine the next folder number for a planet type."""
        prefix = self.naming_conventions[planet_type]
        existing_folders = [
            folder.name for folder in self.base_dir.glob(f"{prefix}_*")
            if folder.is_dir() and folder.name.startswith(prefix)
        ]
        existing_numbers = [
            int(folder.split('_')[-1]) for folder in existing_folders if folder.split('_')[-1].isdigit()
        ]
        return max(existing_numbers, default=0) + 1

    def generate_parameters(self, planet_type):
        """Generate parameters for planet creation."""
        base_params = {"seed": random.randint(1, 1000000), "resolution": self.resolution}
        type_params = {
            "gas": {"type": random.choice(["jupiter", "saturn", "uranus", "neptune"])},
            "star": {"temperature": random.uniform(3000, 12000)},
            "terrestrial": {"biomes": random.randint(3, 6)},
            "asteroid": {"density": random.uniform(0.1, 0.9)},
            "ringed": {"ring_density": random.uniform(0.1, 0.5)}
        }
        return {**base_params, **type_params.get(planet_type, {})}

    def is_task_skippable(self, folder):
        """Check if the folder already exists and generation can be skipped."""
        return self.skip_existing and folder.exists() and (folder / "parameters.json").exists()

    def generate_multiple_planets(self, counts):
        """Generate planets with multiprocessing."""
        tasks = []
        for planet_type, count in counts.items():
            next_number = self.get_next_folder_number(planet_type)
            for i in range(count):
                folder_name = f"{self.naming_conventions[planet_type]}_{next_number + i}"
                folder = self.base_dir / folder_name
                if self.is_task_skippable(folder):
                    logger.info(f"Skipping existing planet: {folder.name}")
                    continue
                params = self.generate_parameters(planet_type)
                tasks.append((planet_type, folder, params, self.generators[planet_type]))

        with ProcessPoolExecutor(max_workers=self.workers) as executor:
            results = list(tqdm(executor.map(generate_planet_task, tasks), total=len(tasks), desc="Generating planets"))
            for result in results:
                logger.info(result)

# Command-line interface
def main():
    parser = argparse.ArgumentParser(description="Planet Generation Script")
    parser.add_argument("--gas", type=int, default=0, help="Number of gas planets.")
    parser.add_argument("--star", type=int, default=0, help="Number of stars.")
    parser.add_argument("--terrestrial", type=int, default=0, help="Number of terrestrial planets.")
    parser.add_argument("--asteroid", type=int, default=0, help="Number of asteroids.")
    parser.add_argument("--ringed", type=int, default=0, help="Number of ringed planets.")
    parser.add_argument("--workers", type=int, help="Number of parallel workers.")
    parser.add_argument("--resolution", type=str, default="2048x1024", help="Resolution as WIDTHxHEIGHT.")
    parser.add_argument("--skip-existing", action="store_true", help="Skip existing planets.")
    args = parser.parse_args()

    # Parse resolution
    width, height = map(int, args.resolution.split('x'))

    manager = PlanetGeneratorManager(
        resolution=(width, height),
        workers=args.workers,
        skip_existing=args.skip_existing
    )

    counts = {
        "gas": args.gas,
        "star": args.star,
        "terrestrial": args.terrestrial,
        "asteroid": args.asteroid,
        "ringed": args.ringed
    }

    manager.generate_multiple_planets(counts)

if __name__ == "__main__":
    main()
