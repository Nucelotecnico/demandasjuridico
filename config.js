/**
 * Arquivo de Configuracao do Supabase - CEMIG
 *
 * As credenciais de conexao sao definidas diretamente neste arquivo.
 * Ao publicar este projeto no GitHub, mantenha este arquivo no .gitignore
 * para que sua URL e Anon Public Key nao fiquem expostas publicamente.
 */

window.ENV_CONFIG = {
  // Preencha com a URL do seu projeto Supabase (ex: "https://xyzcompany.supabase.co")
  SUPABASE_URL: 'https://hxojarsvdrzcshffdziv.supabase.co',

  // Preencha com a sua chave publica anonima (anon public key) do Supabase
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4b2phcnN2ZHJ6Y3NoZmZkeml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMTExOTEsImV4cCI6MjEwNzY4NzE5MX0.yNoawWmqksb0QV3F1MmySfUYPyFbvdprSko4SHpS57g',

  // Nomes padrao das tabelas utilizadas pela aplicacao
  TABLE_DEMANDAS: 'demandas_vanessa',
  TABLE_USUARIOS: 'usuarios_vanessa'
};
