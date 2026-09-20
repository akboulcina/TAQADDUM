FROM node:22-alpine
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY src ./src
RUN npm install typescript @nestjs/cli --no-save && npx tsc -p tsconfig.json
CMD ["node","dist/main.js"]
