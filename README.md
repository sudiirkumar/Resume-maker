# Resume PDF Generator

This project is a simple web application designed to generate pixel-perfect resumes exactly matching your Word document template format. 

## Features
- Vanilla HTML/CSS/JS frontend form
- FastAPI (Python) backend to process data
- `docxtpl` uses your `.docx` file directly as a Jinja2 template (preserves fonts, lines, margins!).
- `LibreOffice` headless conversion to generate the final PDF without requiring MS Word. This allows safe deployment to an AWS VM (Linux).

## Installation & Running

1. Activate your virtual environment: 
   ```bash
   source venv/bin/activate
   ```
2. Start the FastAPI server:
   ```bash
   python run.py
   ```
3. Open your browser and go to: `http://localhost:8000/frontend/index.html`

## IMPORTANT: Setting up your Template

To get your pixel-perfect PDF, you need to configure your Word Document (`205124096_SudhirKumar.docx`):
1. **Rename** your `.docx` file to `template.docx`.
2. **Move** it into the `backend/templates/` folder.
3. Open `template.docx` in Microsoft Word or LibreOffice and replace your actual data with these exact Jinja2 tags so the backend can fill them in dynamically:

### Basic Info Variables:
- Name: `{{ name }}`
- Degree Title: `{{ degree_title }}`
- Gender: `{{ gender }}`
- Date of Birth: `{{ dob }}`
- Email: `{{ email }}`
- Contact: `{{ phone }}`
- Areas of Interest: `{% for interest in interests %}{{ interest }}{% if not loop.last %}, {% endif %}{% endfor %}`
- Programming Languages: `{{ skills_programming }}`
- Engineering Software: `{{ skills_engineering }}`
- Other Software: `{{ skills_other }}`

### Profile Photo Placeholder
Wherever you want the passport photo to appear, just write:
`{{ profile_pic }}`

### Educational Qualification Table
In your table, keep the header. In the first *content* row, put this:
| `{% tr for edu in educations %}{{ edu.year }}` | `{{ edu.degree }}` | `{{ edu.institution }}` | `{{ edu.score }}{% tr endfor %}` |

### Academic Achievements List
`{% for ach in achievements %}`
• `{{ ach }}`
`{% endfor %}`

### Other Projects
`{% for proj in projects %}`
**{{ proj.title }}**                   *{{ proj.date }}*
{{ proj.desc }}
`{% endfor %}`

### Positions of Responsibility
`{% for por in pors %}`
**{{ por.role }}**                   *{{ por.date }}*
{{ por.desc }}
`{% endfor %}`

### Extracurricular Activities
`{% for ext in extras %}`
• `{{ ext }}`
`{% endfor %}`

Save the `.docx` and run the app. It will seamlessly insert the exact tags into your template and output an exact identical PDF.