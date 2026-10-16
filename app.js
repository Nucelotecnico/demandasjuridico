/**
 * Aplicacao Principal - CEMIG Controle Geral de Demandas
 * Autenticacao Obrigatória, RBAC (Admin vs Operador), Graficos e Persistencia.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Estado local das Demandas
  let todasDemandas = [];
  let demandasFiltradas = [];
  let paginaAtual = 1;
  let itensPorPagina = 25;
  let colunaOrdenacao = 'data_recebida';
  let direcaoOrdenacao = 'desc';
  let demandaEmEdicaoId = null;

  // Elementos DOM de Autenticação
  const loginScreenOverlay = document.getElementById('loginScreenOverlay');
  const appContainer = document.getElementById('appContainer');
  const formLogin = document.getElementById('formLogin');
  const loginEmail = document.getElementById('loginEmail');
  const loginSenha = document.getElementById('loginSenha');
  const loginAlertBox = document.getElementById('loginAlertBox');
  const btnQuickLoginAdmin = document.getElementById('btnQuickLoginAdmin');
  const btnQuickLoginOperador = document.getElementById('btnQuickLoginOperador');
  const btnLogout = document.getElementById('btnLogout');

  // Elementos do Perfil no Header
  const userDisplayName = document.getElementById('userDisplayName');
  const userDisplayRole = document.getElementById('userDisplayRole');
  const userAvatarText = document.getElementById('userAvatarText');
  const currentDateDisplay = document.getElementById('currentDateDisplay');

  // Abas Administrativas
  const tabBtnUsuarios = document.getElementById('tabBtnUsuarios');
  const tabBtnConfiguracoes = document.getElementById('tabBtnConfiguracoes');

  // Formulário e Tabela de Usuários
  const formNovoUsuario = document.getElementById('formNovoUsuario');
  const tabelaUsuariosBody = document.getElementById('tabelaUsuariosBody');

  // Elementos DOM das Demandas
  const formDemanda = document.getElementById('formDemanda');
  const tabelaBody = document.getElementById('tabelaDemandasBody');
  const totalDemandasBadge = document.getElementById('totalDemandasBadge');
  const storageModeText = document.getElementById('storageModeText');
  const storageDot = document.getElementById('storageDot');

  // Filtros
  const filtroBuscaGlobal = document.getElementById('filtroBuscaGlobal');
  const filtroStatus = document.getElementById('filtroStatus');
  const filtroTipo = document.getElementById('filtroTipo');
  const filtroResponsavel = document.getElementById('filtroResponsavel');
  const filtroSLA = document.getElementById('filtroSLA');
  const btnLimparFiltros = document.getElementById('btnLimparFiltros');

  // Paginacao
  const pagInicio = document.getElementById('pagInicio');
  const pagFim = document.getElementById('pagFim');
  const pagTotal = document.getElementById('pagTotal');
  const pagAtualNumero = document.getElementById('pagAtualNumero');
  const pagPorPagina = document.getElementById('pagPorPagina');
  const btnPagAnterior = document.getElementById('btnPagAnterior');
  const btnPagProxima = document.getElementById('btnPagProxima');

  // Modal
  const modalDetalhes = document.getElementById('modalDetalhes');
  const modalDetalhesContent = document.getElementById('modalDetalhesContent');
  const modalDetalhesClose = document.getElementById('modalDetalhesClose');
  const modalDetalhesBtnFechar = document.getElementById('modalDetalhesBtnFechar');
  const modalDetalhesBtnEditar = document.getElementById('modalDetalhesBtnEditar');
  let idDemandaModalAtual = null;

  // Atualiza data atual no topo
  const hoje = new Date();
  if (currentDateDisplay) {
    currentDateDisplay.textContent = hoje.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ========================================================================
  // 1. FLUXO DE AUTENTICAÇÃO E SESSÃO
  // ========================================================================
  function verificarSessao() {
    if (window.authService.isAuthenticated()) {
      const user = window.authService.getCurrentUser();
      loginScreenOverlay.style.display = 'none';
      appContainer.style.display = 'block';
      configurarInterfaceUsuario(user);
      inicializarDadosApp();
    } else {
      loginScreenOverlay.style.display = 'flex';
      appContainer.style.display = 'none';
    }
  }

  function configurarInterfaceUsuario(user) {
    if (!user) return;

    userDisplayName.textContent = user.nome;
    userDisplayRole.textContent = user.perfil === 'admin' ? 'ADMINISTRADOR' : 'OPERADOR / ANALISTA';

    // Iniciais no avatar
    const nomes = user.nome.split(' ');
    const iniciais = (nomes[0][0] + (nomes.length > 1 ? nomes[nomes.length - 1][0] : '')).toUpperCase();
    userAvatarText.textContent = iniciais;

    // Controle de Acesso por Perfil (RBAC)
    if (user.perfil === 'admin') {
      tabBtnUsuarios.style.display = 'inline-block';
      tabBtnConfiguracoes.style.display = 'inline-block';
      renderizarTabelaUsuarios();
    } else {
      tabBtnUsuarios.style.display = 'none';
      tabBtnConfiguracoes.style.display = 'none';

      // Se estivesse em uma aba restrita, redireciona para o dashboard
      const abaAtiva = document.querySelector('.nav-tab-btn.active');
      if (abaAtiva && (abaAtiva.getAttribute('data-tab') === 'tab-usuarios' || abaAtiva.getAttribute('data-tab') === 'tab-configuracoes')) {
        ativarAba('tab-dashboard');
      }
    }
  }

  // Submissão do login
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginAlertBox.style.display = 'none';

    const email = loginEmail.value.trim();
    const senha = loginSenha.value.trim();

    const submitBtn = formLogin.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Autenticando no Supabase...';
    }

    try {
      const resultado = await window.authService.login(email, senha);
      if (resultado.success) {
        formLogin.reset();
        verificarSessao();
        mostrarToast(`Bem-vindo(a), ${resultado.user.nome}!`, 'success');
      } else {
        loginAlertBox.textContent = resultado.message;
        loginAlertBox.style.display = 'block';
      }
    } catch (err) {
      loginAlertBox.textContent = 'Erro ao autenticar: ' + (err.message || err);
      loginAlertBox.style.display = 'block';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });

  // Atalhos de teste rápido no login
  btnQuickLoginAdmin.addEventListener('click', () => {
    loginEmail.value = 'admin@cemig.com.br';
    loginSenha.value = 'admin123';
    formLogin.dispatchEvent(new Event('submit'));
  });

  btnQuickLoginOperador.addEventListener('click', () => {
    loginEmail.value = 'analista@cemig.com.br';
    loginSenha.value = 'analista123';
    formLogin.dispatchEvent(new Event('submit'));
  });

  // Logout
  btnLogout.addEventListener('click', () => {
    if (confirm('Deseja realmente encerrar sua sessão?')) {
      window.authService.logout();
      verificarSessao();
      mostrarToast('Sessão encerrada com sucesso.', 'primary');
    }
  });

  // ========================================================================
  // 2. GESTÃO DE USUÁRIOS (EXCLUSIVO PARA ADMIN - 100% SUPABASE)
  // ========================================================================
  formNovoUsuario.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!window.authService.isAdmin()) {
      mostrarToast('Apenas administradores podem cadastrar novos usuários.', 'danger');
      return;
    }

    const btnSubmit = document.getElementById('btnSalvarNovoUsuario');
    const originalText = btnSubmit ? btnSubmit.textContent : '';
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Gravando no Supabase...';
    }

    const nome = document.getElementById('usrNome').value.trim();
    const email = document.getElementById('usrEmail').value.trim();
    const senha = document.getElementById('usrSenha').value.trim();
    const perfil = document.getElementById('usrPerfil').value;
    const cargo = document.getElementById('usrCargo').value.trim();

    try {
      await window.authService.createUser({ nome, email, senha, perfil, cargo });
      mostrarToast(`Usuário ${nome} cadastrado com sucesso no Supabase!`, 'success');
      formNovoUsuario.reset();
      await renderizarTabelaUsuarios();
    } catch (err) {
      mostrarToast(err.message, 'danger');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = originalText;
      }
    }
  });

  async function renderizarTabelaUsuarios() {
    if (!window.authService.isAdmin() || !tabelaUsuariosBody) return;

    tabelaUsuariosBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">Carregando usuários do Supabase...</td></tr>`;

    try {
      const usuarios = await window.authService.getAllUsers();
      tabelaUsuariosBody.innerHTML = '';

      if (!usuarios || usuarios.length === 0) {
        tabelaUsuariosBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum usuário cadastrado na tabela usuarios_vanessa.</td></tr>`;
        return;
      }

      const currentUser = window.authService.getCurrentUser();

      usuarios.forEach(u => {
        const tr = document.createElement('tr');
        const isSelf = currentUser && currentUser.id === u.id;
        const perfilBadge = u.perfil === 'admin'
          ? '<span class="badge badge-admin">Administrador</span>'
          : '<span class="badge badge-operador">Operador / Analista</span>';
        const statusBadge = u.ativo
          ? '<span class="badge badge-ativo">Ativo</span>'
          : '<span class="badge badge-inativo">Inativo</span>';

        const dataFormatada = u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '-';

        tr.innerHTML = `
          <td><strong>${escapeHtml(u.nome)}</strong> ${isSelf ? '<span style="font-size: 11px; color: var(--cemig-green);">(Você)</span>' : ''}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${perfilBadge}</td>
          <td>${escapeHtml(u.cargo || '-')}</td>
          <td>${statusBadge}</td>
          <td>${dataFormatada}</td>
          <td style="text-align: right;">
            ${!isSelf ? `
              <button class="btn btn-secondary btn-sm" onclick="window.alternarStatusUsuario('${u.id}')">
                ${u.ativo ? 'Desativar' : 'Ativar'}
              </button>
              <button class="btn btn-danger btn-sm" onclick="window.excluirUsuario('${u.id}')">
                Excluir
              </button>
            ` : '<span style="color: var(--text-muted); font-size: 11px;">Conta atual</span>'}
          </td>
        `;
        tabelaUsuariosBody.appendChild(tr);
      });
    } catch (err) {
      tabelaUsuariosBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #DC2626; padding: 20px;">Erro ao carregar usuários do Supabase: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  window.alternarStatusUsuario = async (id) => {
    try {
      mostrarToast('Atualizando status no Supabase...', 'primary');
      await window.authService.toggleUserStatus(id);
      await renderizarTabelaUsuarios();
      mostrarToast('Status do usuário atualizado no Supabase.', 'success');
    } catch (err) {
      mostrarToast(err.message, 'danger');
    }
  };

  window.excluirUsuario = async (id) => {
    if (!confirm('Deseja realmente remover este usuário do Supabase?')) return;
    try {
      mostrarToast('Excluindo usuário no Supabase...', 'primary');
      await window.authService.deleteUser(id);
      await renderizarTabelaUsuarios();
      mostrarToast('Usuário removido com sucesso do Supabase.', 'success');
    } catch (err) {
      mostrarToast(err.message, 'danger');
    }
  };

  // ========================================================================
  // 3. INICIALIZAÇÃO DE DADOS DAS DEMANDAS E GRÁFICOS
  // ========================================================================
  let appInicializado = false;

  async function inicializarDadosApp() {
    if (appInicializado) return;
    appInicializado = true;

    window.chartsManager.init();

    try {
      const dados = await window.storageService.getAll();
      todasDemandas = dados || [];
    } catch (err) {
      console.error('Erro ao ler demandas do Supabase:', err);
      mostrarToast('Falha ao carregar demandas do Supabase: ' + err.message, 'danger');
      todasDemandas = [];
    }

    aplicarFiltrosEOrdenar();
    window.chartsManager.updateAll(todasDemandas);
    atualizarIndicadoresStorage();
    resetarFormulario();
  }

  function atualizarIndicadoresStorage() {
    const isOnline = window.storageService.isConfigured();
    if (storageModeText) {
      storageModeText.textContent = isOnline ? 'Supabase Conectado' : 'Supabase Desconectado';
    }
    if (storageDot) {
      if (isOnline) {
        storageDot.classList.add('supabase');
      } else {
        storageDot.classList.remove('supabase');
      }
    }
  }

  // ========================================================================
  // 4. NAVEGAÇÃO ENTRE ABAS
  // ========================================================================
  const navTabBtns = document.querySelectorAll('.nav-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      // Verificacao de seguranca RBAC
      if ((targetId === 'tab-usuarios' || targetId === 'tab-configuracoes') && !window.authService.isAdmin()) {
        mostrarToast('Acesso negado: funcionalidade restrita a administradores.', 'danger');
        return;
      }

      navTabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
        if (targetId === 'tab-dashboard') {
          window.chartsManager.updateAll(todasDemandas);
        } else if (targetId === 'tab-usuarios') {
          renderizarTabelaUsuarios();
        }
      }
    });
  });

  document.getElementById('btnQuickNewDemanda').addEventListener('click', () => {
    resetarFormulario();
    ativarAba('tab-cadastro');
  });

  function ativarAba(tabId) {
    navTabBtns.forEach(b => {
      if (b.getAttribute('data-tab') === tabId) b.classList.add('active');
      else b.classList.remove('active');
    });
    tabPanes.forEach(p => {
      if (p.id === tabId) p.classList.add('active');
      else p.classList.remove('active');
    });
  }

  // ========================================================================
  // 5. FORMULÁRIO DE DEMANDA (CRIAR E ATUALIZAR)
  // ========================================================================
  formDemanda.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(formDemanda);
    const dataVal = formData.get('data_validacao');
    const dataResp = formData.get('data_resposta_mp');

    const registro = {
      data_recebida: formData.get('data_recebida') || null,
      prazo: formData.get('prazo') || null,
      tipo: formData.get('tipo') || '',
      numero_oficio: formData.get('numero_oficio') || '',
      promotoria: formData.get('promotoria') || '',
      municipio_referido: formData.get('municipio_referido') || '',
      categoria: formData.get('categoria') || '',
      subcategoria: formData.get('subcategoria') || '',
      responsabilidade_outra_gerencia: formData.get('responsabilidade_outra_gerencia') || 'Não',
      reincidente: formData.get('reincidente') || 'Não',
      dado_em_comum_eo: formData.get('dado_em_comum_eo') || '',
      requerimento: formData.get('requerimento') || '',
      responsavel: formData.get('responsavel') || '',
      status: formData.get('status') || 'Em Analise',
      data_validacao: dataVal && dataVal.trim() ? dataVal.trim() : null,
      numero_gdoc: formData.get('numero_gdoc') || '',
      data_resposta_mp: dataResp && dataResp.trim() ? dataResp.trim() : null
    };

    try {
      if (demandaEmEdicaoId) {
        await window.storageService.update(demandaEmEdicaoId, registro);
        mostrarToast('Demanda atualizada com sucesso no sistema CEMIG.', 'success');
      } else {
        await window.storageService.create(registro);
        mostrarToast('Nova demanda registrada com sucesso.', 'success');
      }

      resetarFormulario();
      todasDemandas = await window.storageService.getAll();
      aplicarFiltrosEOrdenar();
      window.chartsManager.updateAll(todasDemandas);
      ativarAba('tab-tabela');
    } catch (err) {
      console.error(err);
      mostrarToast('Erro ao salvar demanda: ' + err.message, 'danger');
    }
  });

  function resetarFormulario() {
    formDemanda.reset();
    document.getElementById('field_id').value = '';
    demandaEmEdicaoId = null;
    document.getElementById('formTitle').textContent = 'Cadastrar Nova Demanda Institucional';
    document.getElementById('btnSalvarDemanda').textContent = 'Salvar Demanda';
    document.getElementById('btnCancelarEdicao').style.display = 'none';

    const hojeIso = new Date().toISOString().substring(0, 10);
    document.getElementById('field_data_recebida').value = hojeIso;
  }

  document.getElementById('btnLimparForm').addEventListener('click', resetarFormulario);
  document.getElementById('btnCancelarEdicao').addEventListener('click', resetarFormulario);

  // Carregar Demanda para Edição
  window.carregarParaEdicao = (id) => {
    const dem = todasDemandas.find(d => d.id === id);
    if (!dem) return;

    demandaEmEdicaoId = id;
    document.getElementById('field_id').value = dem.id;
    document.getElementById('field_data_recebida').value = dem.data_recebida || '';
    document.getElementById('field_prazo').value = dem.prazo || '';
    document.getElementById('field_tipo').value = dem.tipo || '';
    document.getElementById('field_numero_oficio').value = dem.numero_oficio || '';
    document.getElementById('field_promotoria').value = dem.promotoria || '';
    document.getElementById('field_municipio_referido').value = dem.municipio_referido || '';
    document.getElementById('field_categoria').value = dem.categoria || '';
    document.getElementById('field_subcategoria').value = dem.subcategoria || '';
    document.getElementById('field_responsabilidade_outra_gerencia').value = dem.responsabilidade_outra_gerencia || 'Não';
    document.getElementById('field_reincidente').value = dem.reincidente || 'Não';
    document.getElementById('field_dado_em_comum_eo').value = dem.dado_em_comum_eo || '';
    document.getElementById('field_requerimento').value = dem.requerimento || '';
    document.getElementById('field_responsavel').value = dem.responsavel || '';
    document.getElementById('field_status').value = dem.status || 'Em Analise';
    document.getElementById('field_data_validacao').value = dem.data_validacao || '';
    document.getElementById('field_numero_gdoc').value = dem.numero_gdoc || '';
    document.getElementById('field_data_resposta_mp').value = dem.data_resposta_mp || '';

    document.getElementById('formTitle').textContent = `Editar Demanda: ${dem.id} (${dem.numero_oficio})`;
    document.getElementById('btnSalvarDemanda').textContent = 'Atualizar Demanda';
    document.getElementById('btnCancelarEdicao').style.display = 'inline-flex';

    if (modalDetalhes.classList.contains('open')) {
      modalDetalhes.classList.remove('open');
    }

    ativarAba('tab-cadastro');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Excluir Demanda
  window.excluirDemanda = async (id) => {
    if (!confirm(`Deseja realmente remover a demanda ${id}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await window.storageService.delete(id);
      todasDemandas = await window.storageService.getAll();
      aplicarFiltrosEOrdenar();
      window.chartsManager.updateAll(todasDemandas);
      mostrarToast('Demanda excluída com sucesso.', 'success');
    } catch (err) {
      mostrarToast('Erro ao excluir: ' + err.message, 'danger');
    }
  };

  // Detalhes da Demanda no Modal
  window.abrirDetalhesDemanda = (id) => {
    const dem = todasDemandas.find(d => d.id === id);
    if (!dem) return;

    idDemandaModalAtual = id;
    document.getElementById('modalDetalhesTitle').textContent = `Demanda ${dem.id} - ${dem.numero_oficio || 'Sem Ofício'}`;

    const slaInfo = calcularSlaInfo(dem);

    modalDetalhesContent.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; font-size: 13px;">
        <div><b>Data Recebida:</b> ${formatarData(dem.data_recebida)}</div>
        <div><b>Prazo Limite:</b> ${formatarData(dem.prazo)}</div>
        <div><b>Tipo:</b> ${dem.tipo || '-'}</div>
        <div><b>Número do Ofício:</b> ${dem.numero_oficio || '-'}</div>
        <div><b>Promotoria:</b> ${dem.promotoria || '-'}</div>
        <div><b>Município Referido:</b> ${dem.municipio_referido || '-'}</div>
        <div><b>Categoria:</b> ${dem.categoria || '-'}</div>
        <div><b>Subcategoria:</b> ${dem.subcategoria || '-'}</div>
        <div><b>Resp. Outra Gerência:</b> ${dem.responsabilidade_outra_gerencia || 'Não'}</div>
        <div><b>Reincidente:</b> ${dem.reincidente || 'Não'}</div>
        <div><b>Dado em Comum (EO):</b> ${dem.dado_em_comum_eo || '-'}</div>
        <div><b>Responsável:</b> ${dem.responsavel || '-'}</div>
        <div><b>Status:</b> ${renderBadgeStatus(dem.status)}</div>
        <div><b>Situação SLA:</b> ${slaInfo.badgeHtml}</div>
        <div><b>Data Validação:</b> ${formatarData(dem.data_validacao)}</div>
        <div><b>Número GDOC:</b> ${dem.numero_gdoc || '-'}</div>
        <div><b>Data Resposta MP:</b> ${formatarData(dem.data_resposta_mp)}</div>
        <div style="grid-column: span 2; margin-top: 8px;">
          <b>Requerimento / Observações:</b>
          <div style="background: #F4F7F5; padding: 10px; border-radius: 4px; border: 1px solid #DDE5E0; margin-top: 4px; white-space: pre-wrap;">
            ${dem.requerimento ? escapeHtml(dem.requerimento) : 'Nenhum detalhe adicional informado.'}
          </div>
        </div>
      </div>
    `;

    modalDetalhes.classList.add('open');
  };

  modalDetalhesClose.addEventListener('click', () => modalDetalhes.classList.remove('open'));
  modalDetalhesBtnFechar.addEventListener('click', () => modalDetalhes.classList.remove('open'));
  modalDetalhesBtnEditar.addEventListener('click', () => {
    if (idDemandaModalAtual) carregarParaEdicao(idDemandaModalAtual);
  });

  // ========================================================================
  // 6. FILTROS E PESQUISA DA TABELA
  // ========================================================================
  function aplicarFiltrosEOrdenar() {
    const termo = (filtroBuscaGlobal.value || '').toLowerCase().trim();
    const st = filtroStatus.value;
    const tp = filtroTipo.value;
    const resp = filtroResponsavel.value;
    const sla = filtroSLA.value;

    const dataHoje = new Date();
    dataHoje.setHours(0, 0, 0, 0);

    demandasFiltradas = todasDemandas.filter(item => {
      if (termo) {
        const linhaCompleta = [
          item.id,
          item.numero_oficio,
          item.tipo,
          item.promotoria,
          item.municipio_referido,
          item.categoria,
          item.subcategoria,
          item.responsavel,
          item.numero_gdoc,
          item.dado_em_comum_eo,
          item.requerimento
        ].join(' ').toLowerCase();

        if (!linhaCompleta.includes(termo)) return false;
      }

      if (st && item.status !== st) return false;
      if (tp && item.tipo !== tp) return false;
      if (resp && item.responsavel !== resp) return false;

      if (sla) {
        const prazoD = item.prazo ? new Date(item.prazo + 'T00:00:00') : null;
        const respD = item.data_resposta_mp ? new Date(item.data_resposta_mp + 'T00:00:00') : null;

        if (sla === 'no_prazo') {
          if (!respD || !prazoD || respD > prazoD) return false;
        } else if (sla === 'fora_prazo') {
          if (!respD || !prazoD || respD <= prazoD) return false;
        } else if (sla === 'vencidas_abertas') {
          const isAberta = item.status === 'Em Analise' || item.status === 'Em Análise';
          if (!isAberta || !prazoD || prazoD >= dataHoje) return false;
        }
      }

      return true;
    });

    demandasFiltradas.sort((a, b) => {
      let valA = a[colunaOrdenacao] || '';
      let valB = b[colunaOrdenacao] || '';
      if (valA < valB) return direcaoOrdenacao === 'asc' ? -1 : 1;
      if (valA > valB) return direcaoOrdenacao === 'asc' ? 1 : -1;
      return 0;
    });

    paginaAtual = 1;
    renderizarTabela();
    atualizarContadores();
  }

  filtroBuscaGlobal.addEventListener('input', debounce(aplicarFiltrosEOrdenar, 200));
  filtroStatus.addEventListener('change', aplicarFiltrosEOrdenar);
  filtroTipo.addEventListener('change', aplicarFiltrosEOrdenar);
  filtroResponsavel.addEventListener('change', aplicarFiltrosEOrdenar);
  filtroSLA.addEventListener('change', aplicarFiltrosEOrdenar);

  btnLimparFiltros.addEventListener('click', () => {
    filtroBuscaGlobal.value = '';
    filtroStatus.value = '';
    filtroTipo.value = '';
    filtroResponsavel.value = '';
    filtroSLA.value = '';
    aplicarFiltrosEOrdenar();
  });

  document.querySelectorAll('.data-table th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const campo = th.getAttribute('data-sort');
      if (colunaOrdenacao === campo) {
        direcaoOrdenacao = direcaoOrdenacao === 'asc' ? 'desc' : 'asc';
      } else {
        colunaOrdenacao = campo;
        direcaoOrdenacao = 'asc';
      }
      aplicarFiltrosEOrdenar();
    });
  });

  // ========================================================================
  // 7. RENDERIZAÇÃO DA TABELA E PAGINAÇÃO
  // ========================================================================
  function renderizarTabela() {
    const total = demandasFiltradas.length;
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = Math.min(inicio + itensPorPagina, total);
    const registrosPagina = demandasFiltradas.slice(inicio, fim);

    tabelaBody.innerHTML = '';

    if (total === 0) {
      tabelaBody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align: center; padding: 30px; color: var(--text-muted);">
            Nenhuma demanda encontrada para os critérios selecionados.
          </td>
        </tr>
      `;
      pagInicio.textContent = '0';
      pagFim.textContent = '0';
      pagTotal.textContent = '0';
      pagAtualNumero.textContent = '1';
      return;
    }

    registrosPagina.forEach(item => {
      const tr = document.createElement('tr');
      const sla = calcularSlaInfo(item);
      const loc = [item.promotoria, item.municipio_referido].filter(Boolean).join(' / ') || '-';

      tr.innerHTML = `
        <td><strong style="color: var(--cemig-green-dark); cursor: pointer;" onclick="abrirDetalhesDemanda('${item.id}')">${item.id}</strong></td>
        <td>${formatarData(item.data_recebida)}</td>
        <td>${formatarData(item.prazo)}</td>
        <td>${escapeHtml(item.tipo || '-')}</td>
        <td title="${escapeHtml(item.numero_oficio || '')}">${escapeHtml(item.numero_oficio || '-')}</td>
        <td title="${escapeHtml(loc)}">${escapeHtml(loc)}</td>
        <td>${escapeHtml(item.categoria || '-')}</td>
        <td>${escapeHtml(item.responsavel || '-')}</td>
        <td>${renderBadgeStatus(item.status)}</td>
        <td>${sla.badgeHtml}</td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm" onclick="abrirDetalhesDemanda('${item.id}')">Ver</button>
          <button class="btn btn-secondary btn-sm" onclick="carregarParaEdicao('${item.id}')">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="excluirDemanda('${item.id}')">Excluir</button>
        </td>
      `;
      tabelaBody.appendChild(tr);
    });

    pagInicio.textContent = (inicio + 1).toString();
    pagFim.textContent = fim.toString();
    pagTotal.textContent = total.toString();
    pagAtualNumero.textContent = paginaAtual.toString();

    btnPagAnterior.disabled = paginaAtual <= 1;
    btnPagProxima.disabled = fim >= total;
  }

  pagPorPagina.addEventListener('change', (e) => {
    itensPorPagina = parseInt(e.target.value, 10);
    paginaAtual = 1;
    renderizarTabela();
  });

  btnPagAnterior.addEventListener('click', () => {
    if (paginaAtual > 1) {
      paginaAtual--;
      renderizarTabela();
    }
  });

  btnPagProxima.addEventListener('click', () => {
    const total = demandasFiltradas.length;
    if (paginaAtual * itensPorPagina < total) {
      paginaAtual++;
      renderizarTabela();
    }
  });

  function atualizarContadores() {
    totalDemandasBadge.textContent = todasDemandas.length;
  }

  // ========================================================================
  // 8. CÁLCULO DE SLA E FORMATAÇÃO
  // ========================================================================
  function calcularSlaInfo(item) {
    const dataHoje = new Date();
    dataHoje.setHours(0, 0, 0, 0);

    const prazoD = item.prazo ? new Date(item.prazo + 'T00:00:00') : null;
    const respD = item.data_resposta_mp ? new Date(item.data_resposta_mp + 'T00:00:00') : null;
    const status = (item.status || '').trim();

    if (status === 'Concluido' || status === 'Concluído' || status === 'Redirecionado') {
      if (respD && prazoD && !isNaN(respD) && !isNaN(prazoD)) {
        if (respD <= prazoD) {
          return {
            status: 'ok',
            badgeHtml: '<span class="badge badge-prazo-ok">No Prazo</span>'
          };
        } else {
          const diffDias = Math.round((respD - prazoD) / (1000 * 60 * 60 * 24));
          return {
            status: 'atrasado',
            badgeHtml: `<span class="badge badge-prazo-late">+${diffDias}d Atraso</span>`
          };
        }
      }
      return {
        status: 'ok',
        badgeHtml: '<span class="badge badge-prazo-ok">Concluído</span>'
      };
    } else {
      if (prazoD && !isNaN(prazoD)) {
        if (prazoD < dataHoje) {
          const diasVencido = Math.round((dataHoje - prazoD) / (1000 * 60 * 60 * 24));
          return {
            status: 'vencido',
            badgeHtml: `<span class="badge badge-prazo-late">Vencido (${diasVencido}d)</span>`
          };
        } else {
          const diasRestantes = Math.round((prazoD - dataHoje) / (1000 * 60 * 60 * 24));
          return {
            status: 'pendente',
            badgeHtml: `<span class="badge badge-analise">${diasRestantes}d restantes</span>`
          };
        }
      }
      return {
        status: 'pendente',
        badgeHtml: '<span class="badge badge-analise">Em Análise</span>'
      };
    }
  }

  function renderBadgeStatus(status) {
    const s = (status || 'Em Analise').trim();
    if (s === 'Concluido' || s === 'Concluído') {
      return '<span class="badge badge-concluido">Concluído</span>';
    }
    if (s === 'Redirecionado') {
      return '<span class="badge badge-redirecionado">Redirecionado</span>';
    }
    return '<span class="badge badge-analise">Em Análise</span>';
  }

  function formatarData(dataIso) {
    if (!dataIso || dataIso === '-' || dataIso === '_') return '-';
    try {
      const parts = dataIso.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dataIso;
    } catch {
      return dataIso;
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function mostrarToast(mensagem, tipo = 'primary') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = mensagem;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3500);
  }

  // ========================================================================
  // 9. CONFIGURAÇÕES DO SUPABASE (OPERAÇÃO 100% EM NUVEM)
  // ========================================================================
  const cfgSupabaseUrl = document.getElementById('cfgSupabaseUrl');
  const cfgSupabaseKey = document.getElementById('cfgSupabaseKey');
  const cfgTableName = document.getElementById('cfgTableName');
  const cfgUsersTableName = document.getElementById('cfgUsersTableName');
  const btnTestarSupabase = document.getElementById('btnTestarSupabase');
  const btnSalvarConfigSupabase = document.getElementById('btnSalvarConfigSupabase');
  const feedbackArea = document.getElementById('supabaseFeedbackArea');

  if (window.storageService.supabaseUrl && cfgSupabaseUrl) cfgSupabaseUrl.value = window.storageService.supabaseUrl;
  if (window.storageService.supabaseKey && cfgSupabaseKey) cfgSupabaseKey.value = window.storageService.supabaseKey;
  if (window.storageService.tableName && cfgTableName) cfgTableName.value = window.storageService.tableName;
  if (window.storageService.usersTableName && cfgUsersTableName) cfgUsersTableName.value = window.storageService.usersTableName;

  if (btnTestarSupabase) {
    btnTestarSupabase.addEventListener('click', async () => {
      const rawUrl = cfgSupabaseUrl.value.trim();
      const rawKey = cfgSupabaseKey.value.trim();
      const rawTable = cfgTableName.value.trim() || 'demandas_vanessa';
      const rawUsersTable = (cfgUsersTableName ? cfgUsersTableName.value.trim() : '') || 'usuarios_vanessa';

      const url = window.storageService.sanitizeUrl(rawUrl);
      const table = window.storageService.sanitizeTableName(rawTable);
      const usersTable = window.storageService.sanitizeTableName(rawUsersTable);
      const key = rawKey;

      cfgSupabaseUrl.value = url;
      cfgTableName.value = table;
      if (cfgUsersTableName) cfgUsersTableName.value = usersTable;

      if (!url || !key) {
        mostrarFeedback('Por favor, informe a URL do projeto e a Anon Public Key.', 'danger');
        return;
      }

      mostrarFeedback('Testando tabelas no Supabase...', 'warning');
      const result = await window.storageService.testSupabaseConnection(url, key, table, usersTable);
      if (result.success) {
        mostrarFeedback(result.message, 'success');
        mostrarToast('Conexão com Supabase verificada com sucesso.', 'success');
      } else {
        mostrarFeedback('Falha de conexão: ' + result.message, 'danger');
        mostrarToast('Falha ao conectar com o Supabase.', 'danger');
      }
    });
  }

  if (btnSalvarConfigSupabase) {
    btnSalvarConfigSupabase.addEventListener('click', async () => {
      const rawUrl = cfgSupabaseUrl.value.trim();
      const rawKey = cfgSupabaseKey.value.trim();
      const rawTable = cfgTableName.value.trim() || 'demandas_vanessa';
      const rawUsersTable = (cfgUsersTableName ? cfgUsersTableName.value.trim() : '') || 'usuarios_vanessa';

      const url = window.storageService.sanitizeUrl(rawUrl);
      const table = window.storageService.sanitizeTableName(rawTable);
      const usersTable = window.storageService.sanitizeTableName(rawUsersTable);
      const key = rawKey;

      cfgSupabaseUrl.value = url;
      cfgTableName.value = table;
      if (cfgUsersTableName) cfgUsersTableName.value = usersTable;

      window.storageService.saveConfig({
        supabaseUrl: url,
        supabaseKey: key,
        tableName: table,
        usersTableName: usersTable
      });

      atualizarIndicadoresStorage();
      try {
        todasDemandas = await window.storageService.getAll();
        aplicarFiltrosEOrdenar();
        window.chartsManager.updateAll(todasDemandas);
        mostrarFeedback(`Configuração salva com sucesso. Tabelas ativas: "${table}" e "${usersTable}".`, 'success');
        mostrarToast('Configurações salvas e dados sincronizados.', 'success');
      } catch (err) {
        mostrarFeedback('Configurações salvas, mas houve erro ao carregar dados: ' + err.message, 'danger');
      }
    });
  }

  function mostrarFeedback(msg, tipo) {
    if (!feedbackArea) return;
    feedbackArea.style.display = 'block';
    feedbackArea.textContent = msg;
    feedbackArea.style.color = tipo === 'success' ? '#008542' : tipo === 'danger' ? '#DC2626' : '#FF6A00';
  }

  // ========================================================================
  // 10. BACKUP, EXPORTAÇÃO E IMPORTAÇÃO
  // ========================================================================
  document.getElementById('btnExportarJSON').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(todasDemandas, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `cemig_demandas_backup_${new Date().toISOString().substring(0, 10)}.json`);
    dlAnchor.click();
  });

  document.getElementById('btnExportarCSV').addEventListener('click', () => {
    if (todasDemandas.length === 0) {
      mostrarToast('Nenhum dado para exportar.', 'warning');
      return;
    }

    const headers = [
      'ID', 'Data Recebida', 'Prazo', 'Tipo', 'Número do Ofício', 'Promotoria',
      'Município Referido', 'Categoria', 'Subcategoria', 'Resp Outra Gerência',
      'Reincidente', 'Dado em Comum EO', 'Requerimento', 'Responsável',
      'Status', 'Data Validação', 'Número GDOC', 'Data Resposta MP'
    ];

    const rows = todasDemandas.map(d => [
      d.id, d.data_recebida, d.prazo, d.tipo, `"${(d.numero_oficio || '').replace(/"/g, '""')}"`,
      `"${(d.promotoria || '').replace(/"/g, '""')}"`, `"${(d.municipio_referido || '').replace(/"/g, '""')}"`,
      `"${(d.categoria || '').replace(/"/g, '""')}"`, `"${(d.subcategoria || '').replace(/"/g, '""')}"`,
      d.responsabilidade_outra_gerencia, d.reincidente, `"${(d.dado_em_comum_eo || '').replace(/"/g, '""')}"`,
      `"${(d.requerimento || '').replace(/"/g, '""')}"`, `"${(d.responsavel || '').replace(/"/g, '""')}"`,
      d.status, d.data_validacao, d.numero_gdoc, d.data_resposta_mp
    ]);

    const csvContent = "data:text/csv;charset=utf-8,﻿" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", encodeURI(csvContent));
    dlAnchor.setAttribute("download", `cemig_demandas_export_${new Date().toISOString().substring(0, 10)}.csv`);
    dlAnchor.click();
  });

  const fileInputImportJSON = document.getElementById('fileInputImportJSON');
  fileInputImportJSON.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          mostrarToast('Importando registros para o Supabase...', 'primary');
          await window.storageService.bulkInsert(imported);
          todasDemandas = await window.storageService.getAll();
          aplicarFiltrosEOrdenar();
          window.chartsManager.updateAll(todasDemandas);
          mostrarToast(`${imported.length} registros importados com sucesso para o Supabase.`, 'success');
        } else {
          mostrarToast('O arquivo JSON não contém uma lista válida.', 'danger');
        }
      } catch (err) {
        mostrarToast('Erro ao importar para o Supabase: ' + err.message, 'danger');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('btnRestaurarExemplo').addEventListener('click', async () => {
    if (!confirm('Deseja carregar os registros de demonstração da planilha original diretamente no Supabase?')) return;
    if (typeof INITIAL_DEMANDAS !== 'undefined' && Array.isArray(INITIAL_DEMANDAS)) {
      try {
        mostrarToast('Enviando dados da planilha para o Supabase...', 'primary');
        await window.storageService.bulkInsert(INITIAL_DEMANDAS);
        todasDemandas = await window.storageService.getAll();
        aplicarFiltrosEOrdenar();
        window.chartsManager.updateAll(todasDemandas);
        mostrarToast('Base de demonstração gravada com sucesso no Supabase.', 'success');
      } catch (err) {
        mostrarToast('Erro ao carregar no Supabase: ' + err.message, 'danger');
      }
    }
  });

  document.getElementById('btnLimparTudo').addEventListener('click', async () => {
    if (!confirm('ATENÇÃO: Deseja realmente excluir todas as demandas cadastradas na tabela do Supabase? Essa ação é irreversível.')) return;
    try {
      mostrarToast('Limpando demandas no Supabase...', 'primary');
      await window.storageService.deleteAll();
      todasDemandas = [];
      aplicarFiltrosEOrdenar();
      window.chartsManager.updateAll(todasDemandas);
      mostrarToast('Todas as demandas foram removidas do Supabase.', 'warning');
    } catch (err) {
      mostrarToast('Erro ao limpar demandas no Supabase: ' + err.message, 'danger');
    }
  });

  // Executa verificacao inicial de autenticacao
  verificarSessao();
});
