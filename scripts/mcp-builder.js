#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// =========== CARGA VARIABLES DE ENTORNO ============
process.loadEnvFile() // default as '.env' in cwd
// Actualizar Node.js si es necesario para usar loadEnvFile()
const { MCP_CATALOG_FILE, MCP_FILE, AI_COMMAND_PATH } = process.env;
// Validar variables de entorno
if (!MCP_CATALOG_FILE || !MCP_FILE || !AI_COMMAND_PATH) {
  console.error('❌ Faltan variables de entorno necesarias en .env: MCP_CATALOG_FILE, MCP_FILE, AI_COMMAND_PATH');
  process.exit(1);
}

// ============ CONFIGURACIÓN ============
const mcpCatalogFile = path.join(process.cwd(), MCP_CATALOG_FILE);
const mcpFile = path.join(process.cwd(), MCP_FILE);
const aiCommandPath = AI_COMMAND_PATH;
const codeAgentName = path.basename(aiCommandPath)

// Perfiles predefinidos (refinados según tus sugerencias)
const PROFILES = {
  backend: ['supabase', 'context7'],
  frontend: ['playwright', 'context7'],
  report: ['github', 'atlassian', 'slack'],
  docs: ['notion', 'context7', 'tavity'],
  uitest: ['playwright', 'devtools', 'context7'],
  apitest: ['postman', 'context7'], // Add @ivotoby/openapi-mcp-server MCP when project has openapi.json
  dbtest: ['supabase', 'context7'], // or use @bytebase/dbhub for SQL testing alternative.
  e2etest: ['playwright', 'postman', 'supabase', 'context7'],
  full: null  // Se llena dinámicamente con TODOS
};

// ============ FUNCIONES ============

function loadCatalog() {
  if (!fs.existsSync(mcpCatalogFile)) {
    console.error(`❌ No encontré ${mcpCatalogFile}`);
    console.error('💡 Crea el archivo con tus MCPs disponibles');
    process.exit(1);
  }
  
  try {
    const content = fs.readFileSync(mcpCatalogFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error al leer ${mcpCatalogFile}:`, error.message);
    process.exit(1);
  }
}

function parseArgs(catalog) {
  const args = process.argv.slice(2);
  
  // Caso sin argumentos = mostrar info pero continuar
  if (args.length === 0) {
    console.log('⚠️ No se especificaron MCPs. Generando .mcp.json vacío.');
    return [];
  }
  
  const input = args[0];
  
  // Caso especial: full = todos los MCPs
  if (input === 'full') {
    return Object.keys(catalog.mcpServers);
  }
  
  // ¿Es un perfil predefinido?
  if (PROFILES[input]) {
    return PROFILES[input];
  }
  
  // ¿Es lista de MCPs separados por coma?
  const mcps = input.split(',').map(m => m.trim());
  
  // Validar que TODOS existen
  const invalid = mcps.filter(m => !catalog.mcpServers[m]);
  if (invalid.length > 0) {
    console.error('❌ MCPs inválidos:', invalid.join(', '));
    console.log('\n🔧 MCPs disponibles:', Object.keys(catalog).join(', '));
    process.exit(1);
  }
  
  return mcps;
}

function generateMcpJson(selectedMcps, catalog) {
  const mcpServers = {};

  // Si no hay MCPs seleccionados, generar vacío
  if (selectedMcps.length === 0) {
    fs.writeFileSync(mcpFile, JSON.stringify({ mcpServers: {} }, null, 2), 'utf8');
    console.log(`✅ ${MCP_FILE} generado (vacío)`);
    return;
  }
  
  // Construir objeto mcpServers con solo los seleccionados
  selectedMcps.forEach(name => {
    mcpServers[name] = catalog.mcpServers[name];
  });
  
  const config = { mcpServers };
  
  // Escribir nuevo .mcp.json
  fs.writeFileSync(mcpFile, JSON.stringify(config, null, 2), 'utf8');
  console.log(`✅ ${MCP_FILE} generado`);
  console.log(`📊 MCPs activos: ${selectedMcps.join(', ')}`);
  console.log(`📈 Total: ${selectedMcps.length} MCPs`);
}

function startCodeAgentCLI() {
  console.log(`\n🚀 Iniciando ${codeAgentName}...\n`);
  console.log('─'.repeat(50));
  
  const codeAgent = spawn(aiCommandPath, [], {
    stdio: 'inherit',
    shell: true
  });
  
  codeAgent.on('error', (err) => {
    console.error(`\n❌ Error al iniciar ${codeAgentName}:`, err.message);
    process.exit(1);
  });
}

// ============ MAIN ============
function main() {
  console.log(`🔧 MCP Builder\n`);
  
  const catalog = loadCatalog();
  const selectedMcps = parseArgs(catalog);
  
  generateMcpJson(selectedMcps, catalog);
  startCodeAgentCLI();
}

try {
  main();
} catch (error) {
  console.error('❌ Error inesperado:', error.message);
  process.exit(1);
}