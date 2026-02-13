#!/usr/bin/env node

/**
 * Mock ARK Service
 *
 * A lightweight service that simulates ARK API locally
 * Allows testing ARK chat integration without Kubernetes
 *
 * Usage: node mock-ark-service.js
 */

const http = require('http');
const https = require('https');

const PORT = 8080;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'your-api-key-here';

console.log('='.repeat(60));
console.log('Mock ARK Service');
console.log('='.repeat(60));
console.log('');
console.log('Purpose: Simulate ARK API for local testing');
console.log(`Port: ${PORT}`);
console.log(`API Key: ${ANTHROPIC_API_KEY.substring(0, 20)}...`);
console.log('');
console.log('Endpoints:');
console.log('  GET  /health');
console.log('  POST /api/v1/agents/:namespace/:agent/invoke');
console.log('');

// Call Anthropic API
function callAnthropic(prompt, callback) {
  const data = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    temperature: 0.7,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': ANTHROPIC_API_KEY,
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      try {
        const parsed = JSON.parse(responseData);
        // Log API response for debugging
        if (parsed.error) {
          console.error('  Anthropic API Error:', parsed.error.message || parsed.error.type);
        }
        callback(null, parsed);
      } catch (error) {
        console.error('  Failed to parse Anthropic response:', responseData.substring(0, 200));
        callback(error);
      }
    });
  });

  req.on('error', (error) => {
    callback(error);
  });

  req.write(data);
  req.end();
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;
  const method = req.method;

  console.log(`[${new Date().toISOString()}] ${method} ${url}`);

  // Health check
  if (method === 'GET' && url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'mock-ark',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Agent invoke endpoint
  const invokeMatch = url.match(/\/api\/v1\/agents\/([^\/]+)\/([^\/]+)\/invoke/);
  if (method === 'POST' && invokeMatch) {
    const namespace = invokeMatch[1];
    const agent = invokeMatch[2];

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const prompt = payload.input || '';

        console.log(`  Namespace: ${namespace}`);
        console.log(`  Agent: ${agent}`);
        console.log(`  Prompt length: ${prompt.length}`);

        // Call Anthropic
        console.log('  Calling Anthropic API...');
        callAnthropic(prompt, (error, anthropicResponse) => {
          if (error) {
            console.error('  Error:', error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'Failed to call Anthropic API',
              message: error.message
            }));
            return;
          }

          // Extract response
          const content = anthropicResponse.content && anthropicResponse.content[0]
            ? anthropicResponse.content[0].text
            : 'No response from AI';

          console.log(`  Response length: ${content.length}`);

          // Return in ARK format
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'completed',
            agent: agent,
            namespace: namespace,
            output: content,
            result: content,
            metadata: {
              model: 'claude-3-opus-20240229',
              timestamp: new Date().toISOString()
            }
          }));
        });

      } catch (error) {
        console.error('  Parse error:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid request',
          message: error.message
        }));
      }
    });

    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not found',
    path: url
  }));
});

server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`Mock ARK Service running on http://localhost:${PORT}`);
  console.log('='.repeat(60));
  console.log('');
  console.log('Ready to handle requests!');
  console.log('');
  console.log('Test with:');
  console.log(`  curl http://localhost:${PORT}/health`);
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('Shutting down Mock ARK Service...');
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});
