document.addEventListener('alpine:init', () => {
  Alpine.data('loanRequest', () => ({
    items: [],
    cart: [],
    unavailableIds: [],
    search: '',
    loading: true,
    error: '',
    announcement: '',
    submissionNotice: '',
    submissionError: '',
    submitting: false,
    pickupDate: '',
    dueDate: '',

    init() {
      this.loadItems();
    },

    get filteredItems() {
      return window.app.filterEquipments(this.items, this.search);
    },

    get hasUnavailableItems() {
      return this.cart.some((item) => this.isUnavailable(item.id));
    },

    isUnavailable(id) {
      return this.unavailableIds.includes(id);
    },

    async loadItems() {
      this.loading = true;
      this.error = '';

      try {
        this.items = await window.app.get('/equipments?available=true');
      } catch {
        this.error = 'Verifique sua conexão e tente novamente.';
      } finally {
        this.loading = false;
      }
    },

    isInCart(id) {
      return this.cart.some((item) => item.id === id);
    },

    addItem(item) {
      if (this.loading || this.error || this.submitting || this.isInCart(item.id)) return;

      this.cart.push(item);
      this.unavailableIds = this.unavailableIds.filter((id) => id !== item.id);
      this.submissionNotice = '';
      this.submissionError = '';
      this.announcement = `${item.name} adicionado ao carrinho.`;
    },

    removeItem(id) {
      if (this.submitting) return;

      const item = this.cart.find((entry) => entry.id === id);
      if (!item) return;

      this.cart = this.cart.filter((entry) => entry.id !== id);
      this.unavailableIds = this.unavailableIds.filter((entry) => entry !== id);
      this.submissionNotice = '';
      this.submissionError = '';
      this.announcement = `${item.name} removido do carrinho.`;
    },

    clearCart() {
      if (this.submitting) return;

      this.cart = [];
      this.unavailableIds = [];
      this.submissionNotice = '';
      this.submissionError = '';
      this.announcement = 'Carrinho limpo.';
    },

    async submitRequest() {
      if (this.submitting || this.cart.length === 0) return;

      this.submissionError = '';
      this.submissionNotice = '';

      // A API exige date-time; usamos o início do dia no fuso local.
      const pickup = new Date(`${this.pickupDate}T00:00:00`);
      const due = new Date(`${this.dueDate}T00:00:00`);

      if (!Number.isFinite(pickup.getTime()) || !Number.isFinite(due.getTime()) || due <= pickup) {
        this.submissionError = 'Informe as datas de retirada e devolução. A devolução deve ser posterior à retirada.';
        return;
      }

      this.submitting = true;

      try {
        await window.app.post('/loans', {
          pickup_date: pickup.toISOString(),
          due_date: due.toISOString(),
          equipments: this.cart.map((item) => item.id),
        });

        this.cart = [];
        this.unavailableIds = [];
        this.pickupDate = '';
        this.dueDate = '';
        this.submissionNotice = 'Requisição enviada com sucesso! Aguarde a avaliação do gestor.';
        await this.loadItems();
      } catch (error) {
        if (error.status === 409 && Array.isArray(error.equipment_ids)) {
          this.unavailableIds = error.equipment_ids.map(Number).filter((id) => Number.isInteger(id) && id > 0);
          this.submissionError = 'Alguns equipamentos ficaram indisponíveis. Confira os itens destacados no carrinho e remova ou substitua esses equipamentos. Suas seleções e datas foram mantidas.';
          await this.loadItems();
        } else if ([400, 403, 404, 409].includes(error.status) && typeof error.detail === 'string') {
          this.submissionError = error.detail;
        } else if (error.status === 422) {
          this.submissionError = 'Confira as datas e os equipamentos selecionados.';
        } else {
          this.submissionError = 'Não foi possível enviar a requisição. Seus itens foram mantidos no carrinho. Tente novamente.';
        }
      } finally {
        this.submitting = false;
      }
    },
  }));
});
