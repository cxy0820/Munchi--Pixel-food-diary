import argparse
from pathlib import Path

try:
    from pillow_heif import register_heif_opener

    register_heif_opener()
except ImportError:
    pass

from rembg import new_session, remove


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="u2net")
    parser.add_argument("input")
    parser.add_argument("output")
    args = parser.parse_args()

    session = new_session(args.model)
    result = remove(Path(args.input).read_bytes(), session=session, force_return_bytes=True)
    Path(args.output).write_bytes(result)


if __name__ == "__main__":
    main()
