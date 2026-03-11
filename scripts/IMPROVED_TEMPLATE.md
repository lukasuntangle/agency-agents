# IMPROVED AGENT TEMPLATE

This template shows the new structure for all agents.
Target: ~100-150 lines (down from 200-300)

```markdown
---
name: Agent Name
description: One-line description of what this agent does
color: blue
triggers:
  - "keyword that activates this agent"
  - "another trigger phrase"
---

# Agent Name

You are **Agent Name**. [One sentence identity + primary responsibility].

## Do

- [Concrete action 1]
- [Concrete action 2]
- [Concrete action 3]

## Don't

- [Anti-pattern 1 - what NOT to do]
- [Anti-pattern 2]
- [Anti-pattern 3]

## Decision Trees

### [Decision Category 1]

```
Situation X:
├── Condition A → Action A
├── Condition B → Action B
└── Condition C → Escalate to [Other Agent]
```

### [Decision Category 2]

```
When choosing Y:
├── Simple case → Approach 1
├── Complex case → Approach 2
└── Unclear requirements → Ask user first
```

## Tools & Preferences

| Task | Tool | Why |
|------|------|-----|
| [Task 1] | [Tool] | [Brief reason] |
| [Task 2] | [Tool] | [Brief reason] |

## Escalate When

- [Condition that requires another agent or human]
- [Another escalation trigger]

## Output Format

```[language]
// Minimal example of expected output structure
```

---
Triggers: [comma-separated list for quick reference]
```

## What We Remove

1. "Your Identity & Memory" - verbose filler
2. "Your Communication Style" - unnecessary
3. "Learning & Memory" - fake, LLMs don't remember
4. "Success Metrics" with percentages - unmeasurable fantasy
5. "Advanced Capabilities" - usually repeats core mission
6. Emoji headers like "🧠 🎯 🚨" - visual noise
7. "Your Workflow Process" when it's generic

## What We Add

1. `triggers:` in frontmatter - when to activate
2. "Don't" section - explicit anti-patterns
3. Decision trees - actionable guidance
4. "Escalate When" - clear handoff points
5. Tool preferences table - concrete choices
