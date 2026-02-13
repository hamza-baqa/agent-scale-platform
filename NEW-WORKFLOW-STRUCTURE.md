# New Workflow Structure

## Changes Requested

1. **Don't generate code early** - service-generator and frontend-migrator should only do ARK analysis/design
2. **Generate code at the end** - After all validators pass, generate the complete code package
3. **All validators use ARK** - quality-validator should call ARK agent like the others

## New Workflow Sequence

```
1. code-analyzer (ARK)
   → Analyzes source code
   → Outputs: entities, endpoints, architecture analysis

2. migration-planner (ARK)
   → Creates migration plan
   → Outputs: microservices list, MFEs list, migration strategy

3. service-generator (ARK)
   → Designs Spring Boot microservices
   → Outputs: service specifications, API designs, entity models
   → NO FILE GENERATION YET

4. frontend-migrator (ARK)
   → Designs Angular micro-frontends
   → Outputs: MFE specifications, component designs, routing
   → NO FILE GENERATION YET

5. quality-validator (ARK) ← NOW USES ARK!
   → Validates the designs and specifications
   → Checks architecture, security, best practices
   → Outputs: validation report with issues/recommendations

6. unit-test-validator (ARK)
   → Plans unit test strategy
   → Outputs: test specifications, coverage targets

7. integration-test-validator (ARK)
   → Plans integration test strategy
   → Outputs: integration test specifications

8. e2e-test-validator (ARK)
   → Plans E2E test strategy
   → Outputs: E2E test scenarios

9. CODE GENERATION STEP ← NEW!
   → Uses specifications from steps 3-8
   → Generates ALL files:
     - Spring Boot microservices (from service-generator specs)
     - Angular MFEs (from frontend-migrator specs)
     - Unit tests (from unit-test-validator specs)
     - Integration tests (from integration-test-validator specs)
     - E2E tests (from e2e-test-validator specs)
     - Dockerfiles
     - docker-compose.yml
     - README files
   → Outputs: Complete code package ready for download

10. container-deployer
    → Deploys generated code
    → Outputs: deployment status, URLs
```

## Benefits

1. **All validation happens before code generation** - No wasted time generating code that fails validation
2. **ARK does all the thinking** - Consistent AI-powered validation across all steps
3. **Code generation is single-step** - All files generated together with consistency
4. **Better error handling** - If validation fails, no files are generated
5. **Download button appears correctly** - Only after all validation passes and code is generated

## Implementation Plan

### Step 1: Update repoMigrationRoutes.ts

Remove file generation from:
- service-generator (lines 1186-1199, 1206-1221)
- frontend-migrator (lines 1255-1269, 1276-1292)

### Step 2: Update quality-validator

Replace functionalValidator with ARK call:
- Change lines 1325-1440 to call `arkChatService.callArkAgent('quality-validator', ...)`

### Step 3: Add code generation step

After e2e-test-validator completes:
- Create new agent: 'code-generator'
- Generate all files using SpringBootServiceGenerator and AngularMicroFrontendGenerator
- Use specifications from previous agents
- Emit progress as files are generated

### Step 4: Update frontend dashboard

Add 'code-generator' agent card between e2e-test-validator and container-deployer
