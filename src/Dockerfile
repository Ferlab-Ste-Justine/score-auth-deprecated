FROM node:12

COPY package.json /opt/

WORKDIR /opt/

RUN npm install --production

COPY . /opt/app
WORKDIR /opt/app

ENTRYPOINT [""]
CMD ["npm", "start"]

HEALTHCHECK --interval=10s --timeout=10s --start-period=30s --retries=3 CMD curl -f http://localhost:$SERVICE_PORT/proxy/health

ENV MEMORY_LIMIT 256