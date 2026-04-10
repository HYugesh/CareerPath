# Job Scraping Microservice

## Setup (Python 3.12 required)

```bash
cd job-service
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```

## Endpoints
- GET  /health  — health check
- POST /scrape  — scrape jobs
