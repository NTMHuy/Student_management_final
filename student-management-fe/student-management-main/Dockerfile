FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
# Railway cấp cổng qua biến PORT (next start tự đọc PORT)
EXPOSE 3000
CMD ["npm", "start"]
