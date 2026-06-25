# Architecture

## Overview

Kutti is built on a modular, provider-agnostic architecture that separates concerns into distinct layers:

```
┌─────────────────────────────────────────┐
│           CLI Interface                 │
│  (Commands, User Input, Output)         │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│      Agent Orchestration Layer          │
│  (Planning, Execution, Verification)    │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│      Unified Router Layer               │
│  (Request routing, Provider selection)  │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│      Provider Abstraction Layer         │
│  (OpenAI, Anthropic, Groq, Gemini...)  │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│   Supporting Services                   │
│  Auth, Config, Memory, Tools, MCP       │
└─────────────────────────────────────────┘
```

## Layer Details

### 1. CLI Interface (`src/cli/`)

User-facing command-line interface built with Commander.js.

**Components:**
- `cli.ts` - Main entry point
- `commands.ts` - All command implementations

**Commands:**
- `login`, `logout`, `auth` - Authentication
- `provider use`, `provider list` - Provider management
- `models` - Model listing
- `chat` - Interactive chat
- `memory add/search/list/delete` - Memory management
- `tools` - Tool discovery
- `config get/set` - Configuration

### 2. Agent Orchestration (`src/core/agents/`)

Multi-agent system for complex task execution.

**Agents:**

#### Planner Agent
- Analyzes objectives
- Creates execution plans
- Decomposes complex tasks into steps
- Estimates token usage

#### Executor Agent
- Executes plan steps
- Handles tool calls
- Manages LLM reasoning
- Tracks execution state

#### Tool Agent
- Discovers available tools
- Manages tool registry
- Categorizes tools
- Validates tool inputs

#### Memory Agent
- Session memory (current conversation)
- Persistent memory (long-term learning)
- Search and retrieval
- Context injection

#### Verifier Agent
- Validates outputs
- Checks against expected results
- Confidence scoring
- Error detection

#### Orchestrator
- Coordinates all agents
- Manages workflow
- Handles errors and retries
- Tracks costs and tokens

### 3. Unified Router (`src/core/router/`)

Abstraction layer for provider selection and request routing.

**Responsibilities:**
- Resolve active provider
- Load credentials
- Select model
- Route requests to appropriate provider
- Normalize provider-specific responses

**Usage:**
```typescript
const response = await router.chat(messages, {
  provider: 'optional-override',
  model: 'optional-model',
  temperature: 0.7,
});
```

### 4. Provider Abstraction (`src/core/providers/`)

Provider-agnostic interface with multiple implementations.

**Base Provider Interface:**
```typescript
interface BaseProvider {
  chat(messages, model, options): Promise<ChatResponse>
  stream(messages, model, onChunk, options): Promise<ChatResponse>
  listModels(): Promise<ModelInfo[]>
  validateCredentials(): Promise<boolean>
  embeddings(input, model): Promise<Embedding[]>
  getInfo(): ProviderInfo
}
```

**Implemented Providers:**
- OpenAI (Chat, Streaming, Embeddings, Vision)
- Anthropic (Chat, Streaming, Vision)
- Groq (Chat, Streaming)
- Google Gemini (Chat, Streaming, Embeddings, Vision)

**Provider Registry:**
- Dynamic provider registration
- Instance caching
- Provider discovery

### 5. Supporting Services

#### Authentication (`src/core/auth/`)

**Components:**
- `manager.ts` - Login/logout/validation
- `storage.ts` - Credential storage (keychain, encrypted, env)
- `session.ts` - Session state management

**Flow:**
```
Login → Validate Credentials → Store Securely → Create Session
```

#### Configuration (`src/core/config/`)

- TOML-based configuration
- Default values
- Override support
- Runtime updates

#### Memory (`src/core/memory/`)

- Session memory (in-process)
- Persistent memory (filesystem)
- Search capabilities
- Tag-based organization

#### Tools (`src/core/tools/`)

**Built-in Tools:**
- Filesystem (read, write, delete, list)
- Shell (execute commands)
- Git (integration)

**Tool Registry:**
- Dynamic registration
- Category filtering
- Execution with error handling

#### Git Integration (`src/core/git/`)

- Diff analysis
- Commit message generation
- Branch management
- History tracking

#### MCP Support (`src/core/mcp/`)

- Server registration
- Resource discovery
- Tool integration
- Protocol compliance

## Data Flow

### Chat Request Flow

```
┌──────────────┐
│ User Input   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Router.chat()        │
│ - Select provider    │
│ - Select model       │
│ - Load credentials   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Provider.chat()      │
│ - Format request     │
│ - Call API           │
│ - Parse response     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Memory.store()       │
│ - Save interaction   │
│ - Index for search   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Return Response      │
└──────────────────────┘
```

### Agent Execution Flow

```
┌─────────────────┐
│ Task Definition │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│ Planner.plan()       │
│ → Generate steps     │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Memory.storeContext()│
│ → Save task context  │
└────────┬─────────────┘
         │
         ▼
    ┌────┴─────────┐
    │ For each step│
    └────┬─────────┘
         │
         ▼
┌──────────────────────┐
│ Executor.execute()   │
│ → Run step           │
└────────┬─────────────┘
         │
    ┌────┴────────────────┐
    │ Tool? → Tool.exec() │
    │ Think? → LLM call   │
    │ Refine? → Iterate   │
    └────┬────────────────┘
         │
         ▼
┌──────────────────────┐
│ Verifier.verify()    │
│ → Validate output    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Memory.storeResult() │
│ → Save output        │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Return Result        │
└──────────────────────┘
```

## Security Model

### Credential Storage Priority

1. **System Keychain** (most secure)
   - Platform-native encryption
   - OS-managed security
   - No plaintext exposure

2. **Encrypted Local Storage** (fallback)
   - AES-256-GCM encryption
   - File permissions (0600)
   - Location: `~/.kutti/credentials.enc`

3. **Environment Variables** (CI/CD friendly)
   - Checked if no stored credentials
   - Requires explicit setup
   - Best for automated systems

### Trust Boundaries

```
┌─────────────────────────────────────┐
│ Kutti Process (Trusted)             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Auth Manager                    │ │
│ │ - Validates credentials         │ │
│ │ - Manages sessions              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Secure Storage                  │ │
│ │ - Encrypted credentials         │ │
│ │ - System keychain integration   │ │
│ └─────────────────────────────────┘ │
└────────────────┬────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    ┌─────────┐      ┌──────────┐
    │ Provider │      │ Tools    │
    │ APIs     │      │ (git,    │
    │(untrusted)      │ shell)   │
    └─────────┘      └──────────┘
```

## Extension Points

### Adding a New Provider

1. Create `src/core/providers/provider-name.ts`
2. Extend `BaseProvider`
3. Implement required methods
4. Register in `registry.ts`

```typescript
export class CustomProvider extends BaseProvider {
  async chat(messages, model, options) { ... }
  async stream(messages, model, onChunk, options) { ... }
  async listModels() { ... }
  // ... other methods
}

providerRegistry.register('custom', CustomProvider);
```

### Adding a New Tool

1. Create tool definition
2. Implement `execute()` method
3. Register in tool registry

```typescript
const myTool: ToolDefinition = {
  name: 'my-tool',
  description: '...',
  category: 'custom',
  inputSchema: { ... },
  async execute(input) { ... },
};

toolRegistry.register(myTool);
```

### Adding a New Agent

1. Extend `BaseProvider` or create custom class
2. Implement agent logic
3. Integrate with orchestrator

## Performance Considerations

### Token Optimization
- Batch requests where possible
- Cache model lists
- Reuse provider instances
- Compress memory storage

### Caching Strategy
- Provider instances cached by name+key
- Model lists cached per provider
- Credentials cached in memory during session
- Configuration cached on startup

### Concurrency
- Multiple tool executions in parallel (when safe)
- Non-blocking I/O throughout
- Proper error handling in async chains

## Testing Strategy

- Unit tests for each component
- Integration tests for workflows
- Mock provider implementations
- Fixture-based test data

## Deployment

### Single Executable
```bash
bun build ./src/cli.ts --compile --outfile kutti
```

### Distribution
- GitHub Releases
- Homebrew (coming)
- npm (coming)
- Direct binary download

## Future Enhancements

- [ ] Distributed agent coordination
- [ ] Advanced memory with embeddings
- [ ] Real-time streaming UI
- [ ] Plugin marketplace
- [ ] Web dashboard
- [ ] Cloud sync
- [ ] Team collaboration
