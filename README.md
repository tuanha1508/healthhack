# HealthHack - Alzheimer's Detection & Patient Care System

A full-stack application for Alzheimer's detection and patient care, featuring AI-powered medical instruction assistance.

## Project Structure

```
healthhack/
├── frontend/          # Next.js Frontend Application
│   ├── app/          # Next.js app directory
│   ├── components/   # React components
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
│
├── backend/          # Python FastAPI Backend
│   ├── app/
│   │   ├── api/      # API routes
│   │   ├── core/     # Configuration
│   │   ├── models/   # Data models
│   │   └── services/ # Business logic
│   ├── requirements.txt
│   └── run.py        # Backend entry point
│
└── README.md
```

## Features

- **Patient Dashboard**: Interactive dashboard for patients to view their diagnostics
- **Medical Video Instructions**: Simulated medical instruction videos with synchronized subtitles
- **AI Chat Assistant**: Context-aware AI assistant powered by Groq that answers questions based on video content
- **Diagnostic History**: Complete history of patient assessments and results

## Tech Stack

### Frontend
- Next.js 14
- React
- TypeScript
- Tailwind CSS
- shadcn/ui components

### Backend
- Python 3.8+
- FastAPI
- Groq SDK (Llama 3.3 70B model)
- Pydantic for data validation

## Prerequisites

- Node.js 18+ and pnpm
- Python 3.8+
- Groq API key (already configured in the project)

## Installation & Setup

### 1. Install Backend Dependencies

```bash
cd backend
python -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate

pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

```bash
cd frontend
pnpm install
```

## Running the Application

### Start the Backend Server (Terminal 1)

```bash
cd backend
source venv/bin/activate  # On macOS/Linux
python run.py
```

The backend will start on http://localhost:8000

### Start the Frontend Development Server (Terminal 2)

```bash
cd frontend
pnpm dev
```

The frontend will start on http://localhost:3000

## API Endpoints

### Backend API (http://localhost:8000)

- `GET /` - API health check
- `POST /api/chat/` - AI chat endpoint
- `GET /api/diagnostics/history` - Get diagnostic history
- `GET /api/diagnostics/{id}` - Get specific diagnostic

### API Documentation

Once the backend is running, visit:
- http://localhost:8000/docs - Swagger UI documentation
- http://localhost:8000/redoc - ReDoc documentation

## Environment Variables

### Backend (.env)
```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
HOST=0.0.0.0
PORT=8000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Usage

1. Navigate to http://localhost:3000
2. Go to Patient Dashboard → Diagnostics
3. Click on any diagnostic entry to open the video modal
4. Use Play/Pause controls to watch the simulated medical instructions
5. Pause at any time to ask the AI assistant questions about what you've watched
6. The AI will only answer based on the content you've seen up to that point

## Features in Detail

### Video Player
- Simulated medical instruction videos with subtitles
- Play/Pause/Reset controls
- Progress bar with manual scrubbing
- Synchronized subtitles that update as the video plays

### AI Assistant
- Context-aware responses based on video timestamp
- Medical instruction clarification
- Simple, patient-friendly language
- Powered by Groq's Llama 3.3 70B model

### Diagnostic Types
- Cognitive Assessment Instructions
- Memory Assessment Results
- Speech Therapy Instructions
- Daily Living Skills Review
- Physical Exercise Guide
- Nutrition Guidelines

## Development

### Backend Development
```bash
cd backend
source venv/bin/activate
python run.py  # Auto-reloads on file changes
```

### Frontend Development
```bash
cd frontend
pnpm dev  # Hot-reloads on file changes
```

## Troubleshooting

### Backend Issues
- Ensure Python 3.8+ is installed
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Verify the backend is running on port 8000

### Frontend Issues
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`
- Ensure backend is running before starting frontend

### CORS Issues
- The backend is configured to accept requests from localhost:3000
- If using different ports, update `ALLOWED_ORIGINS` in `backend/app/core/config.py`

## License

MIT
