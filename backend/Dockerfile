# ---- Igreja360 backend ----
FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
COPY . .
RUN npx prisma generate && npm run build
EXPOSE 3000
CMD npx prisma db push --accept-data-loss && npx prisma db seed && node dist/main.js
