import json
import re
from transformers import pipeline
from app.core.config import settings
from app.models.lead import Lead
from app.models.icp import ICPConfigBase

# Lazy-load the model to share resources and stay within Railway's free tier CPU/RAM limits.
_llm_pipeline = None

def get_llm():
    global _llm_pipeline
    if _llm_pipeline is None:
        _llm_pipeline = pipeline(
            "text-generation", 
            model=settings.LLM_MODEL_NAME, 
            device=-1, # Force CPU execution
            max_new_tokens=600
        )
    return _llm_pipeline

def generate_outreach_drafts(lead: Lead, icp_config: ICPConfigBase) -> dict:
    """
    Generates personalized outreach email drafts using a local CPU-bound LLM.
    As per assignment constraints (Section 5), it generates 2 variants (Direct and Consultative)
    instead of 3 due to the inclusion of the Chrome extension.
    """
    llm = get_llm()
    
    # Extract specific facts to avoid generic filler
    signals = [s.get("signal") for s in lead.buying_signals] if lead.buying_signals else []
    tech = lead.tech_stack[:3] if lead.tech_stack else []
    
    prompt = f"""
    You are an expert SDR writing highly personalized cold outreach emails.
    Do NOT use generic filler. You must reference the specific facts provided below.
    
    Our Product Context:
    Description: {icp_config.product_description}
    Value Proposition: {icp_config.value_proposition}
    
    Lead Context:
    Name: {lead.name or 'there'}
    Company: {lead.company_name}
    Role: {lead.role or lead.seniority or 'Leader'}
    Recent News/Signals: {', '.join(signals) if signals else lead.recent_news or 'Growing company'}
    Tech Stack: {', '.join(tech) if tech else 'Modern tech stack'}
    
    Task: Write 2 distinct email variants (Subject + Body + Call to Action).
    1. "direct": Concise, straight to the point, highly focused on the value prop and a specific signal.
    2. "consultative": Slightly longer, positions you as an advisor, referencing their tech stack or industry challenge.
    
    Output strictly in the following JSON format without markdown blocks:
    {{
      "direct": "Subject: ...\\n\\nHi [Name],\\n\\n[Body referencing specific signals]\\n\\n[CTA]",
      "consultative": "Subject: ...\\n\\nHi [Name],\\n\\n[Body referencing tech stack/challenges]\\n\\n[CTA]"
    }}
    """
    
    try:
        response = llm(prompt)[0]['generated_text']
        
        # Extract JSON from the generated text
        json_match = re.search(r'\{.*\}', response.replace(prompt, ''), re.DOTALL)
        if json_match:
            drafts = json.loads(json_match.group(0))
        else:
            raise ValueError("LLM did not return a valid JSON structure.")
            
    except Exception as e:
        print(f"LLM Outreach Generation Failed for Lead {lead.id}: {e}")
        # Graceful fallback to ensure the pipeline doesn't break
        fallback_signal = signals[0] if signals else "your recent growth"
        drafts = {
            "direct": f"Subject: Quick question regarding {lead.company_name}\n\nHi {lead.name or 'there'},\n\nI noticed {fallback_signal} and thought our platform could help accelerate your goals. {icp_config.value_proposition}\n\nWorth a brief chat next week?",
            "consultative": f"Subject: Thoughts on {lead.company_name}'s tech stack\n\nHi {lead.name or 'there'},\n\nGiven your role, I imagine scaling your operations is top of mind, especially considering {fallback_signal}. Our tool helps teams like yours by {icp_config.value_proposition.lower()}.\n\nAre you open to seeing how this fits into your current workflow?"
        }
        
    return drafts