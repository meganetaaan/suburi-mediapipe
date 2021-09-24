FROM node:16.10.0-buster as base

WORKDIR /code

COPY ./package*.json ./
RUN npm install

COPY . .
EXPOSE 8080

FROM base as dev
CMD node index.js
