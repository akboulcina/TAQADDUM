FROM node:22-alpine
WORKDIR /app
COPY package.json tsconfig.json ./
COPY ../../tsconfig.base.json /workspace/tsconfig.base.json
RUN npm install
COPY src ./src
RUN npx tsc -p tsconfig.json
CMD ["node","dist/main.js"]
