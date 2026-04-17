<template>
  <div class="login-container">
    <div class="login-decorations">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
    </div>
    
    <div class="login-card">
      <div class="logos">
        <img src="/main.png" alt="IECS IEDIS Institucional" class="login-logo" />
        <img src="/hhb.png" alt="Happy Husky Birthday" class="login-hhb" />
      </div>
      
      <h2>Portal de Celebraciones</h2>
      <p>Inicia sesión con tu cuenta institucional de Google Workspace para ingresar al directorio mágico del equipo.</p>
      
      <div class="auth-wrapper">
        <div id="google-btn" class="google-btn-container"></div>
      </div>
      
      <div class="login-footer">
        Acceso restringido para personal administrativo autorizado.
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRuntimeConfig } from '#app'

const config = useRuntimeConfig()

onMounted(() => {
  window.handleCredentialResponse = async (response) => {
    try {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: { token: response.credential }
      })
      window.location.href = '/'
    } catch (e) {
      alert('Error de autenticación. Verifica tus permisos institucionales.')
    }
  }

  const initGoogleAuth = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: config.public.googleClientId,
        callback: window.handleCredentialResponse
      })
      window.google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large', shape: 'pill', width: 280 }
      )
    } else {
      setTimeout(initGoogleAuth, 100)
    }
  }

  initGoogleAuth()
})
</script>

<style scoped>
.login-container {
  display: flex; 
  justify-content: center; 
  align-items: center; 
  min-height: 100vh;
  background: var(--primary-navy);
  position: relative;
  overflow: hidden;
}

.login-decorations {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 10s infinite alternate ease-in-out;
}

.orb-1 {
  width: 400px; height: 400px;
  background: var(--secondary-gold);
  top: -100px; left: -100px;
}

.orb-2 {
  width: 300px; height: 300px;
  background: var(--accent-amber);
  bottom: -50px; right: -50px;
  animation-delay: -5s;
}

@keyframes float {
  0% { transform: translate(0, 0); }
  100% { transform: translate(30px, 50px); }
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 48px; 
  border-radius: 24px; 
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  text-align: center; 
  max-width: 440px; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 24px;
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.logos {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.login-logo { 
  height: 60px; 
  object-fit: contain;
}

.login-hhb { 
  height: 65px; 
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
}

h2 { 
  margin: 0; 
  color: var(--primary-navy); 
  font-weight: 700;
  font-size: 1.8rem;
  letter-spacing: -0.02em;
}

p { 
  color: var(--text-secondary); 
  margin: 0; 
  font-size: 0.95rem; 
  line-height: 1.5;
}

.auth-wrapper {
  min-height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 8px;
}

.login-footer {
  margin-top: 16px;
  font-size: 0.75rem;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>