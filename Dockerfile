# Backend Bakimla - Node.js API
FROM node:20-alpine

WORKDIR /app

# bcrypt native modülü için build araçları (Alpine)
RUN apk add --no-cache python3 make g++

# Bağımlılıklar için önce package dosyalarını kopyala
COPY package.json package-lock.json* ./

# Script'ler çalışsın ki bcrypt native binding derlensin
RUN npm ci --only=production 2>/dev/null || npm install --only=production

# Uygulama kodunu kopyala
COPY . .

# Platform PORT env'ini kullan (varsayılan 3001)
ENV PORT=3001
EXPOSE $PORT

CMD ["node", "index.js"]
