document.addEventListener('alpine:init', () => {
  Alpine.data('loginForm', () => ({
    email: '',
    password: '',
    showPassword: false,
    submitting: false,
    error: '',

    async login() {
      if (this.submitting) return;

      this.submitting = true;
      this.error = '';

      try {
        const session = await window.app.post('/auth/login', {
          email: this.email.trim(),
          password: this.password,
        });

        window.app.saveSession(session);
        this.password = '';
        window.location.replace(window.app.homePage());
      } catch (error) {
        if (error.code === 'INVALID_SESSION') {
          this.error = error.message;
        } else if (error.status === 401) {
          this.error = 'Email ou senha incorretos. Confira seus dados e tente novamente.';
        } else if (error.status === 403) {
          this.error = 'Sua conta não tem acesso no momento. Entre em contato com o gestor.';
        } else if (error.status === 422) {
          this.error = 'Confira o email e a senha informados.';
        } else if (error.name === 'SecurityError' || error.name === 'QuotaExceededError') {
          this.error = 'Permita o armazenamento de dados deste site no navegador para manter sua sessão.';
        } else {
          this.error = 'Não foi possível entrar. Verifique sua conexão e tente novamente.';
        }
      } finally {
        this.submitting = false;
      }
    },
  }));
});
