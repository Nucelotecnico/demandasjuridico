/**
 * Modulo de Graficos e Insights em Tempo Real: ChartsManager
 * Gerencia instancias do Chart.js e calculo dinâmico de metricas e KPIs.
 * Todas as visualizacoes em barras exibem os valores na parte externa.
 */

// Plugin Customizado Chart.js: Exibe os valores fora das barras
const barValueLabelsPlugin = {
  id: 'barValueLabels',
  afterDatasetsDraw(chart) {
    if (chart.config.type !== 'bar') return;
    const { ctx } = chart;
    const isHorizontal = chart.config.options?.indexAxis === 'y';

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden) return;

      meta.data.forEach((element, index) => {
        const val = dataset.data[index];
        if (val === null || val === undefined) return;
        // Oculta zeros quando ha multiplos datasets agrupados para evitar poluicao visual
        if (val === 0 && chart.data.datasets.length > 1) return;

        ctx.save();
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#1e293b';

        if (isHorizontal) {
          // Barra horizontal: valor à direita da barra
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(val), element.x + 6, element.y);
        } else {
          // Barra vertical: valor acima da barra
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(String(val), element.x, element.y - 4);
        }
        ctx.restore();
      });
    });
  }
};

if (typeof Chart !== 'undefined' && Chart.register) {
  Chart.register(barValueLabelsPlugin);
}

class ChartsManager {
  constructor() {
    this.charts = {};
  }

  // Inicializacao dos graficos
  init() {
    this.initTimelineChart();
    this.initTipoChart();
    this.initStatusChart();
    this.initCategoriaChart();
    this.initResponsavelChart();
    this.initSlaChart();
  }

  // Grafico 1: Status (Convertido de Rosca/Pizza para BARRAS)
  initStatusChart() {
    const ctx = document.getElementById('chartStatus');
    if (!ctx) return;
    this.charts.status = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Concluído', 'Em Análise', 'Redirecionado'],
        datasets: [{
          label: 'Total por Status',
          data: [0, 0, 0],
          backgroundColor: ['#16a34a', '#ca8a04', '#0284c7'],
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const val = ctx.raw || 0;
                const pct = total ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${val} (${pct}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 12, weight: '700' }, color: '#334155' }
          },
          y: {
            beginAtZero: true,
            grace: '15%',
            ticks: { precision: 0, font: { size: 11 } },
            grid: { color: '#f1f5f9' }
          }
        }
      }
    });
  }

  // Grafico 2: Tipos de Demanda (Barras Horizontais com valores à direita)
  initTipoChart() {
    const ctx = document.getElementById('chartTipo');
    if (!ctx) return;
    this.charts.tipo = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Total de Demandas',
          data: [],
          backgroundColor: '#2563eb',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            grace: '18%',
            grid: { color: '#f1f5f9' },
            ticks: { precision: 0 }
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 11, weight: '600' }, color: '#334155' }
          }
        }
      }
    });
  }

  // Grafico 3: Cumprimento de Prazo SLA (Convertido de Pizza para BARRAS)
  initSlaChart() {
    const ctx = document.getElementById('chartSla');
    if (!ctx) return;
    this.charts.sla = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['No Prazo', 'Fora do Prazo', 'Em Aberto (No Prazo)', 'Em Aberto (Atrasado)'],
        datasets: [{
          label: 'Total de Demandas',
          data: [0, 0, 0, 0],
          backgroundColor: ['#16a34a', '#dc2626', '#0284c7', '#ea580c'],
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const val = ctx.raw || 0;
                const pct = total ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${val} (${pct}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, weight: '700' }, color: '#334155' }
          },
          y: {
            beginAtZero: true,
            grace: '15%',
            ticks: { precision: 0, font: { size: 11 } },
            grid: { color: '#f1f5f9' }
          }
        }
      }
    });
  }

  // Grafico 4: Demandas por Responsavel (Barras Agrupadas com valores em cada barra)
  initResponsavelChart() {
    const ctx = document.getElementById('chartResponsavel');
    if (!ctx) return;
    this.charts.responsavel = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Concluído',
            data: [],
            backgroundColor: '#16a34a',
            borderRadius: 4
          },
          {
            label: 'Em Análise',
            data: [],
            backgroundColor: '#ca8a04',
            borderRadius: 4
          },
          {
            label: 'Redirecionado',
            data: [],
            backgroundColor: '#0284c7',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 14, font: { size: 12, weight: '600' } }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 12, weight: '700' }, color: '#1e293b' }
          },
          y: {
            beginAtZero: true,
            grace: '15%',
            ticks: { precision: 0, font: { size: 11 } },
            grid: { color: '#f1f5f9' }
          }
        }
      }
    });
  }

  // Grafico 5: Top Categorias (Barras com valores acima)
  initCategoriaChart() {
    const ctx = document.getElementById('chartCategoria');
    if (!ctx) return;
    this.charts.categoria = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Demandas por Categoria',
          data: [],
          backgroundColor: '#7c3aed',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, weight: '600' }, color: '#334155' }
          },
          y: {
            beginAtZero: true,
            grace: '15%',
            ticks: { precision: 0, font: { size: 11 } },
            grid: { color: '#f1f5f9' }
          }
        }
      }
    });
  }

  // Grafico 6: Evolucao Temporal Mensal (Convertido para BARRAS com valores externos)
  initTimelineChart() {
    const ctx = document.getElementById('chartTimeline');
    if (!ctx) return;
    this.charts.timeline = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Novas Demandas Recebidas',
          data: [],
          backgroundColor: '#008542',
          borderRadius: 4,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, weight: '600' }, color: '#334155' }
          },
          y: {
            beginAtZero: true,
            grace: '15%',
            ticks: { precision: 0, font: { size: 11 } },
            grid: { color: '#f1f5f9' }
          }
        }
      }
    });
  }

  // Metodo principal de atualizacao chamado em tempo real
  updateAll(records) {
    if (!records || !Array.isArray(records)) return;

    this.updateInsightsAndCards(records);
    this.updateTimelineChart(records);
    this.updateTipoChart(records);
    this.updateStatusChart(records);
    this.updateCategoriaChart(records);
    this.updateResponsavelChart(records);
    this.updateSlaChart(records);
  }

  // Calculo de metricas e atualizacao de cards (Dashboard, Produtividade e Prazos)
  updateInsightsAndCards(records) {
    const total = records.length;
    let concluidas = 0;
    let emAnalise = 0;
    let redirecionadas = 0;

    let noPrazoConcluidas = 0;
    let foraPrazoConcluidas = 0;
    let emAbertoOk = 0;
    let emAbertoAtrasadas = 0;
    let somaTempoAtendimentoDias = 0;
    let qtdCalculoTempo = 0;

    const responsaveisMap = {};
    const categoriasCount = {};
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    records.forEach(r => {
      const status = (r.status || '').trim();
      if (status === 'Concluido' || status === 'Concluído') concluidas++;
      else if (status === 'Em Analise' || status === 'Em Análise') emAnalise++;
      else if (status === 'Redirecionado') redirecionadas++;

      // Contagem e agregacao por responsavel
      let resp = (r.responsavel || 'Não Informado').trim();
      if (!resp || resp === '-' || resp === '_') resp = 'Não Informado';
      if (!responsaveisMap[resp]) {
        responsaveisMap[resp] = { total: 0, concluidas: 0, analise: 0, redirecionado: 0 };
      }
      responsaveisMap[resp].total++;
      if (status === 'Concluido' || status === 'Concluído') responsaveisMap[resp].concluidas++;
      else if (status === 'Em Analise' || status === 'Em Análise') responsaveisMap[resp].analise++;
      else if (status === 'Redirecionado') responsaveisMap[resp].redirecionado++;

      // Contagem de categoria
      const cat = (r.categoria || 'Não Especificada').trim();
      if (cat && cat !== '-' && cat !== '_') {
        categoriasCount[cat] = (categoriasCount[cat] || 0) + 1;
      }

      // Calculo de SLA e tempo medio
      const prazoDate = r.prazo ? new Date(r.prazo + 'T00:00:00') : null;
      const respDate = r.data_resposta_mp ? new Date(r.data_resposta_mp + 'T00:00:00') : null;
      const recDate = r.data_recebida ? new Date(r.data_recebida + 'T00:00:00') : null;

      if (status === 'Concluido' || status === 'Concluído' || status === 'Redirecionado') {
        if (respDate && prazoDate && !isNaN(prazoDate) && !isNaN(respDate)) {
          if (respDate <= prazoDate) {
            noPrazoConcluidas++;
          } else {
            foraPrazoConcluidas++;
          }
        } else {
          noPrazoConcluidas++;
        }
      } else {
        if (prazoDate && !isNaN(prazoDate) && prazoDate < hoje) {
          emAbertoAtrasadas++;
        } else {
          emAbertoOk++;
        }
      }

      if (recDate && respDate && !isNaN(recDate) && !isNaN(respDate)) {
        const diffMs = respDate - recDate;
        const diffDias = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        somaTempoAtendimentoDias += diffDias;
        qtdCalculoTempo++;
      }
    });

    const totalAvaliadasSla = noPrazoConcluidas + foraPrazoConcluidas;
    const taxaSla = totalAvaliadasSla > 0 ? ((noPrazoConcluidas / totalAvaliadasSla) * 100).toFixed(1) : '100.0';
    const mediaDias = qtdCalculoTempo > 0 ? (somaTempoAtendimentoDias / qtdCalculoTempo).toFixed(1) : '0';

    // Responsavel com maior volume
    let topResp = 'N/A';
    let topRespCount = 0;
    Object.entries(responsaveisMap).forEach(([k, v]) => {
      if (v.total > topRespCount) {
        topRespCount = v.total;
        topResp = k;
      }
    });

    // Categoria destaque
    let topCat = 'N/A';
    let topCatCount = 0;
    Object.entries(categoriasCount).forEach(([k, v]) => {
      if (v > topCatCount) {
        topCatCount = v;
        topCat = k;
      }
    });

    // 1. Atualiza Cards do Dashboard Geral
    this.setTextSafe('metricTotal', total);
    this.setTextSafe('metricEmAnalise', emAnalise);
    this.setTextSafe('metricConcluidas', concluidas);
    this.setTextSafe('metricTaxaSla', `${taxaSla}%`);
    this.setTextSafe('metricMediaDias', `${mediaDias} d`);
    this.setTextSafe('metricAtrasadas', emAbertoAtrasadas);
    this.setTextSafe('metricTopResp', `${topResp} (${topRespCount})`);
    this.setTextSafe('metricTopCat', `${topCat} (${topCatCount})`);

    // 2. Atualiza Cards da Aba Produtividade
    this.setTextSafe('metricProdTopResp', `${topResp} (${topRespCount})`);
    this.setTextSafe('metricProdMediaDias', `${mediaDias} d`);
    this.setTextSafe('metricProdConcluidas', concluidas);
    this.setTextSafe('metricProdEmAnalise', emAnalise);

    // 3. Atualiza Cards da Aba Prazos
    this.setTextSafe('metricPrazosTaxaSla', `${taxaSla}%`);
    this.setTextSafe('metricPrazosAtrasadas', emAbertoAtrasadas);
    this.setTextSafe('metricPrazosNoPrazo', noPrazoConcluidas);
    this.setTextSafe('metricPrazosForaPrazo', foraPrazoConcluidas);

    // Renderiza tabelas de detalhamento
    this.renderTabelaProdutividade(responsaveisMap, total);
    this.renderTabelaPrazos(noPrazoConcluidas, foraPrazoConcluidas, emAbertoOk, emAbertoAtrasadas, total);
  }

  // Tabela da aba Produtividade
  renderTabelaProdutividade(respMap, totalGeral) {
    const tbody = document.getElementById('tabelaProdutividadeBody');
    if (!tbody) return;

    const list = Object.entries(respMap).sort((a, b) => b[1].total - a[1].total);
    tbody.innerHTML = '';

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 16px;">Nenhum registro para exibir.</td></tr>';
      return;
    }

    list.forEach(([nome, dados]) => {
      const taxaConclusao = dados.total > 0 ? ((dados.concluidas / dados.total) * 100).toFixed(1) : '0.0';
      const pctCarga = totalGeral > 0 ? ((dados.total / totalGeral) * 100).toFixed(1) : '0.0';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${this.escapeHtml(nome)}</strong></td>
        <td style="text-align: center;"><span class="badge" style="background: #E2E8F0; color: #1E293B;">${dados.total}</span></td>
        <td style="text-align: center; color: #16A34A; font-weight: 700;">${dados.concluidas}</td>
        <td style="text-align: center; color: #CA8A04; font-weight: 700;">${dados.analise}</td>
        <td style="text-align: center; color: #0284C7; font-weight: 700;">${dados.redirecionado}</td>
        <td style="text-align: center;"><strong>${taxaConclusao}%</strong></td>
        <td style="text-align: right; font-weight: 700; color: var(--cemig-green-dark);">${pctCarga}%</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Tabela da aba Prazos
  renderTabelaPrazos(noPrazo, foraPrazo, emAbertoOk, emAbertoAtrasadas, totalGeral) {
    const tbody = document.getElementById('tabelaPrazosBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const totalAvaliadas = noPrazo + foraPrazo + emAbertoOk + emAbertoAtrasadas || 1;

    const linhas = [
      {
        situacao: 'Concluídas no Prazo Legal',
        qtd: noPrazo,
        pct: ((noPrazo / totalAvaliadas) * 100).toFixed(1),
        impacto: '<span class="badge badge-concluido">Conforme</span>',
        acao: 'Prazos atendidos perante o demandante'
      },
      {
        situacao: 'Concluídas Fora do Prazo',
        qtd: foraPrazo,
        pct: ((foraPrazo / totalAvaliadas) * 100).toFixed(1),
        impacto: '<span class="badge badge-inativo">Atraso</span>',
        acao: 'Avaliar causas de extrapolação de prazo'
      },
      {
        situacao: 'Em Aberto (Dentro do Prazo)',
        qtd: emAbertoOk,
        pct: ((emAbertoOk / totalAvaliadas) * 100).toFixed(1),
        impacto: '<span class="badge badge-analise">Em Vigência</span>',
        acao: 'Monitorar tramitação das respostas'
      },
      {
        situacao: 'Em Aberto (Vencidas / Atrasadas)',
        qtd: emAbertoAtrasadas,
        pct: ((emAbertoAtrasadas / totalAvaliadas) * 100).toFixed(1),
        impacto: '<span class="badge badge-danger" style="background:#FEE2E2; color:#DC2626;">Crítico</span>',
        acao: 'Prioridade máxima de resposta imediata'
      }
    ];

    linhas.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.situacao}</strong></td>
        <td style="text-align: center; font-weight: 800;">${item.qtd}</td>
        <td style="text-align: center;">${item.pct}%</td>
        <td style="text-align: center;">${item.impacto}</td>
        <td style="text-align: right; color: var(--text-muted); font-size: 12px;">${item.acao}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  setTextSafe(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  updateStatusChart(records) {
    if (!this.charts.status) return;
    let conc = 0, anal = 0, redir = 0;
    records.forEach(r => {
      const s = (r.status || '').trim();
      if (s === 'Concluido' || s === 'Concluído') conc++;
      else if (s === 'Em Analise' || s === 'Em Análise') anal++;
      else if (s === 'Redirecionado') redir++;
    });
    this.charts.status.data.datasets[0].data = [conc, anal, redir];
    this.charts.status.update();
  }

  updateTipoChart(records) {
    if (!this.charts.tipo) return;
    const countMap = {};
    records.forEach(r => {
      let t = (r.tipo || 'Outros').trim();
      if (t.toLowerCase() === 'consumidor.gov') t = 'Consumidor.Gov';
      countMap[t] = (countMap[t] || 0) + 1;
    });

    const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
    this.charts.tipo.data.labels = sorted.map(i => i[0]);
    this.charts.tipo.data.datasets[0].data = sorted.map(i => i[1]);
    this.charts.tipo.update();
  }

  updateSlaChart(records) {
    if (!this.charts.sla) return;
    let noPrazo = 0, foraPrazo = 0, emAbertoOk = 0, emAbertoVenc = 0;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    records.forEach(r => {
      const prazoDate = r.prazo ? new Date(r.prazo + 'T00:00:00') : null;
      const respDate = r.data_resposta_mp ? new Date(r.data_resposta_mp + 'T00:00:00') : null;
      const s = (r.status || '').trim();

      if (s === 'Concluido' || s === 'Concluído' || s === 'Redirecionado') {
        if (respDate && prazoDate && !isNaN(prazoDate) && !isNaN(respDate)) {
          if (respDate <= prazoDate) noPrazo++;
          else foraPrazo++;
        } else {
          noPrazo++;
        }
      } else {
        if (prazoDate && !isNaN(prazoDate) && prazoDate < hoje) {
          emAbertoVenc++;
        } else {
          emAbertoOk++;
        }
      }
    });

    this.charts.sla.data.datasets[0].data = [noPrazo, foraPrazo, emAbertoOk, emAbertoVenc];
    this.charts.sla.update();
  }

  updateResponsavelChart(records) {
    if (!this.charts.responsavel) return;
    const respMap = {};

    records.forEach(r => {
      let resp = (r.responsavel || 'Não Informado').trim();
      if (!resp || resp === '-' || resp === '_') resp = 'Não Informado';
      if (!respMap[resp]) {
        respMap[resp] = { concluidos: 0, analise: 0, redirecionado: 0, total: 0 };
      }
      respMap[resp].total++;
      const s = (r.status || '').trim();
      if (s === 'Concluido' || s === 'Concluído') respMap[resp].concluidos++;
      else if (s === 'Em Analise' || s === 'Em Análise') respMap[resp].analise++;
      else if (s === 'Redirecionado') respMap[resp].redirecionado++;
    });

    const topResps = Object.entries(respMap)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6);

    this.charts.responsavel.data.labels = topResps.map(i => i[0]);
    this.charts.responsavel.data.datasets[0].data = topResps.map(i => i[1].concluidos);
    this.charts.responsavel.data.datasets[1].data = topResps.map(i => i[1].analise);
    this.charts.responsavel.data.datasets[2].data = topResps.map(i => i[1].redirecionado);
    this.charts.responsavel.update();
  }

  updateCategoriaChart(records) {
    if (!this.charts.categoria) return;
    const catMap = {};
    records.forEach(r => {
      const c = (r.categoria || 'Sem Categoria').trim();
      if (c && c !== '-' && c !== '_') {
        catMap[c] = (catMap[c] || 0) + 1;
      }
    });

    const topCats = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    this.charts.categoria.data.labels = topCats.map(i => i[0]);
    this.charts.categoria.data.datasets[0].data = topCats.map(i => i[1]);
    this.charts.categoria.update();
  }

  updateTimelineChart(records) {
    if (!this.charts.timeline) return;
    const monthMap = {};

    records.forEach(r => {
      if (r.data_recebida && r.data_recebida.length >= 7) {
        const ym = r.data_recebida.substring(0, 7); // 'AAAA-MM'
        monthMap[ym] = (monthMap[ym] || 0) + 1;
      }
    });

    const sortedMonths = Object.keys(monthMap).sort().slice(-8); // Ultimos 8 meses
    const labels = sortedMonths.map(ym => {
      const [ano, mes] = ym.split('-');
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${meses[parseInt(mes, 10) - 1] || mes}/${ano.substring(2)}`;
    });

    this.charts.timeline.data.labels = labels;
    this.charts.timeline.data.datasets[0].data = sortedMonths.map(k => monthMap[k]);
    this.charts.timeline.update();
  }
}

// Exporta instancia global
window.chartsManager = new ChartsManager();
