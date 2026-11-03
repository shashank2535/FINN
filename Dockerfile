FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --omit=optional
COPY src ./src
COPY public ./public
COPY data ./data
ENV HOST=0.0.0.0
ENV PORT=4173
EXPOSE 4173
CMD ["node", "src/server.mjs"]
