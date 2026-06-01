FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN mkdir -p data uploads

EXPOSE 3001

CMD ["node", "src/index.js"]
