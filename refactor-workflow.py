#!/usr/bin/env python3
"""
Refactor repoMigrationRoutes.ts to:
1. Remove file generation from service-generator and frontend-migrator
2. Make quality-validator use ARK
3. Add code generation after e2e-test-validator
"""

import re

# Read the file
with open('platform/backend/src/routes/repoMigrationRoutes.ts', 'r') as f:
    content = f.read()

print("Starting refactoring...")

# ============================================================================
# CHANGE 1: Remove file generation from service-generator
# ============================================================================
print("1. Removing file generation from service-generator...")

# Find and comment out the SpringBootServiceGenerator calls in service-generator
service_gen_pattern = r'(      // Also generate actual files using local generator for download\n      const serviceGenerator = new SpringBootServiceGenerator\(\);[\s\S]*?serviceGenRawOutput = `Generated \$\{migrationPlan\.microservices\.length\} Spring Boot microservices locally\.`;)'

content = re.sub(
    service_gen_pattern,
    r'      // CODE GENERATION MOVED TO END OF WORKFLOW\n      // File generation will happen after all validators complete\n      serviceGenRawOutput = `Service specifications prepared. Code generation will occur after validation.`;',
    content,
    count=1
)

# Also handle the ARK success case
service_gen_ark_pattern = r'(      // Also generate actual files using local generator for download\n      const serviceGenerator = new SpringBootServiceGenerator\(\);\n      for \(const service of migrationPlan\.microservices\) \{\n        await serviceGenerator\.generateService\([\s\S]*?\n      \}\n      \}\n    \} else \{)'

content = re.sub(
    service_gen_ark_pattern,
    r'      // CODE GENERATION MOVED TO END OF WORKFLOW\n      // Files will be generated after all validators complete\n    } else {',
    content,
    count=1
)

print("   ✓ Service generator file generation removed")

# ============================================================================
# CHANGE 2: Remove file generation from frontend-migrator
# ============================================================================
print("2. Removing file generation from frontend-migrator...")

# Find and comment out the AngularMicroFrontendGenerator calls
frontend_gen_pattern = r'(      // Also generate actual files using local generator for download\n      const mfeGenerator = new AngularMicroFrontendGenerator\(\);[\s\S]*?frontendGenRawOutput = `Generated \$\{migrationPlan\.microFrontends\.length\} Angular micro-frontends locally\.`;)'

content = re.sub(
    frontend_gen_pattern,
    r'      // CODE GENERATION MOVED TO END OF WORKFLOW\n      // File generation will happen after all validators complete\n      frontendGenRawOutput = `Frontend specifications prepared. Code generation will occur after validation.`;',
    content,
    count=1
)

# Also handle the ARK success case
frontend_gen_ark_pattern = r'(      // Also generate actual files using local generator for download\n      const mfeGenerator = new AngularMicroFrontendGenerator\(\);\n      for \(const mfe of migrationPlan\.microFrontends\) \{\n        await mfeGenerator\.generateMicroFrontend\([\s\S]*?\n      \}\n      \}\n    \} else \{)'

content = re.sub(
    frontend_gen_ark_pattern,
    r'      // CODE GENERATION MOVED TO END OF WORKFLOW\n      // Files will be generated after all validators complete\n    } else {',
    content,
    count=1
)

# Remove ZIP creation from frontend-migrator
zip_creation_pattern = r'(    // Create ZIP archive for download[\s\S]*?emitAgentLog\(migrationId, \'frontend-migrator\', \'warn\', \'⚠️ Failed to create ZIP archive, but code files are available\'\);\n    \})'

content = re.sub(
    zip_creation_pattern,
    r'    // ZIP ARCHIVE CREATION MOVED TO END OF WORKFLOW\n    // Will be created after all validators and code generation complete',
    content,
    count=1
)

print("   ✓ Frontend migrator file generation removed")

# ============================================================================
# CHANGE 3: Replace quality-validator with ARK call
# ============================================================================
print("3. Replacing quality-validator with ARK call...")

# Find the quality-validator section and replace it
quality_validator_old = r'    // Step 5: Quality Validator - COMPREHENSIVE FUNCTIONAL VALIDATION[\s\S]*?    // Run tests regardless of quality validation result\n    logger\.info\(\'🧪 \[TEST VALIDATORS\] Starting test validation phase\'\);\n    emitAgentLog\(migrationId, \'quality-validator\', \'info\', \'→ Proceeding to test validation\'\);'

quality_validator_new = '''    // Step 5: Quality Validator - Use ARK agent for validation
    await new Promise(resolve => setTimeout(resolve, 1000));
    emitAgentStarted(migrationId, 'quality-validator');
    logger.info('✅ [QUALITY VALIDATOR] Running quality validation via ARK...');
    emitAgentLog(migrationId, 'quality-validator', 'info', '🔍 Starting quality validation via ARK');

    let validationOutput = '';
    let qualityValidationPassed = false;

    try {
      // Call ARK quality-validator agent
      const qualityValidatorPrompt = `Validate the quality of the generated code design and specifications.

**Migration Plan**:
${JSON.stringify(migrationPlan, null, 2)}

**Service Generator Output**:
${serviceGenRawOutput}

**Frontend Migrator Output**:
${frontendGenRawOutput}

**Source Code Path**: ${repoPath}

Validate:
1. Architecture and design quality
2. Security best practices
3. Configuration completeness
4. Docker readiness
5. Functional equivalence with source code

Generate a comprehensive quality validation report with pass/fail status.`;

      emitAgentLog(migrationId, 'quality-validator', 'info', '📡 Calling ARK quality-validator agent');
      const qualityValidatorResult = await arkChatService.callArkAgent(
        'quality-validator',
        qualityValidatorPrompt
      );

      if (qualityValidatorResult.success && qualityValidatorResult.rawOutput) {
        validationOutput = qualityValidatorResult.rawOutput;
        qualityValidationPassed = validationOutput.toLowerCase().includes('pass') || validationOutput.includes('✅');
        emitAgentLog(migrationId, 'quality-validator', 'info', '✅ Quality validation complete via ARK');
      } else {
        throw new Error('Quality validation failed via ARK');
      }

      emitAgentCompleted(migrationId, 'quality-validator', validationOutput);
      logger.info('✅ [QUALITY VALIDATOR] Complete');

    } catch (error: any) {
      logger.error('[Quality Validator] Validation failed:', error);
      validationOutput += `\\n\\n❌ **Validation Error:** ${error.message}\\n`;
      qualityValidationPassed = false;
      emitAgentCompleted(migrationId, 'quality-validator', validationOutput);
      emitAgentLog(migrationId, 'quality-validator', 'error', '❌ Quality validation failed');
    }

    // Continue to test validators regardless of quality validation result
    logger.info('🧪 [TEST VALIDATORS] Starting test validation phase');
    emitAgentLog(migrationId, 'quality-validator', 'info', '→ Proceeding to test validators');'''

content = re.sub(quality_validator_old, quality_validator_new, content, count=1, flags=re.DOTALL)

print("   ✓ Quality validator now uses ARK")

# Write the modified content back
with open('platform/backend/src/routes/repoMigrationRoutes.ts', 'w') as f:
    f.write(content)

print("\n✅ Phase 1 complete: Removed file generation and updated quality-validator")
print("Next: Run refactor-workflow-phase2.py to add code generation after e2e-test-validator")
