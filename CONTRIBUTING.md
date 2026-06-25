# Contributing to Kutti

Thank you for your interest in contributing! This guide explains how to get started.

## Getting Started

### Prerequisites
- Bun >= 1.0.0
- Git
- Node >= 18

### Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/kutti.git
cd kutti

# Install dependencies
bun install

# Create a feature branch
git checkout -b feat/your-feature
```

## Development Workflow

### Running Locally

```bash
# Run CLI in dev mode
bun run dev

# Type checking
bun run type-check

# Format code
bun run format

# Lint
bun run lint

# Run tests
bun run test
```

### Project Structure

```
src/
├── cli/              # Command-line interface
├── core/
│   ├── agents/       # Agent system
│   ├── auth/         # Authentication
│   ├── config/       # Configuration
│   ├── git/          # Git integration
│   ├── memory/       # Memory system
│   ├── mcp/          # MCP protocol
│   ├── providers/    # AI provider implementations
│   ├── router/       # Request routing
│   └── tools/        # Tool system
└── cli.ts            # Entry point
```

## Areas for Contribution

### 1. New Provider Implementation

Add support for a new AI provider:

1. Create `src/core/providers/provider-name.ts`
2. Extend `BaseProvider`
3. Implement all required methods
4. Add tests
5. Update docs

**Example providers needed:**
- OpenRouter
- DeepSeek
- Fireworks
- Together AI
- Mistral

### 2. New Tools

Add new tools for agent use:

1. Create tool definition
2. Implement `execute()` method
3. Add to tool registry
4. Test thoroughly

**Tools needed:**
- Web search integration
- URL fetching
- PDF parsing
- Code analysis
- Document processing

### 3. Improvements & Bug Fixes

- Performance optimizations
- Error handling improvements
- Security enhancements
- Bug fixes with test coverage

### 4. Documentation

- Tutorial improvements
- API documentation
- Architecture documentation
- Example projects

### 5. Testing

- Add unit tests
- Integration tests
- Edge case coverage
- Mock implementations

## Code Standards

### TypeScript
- Strict mode enabled
- Full type coverage
- No `any` types
- Descriptive names

### Formatting
- 2-space indentation
- Prettier formatting
- 100-char line limit (when reasonable)

### Naming Conventions
```typescript
// Classes
class PlannerAgent { }
class CredentialStorage { }

// Functions
function generatePlan() { }
async function validateCredentials() { }

// Constants
const DEFAULT_TIMEOUT = 30000;
const API_BASE_URL = '...';

// Types
type ProviderConfig = { ... };
interface ChatMessage { }
```

### Comments
```typescript
/**
 * Single-line description
 */
function doSomething() { }

/**
 * Multi-line description of what this does.
 * 
 * @param input - Parameter description
 * @returns What it returns
 */
async function complexOperation(input: string): Promise<Result> { }
```

## Commit Messages

Follow conventional commits:

```
feat: add new provider support
fix: resolve credential storage issue
docs: update README with examples
test: add unit tests for auth manager
refactor: improve error handling
perf: optimize token usage
chore: update dependencies
```

## Pull Requests

### PR Checklist

- [ ] Tests pass (`bun run test`)
- [ ] Types check (`bun run type-check`)
- [ ] Formatting (`bun run format`)
- [ ] Linting passes (`bun run lint`)
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No unrelated changes

### PR Description Template

```markdown
## Description
Brief summary of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Performance improvement

## Related Issues
Closes #123

## Testing
How to test these changes

## Screenshots (if applicable)
```

## Testing Guidelines

### Unit Tests

```typescript
import { describe, it, expect } from 'bun:test';
import { authManager } from '../auth/manager';

describe('AuthManager', () => {
  it('should validate credentials', async () => {
    const result = await authManager.login({
      provider: 'test',
      apiKey: 'valid-key',
    });
    expect(result.success).toBe(true);
  });
});
```

### Running Tests

```bash
# All tests
bun run test

# Specific test file
bun test src/core/auth/__tests__/manager.test.ts

# With coverage
bun run test -- --coverage
```

## Security Considerations

When contributing:

1. **Never log credentials**
   ```typescript
   // ❌ Bad
   console.log('API Key:', apiKey);
   
   // ✅ Good
   console.log('Credentials stored securely');
   ```

2. **Use secure storage**
   ```typescript
   // ✅ Use credentialStorage for API keys
   await credentialStorage.saveApiKey(provider, apiKey);
   ```

3. **Sanitize errors**
   ```typescript
   // ❌ Bad
   throw new Error(`API key invalid: ${apiKey}`);
   
   // ✅ Good
   throw new Error('Invalid credentials');
   ```

4. **Validate inputs**
   ```typescript
   if (!apiKey || apiKey.trim().length === 0) {
     throw new Error('API key required');
   }
   ```

## Performance Guidelines

- Minimize token usage
- Cache when appropriate
- Use async/await properly
- Avoid blocking operations
- Optimize memory usage

## Documentation

### Adding New Commands

Update `README.md` in the CLI Commands section:

```markdown
### Your Command

```bash
kutti your-command <arg> [options]
```

Description of what it does.

**Options:**
- `-f, --flag` - Flag description

**Example:**
```
kutti your-command something
```
```

### API Documentation

Use JSDoc comments:

```typescript
/**
 * Execute a task using the agent system.
 * 
 * @param task - The task to execute
 * @param options - Router options for provider selection
 * @returns Orchestration result with output
 * 
 * @example
 * const result = await orchestrator.executeTask({
 *   id: 'task-1',
 *   objective: 'Analyze code',
 * });
 */
async executeTask(task: AgentTask, options?: RouteOptions) { }
```

## Getting Help

- 📖 [Documentation](./README.md)
- 🏗️ [Architecture](./ARCHITECTURE.md)
- 💬 [GitHub Discussions](https://github.com/Patricexx/kutti/discussions)
- 🐛 [Issue Tracker](https://github.com/Patricexx/kutti/issues)

## License

By contributing, you agree your code will be licensed under the MIT License.

## Recognition

Contributors are recognized in:
- README.md contributors section
- GitHub contributors page
- Release notes

---

Thank you for contributing to Kutti! 🚀
