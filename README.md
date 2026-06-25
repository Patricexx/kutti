# Kutti 🚀

**Autonomous AI Coding Assistant CLI** - A Bun-native OpenCode alternative with multi-provider support, intelligent agents, and powerful automation.

## Features

✨ **Multi-Provider Support**
- OpenAI (GPT-4, GPT-5)
- Anthropic (Claude 3)
- Groq (Llama, Mixtral)
- Google Gemini
- OpenRouter, DeepSeek, Fireworks, and more

🤖 **Intelligent Agent System**
- **Planner Agent** - Breaks down complex tasks into actionable steps
- **Executor Agent** - Executes planned steps with error handling
- **Tool Agent** - Manages 10+ built-in tools
- **Memory Agent** - Persistent and session-based learning
- **Verifier Agent** - Validates outputs and results

🔧 **Built-in Tools**
- Filesystem operations (read, write, delete, list)
- Shell command execution
- Git integration (diff analysis, commit generation)
- Web search and URL fetching
- Code search and grep
- Memory store and retrieval

🔐 **Secure Credential Management**
- System keychain integration (macOS, Linux, Windows)
- Encrypted local storage (AES-256-GCM)
- Environment variable fallback
- No plaintext API keys

💾 **Memory System**
- Session memory for current conversation
- Persistent memory with search
- Tag-based organization
- Metadata support

🌐 **MCP Protocol Support**
- Model Context Protocol integration
- Server discovery and management
- Resource and tool discovery
- Stdio, HTTP, and SSE transports

⚡ **Bun-First Design**
- Native Bun APIs (`Bun.spawn`, `Bun.file`, `Bun.SQLite`)
- No Node.js dependencies where possible
- Single executable compilation
- Lightning-fast startup

## Installation

### Prerequisites
- Bun >= 1.0.0 ([Install Bun](https://bun.sh))
- Node >= 18 (for compatibility)

### From Source

```bash
git clone https://github.com/Patricexx/kutti.git
cd kutti
bun install
bun run build:compile
```

This creates a single `kutti` executable.

### From npm (coming soon)

```bash
bun install -g kutti
```

## Quick Start

### 1. Login to a Provider

```bash
kutti login openai
# Enter API key when prompted
```

Supported providers:
```bash
kutti login anthropic
kutti login groq
kutti login gemini
kutti login openrouter
```

### 2. Check Authentication Status

```bash
kutti auth
```

Output:
```
📋 Authentication Status

Active Provider: openai
Active Model: gpt-4

Authenticated Providers:
  • openai
  • groq
```

### 3. Start Interactive Chat

```bash
kutti chat
```

```
💬 Kutti Chat

Type your message and press Enter. Type "exit" to quit.

You: Explain quantum computing
Assistant: Quantum computing is a type of computing that uses quantum mechanics...

You: exit
Goodbye!
```

### 4. Switch Providers

```bash
kutti provider use groq
kutti chat  # Now uses Groq
```

### 5. List Available Models

```bash
kutti models
```

```
🤖 Available Models

ID                          Name                      Context    Input Cost
gpt-4-turbo                 GPT-4 Turbo               128000     0.01
gpt-4                       GPT-4                     8192       0.03
gpt-3.5-turbo               GPT-3.5 Turbo             4096       0.0005
```

## CLI Commands

### Authentication

```bash
# Login to a provider
kutti login <provider> [-k|--key <apiKey>]

# Logout from a provider
kutti logout <provider>

# Show auth status
kutti auth
```

### Provider Management

```bash
# Use a provider
kutti provider use <provider> [-m|--model <model>]

# List authenticated providers
kutti provider list
```

### Models

```bash
# List available models
kutti models [-p|--provider <provider>]
```

### Chat & Interaction

```bash
# Start interactive chat
kutti chat [-p|--provider <provider>] [-m|--model <model>] [-t|--temperature <temp>]
```

### Memory Management

```bash
# Add to persistent memory
kutti memory add "Your content" [-t|--tags tag1,tag2]

# Search persistent memory
kutti memory search "query"

# List all memories
kutti memory list

# Delete memory
kutti memory delete <id>
```

### Tools

```bash
# List available tools
kutti tools
```

Output:
```
🔧 Available Tools

FILESYSTEM:
  • filesystem: Read, write, and manage files

SHELL:
  • shell: Execute shell commands

GIT:
  • git: Git operations
```

### Configuration

```bash
# Get config value
kutti config get provider.default

# Set config value
kutti config set provider.default groq
```

## Configuration

Kutti uses a TOML configuration file at `~/.kutti/config.toml`:

```toml
[provider]
default = "openai"
timeout = 30000
retries = 3

[models]
default = "gpt-4"

[memory]
enabled = true
backend = "sqlite"
path = "~/.kutti/memory.db"

[mcp]
enabled = true
servers = []

[security]
sandboxMode = false
commandApproval = true
auditLogging = true
```

## Agent Architecture

Kutti uses a sophisticated multi-agent system:

### Workflow

```
User Input
    ↓
Planner Agent (breaks down task)
    ↓
Memory Agent (retrieves context)
    ↓
Executor Agent (runs steps)
    ├→ Think (LLM reasoning)
    ├→ Tool (execute tool)
    └→ Refine (iterate)
    ↓
Verifier Agent (validates output)
    ↓
Memory Agent (stores result)
    ↓
User Output
```

### Creating Custom Tasks

```typescript
import { orchestrator } from './src/core/agents/orchestrator';

const task = {
  id: 'task-1',
  objective: 'Analyze the codebase and suggest optimizations',
  context: 'TypeScript project with React components',
  constraints: ['No breaking changes', 'Maintain compatibility'],
  tools: ['filesystem', 'shell', 'git'],
};

const result = await orchestrator.executeTask(task);
console.log(result.finalOutput);
```

## Environment Variables

Kutti automatically detects API keys from environment variables:

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GROQ_API_KEY="gsk-..."
export GOOGLE_API_KEY="AIza..."
export OPENROUTER_API_KEY="sk-or-..."
```

No login required if env vars are set!

## Security

### Credential Storage

1. **System Keychain** (primary)
   - macOS: Keychain
   - Linux: Secret Service
   - Windows: Credential Manager

2. **Encrypted Local Storage** (fallback)
   - Location: `~/.kutti/credentials.enc`
   - Encryption: AES-256-GCM

3. **Environment Variables** (last resort)
   - Checked if no stored credentials
   - Auto-loaded on startup

### Best Practices

✅ Use system keychain when possible
✅ Store long-term credentials securely
✅ Use environment variables for CI/CD
✅ Never commit API keys to version control
✅ Enable audit logging in production

## Building

### Development

```bash
bun run dev          # Run CLI in dev mode
bun run type-check   # Type checking
bun run test         # Run tests
```

### Production Build

```bash
# Bundle as JavaScript
bun run build

# Compile to single executable
bun run build:compile
```

Output:
- `dist/cli.js` - Bundled JavaScript
- `kutti` - Single executable (Linux/macOS)
- `kutti.exe` - Single executable (Windows)

## Platform Support

- ✅ Linux (all distributions)
- ✅ macOS (Intel & Apple Silicon)
- ✅ Windows (WSL2 recommended)
- ✅ Termux (Android)
- ✅ iSH (iOS)

## Project Structure

```
kutti/
├── src/
│   ├── cli.ts                 # Main CLI entry
│   ├── cli/
│   │   └── commands.ts        # Command definitions
│   ├── core/
│   │   ├── auth/
│   │   │   ├── manager.ts     # Auth manager
│   │   │   ├── storage.ts     # Credential storage
│   │   │   └── session.ts     # Session management
│   │   ├── config/
│   │   │   └── manager.ts     # Config manager
│   │   ├── providers/
│   │   │   ├── base.ts        # Base provider
│   │   │   ├── openai.ts      # OpenAI provider
│   │   │   ├── anthropic.ts   # Anthropic provider
│   │   │   ├── groq.ts        # Groq provider
│   │   │   ├── gemini.ts      # Gemini provider
│   │   │   └── registry.ts    # Provider registry
│   │   ├── agents/
│   │   │   ├── index.ts       # Agent classes
│   │   │   └── orchestrator.ts# Agent orchestrator
│   │   ├── tools/
│   │   │   ├── registry.ts    # Tool registry
│   │   │   ├── filesystem.ts  # Filesystem tool
│   │   │   └── shell.ts       # Shell tool
│   │   ├── memory/
│   │   │   └── manager.ts     # Memory manager
│   │   ├── git/
│   │   │   └── manager.ts     # Git operations
│   │   ├── mcp/
│   │   │   └── manager.ts     # MCP manager
│   │   └── router/
│   │       └── index.ts       # Unified router
│   └── .openclaw/
│       └── skills/
│           └── gsd-orchestrator.md  # GSD skill
├── tests/
├── .github/
│   └── workflows/             # CI/CD workflows
├── package.json
├── tsconfig.json
├── bunfig.toml
└── README.md
```

## Architecture Decisions

📄 See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

### Key Design Principles

1. **Bun-First** - Leverage Bun APIs over Node.js
2. **Provider-Agnostic** - Support any LLM provider
3. **Modular** - Each component is independently testable
4. **Extensible** - Easy to add providers, tools, and agents
5. **Secure** - Never store credentials in plaintext
6. **Type-Safe** - Full TypeScript throughout

## API Usage

### Using as a Library

```typescript
import { router } from './src/core/router';
import { authManager } from './src/core/auth/manager';

// Login
await authManager.login({
  provider: 'openai',
  apiKey: 'sk-...',
});

// Chat
const response = await router.chat([
  { role: 'user', content: 'What is Bun?' },
]);

console.log(response.content);
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md).

### Areas for Contribution

- Additional provider implementations
- New tools and integrations
- Performance optimizations
- Documentation improvements
- Bug fixes and testing

## Roadmap

- [ ] Web UI dashboard
- [ ] Vision/image support
- [ ] Advanced memory with embeddings
- [ ] Real-time collaboration
- [ ] Plugin marketplace
- [ ] Docker support
- [ ] Cloud sync
- [ ] Mobile companion app

## Pricing

Kutti itself is **free and open-source**. Costs depend on your chosen LLM provider:

- **OpenAI**: $0.01-0.03 per 1k tokens
- **Anthropic**: $0.003-0.075 per 1k tokens
- **Groq**: $0.0002-0.0006 per 1k tokens (free tier available)
- **Gemini**: $0.0003-0.0012 per 1k tokens

## License

MIT License - see [LICENSE](./LICENSE)

## Support

- 📖 [Documentation](https://github.com/Patricexx/kutti/wiki)
- 🐛 [Issue Tracker](https://github.com/Patricexx/kutti/issues)
- 💬 [Discussions](https://github.com/Patricexx/kutti/discussions)
- 🤝 [Contributing Guide](./CONTRIBUTING.md)

## Credits

Built with ❤️ using [Bun](https://bun.sh), inspired by OpenCode, Gemini CLI, and Claude Code.

## Acknowledgments

- Bun team for the amazing runtime
- OpenAI, Anthropic, Groq, and Google for their APIs
- The open-source community

---

**Made with 🚀 by Patricexx**
