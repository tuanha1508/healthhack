# CLAUDE.md - Development Notes and Requests

## Important Development Guidelines

### Backend Development
- **ALWAYS** activate the virtual environment before running any backend commands:
  ```bash
  cd backend
  source venv/bin/activate  # On macOS/Linux
  # venv\Scripts\activate    # On Windows
  ```
- Never run Python commands without activating venv first
- Install dependencies with: `pip install -r requirements.txt`
- **Backend server is running on port 8000** - DO NOT restart it unless necessary
- Groq API key is configured in backend/.env and backend/app/core/config.py

### Development Server
- **DO NOT** run `npm run dev` or `pnpm dev` commands
- The development server is already running or will be managed externally
- Frontend is running on port 3000/3001

## Project Structure Requirements

### App Folder Structure
The `/app` folder should maintain a clean structure with:
- `page.tsx` - Main landing page
- `layout.tsx` - Root layout
- `globals.css` - Global styles
- `favicon.ico` - Site favicon
- `/patient` - Patient portal routes
- `/doctor` - Doctor portal routes

### Components Location
- All shared components should be in the root `/components` folder
- Do NOT create components inside the `/app` folder
- Use absolute imports with `@/components/...` for all component imports

## Completed Tasks

### 1. Project Restructuring ✅
- Moved shared components to root `/components` folder
- Cleaned up `/app` folder structure
- Updated all import paths to use absolute imports

### 2. Patient Dashboard Updates ✅
- Removed diagnostics, appointments, and health records from main dashboard
- Kept only the Overview section
- Created new Diagnostics page with:
  - List of diagnostic history with dates
  - Clickable dates that open a modal
  - Modal with video player (left side) and AI chat (right side)

### 3. Installed shadcn Components ✅
- Dialog component
- Scroll-area component
- Tabs component
- Alert component
- Badge component

### 4. Doctor Dashboard Implementation ✅
- Transformed Guardian Dashboard to Doctor Dashboard
- Created patient management system with:
  - Patient list with search functionality
  - Patient selection to view video instruction history
  - Video recording with real camera access
  - Automatic speech-to-text transcription using Groq API
  - Editable subtitles with timestamps (YouTube-style)
  - Export subtitles as SRT format

### 5. Backend Transcription API ✅
- Created `/api/transcribe` endpoint in backend
- Integrated Groq Whisper model for speech-to-text
- Returns timestamped subtitle segments
- Fallback to mock data if API unavailable

## Route Structure

```
/                          - Landing page
/patient                   - Patient overview dashboard
/patient/diagnostics       - Diagnostics history with modal functionality
/doctor                    - Doctor dashboard
/doctor/patients           - Doctor's patient management with video recording
```

## Component Architecture

```
/components
  ├── DashboardLayout.tsx  - Shared dashboard layout with sidebar
  ├── Card.tsx            - Card and StatCard components
  └── /ui                 - shadcn UI components
      ├── dialog.tsx
      ├── scroll-area.tsx
      └── ... (other UI components)
```

## Notes for Future Development

1. All routes must be inside the `/app` folder for Next.js 13+ app directory to work
2. Components should remain outside `/app` in the root `/components` folder
3. Use `@/` prefix for absolute imports
4. The patient diagnostics page includes a modal with video and chat functionality

## User Preferences

- Keep code clean and well-organized
- Maintain clear separation between routes (in `/app`) and components (in `/components`)
- Focus on healthcare/Alzheimer's detection functionality
- Implement interactive features with proper user feedback