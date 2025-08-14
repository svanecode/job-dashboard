#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Generate unique build ID
const buildId = `v0.2.0-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

console.log(`🚀 Generating cache buster build ID: ${buildId}`);

// Create .env.local with build ID and preserve existing env vars
const envPath = path.join(process.cwd(), '.env.local');
const backupEnvPath = path.join(process.cwd(), '.env.local.backup');

// Read existing env vars from backup
let existingEnvVars = '';
if (fs.existsSync(backupEnvPath)) {
  existingEnvVars = fs.readFileSync(backupEnvPath, 'utf8');
}

// Add OpenAI API key if not present
if (!existingEnvVars.includes('OPENAI_API_KEY')) {
  existingEnvVars += '\nOPENAI_API_KEY=sk-dummy-key-for-build-only';
}

const envContent = `${existingEnvVars}

# Cache Buster Build ID
NEXT_PUBLIC_BUILD_ID=${buildId}
NEXT_PUBLIC_BUILD_TIME=${new Date().toISOString()}
NEXT_PUBLIC_CACHE_VERSION=${buildId}

# Force cache refresh
NEXT_PUBLIC_FORCE_REFRESH=true
`;

fs.writeFileSync(envPath, envContent);

console.log(`✅ Created .env.local with build ID: ${buildId}`);

// Update package.json version
const packagePath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Extract version and add build suffix
const version = packageJson.version;
const buildVersion = `${version}-${Date.now()}`;

packageJson.version = buildVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

console.log(`✅ Updated package.json version to: ${buildVersion}`);

// Create build info file
const buildInfo = {
  buildId,
  buildTime: new Date().toISOString(),
  version: buildVersion,
  timestamp: Date.now(),
  cacheBuster: true
};

const buildInfoPath = path.join(process.cwd(), 'public', 'build-info.json');
fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

console.log(`✅ Created build-info.json: ${buildInfoPath}`);

console.log('\n🎯 Cache buster setup complete!');
console.log(`📦 Build ID: ${buildId}`);
console.log(`⏰ Build Time: ${new Date().toISOString()}`);
console.log('\n💡 Next steps:');
console.log('1. Run: npm run build');
console.log('2. Deploy to Vercel');
console.log('3. All users will get fresh cache!'); 