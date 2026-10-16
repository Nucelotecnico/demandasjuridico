/**
 * Modulo de Autenticacao e Controle de Usuarios (RBAC) - CEMIG
 * Operacao 100% conectada ao Supabase (tabela usuarios_vanessa).
 * Armazenamento local de usuarios desativado.
 */

class AuthService {
  constructor() {
    this.SESSION_STORAGE_KEY = 'cemig_auth_session';
  }

  // Sessao ativa (armazenada em sessionStorage para a duracao do navegador/aba)
  getCurrentUser() {
    try {
      const raw = sessionStorage.getItem(this.SESSION_STORAGE_KEY) || localStorage.getItem(this.SESSION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  setSession(user) {
    const sessionData = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      cargo: user.cargo,
      login_time: new Date().toISOString()
    };
    try {
      sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.error('Erro ao salvar sessao:', e);
    }
    return sessionData;
  }

  logout() {
    try {
      sessionStorage.removeItem(this.SESSION_STORAGE_KEY);
      localStorage.removeItem(this.SESSION_STORAGE_KEY);
    } catch (e) {
      console.error('Erro ao encerrar sessao:', e);
    }
  }

  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  isAdmin() {
    const user = this.getCurrentUser();
    return !!(user && user.perfil === 'admin');
  }

  // Autenticacao contra a tabela usuarios_vanessa no Supabase
  async login(email, senha) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanSenha = (senha || '').trim();

    if (!cleanEmail || !cleanSenha) {
      return { success: false, message: 'Informe o e-mail e a senha de acesso.' };
    }

    if (!window.storageService || !window.storageService.isConfigured()) {
      return {
        success: false,
        message: 'Conexão com o Supabase não configurada. Configure a URL e a Anon Public Key para autenticar.'
      };
    }

    try {
      const user = await window.storageService.getUserByEmail(cleanEmail);

      if (!user) {
        return { success: false, message: 'Usuário não encontrado na tabela de usuários do Supabase.' };
      }

      if (user.ativo === false) {
        return { success: false, message: 'Este usuário está inativo no sistema. Contate o administrador.' };
      }

      // Suporta coluna senha_hash ou senha no banco
      const senhaGravada = String(user.senha_hash || user.senha || '').trim();
      if (senhaGravada !== cleanSenha) {
        return { success: false, message: 'Senha incorreta. Verifique os dados digitados.' };
      }

      const session = this.setSession(user);
      return { success: true, user: session };
    } catch (err) {
      console.error('Falha na autenticacao via Supabase:', err);
      return {
        success: false,
        message: 'Erro ao autenticar no Supabase: ' + (err.message || 'Falha de comunicacao com o banco.')
      };
    }
  }

  // Gestao de Usuarios: Criar novo usuario diretamente no Supabase
  async createUser({ nome, email, senha, perfil, cargo }) {
    if (!this.isAdmin()) {
      throw new Error('Acesso negado: apenas administradores podem cadastrar novos usuários.');
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanSenha = (senha || '').trim();
    const cleanNome = (nome || '').trim();
    const cleanCargo = (cargo || 'Analista Institucional').trim();
    const cleanPerfil = perfil === 'admin' ? 'admin' : 'operador';

    if (!cleanNome) throw new Error('O nome do colaborador é obrigatório.');
    if (!cleanEmail) throw new Error('O e-mail corporativo é obrigatório.');
    if (!cleanSenha || cleanSenha.length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres.');

    if (!window.storageService || !window.storageService.isConfigured()) {
      throw new Error('Supabase não conectado. Configure as credenciais do banco.');
    }

    // Valida se usuario ja existe no Supabase
    const existing = await window.storageService.getUserByEmail(cleanEmail);
    if (existing) {
      throw new Error('Já existe um usuário cadastrado com este e-mail no Supabase.');
    }

    const newUserRecord = {
      id: 'USR-' + Date.now().toString(36).toUpperCase(),
      nome: cleanNome,
      email: cleanEmail,
      senha_hash: cleanSenha,
      perfil: cleanPerfil,
      cargo: cleanCargo,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const saved = await window.storageService.createUserInDb(newUserRecord);
    return saved;
  }

  // Obter todos os usuarios diretamente do Supabase
  async getAllUsers() {
    if (!this.isAdmin()) {
      return [];
    }

    if (!window.storageService || !window.storageService.isConfigured()) {
      throw new Error('Supabase não conectado.');
    }

    const users = await window.storageService.getUsers();
    return users.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      perfil: u.perfil,
      cargo: u.cargo,
      ativo: u.ativo,
      created_at: u.created_at,
      updated_at: u.updated_at
    }));
  }

  // Ativar ou desativar status do usuario no Supabase
  async toggleUserStatus(id) {
    if (!this.isAdmin()) {
      throw new Error('Acesso negado: apenas administradores podem alterar o status de usuários.');
    }

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === id) {
      throw new Error('Não é permitido desativar o próprio usuário logado.');
    }

    const users = await this.getAllUsers();
    const target = users.find(u => u.id === id);
    if (!target) throw new Error('Usuário não encontrado no Supabase.');

    const novoStatus = !target.ativo;
    const updated = await window.storageService.updateUserInDb(id, { ativo: novoStatus });
    return updated;
  }

  // Excluir usuario permanentemente no Supabase
  async deleteUser(id) {
    if (!this.isAdmin()) {
      throw new Error('Acesso negado: apenas administradores podem excluir usuários.');
    }

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === id) {
      throw new Error('Não é permitido excluir o próprio usuário logado.');
    }

    await window.storageService.deleteUserInDb(id);
    return true;
  }
}

// Instancia global
window.authService = new AuthService();
