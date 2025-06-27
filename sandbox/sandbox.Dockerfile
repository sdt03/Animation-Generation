FROM python:3.11

# Install basic build tools first
RUN apt-get update && apt-get install -y --fix-missing \
    build-essential \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libgdk-pixbuf2.0-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Try to install ffmpeg separately (optional for basic functionality)
RUN apt-get update && apt-get install -y --fix-missing \
    ffmpeg \
    || echo "FFmpeg installation failed, continuing without it" \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["python", "app/main.py"]