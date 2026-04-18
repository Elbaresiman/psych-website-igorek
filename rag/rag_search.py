import json
import pickle
from sklearn.metrics.pairwise import cosine_similarity
from features.category_keywords import CATEGORY_KEYWORDS

INDEX_PATH = "techniques_index.pkl"
METHODS_PATH = "methods.json"

with open(METHODS_PATH, "r", encoding="utf-8") as f:
    METHODS = json.load(f)

with open(INDEX_PATH, "rb") as f:
    TECHNIQUES_DB = pickle.load(f)

VECTOR = TECHNIQUES_DB["vectorizer"]
MATRIX = TECHNIQUES_DB["matrix"]
METADATA = TECHNIQUES_DB["metadata"]

def search_relevant_chunks(query: str, top_k=3):
    
    query_vec = VECTOR.transform([query])
    sims = cosine_similarity(query_vec, MATRIX)[0]
    
    vector_results = []
    top_idx = sims.argsort()[-top_k*2:][::-1]
    
    for idx in top_idx:
        if sims[idx] > 0.15:
            metadata = METADATA[idx].copy()
            metadata["similarity"] = float(sims[idx])
            if not metadata.get("is_category", False):
                vector_results.append(metadata)
                
    if vector_results and vector_results[0]["similarity"] > 0.3:
        return vector_results[:top_k]
    
    query_lower = query.lower()
    category_keywords = CATEGORY_KEYWORDS
    matched_category = None
    
    for category, keywords in category_keywords.items():
        if any(keyword in query_lower for keyword in keywords):
            matched_category = category
            break

    if not matched_category:
        return vector_results[:top_k] if vector_results else []
    
    category_techniques = METHODS.get(matched_category, [])
    
    results = []
    for tech_name in category_techniques[:top_k*2]:
        for item in METADATA:
            if item.get("technique") == tech_name and not item.get("is_category", False):
                results.append(item.copy())
                break
    
    for i, res in enumerate(results):
        res["similarity"] = 0.5 - (i * 0.1)
        res["match_type"] = "keyword"
    
    return results[:top_k]

def get_techniques_by_category(category_name):
    """Get all techniques from a category"""
    techniques = METHODS.get(category_name, [])
    result = []
    for tech_name in techniques:
        for item in METADATA:
            if item.get("technique") == tech_name:
                result.append(item)
                break
    return result