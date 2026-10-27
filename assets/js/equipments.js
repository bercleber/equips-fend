document.addEventListener('alpine:init', () => {
  Alpine.data('equipmentManagement', () => ({
    items: [],
    categories: [],
    search: '',
    loading: true,
    error: '',
    notice: '',
    saving: false,
    formError: '',
    categoriesLoading: false,
    categoriesError: '',
    editingId: null,
    equipment: { name: '', code: '', categoryId: '' },
    category: { name: '', description: '' },
    selectedItem: null,

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

    async loadCategories() {
      this.categoriesLoading = true;
      this.categoriesError = '';
      try {
        this.categories = await window.app.get('/equipments/categories');
      } catch {
        this.categoriesError = 'Não foi possível carregar as categorias. Tente novamente.';
      } finally {
        this.categoriesLoading = false;
      }
    },

    openEquipment(item = null) {
      this.editingId = item?.id ?? null;
      this.equipment = {
        name: item?.name ?? '',
        code: item?.code ?? '',
        categoryId: item?.category.id ?? '',
      };
      this.formError = '';
      this.loadCategories();
      this.$refs.equipmentDialog.showModal();
    },

    openCategory() {
      this.category = { name: '', description: '' };
      this.formError = '';
      this.$refs.categoryDialog.showModal();
    },

    openRemoval(item) {
      this.selectedItem = item;
      this.formError = '';
      this.$refs.removalDialog.showModal();
    },

    errorMessage(error, fallback) {
      if ([400, 403, 404, 409].includes(error.status) && typeof error.detail === 'string') {
        return error.detail;
      }
      if (error.status === 422) return 'Confira os campos informados e tente novamente.';
      return fallback;
    },

    async saveEquipment() {
      // A edição aguarda uma rota de atualização no contrato da API.
      if (this.saving || this.editingId !== null || this.categoriesLoading || this.categoriesError) return;
      this.formError = '';
      const data = {
        name: this.equipment.name.trim(),
        code: this.equipment.code.trim(),
        category_id: Number(this.equipment.categoryId),
      };
      if (!data.name || !data.code || !Number.isInteger(data.category_id) || data.category_id <= 0) {
        this.formError = 'Preencha o nome, o código e selecione uma categoria.';
        return;
      }
      this.saving = true;
      try {
        const item = await window.app.post('/equipments', data);
        this.items.push(item);
        this.search = '';
        this.notice = `${item.name}: equipamento cadastrado com sucesso.`;
        this.$refs.equipmentDialog.close();
      } catch (error) {
        this.formError = this.errorMessage(error, 'Não foi possível cadastrar o equipamento. Seus dados foram mantidos. Tente novamente.');
      } finally {
        this.saving = false;
      }
    },

    async saveCategory() {
      if (this.saving) return;
      this.formError = '';
      const data = { name: this.category.name.trim(), description: this.category.description.trim() };
      if (!data.name || !data.description) {
        this.formError = 'Preencha o nome e a descrição da categoria.';
        return;
      }
      this.saving = true;
      try {
        const category = await window.app.post('/equipments/categories', data);
        this.categories.push(category);
        this.notice = `${category.name}: categoria cadastrada com sucesso.`;
        this.$refs.categoryDialog.close();
      } catch (error) {
        this.formError = this.errorMessage(error, 'Não foi possível cadastrar a categoria. Seus dados foram mantidos. Tente novamente.');
      } finally {
        this.saving = false;
      }
    },

    async removeEquipment() {
      if (this.saving || !this.selectedItem) return;
      this.formError = '';
      this.saving = true;
      const item = this.selectedItem;
      try {
        await window.app.delete(`/equipments/${item.id}`);
        this.items = this.items.filter((entry) => entry.id !== item.id);
        this.notice = `${item.name}: equipamento removido com sucesso.`;
        this.$refs.removalDialog.close();
      } catch (error) {
        this.formError = this.errorMessage(error, 'Não foi possível remover o equipamento. Tente novamente.');
      } finally {
        this.saving = false;
      }
    },
  }));
});
