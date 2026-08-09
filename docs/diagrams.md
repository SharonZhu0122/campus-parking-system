# Campus Parking System — Diagrams (as code)

These diagrams are written in Mermaid syntax. GitHub renders them automatically when this file is viewed in the repository.

## 1. System architecture diagram (includes deployment)

Numbers on the arrows show the order of a request: the frontend asks the backend for data (1), the backend queries the database (2), the database returns rows (3), and the backend sends the result back to the frontend (4). Each box also lists where it runs once deployed.

This one is a drawn SVG file instead of Mermaid. The two-way arrows (request/response, query/rows) form a cycle between the same pair of boxes, and Mermaid's automatic layout does not place cyclic nodes well — it pushed boxes sideways and crossed the arrow labels. Drawing it directly gives full control over the layout.

![System architecture diagram](./architecture-diagram.svg)

## 2. Rule engine flowchart

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

## 3. Data generator flowchart

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
