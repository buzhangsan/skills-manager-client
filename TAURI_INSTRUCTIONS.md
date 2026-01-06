# How to build for Desktop (Tauri)

This project is ready to be built as a native desktop application using [Tauri](https://tauri.app/).

## Prerequisites

1.  **Install Rust**:
    *   **Windows**: Download and install [rustup-init.exe](https://win.rustup.rs/).
    *   **macOS/Linux**: Run `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

2.  **Install System Dependencies**:
    *   **macOS**: `xcode-select --install`
    *   **Linux**: Check [Tauri Linux Setup](https://tauri.app/v1/guides/getting-started/prerequisites#linux)

## Setup Tauri

1.  Install Tauri CLI:
    ```bash
    npm install -D @tauri-apps/cli
    ```

2.  Initialize Tauri (already structured for React):
    ```bash
    npx tauri init
    ```
    *   What is your app name? `skill-manager`
    *   What should the window title be? `Skill Manager`
    *   Where are your web assets (HTML/CSS/JS) located? `../dist`
    *   What is the url of your dev server? `http://localhost:5173`
    *   What is your frontend dev command? `npm run dev`
    *   What is your frontend build command? `npm run build`

## Development

Run the app in desktop mode:

```bash
npx tauri dev
```

## Build (Exe/Dmg)

Build the final installer:

```bash
npx tauri build
```

The output files will be located in:
*   `src-tauri/target/release/bundle/msi/` (Windows)
*   `src-tauri/target/release/bundle/dmg/` (macOS)
*   `src-tauri/target/release/bundle/deb/` (Linux)
