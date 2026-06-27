# Use an official Python runtime
FROM python:3.14-slim

# Install WeasyPrint system dependencies AND Font tools
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    libffi-dev \
    fontconfig \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# (Notice we completely deleted the 'playwright install' lines!)

# Copy application code
COPY . .

# Start the application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "10000"]