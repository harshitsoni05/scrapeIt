# Stage 1: Build stage
FROM python:3.11-slim AS builder

# Set working directory
WORKDIR /consumer

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --target=/dependencies -r requirements.txt

# Copy the consumer code
COPY . .

# Stage 2: Production stage
FROM python:3.11-slim

# Set working directory
WORKDIR /consumer

# Copy dependencies from the builder stage
COPY --from=builder /dependencies /usr/local/lib/python3.11/site-packages

# Copy only the consumer code to the production image
COPY . .

# Command to run the consumer
CMD python consumer.py  # Adjust to your consumer's entry point
