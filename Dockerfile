FROM node:12

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 80

CMD ["node", "index.js"]