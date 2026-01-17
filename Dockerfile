# Use stable Python version (ML compatible)
FROM python:3.10-slim

# Prevent Python buffering issues
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Copy requirements first (better caching)
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Expose port used by Render
EXPOSE 10000

# Start app with gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:10000"]
