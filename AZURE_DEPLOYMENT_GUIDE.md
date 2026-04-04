# Azure Deployment Guide

This repository now builds successfully as two separate deployable services:

- `ecommerce-app-frontend`: React single-page app served by NGINX
- `ecommerce-app-backend`: Express API running on Node.js and Azure SQL

## Important Note

The coursework says "Next.js frontend", but this repository is a React SPA created with `react-scripts`, not a Next.js app. The fixed deployment path below uses the application as it actually exists in this repo.

## Target Architecture

- Public entry point: Azure Application Gateway (WAF v2)
- Frontend: Azure Container Apps, internal ingress only
- Backend: Azure Container Apps, internal ingress only
- Database: Azure SQL Database with private endpoint only
- Name resolution: Private DNS zones linked to `con_vnet`
- Monitoring: Application Insights + Log Analytics + alerts

## Existing Resources You Mentioned

- Resource group: `rg_con`
- App Service plan: `con-asp`
- Application Insights: `backend-con-appins`, `front-con-appins`
- NSGs: `nsg-gateway-con`, `nsg-pe-con`
- VNet: `con_vnet`
- SQL server: `on-server`
- Database: `db-con`
- Subnets: `gateway-subnet`, `pe-subnet`, `ace-subnet`, `vm-subnet`

`con-asp` is not required if you deploy to Azure Container Apps.

## App Requirements

### Backend environment variables

Set these on the backend container app:

```env
NODE_ENV=production
PORT=3001
DB_SERVER=<private-sql-fqdn>
DB_NAME=db-con
DB_USER=<sql-admin-or-app-user>
DB_PASSWORD=<password>
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://<your-gateway-hostname-or-public-ip>
FRONTEND_URL=https://<your-gateway-hostname-or-public-ip>
INIT_DB_ON_STARTUP=false
```

Use `INIT_DB_ON_STARTUP=false` in Azure if you create the schema separately.

### Frontend environment variables

The frontend now defaults to calling `/api`, which is exactly what you want behind Application Gateway. You do not need to hardcode the backend URL for production.

## Build and Push to ACR

Run these after logging into Azure and ACR:

```bash
az login
az account set --subscription "<your-subscription-id-or-name>"
az acr login --name <acr-name>
```

Build images:

```bash
docker build -t <acr-name>.azurecr.io/ecommerce-frontend:v1 ./ecommerce-app-frontend
docker build -t <acr-name>.azurecr.io/ecommerce-backend:v1 ./ecommerce-app-backend
```

Push images:

```bash
docker push <acr-name>.azurecr.io/ecommerce-frontend:v1
docker push <acr-name>.azurecr.io/ecommerce-backend:v1
```

## Container Apps Deployment Outline

### 1. Create or use a Container Apps environment

Create it in `ace-subnet` and make sure the subnet is delegated for Container Apps.

```bash
az extension add --name containerapp --upgrade

az containerapp env create \
  --name con-ca-env \
  --resource-group rg_con \
  --location <azure-region> \
  --infrastructure-subnet-resource-id <ace-subnet-resource-id>
```

### 2. Deploy the backend container app

Use internal ingress only:

```bash
az containerapp create \
  --name con-backend \
  --resource-group rg_con \
  --environment con-ca-env \
  --image <acr-name>.azurecr.io/ecommerce-backend:v1 \
  --target-port 3001 \
  --ingress internal \
  --min-replicas 1 \
  --max-replicas 5 \
  --registry-server <acr-name>.azurecr.io \
  --query properties.configuration.ingress.fqdn
```

Then set secrets and env vars:

```bash
az containerapp secret set \
  --name con-backend \
  --resource-group rg_con \
  --secrets db-password="<db-password>" jwt-secret="<jwt-secret>"

az containerapp update \
  --name con-backend \
  --resource-group rg_con \
  --set-env-vars \
    NODE_ENV=production \
    PORT=3001 \
    DB_SERVER=<private-sql-fqdn> \
    DB_NAME=db-con \
    DB_USER=<db-user> \
    DB_PASSWORD=secretref:db-password \
    DB_ENCRYPT=true \
    DB_TRUST_SERVER_CERTIFICATE=false \
    JWT_SECRET=secretref:jwt-secret \
    JWT_EXPIRES_IN=7d \
    CORS_ORIGIN=https://<gateway-host-or-ip> \
    FRONTEND_URL=https://<gateway-host-or-ip> \
    INIT_DB_ON_STARTUP=false
```

### 3. Deploy the frontend container app

```bash
az containerapp create \
  --name con-frontend \
  --resource-group rg_con \
  --environment con-ca-env \
  --image <acr-name>.azurecr.io/ecommerce-frontend:v1 \
  --target-port 80 \
  --ingress internal \
  --min-replicas 1 \
  --max-replicas 5 \
  --registry-server <acr-name>.azurecr.io \
  --query properties.configuration.ingress.fqdn
```

## Application Gateway Routing

Configure only the Application Gateway as public.

- Listener: HTTPS on public IP
- Backend pool 1: frontend Container App internal FQDN
- Backend pool 2: backend Container App internal FQDN
- Path rule `/` -> frontend pool
- Path rule `/api/*` -> backend pool
- Health probe frontend: `GET /health`
- Health probe backend: `GET /health`

## SQL Private Access

For Azure SQL:

- Public network access: Disabled
- Private endpoint in `pe-subnet`
- Private DNS zone linked to `con_vnet`
- Container Apps environment must resolve the SQL private FQDN

Before deploying the backend, create the schema using:

- `ecommerce-app-backend/src/scripts/init-database.sql`

If you prefer, temporarily allow the backend to initialize it once by setting:

```env
INIT_DB_ON_STARTUP=true
```

Then switch it back to `false`.

## Monitoring

Enable:

- Container Apps logs to Log Analytics
- Application Gateway access and performance logs
- Application Insights instrumentation for frontend and backend

Suggested alerts:

1. Application Gateway unhealthy backend count > 0
2. Backend container restart count > 0
3. Azure SQL CPU or DTU/vCore utilization above threshold

## Validation Checklist

- Frontend loads only through Application Gateway public IP or DNS
- `https://<gateway>/api/products` works
- Direct public access to frontend container app is disabled
- Direct public access to backend container app is disabled
- Azure SQL public network access is disabled
- Health probes show healthy on both frontend and backend
- User can open homepage, register/login, browse products, and create an order

## What Was Fixed in This Repo

- Fixed backend SQL parameter bugs that would break cart and order operations
- Fixed `products/categories/list` route ordering bug
- Fixed backend Docker build so TypeScript compiles correctly
- Fixed frontend Docker health check
- Switched frontend API default to relative `/api` for Application Gateway path routing
- Added optional `INIT_DB_ON_STARTUP` control for safer Azure startup
