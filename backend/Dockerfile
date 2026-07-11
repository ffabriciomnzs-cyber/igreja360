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
# Migrations versionadas + boot da API (ver docker-entrypoint.sh).
# Substitui o antigo `db push`: agora o schema evolui por migrations auditáveis
# e à prova de perda de dados. O seed NÃO roda no boot.
CMD ["sh", "docker-entrypoint.sh"]
