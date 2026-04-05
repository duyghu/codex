# Architecture Diagram

```mermaid
flowchart LR
    user["Users"]
    pip["Public IP<br/>72.146.68.187"]
    appgw["Application Gateway<br/>WAF v2"]

    subgraph web["Web Tier"]
        fe["Frontend Container App<br/>con-frontend-private"]
        be["Backend Container App<br/>con-backend-private"]
    end

    subgraph data["Data Tier"]
        sql["Azure SQL Server<br/>Public access disabled"]
        db["Database<br/>db-con"]
        pe["Private Endpoint"]
    end

    subgraph infra["Core Azure Services"]
        vnet["VNet: con-vnet"]
        acr["ACR<br/>conacrduyghu2026"]
        cae["Private Container Apps Env<br/>con-cae-private"]
        dns["Private DNS Zones"]
    end

    subgraph obs["Monitoring"]
        law["Log Analytics"]
        appins["Application Insights"]
        alerts["3 Alerts + Action Group"]
    end

    user --> pip --> appgw
    appgw -->|"/"| fe
    appgw -->|"/api/*"| be
    fe -->|API calls| appgw
    be --> db
    sql --> db
    pe --> sql

    vnet --> appgw
    vnet --> cae
    vnet --> pe
    dns --> cae
    dns --> pe
    acr --> fe
    acr --> be

    appgw --> law
    fe --> appins
    be --> appins
    fe --> law
    be --> law
    sql --> law
    alerts --> law
```

## Notes

- Users access the app only through the Application Gateway public IP.
- Application Gateway routes `/` to the frontend and `/api/*` to the backend.
- Frontend and backend run inside the private Container Apps environment.
- Azure SQL is private and connected through a private endpoint.
- ACR stores the container images used by both apps.
- Monitoring includes Log Analytics, Application Insights, health probes, and alert rules.
