---
name: create-agent-skill
description: Use this skill when the user asks you to create a new agent skill, document a new pattern, or set up new rules for the project. It ensures you follow the Antigravity Open Standard for skills.
---

# Creating Antigravity Agent Skills

## When to use this skill
- Use this when the user requests you to "save this as a skill," "create a new guideline," or document a new project pattern.
- This is helpful to ensure all new agent capabilities strictly follow the official Antigravity Open Standard format.

## How to use it

### Directory Structure
All skills must be placed inside the project workspace at:
`<workspace-root>/.agents/skills/<skill-name-in-kebab-case>/`

While `SKILL.md` is the only mandatory file, you **should** create the following subdirectories if the skill would benefit from them (e.g., if you are creating external assets or code templates):
*   `scripts/` – For any helper scripts (e.g., node scripts, bash scripts) the skill might need.
*   `examples/` – For reference implementations or larger code examples.
*   `resources/` – For templates, prompts, or static assets.

### File Naming
The only required file inside the skill folder is:
`SKILL.md`

*(Do NOT name the file `brand_guidelines.md` or `api_rules.md`. It must always be exactly `SKILL.md` inside its respective folder).*

### Mandatory Frontmatter
Every `SKILL.md` MUST begin with YAML frontmatter containing the `name` and `description`. This is how the system discovers the skill.

### Formatting
Always utilize the `## When to use this skill` and `## How to use it` headings when writing a skill.

### Writing the Skill Content
*   **Write for the Agent:** The content is for YOU (or your future instances). Write clear constraints, "Do's and Don'ts", and concrete examples.
*   **Focus:** A skill should do one thing well. Do not create a single "mega skill".
*   **Workflow:** If the skill describes a process, write it as a clear step-by-step numbered list.
*   **Code Examples:** Provide snippets of exactly how the code should look in this project.

## Example Structure

```markdown
---
name: my-skill
description: Helps with a specific task. Use when you need to do X or Y.
---

# My Skill

Detailed instructions for the agent go here.

## When to use this skill

- Use this when...
- This is helpful for...

## How to use it

Step-by-step guidance, conventions, and patterns the agent should follow.
```
