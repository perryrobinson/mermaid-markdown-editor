# Complex Mermaid Diagrams

## Large Flowchart - E-Commerce Order Processing

```mermaid
flowchart TB
    subgraph Customer["Customer Actions"]
        A[Browse Products] --> B[Add to Cart]
        B --> C{Checkout?}
        C -->|No| A
        C -->|Yes| D[Enter Shipping Info]
        D --> E[Select Payment Method]
    end

    subgraph Payment["Payment Processing"]
        E --> F{Payment Type}
        F -->|Credit Card| G[Validate Card]
        F -->|PayPal| H[Redirect to PayPal]
        F -->|Crypto| I[Generate Wallet Address]
        G --> J{Valid?}
        J -->|No| K[Show Error]
        K --> E
        J -->|Yes| L[Charge Card]
        H --> L
        I --> M[Await Confirmation]
        M --> L
    end

    subgraph Fulfillment["Order Fulfillment"]
        L --> N[Create Order]
        N --> O{In Stock?}
        O -->|No| P[Backorder]
        O -->|Yes| Q[Reserve Inventory]
        P --> R[Notify Customer]
        Q --> S[Pick Items]
        S --> T[Pack Order]
        T --> U{Shipping Method}
        U -->|Standard| V[USPS]
        U -->|Express| W[FedEx]
        U -->|Overnight| X[UPS Next Day]
        V --> Y[Generate Label]
        W --> Y
        X --> Y
        Y --> Z[Ship Order]
        Z --> AA[Send Tracking]
        AA --> BB[Delivered]
    end

    subgraph Returns["Returns Processing"]
        BB --> CC{Satisfied?}
        CC -->|Yes| DD[Leave Review]
        CC -->|No| EE[Request Return]
        EE --> FF[Generate RMA]
        FF --> GG[Receive Return]
        GG --> HH{Condition?}
        HH -->|Good| II[Full Refund]
        HH -->|Damaged| JJ[Partial Refund]
        II --> KK[Update Inventory]
        JJ --> KK
    end
```

## State Diagram - WebSocket Connection

```mermaid
stateDiagram-v2
    [*] --> Disconnected

    Disconnected --> Connecting: connect()
    Connecting --> Connected: onopen
    Connecting --> Disconnected: onerror/timeout

    Connected --> Authenticating: send credentials
    Authenticating --> Authenticated: auth success
    Authenticating --> Connected: auth retry
    Authenticating --> Disconnected: auth failed (max retries)

    Authenticated --> Subscribing: subscribe(channels)
    Subscribing --> Active: subscribed
    Subscribing --> Authenticated: subscribe failed

    Active --> Active: message received
    Active --> Active: message sent
    Active --> Reconnecting: connection lost
    Active --> Disconnecting: close()

    Reconnecting --> Connecting: retry
    Reconnecting --> Disconnected: max retries exceeded

    Disconnecting --> Disconnected: onclose

    Disconnected --> [*]

    note right of Active
        Heartbeat every 30s
        Auto-reconnect on failure
    end note

    note left of Authenticating
        JWT token validation
        Session restoration
    end note
```

## Entity Relationship Diagram - Social Media Platform

```mermaid
erDiagram
    USER ||--o{ POST : creates
    USER ||--o{ COMMENT : writes
    USER ||--o{ LIKE : gives
    USER ||--o{ FOLLOW : follows
    USER ||--o{ FOLLOW : followed_by
    USER ||--o{ MESSAGE : sends
    USER ||--o{ MESSAGE : receives
    USER ||--o{ NOTIFICATION : receives
    USER ||--|| PROFILE : has
    USER ||--o{ SESSION : has

    POST ||--o{ COMMENT : has
    POST ||--o{ LIKE : receives
    POST ||--o{ TAG : tagged_with
    POST ||--o{ MEDIA : contains
    POST ||--o{ SHARE : shared_as

    COMMENT ||--o{ LIKE : receives
    COMMENT ||--o{ COMMENT : replies_to

    TAG ||--o{ POST : tags
    TAG ||--o{ USER : interests

    GROUP ||--o{ USER : has_members
    GROUP ||--o{ POST : contains
    GROUP ||--|| USER : owned_by

    USER {
        uuid id PK
        string username UK
        string email UK
        string password_hash
        datetime created_at
        datetime last_login
        boolean is_verified
        boolean is_active
    }

    POST {
        uuid id PK
        uuid user_id FK
        text content
        enum visibility
        datetime created_at
        datetime updated_at
        int view_count
        boolean is_pinned
    }

    PROFILE {
        uuid user_id PK,FK
        string display_name
        text bio
        string avatar_url
        string cover_url
        date birthday
        string location
        string website
    }
```

## Sequence Diagram - OAuth2 Authorization Code Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant B as Browser
    participant A as App Server
    participant AS as Auth Server
    participant RS as Resource Server
    participant DB as Database

    U->>B: Click "Login with Provider"
    B->>A: GET /auth/login
    A->>A: Generate state & PKCE verifier
    A->>DB: Store state + verifier
    A-->>B: Redirect to Auth Server

    B->>AS: GET /authorize?client_id&redirect_uri&state&code_challenge
    AS-->>B: Show login page
    U->>B: Enter credentials
    B->>AS: POST credentials
    AS->>AS: Validate credentials

    alt Invalid credentials
        AS-->>B: Show error
        B-->>U: Display error message
    else Valid credentials
        AS-->>B: Show consent screen
        U->>B: Grant consent
        B->>AS: POST consent
        AS->>AS: Generate authorization code
        AS-->>B: Redirect to callback with code
    end

    B->>A: GET /callback?code&state
    A->>DB: Verify state, get verifier
    A->>AS: POST /token (code + verifier)
    AS->>AS: Validate code & verifier
    AS-->>A: Return access_token + refresh_token
    A->>DB: Store tokens encrypted

    A->>RS: GET /api/user (Bearer token)
    RS->>AS: Validate token
    AS-->>RS: Token valid + scopes
    RS-->>A: Return user data

    A->>DB: Create/update user record
    A->>A: Create session
    A-->>B: Set session cookie + redirect
    B-->>U: Show logged in state

    Note over A,AS: Token refresh flow
    A->>AS: POST /token (refresh_token)
    AS-->>A: New access_token
```

## Gantt Chart - Product Launch Timeline

```mermaid
gantt
    title Product Launch Timeline 2024
    dateFormat  YYYY-MM-DD

    section Planning
    Market Research           :done, p1, 2024-01-01, 30d
    Competitor Analysis       :done, p2, after p1, 14d
    Feature Prioritization    :done, p3, after p2, 7d
    Technical Architecture    :done, p4, after p2, 14d

    section Design
    UX Research              :done, d1, after p3, 14d
    Wireframes               :done, d2, after d1, 14d
    Visual Design            :done, d3, after d2, 21d
    Prototype                :done, d4, after d3, 14d
    User Testing             :active, d5, after d4, 14d
    Design Refinement        :d6, after d5, 7d

    section Development
    Backend API              :dev1, after p4, 60d
    Database Design          :dev2, after p4, 14d
    Frontend Core            :dev3, after d3, 45d
    Authentication           :dev4, after dev2, 21d
    Payment Integration      :dev5, after dev4, 21d
    Admin Dashboard          :dev6, after dev1, 30d
    Mobile App               :dev7, after dev3, 45d

    section Testing
    Unit Tests               :t1, after dev1, 14d
    Integration Tests        :t2, after t1, 14d
    Performance Testing      :t3, after t2, 7d
    Security Audit           :crit, t4, after t3, 14d
    UAT                      :t5, after t4, 14d
    Bug Fixes                :t6, after t5, 14d

    section Launch
    Beta Release             :milestone, m1, after t5, 0d
    Marketing Campaign       :l1, after m1, 30d
    Documentation            :l2, after t6, 14d
    Training Materials       :l3, after l2, 7d
    Production Deploy        :crit, milestone, m2, after l3, 0d
    Post-Launch Support      :l4, after m2, 30d
```

## Class Diagram - Game Engine Architecture

```mermaid
classDiagram
    class Engine {
        -GameLoop loop
        -SceneManager scenes
        -ResourceManager resources
        -InputManager input
        -AudioManager audio
        +initialize()
        +run()
        +shutdown()
    }

    class GameLoop {
        -double deltaTime
        -int targetFPS
        -bool running
        +start()
        +stop()
        +update(dt)
        +render()
    }

    class SceneManager {
        -Scene[] scenes
        -Scene activeScene
        +pushScene(Scene)
        +popScene()
        +switchScene(name)
        +update(dt)
    }

    class Scene {
        <<abstract>>
        -Entity[] entities
        -Camera camera
        +onEnter()
        +onExit()
        +update(dt)*
        +render()*
    }

    class Entity {
        -int id
        -Transform transform
        -Component[] components
        -bool active
        +addComponent(Component)
        +getComponent(type)
        +removeComponent(type)
        +update(dt)
    }

    class Component {
        <<interface>>
        +update(dt)
        +render()
        +onAttach()
        +onDetach()
    }

    class Transform {
        +Vector3 position
        +Quaternion rotation
        +Vector3 scale
        +Matrix4 worldMatrix
        +translate(Vector3)
        +rotate(Quaternion)
        +lookAt(Vector3)
    }

    class SpriteRenderer {
        -Texture texture
        -Shader shader
        -Color tint
        +render()
    }

    class PhysicsBody {
        -Vector3 velocity
        -float mass
        -Collider collider
        +applyForce(Vector3)
        +update(dt)
    }

    class AIController {
        -StateMachine fsm
        -NavAgent navigator
        +update(dt)
        +setState(State)
    }

    class ResourceManager {
        -Map~string,Resource~ cache
        +load(path, type)
        +get(name)
        +unload(name)
        +preload(manifest)
    }

    class InputManager {
        -Map~Key,bool~ keyStates
        -Vector2 mousePos
        +isKeyDown(Key)
        +isKeyPressed(Key)
        +getMousePosition()
        +getAxis(name)
    }

    Engine *-- GameLoop
    Engine *-- SceneManager
    Engine *-- ResourceManager
    Engine *-- InputManager
    SceneManager o-- Scene
    Scene o-- Entity
    Entity *-- Transform
    Entity o-- Component
    Component <|.. SpriteRenderer
    Component <|.. PhysicsBody
    Component <|.. AIController
```

## Git Graph - Feature Branch Workflow

```mermaid
gitGraph
    commit id: "Initial commit"
    commit id: "Add README"
    branch develop
    checkout develop
    commit id: "Setup project structure"
    commit id: "Add CI/CD pipeline"

    branch feature/auth
    checkout feature/auth
    commit id: "Add user model"
    commit id: "Implement JWT"
    commit id: "Add login endpoint"
    commit id: "Add registration"

    checkout develop
    branch feature/api
    checkout feature/api
    commit id: "Setup Express"
    commit id: "Add middleware"
    commit id: "Implement CRUD"

    checkout develop
    merge feature/api id: "Merge API" tag: "v0.1.0"

    checkout feature/auth
    commit id: "Add password reset"
    commit id: "Fix security issue" type: REVERSE

    checkout develop
    merge feature/auth id: "Merge Auth" tag: "v0.2.0"

    branch feature/payments
    checkout feature/payments
    commit id: "Add Stripe SDK"
    commit id: "Implement checkout"
    commit id: "Add webhooks"

    checkout develop
    branch hotfix/security
    checkout hotfix/security
    commit id: "Patch XSS vuln" type: HIGHLIGHT

    checkout main
    merge hotfix/security id: "Emergency fix" tag: "v0.2.1"

    checkout develop
    merge hotfix/security
    merge feature/payments id: "Merge Payments" tag: "v0.3.0"

    checkout main
    merge develop id: "Release" tag: "v1.0.0"
```

## Pie Chart - Budget Allocation

```mermaid
pie showData
    title Engineering Budget Q4 2024
    "Infrastructure & Cloud" : 35
    "Developer Tools" : 15
    "Security & Compliance" : 20
    "Third-party Services" : 12
    "Training & Conferences" : 8
    "Hardware & Equipment" : 10
```

## Mindmap - System Design Concepts

```mermaid
mindmap
  root((System Design))
    Scalability
      Horizontal Scaling
        Load Balancers
        Auto-scaling Groups
        Container Orchestration
      Vertical Scaling
        CPU Upgrade
        Memory Expansion
        Storage IOPS
      Database Scaling
        Sharding
        Read Replicas
        Connection Pooling
    Reliability
      Redundancy
        Multi-AZ Deployment
        Database Replication
        Service Mesh
      Fault Tolerance
        Circuit Breakers
        Retry Policies
        Graceful Degradation
      Disaster Recovery
        Backup Strategies
        RTO & RPO
        Failover Procedures
    Performance
      Caching
        CDN
        Redis/Memcached
        Application Cache
      Optimization
        Query Optimization
        Code Profiling
        Asset Compression
      Monitoring
        APM Tools
        Log Aggregation
        Alerting
    Security
      Authentication
        OAuth 2.0
        SSO/SAML
        MFA
      Authorization
        RBAC
        ABAC
        API Keys
      Data Protection
        Encryption at Rest
        TLS/mTLS
        Key Management
```

## Quadrant Chart - Technology Evaluation

```mermaid
quadrantChart
    title Technology Stack Evaluation
    x-axis Low Maturity --> High Maturity
    y-axis Low Performance --> High Performance
    quadrant-1 Adopt
    quadrant-2 Trial
    quadrant-3 Assess
    quadrant-4 Hold

    React: [0.85, 0.80]
    Vue: [0.75, 0.75]
    Svelte: [0.45, 0.85]
    Angular: [0.90, 0.65]
    PostgreSQL: [0.95, 0.85]
    MongoDB: [0.80, 0.70]
    Redis: [0.90, 0.90]
    GraphQL: [0.60, 0.75]
    gRPC: [0.55, 0.88]
    Kubernetes: [0.75, 0.80]
    Serverless: [0.50, 0.72]
    Rust: [0.40, 0.92]
    Go: [0.70, 0.85]
    Deno: [0.30, 0.78]
```

## Timeline - Company History

```mermaid
timeline
    title Company Evolution

    section Founding Era
        2015 : Founded in garage
             : First prototype built
             : Seed funding $500K
        2016 : Launched MVP
             : First 100 users
             : Hired first employee

    section Growth Phase
        2017 : Series A $5M
             : Reached 10K users
             : Opened first office
        2018 : International expansion
             : 100K users milestone
             : Team grew to 50
        2019 : Series B $25M
             : Launched mobile app
             : Enterprise tier added

    section Scale Up
        2020 : Pandemic pivot
             : 1M users reached
             : Remote-first policy
        2021 : Series C $100M
             : Acquired competitor
             : 500 employees

    section Maturity
        2022 : IPO preparation
             : 10M users
             : Global presence
        2023 : Successful IPO
             : New product lines
             : 1000+ employees
        2024 : Market leader
             : AI integration
             : Sustainable growth
```
