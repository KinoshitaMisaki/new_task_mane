# Task Management Application

## Overview

A comprehensive task management application built with Python (Flask) for the backend, SQLite as the database, and vanilla JavaScript, HTML, and CSS for the frontend. It allows users to manage tasks through an interactive interface featuring a calendar-based task list and a dynamic Gantt chart.

Key technologies: Python, Flask, Flask-SQLAlchemy, SQLite, JavaScript, HTML, CSS, SortableJS (for drag & drop), flatpickr (for date inputs).

## Features

*   **Task Management (CRUD)**: Create, view, edit, and delete tasks. Deleted tasks are soft-deleted with an optional reason and can be restored.
*   **Task Lifecycle**:
    *   **Start Task**: Mark tasks as "started" by setting a start date.
    *   **End Task**: Mark tasks as "completed" by setting an end date.
    *   **Restore**: Restore ended or deleted tasks back to active status.
*   **Calendar Task List**:
    *   Displays tasks in a 7-day calendar view, with tasks placed under their respective limit dates.
    *   Includes an "Other Active Tasks" list for tasks without a limit date or outside the current week view.
    *   **Drag & Drop for Date Changes**: Move tasks between day columns or to/from "Other Tasks" to update their `limitDate`.
    *   **Drag & Drop for Reordering**: Reorder tasks within each day column or within the "Other Tasks" list.
*   **Gantt Chart**:
    *   **Dynamic Timeline**: Visualizes tasks over a timeline spanning from 7 days prior to the current date up to one year ahead.
    *   **Scaled Task Bars**: Task bars are accurately positioned and sized based on their start and end dates (or calculated period for ongoing tasks).
    *   **Horizontal Scrolling**: Allows navigation through the timeline.
    *   **Ctrl+Scroll Zoom**: Zoom in and out of the Gantt timeline for different levels of detail.
    *   **Task Order Synchronization**: Gantt chart rows reflect the current sort order of the task list.
*   **Visual Cues**:
    *   **Color Coding**: Task cards and Gantt bars are color-coded based on their status:
        *   Orange (with red border for cards): Started tasks.
        *   Red: Overdue tasks.
        *   Purple: Tasks due within the next 7 days.
        *   Green: Default for other active tasks.
    *   **Date Pickers**: User-friendly flatpickr date pickers for all date inputs.
*   **Sorting**: Active tasks can be sorted by "Default Order" (manual drag & drop order), "Limit Date (Ascending)", or "Limit Date (Descending)".
*   **Responsive Layout**: The main view uses a 40% (task list) / 60% (Gantt chart) width ratio on larger screens, and stacks vertically on smaller screens (e.g., mobile).

## System Requirements

*   Python 3.8+
*   pip (Python package installer)
*   A modern web browser

## Setup Instructions

1.  **Clone the Repository**:
    ```bash
    git clone https://example.com/your-repository-url.git
    cd your-project-directory-name
    ```

2.  **Create and Activate Virtual Environment**:
    *   It's highly recommended to use a virtual environment.
    ```bash
    python -m venv venv
    ```
    *   Activate the environment:
        *   On Windows:
            ```bash
            venv\Scripts\activate
            ```
        *   On macOS/Linux:
            ```bash
            source venv/bin/activate
            ```

3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

## Database Initialization

The SQLite database file (`tasks.db` in the project root) and its tables will be automatically created the first time you run the application. No manual database setup steps are required.

## Running the Application

1.  **Ensure your virtual environment is activated.**
2.  **Run the Flask development server**:
    ```bash
    python app.py
    ```
3.  Open your web browser and navigate to:
    [http://127.0.0.1:5000/](http://127.0.0.1:5000/)

The application will be running in debug mode, which provides helpful error messages and automatic reloading when code changes.

## Project Structure

*   `app.py`: Main Flask application file (routes, backend logic).
*   `models.py`: Defines the SQLAlchemy database models (e.g., `Task`).
*   `requirements.txt`: Lists Python dependencies.
*   `static/`: Contains static assets:
    *   `css/style.css`: Main stylesheet.
    *   `js/main.js`: Core JavaScript logic for frontend interactivity.
*   `templates/index.html`: Main HTML template for the application.
*   `tasks.db`: SQLite database file (created automatically on first run).

## Notes

*   The application uses `SortableJS` (via CDN) for drag-and-drop and `flatpickr` (via CDN) for date inputs. An internet connection may be required on first load to fetch these libraries if they are not cached.
```
