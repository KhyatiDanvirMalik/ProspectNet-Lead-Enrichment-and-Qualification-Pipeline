import requests
from bs4 import BeautifulSoup
import random
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/122.0.0.0 Safari/537.36"
]

def get_headers() -> Dict[str, str]:
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Referer": "https://www.google.com/"
    }

def scrape_linkedin_company(company_name: str) -> Dict[str, Any]:
    data = {
        "company_size": None,
        "industry": None,
        "recent_news": None,
        "confidence_scores": {
            "company_size": "low",
            "industry": "low",
            "recent_news": "low"
        }
    }
    
    if not company_name:
        return data

    try:
        formatted_name = company_name.lower().replace(' ', '-')
        search_url = f"https://www.linkedin.com/company/{formatted_name}"
        
        response = requests.get(search_url, headers=get_headers(), timeout=10)
        
        if response.status_code != 200:
            logger.warning(f"LinkedIn blocked scrape for {company_name} (Status: {response.status_code}). Degrading gracefully.")
            return data

        soup = BeautifulSoup(response.text, "lxml")
        
        size_elem = soup.find(string=lambda text: text and "employees" in text.lower())
        if size_elem:
            data["company_size"] = size_elem.strip()
            data["confidence_scores"]["company_size"] = "medium"

        industry_elem = soup.find("div", {"data-test-id": "about-us__industry"})
        if industry_elem:
            data["industry"] = industry_elem.text.strip()
            data["confidence_scores"]["industry"] = "medium"

    except Exception as e:
        logger.error(f"Error scraping LinkedIn company {company_name}: {e}")

    return data

def scrape_linkedin_person(name: str) -> Dict[str, Any]:
    data = {
        "role": None,
        "seniority": None,
        "confidence_scores": {
            "role": "low",
            "seniority": "low"
        }
    }
    
    if not name:
        return data

    try:
        formatted_name = name.lower().replace(' ', '-')
        search_url = f"https://www.linkedin.com/in/{formatted_name}"
        
        response = requests.get(search_url, headers=get_headers(), timeout=10)
        
        if response.status_code != 200:
            return data

        soup = BeautifulSoup(response.text, "lxml")
        
        title_elem = soup.find("h2", {"class": "top-card-layout__headline"})
        if title_elem:
            role = title_elem.text.strip()
            data["role"] = role
            data["confidence_scores"]["role"] = "medium"
            
            seniority_keywords = ["Chief", "VP", "Vice President", "Head", "Director", "Manager", "Lead", "Senior"]
            for keyword in seniority_keywords:
                if keyword.lower() in role.lower():
                    data["seniority"] = keyword
                    data["confidence_scores"]["seniority"] = "medium"
                    break

    except Exception as e:
        logger.error(f"Error scraping LinkedIn person {name}: {e}")

    return data