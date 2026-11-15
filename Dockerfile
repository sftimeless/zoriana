# Zoriana: build the web app, then run the small Node server with the NASA terrain grids.
# The terrain files are not in git (see data/terrain-manifest.json for sources and hashes);
# they must be present in data/ when this image is built.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html ./
COPY src ./src
COPY public ./public
RUN npx vite build \
 && find dist -type f \( -name '*.f32' -o -name '*.js' -o -name '*.css' -o -name '*.html' \) -exec gzip -9 -k {} +

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY package.json server.mjs terrain-service.mjs terrain-worker.mjs ./
COPY src ./src
COPY data/global-height.i16 data/ldem_85s_40m.img ./data/
COPY data/lola_80s_80m/ldem_80s_80m.img ./data/lola_80s_80m/
COPY data/lola_80n_80m/ldem_80n_80m.img ./data/lola_80n_80m/
COPY data/lola_global_64/ldem_64.img ./data/lola_global_64/
COPY --from=build /app/dist ./dist
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
