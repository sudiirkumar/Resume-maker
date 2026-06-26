from playwright.async_api import async_playwright
import tempfile

async def generate_pdf_from_html(html_content: str) -> str:
    """
    Takes a full HTML string, renders it in a headless browser,
    and returns the file path to the generated PDF.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Load the HTML and wait for network/fonts to settle
        await page.set_content(html_content, wait_until="networkidle")
        
        # Create a secure temporary file to store the PDF
        temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        temp_pdf.close()
        
        # Generate the PDF
        # We set margins to 0 because your CSS (.a4-page) already handles padding
        await page.pdf(
            path=temp_pdf.name,
            format="A4",
            print_background=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"}
        )
        
        await browser.close()
        return temp_pdf.name