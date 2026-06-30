import requests
from bs4 import BeautifulSoup
import re
import logging
from typing import Dict, Any
from urllib.parse import urljoin

logger = logging.getLogger(__name__)

def get_headers() -> Dict[str, str]:
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
    }

def scrape_company_website(domain: str) -> Dict[str, Any]:
    """
    Scrapes the company's website to infer tech stack from source code/meta tags
    and attempts to find company size from 'About' or 'Team' pages.
    """
    data = {
        "tech_stack": [],
        "company_size": None,
        "industry": None,
        "confidence_scores": {
            "tech_stack": "low",
            "company_size": "low",
            "industry": "low"
        }
    }
    
    if not domain:
        return data

    if not domain.startswith("http"):
        domain = f"https://{domain}"

    try:
        response = requests.get(domain, headers=get_headers(), timeout=10)
        
        if response.status_code != 200:
            logger.warning(f"Website scrape failed for {domain} (Status: {response.status_code})")
            return data

        soup = BeautifulSoup(response.text, "lxml")
        html_content = response.text.lower()
        
        # 1. Infer Tech Stack from source code and meta tags
        tech_keywords = {
            "react": "React", "vue": "Vue.js", "angular": "Angular",
            "next.js": "Next.js", "nuxt": "Nuxt", "django": "Django",
            "laravel": "Laravel", "wordpress": "WordPress", "shopify": "Shopify",
            "aws": "AWS", "google-analytics": "Google Analytics", "stripe": "Stripe",
            "hubspot": "HubSpot", "salesforce": "Salesforce", "intercom": "Intercom",
            "segment": "Segment", "mixpanel": "Mixpanel"
        }
        
        detected_tech = set()
        for key, display_name in tech_keywords.items():
            if key in html_content:
                detected_tech.add(display_name)
                
        if detected_tech:
            data["tech_stack"] = list(detected_tech)
            data["confidence_scores"]["tech_stack"] = "high"

        # 2. Attempt to find industry hints from meta description
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            # Will be parsed semantically by the LLM later, but we capture the raw text here
            data["industry"] = meta_desc["content"][:200]
            data["confidence_scores"]["industry"] = "low" # Low because it's just raw text, not a categorized industry

        # 3. Scrape 'About' or 'Team' subpage for company size
        about_links = soup.find_all("a", href=re.compile(r"about|team|company", re.I))
        if about_links:
            # Take the first matched link
            about_path = about_links[0].get("href")
            about_url = urljoin(domain, about_path)
            
            try:
                about_resp = requests.get(about_url, headers=get_headers(), timeout=10)
                if about_resp.status_code == 200:
                    about_soup = BeautifulSoup(about_resp.text, "lxml")
                    about_text = about_soup.get_text(separator=' ', strip=True)
                    
                    # Regex to find patterns like "team of 50", "10-50 employees", "over 100 people"
                    size_match = re.search(r"(?:team of|over|more than) (\d+\+?|\d+ to \d+)|(\d+\+?|\d+\s?-\s?\d+) employees", about_text, re.I)
                    if size_match:
                        matched_size = size_match.group(1) or size_match.group(2)
                        data["company_size"] = f"{matched_size} employees"
                        data["confidence_scores"]["company_size"] = "medium"
            except Exception as sub_e:
                logger.warning(f"Failed to scrape subpage {about_url}: {sub_e}")
                # Graceful degradation: continue without subpage data

    except Exception as e:
        logger.error(f"Error scraping website {domain}: {e}")

    return data