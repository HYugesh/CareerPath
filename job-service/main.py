"""
Job Scraping Microservice
Runs on port 8001, called by the Node.js backend.
Install: pip install fastapi uvicorn jobspy python-dotenv
Run:     uvicorn main:app --port 8001 --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import csv, io, json
from jobspy import scrape_jobs

app = FastAPI(title="Job Scraping Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class JobSearchRequest(BaseModel):
    search_term: str
    location: str = "India"
    results_wanted: int = 20
    hours_old: int = 72
    sites: List[str] = ["indeed", "linkedin", "zip_recruiter"]


class JobResult(BaseModel):
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    date_posted: Optional[str] = None
    job_url: Optional[str] = None
    description: Optional[str] = None
    site: Optional[str] = None
    salary_source: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    currency: Optional[str] = None
    job_type: Optional[str] = None
    is_remote: Optional[bool] = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/scrape", response_model=List[dict])
def scrape(req: JobSearchRequest):
    try:
        google_term = f"{req.search_term} jobs near {req.location} since yesterday"

        jobs = scrape_jobs(
            site_name=req.sites,
            search_term=req.search_term,
            google_search_term=google_term,
            location=req.location,
            results_wanted=req.results_wanted,
            hours_old=req.hours_old,
            country_indeed="INDIA",
            linkedin_fetch_description=False,  # faster without full desc
        )

        if jobs is None or len(jobs) == 0:
            return []

        # Convert DataFrame to list of dicts, handle NaN
        records = jobs.where(jobs.notna(), None).to_dict(orient="records")

        # Normalize fields
        cleaned = []
        for r in records:
            cleaned.append({
                "title":       str(r.get("title") or ""),
                "company":     str(r.get("company") or ""),
                "location":    str(r.get("location") or ""),
                "date_posted": str(r.get("date_posted") or ""),
                "job_url":     str(r.get("job_url") or ""),
                "description": str(r.get("description") or "")[:500],
                "site":        str(r.get("site") or ""),
                "job_type":    str(r.get("job_type") or ""),
                "is_remote":   bool(r.get("is_remote") or False),
                "min_amount":  r.get("min_amount"),
                "max_amount":  r.get("max_amount"),
                "currency":    str(r.get("currency") or ""),
            })

        return cleaned

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
