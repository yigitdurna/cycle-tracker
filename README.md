# Menstrual Cycle Tracker

A privacy-focused menstrual cycle tracker built as a Progressive Web App (PWA). Designed with a dark aesthetic, it features a custom-styled calendar, accurate phase predictions, and complete data privacy (all data stays on your device).

![Cycle Tracker Screenshot](https://via.placeholder.com/800x400?text=Cycle+Tracker+Preview)
*(Replace with actual screenshot)*

## Features

*   **Dark Theme**: Pure Black background (`#050505`) with Rose Gold accents (`#E6B8B8`) and Lavender Luteal phase.
*   **Smart Predictions**:
    *   Accurate tracking of Period, Fertile Window, Ovulation, and Luteal phases.
    *   **No-Gap Fertility**: Fertile window starts immediately after the period ends.
    *   **Smart Limiting**: Predictions are shown only for the current cycle and the immediate next period to reduce clutter.
*   **Interactive Calendar**:
    *   Custom-styled **Flatpickr** integration.
    *   **Edit Mode**: Click "Edit" in history to modify dates directly on the calendar.
    *   **Clean UI**: Hidden arrows, centered layout, and subtle markers for a seamless look.
*   **Privacy First**:
    *   **Local Storage**: All data is stored locally in your browser (`localStorage`). No servers, no tracking.
    *   **Data Portability**: Full JSON and CSV Export/Import capabilities.
*   **PWA Ready**:
    *   Installable on iOS and Android.
    *   Offline support via Service Worker.
    *   App-like feel with bottom navigation.

## Tech Stack

*   **HTML5**: Semantic structure.
*   **CSS3**: Custom variables, Flexbox/Grid, Glassmorphism effects.
*   **JavaScript (ES6+)**: Core logic, cycle math, and DOM manipulation.
*   **Flatpickr**: Lightweight, powerful datetime picker (customized).
*   **Fonts**: Futura Medium (System Fallback).

## Getting Started

Since this is a static web application, you can run it with any simple HTTP server.

### Prerequisites
*   A modern web browser (Safari, Chrome, Edge).
*   (Optional) A local server like `http-server` or VS Code Live Server.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/cycle-tracker.git
    cd cycle-tracker
    ```

2.  **Run locally**:
    *   If you have Python installed:
        ```bash
        python3 -m http.server
        ```
    *   Or use `npx`:
        ```bash
        npx http-server .
        ```

3.  **Open in Browser**:
    *   Navigate to `http://localhost:8000` (or whatever port your server uses).

## Usage

1.  **Log a Period**: Select start and end dates on the calendar and click "Log Period".
2.  **Edit a Cycle**: Go to the **History** tab, click "Edit" on any cycle. The app will switch to the calendar view where you can adjust the dates and click "Update Cycle".
3.  **Delete**: Click the Trash icon in the History tab.
4.  **Export/Import**: Use the buttons in the History tab to backup your data (JSON) or export for analysis (CSV).

## License

This project is open-source and available under the MIT License.
