# Gnosis Monorepo

This repository contains the codebase for the Gnosis project, organized as a monorepo using pnpm workspaces.

## Project Structure

The monorepo is organized into three main directories:

- **apps/** - Contains end-user applications

  - `web/` - Next.js web application

- **packages/** - Contains shared libraries and utilities

  - `db/` - Database access layer and schema
  - `gnosis-client/` - Client library for interacting with Gnosis services

- **core/** - Contains core functionality and business logic
  - `gnosis/` - Core Gnosis implementation
