# Contributing to XPAC

Thanks for your interest in contributing to XPAC! This document provides guidelines for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/xpac-dashboard.git`
3. Create a branch: `git checkout -b feature/your-feature`
4. Install dependencies: `npm install`
5. Start development: `npm start`

## Development Workflow

### Branch Naming

- `feature/description` — new features
- `fix/description` — bug fixes
- `docs/description` — documentation changes
- `refactor/description` — code refactoring

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add campaign cloning
fix: resolve upload race condition
docs: update API endpoint table
refactor: extract CSV parser to utils
```

### Code Style

- Use functional components with hooks
- Follow existing patterns (contexts for state, services for API)
- Keep components under 200 lines when possible
- Use Tailwind classes, avoid inline styles
- Use Material Symbols for icons

### Testing

Run the linter before committing:

```bash
npm run lint
```

### Pull Requests

1. Ensure your branch is up to date with `main`
2. Run `npm run build` to verify production build
3. Fill out the PR template completely
4. Link any related issues
5. Request a review from a maintainer

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:

- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Console errors (if any)

## Feature Requests

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) and describe:

- The problem you're trying to solve
- Your proposed solution
- Alternatives you considered

## Code of Conduct

Be respectful and constructive. We're here to build something great together.

## Questions?

Open a [discussion](https://github.com/your-username/xpac-dashboard/discussions) or reach out to the maintainers.
