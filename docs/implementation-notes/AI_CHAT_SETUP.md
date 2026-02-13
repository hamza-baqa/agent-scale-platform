# AI-Powered Migration Planning Chat

## Overview

The migration planner now includes an **AI-powered chat** using **Claude Opus 4.6** (the most advanced model) that can:

- Understand complex architecture questions
- Suggest improvements to your migration plan
- **Modify the migration plan based on your requests**
- **Automatically regenerate code when changes are made**
- Provide detailed explanations and best practices

---

## Setup Instructions

### 1. Get Your Anthropic API Key

1. Go to https://console.anthropic.com/
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### 2. Configure the Backend

Add your API key to the `.env` file:

```bash
# Edit platform/backend/.env
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

### 3. Restart the Backend

```bash
cd platform/backend
npm run dev
```

You should see:
```
AI Chat Service initialized with Claude Opus 4.6
```

---

## How It Works

### Architecture

```
User Chat Message
      ↓
Frontend (MigrationPlanWithChat.tsx)
      ↓
POST /api/migrations/:id/plan-chat
      ↓
AI Chat Service (Opus 4.6)
      ↓
Plan Modification Detection
      ↓
Code Regeneration (if plan changed)
      ↓
Updated Code + Response
```

### Key Features

#### 1. **Intelligent Understanding**
- Uses Claude Opus 4.6 for advanced reasoning
- Understands context from previous messages
- Can answer complex architectural questions

#### 2. **Plan Modification**
- Detects when you request changes
- Explains trade-offs and implications
- Updates the migration plan automatically
- Returns the updated plan in JSON format

#### 3. **Automatic Code Regeneration**
- When plan is modified, triggers code regeneration
- Re-runs service generator with new plan
- Re-runs frontend migrator with updates
- Maintains consistency across all generated code

#### 4. **Conversational Memory**
- Maintains conversation history
- Understands context from previous messages
- Can reference earlier discussions

---

## Example Conversations

### Example 1: Asking Questions

**You:**
```
Why did you create 5 separate microservices?
Wouldn't 3 larger services be easier to manage?
```

**AI (Opus 4.6):**
```
The decision to create 5 microservices follows the Single Responsibility Principle
and domain-driven design best practices. Here's the reasoning:

**Current Structure:**
1. Auth Service - Authentication only
2. Client Service - Client management
3. Account Service - Account operations
4. Transaction Service - Transaction processing
5. Card Service - Card lifecycle

**Benefits of 5 Services:**
- Clear boundaries and responsibilities
- Independent scaling (transactions can scale separately)
- Team autonomy (different teams can own different services)
- Fault isolation (auth failure doesn't affect transactions)

**Trade-offs of 3 Larger Services:**
- Pros: Simpler operational overhead, fewer network calls
- Cons: Larger codebases, less granular scaling, tighter coupling

**Recommendation:** For a banking application, the 5-service approach is
better due to compliance requirements and the need for independent scaling
of transaction processing. However, if you're concerned about operational
complexity, we could combine auth + client into an "identity-service".

Would you like me to suggest an alternative grouping?
```

### Example 2: Requesting Changes

**You:**
```
Combine the auth-service and client-service into a single identity-service
```

**AI (Opus 4.6):**
```
**Combining Auth Service + Client Service → Identity Service**

**What will change:**
- New service: identity-service (Port 8081)
- Entities: User, Client, RefreshToken (all in one database)
- Endpoints: All auth + client endpoints combined
- Database: identity_db (single database for both)

**Benefits:**
- Reduced operational complexity (4 services instead of 5)
- Shared database for user and client data
- Simpler service mesh
- Fewer database connections

**Trade-offs:**
- Larger service codebase
- Auth and client scaling are coupled
- Less clear separation of concerns

**Updated Plan:**

<PLAN_UPDATE>
{
  "microservices": [
    {
      "name": "identity-service",
      "displayName": "Identity Service",
      "port": 8081,
      "database": "identity_db",
      "entities": ["User", "Client", "RefreshToken"],
      "description": "Combined authentication and client management",
      "endpoints": [...auth endpoints + ...client endpoints]
    },
    {
      "name": "account-service",
      "port": 8082,
      ...
    },
    ...
  ],
  "changes": [
    "Combined auth-service and client-service into identity-service",
    "Merged databases: auth_db + client_db → identity_db",
    "Total services reduced from 5 to 4"
  ]
}
</PLAN_UPDATE>

The plan has been updated! Code regeneration will begin automatically.
```

**System Response:**
```json
{
  "success": true,
  "planModified": true,
  "updatedPlan": { ... },
  "suggestedActions": [
    "Combined auth-service and client-service into identity-service",
    "Merged databases: auth_db + client_db → identity_db",
    "Total services reduced from 5 to 4"
  ]
}
```

**Backend Action:**
- Service generator re-runs with new plan
- Frontend migrator updates with new configuration
- New code generated reflecting the changes

### Example 3: Technical Deep Dive

**You:**
```
How should I handle distributed transactions across these services?
```

**AI (Opus 4.6):**
```
**Distributed Transaction Management**

For your banking application with 5 microservices, here are the recommended
patterns:

**1. Saga Pattern (Recommended)**
- Use choreography-based sagas for account transfers
- Each service publishes events, others react
- Implement compensating transactions for rollback

**Example Transfer Flow:**
```
1. Transaction Service: Create pending transfer
2. Account Service: Debit source account
3. If success → Account Service: Credit destination
4. If failure → Compensating: Revert debit
5. Transaction Service: Mark complete/failed
```

**2. Event Sourcing**
- Store transaction events, not just state
- Full audit trail for compliance
- Easy to replay and reconstruct state

**3. Two-Phase Commit (Avoid)**
- Not recommended for microservices
- Creates tight coupling
- Performance bottlenecks
- Doesn't scale well

**Implementation Recommendations:**
- Use message broker (Kafka/RabbitMQ) for events
- Implement idempotency in all services
- Add transaction timeouts and retry logic
- Use outbox pattern for reliable messaging

**Would you like me to:**
1. Add event sourcing to the migration plan?
2. Generate saga coordination code?
3. Explain the outbox pattern implementation?
```

---

## API Reference

### Endpoint

```
POST /api/migrations/:migrationId/plan-chat
```

### Request Body

```json
{
  "message": "Your question or request",
  "plan": {
    "microservices": [...],
    "microFrontends": [...]
  },
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous user message"
    },
    {
      "role": "assistant",
      "content": "Previous AI response"
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "response": "AI response text (markdown formatted)",
  "updatedPlan": {
    "microservices": [...],
    "microFrontends": [...]
  },
  "planModified": true,
  "suggestedActions": [
    "List of changes made to the plan"
  ],
  "aiModel": {
    "model": "claude-opus-4-6-20250514",
    "available": true
  },
  "timestamp": "2026-02-09T12:00:00.000Z"
}
```

---

## Code Regeneration Flow

When the AI modifies the migration plan:

1. **Plan Update Detected**
   - AI response contains `<PLAN_UPDATE>` tag
   - JSON plan extracted and parsed

2. **Migration Service Notified**
   - `updateMigrationPlan()` called
   - Plan stored in migration state

3. **Code Regeneration Triggered**
   - `regenerateCodeFromPlan()` called asynchronously
   - Service generator re-runs with new plan
   - Frontend migrator re-runs with new plan

4. **Real-time Updates**
   - WebSocket events emitted
   - UI shows regeneration progress
   - User sees new code being generated

5. **Validation**
   - Quality validator can re-run
   - New code validated against new plan

---

## System Prompt

The AI is given this context about your migration plan:

```
You are an expert Software Architect specializing in microservices and
micro-frontend architectures.

Current Migration Plan:
- Microservices: [list with details]
- Micro-Frontends: [list with details]

Your Capabilities:
1. Explain architecture decisions
2. Suggest improvements
3. Help combine or split services
4. Adjust port assignments
5. Optimize migration strategy

When user requests changes:
- Explain implications (pros/cons)
- Provide specific recommendations
- Return updated plan in JSON format with <PLAN_UPDATE> tags
```

---

## Benefits

### 1. **Intelligent Assistance**
- Advanced reasoning with Opus 4.6
- Context-aware responses
- Understands architectural patterns

### 2. **Interactive Planning**
- Conversational interface
- Easy to request changes
- Real-time feedback

### 3. **Automated Updates**
- Plan modifications trigger code regeneration
- No manual intervention needed
- Consistency guaranteed

### 4. **Educational**
- Learn best practices
- Understand trade-offs
- Get detailed explanations

### 5. **Time Saving**
- Quick iterations
- Instant plan modifications
- Automatic code updates

---

## Troubleshooting

### AI Not Available

**Symptom:**
```json
{
  "aiModel": {
    "model": "claude-opus-4-6-20250514",
    "available": false
  }
}
```

**Solution:**
1. Check ANTHROPIC_API_KEY in `.env`
2. Verify API key is valid at https://console.anthropic.com/
3. Restart backend after adding key

### Rate Limits

**Symptom:** 429 Too Many Requests

**Solution:**
- Wait a few seconds between requests
- Anthropic has rate limits per minute
- Consider upgrading API tier if needed

### Plan Not Regenerating

**Symptom:** Plan modified but code not regenerated

**Check:**
1. Backend logs: `Code regeneration started for...`
2. WebSocket events in browser console
3. Migration status API: `/api/migrations/:id`

**Debug:**
```bash
# Check backend logs
tail -f platform/backend/backend.log | grep "regenerat"
```

---

## Cost Considerations

### Claude Opus 4.6 Pricing

- Input: ~$15 per million tokens
- Output: ~$75 per million tokens

### Typical Chat Session

- Average message: ~500 tokens input + 1000 tokens output
- Cost per message: ~$0.08
- 10 messages: ~$0.80

### Tips to Reduce Costs

1. **Be Concise:** Shorter messages = lower cost
2. **Use History Wisely:** Don't send entire conversation every time
3. **Batch Questions:** Ask multiple questions in one message
4. **Consider Sonnet:** For simple questions, could use Sonnet 4.5 (cheaper)

---

## Advanced Usage

### Custom System Prompts

You can modify the AI's behavior by editing:
```
platform/backend/src/services/aiChatService.ts
```

Find the `buildSystemPrompt()` method and customize:
- Tone and style
- Additional capabilities
- Domain-specific knowledge
- Response format preferences

### Adding Tools

Future enhancements could include:
- Function calling for plan modifications
- Structured output for consistent formats
- Vision for architecture diagrams
- Code analysis of existing repositories

---

## Security Notes

1. **API Key Protection**
   - Never commit API keys to git
   - Use environment variables
   - Rotate keys periodically

2. **Input Validation**
   - Chat messages are sanitized
   - Plan updates are validated before applying
   - No arbitrary code execution

3. **Rate Limiting**
   - Consider adding rate limits per user
   - Prevent abuse of expensive AI calls

---

## Next Steps

1. **Get API Key:** https://console.anthropic.com/
2. **Add to .env:** `ANTHROPIC_API_KEY=sk-ant-...`
3. **Restart Backend:** `npm run dev`
4. **Start Chatting:** Open migration planner and ask questions!

---

**The AI chat is now ready to help you create the perfect migration plan!**

With Claude Opus 4.6, you have access to the most advanced AI reasoning
to optimize your architecture and automatically regenerate code based on
your requirements.
