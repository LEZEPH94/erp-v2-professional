# On utilise une version complète de Node (pas Alpine) pour éviter les soucis de compatibilité
FROM node:18

# Dossier de travail
WORKDIR /app

# 1. On copie JUSTE les fichiers de dépendances d'abord (pour le cache)
COPY package*.json ./
COPY prisma ./prisma/

# 2. INSTALLATION PROPRE
# On force la suppression des modules existants et on réinstalle pour Linux
RUN rm -rf node_modules
RUN npm install

# 3. GÉNÉRATION PRISMA
# C'est ici que ça plantait souvent. On génère le client pour Linux.
RUN npx prisma generate

# 4. On copie le reste du code
COPY . .

# Port
EXPOSE 3000

# Démarrage
CMD ["node", "index.js"]