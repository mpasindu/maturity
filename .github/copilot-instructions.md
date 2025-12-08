# Enterprise Architecture Maturity Assessment Platform

This workspace contains a comprehensive full-stack application for evaluating enterprise architecture maturity with the following tech stack:

## Architecture

- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Frontend**: React/Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: JWT with role-based access control
- **Containerization**: Docker and Docker Compose
- **Testing**: Jest, Cypress for E2E
- **Documentation**: Swagger/OpenAPI

## Key Features

- Dynamic wizard-based maturity assessments
- Real-time scoring algorithms with configurable weights
- Comprehensive reporting and analytics
- Audit trail and compliance tracking
- Multi-tenant organization support
- Role-based access control (Admin, Assessor, Viewer)

## Development Guidelines

- Use TypeScript throughout the codebase
- Follow REST API best practices with proper error handling
- Implement comprehensive input validation
- Use proper database transactions for complex operations
- Include unit tests for all business logic
- Follow security best practices (OWASP guidelines)
- Implement proper logging and monitoring

## Database Schema

The platform uses a dynamic configuration system allowing runtime modification of maturity pillars, assessment topics, and metrics with proper versioning and audit trails.
