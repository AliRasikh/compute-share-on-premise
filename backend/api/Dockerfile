FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir \
    fastapi>=0.115.0 \
    uvicorn[standard]>=0.32.0 \
    httpx>=0.27.0 \
    python-dotenv>=1.0.0 \
    pydantic>=2.0.0 \
    pydantic-settings>=2.0.0

# Copy application code
COPY . /app/

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
