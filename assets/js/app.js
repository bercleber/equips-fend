window.app = {
  apiBaseUrl: 'http://127.0.0.1:8000',

  pages: [
    { href: 'equipments.html', label: 'Equipamentos', roles: ['administrador'] },
    { href: 'users.html', label: 'Usuários', roles: ['administrador', 'gestor'] },
    { href: 'loans.html', label: 'Solicitar empréstimo', roles: ['administrador', 'gestor', 'aluno'] },
    { href: 'loan-management.html', label: 'Gerenciar empréstimos', roles: ['administrador', 'gestor'] },
  ],

  getAccessToken() {
    try {
      return sessionStorage.getItem('0equips.accessToken');
    } catch {
      return null;
    }
  },

  getSession(token = this.getAccessToken()) {
    try {
      if (typeof token !== 'string' || token.split('.').length !== 3) return null;
      const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const bytes = Uint8Array.from(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')), (char) => char.charCodeAt(0));
      const claims = JSON.parse(new TextDecoder().decode(bytes));

      if (!['administrador', 'gestor', 'aluno'].includes(claims.role)
        || !Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) return null;

      // As claims orientam a interface; a API valida a assinatura e as permissões.
      return claims;
    } catch {
      return null;
    }
  },

  canAccess(page) {
    const role = this.getSession()?.role;
    return this.pages.some((entry) => entry.href === page && entry.roles.includes(role));
  },

  homePage() {
    const role = this.getSession()?.role;
    if (role === 'gestor') return 'loan-management.html';
    if (role === 'aluno') return 'loans.html';
    if (role === 'administrador') return 'equipments.html';
    return 'login.html';
  },

  saveSession(data) {
    if (!this.getSession(data?.access_token ?? '')) {
      const error = new Error('O servidor retornou uma sessão inválida ou sem um perfil reconhecido.');
      error.code = 'INVALID_SESSION';
      throw error;
    }

    sessionStorage.setItem('0equips.accessToken', data.access_token);
  },

  logout() {
    try {
      sessionStorage.removeItem('0equips.accessToken');
    } finally {
      document.documentElement.removeAttribute('data-authenticated');
      window.location.replace('login.html');
    }
  },

  requireSession() {
    if (!document.documentElement.hasAttribute('data-auth-required')) return true;

    if (!this.getSession()) {
      this.logout();
      return false;
    }

    if (!this.canAccess(document.documentElement.getAttribute('data-auth-required'))) {
      document.documentElement.removeAttribute('data-authenticated');
      window.location.replace(this.homePage());
      return false;
    }

    document.documentElement.setAttribute('data-authenticated', '');
    return true;
  },

  filterEquipments(items, search) {
    const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    const query = normalize(search.trim());

    return items.filter((item) =>
      [item.name, item.category.name].some((value) => normalize(value).includes(query))
    );
  },

  get(path) {
    return this.request(path);
  },

  post(path, data) {
    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  },

  patch(path, data) {
    return this.request(path, {
      method: 'PATCH',
      ...(data === undefined ? {} : {
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      }),
    });
  },

  delete(path) {
    return this.request(path, { method: 'DELETE' });
  },

  async request(path, options = {}) {
    const publicRequest = path === '/auth/login' || (path === '/users' && options.method === 'POST');
    const token = publicRequest ? null : this.getAccessToken();

    if (!publicRequest && !this.getSession()) {
      this.logout();
      const error = new Error('É necessário entrar na sua conta.');
      error.status = 401;
      throw error;
    }

    if (!this.requireSession()) {
      const error = new Error('Seu perfil não tem acesso a esta página.');
      error.status = 403;
      throw error;
    }

    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401 && !publicRequest) this.logout();
      const data = await response.json().catch(() => null);
      const error = new Error(`Erro na requisição: ${response.status}`);
      error.status = response.status;
      error.detail = data?.detail;
      error.equipment_ids = data?.equipment_ids;
      throw error;
    }

    const body = await response.text();
    return body ? JSON.parse(body) : null;
  },
};

window.app.requireSession();
window.addEventListener('pageshow', () => window.app.requireSession());
window.addEventListener('pagehide', () => {
  document.documentElement.removeAttribute('data-authenticated');
});

document.addEventListener('alpine:init', () => {
  Alpine.data('accountNavigation', () => ({
    get authenticated() { return !!window.app.getSession(); },
    get userName() {
      const name = window.app.getSession()?.name;
      return typeof name === 'string' && name.trim() ? name.trim() : 'Usuário';
    },
    get roleLabel() {
      const labels = { administrador: 'Administrador', gestor: 'Gestor', aluno: 'Aluno' };
      return labels[window.app.getSession()?.role] ?? '';
    },
    get home() { return window.app.homePage(); },
    get links() { return window.app.pages.filter((page) => window.app.canAccess(page.href)); },
    currentPage: document.documentElement.getAttribute('data-auth-required'),
    logout() {
      window.app.logout();
    },
  }));
});
