version: "3.9"

services:
  autoshop_db:
    image: postgres:15-alpine
    container_name: autoshop_db
    restart: always
    environment:
      POSTGRES_DB: autoshop_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - autoshop_postgres_data:/var/lib/postgresql/data
    networks:
      - autoshop_net

  autoshop_backend:
    build:
      context: .
      dockerfile: autoshop.Server/Dockerfile
    container_name: autoshop_backend
    restart: always
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      ASPNETCORE_URLS: http://+:8080
      ConnectionStrings__DefaultConnection: Host=autoshop_db;Port=5432;Database=autoshop_db;Username=postgres;Password=${DB_PASSWORD}
      Smtp__Host: smtp.gmail.com
      Smtp__Port: "587"
      Smtp__User: ${SMTP_USER}
      Smtp__Pass: ${SMTP_PASS}
      FrontendUrl: https://erp.magcar.shop
      TiendaUrl: https://magcar.shop
    ports:
      - "5200:8080"
    depends_on:
      - autoshop_db
    networks:
      - autoshop_net
    volumes:
      - autoshop_imagenes:/app/wwwroot/imagenes

  autoshop_tienda:
    build:
      context: ./autoshop.tienda
      dockerfile: Dockerfile
      args:
        VITE_API_URL: https://api.magcar.shop
    container_name: autoshop_tienda
    restart: always
    ports:
      - "5201:80"
    networks:
      - autoshop_net

  autoshop_erp:
    build:
      context: ./autoshop.client
      dockerfile: Dockerfile
      args:
        VITE_API_URL: https://api.magcar.shop
    container_name: autoshop_erp
    restart: always
    ports:
      - "5202:80"
    networks:
      - autoshop_net

volumes:
  autoshop_postgres_data:
  autoshop_imagenes:

networks:
  autoshop_net:
    driver: bridge