from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
from sqlalchemy.orm import Session
from . import models

def get_recommendations(product_id: int, db: Session, top_n: int = 5):
    # Fetch all scraped products
    products = db.query(models.ScrapedProduct).all()
    if not products:
        return []

    # Create a list of dicts
    product_list = []
    target_product = None
    for p in products:
        text = f"{p.name} {p.description or ''}".strip()
        product_list.append({
            'id': p.id,
            'text': text,
            'product': p
        })
        if p.id == product_id:
            target_product = p

    if not target_product:
        return []

    # Create DataFrame
    df = pd.DataFrame(product_list)

    # TF-IDF Vectorization
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(df['text'])

    # Compute cosine similarity
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

    # Get index of target product
    idx = df[df['id'] == product_id].index[0]

    # Get similarity scores
    sim_scores = list(enumerate(cosine_sim[idx]))

    # Sort by similarity, descending, exclude self
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:top_n+1]

    # Get recommended products
    recommendations = []
    for i, score in sim_scores:
        prod = df.iloc[i]['product']
        recommendations.append({
            'product': prod,
            'similarity_score': float(score)
        })

    return recommendations
