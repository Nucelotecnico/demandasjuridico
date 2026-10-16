# CEMIG - Controle Geral de Demandas Institucionais

Aplicação web desenvolvida para a **CEMIG (Companhia Energética de Minas Gerais)**, inspirada na identidade visual oficial do portal institucional ([www.cemig.com.br](https://www.cemig.com.br)), com controle de acesso por autenticação (login e senha), níveis de permissão baseados em papéis (**RBAC: Administrador vs Operador/Analista**), painel de gráficos e indicadores em tempo real, operando **100% conectada ao banco de dados Supabase** (armazenamento local de dados desativado).

---

## 1. Identidade Visual e Layout CEMIG

A interface adota a linguagem de design corporativa da CEMIG:
- **Verde Institucional CEMIG**: `#008542` e tom escuro `#005A2B`.
- **Laranja Energia (Acentos e Ações Rápidas)**: `#FF6A00` e `#E65100`.
- **Fundos Suaves e Cards Limpos**: `#F4F7F5` com cards brancos de alto contraste e bordas sutis.
- **Top Bar Institucional**: Identificação do portal, data do sistema em tempo real e perfil ativo.

---

## 2. Sistema de Autenticação e Perfis de Acesso (RBAC no Supabase)

O sistema possui tela de autenticação obrigatória ao iniciar. O processo de login e verificação de credenciais é executado diretamente na tabela `usuarios_vanessa` do Supabase.

### Perfis de Usuário:

1. **Administrador (`admin`)**:
   - Visualização integral de todos os painéis, gráficos e indicadores em tempo real.
   - Listagem geral, busca, filtros e exportação de relatórios.
   - Cadastro e edição de demandas institucionais diretamente no Supabase.
   - **Exclusivo**: Acesso à aba **Gestão de Usuários** para cadastrar novos colaboradores no Supabase, definir senhas, atribuir perfis e ativar/desativar contas.
   - **Exclusivo**: Acesso à aba **Conexão com o Supabase** para gerenciar credenciais de conexão e backup.

2. **Operador / Analista (`operador`)**:
   - Visualização integral de todos os índices, gráficos e painéis em tempo real.
   - Acesso à listagem e pesquisa de demandas.
   - Cadastro de novas demandas e edição de demandas existentes no Supabase.
   - **Restrição**: As abas de **Gestão de Usuários** e **Conexão com o Supabase** ficam ocultas e bloqueadas por validação no sistema.

---

## 3. Contas de Acesso Pré-Configuradas no Supabase

Contas padrão cadastradas na tabela `usuarios_vanessa`:

| Nome do Colaborador | E-mail / Login | Senha | Perfil | Permissões |
|---|---|---|---|---|
| Administrador Geral Cemig | `admin@cemig.com.br` | `admin123` | Administrador (`admin`) | Acesso total: gráficos, demandas e cadastrar novos usuários no Supabase |
| Vanessa Oliveira | `analista@cemig.com.br` | `analista123` | Operador (`operador`) | Visualizar gráficos, métricas e editar demandas no Supabase |
| Rodolfo Silva | `rodolfo@cemig.com.br` | `rodolfo123` | Operador (`operador`) | Visualizar gráficos, métricas e editar demandas no Supabase |

---

## 4. Mapeamento das 17 Colunas da Planilha Original

Todas as colunas extraídas do arquivo Excel fornecido estão integradas à tabela `demandas_vanessa`:
1. `data_recebida`: Data Recebida (obrigatório)
2. `prazo`: Prazo Limite (obrigatório)
3. `tipo`: Tipo de Demanda (Ofício, Procon, Parlamentar, etc.)
4. `numero_oficio`: Número do Ofício / Protocolo (obrigatório)
5. `promotoria`: Promotoria / Órgão Demandante
6. `municipio_referido`: Município Referido
7. `categoria`: Categoria (Orçamento, Análise de Carga, Informativo, etc.)
8. `subcategoria`: Subcategoria (PFC, Parcelamento Irregular Solo, etc.)
9. `responsabilidade_outra_gerencia`: Resp. Outra Gerência? (Sim / Não / Aguardando)
10. `reincidente`: Reincidente? (Sim / Não)
11. `dado_em_comum_eo`: Dado em Comum (EO / Código NS / Inquérito)
12. `requerimento`: Requerimento e histórico detalhado
13. `responsavel`: Responsável Técnico (Vanessa, Rodolfo, Agata, Ruan, etc.)
14. `status`: Status Atual (Em Análise, Concluído, Redirecionado)
15. `data_validacao`: Data de Validação interna
16. `numero_gdoc`: Número GDOC
17. `data_resposta_mp`: Data Resposta formal enviada

---

## 5. Estrutura dos Arquivos da Aplicação

```text
/
├── index.html              # Interface do usuário com tela de login, abas e modais
├── styles.css              # Identidade visual CEMIG (verde #008542, laranja, cards e tabelas)
├── storage.js              # Camada de persistência 100% Supabase (demandas_vanessa e usuarios_vanessa)
├── auth.js                 # Módulo de autenticação e RBAC integrado à tabela usuarios_vanessa
├── app.js                  # Controlador central, regras de negócio, tabela, filtros e SLA
├── charts.js               # Gerenciador dos gráficos em tempo real e cálculo de KPIs (Chart.js)
├── initialData.js          # Base de demonstração pré-carregada para importação sob demanda
├── demandas_completo.json  # Exportação completa de todos os 744 registros da planilha
└── README.md               # Manual técnico e documentação
```

---

## 6. Tabelas do Supabase em Produção

A aplicação se comunica exclusivamente com as seguintes tabelas no projeto Supabase:

1. **`public.demandas_vanessa`**:
   - Armazena todas as 17 colunas das demandas institucionais, histórico, datas de resposta e status.
   - Atualizada em tempo real nas ações de criar, editar, excluir ou importar demandas.

2. **`public.usuarios_vanessa`**:
   - Armazena os usuários, credenciais (`senha_hash`), perfis de acesso (`admin` vs `operador`), status (`ativo`) e datas de criação.
   - Atualizada em tempo real pelo painel de Gestão de Usuários (criação, alternância de status ativo/inativo e exclusão).

---

## 7. Como Executar e Utilizar

1. Abra o arquivo `index.html` em qualquer navegador web moderno.
2. Na tela de login, caso seja o primeiro acesso ou esteja em um novo dispositivo, clique em **Configurar Conexão Supabase** para inserir a Project URL e a Anon Public Key.
3. Clique em **Entrar como Administrador** ou digite suas credenciais.
4. Para cadastrar um novo usuário:
   - Acesse a aba **Gestão de Usuários**.
   - Preencha o nome, e-mail corporativo, senha, perfil (`Administrador` ou `Operador`) e setor.
   - Clique em **Cadastrar Usuário**. O registro será salvo imediatamente na tabela `usuarios_vanessa` do Supabase e listado na tabela.
5. Para cadastrar uma nova demanda:
   - Acesse a aba **Cadastro de Demanda**.
   - Preencha os campos e salve. Os dados serão gravados na tabela `demandas_vanessa` do Supabase e atualizarão todos os gráficos e KPIs instantaneamente.
