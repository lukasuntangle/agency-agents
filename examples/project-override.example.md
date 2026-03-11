# Project Override Example

Place this file as `.agency/overrides.yml` in your project root to customize agents for your stack.

```yaml
# .agency/overrides.yml
# Project-specific agent customizations

project:
  name: "My SaaS App"
  stack:
    frontend: "Next.js 14 + React 18"
    backend: "Node.js + Express"
    database: "PostgreSQL + Prisma"
    styling: "Tailwind CSS"
    testing: "Vitest + Playwright"

# Override specific agents
agents:
  frontend-developer:
    tools:
      styling: "Tailwind CSS with @apply for components"
      state: "Zustand for client state, TanStack Query for server"
      forms: "React Hook Form + Zod"
    rules:
      - "Use design tokens from @/styles/tokens.css"
      - "All components go in @/components/{feature}/"
      - "Use 'use client' only when needed"
    patterns:
      component: |
        // Standard component structure for this project
        import { cn } from '@/lib/utils'

        interface Props {
          className?: string
        }

        export function Component({ className }: Props) {
          return <div className={cn('base-styles', className)} />
        }

  backend-architect:
    tools:
      orm: "Prisma"
      queue: "BullMQ"
      cache: "Redis via Upstash"
    rules:
      - "All endpoints in @/app/api/{resource}/route.ts"
      - "Use Zod schemas from @/lib/validations/"
      - "Transactions via prisma.$transaction()"
    patterns:
      api-route: |
        // Standard API route for this project
        import { NextResponse } from 'next/server'
        import { z } from 'zod'
        import { prisma } from '@/lib/prisma'

        const schema = z.object({ ... })

        export async function POST(req: Request) {
          const body = schema.parse(await req.json())
          const result = await prisma.resource.create({ data: body })
          return NextResponse.json(result)
        }

  code-reviewer:
    checklist:
      - "No console.log statements"
      - "All async functions have error boundaries"
      - "Prisma queries use select/include to avoid over-fetching"
      - "API routes validate input with Zod"
      - "Components under 150 lines"

  security-engineer:
    requirements:
      - "All user input sanitized via Zod"
      - "Rate limiting on all public endpoints"
      - "CSRF protection via Next.js defaults"
      - "No secrets in client bundles"

# Team-specific collaboration rules
collaboration:
  # Who reviews what
  reviews:
    frontend: ["frontend-developer", "accessibility-auditor"]
    backend: ["backend-architect", "security-engineer"]
    database: ["backend-architect", "performance-benchmarker"]

  # Required approvals before merge
  required_checks:
    - "lint"
    - "typecheck"
    - "test"
    - "build"

# Project-specific decision overrides
decisions:
  # Override default choices from agent decision trees
  state-management: "Zustand"  # Instead of asking
  api-style: "REST"            # Instead of asking
  database: "PostgreSQL"       # Instead of asking
```

## How Agents Use Overrides

When an agent activates, it checks for `.agency/overrides.yml`:

1. **Tools** - Uses project-specified tools instead of asking
2. **Rules** - Applies project-specific constraints
3. **Patterns** - Uses project code templates
4. **Decisions** - Skips decision trees when answer is predetermined

## Example: Frontend Developer with Overrides

Without override (agent asks):
```
Which styling approach should I use?
├── Tailwind
├── CSS Modules
├── styled-components
└── Other
```

With override (agent knows):
```
Using Tailwind CSS with @apply for components (per project config).
```

## Minimal Override

For simple projects, just specify the stack:

```yaml
# .agency/overrides.yml
project:
  stack:
    frontend: "React + Vite"
    styling: "Tailwind"
    testing: "Vitest"
```

Agents will infer reasonable defaults from the stack.
