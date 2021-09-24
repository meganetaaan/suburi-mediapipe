FROM node:16.10.0-buster as base

WORKDIR /code

COPY ./package*.json ./
RUN npm install

COPY . .
EXPOSE 3000

FROM base as dev
CMD $(npm bin)/react-scripts start
