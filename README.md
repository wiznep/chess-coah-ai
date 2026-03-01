# ♟ AI Chess Coach — Phase 1

A web application where users upload a PGN (chess game), have it analysed by
Stockfish, and receive colour-coded move classifications plus AI-generated
coaching explanations for mistakes and blunders.

---

## Tech Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Backend  | Python 3.12, FastAPI, python-chess, Stockfish, OpenAI |
| Frontend | React 19 (Vite), TailwindCSS 4, chess.js, react-chessboard |

---

## Project Structure

```
chess-coach-project/
├── backend/
│   ├── config.py          # pydantic-settings configuration
│   ├── engine.py          # Stockfish async wrapper
│   ├── analyzer.py        # PGN parsing + move classification
│   ├── coach.py           # OpenAI coaching explanations
│   ├── main.py            # FastAPI app + /analyze endpoint
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api.js                   # Backend API client
    │   ├── App.jsx                  # Main layout + state
    │   ├── components/
    │   │   ├── PGNUploader.jsx      # PGN text area + submit
    │   │   ├── Board.jsx            # Interactive chessboard
    │   │   ├── FeedbackPanel.jsx    # Eval bar + coach text
    │   │   └── MoveList.jsx         # Scrollable move list
    │   ├── index.css
    │   └── main.jsx
    ├── vite.config.js
    └── package.json
```

---

## Quick Start

### Prerequisites

- **Python 3.10+** (3.12 recommended)
- **Node.js 18+**
- **Stockfish** installed on your system (`sudo apt install stockfish` on Ubuntu/Debian)

### 1. Backend

```bash
cd backend

# Create virtual environment and install deps
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# (Optional) Create .env with your OpenAI key for real coaching text
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...

# Start the server
uvicorn main:app --reload --port 8000
```

> **No OpenAI key?** No problem — the app falls back to deterministic mock
> explanations so you can develop without an API key.

### 2. Frontend

```bash
cd frontend

npm install
npm run dev
```

The Vite dev server starts at **http://localhost:5173** and proxies `/analyze`
requests to the backend at `localhost:8000`.

---

## Usage

1. Open **http://localhost:5173** in your browser.
2. Paste a PGN into the text area (or click **Load Sample** for a demo game).
3. Click **Analyze Game** and wait for the engine to finish.
4. Step through moves with the **◀ Prev / Next ▶** buttons or arrow keys.
5. The right panel shows the evaluation bar, classification badge, and AI
   coaching text for mistakes/blunders.

---

## Stockfish Installation

| OS      | Install Command |
|---------|-----------------|
| Ubuntu/Debian | `sudo apt install stockfish` |
| macOS   | `brew install stockfish` |
| Windows | Download from https://stockfishchess.org/download/ |

The app defaults to `/usr/games/stockfish`. If your binary is elsewhere,
set `STOCKFISH_PATH` in your `backend/.env`.

---

## Environment Variables

| Variable           | Default                                   | Description                        |
|--------------------|-------------------------------------------|------------------------------------|
| `STOCKFISH_PATH`   | `/usr/games/stockfish`                    | Path to the Stockfish binary       |
| `ENGINE_DEPTH`     | `15`                                      | Max search depth per move          |
| `ENGINE_TIME_LIMIT`| `0.1`                                     | Max seconds per move               |
| `OPENAI_API_KEY`   | *(empty — mock mode)*                     | OpenAI API key for coaching text   |
| `CORS_ORIGINS`     | `["http://localhost:5173"]`               | Allowed CORS origins               |

---

## License

MIT
