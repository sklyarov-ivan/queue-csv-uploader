FROM node:6.10.2
RUN node -v
RUN npm install -g bower

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app
ENV REDIS_HOST='redis'
RUN npm install
RUN bower --allow-root install
EXPOSE 3000
CMD [ "npm", "start" ]