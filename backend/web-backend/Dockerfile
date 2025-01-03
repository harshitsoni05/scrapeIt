# Stage 1: Build stage
FROM python:3.11-slim AS builder

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --target=/dependencies -r requirements.txt

# Copy application code
COPY . .

# Stage 2: Production stage
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy dependencies from the builder stage
COPY --from=builder /dependencies /usr/local/lib/python3.11/site-packages

# Copy only application code to the production image
COPY . .

# Expose the port Flask is running on
EXPOSE 5000

# Command to run the app
CMD python main.py  # Adjust to your Flask app's entry point
