# Contributing to create-ai-kit

Thanks for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/create-ai-kit.git
   cd create-ai-kit
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Project Structure

```
create-ai-kit/
├── bin/
│   └── create-ai-kit.js    # Main CLI entry point and template logic
├── templates/              # Files copied to user projects
│   └── _cursor/           # Cursor IDE configuration templates
│       ├── commands/      # Workflow command templates
│       ├── rules/         # Rule templates
│       └── HYDRATE.md     # Hydration prompt
└── package.json
```

## Development Workflow

### Setup for Local Development

To test the CLI as if it were installed globally, use `npm link`. This symlinks your local package to your global `node_modules`, allowing you to run `create-ai-kit` from any directory.

```bash
# In the create-ai-kit root directory
npm link
```

### Testing Changes

Navigate to any test folder and run your development version:

```bash
# In a temporary test folder
create-ai-kit --dry-run
```

### Preview Script

We have a convenience script to run a dry-run inside the project folder:

```bash
npm run preview
```

### Unlinking

When you're done developing, you can unlink:

```bash
npm unlink -g create-ai-kit
```

## Making Changes

### Adding New Commands

1. Create the command file in `templates/_cursor/commands/`
2. Follow the existing format (see `plan.md` or `build.md` as examples)
3. Update `README.md` if it's a major command

### Modifying Templates

- Templates use `<!-- AI_FILL: description -->` placeholders for AI-generated content
- These placeholders are **not** processed by the CLI — they're filled by the AI during the hydration step after installation
- Keep templates generic enough to work across different project types
- Test with `create-ai-kit --dry-run` to verify output

### CLI Changes

- Main logic is in `bin/create-ai-kit.js`
- Keep the CLI simple and zero-config where possible
- Maintain backward compatibility with existing installations

## Code Style

We use [Prettier](https://prettier.io/) for consistent formatting. Before submitting a PR:

```bash
npm run format
```

Guidelines:

- Use clear, descriptive variable names
- Add comments for non-obvious logic
- Keep functions small and single-purpose

## Submitting Changes

### Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Format code: `npm run format`
4. Test with `create-ai-kit --dry-run` (via `npm link`)
5. Commit with a clear message:
   ```bash
   git commit -m "Add: brief description of change"
   ```
6. Push and open a PR against `main`

### PR Guidelines

- Keep PRs focused on a single change
- Describe what and why in the PR description
- Include any testing you've done
- Update documentation if needed

## Reporting Issues

When opening an issue, please include:

- Node.js version (`node -v`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Any error messages

## Release Process (Maintainers)

Before publishing a new release:

1. Complete **all items** in `PRE-RELEASE-CHECKLIST.md`
2. Run the pre-release reminder:
   ```bash
   npm run release:check
   ```
3. Update `CHANGELOG.md` with the new version
4. Bump version in `package.json`
5. Run full test suite: `npm test`
6. Publish: `npm publish`
7. Tag the release: `git tag -a vX.X.X -m "vX.X.X"`
8. Push tags: `git push origin vX.X.X`

The pre-release checklist covers code quality, security, documentation, testing, and post-release verification. No release should skip this checklist.

## License

By contributing to create-ai-kit, you agree that your contributions will be licensed under the [MIT License](LICENSE).

## Questions?

Open an issue with the `question` label if something isn't clear.

---

Thanks for contributing!
