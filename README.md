# HealthHack - AI-Powered Pharmacogenomics & 24/7 Distance Care Platform

A comprehensive healthcare platform that combines **pharmacogenomics-based drug safety analysis** with **24/7 distance care capabilities**. The system helps doctors prescribe medications safely by analyzing genetic variants to detect potential adverse drug reactions, while enabling continuous patient support through AI-powered video instructions and real-time assistance.

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

## Key Features

### 🧬 Pharmacogenomics-Based Drug Safety
- **Genetic Variant Analysis**: Supports both rsID + Genotype and Gene + Star Allele formats
- **Adverse Drug Reaction Detection**: AI-powered analysis identifies potential drug-gene interactions
- **Risk Assessment**: Provides Low/Moderate/High risk levels with detailed evidence
- **Alternative Medication Suggestions**: Recommends safer alternatives when genetic variants indicate high risk
- **Multi-Format Input**: Upload genetic data via CSV/PDF or manual entry
- **Personalized Prescriptions**: Considers patient context (age, sex, ancestry, comorbidities, allergies)

### 🏥 24/7 Distance Care Platform
- **Video-Based Medical Instructions**: Doctors record personalized instruction videos for patients
- **Automatic Speech-to-Text**: Real-time transcription with editable subtitles (YouTube-style)
- **Anytime Access**: Patients can review medical instructions 24/7 from home
- **AI Medical Assistant**: Context-aware chatbot answers patient questions based on video content
- **Progress Tracking**: Monitors which videos patients have watched and when
- **Prescription Management**: Digital prescription delivery with read receipts

### 👨‍⚕️ Doctor Portal
- **Patient Management**: Centralized view of all patient activities
- **Video Recording**: Record and send medical instructions with camera integration
- **Prescription Workflow**: Analyze genetic variants and prescribe medications safely
- **Activity Dashboard**: Track patient engagement with videos and prescriptions

### 👤 Patient Portal
- **Medical Video Library**: Access all doctor instructions with AI assistance
- **Prescription History**: View and download current medications
- **Interactive Learning**: Pause videos anytime to ask AI questions
- **Privacy-Focused**: All data stays within the secure platform

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
- Groq SDK (Llama 3.3 70B for chat, Whisper for transcription)
- Pydantic for data validation
- Pharmacogenomics API Integration (EpiRisk MSCS)

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

### Important Note for Local Development

**The frontend is currently configured to use the ngrok URL (`https://57315631503a.ngrok-free.app/`) for API requests.**

If you're running this project **locally**, you need to update all API endpoint URLs in the frontend code from:
```
https://57315631503a.ngrok-free.app/
```
to:
```
http://localhost:8000
```

Files that need to be updated:
- `frontend/components/PrescriptionModal.tsx`
- `frontend/components/LocalVideoPlayer.tsx`
- `frontend/app/patient/page.tsx`
- `frontend/app/patient/prescriptions/page.tsx`
- `frontend/app/patient/diagnostics/page.tsx`
- `frontend/app/doctor/page.tsx`
- `frontend/app/doctor/patients/page.tsx`

You can use a find-and-replace to change all instances of `https://57315631503a.ngrok-free.app` to `http://localhost:8000`.

## API Endpoints

### Backend API (http://localhost:8000)

#### Video Management
- `POST /api/videos/upload` - Upload doctor instruction videos
- `GET /api/videos/list` - Get all videos
- `POST /api/videos/{id}/watched` - Mark video as watched
- `GET /api/videos/stream/{filename}` - Stream video files

#### Prescription & Pharmacogenomics
- `POST /api/prescription/analyze-prescription` - AI analysis of drug-gene interactions
- `POST /api/prescription/finalize` - Create and send prescription to patient
- `GET /api/prescription/list` - Get all prescriptions
- `PUT /api/prescription/{id}/read` - Mark prescription as read

#### AI Services
- `POST /api/chat/` - AI chat assistant for video questions
- `POST /api/transcribe/` - Speech-to-text transcription (Groq Whisper)

#### Health Check
- `GET /` - API health check

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

### For Doctors (`/doctor`)

#### Recording Video Instructions
1. Navigate to **Doctor Portal** → **Patient Management**
2. Click **"Record New Instruction"**
3. Grant camera/microphone permissions
4. Record your medical instruction video
5. Review auto-generated subtitles (editable)
6. Add title and description
7. Send to patient

#### Prescribing Medications with Genetic Analysis
1. Click **"Prescribe Medicine"**
2. Choose input method:
   - **Manual**: Enter genetic variants (rsID or Gene + Star Allele)
   - **File Upload**: Upload CSV/PDF with genetic data
3. Enter medication names
4. Add patient context (optional but recommended)
5. Click **"Analyze & Prescribe"**
6. Review AI analysis showing:
   - Risk level (Low/Moderate/High)
   - Evidence of drug-gene interactions
   - Alternative medications if needed
7. Add safe medications to prescription
8. Click **"Finalize & Send to Patient"**

### For Patients (`/patient`)

#### Watching Medical Videos
1. Navigate to **Patient Portal** → **Medical Video Library**
2. Click on any video to watch
3. Use built-in controls (play, pause, seek)
4. View synchronized subtitles
5. Pause anytime to ask the AI assistant questions
6. AI provides context-aware answers based on video content

#### Managing Prescriptions
1. Go to **Patient Portal** → **My Prescriptions**
2. View all prescribed medications
3. Mark prescriptions as read
4. Download prescription files

## Features in Detail

### Pharmacogenomics Analysis
The system integrates with **EpiRisk MSCS Pharmacogenomics API** to analyze genetic variants against medications:

**Supported Genetic Formats:**
- rsID + Genotype (e.g., `rs3892097: AA`)
- Gene + Star Allele (e.g., `CYP2D6: *4/*4`)

**Analysis Output:**
- Risk classification (Low/Moderate/High)
- Clinical evidence for drug-gene interactions
- Actionable recommendations
- Alternative medication suggestions with:
  - Benefits of each alternative
  - Important considerations
  - Safety profiles based on genetic data

**Patient Context Integration:**
- Age, sex, ancestry
- Current medications
- Comorbidities
- Known allergies

### 24/7 Distance Care

**Video Instruction System:**
- Real camera recording with live preview
- Automatic speech-to-text transcription via Groq Whisper
- Editable timestamps and text (YouTube-style interface)
- SRT subtitle export support
- Secure video streaming from backend

**AI Medical Assistant:**
- Context-aware Q&A based on video transcript
- Powered by Groq's Llama 3.3 70B model
- Understands medical terminology
- Patient-friendly explanations
- Time-aware responses (only answers about content already watched)

**Access & Privacy:**
- 24/7 access to all medical instructions
- Watch tracking for doctor visibility
- All data stored securely on-premise
- No third-party data sharing

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

### Pharmacogenomics API Issues
- The system uses EpiRisk MSCS API (https://healthhack-mscs-epirisk.onrender.com)
- If the external API is unavailable, the system will show error messages
- Ensure stable internet connection for genetic analysis features

## Clinical Use Case

This platform addresses two critical healthcare challenges:

1. **Adverse Drug Reactions (ADRs)**: By analyzing pharmacogenomics data, doctors can identify patients at high risk for ADRs before prescribing, preventing potentially dangerous drug-gene interactions.

2. **Healthcare Accessibility**: The 24/7 distance care system enables patients to access medical instructions anytime from home, especially beneficial for:
   - Elderly patients who may forget verbal instructions
   - Patients in rural or remote areas
   - Follow-up care and medication adherence
   - Reducing unnecessary clinic visits

## Security & Privacy

- All patient data is stored locally in the backend
- Video files are securely streamed (not exposed via public URLs)
- Genetic data is processed but not permanently stored
- AI chat conversations are session-based
- HIPAA-compliant architecture (when deployed with proper infrastructure)

## Future Enhancements

- Multi-patient support with authentication
- Integration with Electronic Health Records (EHR)
- Automated medication adherence tracking
- Pharmacist review workflow
- Mobile app for iOS/Android
- Real-time video consultations
- Multi-language support

## License

MIT
