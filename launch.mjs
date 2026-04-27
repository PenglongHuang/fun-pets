import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Clear the problematic env var
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

// Spawn electron-vite dev
const child = spawn(
  'npx',
  ['electron-vite', 'dev'],
  {
    cwd: __dirname,
    env,
    stdio: 'inherit',
    shell: true
  }
);

child.on('exit', (code) => process.exit(code || 0));
