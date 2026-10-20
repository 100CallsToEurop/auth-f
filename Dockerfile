FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ARG REACT_APP_API_URL=http://localhost:3000
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN echo "VITE_API_URL=${REACT_APP_API_URL}" > .env.production
RUN npm run build

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
