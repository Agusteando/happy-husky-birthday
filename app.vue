<template>
  <div class="app-layout">
    <NuxtPage />
  </div>
</template>

<style>
:root {
  /* Soft Premium Palette */
  --primary-navy: #2D3748;
  --primary-slate: #4A5568;
  --secondary-gold: #D4AF37;
  --accent-amber: #ED8936;
  --bg-color: #FAF9F6;
  --surface-color: #FFFFFF;
  --text-primary: #1A202C;
  --text-secondary: #718096;
  --border-color: #E2E8F0;
  --success: #48BB78;
  --danger: #F56565;
  --radius-sm: 12px;
  --radius-lg: 24px;
  --shadow-subtle: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
  --shadow-hover: 0 20px 50px -15px rgba(0, 0, 0, 0.1);
  --shadow-glow: 0 0 20px rgba(212, 175, 55, 0.2);
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

input, select, textarea {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;
  outline: none;
  background-color: var(--surface-color);
}

input:focus, select:focus, textarea:focus {
  border-color: var(--secondary-gold);
  box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1);
}

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

.glass-panel {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: var(--shadow-subtle);
}
</style>