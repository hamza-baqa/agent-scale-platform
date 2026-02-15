# Code Analyzer ARK Agent - Prompt Documentation

## Overview

The Code Analyzer is now an **ARK agent** that uses AI to analyze code repositories. This document shows the exact prompt sent to the AI.

## How to View the Prompt

### 1. Via API Endpoint
```bash
curl http://localhost:4000/api/repo-migration/code-analyzer-prompt
```

Returns:
- `promptTemplate`: The full prompt template
- `agent`: Agent name (code-analyzer)
- `namespace`: ARK namespace
- `arkUrl`: ARK API URL
- `description`: Explanation of how it works
- `instructions`: Usage notes

### 2. Via Backend Logs

When code analysis runs, the full prompt (including source files) is logged:

```
================================================================================
ARK CODE-ANALYZER PROMPT:
================================================================================
[Full prompt with source code files...]
================================================================================
```

Check logs:
```bash
tail -f .run-pids/backend.log | grep -A 100 "ARK CODE-ANALYZER PROMPT"
```

## The Prompt Template

The AI receives these instructions when analyzing your code:

```
You are an expert code analyzer. Analyze the provided codebase and extract comprehensive details.

**Repository Path:** [REPO_PATH]
**Framework Detected:** [FRAMEWORK]
**Files Analyzed:** [FILE_COUNT]

**YOUR TASK: Perform EXHAUSTIVE analysis and return structured JSON**

**SOURCE CODE FILES:**
[Actual source code files are inserted here...]

**ANALYSIS REQUIREMENTS:**

Extract the following with MAXIMUM detail and return as valid JSON:

## 1. ENTITIES (Domain Models)
For EACH entity, extract:
- name: Entity class name
- filePath: Relative file path
- packageName: Package/namespace
- annotations: Array of all annotations (@Entity, @Table, etc.)
- tableName: Database table name
- properties: Array of property objects with:
  * name, type, annotations, columnName, nullable, length, defaultValue, javadoc
- relationships: Array of relationship objects (@OneToMany, @ManyToOne, etc.)
- javadoc: Class-level documentation

## 2. CONTROLLERS (REST APIs)
For EACH controller, extract:
- name: Controller class name
- filePath: Relative file path
- packageName: Package/namespace
- baseMapping: Base URL path
- annotations: Array of class annotations
- endpoints: Array of endpoint objects with:
  * method: HTTP method (GET, POST, PUT, DELETE, PATCH)
  * path: Full endpoint path
  * methodName: Java/C# method name
  * parameters: Array of parameter objects
  * returnType: Return type
  * annotations: Method annotations
  * javadoc: Method documentation

## 3. SERVICES (Business Logic)
For EACH service, extract:
- name: Service class name
- filePath: Relative file path
- packageName: Package/namespace
- annotations: Array of annotations (@Service, @Transactional, etc.)
- methods: Array of method names
- dependencies: Array of injected dependencies

## 4. PAGES (Frontend - if applicable)
For EACH page/component:
- name, filePath, route

**OUTPUT FORMAT:**
Return ONLY valid JSON in this exact structure:
```json
{
  "framework": "Spring Boot" | "ASP.NET Core" | "Angular" | etc,
  "entities": [/* array of entity objects */],
  "controllers": [/* array of controller objects */],
  "services": [/* array of service objects */],
  "pages": [/* array of page objects */],
  "summary": {
    "totalEntities": number,
    "totalControllers": number,
    "totalEndpoints": number,
    "totalServices": number
  }
}
```

**CRITICAL RULES:**
1. Return ONLY the JSON structure above, wrapped in ```json code block
2. Be EXHAUSTIVE - extract EVERY entity, controller, service, endpoint
3. Include ALL annotations, properties, methods
4. Ensure valid JSON syntax (proper quotes, commas, brackets)
5. If a field is not present, use empty array [] or null

Start your analysis now and return the JSON structure.
```

## What Gets Sent to the AI

When you upload code for migration:

1. **Repository Path**: Full path to your uploaded code
2. **Framework**: Detected framework (Spring Boot, ASP.NET, etc.)
3. **File Count**: Number of source files found
4. **Source Files**: Up to 100 source files (.java, .cs, .ts)
   - Each file limited to 10,000 characters
   - Includes full file content and relative path

## Example Request to ARK

```json
{
  "input": "[The full prompt above + all source files]",
  "context": {
    "repoPath": "/path/to/uploaded/repo",
    "framework": "Spring Boot",
    "fileCount": 45,
    "task": "analyze-repository"
  }
}
```

## Example AI Response

The AI returns structured JSON like this:

```json
{
  "framework": "Spring Boot 2.7.x",
  "entities": [
    {
      "name": "User",
      "filePath": "src/main/java/com/bank/entities/User.java",
      "packageName": "com.bank.entities",
      "annotations": ["@Entity", "@Table(name='users')"],
      "tableName": "users",
      "properties": [
        {
          "name": "id",
          "type": "Long",
          "annotations": ["@Id", "@GeneratedValue"],
          "columnName": "id",
          "nullable": false
        }
      ],
      "relationships": [
        {
          "type": "OneToMany",
          "targetEntity": "Account",
          "fieldName": "accounts",
          "mappedBy": "user"
        }
      ]
    }
  ],
  "controllers": [
    {
      "name": "UserController",
      "filePath": "src/main/java/com/bank/controllers/UserController.java",
      "baseMapping": "/api/users",
      "endpoints": [
        {
          "method": "GET",
          "path": "/api/users/{id}",
          "methodName": "getUserById",
          "parameters": [
            {
              "name": "id",
              "type": "Long",
              "annotation": "@PathVariable"
            }
          ],
          "returnType": "ResponseEntity<User>"
        }
      ]
    }
  ],
  "summary": {
    "totalEntities": 15,
    "totalControllers": 8,
    "totalEndpoints": 47,
    "totalServices": 12
  }
}
```

## Implementation Details

### Files Modified

1. **`platform/backend/src/services/arkChatService.ts`**
   - `analyzeRepositoryWithARK()` - Main method that calls ARK agent
   - `buildCodeAnalysisPromptForARK()` - Builds the prompt with files
   - `getCodeAnalysisPromptTemplate()` - Returns prompt template for viewing
   - Logs full prompt before sending to ARK

2. **`platform/backend/src/routes/repoMigrationRoutes.ts`**
   - Replaced local analyzer with ARK agent calls
   - Added `/code-analyzer-prompt` endpoint
   - Smart fallback to local analyzer if ARK unavailable

### Configuration

- **Timeout**: 5 minutes (300,000ms) for large codebases
- **File Limit**: First 100 source files
- **File Size Limit**: 10,000 characters per file
- **File Types**: .java, .cs, .ts (excluding node_modules and test files)

## Testing

### Test the Prompt Endpoint
```bash
# Get the full prompt template
curl http://localhost:4000/api/repo-migration/code-analyzer-prompt | jq

# Get just the prompt text
curl -s http://localhost:4000/api/repo-migration/code-analyzer-prompt | jq -r '.promptTemplate'

# Get agent info
curl -s http://localhost:4000/api/repo-migration/code-analyzer-prompt | jq '.agent, .namespace, .arkUrl'
```

### Watch Analysis in Real-Time
```bash
# Watch backend logs during migration
tail -f .run-pids/backend.log

# Filter for code analyzer
tail -f .run-pids/backend.log | grep "CODE-ANALYZER"

# Watch Mock ARK (Ollama) processing
tail -f .run-pids/mock-ark.log
```

## Benefits of AI-Powered Analysis

✅ **Intelligent**: Understands code context better than regex
✅ **Flexible**: Handles different languages and frameworks
✅ **Accurate**: Extracts relationships and business logic
✅ **Exhaustive**: Gets ALL details including Javadoc, annotations, dependencies
✅ **Adaptable**: Can be improved by modifying the prompt

## Troubleshooting

### ARK Not Available
If ARK is unavailable, the system automatically falls back to local analyzer:
```
[WARN] ARK code-analyzer failed, falling back to local analyzer
```

### Large Codebases
For repositories with >100 files, only the first 100 are sent to AI. Consider:
- Splitting into smaller chunks
- Focusing on core business logic files
- Increasing file limit in arkChatService.ts

### Timeout Issues
If analysis times out (>5 minutes):
- Check Ollama performance
- Reduce number of files
- Increase timeout in arkChatService.ts

## Next Steps

To improve the analysis prompt:
1. Edit `buildCodeAnalysisPromptForARK()` in arkChatService.ts
2. Add more extraction rules
3. Specify additional annotations or patterns
4. Test with sample repositories
5. View results via API endpoint

---

**API Endpoint**: `GET http://localhost:4000/api/repo-migration/code-analyzer-prompt`
**Agent**: `code-analyzer`
**Namespace**: `banque-migration`
**ARK URL**: `http://localhost:8080`
