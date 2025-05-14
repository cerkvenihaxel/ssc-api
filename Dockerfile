FROM node:18

WORKDIR /usr/src/app

COPY . .

RUN chown -R node:node /usr/src/app

USER node

EXPOSE 3000

CMD ["yarn", "start:dev"]
