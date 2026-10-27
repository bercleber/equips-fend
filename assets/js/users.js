document.addEventListener('alpine:init', () => {
  Alpine.data('userManagement', () => ({
    users: [],
    loading: true,
    loadError: '',
    actionError: '',
    notice: '',
    updatingId: null,
    selectedUser: null,
    promoting: false,
    promotionError: '',
    promotionNotice: '',

    get canPromote() {
      return window.app.getSession()?.role === 'administrador'
        && this.selectedUser?.role?.name === 'aluno';
    },

    init() {
      this.loadUsers();
    },

    async loadUsers() {
      this.loading = true;
      this.loadError = '';

      try {
        this.users = await window.app.get('/users');
      } catch {
        this.loadError = 'Verifique sua conexão e tente novamente.';
      } finally {
        this.loading = false;
      }
    },

    openDetails(user) {
      if (this.promoting) return;
      this.selectedUser = user;
      this.promotionError = '';
      this.promotionNotice = '';
      this.$nextTick(() => this.$refs.userDialog.showModal());
    },

    roleLabel(role) {
      return { aluno: 'Aluno', gestor: 'Gestor', administrador: 'Administrador' }[role] || role || 'Não informado';
    },

    async promoteUser() {
      if (!this.canPromote || this.updatingId !== null) return;

      const user = this.selectedUser;
      this.updatingId = user.id;
      this.promoting = true;
      this.promotionError = '';
      this.promotionNotice = '';
      this.actionError = '';
      this.notice = '';

      try {
        const updatedUser = await window.app.patch(`/users/promote/${user.id}`);
        Object.assign(user, updatedUser);
        this.promotionNotice = `${user.name} promovido a gestor. O usuário deve entrar novamente para atualizar seu perfil de acesso.`;
        this.notice = this.promotionNotice;
      } catch (error) {
        if (error.status === 403) {
          this.promotionError = 'Apenas administradores podem promover usuários.';
        } else if (error.status === 409) {
          this.promotionError = 'Apenas alunos podem ser promovidos a gestor. Atualize a página para conferir o perfil atual.';
        } else if (error.status === 404) {
          this.promotionError = 'Usuário não encontrado. Atualize a página e tente novamente.';
        } else {
          this.promotionError = 'Não foi possível promover o usuário. Tente novamente.';
        }
      } finally {
        this.promoting = false;
        this.updatingId = null;
      }
    },

    async toggleStatus(user) {
      if (this.updatingId !== null) return;

      const active = !user.active;
      this.updatingId = user.id;
      this.actionError = '';
      this.notice = '';

      try {
        await window.app.patch(`/users/${active ? 'activate' : 'deactivate'}/${user.id}`);
        user.active = active;
        this.notice = `${user.name}: usuário ${active ? 'ativado' : 'desativado'} com sucesso.`;
      } catch {
        this.actionError = `Não foi possível ${active ? 'ativar' : 'desativar'} ${user.name}. Tente novamente.`;
      } finally {
        this.updatingId = null;
      }
    },
  }));
});
