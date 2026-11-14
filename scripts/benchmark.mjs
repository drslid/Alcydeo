import { spawnSync } from 'node:child_process';
const result = spawnSync('pnpm',['exec','tsx','scripts/benchmark.ts'],{stdio:'inherit',shell:process.platform==='win32'});
process.exitCode=result.status??1;
