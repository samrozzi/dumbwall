# Contributing to The Wall

Thank you for your interest in contributing to The Wall! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Assume good intentions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or bun
- Git
- Supabase account (for backend features)

### Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/dumbwall.git
   cd dumbwall
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Run database migrations**
   ```bash
   # If using local Supabase:
   supabase db reset

   # Or manually apply in Supabase Dashboard
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 💻 Development Workflow

### Branch Naming

- `feature/` - New features (e.g., `feature/user-blocking`)
- `fix/` - Bug fixes (e.g., `fix/chat-scroll-issue`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)
- `docs/` - Documentation updates (e.g., `docs/api-endpoints`)
- `refactor/` - Code refactoring (e.g., `refactor/auth-context`)

### Development Process

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing patterns
   - Add comments for complex logic

3. **Test your changes**
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add user blocking feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**

## 📐 Code Standards

### TypeScript

- Use TypeScript for all new files
- Define proper types/interfaces
- Avoid `any` - use `unknown` if necessary
- Enable strict mode in your editor

### React

- Use functional components with hooks
- Keep components small and focused
- Use custom hooks for reusable logic
- Prefer composition over prop drilling

### File Organization

```
src/
├── components/
│   ├── featureName/       # Feature-specific components
│   │   ├── Component.tsx
│   │   └── index.ts
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── pages/                 # Route components
└── types/                 # TypeScript types
```

### Naming Conventions

- **Components:** PascalCase (`UserProfile.tsx`)
- **Hooks:** camelCase with `use` prefix (`useGameState.ts`)
- **Utils:** camelCase (`formatDate.ts`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Types/Interfaces:** PascalCase (`User`, `GameState`)

### Component Structure

```tsx
import { useState } from 'react';
import { SomeType } from '@/types';

interface ComponentProps {
  prop1: string;
  prop2?: number;
}

export const Component = ({ prop1, prop2 = 0 }: ComponentProps) => {
  // 1. Hooks
  const [state, setState] = useState<SomeType>(initialValue);

  // 2. Event handlers
  const handleClick = () => {
    // ...
  };

  // 3. Effects
  // ...

  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### Styling

- Use Tailwind CSS utility classes
- Follow existing component patterns
- Use shadcn/ui components when possible
- Maintain responsive design (mobile-first)

### State Management

- **Local state:** `useState` for component-specific state
- **Server state:** React Query (`useQuery`, `useMutation`)
- **Global state:** Context API for auth, theme, etc.
- **Form state:** React Hook Form + Zod validation

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const { user } = render(<YourComponent />);
    await user.click(screen.getByRole('button'));
    // assertions...
  });
});
```

### Test Coverage Goals

- **Utility functions:** 100%
- **Components:** 80%+
- **Pages:** 60%+
- **Overall:** 70%+

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
feat(games): add chess AI opponent
fix(chat): resolve message scroll issue
docs(readme): update setup instructions
refactor(auth): simplify authentication logic
test(games): add tests for TicTacToe component
```

### Commit Message Rules

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Keep subject line under 50 characters
- Capitalize subject line
- Don't end subject line with a period
- Separate subject from body with a blank line

## 🔀 Pull Request Process

### Before Submitting

1. **Update documentation**
   - Update README if needed
   - Add JSDoc comments for public APIs
   - Update CHANGELOG.md

2. **Test thoroughly**
   - All tests pass
   - No linting errors
   - Build succeeds
   - Manually test in browser

3. **Clean up**
   - Remove console.logs
   - Remove commented code
   - Format code
   - Remove unused imports

### PR Title Format

Follow commit message format:
```
feat(games): Add multiplayer tournament mode
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] Manual testing completed
- [ ] All tests passing

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **At least one approval** from maintainers
3. **No unresolved comments**
4. **Up to date** with main branch

### After Approval

- Squash commits if needed
- Maintainer will merge
- Delete your branch after merge

## 📁 Project Structure

### Key Directories

```
dumbwall/
├── src/
│   ├── components/          # React components
│   │   ├── chat/           # Chat features
│   │   ├── games/          # Game components
│   │   ├── wall/           # Wall posting
│   │   ├── people/         # Community features
│   │   └── ui/             # Reusable UI (shadcn)
│   ├── pages/              # Route pages
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities
│   ├── integrations/       # Third-party integrations
│   ├── types/              # TypeScript types
│   └── test/               # Test utilities
├── supabase/
│   ├── functions/          # Edge functions (Deno)
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── .github/                # GitHub workflows
```

### Adding New Features

1. **Components**: Add to relevant feature folder
2. **Hooks**: Add to `src/hooks/`
3. **Utils**: Add to `src/lib/`
4. **Types**: Add to `src/types/`
5. **Tests**: Add alongside component with `.test.tsx`

### Database Changes

1. Create migration file:
   ```bash
   supabase migration new your_migration_name
   ```

2. Write SQL in `supabase/migrations/YYYYMMDD_your_migration_name.sql`

3. Test locally:
   ```bash
   supabase db reset
   ```

4. Update TypeScript types if needed

## 🎨 UI/UX Guidelines

- **Accessibility first**: Use semantic HTML, ARIA labels
- **Mobile responsive**: Test on small screens
- **Dark mode**: Support both themes
- **Loading states**: Show skeletons/spinners
- **Error states**: Provide clear error messages
- **Empty states**: Guide users on what to do next

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Try latest version
3. Verify it's reproducible

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots
If applicable, add screenshots.

## Environment
- OS: [e.g., macOS, Windows]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 20.10.0]
```

## 💡 Feature Requests

We welcome feature ideas! Please:

1. **Check existing requests** first
2. **Describe the problem** it solves
3. **Propose a solution** (optional)
4. **Consider alternatives** (optional)

## ❓ Getting Help

- **Questions**: GitHub Discussions
- **Bugs**: GitHub Issues
- **Security**: Email maintainers privately
- **Documentation**: Check README and docs/

## 🙏 Recognition

Contributors will be:
- Added to CONTRIBUTORS.md
- Mentioned in release notes
- Recognized in the community

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to The Wall! 🎉
