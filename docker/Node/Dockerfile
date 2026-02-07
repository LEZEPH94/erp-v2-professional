# docker/node/Dockerfile

# On part d'une version légère de Node (Alpine Linux)
FROM node:18-alpine

# Dossier de travail dans le conteneur
WORKDIR /app

# On copie d'abord les définitions de dépendances (pour le cache Docker)
# L'étoile permet de prendre package-lock.json s'il existe
COPY package*.json ./

# Installation des dépendances
# On installe nodemon en global pour qu'il soit toujours trouvé dans le PATH
RUN npm install -g nodemon && npm install

# Note : On ne copie pas tout le code source ici (COPY . .) 
# car on utilise un VOLUME dans le docker-compose pour le développement.
# Cela permet de modifier ton code sur ton PC et de voir le résultat instantanément.

# Le port que Node va écouter
EXPOSE 3000

# La commande de démarrage : "npm run dev" (qui lancera nodemon)
CMD ["npm", "run", "dev"]