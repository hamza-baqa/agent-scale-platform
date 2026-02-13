#!/usr/bin/env node

/**
 * Direct test of ARK code generation
 * This will call the ARK agents and show exactly what they return
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const ARK_API_URL = 'http://localhost:8080';
const TEST_OUTPUT = path.join(__dirname, 'test-output');

async function testArkCodeGeneration() {
  console.log('🧪 Testing ARK Code Generation');
  console.log('================================\n');

  // Clean test output
  await fs.remove(TEST_OUTPUT);
  await fs.ensureDir(TEST_OUTPUT);

  // Test 1: Check ARK API is available
  console.log('1️⃣  Checking ARK API...');
  try {
    const healthResponse = await axios.get(`${ARK_API_URL}/health`, { timeout: 5000 });
    console.log('✅ ARK API is available\n');
  } catch (error) {
    console.log('❌ ARK API not available at', ARK_API_URL);
    console.log('   Make sure ARK is running: kubectl port-forward -n default svc/ark-api 8080:80\n');
    process.exit(1);
  }

  // Test 2: Call service-generator agent
  console.log('2️⃣  Calling ARK service-generator agent...');
  const servicePrompt = `Generate a complete Spring Boot microservice for authentication.

Create an auth-service with:
- User entity (id, email, password, roles)
- UserRepository
- AuthService (login, register)
- AuthController (POST /api/auth/login, POST /api/auth/register)
- JWT security configuration
- Complete pom.xml
- Dockerfile

**CRITICAL**: Use this EXACT format for EVERY file:

**auth-service/pom.xml:**
\`\`\`xml
<?xml version="1.0"?>
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.eurobank</groupId>
  <artifactId>auth-service</artifactId>
  <version>1.0.0</version>
</project>
\`\`\`

Generate complete, compilable code.`;

  let serviceResponse;
  try {
    const response = await axios.post(
      `${ARK_API_URL}/agent/service-generator`,
      {
        input: servicePrompt,
        context: {}
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000 // 2 minutes
      }
    );

    serviceResponse = response.data;
    console.log('✅ ARK service-generator responded');
    console.log(`   Response length: ${JSON.stringify(serviceResponse).length} chars\n`);

    // Save raw response
    await fs.writeFile(
      path.join(TEST_OUTPUT, 'service-generator-response.txt'),
      JSON.stringify(serviceResponse, null, 2)
    );

  } catch (error) {
    console.log('❌ ARK service-generator failed:', error.message, '\n');
    process.exit(1);
  }

  // Test 3: Extract code from response
  console.log('3️⃣  Extracting code from ARK response...');

  const responseText = typeof serviceResponse === 'string'
    ? serviceResponse
    : (serviceResponse.output || serviceResponse.response || JSON.stringify(serviceResponse));

  // Look for code blocks
  const codeBlockPattern = /\*\*([^*]+?):\*\*\s*\n+```(\w+)\n([\s\S]*?)```/g;
  let match;
  let filesFound = 0;

  while ((match = codeBlockPattern.exec(responseText)) !== null) {
    const filepath = match[1].trim();
    const language = match[2];
    const code = match[3].trim();

    console.log(`   Found: ${filepath} (${language}, ${code.length} bytes)`);

    // Write file to test output
    const fullPath = path.join(TEST_OUTPUT, filepath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, code);

    filesFound++;
  }

  if (filesFound === 0) {
    console.log('❌ NO code blocks found in ARK response!');
    console.log('   Response preview:');
    console.log('   ' + responseText.substring(0, 500));
    console.log('\n   Full response saved to: test-output/service-generator-response.txt\n');
    process.exit(1);
  }

  console.log(`✅ Extracted ${filesFound} files\n`);

  // Test 4: Verify files
  console.log('4️⃣  Verifying extracted files...');
  const files = await fs.readdir(TEST_OUTPUT, { recursive: true });

  console.log('   Files created:');
  for (const file of files) {
    const stat = await fs.stat(path.join(TEST_OUTPUT, file));
    if (stat.isFile()) {
      console.log(`   - ${file} (${stat.size} bytes)`);
    }
  }

  console.log('\n================================');
  console.log('🎉 TEST COMPLETED SUCCESSFULLY!');
  console.log('================================\n');
  console.log('✅ ARK API is working');
  console.log(`✅ service-generator returned ${filesFound} files`);
  console.log('✅ Code extraction is working');
  console.log(`✅ Files saved to: ${TEST_OUTPUT}`);
  console.log('\nNext: Check if migration workflow is calling ARK agents correctly\n');
}

testArkCodeGeneration().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
