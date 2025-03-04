"""
Takes JSON file with a dictionary mapping characters to SVG paths
and creates a WOFF file with icon contribution point for VSCode plugin.

Paths in the JSON file are relative to the input JSON file.
"""

import json
from pathlib import Path
import argparse
import fontforge


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "input_mapping",
        type=Path,
        help="JSON mapping from character to corresponding SVG path",
    )
    parser.add_argument(
        "output_woff",
        type=Path,
        help="Path to output WOFF file",
    )

    args = parser.parse_args()

    with args.input_mapping.open() as input_data:
        mapping = json.load(input_data)

    font = fontforge.font()

    for char, path in mapping.items():
        glyph = font.createMappedChar(char)
        glyph.importOutlines(str(args.input_mapping.parent / path))

    font.generate(str(args.output_woff))


if __name__ == "__main__":
    main()
