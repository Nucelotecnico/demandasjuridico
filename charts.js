/**
 * Modulo de Graficos e Insights em Tempo Real: ChartsManager
 * Gerencia instancias do Chart.js e calculo dinâmico de metricas e KPIs.
 */

class ChartsManager {
  constructor() {
    this.charts = {};
    this.colorPalette = {
      primary: '#2563eb',
      success: '#16a34a',
      warning: '#ca8a04',
      danger: '#dc2626',
      info: '#0284c7',
      purple: '#7c3aed',
      pink: '#db2777',
      teal: '#0d9488',
      orange: '#ea580c',
      gray: '#64748b'
    };
  }

  // Inicializacao dos graficos
  init() {
    this.initStatusChart();
    this.initTipoChart();
    this.initSlaChart();
    this.initResponsavelChart();
    this.initCategoriaChart();
    this.initTimelineChart();
  }

  // Grafico 1: Status
  initStatusChart() {
    const ctx = document.getElementById('chartStatus');
    if (!ctx) return;
    this.charts.status = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Concluído', 'Em Análise', 'Redirecionado'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: ['#16a34a', '#ca8a04', '#0284c7'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
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
        cutout: '65%'
      }
    });
  }

  // Grafico 2: Tipos de Demanda
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
          x: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { precision: 0 } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }

  // Grafico 3: Cumprimento de Prazo (SLA)
  initSlaChart() {
    const ctx = document.getElementById('chartSla');
    if (!ctx) return;
    this.charts.sla = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['No Prazo', 'Fora do Prazo', 'Em Aberto (Dentro)', 'Em Aberto (Atrasado)'],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: ['#16a34a', '#dc2626', '#3b82f6', '#f97316'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
        }
      }
    });
  }

  // Grafico 4: Demandas por Responsavel
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
            borderRadius: 3
          },
          {
            label: 'Em Análise',
            data: [],
            backgroundColor: '#ca8a04',
            borderRadius: 3
          },
          {
            label: 'Redirecionado',
            data: [],
            backgroundColor: '#0284c7',
            borderRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }
        },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  // Grafico 5: Top Categorias
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
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  // Grafico 6: Evolucao Temporal Mensal
  initTimelineChart() {
    const ctx = document.getElementById('chartTimeline');
    if (!ctx) return;
    this.charts.timeline = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Novas Demandas Recebidas',
          data: [],
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#2563eb',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12 } }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  // Metodo principal de atualizacao chamado em tempo real a cada novo cadastro ou filtro
  updateAll(records) {
    if (!records || !Array.isArray(records)) return;

    this.updateInsightsAndCards(records);
    this.updateStatusChart(records);
    this.updateTipoChart(records);
    this.updateSlaChart(records);
    this.updateResponsavelChart(records);
    this.updateCategoriaChart(records);
    this.updateTimelineChart(records);
  }

  // Calculo de métricas principais e KPIs
  updateInsightsAndCards(records) {
    const total = records.length;
    let concluidas = 0;
    let emAnalise = 0;
    let redirecionadas = 0;

    let noPrazoConcluidas = 0;
    let foraPrazoConcluidas = 0;
    let emAbertoAtrasadas = 0;
    let somaTempoAtendimentoDias = 0;
    let qtdCalculoTempo = 0;

    const responsaveisCount = {};
    const categoriasCount = {};
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    records.forEach(r => {
      const status = (r.status || '').trim();
      if (status === 'Concluido' || status === 'Concluído') concluidas++;
      else if (status === 'Em Analise' || status === 'Em Análise') emAnalise++;
      else if (status === 'Redirecionado') redirecionadas++;

      // Contagem de responsavel
      const resp = (r.responsavel || 'Não Informado').trim();
      if (resp && resp !== '-' && resp !== '_') {
        responsaveisCount[resp] = (responsaveisCount[resp] || 0) + 1;
      }

      // Contagem de categoria
      const cat = (r.categoria || 'Não Especificada').trim();
      if (cat && cat !== '-' && cat !== '_') {
        categoriasCount[cat] = (categoriasCount[cat] || 0) + 1;
      }

      // SLA e tempos
      const prazoDate = r.prazo ? new Date(r.prazo + 'T00:00:00') : null;
      const respDate = r.data_resposta_mp ? new Date(r.data_resposta_mp + 'T00:00:00') : null;
      const recDate = r.data_recebida ? new Date(r.data_recebida + 'T00:00:00') : null;

      if (respDate && prazoDate && !isNaN(prazoDate) && !isNaN(respDate)) {
        if (respDate <= prazoDate) {
          noPrazoConcluidas++;
        } else {
          foraPrazoConcluidas++;
        }
      }

      if (recDate && respDate && !isNaN(recDate) && !isNaN(respDate)) {
        const diffMs = respDate - recDate;
        const diffDias = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        somaTempoAtendimentoDias += diffDias;
        qtdCalculoTempo++;
      }

      if (status === 'Em Analise' || status === 'Em Análise') {
        if (prazoDate && !isNaN(prazoDate) && prazoDate < hoje) {
          emAbertoAtrasadas++;
        }
      }
    });

    const totalAvaliadasSla = noPrazoConcluidas + foraPrazoConcluidas;
    const taxaSla = totalAvaliadasSla > 0 ? ((noPrazoConcluidas / totalAvaliadasSla) * 100).toFixed(1) : '100.0';
    const mediaDias = qtdCalculoTempo > 0 ? (somaTempoAtendimentoDias / qtdCalculoTempo).toFixed(1) : '0';

    // Responsavel destaque
    let topResp = 'N/A';
    let topRespCount = 0;
    Object.entries(responsaveisCount).forEach(([k, v]) => {
      if (v > topRespCount) {
        topRespCount = v;
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

    // Atualiza elementos no DOM com protecao
    this.setTextSafe('metricTotal', total);
    this.setTextSafe('metricEmAnalise', emAnalise);
    this.setTextSafe('metricConcluidas', concluidas);
    this.setTextSafe('metricTaxaSla', `${taxaSla}%`);
    this.setTextSafe('metricMediaDias', `${mediaDias} d`);
    this.setTextSafe('metricAtrasadas', emAbertoAtrasadas);
    this.setTextSafe('metricTopResp', `${topResp} (${topRespCount})`);
    this.setTextSafe('metricTopCat', `${topCat} (${topCatCount})`);
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
