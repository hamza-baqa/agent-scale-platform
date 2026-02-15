# How to Upload Workflow to n8n

## Quick Steps

1. **Install n8n with ARK Custom Nodes**
   ```bash
   helm install ark-n8n oci://ghcr.io/skokaina/charts/ark-n8n \
     -f https://raw.githubusercontent.com/skokaina/ark-n8n-custom-nodes/main/chart/values-demo.yaml \
     --namespace default

   # Port forward
   kubectl port-forward svc/ark-n8n 5678:5678 -n default
   ```

2. **Access n8n Dashboard**
   - Open: http://localhost:5678
   - Login: `admin@example.com` / `Admin123!@#`

3. **Configure ARK Credentials**
   - Go to: **Settings** → **Credentials**
   - Click: **Add Credential**
   - Select: **ARK API**
   - Configure:
     - **Name**: ARK Default
     - **Base URL**: `http://ark-api.default.svc.cluster.local`
     - **Namespace**: `default`
   - Click: **Save**

4. **Import Workflow**
   - Click: **Workflows** (left sidebar)
   - Click: **Add Workflow** → **Import from File**
   - Select: `platform/n8n-workflow-ark-custom-nodes.json`
   - Click: **Import**

5. **Configure Workflow**
   - Open the imported workflow
   - Click on each ARK node:
     - **ARK Agent: Code Analyzer**
     - **ARK Agent Advanced: Migration Planner**
     - **ARK Agent: Service Generator**
     - **ARK Agent: Frontend Migrator**
     - **ARK Evaluation: Quality Validator**
   - For each node:
     - Select **Credential**: ARK Default
     - Verify **Agent Name** appears in dropdown
     - Click **Save**

6. **Activate Workflow**
   - Toggle: **Active** (top right)
   - Copy webhook URL: `http://localhost:5678/webhook/migration-ark-custom`

7. **Test the Workflow**
   ```bash
   curl -X POST http://localhost:5678/webhook/migration-ark-custom \
     -H "Content-Type: application/json" \
     -d '{
       "repositoryPath": "/path/to/repo",
       "repositoryUrl": "https://github.com/user/repo",
       "outputPath": "/workspace/output",
       "notificationUrl": "http://backend:4000/api/webhook/notify",
       "migrationId": "test-123"
     }'
   ```

## Workflow Features

✓ **ARK Custom Nodes** - Native integration with ARK agents
✓ **Agent Selection** - Dropdown menus for agent selection
✓ **Session Management** - Automatic conversation memory
✓ **Quality Evaluation** - Built-in scoring and validation
✓ **Parallel Execution** - Service + Frontend generation in parallel
✓ **Quality Gates** - Automatic pause if quality < 70%

## Monitoring

- **View Executions**: Click **Executions** in left sidebar
- **Real-time Progress**: See each node's input/output
- **Agent Responses**: View full ARK agent outputs
- **Error Handling**: See which node failed and why

## Troubleshooting

### Agents not appearing in dropdown
```bash
# Verify ARK API is accessible
kubectl exec -it deployment/ark-n8n -n default -- \
  curl http://ark-api.default.svc.cluster.local/v1/agents
```

### Workflow fails immediately
- Check ARK credentials are configured correctly
- Verify agents exist: `kubectl get agents -n default`
- Check agent status: `ark agents`

### Timeout errors
- Increase timeout in node settings (Options → Timeout)
- Check agent logs: `kubectl logs -l agent=code-analyzer -n default`
