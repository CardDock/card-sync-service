FROM node:22-bookworm-slim

WORKDIR /site/docusaurus

COPY docusaurus/package.json ./
RUN npm install

COPY docusaurus/ ./

WORKDIR /site
COPY docs/ ./docs/

WORKDIR /site/docusaurus

EXPOSE 3000

CMD ["npm", "run", "start"]
