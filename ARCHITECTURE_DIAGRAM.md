# Architecture Diagram

```mermaid
flowchart TB
    user["End Users"] --> pip["Public IP<br/>72.146.68.187"]
    pip --> appgw["Azure Application Gateway<br/>WAF v2<br/>Path-based routing"]

    subgraph rg["Resource Group: rg-con-italy"]
        subgraph vnet["Virtual Network: con-vnet (10.10.0.0/16)"]
            subgraph gwsub["gateway-subnet"]
                appgw
            end

            subgraph acapriv["aca-private-subnet"]
                cae["Azure Container Apps Environment<br/>con-cae-private<br/>Internal environment"]
                fe["Frontend Container App<br/>con-frontend-private<br/>React app served by NGINX<br/>Autoscale: 1-5"]
                be["Backend Container App<br/>con-backend-private<br/>Express API<br/>Autoscale: 1-5"]
            end

            subgraph pesub["pe-subnet"]
                pe["Private Endpoint<br/>con-sql-pe"]
            end
        end

        subgraph dns["Private DNS Zones"]
            acaDns["wittyflower-6312adf4.italynorth.azurecontainerapps.io"]
            sqlDns["privatelink.database.windows.net"]
        end

        subgraph data["Data Tier"]
            sql["Azure SQL Server<br/>consqlserverduyghu2026<br/>Public network: Disabled"]
            db["Azure SQL Database<br/>db-con"]
        end

        subgraph build["Build & Image Registry"]
            acr["Azure Container Registry<br/>conacrduyghu2026"]
        end

        subgraph monitor["Monitoring & Alerts"]
            law["Log Analytics Workspace<br/>con-law"]
            appinsFe["Application Insights<br/>front-con-appins"]
            appinsBe["Application Insights<br/>backend-con-appins"]
            ag["Action Group<br/>con-alert-ag"]
            alert1["Alert: appgw-unhealthy-hosts"]
            alert2["Alert: sql-high-cpu"]
            alert3["Alert: backend-restarts"]
        end
    end

    appgw -->|"/"| fe
    appgw -->|"/api/*"| be

    fe -->|API calls via App Gateway| appgw
    be --> db
    sql --> db
    pe --> sql
    sqlDns --> pe
    acaDns --> cae

    acr --> fe
    acr --> be

    fe --> appinsFe
    be --> appinsBe
    appgw --> law
    fe --> law
    be --> law
    sql --> law

    alert1 --> ag
    alert2 --> ag
    alert3 --> ag
```

## Notes

- Only the Application Gateway public IP is intended as the user entry point.
- Application Gateway routes `/` to the frontend and `/api/*` to the backend.
- The frontend and backend run in the private Container Apps environment `con-cae-private`.
- Azure SQL is protected with a private endpoint and public network access is disabled.
- Images are built in Azure Container Registry and deployed to Container Apps.
- Monitoring is provided with Log Analytics, Application Insights, health probes, and alert rules.
