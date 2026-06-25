import requests

# The URL of your local FastAPI server
API_URL = "http://127.0.0.1:8000/api/generate-pdf"

# A minimal version of your resume HTML to verify fonts and layout
SAMPLE_HTML = """
<!DOCTYPE html>
<html>
<head>
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" rel="stylesheet">
    <style>
        /* Simulate the print environment */
        @page { margin: 0; size: A4; }
        body { margin: 0; padding: 0; background: white; }
        
        .a4-page {
            width: 210mm;
            height: 297mm;
            padding: 15mm;
            font-family: 'Lato', sans-serif;
            box-sizing: border-box;
            color: #000;
        }
        .header-name {
            font-size: 20pt;
            font-weight: 700;
            text-transform: uppercase;
            margin: 0 0 6px 0;
        }
        .section-title {
            font-size: 15.6pt;
            font-weight: 700;
            margin: 18px 0 10px 0;
            display: flex;
            align-items: center;
        }
        .section-title::after {
            content: "";
            flex-grow: 1;
            margin-left: 12px;
            height: 1.5px;
            background-color: #B22222;
        }
    </style>
</head>
<body>
    <div class="a4-page">
        <h1 class="header-name">System Test User</h1>
        <p>Master of Computer Applications | Backend Integration Test</p>
        
        <div class="section-title">Backend Status</div>
        <p>If you are reading this inside a PDF file, your Phase 1 Backend is working perfectly!</p>
        <ul>
            <li>FastAPI endpoint received the payload.</li>
            <li>Playwright successfully launched headless Chromium.</li>
            <li>External Google Fonts (Lato) loaded correctly.</li>
            <li>The A4 CSS layout was respected.</li>
        </ul>
    </div>
</body>
</html>
"""

def run_test():
    print("⏳ Sending HTML payload to FastAPI...")
    
    try:
        response = requests.post(API_URL, json={"html": SAMPLE_HTML})
        
        if response.status_code == 200:
            with open("test_output.pdf", "wb") as f:
                f.write(response.content)
            print("✅ Success! PDF generated and saved as 'test_output.pdf'")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Is your FastAPI server running?")
        print("Run 'uvicorn backend.main:app --reload' in another terminal.")

if __name__ == "__main__":
    run_test()