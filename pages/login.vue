<template>
  <div class="login-container">
    <div class="login-card">
      <img src="/main.png" alt="Logo" class="login-logo" />
      <img src="/hhb.png" alt="HHB" class="login-hhb" />
      <h2>Acceso Administrativo</h2>
      <p>Inicia sesión con tu cuenta de Google Workspace para continuar.</p>
      <div id="g_id_onload"
           data-client_id="YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER"
           data-context="signin"
           data-ux_mode="popup"
           data-callback="handleCredentialResponse"
           data-auto_prompt="false">
      </div>
      <div class="g_id_signin"
           data-type="standard"
           data-shape="rectangular"
           data-theme="outline"
           data-text="signin_with"
           data-size="large"
           data-logo_alignment="left">
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  window.handleCredentialResponse = async (response) => {
    try {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: { token: response.credential }
      })
      window.location.href = '/'
    } catch (e) {
      alert('Error de autenticación. Verifica tus permisos.')
    }
  }
})
</script>

<style scoped>
.login-container {
  display: flex; justify-content: center; align-items: center; min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-color) 0%, #1e293b 100%);
}
.login-card {
  background: white; padding: 48px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  text-align: center; max-width: 400px; display: flex; flex-direction: column; align-items: center; gap: 16px;
}
.login-logo { height: 60px; margin-bottom: 8px; }
.login-hhb { height: 50px; margin-bottom: 16px; }
h2 { margin: 0; color: var(--primary-color); }
p { color: var(--text-secondary); margin-bottom: 24px; font-size: 0.9rem; }
</style>