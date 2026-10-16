/**
 * Modulo de Persistencia de Dados: StorageService
 * Operacao 100% em Nuvem via Supabase (demandas_vanessa e usuarios_vanessa).
 * Armazenamento local de dados desativado.
 */

class StorageService {
  constructor() {
    this.CONFIG_KEY = 'controle_demandas_supabase_config';
    this.supabaseClient = null;
    this.currentUrl = '';
    this.currentKey = '';
    this.mode = 'supabase';
    this.tableName = 'demandas_vanessa';
    this.usersTableName = 'usuarios_vanessa';
    this.loadConfig();
  }

  // Sanitizacao de URL: remove barras finais, /rest/v1 e aspas
  sanitizeUrl(url) {
    if (!url) return '';
    let clean = String(url).trim();
    clean = clean.replace(/^["']|["']$/g, '');
    clean = clean.replace(/\/rest\/v1\/?$/i, '');
    clean = clean.replace(/\/+$/, '');
    if (clean && !clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    return clean;
  }

  // Sanitizacao do nome da tabela: remove prefixos como 'public.' e barras
  sanitizeTableName(name) {
    if (!name) return '';
    let clean = String(name).trim();
    clean = clean.replace(/^["']|["']$/g, '');
    if (clean.toLowerCase().startsWith('public.')) {
      clean = clean.substring(7);
    }
    clean = clean.replace(/^\/+|\/+$/g, '');
    return clean;
  }

  // Mensagens amigaveis para codigos de erro PostgREST / Supabase
  formatError(error) {
    if (!error) return 'Erro desconhecido.';
    const code = error.code || '';
    const msg = error.message || '';
    const details = error.details || '';

    if (code === 'PGRST125') {
      return 'URL do projeto Supabase ou nome da tabela com caminho inválido (PGRST125). Certifique-se de que a Project URL está no formato "https://[id].supabase.co" (sem /rest/v1 ou barras extras) e o nome da tabela seja apenas o identificador da tabela.';
    }
    if (code === '42P01' || (msg.includes('relation') && msg.includes('does not exist'))) {
      return `A tabela não foi encontrada no banco Supabase: ${msg}. Verifique se o nome da tabela está correto no painel do Supabase.`;
    }
    if (code === '42501' || msg.includes('permission denied') || msg.includes('policy')) {
      return 'Acesso negado pelas políticas de segurança (RLS) do Supabase. Verifique se as políticas para anon/authenticated estão ativas.';
    }
    if (code === '23505' || msg.includes('duplicate key') || msg.includes('unique constraint')) {
      return 'Registro duplicado: já existe um registro com essa chave no banco.';
    }
    return msg || details || JSON.stringify(error);
  }

  loadConfig() {
    try {
      const env = window.ENV_CONFIG || {};
      const savedRaw = localStorage.getItem(this.CONFIG_KEY);
      const savedConfig = savedRaw ? JSON.parse(savedRaw) : {};

      // Prioriza definicoes declaradas diretamente em config.js (window.ENV_CONFIG)
      this.supabaseUrl = this.sanitizeUrl(env.SUPABASE_URL || savedConfig.supabaseUrl || '');
      this.supabaseKey = (env.SUPABASE_ANON_KEY || savedConfig.supabaseKey || '').trim();
      this.tableName = this.sanitizeTableName(env.TABLE_DEMANDAS || savedConfig.tableName) || 'demandas_vanessa';
      this.usersTableName = this.sanitizeTableName(env.TABLE_USUARIOS || savedConfig.usersTableName) || 'usuarios_vanessa';

      if (this.supabaseUrl && this.supabaseKey) {
        this.initSupabase(this.supabaseUrl, this.supabaseKey);
      }
    } catch (err) {
      console.error('Erro ao carregar configuracoes de conexao Supabase:', err);
    }
  }

  saveConfig(config) {
    try {
      this.supabaseUrl = this.sanitizeUrl(config.supabaseUrl || '');
      this.supabaseKey = (config.supabaseKey || '').trim();
      this.tableName = this.sanitizeTableName(config.tableName) || 'demandas_vanessa';
      this.usersTableName = this.sanitizeTableName(config.usersTableName) || 'usuarios_vanessa';

      const configToSave = {
        supabaseUrl: this.supabaseUrl,
        supabaseKey: this.supabaseKey,
        tableName: this.tableName,
        usersTableName: this.usersTableName
      };

      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(configToSave));

      if (this.supabaseUrl && this.supabaseKey) {
        this.initSupabase(this.supabaseUrl, this.supabaseKey);
      }
    } catch (err) {
      console.error('Erro ao salvar configuracoes do Supabase:', err);
    }
  }

  // Gerencia instancia unica (Singleton) do cliente Supabase
  getOrCreateClient(url, key) {
    const cleanUrl = this.sanitizeUrl(url);
    const cleanKey = (key || '').trim();

    if (!cleanUrl || !cleanKey) return null;

    if (this.supabaseClient && this.currentUrl === cleanUrl && this.currentKey === cleanKey) {
      return this.supabaseClient;
    }

    try {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        this.supabaseClient = window.supabase.createClient(cleanUrl, cleanKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        });
        this.currentUrl = cleanUrl;
        this.currentKey = cleanKey;
        return this.supabaseClient;
      } else {
        console.warn('Biblioteca cliente do Supabase nao carregada no window.');
        return null;
      }
    } catch (err) {
      console.error('Falha ao instanciar cliente do Supabase:', err);
      this.supabaseClient = null;
      return null;
    }
  }

  initSupabase(url, key) {
    return this.getOrCreateClient(url, key);
  }

  getClient() {
    if (this.supabaseClient) return this.supabaseClient;
    if (this.supabaseUrl && this.supabaseKey) {
      return this.getOrCreateClient(this.supabaseUrl, this.supabaseKey);
    }
    return null;
  }

  isConfigured() {
    return !!(this.supabaseUrl && this.supabaseKey && this.getClient());
  }

  // Teste de conexao com as duas tabelas: demandas e usuarios
  async testSupabaseConnection(url, key, tableName = 'demandas_vanessa', usersTable = 'usuarios_vanessa') {
    const cleanUrl = this.sanitizeUrl(url);
    const cleanKey = (key || '').trim();
    const cleanTable = this.sanitizeTableName(tableName) || 'demandas_vanessa';
    const cleanUsersTable = this.sanitizeTableName(usersTable) || 'usuarios_vanessa';

    if (!cleanUrl || !cleanKey) {
      return { success: false, message: 'URL do projeto e Anon Public Key são obrigatórias.' };
    }

    try {
      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        throw new Error('SDK do Supabase não carregado no navegador.');
      }

      const client = this.getOrCreateClient(cleanUrl, cleanKey);
      if (!client) {
        throw new Error('Não foi possível inicializar o cliente do Supabase.');
      }

      // 1. Testa tabela de demandas
      const resDemandas = await client
        .from(cleanTable)
        .select('id')
        .limit(1);

      if (resDemandas.error) {
        return {
          success: false,
          message: `Falha na tabela de demandas "${cleanTable}": ` + this.formatError(resDemandas.error)
        };
      }

      // 2. Testa tabela de usuarios
      const resUsuarios = await client
        .from(cleanUsersTable)
        .select('id')
        .limit(1);

      if (resUsuarios.error) {
        return {
          success: false,
          message: `Conexão bem-sucedida em "${cleanTable}", mas a tabela de usuários "${cleanUsersTable}" apresentou erro: ` + this.formatError(resUsuarios.error)
        };
      }

      return {
        success: true,
        message: `Conexão estabelecida com sucesso nas tabelas "${cleanTable}" e "${cleanUsersTable}".`
      };
    } catch (err) {
      return { success: false, message: this.formatError(err) };
    }
  }

  // Sanitizacao de registros de demandas para o Supabase (PostgreSQL)
  // Campos de data vazios DEVEM ser enviados como null para evitar erro de sintaxe DATE
  sanitizeDemandaRecord(record) {
    if (!record || typeof record !== 'object') return record;
    const clean = { ...record };

    const dateFields = ['data_recebida', 'prazo', 'data_validacao', 'data_resposta_mp'];
    dateFields.forEach(field => {
      if (clean[field] !== undefined) {
        const val = clean[field];
        if (!val || val === '-' || val === '_' || val === 'null' || val === 'undefined' || String(val).trim() === '') {
          clean[field] = null;
        } else if (typeof val === 'string') {
          const trimmed = val.trim();
          const match = trimmed.match(/^\d{4}-\d{2}-\d{2}/);
          clean[field] = match ? match[0] : null;
        }
      }
    });

    return clean;
  }

  // ========================================================================
  // OPERAÇÕES DE DEMANDAS (EXCLUSIVAMENTE NO SUPABASE)
  // ========================================================================

  async getAll() {
    const client = this.getClient();
    if (!client) {
      throw new Error('Supabase não conectado. Configure a URL e a Anon Public Key.');
    }

    try {
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .order('data_recebida', { ascending: false });

      if (error) {
        console.warn('Tentativa com ordenação falhou, tentando leitura direta:', error);
        const fallback = await client.from(this.tableName).select('*');
        if (fallback.error) throw fallback.error;
        return fallback.data || [];
      }
      return data || [];
    } catch (err) {
      console.error('Erro ao ler demandas do Supabase:', this.formatError(err));
      throw new Error(this.formatError(err));
    }
  }

  async getById(id) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase não conectado.');

    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(this.formatError(error));
    return data;
  }

  async create(record) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase não conectado.');

    const cleanRecord = this.sanitizeDemandaRecord(record);

    if (!cleanRecord.id) {
      cleanRecord.id = 'DEM-' + Date.now().toString(36).toUpperCase();
    }
    cleanRecord.created_at = new Date().toISOString();
    cleanRecord.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from(this.tableName)
      .insert([cleanRecord])
      .select();

    if (error) {
      console.error('Falha ao salvar demanda no Supabase:', this.formatError(error));
      throw new Error(this.formatError(error));
    }

    return data && data[0] ? data[0] : cleanRecord;
  }

  async update(id, updatedFields) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase não conectado.');

    const cleanFields = this.sanitizeDemandaRecord(updatedFields);
    cleanFields.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from(this.tableName)
      .update(cleanFields)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Falha ao atualizar demanda no Supabase:', this.formatError(error));
      throw new Error(this.formatError(error));
    }

    return data && data[0] ? data[0] : cleanFields;
  }

  async delete(id) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase não conectado.');

    const { error } = await client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Falha ao deletar demanda no Supabase:', this.formatError(error));
      throw new Error(this.formatError(error));
    }

    return true;
  }

  async bulkInsert(records) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase não conectado.');

    const cleanRecords = Array.isArray(records)
      ? records.map(r => this.sanitizeDemandaRecord(r))
      : records;

    const { data, error } = await client
      .from(this.tableName)
      .upsert(cleanRecords, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Falha ao sincronizar lote no Supabase:', this.formatError(error));
      throw new Error(this.formatError(error));
    }

    return data || cleanRecords;
  }

  async deleteAll() {
    const client = this.getClient();
    if (!client) throw new Error('Supabase não conectado.');

    // Exclui todos os registros onde ID nao eh vazio
    const { error } = await client
      .from(this.tableName)
      .delete()
      .neq('id', '___');

    if (error) {
      throw new Error(this.formatError(error));
    }
    return true;
  }

  // ========================================================================
  // OPERAÇÕES DE USUÁRIOS (EXCLUSIVAMENTE NO SUPABASE)
  // ========================================================================

  async getUsers() {
    const client = this.getClient();
    if (!client) throw new Error('Supabase não conectado.');

    const { data, error } = await client
      .from(this.usersTableName)
      .select('id, nome, email, perfil, cargo, ativo, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(this.formatError(error));
    }
    return data || [];
  }

  async getUserByEmail(email) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase não conectado.');

    const cleanEmail = (email || '').trim().toLowerCase();
    const { data, error } = await client
      .from(this.usersTableName)
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (error) {
      throw new Error(this.formatError(error));
    }
    return data;
  }

  async createUserInDb(user) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase não conectado.');

    const { data, error } = await client
      .from(this.usersTableName)
      .insert([user])
      .select();

    if (error) {
      throw new Error(this.formatError(error));
    }
    return data && data[0] ? data[0] : user;
  }

  async updateUserInDb(id, fields) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase não conectado.');

    fields.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from(this.usersTableName)
      .update(fields)
      .eq('id', id)
      .select();

    if (error) {
      throw new Error(this.formatError(error));
    }
    return data && data[0] ? data[0] : fields;
  }

  async deleteUserInDb(id) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase não conectado.');

    const { error } = await client
      .from(this.usersTableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(this.formatError(error));
    }
    return true;
  }
}

// Exporta instancia global
window.storageService = new StorageService();
