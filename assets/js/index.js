document.addEventListener('alpine:init', () => {
  Alpine.data('equipmentList', () => ({
    items: [],
    search: '',
    loading: true,
    error: '',

    init() {
      this.loadItems();
    },

    get filteredItems() {
      return window.app.filterEquipments(this.items, this.search);
    },

    async loadItems() {
      this.loading = true;
      this.error = '';

      try {
        this.items = await window.app.get('/equipments');
      } catch {
        this.error = 'Verifique sua conexão e tente novamente.';
      } finally {
        this.loading = false;
      }
    },
  }));
});
