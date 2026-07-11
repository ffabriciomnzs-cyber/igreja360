# ---- Igreja360 backend ----
FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
COPY . .
RUN npx prisma generate && npm run build
EXPOSE 8080
# Aplica o schema e sobe a API. SEM --accept-data-loss: mudanças destrutivas
# (apagar coluna/tabela) fazem o deploy ABORTAR em vez de destruir dados —
# à prova de perda de dados. Migrations versionadas são o próximo passo.
# O seed NÃO roda no boot; rode manualmente uma vez, se precisar popular.
CMD npx prisma db push --skip-generate && node dist/src/main.js
