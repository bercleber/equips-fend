document.addEventListener('alpine:init', () => {
  Alpine.data('loanManagement', () => ({
    loans: [],
    users: [],
    statusFilter: 'waiting_rev',
    loading: true,
    error: '',
    usersError: '',
    updatingId: null,
    actionError: '',
    notice: '',
    selectedLoan: null,
    detailsLoading: false,
    detailsError: '',
    detailsRequestId: 0,
    denialReason: '',
    denialError: '',

    init() {
      this.loadLoans();
    },

    async loadLoans() {
      if (this.updatingId !== null) return;
      this.loading = true;
      this.error = '';
      this.usersError = '';
      this.actionError = '';
      this.notice = '';

      try {
        const [loansResult, usersResult] = await Promise.allSettled([
          window.app.get(this.statusFilter === 'on_loan' ? '/loans' : `/loans?status=${this.statusFilter}`),
          window.app.get('/users'),
        ]);

        if (usersResult.status === 'fulfilled') {
          this.users = usersResult.value;
        } else {
          this.users = [];
          this.usersError = 'Não foi possível carregar os dados de contato dos solicitantes. Os nomes são exibidos a partir das requisições.';
        }

        if (loansResult.status === 'rejected') throw loansResult.reason;

        this.loans = loansResult.value
          .filter((loan) => this.statusFilter === 'on_loan' ? this.canReturn(loan) : loan.status === this.statusFilter)
          .sort((first, second) => new Date(first.request_date) - new Date(second.request_date) || first.id - second.id);
      } catch {
        this.error = 'Verifique sua conexão e tente novamente.';
      } finally {
        this.loading = false;
      }
    },

    requesterName(loan) {
      return loan?.requester?.name || (loan ? `Usuário #${loan.requested_by}` : '');
    },

    get filterLabel() {
      return {
        waiting_rev: 'Aguardando análise',
        waiting_pickup: 'Aceitas',
        on_loan: 'Em empréstimo',
        returned: 'Devolvidas',
        denied: 'Negadas',
      }[this.statusFilter];
    },

    statusLabel(status) {
      return {
        waiting_rev: 'Aguardando análise',
        waiting_pickup: 'Aguardando retirada',
        on_loan: 'Em empréstimo',
        late: 'Em atraso',
        returned: 'Devolvida',
        denied: 'Negada',
      }[status] || 'Não informado';
    },

    statusClass(status) {
      return {
        waiting_rev: 'status-pending',
        waiting_pickup: 'status-active',
        on_loan: 'status-active',
        late: 'status-denied',
        returned: 'status-inactive',
        denied: 'status-denied',
      }[status] || '';
    },

    get selectedUser() {
      return this.users.find((user) => user.id === this.selectedLoan?.requested_by);
    },

    canReturn(loan) {
      return ['on_loan', 'late'].includes(loan.status);
    },

    async confirmLoanEvent(loan, pickup) {
      if (this.loading || this.updatingId !== null) return;
      if (pickup ? loan.status !== 'waiting_pickup' : !this.canReturn(loan)) return;

      this.updatingId = loan.id;
      this.actionError = '';
      this.notice = '';

      try {
        // O contrato atual exige loan_id na query além do id no caminho.
        await window.app.patch(`/loans/${pickup ? 'pickup' : 'close'}/${loan.id}?loan_id=${loan.id}`, {
          type: pickup ? 'picked_up' : 'returned',
        });
        loan.status = pickup ? 'on_loan' : 'returned';
        this.loans = this.loans.filter((entry) => entry.id !== loan.id);
        this.notice = `${pickup ? 'Retirada' : 'Devolução'} da requisição #${loan.id} confirmada com sucesso.`;
      } catch (error) {
        this.actionError = [400, 403, 404, 409].includes(error.status) && typeof error.detail === 'string'
          ? error.detail
          : `Não foi possível confirmar a ${pickup ? 'retirada' : 'devolução'}. Tente novamente.`;
      } finally {
        this.updatingId = null;
      }
    },

    openDetails(loan) {
      this.selectedLoan = loan;
      this.$refs.detailsDialog.showModal();
      this.loadDetails();
    },

    async loadDetails() {
      if (!this.selectedLoan || this.detailsLoading) return;

      const loanId = this.selectedLoan.id;
      const requestId = ++this.detailsRequestId;
      this.detailsLoading = true;
      this.detailsError = '';

      try {
        const loan = await window.app.get(`/loans/${loanId}`);
        if (requestId !== this.detailsRequestId) return;
        if (!Array.isArray(loan?.equipments)) {
          this.detailsError = 'Os equipamentos não foram retornados. Tente carregar os detalhes novamente.';
          return;
        }
        this.selectedLoan = loan;
      } catch (error) {
        if (requestId !== this.detailsRequestId) return;
        this.detailsError = error.status === 404
          ? 'Esta requisição não foi encontrada.'
          : error.status === 403
            ? 'Você não tem permissão para consultar esta requisição.'
            : 'Não foi possível carregar os detalhes. Tente novamente.';
      } finally {
        if (requestId === this.detailsRequestId) this.detailsLoading = false;
      }
    },

    resetDetails() {
      this.detailsRequestId++;
      this.selectedLoan = null;
      this.detailsLoading = false;
      this.detailsError = '';
    },

    openDenial(loan) {
      if (loan.status !== 'waiting_rev') return;
      this.selectedLoan = loan;
      this.denialReason = '';
      this.denialError = '';
      this.$refs.denialDialog.showModal();
    },

    async evaluateLoan(loan, accepted) {
      if (!loan || loan.status !== 'waiting_rev' || this.updatingId !== null || this.loading) return;

      this.updatingId = loan.id;
      this.actionError = '';
      this.denialError = '';
      this.notice = '';

      try {
        // O contrato atual exige loan_id na query além do id no caminho.
        await window.app.patch(`/loans/${accepted ? 'allow' : 'deny'}/${loan.id}?loan_id=${loan.id}`, {
          type: accepted ? 'accepted' : 'denied',
          reason: accepted ? null : this.denialReason.trim() || null,
        });
        this.loans = this.loans.filter((entry) => entry.id !== loan.id);
        this.notice = `Requisição #${loan.id} ${accepted ? 'aceita' : 'negada'} com sucesso.`;
        if (!accepted) this.$refs.denialDialog.close();
      } catch (error) {
        const message = [400, 403, 404, 409].includes(error.status) && typeof error.detail === 'string'
          ? error.detail
          : `Não foi possível ${accepted ? 'aceitar' : 'negar'} a requisição. Tente novamente.`;
        if (accepted) this.actionError = message;
        else this.denialError = message;
      } finally {
        this.updatingId = null;
      }
    },

    formatDate(value) {
      if (!value) return 'Não informada';
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return 'Não informada';
      return date.toLocaleDateString('pt-BR');
    },
  }));
});
