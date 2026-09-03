# Resume PDF Generator

This is a resume builder with a live HTML preview, JSON import/export, optional MongoDB cloud save, and AI-assisted rewriting/review for selected text fields.

## What It Does

- Live resume editor in vanilla HTML, CSS, and JavaScript
- Real-time A4 preview with section pagination
- JSON download/upload for offline backups and transfer between devices
- Optional cloud save/load with FastAPI, MongoDB, and JWT login
- AI rewrite and ATS review for paragraph-style fields when Groq is configured
- PDF export through the backend PDF conversion service

## Run Locally

1. Create and activate a Python environment.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the backend:
   ```bash
   python run.py
   ```
4. Open:
   ```text
   http://localhost:8000/frontend/index.html
   ```

## Environment Variables

Create a root `.env` file with the values you want to use:

- `MONGODB_URI` for cloud save and login
- `JWT_SECRET_KEY` for session signing
- `PDF_ENDPOINT_KEY` for PDF export
- `GROQ_API_KEY` for AI rewrite/review
- `GROQ_MODEL` for the Groq model name
- `GROQ_API_URL` if you need a custom Groq endpoint
- `GROQ_REWRITE_MAX_TOKENS` for the rewrite output limit (default `2048`)
- `GROQ_REVIEW_MAX_TOKENS` for the full-resume review output limit (default `3072`)
- `AI_SUMMARY_DEFAULT_WORDS` for the default summary length

If MongoDB is unavailable, the app still runs with local editing and JSON export/import. If Groq is not configured, the AI controls stay hidden.

## Resume Sections

The editor supports these built-in fields:

- Personal information
- Educational qualification
- Academic achievements
- Other projects
- Areas of interest
- Technical skills and certifications
- Positions of responsibility
- Extracurricular activities
- Custom sections with type 1, type 2, or type 3 layouts

The achievements and interests sections are bullet-style lists, so each visible row is saved and restored as a separate item.

## Help Text

The on-page Help modal covers quick start, JSON workflows, cloud sync, and AI tools. It opens automatically the first time a browser sees the app, and can be reopened with the Help button.

## Formatting Shortcuts

Use these shortcuts in text fields and descriptions:

- `Ctrl/Cmd+B` bold
- `Ctrl/Cmd+I` italic
- `Ctrl/Cmd+U` underline
- `Ctrl/Cmd+Shift+8` unordered list
- `Ctrl/Cmd+Shift+7` ordered list
- `Ctrl/Cmd+K` hyperlink for selected text

For hyperlinks, enter an `http://`, `https://`, or `mailto:` URL. Autosave is off by default and can be enabled from the toolbar.

## Notes For Development

- `backend/main.py` hosts the API routes and static frontend.
- `frontend/js/data.js` extracts and restores resume state.
- `frontend/js/preview.js` builds the live preview from the form.
- `frontend/js/auth.js` handles login, logout, and cloud save/load.