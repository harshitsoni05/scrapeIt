# Use a base Python image
FROM python:latest

# Set working directory
WORKDIR /consumer

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy consumer code
COPY . .

# Command to run the consumer
CMD python consumer.py  # Adjust to your consumer's entry point

