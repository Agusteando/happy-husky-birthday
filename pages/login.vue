<template>
  <div class="login-container">
    <div class="login-decorations">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
    </div>
    
    <div class="login-card glass-panel">
      <div class="logos">
        <img src="/main.png" alt="IECS IEDIS Institucional" class="login-logo" />
        <img src="/hhb.png" alt="Happy Husky Birthday" class="login-hhb" />
      </div>
      
      <h2>Estudio de Celebraciones</h2>
      <p>Inicia sesión con tu cuenta institucional para ingresar al directorio mágico del equipo.</p>
      
      <div class="auth-wrapper">
        <div id="google-btn" class="google-btn-container"></div>
      </div>
      
      <div class="login-footer">
        Acceso exclusivo para personal autorizado de IECS-IEDIS.
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
      alert('Error de autenticación. Verifica que estés usando tu cuenta institucional.')
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
  display: flex; justify-content: center; align-items: center; 
  min-height: 100vh;
  background: var(--bg-color);
  position: relative;
  overflow: hidden;
}

.login-decorations {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none; z-index: 0;
}

.orb {
  position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.6;
  animation: float 10s infinite alternate ease-in-out;
}
.orb-1 {
  width: 400px; height: 400px; background: #FEF3C7;
  top: -100px; left: -100px;
}
.orb-2 {
  width: 400px; height: 400px; background: #E0E7FF;
  bottom: -50px; right: -50px; animation-delay: -5s;
}

@keyframes float {
  0% { transform: translate(0, 0); }
  100% { transform: translate(30px, 50px); }
}

.login-card {
  padding: 48px; border-radius: 32px; 
  text-align: center; max-width: 440px; 
  display: flex; flex-direction: column; align-items: center; gap: 24px;
  position: relative; z-index: 1;
}

.logos { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.login-logo { height: 50px; object-fit: contain; }
.login-hhb { height: 75px; filter: drop-shadow(0 4px 10px rgba(212,175,55,0.2)); }

h2 { margin: 0; color: var(--primary-navy); font-weight: 800; font-size: 1.8rem; letter-spacing: -0.02em; }
p { color: var(--text-secondary); margin: 0; font-size: 1rem; line-height: 1.5; font-weight: 500;}

.auth-wrapper { min-height: 50px; display: flex; justify-content: center; align-items: center; margin-top: 8px; }
.login-footer { margin-top: 16px; font-size: 0.8rem; color: #94A3B8; font-weight: 500; }
</style>