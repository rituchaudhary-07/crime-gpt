import os
import re
import numpy as np
import google.generativeai as genai
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

# Vector-based search engine (uses Gemini embeddings if available)
def search_laws(query: str, api_key: str = "", top_k: int = 4) -> List[Dict[str, Any]]:
    use_api_key = api_key or os.getenv("GEMINI_API_KEY", "")
    if not use_api_key:
        return keyword_search(query, top_k)
        
    try:
        genai.configure(api_key=use_api_key)
        # Fetch embedding for query
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=query,
            task_type="retrieval_query"
        )
        query_vector = np.array(result['embedding'])
        
        # Precomputed embedding mechanism or fetch on the fly (since dataset is small and static, we can cache/precompute)
        # For simplicity, we will calculate embeddings for the texts or match using keywords if exceptions arise.
        # To avoid high latency on every request, we can generate them. Let's do a cache check:
        if not hasattr(search_laws, "_embeddings_cache"):
            search_laws._embeddings_cache = {}
            
        docs_to_embed = []
        indices_to_embed = []
        
        for idx, item in enumerate(LEGAL_DATABASE):
            if item["id"] not in search_laws._embeddings_cache:
                doc_text = f"{item['act']} {item['section']}: {item['title']}. {item['description']}"
                docs_to_embed.append(doc_text)
                indices_to_embed.append(idx)
                
        if docs_to_embed:
            res = genai.embed_content(
                model="models/text-embedding-004",
                content=docs_to_embed,
                task_type="retrieval_document"
            )
            # Store in cache
            for idx, vec in zip(indices_to_embed, res['embedding']):
                search_laws._embeddings_cache[LEGAL_DATABASE[idx]["id"]] = np.array(vec)
                
        # Calculate Cosine Similarities
        similarities = []
        for item in LEGAL_DATABASE:
            cached_vec = search_laws._embeddings_cache.get(item["id"])
            if cached_vec is not None:
                dot_product = np.dot(query_vector, cached_vec)
                norm_q = np.linalg.norm(query_vector)
                norm_doc = np.linalg.norm(cached_vec)
                similarity = dot_product / (norm_q * norm_doc)
                similarities.append((similarity, item))
            else:
                similarities.append((0.0, item))
                
        similarities.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in similarities[:top_k]]
        
    except Exception as e:
        print(f"Error in vector search, falling back to keyword search: {e}")
        return keyword_search(query, top_k)

# Draft an FIR based on case details and retrieved legal references
def generate_analysis(case_title: str, description: str, location: str, date: str, evidence: str, witness: str, api_key: str = "") -> Dict[str, str]:
    use_api_key = api_key or os.getenv("GEMINI_API_KEY", "")
    
    # Retrieve laws
    query_text = f"{case_title} {description} {evidence}"
    matched_laws = search_laws(query_text, use_api_key, top_k=4)
    
    laws_str = ""
    for law in matched_laws:
        laws_str += f"- **{law['act']} {law['section']} ({law['title']})**: {law['description']}\n"

    # Prompt constructing
    prompt = f"""
You are CrimeGPT, an advanced AI legal intelligence assistant designed for Indian Law Enforcement.
Analyze the following crime case details and draft:
1. Legal Classification & Summary (Categorization and specific sections of Bharatiya Nyaya Sanhita (BNS) / Bharatiya Nagarik Suraksha Sanhita (BNSS) / Bharatiya Sakshya Adhiniyam (BSA)).
2. Formal FIR Draft (formatted as a professional First Information Report under BNSS Section 173).
3. Step-by-Step Investigation Checklist (including evidence handling under BSA Section 63/61 and video recording mandates under BNSS Section 105).

CASE DETAILS:
- Title: {case_title}
- Date of Occurrence: {date}
- Location: {location}
- Case Description: {description}
- Evidence Collected: {evidence}
- Witness Details: {witness}

RETRIEVED INDIAN LEGAL REFERENCES:
{laws_str}

Please generate the analysis using a clean, formal tone with clear markdown headings. Do not use placeholders; output concrete legal analysis and procedures.
"""

    if not use_api_key:
        # Fallback template response if Gemini is not available
        laws_li = "".join([f"<li><b>{l['act']} {l['section']} - {l['title']}</b>: {l['description']}</li>" for l in matched_laws])
        
        fallback_markdown = f"""# CrimeGPT Automated Legal Analysis (OFFLINE MODE)

> [!NOTE]
> This analysis is compiled in Offline Mode using local keyword matching rules. To get customizable LLM case drafts and deep reasoning, please provide a valid Gemini API Key in the application Settings.

## 1. Legal Classification
Based on the details provided, the following sections from Indian Criminal Law are recommended for filing charges:
{laws_str}

## 2. Draft First Information Report (FIR)
**UNDER SECTION 173 OF BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023**

- **District:** State Cyber/Local Police Jurisdiction
- **Police Station:** Cyber & Commercial Crimes Unit
- **FIR Number:** [Draft Generated]
- **Date & Time of Report:** {date if date else 'Immediate'}

### Description of Offence:
The complainant reports that on {date if date else 'the specified date'} at {location if location else 'the specified location'}, the incident took place:
"{description}"

The evidence submitted includes: *{evidence if evidence else 'None specified'}*.
Witness statements: *{witness if witness else 'None specified'}*.

**Recommended Sections for Charge Sheet:**
{", ".join([f"{l['act']} {l['section']}" for l in matched_laws])}

---

## 3. Investigation Guidance & Checklist
To ensure full admissibility under BSA 2023, follow this list:
1. **Audio-Video Recording (BNSS Section 105):** Ensure all search and seizure operations at the crime scene are fully video recorded on a secure mobile/camera. Upload the raw footage and log checksums.
2. **Digital Evidence Collection (BSA Section 61 & 63):** For any seized hard drives, cyber logs, or chats, a **BSA Section 63 Certificate** must be filled out and signed by the technical handler. Obtain checksum hash values (MD5/SHA-256) immediately after imaging.
3. **Witness Depositions (BNSS Section 180):** Record witness statements in writing or audio-video electronic format immediately.
4. **Preliminary Report Submission:** Submit the copy of this report to the Judicial Magistrate under BNSS Section 172.
"""
        return {
            "analysis": fallback_markdown,
            "citations": ", ".join([f"{l['act']} {l['section']}" for l in matched_laws])
        }

    try:
        genai.configure(api_key=use_api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        
        citations_list = [f"{l['act']} {l['section']}" for l in matched_laws]
        
        return {
            "analysis": response.text,
            "citations": ", ".join(citations_list)
        }
    except Exception as e:
        # Fallback to local rendering on Gemini failure
        return {
            "analysis": f"Error running Gemini Generation: {e}\n\nHere are the matched legal sections:\n{laws_str}",
            "citations": ", ".join([f"{l['act']} {l['section']}" for l in matched_laws])
        }
