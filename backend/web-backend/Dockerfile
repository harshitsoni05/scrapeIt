# Use a base Python image
FROM python:latest

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the port Flask is running on
EXPOSE 5000

# Command to run the app
CMD python main.py  # Adjust to your Flask app's entry point
