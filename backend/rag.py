import os
import re
import json
from datetime import datetime
import numpy as np
from backend.ai_service import AIService
from typing import List, Dict, Any, Optional

# Precompiled database of Indian laws (BNS, BNSS, BSA) covering common crime categories
LEGAL_DATABASE = [
    # --- BNS (Bharatiya Nyaya Sanhita, 2023) ---
    {
        "id": "bns_303",
        "act": "BNS",
        "section": "Section 303",
        "title": "Theft",
        "description": "Definition and punishment for theft. Whoever, intending to take dishonestly any movable property out of the possession of any person without that person's consent, moves that property in order to such taking, is said to commit theft. Punishment includes imprisonment up to three years, or with fine, or with both.",
        "keywords": ["theft", "stole", "steal", "robbed", "stolen", "burglar", "broken in", "property", "shoplifting", "cafe", "take away"]
    },
    {
        "id": "bns_305",
        "act": "BNS",
        "section": "Section 305",
        "title": "Theft in dwelling house, means of transportation or place of worship",
        "description": "Whoever commits theft in any building, tent, vessel, or transportation vehicle used as a human dwelling, or for the custody of property, shall be punished with imprisonment for a term which may extend to seven years and shall also be liable to fine.",
        "keywords": ["dwelling", "house", "shop", "cafe", "office", "bank", "temple", "vehicle", "car", "train", "bus", "custody", "stolen inside"]
    },
    {
        "id": "bns_308",
        "act": "BNS",
        "section": "Section 308",
        "title": "Extortion",
        "description": "Intentionally putting any person in fear of any injury, and thereby dishonestly inducing that person to deliver to any person any property or valuable security. Punishable with imprisonment up to seven years, or with fine, or both.",
        "keywords": ["extortion", "blackmail", "threaten", "fear of injury", "ransom", "demand money", "force to pay"]
    },
    {
        "id": "bns_316",
        "act": "BNS",
        "section": "Section 316",
        "title": "Criminal Breach of Trust",
        "description": "Dishonestly misappropriating or converting to one's own use property entrusted, or dishonestly using or disposing of that property in violation of any direction of law or legal contract.",
        "keywords": ["breach of trust", "entrusted", "misappropriate", "embezzle", "diverted funds", "partner stole", "employee fraud"]
    },
    {
        "id": "bns_318",
        "act": "BNS",
        "section": "Section 318",
        "title": "Cheating and Dishonestly Inducing Delivery of Property",
        "description": "Deceiving any person, and fraudulently or dishonestly inducing the person so deceived to deliver any property, or consent that any person shall retain any property. Includes online scams, financial fraud, impersonation, and fake websites.",
        "keywords": ["cheat", "fraud", "scam", "phishing", "deceive", "impersonation", "fake profile", "financial scam", "online transaction", "credit card fraud", "bank scam"]
    },
    {
        "id": "bns_329",
        "act": "BNS",
        "section": "Section 329",
        "title": "Criminal Trespass and House-breaking",
        "description": "Entering into or upon property in the possession of another with intent to commit an offence or to intimidate, insult or annoy any person. House-breaking involves entering a building through forced openings (shattered windows, picked locks).",
        "keywords": ["trespass", "house-breaking", "shattered", "forced entry", "broke the lock", "broke open", "intrude", "entered premises"]
    },
    {
        "id": "bns_115",
        "act": "BNS",
        "section": "Section 115",
        "title": "Voluntarily Causing Hurt / Assault",
        "description": "Whoever does any act with the intention of thereby causing hurt to any person, or with the knowledge that he is likely thereby to cause hurt to any person, and does thereby cause hurt to any person, is said voluntarily to cause hurt. Includes physical assault and battery.",
        "keywords": ["assault", "hurt", "hit", "beat", "punched", "kicked", "fight", "injury", "attacked", "slapped", "physical violence"]
    },
    {
        "id": "bns_117",
        "act": "BNS",
        "section": "Section 117",
        "title": "Voluntarily Causing Grievous Hurt",
        "description": "Grievous hurt includes emasculation, permanent privation of the sight of either eye or hearing of either ear, privation of any member or joint, destruction or permanent impairing of the powers of any member or joint, permanent disfiguration of the head or face, fracture or dislocation of a bone or tooth, or any hurt which endangers life.",
        "keywords": ["grievous", "fracture", "broken bone", "dislocation", "hospitalized", "severe injury", "endangered life", "permanent damage", "blinded", "stabbed"]
    },
    {
        "id": "bns_103",
        "act": "BNS",
        "section": "Section 103",
        "title": "Murder",
        "description": "Punishment for murder. Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine. Murder is defined as causing death with intent of causing death or bodily injury likely to cause death.",
        "keywords": ["murder", "kill", "homicide", "death", "stabbed to death", "shot", "poisoned", "strangled", "dead body"]
    },
    {
        "id": "bns_351",
        "act": "BNS",
        "section": "Section 351",
        "title": "Criminal Intimidation",
        "description": "Threatening another with any injury to his person, reputation or property, or to the person or reputation of any one in whom that person is interested, with intent to cause alarm to that person, or to cause him to do any act which he is not legally bound to do.",
        "keywords": ["threat", "threatened", "death threat", "intimidated", "blackmail", "abuse", "scared", "harm my family"]
    },
    {
        "id": "bns_111",
        "act": "BNS",
        "section": "Section 111",
        "title": "Organized Crime",
        "description": "Any continuing unlawful activity including kidnapping, robbery, extortion, land grabbing, contract killing, economic offences, cybercrimes on behalf of a crime syndicate or gang.",
        "keywords": ["organized crime", "syndicate", "gang", "cartel", "mafia", "smuggling", "racketeering", "kidnapping syndicate"]
    },

    # --- BNSS (Bharatiya Nagarik Suraksha Sanhita, 2023) ---
    {
        "id": "bnss_173",
        "act": "BNSS",
        "section": "Section 173",
        "title": "Information in Cognizable Cases (Filing of FIR)",
        "description": "Defines the process for filing a First Information Report (FIR). Mandates that every information relating to the commission of a cognizable offence shall be recorded by the officer-in-charge of a police station. It introduces the registration of electronic FIRs (e-FIR) provided it is signed within 3 days.",
        "keywords": ["fir", "report", "first information report", "e-fir", "cognizable", "complaint", "registration", "police station"]
    },
    {
        "id": "bnss_35",
        "act": "BNSS",
        "section": "Section 35",
        "title": "Arrest of Persons Without Warrant",
        "description": "Specifies when a police officer may arrest any person without an order from a Magistrate and without a warrant. Applicable to cognizable offences, presence of suspects, fear of tampering with evidence, or fleeing suspects.",
        "keywords": ["arrest", "detain", "without warrant", "apprehend", "custody", "suspect fleeing"]
    },
    {
        "id": "bnss_105",
        "act": "BNSS",
        "section": "Section 105",
        "title": "Mandatory Audio-Video Recording of Search and Seizure",
        "description": "New BNSS provision mandating that the process of search and seizure of property/evidence (including cyber evidence, mobile phones, hard drives) must be recorded using audio-video electronic means, and the recording must be forwarded to the Magistrate without delay.",
        "keywords": ["search and seizure", "videography", "video recording", "audio-video", "magistrate", "seized item", "seizure list", "confiscate"]
    },
    {
        "id": "bnss_176",
        "act": "BNSS",
        "section": "Section 176",
        "title": "Investigation by Police into Cognizable Offence",
        "description": "Empowers officers to investigate cognizable offences within their jurisdiction. Detailed guidelines on reporting preliminary inquiries within 14 days for offences carrying 3 to 7 years imprisonment.",
        "keywords": ["investigate", "inquiry", "preliminary inquiry", "jurisdiction", "officer in charge"]
    },
    {
        "id": "bnss_180",
        "act": "BNSS",
        "section": "Section 180",
        "title": "Examination of Witnesses by Police",
        "description": "Provides for the oral examination of any person supposed to be acquainted with the facts and circumstances of the case, and reducing their statement to writing or audio-video electronic recording.",
        "keywords": ["witness statement", "examination", "witnesses", "questioning", "interrogation", "statement recorded"]
    },

    # --- BSA (Bharatiya Sakshya Adhiniyam, 2023) ---
    {
        "id": "bsa_57",
        "act": "BSA",
        "section": "Section 57",
        "title": "Primary Evidence",
        "description": "Primary evidence means the document itself produced for the inspection of the Court. Explains that electronic/digital records printed, stored in optical/magnetic media are primary evidence if certified.",
        "keywords": ["primary evidence", "original document", "original paper", "source file", "device itself"]
    },
    {
        "id": "bsa_61",
        "act": "BSA",
        "section": "Section 61",
        "title": "Admissibility of Electronic or Digital Records",
        "description": "Any information contained in an electronic record which is printed on paper, stored, recorded or copied in optical or magnetic media produced by a computer shall be deemed to be a document and is admissible in evidence without further proof.",
        "keywords": ["electronic record", "digital record", "admissible", "whatsapp chat", "email", "server logs", "cctv footage", "hard drive data"]
    },
    {
        "id": "bsa_63",
        "act": "BSA",
        "section": "Section 63",
        "title": "Certificate for Admissibility of Electronic Evidence",
        "description": "Replaces the old Section 65B of IEA. Specifies the mandatory conditions and format for a certificate signed by a person in charge of the computer device or service to admit electronic/digital logs, recordings, or files in a court of law.",
        "keywords": ["certificate", "65b certificate", "bsa certificate", "electronic proof", "device signature", "hash value", "checksum", "digital signature"]
    }
]

# Simple keyword matching retrieval algorithm (no-API fallback)
def keyword_search(query: str, top_k: int = 4) -> List[Dict[str, Any]]:
    query_words = set(re.findall(r'\w+', query.lower()))
    scored_sections = []
    
    for section in LEGAL_DATABASE:
        score = 0
        # Match keywords list
        for kw in section["keywords"]:
            if kw in query.lower():
                score += 3
        # Match in title
        title_words = re.findall(r'\w+', section["title"].lower())
        for w in title_words:
            if w in query_words:
                score += 1
        # Match in description
        desc_words = re.findall(r'\w+', section["description"].lower())
        for w in desc_words:
            if w in query_words:
                score += 0.5
                
        if score > 0:
            scored_sections.append((score, section))
            
    # Sort by score descending
    scored_sections.sort(key=lambda x: x[0], reverse=True)
    
    # If no keywords matched, return the first top_k
    if not scored_sections:
        return LEGAL_DATABASE[:top_k]
        
    return [item[1] for item in scored_sections[:top_k]]

# Vector-based search engine (uses ChromaDB vector database with NumPy fallback)
def search_laws(query: str, api_key: str = "", top_k: int = 4) -> List[Dict[str, Any]]:
    from backend.vector_db import VectorDBService
    return VectorDBService.search_dockets(query, top_k)

# IPC/CrPC/IEA -> BNS/BNSS/BSA Section mapping lookup dataset
OLD_TO_NEW_MAPPING = [
    {"old_act": "IPC", "old_section": "Section 378", "old_title": "Theft", "new_act": "BNS", "new_section": "Section 303", "new_title": "Theft", "description": "Taking movable property dishonestly out of possession without consent."},
    {"old_act": "IPC", "old_section": "Section 379", "old_title": "Punishment for Theft", "new_act": "BNS", "new_section": "Section 303", "new_title": "Theft", "description": "Punishment for theft (up to three years or fine)."},
    {"old_act": "IPC", "old_section": "Section 380", "old_title": "Theft in Dwelling House", "new_act": "BNS", "new_section": "Section 305", "new_title": "Theft in Dwelling House/Vehicle/Place of Worship", "description": "Theft in human dwelling or property custody place (up to seven years)."},
    {"old_act": "IPC", "old_section": "Section 383", "old_title": "Extortion", "new_act": "BNS", "new_section": "Section 308", "new_title": "Extortion", "description": "Inducing delivery of property by putting in fear of injury."},
    {"old_act": "IPC", "old_section": "Section 405", "old_title": "Criminal Breach of Trust", "new_act": "BNS", "new_section": "Section 316", "new_title": "Criminal Breach of Trust", "description": "Misappropriating or converting property entrusted in violation of law/contract."},
    {"old_act": "IPC", "old_section": "Section 415", "old_title": "Cheating", "new_act": "BNS", "new_section": "Section 318", "new_title": "Cheating", "description": "Deceiving person dishonestly to deliver property or consent."},
    {"old_act": "IPC", "old_section": "Section 420", "old_title": "Cheating and Dishonestly Inducing Delivery", "new_act": "BNS", "new_section": "Section 318", "new_title": "Cheating and Dishonestly Inducing Delivery", "description": "Cheating to induce delivery of property (includes online scams)."},
    {"old_act": "IPC", "old_section": "Section 441", "old_title": "Criminal Trespass", "new_act": "BNS", "new_section": "Section 329", "new_title": "Criminal Trespass and House-breaking", "description": "Forced entry or trespass with intent to commit offense."},
    {"old_act": "IPC", "old_section": "Section 319", "old_title": "Hurt", "new_act": "BNS", "new_section": "Section 115", "new_title": "Voluntarily Causing Hurt / Assault", "description": "Causing bodily pain, disease, or infirmity."},
    {"old_act": "IPC", "old_section": "Section 320", "old_title": "Grievous Hurt", "new_act": "BNS", "new_section": "Section 117", "new_title": "Voluntarily Causing Grievous Hurt", "description": "Severe injuries (emasculation, fracture, permanent disfigurement)."},
    {"old_act": "IPC", "old_section": "Section 300", "old_title": "Murder", "new_act": "BNS", "new_section": "Section 103", "new_title": "Murder", "description": "Causing death with intention of causing death or bodily injury likely to cause death."},
    {"old_act": "IPC", "old_section": "Section 506", "old_title": "Criminal Intimidation", "new_act": "BNS", "new_section": "Section 351", "new_title": "Criminal Intimidation", "description": "Threatening injury to person, reputation, or property to cause alarm."},
    {"old_act": "CrPC", "old_section": "Section 154", "old_title": "Information in Cognizable Cases", "new_act": "BNSS", "new_section": "Section 173", "new_title": "Information in Cognizable Cases (Filing of FIR)", "description": "Process of recording and registering first information reports (including e-FIRs)."},
    {"old_act": "CrPC", "old_section": "Section 41", "old_title": "Arrest without warrant", "new_act": "BNSS", "new_section": "Section 35", "new_title": "Arrest of Persons Without Warrant", "description": "When police may arrest without warrant for cognizable offense."},
    {"old_act": "CrPC", "old_section": "Section 161", "old_title": "Examination of Witnesses", "new_act": "BNSS", "new_section": "Section 180", "new_title": "Examination of Witnesses by Police", "description": "Oral examination and recording of witness statements."},
    {"old_act": "IEA", "old_section": "Section 65B", "old_title": "Admissibility of Electronic Records", "new_act": "BSA", "new_section": "Section 63", "new_title": "Certificate for Admissibility of Electronic Evidence", "description": "Mandatory conditions and signing certificate for electronic logs/evidence."}
]

def analyze_intake(description: str, title: str = "", location: str = "", date: str = "", api_key: str = "") -> Dict[str, Any]:
    """
    Inspects description and details to determine if crucial fields are missing:
    - date/time
    - location
    - parties (victim, accused, or complainant)
    - nature of incident
    Returns missing fields and up to 4 clarifying questions.
    """
    use_api_key = api_key or os.getenv("GEMINI_API_KEY", "")
    
    # Offline rule-based missing field analysis
    missing_fields = []
    questions = []
    
    desc_lower = description.lower()
    
    # 1. Date/Time check
    has_date = bool(date) or any(x in desc_lower for x in ["202", "yesterday", "today", "pm", "am", "clock", "morning", "night", "on ", "date"])
    if not has_date:
        missing_fields.append("date_time")
        questions.append("What was the specific date and approximate time when the incident took place?")
        
    # 2. Location check
    has_location = bool(location) or any(x in desc_lower for x in [" at ", " in ", "street", "house", "shop", "office", "bank", "cafe", "road", "police station", "premises"])
    if not has_location:
        missing_fields.append("location")
        questions.append("Can you clarify the exact location or premises where the incident occurred?")
        
    # 3. Parties check (accused/victim/complainant)
    has_parties = any(x in desc_lower for x in ["complainant", "victim", "accused", "suspect", "he ", "she ", "they ", "name", "i was", "stole from", "robbed me", "by my", "manager", "guard"]) or len(re.findall(r'[A-Z][a-z]+', description)) >= 2
    if not has_parties:
        missing_fields.append("parties")
        questions.append("Who are the parties involved? Please provide the name of the complainant, victim, or description of the suspects.")
        
    # 4. Nature check
    has_nature = any(x in desc_lower for x in ["theft", "stole", "rob", "assault", "beat", "hit", "fraud", "scam", "cheat", "cheat", "trespass", "murder", "kill", "threaten", "conspiracy"])
    if not has_nature:
        missing_fields.append("nature_of_incident")
        questions.append("What is the nature of the incident? Please clarify what offense occurred (e.g. theft, cyber scam, physical injury).")
        
    # Limit to 4 questions
    questions = questions[:4]
    
    # If online, run Gemini for a high-quality extraction pass
    if use_api_key:
        prompt = f"""
        Analyze the following incident description:
        "{description}"
        Additional Metadata: Title: "{title}", Location: "{location}", Date: "{date}"
        
        Determine if the following details are missing from either the description or the metadata:
        1. Date & Time of Occurrence
        2. Location / Precinct
        3. Parties Involved (Victim, Accused, Complainant)
        4. Nature of Incident (e.g. Theft, Assault, Cyber Fraud)

        Return a JSON object containing:
        - "missing_fields": list of strings (from "date_time", "location", "parties", "nature_of_incident")
        - "questions": list of up to 4 clear, specific questions to prompt the officer for the missing details.
        - "is_complete": boolean (true if nothing important is missing)
        
        Answer ONLY with the raw JSON object, no markdown blocks.
        """
        try:
            genai.configure(api_key=use_api_key)
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(prompt)
            clean_text = re.sub(r'```json|```', '', response.text).strip()
            data = json.loads(clean_text)
            # Standardize and return
            return {
                "missing_fields": data.get("missing_fields", []),
                "questions": data.get("questions", [])[:4],
                "is_complete": data.get("is_complete", len(data.get("missing_fields", [])) == 0)
            }
        except Exception as e:
            print(f"Gemini intake analysis failed: {e}. Falling back to rule-based analysis.")

    return {
        "missing_fields": missing_fields,
        "questions": questions,
        "is_complete": len(missing_fields) == 0
    }

def run_cross_reference_validation(description: str, citations: List[Dict[str, Any]]) -> List[str]:
    """
    Flags inconsistencies between the incident description and the selected legal sections.
    """
    warnings = []
    desc_lower = description.lower()
    cited_refs = [c["section_reference"].lower() for c in citations]
    
    # Theft check
    has_theft_word = any(x in desc_lower for x in ["theft", "stole", "steal", "robbed", "stolen", "burglar", "broken in", "shoplifting", "took my"])
    has_theft_cite = any("303" in r or "305" in r for r in cited_refs)
    if has_theft_word and not has_theft_cite:
        warnings.append("Narrative describes property taking/theft, but no Theft sections (BNS Section 303 or 305) are cited.")
        
    # Assault / Hurt check
    has_hurt_word = any(x in desc_lower for x in ["assault", "hurt", "hit", "beat", "punched", "kicked", "fight", "injury", "attacked", "slapped", "violence"])
    has_hurt_cite = any("115" in r or "117" in r for r in cited_refs)
    if has_hurt_word and not has_hurt_cite:
        warnings.append("Narrative describes physical injury or assault, but Voluntarily Causing Hurt/Assault (BNS Section 115/117) is not cited.")
        
    # Cheating / Scam check
    has_scam_word = any(x in desc_lower for x in ["cheat", "fraud", "scam", "phishing", "deceive", "impersonation", "fake", "transaction", "bank scam"])
    has_scam_cite = any("318" in r or "316" in r for r in cited_refs)
    if has_scam_word and not has_scam_cite:
        warnings.append("Narrative describes online fraud or cheating, but Cheating/Scams (BNS Section 318) is not cited.")
        
    # Intimidation check
    has_threat_word = any(x in desc_lower for x in ["threat", "threatened", "blackmail", "harm my", "scared", "intimidate"])
    has_threat_cite = any("351" in r for r in cited_refs)
    if has_threat_word and not has_threat_cite:
        warnings.append("Narrative describes criminal intimidation/threats, but Criminal Intimidation (BNS Section 351) is not cited.")

    # Opposite check: theft cited but no theft words
    if has_theft_cite and not has_theft_word:
        warnings.append("Theft charges (BNS Section 303/305) are selected, but the narrative does not mention stealing or property taking.")
        
    # Opposite check: assault cited but no violence words
    if has_hurt_cite and not has_hurt_word:
        warnings.append("Hurt/Assault charges (BNS Section 115/117) are selected, but the narrative does not indicate physical violence.")

    return warnings

def build_analysis_markdown(summary: str, citations: List[Dict[str, Any]], fir_draft_text: str, checklist: List[str]) -> str:
    cites_str = ""
    for c in citations:
        cites_str += f"- **{c['section_reference']} ({c['title']})**: {c['citation_text']}\n  *Justification*: {c['justification']}\n"
    
    checklist_str = ""
    for idx, item in enumerate(checklist):
        checklist_str += f"{idx+1}. {item}\n"
        
    return f"""# CrimeGPT Automated Legal Analysis

## 1. Legal Classification & Summary
**Incident Summary:**
{summary}

**Recommended Provisions for Charge Sheet:**
{cites_str}

## 2. Draft First Information Report (FIR)
{fir_draft_text}

## 3. Investigation Guidance & Checklist
To ensure full admissibility under BSA 2023, follow this list:
{checklist_str}
1. **Audio-Video Recording (BNSS Section 105):** Ensure all search and seizure operations at the crime scene are fully video recorded on a secure mobile/camera. Upload the raw footage and log checksums.
2. **Digital Evidence Collection (BSA Section 61 & 63):** For any seized hard drives, cyber logs, or chats, a **BSA Section 63 Certificate** must be filled out and signed by the technical handler. Obtain checksum hash values (MD5/SHA-256) immediately after imaging.
3. **Witness Depositions (BNSS Section 180):** Record witness statements in writing or audio-video electronic format immediately.
4. **Preliminary Report Submission:** Submit the copy of this report to the Judicial Magistrate under BNSS Section 172.
"""

# Draft an FIR based on case details and retrieved legal references
def generate_analysis(case_title: str, description: str, location: str, date: str, evidence: str, witness: str, api_key: str = "") -> Dict[str, Any]:
    use_api_key = api_key or os.getenv("GEMINI_API_KEY", "")
    
    # 1. Retrieve matching law citations
    query_text = f"{case_title} {description} {evidence}"
    matched_laws = search_laws(query_text, use_api_key, top_k=4)
    
    citations_data = []
    for law in matched_laws:
        # Generate clean justification
        justification = f"Applicable because the narrative describes elements of '{law['title']}'."
        if "303" in law["section"] or "305" in law["section"]:
            justification = "Directly applicable as the description details unauthorized removal or taking of movable property."
        elif "318" in law["section"]:
            justification = "Directly applicable as the narrative involves deception, fraudulent transaction, or digital scamming."
        elif "115" in law["section"] or "117" in law["section"]:
            justification = "Directly applicable due to reported physical injury, battery, or assault on the victim."
        elif "351" in law["section"]:
            justification = "Applicable as the accused issued verbal or physical threats of injury/harm."
            
        citations_data.append({
            "section_reference": f"{law['act']} {law['section']}",
            "act": law["act"],
            "title": law["title"],
            "citation_text": law["description"],
            "justification": justification,
            "confidence_score": 90
        })

    # Generate standard evidence checklist
    checklist = ["Collect raw CCTV footage matching the incident window", "Obtain detailed written statement from complainant"]
    desc_l = description.lower()
    if any(x in desc_l for x in ["theft", "stole", "stolen", "property", "cafe"]):
        checklist.extend(["Verify proof of ownership of stolen property", "Inspect point of entry for forced break-in traces", "Obtain logs from target machines if applicable"])
    if any(x in desc_l for x in ["fraud", "cheat", "scam", "phishing", "bank"]):
        checklist.extend(["Obtain bank statement displaying transaction trails", "Request server IP logs from gateway provider", "Secure WhatsApp/SMS communication chats under BSA Section 63 certificate"])
    if any(x in desc_l for x in ["assault", "hurt", "beat", "hit", "injury"]):
        checklist.extend(["Obtain official medical examination report (MLC)", "Secure video recording of crime scene under BNSS Section 105", "Locate and tag physical weapon if used"])

    # Fallback generated text
    laws_str = ""
    for c in citations_data:
        laws_str += f"- **{c['section_reference']} ({c['title']})**: {c['citation_text']}\n  *Justification*: {c['justification']}\n"
        
    fallback_summary = f"Incident reported at {location or 'Unknown'} on {date or 'Unknown Date'}. Subject details a case of {case_title}."
    
    fallback_fir = f"""**FIRST INFORMATION REPORT**
**UNDER SECTION 173 OF BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023**

1. **District / Station**: Cyber Crimes Unit, {location if location else 'State Cyber Cell'}
2. **FIR Number**: CR-DRAFT-2026-{datetime.now().strftime('%m%d')}
3. **Date & Time of Report**: {datetime.now().strftime('%Y-%m-%d %H:%M')}

4. **Details of Offence**:
   - **Date of Occurrence**: {date if date else 'Specified in incident narrative'}
   - **Place of Occurrence**: {location if location else 'Specified in narrative'}
   - **Nature of Offence**: {case_title}

5. **Incident Narrative**:
   "{description}"

6. **Evidence Inventory**:
   - {evidence if evidence else 'No physical items listed'}
   - Statement of witnesses: {witness if witness else 'No statements registered'}

7. **Provisions of Charges**:
   The following provisions of Bharatiya Nyaya Sanhita (BNS) are cited:
   {", ".join([c["section_reference"] for c in citations_data])}

---
Generated by CrimeGPT AI assistant. Subject to Investigating Officer manual sign-off.
"""

    validation_warnings = run_cross_reference_validation(description, citations_data)

    if not use_api_key:
        analysis_text = build_analysis_markdown(fallback_summary, citations_data, fallback_fir, checklist)
        return {
            "analysis": analysis_text,
            "summary": fallback_summary,
            "citations": citations_data,
            "fir_draft_text": fallback_fir,
            "evidence_checklist": checklist,
            "validation_warnings": validation_warnings
        }

    provider, active_key, _ = AIService.get_provider_details(api_key)

    if provider == "offline":
        analysis_text = build_analysis_markdown(fallback_summary, citations_data, fallback_fir, checklist)
        return {
            "analysis": analysis_text,
            "summary": fallback_summary,
            "citations": citations_data,
            "fir_draft_text": fallback_fir,
            "evidence_checklist": checklist,
            "validation_warnings": validation_warnings
        }

    try:
        prompt = f"""
        You are CrimeGPT, an advanced AI legal intelligence assistant designed for Indian Law Enforcement.
        Analyze this case:
        - Title: {case_title}
        - Date: {date}
        - Location: {location}
        - Description: {description}
        - Evidence: {evidence}
        - Witnesses: {witness}
        
        Retrieved Legal Citations:
        {laws_str}
        
        Your task is to generate a structured analysis.
        Return ONLY a JSON object matching this schema:
        {{
          "summary": "concise plain language incident summary",
          "citations": [
            {{
              "section_reference": "BNS Section X",
              "act": "BNS",
              "title": "Section Title",
              "citation_text": "Exact legal description or closely related definition",
              "justification": "Clear reasoning of why this applies to the narrative details",
              "confidence_score": 95
            }}
          ],
          "fir_draft_text": "Professional First Information Report (FIR) draft adhering strictly to BNSS Section 173 guidelines. Use clear headings.",
          "evidence_checklist": [
            "Actionable checklist items for digital/physical evidence matching these crimes"
          ]
        }}
        
        Make sure the justification directly references details in the description. Ensure you follow strict legal boundaries and cite relevant acts (BNS, BNSS, BSA). Return only the JSON object. Do not include markdown blocks.
        """
        messages = [
            {"role": "system", "content": "You are CrimeGPT, an advanced AI legal intelligence assistant designed for Indian Law Enforcement."},
            {"role": "user", "content": prompt}
        ]
        
        response_text = AIService.generate_chat_completion(messages, custom_key=api_key)
        clean_text = re.sub(r'```json|```', '', response_text).strip()
        data = json.loads(clean_text)
        
        # Verify citations are structured properly
        parsed_cites = data.get("citations", [])
        if not parsed_cites:
            parsed_cites = citations_data
            
        summary_val = data.get("summary", fallback_summary)
        fir_text_val = data.get("fir_draft_text", fallback_fir)
        checklist_val = data.get("evidence_checklist", checklist)
        analysis_text = build_analysis_markdown(summary_val, parsed_cites, fir_text_val, checklist_val)
        
        return {
            "analysis": analysis_text,
            "summary": summary_val,
            "citations": parsed_cites,
            "fir_draft_text": fir_text_val,
            "evidence_checklist": checklist_val,
            "validation_warnings": validation_warnings
        }
    except Exception as e:
        print(f"Failed structured AI analysis: {e}. Falling back to rule-based RAG template.")
        analysis_text = build_analysis_markdown(fallback_summary, citations_data, fallback_fir, checklist)
        return {
            "analysis": analysis_text,
            "summary": fallback_summary,
            "citations": citations_data,
            "fir_draft_text": fallback_fir,
            "evidence_checklist": checklist,
            "validation_warnings": validation_warnings
        }
