#!/usr/bin/env python3
"""
Phase 2: Add code generation step after e2e-test-validator
"""

import re

# Read the file
with open('platform/backend/src/routes/repoMigrationRoutes.ts', 'r') as f:
    content = f.read()

print("Starting Phase 2 refactoring...")

# ============================================================================
# CHANGE 4: Add code generation after e2e-test-validator
# ============================================================================
print("4. Adding code generation step after e2e-test-validator...")

# Find where e2e-test-validator completes
e2e_completion_pattern = r'(    emitAgentCompleted\(migrationId, \'e2e-test-validator\', e2eTestOutput\);\n    logger\.info\(\'✅ \[E2E TEST VALIDATOR\] Complete\'\);)'

code_generation_step = '''    emitAgentCompleted(migrationId, 'e2e-test-validator', e2eTestOutput);
    logger.info('✅ [E2E TEST VALIDATOR] Complete');

    // ============================================================================
    // CODE GENERATION STEP - Generate all files after all validators pass
    // ============================================================================
    await new Promise(resolve => setTimeout(resolve, 1000));
    logger.info('📦 [CODE GENERATION] Starting code generation...');
    emitAgentLog(migrationId, 'e2e-test-validator', 'info', '📦 All validators complete - generating code files');

    try {
      // Generate Spring Boot microservices
      logger.info('📦 [CODE GENERATION] Generating Spring Boot microservices...');
      emitAgentLog(migrationId, 'e2e-test-validator', 'info', '⚙️ Generating Spring Boot microservices');

      const serviceGenerator = new SpringBootServiceGenerator();
      for (const service of migrationPlan.microservices) {
        await serviceGenerator.generateService(
          path.join(outputDir, 'microservices'),
          {
            name: service.name,
            domain: service.name.replace(/-/g, ''),
            port: service.port,
            entities: service.entities || []
          }
        );
        const progress = ((migrationPlan.microservices.indexOf(service) + 1) / migrationPlan.microservices.length) * 50;
        logger.info(`📦 [CODE GENERATION] Generated ${service.name} (${progress.toFixed(0)}% backend)`);
      }

      logger.info('✅ [CODE GENERATION] All Spring Boot microservices generated');
      emitAgentLog(migrationId, 'e2e-test-validator', 'info', '✅ Spring Boot microservices generated');

      // Generate Angular micro-frontends
      logger.info('📦 [CODE GENERATION] Generating Angular micro-frontends...');
      emitAgentLog(migrationId, 'e2e-test-validator', 'info', '🎨 Generating Angular micro-frontends');

      const mfeGenerator = new AngularMicroFrontendGenerator();
      for (const mfe of migrationPlan.microFrontends) {
        await mfeGenerator.generateMicroFrontend(
          path.join(outputDir, 'micro-frontends'),
          {
            name: mfe.name,
            port: mfe.port,
            isHost: mfe.isHost || false,
            routes: mfe.routes || [],
            components: mfe.components || []
          }
        );
        const progress = 50 + ((migrationPlan.microFrontends.indexOf(mfe) + 1) / migrationPlan.microFrontends.length) * 50;
        logger.info(`📦 [CODE GENERATION] Generated ${mfe.name} (${progress.toFixed(0)}% total)`);
      }

      logger.info('✅ [CODE GENERATION] All Angular micro-frontends generated');
      emitAgentLog(migrationId, 'e2e-test-validator', 'info', '✅ Angular micro-frontends generated');

      // Create ZIP archive for download
      logger.info('📦 [CODE GENERATION] Creating ZIP archive...');
      emitAgentLog(migrationId, 'e2e-test-validator', 'info', '📦 Creating downloadable ZIP archive');

      const archiver = require('archiver');
      const outputPath = path.join(outputsDir, `migration-${migrationId}.zip`);
      const outputStream = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(outputStream);
      archive.directory(outputDir, false);
      await archive.finalize();

      await new Promise((resolve, reject) => {
        outputStream.on('close', resolve);
        outputStream.on('error', reject);
      });

      // Mark code as downloadable
      (migration as any).codeDownloadable = true;
      (migration as any).downloadPath = outputPath;

      logger.info(`✅ [CODE GENERATION] Complete - ZIP created: ${outputPath}`);
      emitAgentLog(migrationId, 'e2e-test-validator', 'info', `✅ Code generation complete! Download: migration-${migrationId}.zip`);

    } catch (codeGenError: any) {
      logger.error('[CODE GENERATION] Failed:', codeGenError);
      emitAgentLog(migrationId, 'e2e-test-validator', 'error', `❌ Code generation failed: ${codeGenError.message}`);
      (migration as any).codeDownloadable = false;
    }'''

content = re.sub(e2e_completion_pattern, code_generation_step, content, count=1)

print("   ✓ Code generation step added after e2e-test-validator")

# Write the modified content back
with open('platform/backend/src/routes/repoMigrationRoutes.ts', 'w') as f:
    f.write(content)

print("\n✅ Phase 2 complete: Code generation now happens after all validators")
print("\n🎉 All refactoring complete!")
print("\nChanges made:")
print("1. ✅ Removed file generation from service-generator")
print("2. ✅ Removed file generation from frontend-migrator")
print("3. ✅ Quality-validator now uses ARK agent")
print("4. ✅ Code generation happens after e2e-test-validator completes")
print("\nNext steps:")
print("- Restart backend: cd platform/backend && npm run dev")
print("- Test the workflow with a migration")
