# Backend Bakimla - Node.js API
FROM node:20-alpine

WORKDIR /app

# Bağımlılıklar için önce package dosyalarını kopyala
COPY package.json package-lock.json* ./

# Sadece production bağımlılıkları (devDependencies yok)
RUN npm ci --only=production --ignore-scripts || npm install --only=production --ignore-scripts

# Uygulama kodunu kopyala
COPY . .

# Platform PORT env'ini kullan (varsayılan 3001)
ENV PORT=3001
EXPOSE $PORT

CMD ["node", "index.js"]
