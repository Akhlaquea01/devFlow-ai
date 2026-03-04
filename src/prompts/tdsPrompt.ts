export function buildTdsPrompt(prdPath: string, codebaseContext: string): string {
  return `You are a **Senior Software Architect** acting as my peer collaborator. Create a detailed Technical Design Specification based on the attached PRD.

@${prdPath}

**Codebase Context**:
${codebaseContext}

---

## Context

The PRD (attached above) defines the business requirements. Your job is to translate **every** PRD requirement into a concrete technical design. Every functional requirement (FR-xxx) must have a corresponding technical specification.

---

## Generate the Following Sections

### 1. PRD → Technical Requirements Mapping
Create a traceability matrix:

| PRD Req ID | PRD Title | Technical Approach | TDS Section |
|---|---|---|---|
| FR-001 | ... | ... | §3.2 |

⚠️ Flag any PRD requirements that are ambiguous or under-specified.

### 2. System Architecture
- High-level architecture diagram (Mermaid syntax)
- Component breakdown with responsibilities
- Communication patterns (sync/async, event-driven, REST/gRPC)
- Data flow diagram for primary user workflows
- Deployment architecture (local, cloud, hybrid)

### 3. Technology Stack
| Layer | Technology | Justification |
|---|---|---|
| Language | ... | ... |
| Framework | ... | ... |
| Database | ... | ... |
| Messaging | ... | ... |
| Caching | ... | ... |

### 4. Database Design
- Entity-Relationship diagram (Mermaid syntax)
- Table/collection schemas with field types and constraints
- Indexes for query performance
- Migration strategy (up/down migrations)
- Data seeding approach
- Map each entity to PRD requirements

### 5. API Design
For each endpoint:
- **Method + Path**: \\\`POST /api/v1/resource\\\`
- **Purpose**: What PRD requirement it fulfills
- **Request Schema**: JSON with types and validation
- **Response Schema**: Success and error responses
- **Auth**: Required permissions/roles
- **Rate Limiting**: Applicable limits
- **Idempotency**: Strategy for safe retries

### 6. Component Design
For each major module/component:
- **Responsibility**: Single Responsibility description
- **Interface**: Public API / Props / Inputs
- **Internal Logic**: Key algorithms and decision trees
- **Dependencies**: What it depends on
- **Error Handling**: Failure modes and recovery
- **State Management**: How state is managed

### 7. Third-Party Integrations
For each external service:
- Service name and purpose
- Authentication method
- Key API endpoints used
- Error handling and retry strategy
- Rate limits and quota management
- Fallback behavior if service is unavailable
- Cost implications

### 8. Security Design
- Authentication flow (sequence diagram)
- Authorization model (RBAC, ABAC, or similar)
- Data encryption (at rest, in transit)
- Input validation strategy
- Secret management approach
- OWASP Top 10 mitigation
- Compliance requirements (GDPR, SOC2, etc.)

### 9. Performance Design
- Performance budgets and SLA targets
- Caching strategy (layers, TTL, invalidation)
- Database query optimization approach
- Lazy loading and code splitting strategy
- CDN and asset optimization
- Load testing approach and targets

### 10. Error Handling & Observability
- Error classification (user errors, system errors, transient)
- Logging strategy (levels, structured logging, correlation IDs)
- Monitoring and alerting (metrics, dashboards)
- Distributed tracing approach
- Health check endpoints

### 11. Testing Strategy
| Test Type | Scope | Tools | Coverage Target |
|---|---|---|---|
| Unit | ... | ... | 80%+ |
| Integration | ... | ... | ... |
| E2E | ... | ... | ... |
| Performance | ... | ... | ... |

### 12. Risk Assessment
| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|
| ... | High/Med/Low | High/Med/Low | ... | ... |

- Rollback strategy for each major component
- Backward compatibility approach
- Data migration rollback plan

---

## Output Rules

- Use Mermaid for all diagrams
- Every technical decision must reference the PRD requirement it addresses
- Include code-level details: class names, function signatures, file paths
- Flag unknowns with \\\`🔴 DECISION NEEDED\\\` markers
- Provide alternatives for major design decisions with trade-off analysis
- This TDS will be the direct input for DIG creation

---

**Output Format**: Detailed Markdown TDS with diagrams, schemas, and full traceability to PRD.`;
}

