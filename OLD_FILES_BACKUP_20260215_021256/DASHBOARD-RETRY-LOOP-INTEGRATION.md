# Dashboard Retry Loop Integration Guide

## Changes Required in platform/frontend/src/app/dashboard/page.tsx

### 1. Add Import (at top of file, around line 10-20)

```typescript
import RetryLoopCard from '@/components/RetryLoopCard';
```

### 2. Add Retry Loop State (around line 295, after existing useState declarations)

```typescript
// Retry Loop State
const [retryLoopState, setRetryLoopState] = useState<{
  isActive: boolean;
  currentAttempt: number;
  maxRetries: number;
  phase: 'analyzing' | 'improving-plan' | 'regenerating' | 'validating' | 'idle';
  totalErrors: number;
  errorsHistory: Array<{
    attempt: number;
    errors: number;
    errorsFixed: number;
  }>;
  status: 'in-progress' | 'success' | 'failed' | 'idle';
}>({
  isActive: false,
  currentAttempt: 0,
  maxRetries: 3,
  phase: 'idle',
  totalErrors: 0,
  errorsHistory: [],
  status: 'idle'
});
```

### 3. Add WebSocket Event Listeners (in useEffect after existing event listeners, around line 520-530)

```typescript
// Retry Loop Events
const handleRetryLoopStarted = (data: any) => {
  if (data.migrationId === migrationId) {
    console.log('🔄 Retry loop started:', data);
    setRetryLoopState(prev => ({
      ...prev,
      isActive: true,
      currentAttempt: data.attempt,
      maxRetries: data.maxRetries,
      totalErrors: data.totalErrors,
      status: 'in-progress',
      phase: 'analyzing'
    }));
    addActivity('info', undefined, `🔄 Retry ${data.attempt}/${data.maxRetries} started - ${data.totalErrors} errors to fix`);
  }
};

const handleRetryLoopProgress = (data: any) => {
  if (data.migrationId === migrationId) {
    console.log('📊 Retry loop progress:', data);
    setRetryLoopState(prev => ({
      ...prev,
      phase: data.phase
    }));
    addActivity('info', undefined, `${data.message}`);
  }
};

const handleRetryLoopIterationCompleted = (data: any) => {
  if (data.migrationId === migrationId) {
    console.log('✅ Retry iteration completed:', data);
    setRetryLoopState(prev => ({
      ...prev,
      errorsHistory: [
        ...prev.errorsHistory,
        {
          attempt: data.attempt,
          errors: data.errorsRemaining,
          errorsFixed: data.errorsFixed
        }
      ],
      totalErrors: data.errorsRemaining
    }));
    addActivity('info', undefined, `✅ Retry ${data.attempt} complete - ${data.errorsRemaining} errors remaining (${data.errorsFixed} fixed)`);
  }
};

const handleRetryLoopSuccess = (data: any) => {
  if (data.migrationId === migrationId) {
    console.log('🎉 Retry loop success!', data);
    setRetryLoopState(prev => ({
      ...prev,
      status: 'success',
      isActive: false,
      totalErrors: 0,
      phase: 'idle'
    }));
    addActivity('info', undefined, `🎉 SUCCESS! Zero errors achieved after ${data.totalAttempts} attempt(s)`);
  }
};

const handleRetryLoopFailed = (data: any) => {
  if (data.migrationId === migrationId) {
    console.log('❌ Retry loop failed:', data);
    setRetryLoopState(prev => ({
      ...prev,
      status: 'failed',
      isActive: false,
      phase: 'idle'
    }));
    addActivity('info', undefined, `❌ Max retries reached - ${data.errorsRemaining} errors remain`);
  }
};

// Subscribe to retry loop events
websocketService.onRetryLoopStarted(handleRetryLoopStarted);
websocketService.onRetryLoopProgress(handleRetryLoopProgress);
websocketService.onRetryLoopIterationCompleted(handleRetryLoopIterationCompleted);
websocketService.onRetryLoopSuccess(handleRetryLoopSuccess);
websocketService.onRetryLoopFailed(handleRetryLoopFailed);
```

### 4. Add Cleanup in useEffect Return (around line 600-610)

```typescript
return () => {
  // ... existing cleanup code ...

  // Remove retry loop event listeners
  websocketService.offRetryLoopStarted(handleRetryLoopStarted);
  websocketService.offRetryLoopProgress(handleRetryLoopProgress);
  websocketService.offRetryLoopIterationCompleted(handleRetryLoopIterationCompleted);
  websocketService.offRetryLoopSuccess(handleRetryLoopSuccess);
  websocketService.offRetryLoopFailed(handleRetryLoopFailed);
};
```

### 5. Add RetryLoopCard to JSX (around line 1250, before the Activity Feed button section)

```tsx
{/* Retry Loop Card - Shows intelligent retry progress */}
{migration && (
  <div className="mb-4">
    <RetryLoopCard retryLoopState={retryLoopState} />
  </div>
)}
```

## Changes Required in platform/frontend/src/services/websocketService.ts

### Add Event Listener Methods (at the end of the class, before export)

```typescript
// Retry Loop Events
onRetryLoopStarted(callback: (data: any) => void) {
  if (this.socket) {
    this.socket.on('retry-loop-started', callback);
  }
}

offRetryLoopStarted(callback: (data: any) => void) {
  if (this.socket) {
    this.socket.off('retry-loop-started', callback);
  }
}

onRetryLoopProgress(callback: (data: any) => void) {
  if (this.socket) {
    this.socket.on('retry-loop-progress', callback);
  }
}

offRetryLoopProgress(callback: (data: any) => void) {
  if (this.socket) {
    this.socket.off('retry-loop-progress', callback);
  }
}

onRetryLoopIterationCompleted(callback: (data: any) => void) {
  if (this.socket) {
    this.socket.on('retry-loop-iteration-completed', callback);
  }
}

offRetryLoopIterationCompleted(callback: (data: any) => void) {
  if (this.socket) {
    this.socket.off('retry-loop-iteration-completed', callback);
  }
}

onRetryLoopSuccess(callback: (data: any) => void) {
  if (this.socket) {
    this.socket.on('retry-loop-success', callback);
  }
}

offRetryLoopSuccess(callback: (data: any) => void) {
  if (this.socket) {
    this.socket.off('retry-loop-success', callback);
  }
}

onRetryLoopFailed(callback: (data: any) => void) {
  if (this.socket) {
    this.socket.on('retry-loop-failed', callback);
  }
}

offRetryLoopFailed(callback: (data: any) => void) {
  if (this.socket) {
    this.socket.off('retry-loop-failed', callback);
  }
}
```

## Summary

After these changes:
1. ✅ Retry loop state will be tracked
2. ✅ WebSocket events will update the UI in real-time
3. ✅ RetryLoopCard will display retry progress beautifully
4. ✅ Users will see errors decreasing: 25 → 12 → 0
5. ✅ Success/failure states clearly indicated

The retry loop will be fully visible in the dashboard!
