FROM node:14.15 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
# https://github.com/angular/angular-cli/issues/17017#issuecomment-609921036
RUN ./node_modules/.bin/ngcc --properties es2015
COPY . .
RUN npm run build -- --output-path=dist --prod

FROM nginx:1.18
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
