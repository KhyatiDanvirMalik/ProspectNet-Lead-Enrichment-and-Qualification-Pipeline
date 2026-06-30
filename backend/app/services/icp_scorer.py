import json
import re
from typing import Dict, Any
from app.services.groq_client import call_groq
from app.core.config import settings
from app.models.icp import ICPConfigBase

def score_lead_semantically(icp_config: ICPConfigBase, lead_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Uses the Groq API to semantically score a lead against the ICP 
    and detect buying signals, avoiding rigid keyword matching.
    """
    
    prompt = f"""
    You are an expert sales analyst. Evaluate the following Lead against the Ideal Customer Profile (ICP).
    Use semantic reasoning (e.g., inferring that "Head of Platform" is equivalent to "VP of Engineering").
    
    Ideal Customer Profile:
    - Target Company Size: {icp_config.target_company_size_range}
    - Target Industries: {', '.join(icp_config.target_industries)}
    - Required Tech Stack: {', '.join(icp_config.required_tech_stack)}
    - Minimum Seniority: {icp_config.minimum_seniority_level}
    - Disqualifying Signals: {', '.join(icp_config.disqualifying_signals)}
    
    Lead Data:
    {json.dumps(lead_data, indent=2)}
    
    Task:
    1. Score the lead's ICP fit out of 100 based on semantic matching.
    2. Identify specific "Buying Signals" (e.g., recent funding, expansion hiring, tech fit, growth news).
    
    Output strictly in the following JSON format without markdown blocks:
    {{
      "icp_fit_score": 85,
      "score_breakdown": {{"size_fit": "...", "seniority_fit": "..."}},
      "buying_signals": [{{"signal": "Raised Series B", "source": "News"}}, {{"signal": "Uses React", "source": "Website"}}],
      "reasoning": "Brief explanation of the semantic matching."
    }}
    """
    
    try:
        response = call_groq(prompt, max_tokens=512)

        # Extract JSON from the generated text
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group(0))
        else:
            raise ValueError("LLM did not return a valid JSON structure.")
            
    except Exception as e:
        # Graceful fallback if the local LLM fails or OOMs
        print(f"LLM Semantic Scoring Failed: {e}")
        result = {
            "icp_fit_score": 0,
            "score_breakdown": {"error": "Inference failed or timed out"},
            "buying_signals": [],
            "reasoning": f"Fallback applied due to error: {str(e)}"
        }

    # Apply the configurable weighting formula
    icp_weight = icp_config.scoring_formula_weights.get("icp_fit", 0.5)
    signal_weight = icp_config.scoring_formula_weights.get("buying_signals", 0.5)
    
    raw_icp_score = result.get("icp_fit_score", 0)
    
    # Calculate signal strength (max 100) - e.g., 20 points per valid signal
    signal_strength = min(len(result.get("buying_signals", [])) * 20, 100)
    
    combined_score = int((raw_icp_score * icp_weight) + (signal_strength * signal_weight))

    return {
        "icp_score": combined_score,
        "score_breakdown": result.get("score_breakdown", {}),
        "detected_buying_signals": result.get("buying_signals", []),
        "reasoning": result.get("reasoning", "")
    }