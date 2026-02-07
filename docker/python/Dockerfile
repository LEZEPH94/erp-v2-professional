# docker/python/Dockerfile

# On part d'une version légère de Python
FROM python:3.11-slim

# Empêche Python de créer des fichiers .pyc (inutiles dans Docker)
ENV PYTHONDONTWRITEBYTECODE 1
# Affiche les logs immédiatement dans la console (super pour débugger)
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Installation des dépendances système pour PostgreSQL (libpq)
RUN apt-get update && apt-get install -y libpq-dev gcc

# Copie et installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Le port que Python écoute (interne au réseau Docker)
EXPOSE 8000

# Commande de démarrage avec Uvicorn (Serveur ASGI ultra-rapide)
# --host 0.0.0.0 est CRUCIAL pour que Docker laisse passer les connexions
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]