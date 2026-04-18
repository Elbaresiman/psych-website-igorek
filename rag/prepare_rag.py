import json
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer

TECHNIQUES_PATH = "techniques.json"
METHODS_PATH = "methods.json"
INDEX_PATH = "techniques_index.pkl"

def prepare_techniques_database():
    with open(TECHNIQUES_PATH, "r", encoding="utf-8") as f:
        techniques = json.load(f)
    
    with open(METHODS_PATH, "r", encoding="utf-8") as f:
        methods = json.load(f)
    
    chunks = []
    metadata = []
    
    for tech in techniques:
        chunk_text = f"{tech['Техника']}. {tech['Инструкция']}"
        chunks.append(chunk_text)
        metadata.append({
            "technique": tech['Техника'],
            "instruction": tech['Инструкция'],
            "category": find_category(tech['Техника'], methods)
        })
    
    for category, tech_list in methods.items():
        category_chunk = f"{category} техники: {', '.join(tech_list[:5])}"
        chunks.append(category_chunk)
        metadata.append({
            "technique": category,
            "instruction": "Категория методов",
            "category": category,
            "is_category": True
        })
    
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        stop_words=None,
        max_features=3000
    )
    matrix = vectorizer.fit_transform(chunks)
    
    with open(INDEX_PATH, "wb") as f:
        pickle.dump({
            "chunks": chunks,
            "metadata": metadata,
            "vectorizer": vectorizer,
            "matrix": matrix,
            "methods": methods
        }, f)
    
    print(f"Techniques RAG index created! {len(chunks)} chunks.")

def find_category(technique_name, methods):
    """Find which category a technique belongs to"""
    for category, tech_list in methods.items():
        if technique_name in tech_list:
            return category
    return "Общие"

if __name__ == "__main__":
    prepare_techniques_database()