<template>
  <div class="app-layout">
    <NuxtPage />
  </div>
</template>

<style>
:root {
  --primary-navy: #0B132B;
  --primary-slate: #1C2541;
  --secondary-gold: #D4AF37;
  --accent-amber: #F59E0B;
  --bg-color: #F8FAFC;
  --surface-color: #FFFFFF;
  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --border-color: #E2E8F0;
  --success: #10B981;
  --danger: #EF4444;
  --radius-sm: 8px;
  --radius-lg: 16px;
  --shadow-subtle: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  --shadow-glow: 0 0 15px rgba(212, 175, 55, 0.3);
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

button {
  cursor: pointer;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

input, select {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s ease;
  outline: none;
}

input:focus, select:focus {
  border-color: var(--secondary-gold);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

/* Scrollbar styling for elegance */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: var(--bg-color);
}
::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94A3B8;
}
</style>