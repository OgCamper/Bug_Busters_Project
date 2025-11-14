# Bug_Busters_Project

### Contributors
- [OgCamper](https://github.com/OgCamper)
- [Systemized](https://github.com/Systemized)
- [JohnnyTranWorks](https://github.com/JohnnyTranWorks)
- [Tytusclements-cpu](https://github.com/Tytusclements-cpu)

Project Description
---
Our project is a study app that helps students keep all their notes, flashcards, and study
progress in one place. The goal is to fix the common problem of scattered study materials
and last‑minute cramming. Instead, the app encourages steady learning and long‑term
memory.

Unlike tools like Quizlet, our app uses a spaced‑repetition system to schedule reviews at
the best times, includes a simple dashboard to track progress, and supports collaboration
between students and instructors. The system is built with modern, full‑stack tools that
are realistic for both a college project and real‑world use.

Main Components of the System
---
**Frontend**: Built with React, TypeScript, and TailwindCSS. Students can create flashcards, get study reminders, and track progress in a clean, responsive web app.

**Backend**: Built with Node.js and Express. It handles logins, spaced‑repetition logic, and flashcard management.

**Database**: Uses PostgreSQL to store users, flashcards, tags, review history, and analytics.

**Security**: Uses JWT tokens for login sessions and bcrypt for password protection.

**Deployment**: Runs in Docker and can be hosted on platforms like Heroku or Render.

Setup
---

#### Prerequsite
- [Docker](https://www.docker.com/)

#### Run
1. Clone project
    ```sh
    git clone https://github.com/OgCamper/Bug_Busters_Project.git
    ```

2. Cd to project
    ```sh
    cd Bug_Busters_Project
    ```

2. Run docker compose
    ```sh
    docker-compose up -d
    ```