# Sistema Kids - Web Application

## Overview

Sistema Kids is a comprehensive web application designed for managing children's ministry activities in religious organizations. The system provides tools for tracking attendance, meditation deliveries, bible verse memorization, communication with guardians, and generating reports. Built with React (frontend) and Express (backend), it features a modern UI with shadcn/ui components and uses PostgreSQL with Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API architecture
- **Authentication**: Replit OIDC integration with session-based authentication
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple
- **Middleware**: Express middleware for logging, JSON parsing, and error handling

### Data Storage Solutions
- **Database**: PostgreSQL as primary database
- **ORM**: Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless database with connection pooling
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Shared Types**: Common TypeScript types between frontend and backend

### Authentication and Authorization
- **Provider**: Replit OIDC (OpenID Connect) authentication
- **Strategy**: Passport.js with OpenID Connect strategy
- **Session Management**: Server-side sessions stored in PostgreSQL
- **Authorization**: Role-based access control (Admin, Leader, Assistant)
- **Security**: HTTP-only cookies with secure session configuration

### External Dependencies
- **Database Hosting**: Neon serverless PostgreSQL
- **Authentication Provider**: Replit OIDC service
- **UI Components**: Radix UI component library
- **Form Validation**: Zod schema validation
- **Date Handling**: date-fns for internationalization (Brazilian Portuguese)
- **Styling**: Tailwind CSS with custom theme variables
- **Development Tools**: Replit-specific plugins for development environment

### Core Application Features
- **Child Management**: CRUD operations for children with guardian relationships
- **Class Management**: Organization of children into classes/groups
- **Attendance Tracking**: Separate tracking for regular classes and worship services
- **Meditation Tracking**: Weekly meditation delivery status and evidence uploads
- **Bible Verse Memorization**: Tracking progress on scripture memorization
- **Note Taking**: Categorized notes with attention levels and reminders
- **Message Templates**: Pre-defined message templates with variable substitution
- **WhatsApp Integration**: Deep linking for quick message sending
- **Reporting System**: Comprehensive reports with Excel export capabilities

### Data Model Architecture
The application uses a relational data model with the following key entities:
- Users (authentication and role management)
- Children and Guardians (many-to-many relationship)
- Classes and Class Meetings (organizational structure)
- Attendance records (separate for classes and worship)
- Meditation weeks and delivery tracking
- Bible verses and memorization progress
- Notes with categorization and priority levels
- Message templates and send history
- Audit logs for data tracking

### Development and Deployment
- **Development**: Vite dev server with hot module replacement
- **Production Build**: Vite build + esbuild for server bundling
- **Environment**: Replit-hosted with custom development tooling
- **Database Migrations**: Drizzle Kit push commands for schema updates
- **Type Safety**: Shared TypeScript types and Zod schemas across full stack