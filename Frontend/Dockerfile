# Dockerfile
# Utiliser Node.js 20 avec Alpine (mais avec des dépendances supplémentaires)
FROM node:20-alpine AS builder

WORKDIR /app

# Installez les dépendances nécessaires pour lightningcss
RUN apk add --no-cache python3 make g++

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste des fichiers
COPY . .

# Corriger la configuration ESLint
# Créer ou mettre à jour .eslintrc.json si nécessaire
# Et assurez-vous que next.config.mjs n'a pas de configuration eslint

# Build l'application
RUN npm run build

# Étape de production
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Installez uniquement les dépendances de production
RUN apk add --no-cache curl

# Créez un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder /app/public ./public

# Copier les fichiers de build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

# Utiliser l'utilisateur non-root
USER nextjs

# Exposer le port
EXPOSE 3000

# Définir la variable d'environnement pour le port
ENV PORT=3000

# Commande de démarrage
CMD ["node", "server.js"]