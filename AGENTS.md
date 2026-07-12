# AssetFlow – AI Engineering Guide

> This file defines the engineering standards, architecture principles, development workflow, and coding rules for all AI agents contributing to this repository.

---

# Project

**AssetFlow**

Enterprise Asset & Resource Management Platform

AssetFlow digitizes the complete lifecycle of organizational assets and shared resources through a centralized ERP platform.

The objective is to build a production-quality, enterprise-grade application that satisfies the official hackathon problem statement while demonstrating exceptional software architecture, UI/UX, maintainability, and developer experience.

---

# Primary Objective

Every engineering decision should optimize for:

- Winning the hackathon
- Enterprise-grade quality
- Excellent UX
- Clean architecture
- High maintainability
- Scalability
- Fast development
- Documentation-first development
- AI-augmented development

---

# Source of Truth

The following order defines the hierarchy of truth.

1. Official Problem Statement
2. docs/00-project-plan.md
3. Business Rules
4. Architecture Documents
5. Database Design
6. API Specification
7. Design System
8. Code

Never violate higher-level documentation.

If code conflicts with documentation, documentation wins.

---

# Development Philosophy

Documentation First.

Architecture First.

Business Rules First.

Code Last.

Never implement features before understanding the business workflow.

Never generate code without validating requirements.

---

# Engineering Principles

Always follow

- SOLID
- DRY
- KISS
- YAGNI
- Separation of Concerns
- Single Responsibility Principle
- Feature-first Architecture
- Composition over Inheritance
- Configuration over Hardcoding

---

# Technology Stack

## Frontend

- React 19
- Vite
- JavaScript
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
- Express
- Prisma ORM
- PostgreSQL

## Authentication

- JWT
- Refresh Tokens
- RBAC

## Development

Database

Local PostgreSQL

Storage

Local uploads

## Production

Database

Neon PostgreSQL

Storage

Cloudinary

Frontend

Vercel

Backend

Render

---

# Architecture

Feature-first architecture.

Do NOT organize code by technical layers only.

Preferred

```
features/

assets/

allocation/

booking/

maintenance/

audit/

reports/

notifications/
```

Every feature owns

- UI
- Hooks
- Services
- Validation
- API
- Tests

---

# Folder Ownership

Never create random folders.

Use the approved architecture.

```
client/

server/

docs/

scripts/

database/

uploads/
```

---

# Documentation Rules

Every major implementation must update documentation.

If architecture changes

Update

- project-plan
- architecture
- API
- database
- README

Never allow documentation drift.

---

# Business Rules

Business rules are mandatory.

Never bypass validation.

Examples

- Asset cannot be allocated twice.

- Booking cannot overlap.

- Maintenance requires approval.

- Only Asset Manager can approve maintenance.

- Employee cannot assign roles.

- Audit closes only after verification.

If a feature conflicts with business rules

Reject the implementation.

---

# Design System

Never hardcode

- colors
- spacing
- typography
- radius
- shadows

Everything must use design tokens.

```
styles/

tokens/

colors.js

spacing.js

typography.js

radius.js

shadow.js

animation.js
```

---

# UI Guidelines

Target

Modern SaaS

NOT

Bootstrap Admin Template

Design inspiration

- Linear
- Stripe
- GitHub
- Vercel
- Notion
- Atlassian
- Odoo

Characteristics

- Clean
- Spacious
- Consistent
- Accessible
- Responsive
- Fast

---

# Components

Prefer reusable components.

Never duplicate UI.

Shared components belong in

```
components/ui/

components/common/
```

Feature-specific components belong inside

```
features/assets/

features/booking/
```

---

# State Management

Use

TanStack Query

for server state.

Prefer local component state whenever possible.

Avoid unnecessary global state.

---

# Forms

Always use

React Hook Form

+

Zod

Never manually validate forms.

---

# API Rules

RESTful.

Consistent.

Predictable.

Never change request or response formats without updating documentation.

Every endpoint requires

- validation
- authentication
- authorization
- error handling

---

# Database

Prisma is the source of truth.

Never modify schema without updating

- ER Diagram
- Database Docs
- API Docs

Use

- Foreign Keys
- Constraints
- Indexes
- Enums

Avoid nullable fields unless necessary.

---

# Storage

Development

Local uploads

```
uploads/

assets/

maintenance/

employees/
```

Production

Cloudinary

Storage must use an abstraction layer.

Never reference Cloudinary directly from business logic.

---

# Security

Always

Validate input

Sanitize output

Hash passwords

Protect routes

Check permissions

Never trust frontend validation.

---

# Error Handling

Never swallow errors.

Return structured API responses.

Log unexpected failures.

Show user-friendly messages.

---

# Logging

Log

Authentication

Allocation

Transfers

Maintenance

Audits

Role Changes

Critical Failures

Never log passwords or secrets.

---

# Git Workflow

Main

↓

Develop

↓

Feature Branches

No direct commits to main.

---

# Commit Standard

Conventional Commits

Examples

```
feat(asset): implement allocation workflow

fix(auth): refresh token validation

refactor(api): improve asset service

docs(project): update workflow

style(ui): improve dashboard cards
```

---

# Merge Rules

One owner per feature.

Never edit another feature unless necessary.

Merge frequently.

Avoid long-lived branches.

---

# Coding Standards

Meaningful names.

Small functions.

Single responsibility.

No magic numbers.

No duplicated logic.

Prefer composition.

Prefer early returns.

---

# AI Agent Rules

Before implementing anything

1. Read documentation.

2. Understand business workflow.

3. Validate architecture.

4. Compare alternatives.

5. Explain tradeoffs.

6. Then implement.

Never assume missing requirements.

If ambiguity exists

Ask

or

document assumptions.

---

# AI Output Expectations

Every generated code should

- be production quality
- include validation
- follow architecture
- follow naming conventions
- use reusable components
- include comments only where necessary
- avoid dead code
- avoid duplication

---

# Definition of Done

A feature is complete only if

✅ Business Rules implemented

✅ Validation complete

✅ RBAC enforced

✅ Documentation updated

✅ API documented

✅ UI responsive

✅ Accessibility considered

✅ Error handling added

✅ Loading states added

✅ Empty states added

✅ Tested

✅ No lint errors

✅ No duplicated code

---

# Hackathon Strategy

Priority

1. Mandatory Features

2. Business Rules

3. Excellent UX

4. Clean Architecture

5. Reports

6. Analytics

7. Polish

8. Stretch Features

Never sacrifice core functionality for flashy features.

---

# Guiding Principle

When making decisions, always ask:

> Does this make AssetFlow feel like a real enterprise ERP product?

If the answer is no,

rethink the implementation.