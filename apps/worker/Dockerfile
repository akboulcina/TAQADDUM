FROM node:22-alpine
WORKDIR /app
COPY package.json .
COPY tsconfig.json .
RUN npm install typescript --no-save
COPY src ./src
RUN npx tsc -p tsconfig.json
CMD ["node","dist/main.js"]
