FROM node:16.14.2

COPY . ./app

WORKDIR /app

COPY .env .env.production.local
RUN yarn
ENV NODE_ENV production
RUN yarn prisma:generate
RUN yarn build

EXPOSE 3001

CMD ["yarn", "start:docker"]