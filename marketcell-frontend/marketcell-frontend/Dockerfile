# Frontend Dockerfile
FROM node:22-alpine

WORKDIR /app

# Paketler
COPY package*.json ./
RUN npm install

# Kaynak kodunu kopyala
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
