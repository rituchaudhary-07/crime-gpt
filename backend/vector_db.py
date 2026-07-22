import os
import re
import numpy as np
import requests
from typing import List, Dict, Any

# Attempts to load ChromaDB
try:
    import chromadb
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

# Local static legal database copy
from backend.rag import LEGAL_DATABASE

class VectorDBService:
    _chroma_client = None
    _collection = None

    @staticmethod
    def get_openai_embedding(text: str, api_key: str) -> List[float]:
        url = "https://api.openai.com/v1/embeddings"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "input": text,
            "model": "text-embedding-3-small"
        }
        res = requests.post(url, headers=headers, json=payload, timeout=10)
        if res.ok:
            return res.json()["data"][0]["embedding"]
        raise Exception(f"OpenAI Embedding failed: {res.text}")

    @staticmethod
    def initialize_db():
        if not CHROMA_AVAILABLE:
            print("ChromaDB library is not installed. Falling back to NumPy keyword similarity engine.")
            return False

        try:
            # Persistent client in local database folder
            base_dir = os.path.dirname(os.path.abspath(__file__))
            db_path = os.path.join(base_dir, "db", "chroma")
            os.makedirs(db_path, exist_ok=True)
            
            # Initialize persistent client
            VectorDBService._chroma_client = chromadb.PersistentClient(path=db_path)
            
            # Get or create collection
            VectorDBService._collection = VectorDBService._chroma_client.get_or_create_collection(
                name="legal_codes",
                metadata={"hnsw:space": "cosine"}
            )
            
            # Check if database is empty. If empty, load BNS database
            if VectorDBService._collection.count() == 0:
                print("ChromaDB collection is empty. Seeding BNS/BNSS/BSA law data...")
                ids = [doc["id"] for doc in LEGAL_DATABASE]
                documents = [f"{doc['act']} {doc['section']}: {doc['title']}. {doc['description']}" for doc in LEGAL_DATABASE]
                metadatas = [{"act": doc["act"], "section": doc["section"], "title": doc["title"]} for doc in LEGAL_DATABASE]
                
                openai_key = os.getenv("OPENAI_API_KEY", "")
                if openai_key:
                    embeddings = []
                    for doc in documents:
                        try:
                            embeddings.append(VectorDBService.get_openai_embedding(doc, openai_key))
                        except Exception as e:
                            print(f"OpenAI embedding generation failed: {e}")
                            # Fallback dummy vector of size 1536
                            embeddings.append([0.0] * 1536)
                            
                    VectorDBService._collection.add(
                        ids=ids,
                        documents=documents,
                        metadatas=metadatas,
                        embeddings=embeddings
                    )
                else:
                    # Let ChromaDB use default sentence embeddings
                    VectorDBService._collection.add(
                        ids=ids,
                        documents=documents,
                        metadatas=metadatas
                    )
                print("ChromaDB collection successfully seeded.")
            return True
        except Exception as e:
            print(f"ChromaDB initialization failed: {e}. Falling back to NumPy engine.")
            return False

    @staticmethod
    def search_dockets(query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        # Check if chroma is available and runs
        if VectorDBService._collection is None:
            initialized = VectorDBService.initialize_db()
            if not initialized or VectorDBService._collection is None:
                return VectorDBService.fallback_numpy_search(query, top_k)

        try:
            openai_key = os.getenv("OPENAI_API_KEY", "")
            if openai_key:
                query_vector = VectorDBService.get_openai_embedding(query, openai_key)
                results = VectorDBService._collection.query(
                    query_embeddings=[query_vector],
                    n_results=top_k
                )
            else:
                results = VectorDBService._collection.query(
                    query_texts=[query],
                    n_results=top_k
                )
            
            # Parse Chroma outputs
            matched = []
            if results and "ids" in results and results["ids"] and results["ids"][0]:
                doc_ids = results["ids"][0]
                for doc_id in doc_ids:
                    # Find doc details in local database
                    found = next((item for item in LEGAL_DATABASE if item["id"] == doc_id), None)
                    if found:
                        matched.append(found)
            
            if matched:
                return matched
            return VectorDBService.fallback_numpy_search(query, top_k)
        except Exception as e:
            print(f"ChromaDB Query failed: {e}. Falling back to NumPy engine.")
            return VectorDBService.fallback_numpy_search(query, top_k)

    @staticmethod
    def fallback_numpy_search(query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        # Keyword-based TF-IDF scoring overlap (extremely fast, zero-dependency, works offline)
        query_words = set(re.findall(r'\w+', query.lower()))
        scored_sections = []
        for section in LEGAL_DATABASE:
            score = 0.0
            # Match in act
            if section["act"].lower() in query.lower():
                score += 2.0
            # Match in title
            title_words = re.findall(r'\w+', section["title"].lower())
            for w in title_words:
                if w in query_words:
                    score += 1.0
            # Match in description
            desc_words = re.findall(r'\w+', section["description"].lower())
            for w in desc_words:
                if w in query_words:
                    score += 0.5
            if score > 0:
                scored_sections.append((score, section))
                
        scored_sections.sort(key=lambda x: x[0], reverse=True)
        if not scored_sections:
            return LEGAL_DATABASE[:top_k]
        return [item[1] for item in scored_sections[:top_k]]
