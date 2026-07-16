import sys
from pathlib import Path

# Add parent directory to path to allow backend package imports
sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.rag import search_laws, generate_analysis

def run_tests():
    print("==================================================")
    print("           CRIMEGPT BACKEND TEST SUITE           ")
    print("==================================================")
    
    # 1. Test Law Retrieval Engine (Offline mode / Keyword search)
    print("\n[TEST 1] Testing Local Legal Index (Keyword search)...")
    cyber_query = "stole hard drives containing sensitive database user logs from a cyber cafe"
    results = search_laws(cyber_query, api_key="", top_k=3)
    
    print(f"Query: '{cyber_query}'")
    print(f"Found {len(results)} matches:")
    for idx, res in enumerate(results):
        print(f"  {idx+1}. {res['act']} {res['section']} ({res['title']})")
        
    # Ensure theft or house-breaking sections are matching
    matched_ids = [r["id"] for r in results]
    assert any(x in ["bns_303", "bns_305", "bns_329", "bsa_61"] for x in matched_ids), "Local search matching failure"
    print("OK [TEST 1] PASSED: Law retrieval matching correct.")

    # 2. Test Offline Generation Fallback
    print("\n[TEST 2] Testing Offline Fallback Report Generation...")
    analysis_res = generate_analysis(
        case_title="Cyber Cafe Break-In",
        description="A group of masked men shattered the front glass and stole hard drives containing user databases.",
        location="Sector 62, Noida",
        date="2026-07-16 02:00 AM",
        evidence="Shattered glass, CCTV footage of intruders",
        witness="Security guard Ram Singh",
        api_key=""
    )
    
    analysis_text = analysis_res["analysis"]
    citations = analysis_res["citations"]
    
    print(f"Matched Citations: {citations}")
    assert "BNS Section 303" in analysis_text or "BNS Section 305" in analysis_text, "Missing legal references in draft"
    assert "BNSS Section 105" in analysis_text, "Missing BNSS video seizure guide"
    assert "BSA Section 63" in analysis_text, "Missing BSA digital certificate advice"
    print("OK [TEST 2] PASSED: Offline report generation compiles properly.")

    print("\n==================================================")
    print("  ALL BACKEND UNIT TESTS COMPLETED SUCCESSFULLY!  ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
