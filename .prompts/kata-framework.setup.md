# KATA Framework Setup

> Setup the KATA (Komponent Action Test Architecture) framework for test automation from scratch.

---

## Purpose

Set up the complete KATA test automation framework by downloading core files from the template repository and generating domain-specific components.

**Use this prompt when:**
- Starting test automation in a new project
- Setting up KATA in an existing project without automation
- Reconstructing KATA framework after cloning a project

**Prerequisites:**
- Project uses TypeScript
- Bun runtime installed (`curl -fsSL https://bun.sh/install | bash`)
- Git initialized in project

---

## Template Repository

All core KATA files are available at:
```
https://github.com/upex-galaxy/kata-playwright-template
Branch: template
```

**Download method:**
```bash
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/[PATH]" -o [PATH]
```

---

## Workflow

### Phase 0: Detection & Context Gathering

**Step 1: Check existing KATA files**

```bash
# Run these checks
ls tests/components/TestContext.ts 2>/dev/null && echo "✓ TestContext exists"
ls tests/components/api/ApiBase.ts 2>/dev/null && echo "✓ ApiBase exists"
ls tests/components/ui/UiBase.ts 2>/dev/null && echo "✓ UiBase exists"
ls tests/utils/decorators.ts 2>/dev/null && echo "✓ Decorators exist"
ls playwright.config.ts 2>/dev/null && echo "✓ Playwright config exists"
ls .context/guidelines/tae/KATA-AI-GUIDE.md 2>/dev/null && echo "✓ TAE Guidelines exist"
```

**Step 2: Determine project context**

Before proceeding, identify:
- Project name/prefix (e.g., `PROJ`, `MYM`, `SHOP`)
- Main domain entities (e.g., Users, Products, Orders)
- API base URL (from environment or documentation)
- UI base URL (from environment or documentation)

**Ask user:**
```
What is your project context?
1. Project prefix for test IDs (e.g., PROJ-UI-001): ___
2. Main domain entities to automate: ___
3. API base URL: ___
4. UI base URL: ___
```

---

### Phase 1: Install Dependencies

```bash
# Core Playwright
bun add -d @playwright/test

# Install browsers
bunx playwright install chromium

# Allure reporting
bun add -d allure-playwright allure-commandline

# TypeScript & Linting
bun add -d typescript @types/node
bun add -d eslint @eslint/js typescript-eslint globals

# Dotenv for configuration
bun add -d dotenv
```

---

### Phase 2: Create Directory Structure

```bash
# Create all required directories
mkdir -p tests/components/api
mkdir -p tests/components/ui
mkdir -p tests/components/preconditions
mkdir -p tests/e2e
mkdir -p tests/integration
mkdir -p tests/data/fixtures
mkdir -p tests/data/downloads
mkdir -p tests/data/uploads
mkdir -p tests/utils
mkdir -p config
mkdir -p api
mkdir -p .context/guidelines/tae
mkdir -p .context/PBI
mkdir -p .github/workflows

# Create .gitkeep files for empty directories
touch tests/data/downloads/.gitkeep
touch tests/data/uploads/.gitkeep
touch api/.gitkeep
```

---

### Phase 3: Download Core Framework Files

**IMPORTANT:** Only download files that DON'T already exist.

#### Core Utilities (tests/utils/)

```bash
# Decorators - @atc pattern implementation
[ ! -f tests/utils/decorators.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/utils/decorators.ts" \
  -o tests/utils/decorators.ts

# Kata Reporter - Allure integration
[ ! -f tests/utils/KataReporter.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/utils/KataReporter.ts" \
  -o tests/utils/KataReporter.ts

# TMS Sync - Jira/X-Ray integration
[ ! -f tests/utils/tmsSync.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/utils/tmsSync.ts" \
  -o tests/utils/tmsSync.ts
```

#### Base Components (tests/components/)

```bash
# TestContext - Core utilities layer
[ ! -f tests/components/TestContext.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/components/TestContext.ts" \
  -o tests/components/TestContext.ts

# ApiBase - HTTP client wrapper
[ ! -f tests/components/api/ApiBase.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/components/api/ApiBase.ts" \
  -o tests/components/api/ApiBase.ts

# UiBase - Playwright page wrapper
[ ! -f tests/components/ui/UiBase.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/components/ui/UiBase.ts" \
  -o tests/components/ui/UiBase.ts
```

#### Fixtures (tests/components/)

```bash
# TestFixture - Extended test object
[ ! -f tests/components/TestFixture.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/components/TestFixture.ts" \
  -o tests/components/TestFixture.ts

# ApiFixture - API DI container
[ ! -f tests/components/ApiFixture.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/components/ApiFixture.ts" \
  -o tests/components/ApiFixture.ts

# UiFixture - UI DI container
[ ! -f tests/components/UiFixture.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/components/UiFixture.ts" \
  -o tests/components/UiFixture.ts
```

#### Global Setup/Teardown

```bash
[ ! -f tests/globalSetup.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/globalSetup.ts" \
  -o tests/globalSetup.ts

[ ! -f tests/globalTeardown.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/globalTeardown.ts" \
  -o tests/globalTeardown.ts
```

---

### Phase 4: Download Configuration Files

```bash
# Playwright configuration
[ ! -f playwright.config.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/playwright.config.ts" \
  -o playwright.config.ts

# TypeScript configuration
[ ! -f tsconfig.json ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tsconfig.json" \
  -o tsconfig.json

# ESLint configuration
[ ! -f eslint.config.js ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/eslint.config.js" \
  -o eslint.config.js

# Environment variables
[ ! -f config/variables.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/config/variables.ts" \
  -o config/variables.ts

# Environment example
[ ! -f .env.example ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/.env.example" \
  -o .env.example
```

---

### Phase 5: Download TAE Guidelines

**These files provide context for AI-assisted development:**

```bash
# Main AI guide
[ ! -f .context/guidelines/tae/KATA-AI-GUIDE.md ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/.context/guidelines/tae/KATA-AI-GUIDE.md" \
  -o .context/guidelines/tae/KATA-AI-GUIDE.md

# Architecture documentation
[ ! -f .context/guidelines/tae/kata-architecture.md ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/.context/guidelines/tae/kata-architecture.md" \
  -o .context/guidelines/tae/kata-architecture.md

# Automation standards
[ ! -f .context/guidelines/tae/automation-standards.md ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/.context/guidelines/tae/automation-standards.md" \
  -o .context/guidelines/tae/automation-standards.md

# API setup guide
[ ! -f .context/guidelines/tae/api-setup-guide.md ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/.context/guidelines/tae/api-setup-guide.md" \
  -o .context/guidelines/tae/api-setup-guide.md

# Test data management
[ ! -f .context/guidelines/tae/test-data-management.md ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/.context/guidelines/tae/test-data-management.md" \
  -o .context/guidelines/tae/test-data-management.md

# TMS integration
[ ! -f .context/guidelines/tae/tms-integration.md ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/.context/guidelines/tae/tms-integration.md" \
  -o .context/guidelines/tae/tms-integration.md

# CI/CD integration
[ ! -f .context/guidelines/tae/ci-cd-integration.md ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/.context/guidelines/tae/ci-cd-integration.md" \
  -o .context/guidelines/tae/ci-cd-integration.md

# TAE README
[ ! -f .context/guidelines/tae/README.md ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/.context/guidelines/tae/README.md" \
  -o .context/guidelines/tae/README.md
```

---

### Phase 6: Download Scripts

```bash
# KATA Manifest - Extracts ATCs from codebase
[ ! -f scripts/kata-manifest.ts ] && \
mkdir -p scripts && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/scripts/kata-manifest.ts" \
  -o scripts/kata-manifest.ts

# OpenAPI Sync - Generates API types
[ ! -f scripts/sync-openapi.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/scripts/sync-openapi.ts" \
  -o scripts/sync-openapi.ts
```

---

### Phase 7: Download CI/CD Workflows (Optional)

```bash
# Main Playwright workflow
[ ! -f .github/workflows/playwright.yml ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/.github/workflows/playwright.yml" \
  -o .github/workflows/playwright.yml

# E2E Tests workflow
[ ! -f .github/workflows/e2e.yml ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/.github/workflows/e2e.yml" \
  -o .github/workflows/e2e.yml

# Integration Tests workflow
[ ! -f .github/workflows/integration.yml ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/.github/workflows/integration.yml" \
  -o .github/workflows/integration.yml

# Smoke Tests workflow
[ ! -f .github/workflows/smoke.yml ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/.github/workflows/smoke.yml" \
  -o .github/workflows/smoke.yml

# Sanity Tests workflow
[ ! -f .github/workflows/sanity.yml ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/.github/workflows/sanity.yml" \
  -o .github/workflows/sanity.yml

# Regression Tests workflow
[ ! -f .github/workflows/regression.yml ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/.github/workflows/regression.yml" \
  -o .github/workflows/regression.yml
```

---

### Phase 8: Download Examples (Optional)

**For reference on patterns - ask user before downloading:**

```bash
# Example API component
[ ! -f tests/components/api/ExampleApi.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/components/api/ExampleApi.ts" \
  -o tests/components/api/ExampleApi.ts

# Example UI component
[ ! -f tests/components/ui/ExamplePage.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/components/ui/ExamplePage.ts" \
  -o tests/components/ui/ExamplePage.ts

# Example preconditions
[ ! -f tests/components/preconditions/ExampleFlows.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/components/preconditions/ExampleFlows.ts" \
  -o tests/components/preconditions/ExampleFlows.ts

# Example E2E test
mkdir -p tests/e2e/example && \
[ ! -f tests/e2e/example/example.test.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/e2e/example/example.test.ts" \
  -o tests/e2e/example/example.test.ts

# Example Integration test
[ ! -f tests/integration/example.test.ts ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/integration/example.test.ts" \
  -o tests/integration/example.test.ts

# Example fixture data
[ ! -f tests/data/fixtures/example.json ] && \
curl -sL "https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template/tests/data/fixtures/example.json" \
  -o tests/data/fixtures/example.json
```

---

### Phase 9: Update package.json

**Add or merge these scripts into package.json:**

```json
{
  "scripts": {
    "test": "playwright test",
    "test:e2e": "playwright test tests/e2e --project=chromium",
    "test:integration": "playwright test tests/integration --project=integration",
    "test:smoke": "playwright test --grep @smoke",
    "test:sanity": "playwright test --grep @sanity",
    "test:regression": "playwright test --grep @regression",
    "test:headed": "playwright test --headed",
    "test:debug": "PWDEBUG=1 playwright test",
    "test:report": "playwright show-report",
    "allure:generate": "allure generate allure-results --clean -o allure-report",
    "allure:open": "allure open allure-report",
    "allure:serve": "allure serve allure-results",
    "kata:manifest": "bun scripts/kata-manifest.ts",
    "api:sync": "bun scripts/sync-openapi.ts",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

---

### Phase 10: Generate Domain-Specific Components

**IMPORTANT:** This is where AI generates project-specific code based on context.

#### For each domain entity (e.g., User, Product, Order):

**1. Create API Component:**
```typescript
// tests/components/api/{Entity}Api.ts
import { ApiBase } from './ApiBase';
import { atc } from '@utils/decorators';

export class {Entity}Api extends ApiBase {
  // Endpoints
  private endpoints = {
    list: '/api/{entities}',
    get: (id: string) => `/api/{entities}/${id}`,
    create: '/api/{entities}',
    update: (id: string) => `/api/{entities}/${id}`,
    delete: (id: string) => `/api/{entities}/${id}`,
  };

  // ATCs
  @atc('PROJ-API-001')
  async create{Entity}(data: Create{Entity}Dto) {
    return this.post<{Entity}Response, Create{Entity}Dto>(
      this.endpoints.create,
      data
    );
  }

  @atc('PROJ-API-002')
  async get{Entity}ById(id: string) {
    return this.get<{Entity}Response>(this.endpoints.get(id));
  }
}
```

**2. Create UI Component:**
```typescript
// tests/components/ui/{Entity}Page.ts
import { UiBase } from './UiBase';
import { atc } from '@utils/decorators';

export class {Entity}Page extends UiBase {
  // Locators (inline, not separate file)
  readonly titleInput = () => this.page.getByTestId('{entity}-title');
  readonly submitButton = () => this.page.getByRole('button', { name: 'Submit' });
  readonly successMessage = () => this.page.getByTestId('success-message');

  // Navigation
  async goto() {
    await this.page.goto('/{entities}/new');
  }

  // ATCs
  @atc('PROJ-UI-001')
  async create{Entity}Successfully(data: {Entity}FormData) {
    await this.goto();
    await this.titleInput().fill(data.title);
    await this.submitButton().click();
    await expect(this.successMessage()).toBeVisible();
  }
}
```

**3. Update Fixtures to include new components:**

Add to `ApiFixture.ts`:
```typescript
{entity}Api: async ({ context }, use) => {
  await use(new {Entity}Api(context));
},
```

Add to `UiFixture.ts`:
```typescript
{entity}Page: async ({ page }, use) => {
  await use(new {Entity}Page(page));
},
```

---

### Phase 11: Create Environment File

```bash
# Copy example to .env if not exists
[ ! -f .env ] && cp .env.example .env

# User should update values
echo "Please update .env with your actual values"
```

---

### Phase 12: Validate Setup

```bash
# Run TypeScript compilation check
bunx tsc --noEmit

# Run linting
bun run lint

# Run a simple test to verify setup
bun run test --grep "@smoke" || bun run test tests/e2e/example
```

---

## Quick Setup Script

**For rapid deployment, run all phases at once:**

```bash
#!/bin/bash
# kata-setup.sh - Run this to set up KATA framework

REPO="https://raw.githubusercontent.com/upex-galaxy/kata-playwright-template/template"

# Create directories
mkdir -p tests/{components/{api,ui,preconditions},e2e,integration,data/{fixtures,downloads,uploads},utils}
mkdir -p config api scripts .context/guidelines/tae .context/PBI .github/workflows

# Download core files
for file in \
  "tests/utils/decorators.ts" \
  "tests/utils/KataReporter.ts" \
  "tests/utils/tmsSync.ts" \
  "tests/components/TestContext.ts" \
  "tests/components/api/ApiBase.ts" \
  "tests/components/ui/UiBase.ts" \
  "tests/components/TestFixture.ts" \
  "tests/components/ApiFixture.ts" \
  "tests/components/UiFixture.ts" \
  "tests/globalSetup.ts" \
  "tests/globalTeardown.ts" \
  "config/variables.ts" \
  "playwright.config.ts" \
  "tsconfig.json" \
  "eslint.config.js" \
  ".env.example"
do
  [ ! -f "$file" ] && curl -sL "$REPO/$file" -o "$file" && echo "✓ Downloaded $file"
done

# Download TAE guidelines
for file in \
  ".context/guidelines/tae/KATA-AI-GUIDE.md" \
  ".context/guidelines/tae/kata-architecture.md" \
  ".context/guidelines/tae/automation-standards.md" \
  ".context/guidelines/tae/api-setup-guide.md" \
  ".context/guidelines/tae/test-data-management.md" \
  ".context/guidelines/tae/tms-integration.md" \
  ".context/guidelines/tae/ci-cd-integration.md" \
  ".context/guidelines/tae/README.md"
do
  [ ! -f "$file" ] && curl -sL "$REPO/$file" -o "$file" && echo "✓ Downloaded $file"
done

echo "KATA Framework setup complete!"
```

---

## File Summary

### Downloaded from Template (DO NOT modify without need)
| File                              | Purpose                       |
| --------------------------------- | ----------------------------- |
| `tests/utils/decorators.ts`       | @atc decorator implementation |
| `tests/utils/KataReporter.ts`     | Allure reporter integration   |
| `tests/utils/tmsSync.ts`          | TMS synchronization           |
| `tests/components/TestContext.ts` | Base utilities layer          |
| `tests/components/api/ApiBase.ts` | HTTP client wrapper           |
| `tests/components/ui/UiBase.ts`   | Playwright page wrapper       |
| `tests/components/*Fixture.ts`    | DI containers                 |
| `playwright.config.ts`            | Playwright configuration      |
| `config/variables.ts`             | Environment configuration     |

### Generated Per Project (AI creates these)
| File                                            | Purpose                |
| ----------------------------------------------- | ---------------------- |
| `tests/components/api/{Entity}Api.ts`           | Domain API components  |
| `tests/components/ui/{Entity}Page.ts`           | Domain UI components   |
| `tests/components/preconditions/{Flow}Flows.ts` | Reusable flows         |
| `tests/e2e/{feature}/*.test.ts`                 | E2E test files         |
| `tests/integration/{feature}.test.ts`           | Integration test files |
| `tests/data/fixtures/*.json`                    | Test data              |

---

## KATA Guidelines Reference

After setup, always consult these guidelines:

| Document                  | When to Read         |
| ------------------------- | -------------------- |
| `KATA-AI-GUIDE.md`        | Before any KATA work |
| `automation-standards.md` | When writing tests   |
| `kata-architecture.md`    | Understanding layers |
| `api-setup-guide.md`      | Setting up API tests |
| `test-data-management.md` | Managing test data   |

**Location:** `.context/guidelines/tae/`

---

## Post-Setup Checklist

- [ ] Dependencies installed (`bun install`)
- [ ] Browsers installed (`bunx playwright install`)
- [ ] Directory structure created
- [ ] Core framework files downloaded
- [ ] Configuration files in place
- [ ] TAE guidelines downloaded
- [ ] `.env` file configured
- [ ] TypeScript compiles without errors
- [ ] Sample test runs successfully
- [ ] Domain-specific components created
- [ ] Fixtures updated with new components
