# Enterprise Architecture Maturity Assessment Platform

A comprehensive full-stack application for evaluating enterprise architecture maturity across governance, security, networking, operations, and architectural domains.

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 18 and TypeScript
- **Backend**: Node.js/Express with TypeScript (API routes)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: JWT with role-based access control
- **Containerization**: Docker and Docker Compose
- **Testing**: Jest, Cypress for E2E
- **Documentation**: Swagger/OpenAPI

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- PostgreSQL 15+
- Docker and Docker Compose (optional)

### Installation

1. **Clone and navigate to the project**

   ```bash
   git clone <repository-url>
   cd maturity
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your database credentials
   ```

4. **Database Setup**

   **Option A: Using Docker (Recommended)**

   ```bash
   npm run docker:up
   ```

   **Option B: Local PostgreSQL**
   - Ensure PostgreSQL is running
   - Create database: `createdb maturity_assessment`

5. **Database Migration and Seeding**

   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

6. **Start Development Server**

   ```bash
   npm run dev
   ```

7. **Visit the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 📊 Features

### Core Functionality

- ✅ **Dynamic Wizard-based Assessments** - Configurable maturity evaluation workflows
- ✅ **Real-time Scoring Algorithms** - Weighted scoring with configurable formulas
- ✅ **Comprehensive Reporting** - Advanced analytics and trend analysis
- ✅ **Audit Trail & Compliance** - Complete tracking of all assessment activities
- ✅ **Multi-tenant Support** - Organization-based isolation
- ✅ **Role-based Access Control** - Admin, Assessor, and Viewer roles
- ✅ **AWS Bedrock AI Integration** - Claude 3.5 Sonnet for contextual metric guidance
- ✅ **LLM-Powered Multi-Agent System** - Three specialized AI agents with intelligent reasoning
- ✅ **AI-Powered Assessment Interviews** - Conversational assessment completion via AI interviewer

### AI Features 🤖 **NEW: LLM-Powered!**

#### 🎤 **AI Assessment Interviewer** (NEW!)

- **Conversational Assessments** - Complete assessments through natural dialogue
- **Standalone Interview Page** - Dedicated `/ai-interview` interface with assessment selection
- **Natural Language Parsing** - Understands responses like "Level 2" or "We're at managed"
- **Guided Experience** - AI asks questions one at a time with context and examples
- **Progress Tracking** - Real-time completion status and milestones
- **Quick Start:** See `AI_INTERVIEWER_QUICKSTART.md` | **Full Docs:** See `AI_INTERVIEWER_DOCUMENTATION.md`

#### 🧠 **Two-Agent Analysis System**

- **LLM-Based Agent Coordination** - Claude 3.5 Sonnet intelligently routes requests and reasons about user intent
- **🤖 Assessment Coach Agent** - Guides users through assessments, explains metrics, provides examples
- **📊 Scoring Analyst Agent** - Analyzes results, identifies weak areas, generates recommendations
- **💬 Natural Language Understanding** - Talk to agents naturally, no commands needed
- **🔧 Tool Calling System** - Claude automatically decides which tools to use for complex questions
- **🎯 Context-Aware Responses** - Maintains conversation history and provides personalized guidance
- **Quick Start:** See `LLM_AGENT_QUICKSTART.md` | **Full Docs:** See `LLM_AGENT_DOCUMENTATION.md`

#### ✨ **Bedrock Integration**

- Metric-specific AI help using Claude 3.5 Sonnet
- Knowledge Base support for domain expertise
- Direct API and AWS SDK dual-mode support

### Assessment Categories

- **Governance** - Architecture standards and governance frameworks
- **Security** - Security architecture and compliance measures
- **Networking** - Network architecture and connectivity patterns
- **Operations** - Operational processes and automation
- **Architecture** - Technical and solution architecture practices

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
npm run test:e2e        # Run E2E tests
npm run test:e2e:open   # Open Cypress test runner

# Database
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with sample data
npm run db:studio       # Open Prisma Studio

# Docker
npm run docker:up       # Start services with Docker Compose
npm run docker:down     # Stop Docker services
npm run docker:build    # Build Docker images
```

### Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable React components
│   │   ├── providers/       # Context providers
│   │   └── ui/              # UI components
│   ├── lib/                 # Utility libraries
│   ├── types/               # TypeScript type definitions
│   ├── hooks/               # Custom React hooks
│   └── utils/               # Utility functions
├── prisma/                  # Database schema and migrations
├── public/                  # Static assets
├── .github/                 # GitHub configuration
└── docker-compose.yml      # Docker services configuration
```

## 🗄️ Database Schema

The platform uses a dynamic configuration system with the following core entities:

- **Organizations** - Multi-tenant organization support
- **Maturity Pillars** - Configurable assessment categories
- **Assessment Topics** - Dynamic topic configuration per pillar
- **Metrics** - Flexible metric definitions with various types
- **Assessment Targets** - Platforms, systems, or applications being assessed
- **Assessment Sessions** - Wizard state management and progress tracking
- **Assessment Results** - Captured assessment data with evidence
- **Audit Logs** - Complete audit trail for compliance

## 🔐 Authentication & Security

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Session management with configurable timeouts
- API rate limiting
- Input sanitization and validation
- Comprehensive audit logging

## 🧪 Testing Strategy

- **Unit Tests**: Jest with React Testing Library
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Cypress for critical user workflows
- **Performance Tests**: Load testing for concurrent users
- **Security Tests**: OWASP compliance testing

## 📈 Maturity Scoring Algorithm

The platform uses a sophisticated weighted scoring algorithm:

1. **Metric-level scoring** - Individual metric values (1-5 scale, boolean, percentage, count)
2. **Topic-level aggregation** - Weighted average of metric scores
3. **Pillar-level calculation** - Weighted sum of topic scores
4. **Overall maturity score** - Weighted average across all pillars

Maturity levels:

- **Level 1**: Initial (0-1.5) - Ad-hoc processes
- **Level 2**: Developing (1.5-2.5) - Basic processes in place
- **Level 3**: Defined (2.5-3.5) - Documented and standardized
- **Level 4**: Managed (3.5-4.5) - Measured and controlled
- **Level 5**: Optimized (4.5-5.0) - Continuously improving

## 🐳 Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:

- **app**: Next.js application (ports 3000, 3001)
- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation in `/docs`
- Review the API documentation at `/api/docs` (when running)

---

**Built with ❤️ for enterprise architecture excellence**
