FROM node:12

COPY package.json /opt/

WORKDIR /opt/

RUN npm install --production

COPY . /opt/app
WORKDIR /opt/app

ENTRYPOINT [""]
CMD ["npm", "start"]