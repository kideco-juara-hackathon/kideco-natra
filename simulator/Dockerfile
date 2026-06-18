FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy simulator scripts
COPY . .

# Run the telemetry simulator and point it to the backend container
CMD ["python", "telemetry_simulator.py", "--backend", "http://backend:8000"]
