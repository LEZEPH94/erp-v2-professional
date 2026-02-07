# src/Engine_Python/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# On récupère l'URL de la DB depuis les variables d'environnement (Docker)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Création du moteur
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Création de la session (l'outil pour faire des requêtes)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# La classe de base pour tous nos modèles
Base = declarative_base()

# Fonction utilitaire pour récupérer la DB dans chaque route
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()