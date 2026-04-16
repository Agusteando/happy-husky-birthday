<template>
  <div class="app-layout">
    <NuxtPage />
  </div>
</template>

<style>
:root {
  --primary-color: #0f172a;
  --secondary-color: #d4af37; /* Gold for birthday accents */
  --bg-color: #f8fafc;
  --surface-color: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --success: #10b981;
  --danger: #ef4444;
  --radius: 8px;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-primary);
}

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

button {
  cursor: pointer;
  border: none;
  border-radius: var(--radius);
  font-weight: 500;
  transition: all 0.2s ease;
}

input, select {
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 8px 12px;
  font-size: 14px;
}
</style>