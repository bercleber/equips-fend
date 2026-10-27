document.addEventListener('alpine:init', () => {
  Alpine.data('registrationForm', () => ({
    form: { name: '', email: '', phone: '', password: '' },
    submitting: false,
    success: false,
    error: '',

    async register() {
      if (this.submitting || this.success) return;

      this.submitting = true;
      this.error = '';

      try {
        await window.app.post('/users', {
          name: this.form.name.trim(),
          email: this.form.email.trim(),
          phone: this.form.phone,
          password: this.form.password,
        });

        this.form = { name: '', email: '', phone: '', password: '' };
        this.success = true;
        this.$nextTick(() => this.$refs.successHeading.focus());
      } catch (error) {
        if (error.status === 422) {
          this.error = 'Confira os dados informados e os requisitos de cada campo.';
        } else if ([400, 409].includes(error.status) && typeof error.detail === 'string') {
          this.error = error.detail;
        } else if (error.status) {
          this.error = 'Não foi possível concluir o cadastro. Tente novamente mais tarde.';
        } else {
          this.error = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
        }
      } finally {
        this.submitting = false;
      }
    },
  }));
});
