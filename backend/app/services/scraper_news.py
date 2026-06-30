import urllib.parse
import requests
from bs4 import BeautifulSoup
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def scrape_google_news(company_name: str) -> Dict[str, Any]:
    """
    Scrapes Google News RSS feed for recent mentions of the company.
    Provides data to detect buying signals like growth, product launches, or funding.
    Uses free RSS endpoint, requiring no paid APIs.
    """
    data = {
        "recent_news": None,
        "confidence_scores": {
            "recent_news": "low"
        }
    }
    
    if not company_name:
        return data

    try:
        # URL encode the exact match company name query
        query = urllib.parse.quote(f'"{company_name}"')
        url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            logger.warning(f"Failed to fetch news for {company_name} (Status: {response.status_code})")
            return data

        # Google News RSS is XML based
        soup = BeautifulSoup(response.content, features="xml")
        items = soup.findAll('item')
        
        news_snippets = []
        # Grab top 3 recent news articles to keep token count manageable for LLM inference
        for item in items[:3]:
            title = item.title.text if item.title else ""
            pub_date = item.pubDate.text if item.pubDate else ""
            
            # Basic keyword filtering to boost relevance (optional, but helps LLM)
            signal_keywords = ["raises", "funding", "series", "acquires", "launches", "growth", "hires", "new", "announces"]
            is_signal = any(keyword in title.lower() for keyword in signal_keywords)
            
            if title:
                marker = "[SIGNAL]" if is_signal else "[NEWS]"
                news_snippets.append(f"{marker} {title} ({pub_date})")
                
        if news_snippets:
            data["recent_news"] = "\n".join(news_snippets)
            data["confidence_scores"]["recent_news"] = "high" 

    except Exception as e:
        logger.error(f"Error scraping news for {company_name}: {e}")

    return data