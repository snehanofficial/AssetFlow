# AssetFlow — Master Project Plan & Engineering Blueprint

## ROLE

You are a Principal Software Architect, Enterprise Solution Architect, ERP Domain Expert, Product Manager, Staff Software Engineer, UX Architect, Database Architect, Security Engineer, DevOps Engineer, QA Lead, and Hackathon Winning Mentor.

Your task is **NOT** to generate code.

Your task is to produce the **complete engineering specification** for AssetFlow.

This document becomes the **Single Source of Truth (SSOT)** for the entire project.

Every subsequent document, architecture decision, prompt, implementation, database schema, API, frontend, backend, deployment, testing, documentation, presentation, and demo must be derived from this specification.

Think critically.

Validate assumptions.

Compare alternatives.

Explain tradeoffs.

Optimize every decision.

Never write generic documentation.

Everything must directly relate to AssetFlow.

---

# PRIMARY OBJECTIVES

The specification must optimize for:

- Winning the Odoo Hackathon
- Excellent product thinking
- Enterprise-grade architecture
- Production-ready design
- Clean ERP workflows
- Excellent UX
- Scalability
- Maintainability
- Security
- High developer productivity
- Fast implementation by a 2-person team
- Zero unnecessary complexity
- Minimal merge conflicts
- Clean documentation
- Future startup potential

---

# OFFICIAL PROBLEM STATEMENT

Treat the official AssetFlow problem statement as the absolute functional source of truth.

Every requirement in the specification must be traceable to it.

Do NOT remove any mandatory functionality.

You may improve:

- UX
- Architecture
- Performance
- Security
- Developer Experience
- Maintainability
- Analytics
- Reporting
- Optional AI enhancements

Never replace mandatory features with AI features.

---

# DEVELOPMENT CONTEXT

Team Size

- 2 Developers

Hackathon Duration

- 8 Hours

Target

- Complete MVP
- Production-quality architecture
- Enterprise UX
- Fully working demo
- Clean documentation
- Judges should feel this is a real ERP product

---

# TECH STACK

## Frontend

- React 19
- Vite
- JavaScript (NOT TypeScript)
- Tailwind CSS v4
- shadcn/ui
- TanStack Query
- React Router
- React Hook Form
- Zod
- Recharts
- Lucide React

## Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL

## Authentication

- JWT
- Refresh Tokens
- RBAC

## Development

Database

- Local PostgreSQL

Images

- Local Uploads

Storage

- Local File System

## Production

Database

- Neon PostgreSQL

Images

- Cloudinary

Hosting

Frontend

- Vercel

Backend

- Render

---

# ENGINEERING PRINCIPLES

Use:

- SOLID
- DRY
- KISS
- YAGNI
- Clean Architecture
- Feature-first Architecture
- Configuration over Hardcoding
- Environment-based configuration
- Progressive Enhancement
- Mobile Responsive
- Accessibility
- Security First
- Performance First
- Reusability
- Separation of Concerns
- Single Responsibility
- Composition over Inheritance

---

# OUTPUT REQUIREMENTS

Produce an enterprise-level engineering specification.

This is NOT documentation.

This is the blueprint used before implementation.

Every section must include:

- Purpose
- Context
- Reasoning
- Design Decisions
- Alternatives Considered
- Tradeoffs
- Risks
- Implementation Notes
- Dependencies
- Future Improvements

Every decision must be justified.

---

# DOCUMENT STRUCTURE

Generate the following sections in order.

---

## PART 1

Project Overview

1. Executive Summary
2. Vision
3. Mission
4. Product Goals
5. Business Problem
6. Objectives
7. Success Metrics
8. Key Features
9. Business Value
10. Value Proposition
11. Market Validation
12. Competitor Analysis
13. SWOT Analysis
14. Product Positioning
15. Startup Potential
16. Business Model
17. Pricing Strategy
18. Go-To-Market Strategy
19. Future Product Vision
20. Three-Year Roadmap

---

## PART 2

Requirements Engineering

21. Functional Requirements
22. Non-Functional Requirements
23. Assumptions
24. Constraints
25. Risks
26. Risk Mitigation
27. Scope
28. Out of Scope
29. Success Criteria
30. Acceptance Criteria

---

## PART 3

Domain Analysis

31. Domain Model
32. Ubiquitous Language
33. Bounded Contexts
34. Business Entities
35. Entity Relationships
36. Aggregates
37. Domain Events
38. Business Rules
39. Validation Rules
40. Edge Cases
41. Failure Scenarios

---

## PART 4

Users & Permissions

42. User Personas
43. Stakeholders
44. User Roles
45. Role Responsibilities
46. Permission Matrix
47. Action-Level Permissions
48. Authentication Flow
49. Authorization Flow
50. Session Management

---

## PART 5

User Experience

51. Information Architecture
52. Navigation Structure
53. User Flows
54. Journey Maps
55. Screen Inventory
56. Screen Specifications

For EVERY screen include:

- Purpose
- Business Goal
- Components
- Layout
- Widgets
- Forms
- Fields
- Tables
- Filters
- Buttons
- Dialogs
- Search
- Sorting
- Pagination
- Validation
- Permissions
- Business Rules
- Notifications
- APIs
- Database Tables
- Loading State
- Empty State
- Error State
- Success State
- Animations
- Accessibility
- Responsive Behaviour
- Future Improvements

---

## PART 6

Workflow Design

57. Complete Business Workflows
58. Lifecycle Diagrams
59. State Machines
60. State Transition Tables
61. Sequence Diagrams
62. Activity Diagrams
63. Approval Workflows
64. Notification Flows

---

## PART 7

Database Design

65. ER Diagram
66. Database Architecture
67. Table Design
68. Relationships
69. Primary Keys
70. Foreign Keys
71. Indexes
72. Constraints
73. Naming Conventions
74. Enums
75. Audit Fields
76. Soft Delete Strategy
77. History Tables
78. Prisma Schema Planning

---

## PART 8

API Design

79. API Architecture
80. REST Standards
81. Endpoint Catalogue
82. Request Schemas
83. Response Schemas
84. Error Catalogue
85. Validation Strategy
86. API Versioning
87. Pagination Strategy
88. Search Strategy
89. Filtering Strategy
90. Sorting Strategy
91. File Upload Strategy

---

## PART 9

System Architecture

92. High-Level Architecture
93. Frontend Architecture
94. Backend Architecture
95. Folder Structure
96. Feature Modules
97. Shared Components
98. Shared Utilities
99. Services
100. Repositories
101. Controllers
102. Middlewares
103. Configuration Strategy
104. Environment Strategy
105. Storage Abstraction
106. Logging Strategy
107. Error Handling Strategy
108. Background Jobs
109. Notification Architecture

---

## PART 10

Frontend Engineering

110. Design System
111. Design Tokens
112. Color Palette
113. Typography
114. Spacing Scale
115. Border Radius
116. Elevation
117. Motion System
118. Grid System
119. Breakpoints
120. Iconography
121. Dark Theme
122. Light Theme
123. Status Colors
124. Semantic Colors
125. Tailwind Configuration
126. Component Library
127. Reusable Patterns

---

## PART 11

Development Standards

128. Coding Standards
129. Naming Conventions
130. Folder Standards
131. File Naming
132. Import Rules
133. Error Handling Standards
134. Validation Standards
135. API Standards
136. Git Strategy
137. Branch Strategy
138. Merge Strategy
139. Merge Conflict Prevention
140. Conventional Commits
141. Pull Request Standards
142. Code Review Checklist

---

## PART 12

Implementation Strategy

143. MVP Definition
144. Feature Priority Matrix
145. Development Roadmap
146. Hour-by-Hour Timeline
147. Critical Path
148. Task Dependencies
149. Integration Plan

150. Team Split

Generate a perfect split between:

Developer 1

Developer 2

Requirements:

- No merge conflicts
- No ownership ambiguity
- Equal workload
- Parallel development
- Minimal dependencies

Provide:

- Folder ownership
- Module ownership
- API ownership
- Database ownership
- UI ownership
- Shared ownership rules

---

## PART 13

Quality Assurance

151. Testing Strategy
152. Unit Testing Plan
153. Integration Testing
154. Manual Testing
155. Role Testing
156. Security Testing
157. Performance Testing
158. Validation Checklist
159. Bug Tracking Strategy

---

## PART 14

Deployment

160. Local Development Setup
161. Production Deployment
162. Environment Variables
163. Build Process
164. CI/CD Strategy
165. Backup Strategy
166. Disaster Recovery
167. Monitoring
168. Logging
169. Production Checklist

---

## PART 15

Hackathon Strategy

170. MVP Checklist
171. Demo Data
172. Demo Script
173. Presentation Flow
174. Judge Evaluation Strategy
175. Expected Judge Questions
176. Recommended Answers
177. Innovation Highlights
178. Practical AI Enhancements
179. Stretch Goals
180. Time Recovery Strategy

---

## PART 16

Project Management

181. GitHub Project Structure
182. Labels
183. Milestones
184. Issue Templates
185. Task Templates
186. Documentation Structure
187. README Structure
188. Changelog Strategy
189. Technical Debt Register
190. Known Tradeoffs

---

## PART 17

Architecture Decision Records

Create ADRs for every major decision including:

- React over alternatives
- JavaScript over TypeScript
- Express
- Prisma
- PostgreSQL
- Tailwind
- shadcn/ui
- JWT
- Local Storage
- Cloudinary
- Feature-first architecture
- Folder structure
- Storage abstraction
- Notification architecture
- Git strategy

Each ADR must include:

- Context
- Decision
- Alternatives
- Pros
- Cons
- Risks
- Final Justification

---

## PART 18

Appendix

Include:

- Complete glossary
- ERP terminology
- Acronyms
- References
- Official requirements traceability matrix
- Future SaaS roadmap
- AI roadmap
- Scaling roadmap
- Enterprise roadmap

---

# ABSOLUTE RULES

1. Never generate placeholder text.

2. Never write generic explanations.

3. Every section must directly reference AssetFlow.

4. Every business rule must map to workflows.

5. Every workflow must map to APIs.

6. Every API must map to database entities.

7. Every screen must map to APIs.

8. Every notification must originate from business events.

9. Every permission must map to RBAC.

10. Every state transition must include validation.

11. Every entity must include ownership.

12. Every architectural decision must be justified.

13. Every implementation choice must include tradeoffs.

14. Every requirement must be traceable to the official problem statement.

15. Assume this specification will be handed to a new engineering team that must build the entire product without asking further questions.

Optimize for completeness, consistency, implementation readiness, and hackathon execution.