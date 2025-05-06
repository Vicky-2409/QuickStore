FROM node:20.8.0

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 4002

CMD ["node", "dist/src/server.js"]