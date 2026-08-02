# Campus Parking System — Diagrams (as code)

These diagrams are written in Mermaid syntax. GitHub renders them automatically when this file is viewed in the repository.

## 1. System architecture diagram

```mermaid
flowchart TD
    FE["Frontend (React)<br/>gate view, admin, kiosk"]
    FE -->|"REST calls, JWT"| API

    subgraph BE["Backend (Node.js / Express)"]
        API["API routes (JWT)"]
        RE["Rule engine"]
        PR["Predictions"]
        PS["Priority scorer"]
    end

    API -->|Sequelize| DB[("MySQL database<br/>4 tables")]
    DG["Data generator<br/>creates fake events"] -->|writes events| DB
```

## 2. Deployment diagram

```mermaid
flowchart TD
    Browser["User's browser<br/>desktop or mobile"]
    Browser -->|loads app| FEHost["Vercel / Netlify<br/>hosts frontend"]
    Browser -->|"API calls (HTTPS)"| BEHost["Render / Railway<br/>hosts backend"]
    BEHost -->|DB connection| DBHost["Railway / Aiven<br/>hosts MySQL database"]
```

## 3. Rule engine flowchart

```mermaid
flowchart TD
    Start(["Start: new parking event"]) --> D1{"In a reserved park?"}
    D1 -->|Yes| V1["Flag reserved_violation"]
    D1 -->|No| D2{"Paid hours + unpaid?"}
    D2 -->|Yes| V2["Flag unpaid_violation"]
    D2 -->|No| D3{"Mobility, no valid card?"}
    D3 -->|Yes| V3["Flag mobility_violation"]
    D3 -->|No| E(["No violation"])
```

## 4. Data generator flowchart

```mermaid
flowchart TD
    Start(["Cron tick every 2-5 min"]) --> P1["Pick gate + event count"]
    P1 --> P2["Generate plate number"]
    P2 --> D1{"Valid plate format?"}
    D1 -->|No| P2
    D1 -->|Yes| P3["Assign type + payment info"]
    P3 --> P4["Assign parking duration"]
    P4 --> P5["Save event to database"]
    P5 --> P6["Run rule engine"]
    P6 --> D2{"More events this tick?"}
    D2 -->|Yes| P2
    D2 -->|No| End(["Wait for next tick"])
```
