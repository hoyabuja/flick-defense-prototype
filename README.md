# Vertical Dart Defense

Vertical Dart Defense is a minimal Python + Pygame portrait prototype where you flick projectiles upward to stop enemies from reaching the defense line.

## Install Dependencies

```bash
pip install -r requirements.txt
```

## Run the Game

```bash
python game.py
```

If `python` is not on your PATH on Windows, use:

```bash
py -3 game.py
```

## Current Prototype Features

- Portrait-style 390x844 game window
- Enemies continuously spawn from the top
- Enemies move toward the defense line with fake 2.5D scale and drift
- Flick shooting with mouse down and release
- Arcing projectile with shadow and landing feedback
- Score increases when enemies are hit
- HP decreases when enemies reach the defense line
- Game Over appears when HP reaches 0

## Notes

- Placeholder shapes only
- No sound
- No menus
- No upgrades
- No extra systems

## Pygbag Browser Build

Pygbag lets this Pygame prototype run in a browser for desktop and mobile testing.

### Install pygbag

```bash
pip install pygbag --user --upgrade
```

If `pygbag` is not on your PATH, use:

```bash
python -m pygbag --help
```

### Run Locally in a Browser

From the project folder, run:

```bash
pygbag .
```

Or, if needed:

```bash
python -m pygbag .
```

Then open `http://localhost:8000`.

The game uses standard pygame mouse input. In most mobile browsers, touch drags map to mouse-style events, so flick controls should work there too.

### GitHub Pages Upload

Pygbag generates the browser build in:

```bash
build/web/
```

Upload the contents of `build/web/` to GitHub Pages, or use the included GitHub Actions workflow to build and deploy automatically from `main`.
