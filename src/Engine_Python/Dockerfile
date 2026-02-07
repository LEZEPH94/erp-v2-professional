# Version Python légère et moderne
FROM python:3.9-slim

# On empêche Python de créer des fichiers .pyc inutiles
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Installation des outils système nécessaires pour PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev gcc

# Installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code
COPY . .

# Port
EXPOSE 8000

# Démarrage
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]