import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import ts from 'typescript';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('..',import.meta.url)));
// The upstream browser bundle embeds its encoder in a Blob worker. MV3 uses
// the identical worker as a packaged file instead; no Blob/eval permission.
const upstream=await readFile('node_modules/@mediabunny/aac-encoder/dist/bundles/mediabunny-aac-encoder.mjs','utf8');
const source=ts.createSourceFile('encoder.mjs',upstream,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const factory=source.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text==='Worker2');
const loader=source.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text==='inlineWorker');
const literal=factory?.body?.statements.find(ts.isReturnStatement)?.expression?.arguments?.[0];
if(!factory||!loader||!literal||!ts.isNoSubstitutionTemplateLiteral(literal))throw new Error('Pinned AAC worker structure changed');
await mkdir('packages/media-core/.generated',{recursive:true});
await rm('apps/extension/public/engines/aac-worker.js',{force:true});
await writeFile('packages/media-core/.generated/aac-worker.js',`/* @mediabunny/aac-encoder 1.65.0: MPL-2.0 wrapper; FFmpeg AAC LGPL-2.1-or-later. See licenses. */\n${literal.text}\n`);
let adapted=upstream;
for(const [start,end,replacement]of [[factory.getStart(source),factory.end,"function Worker2() { return new Worker(new URL('./aac-worker.js', import.meta.url), { type: 'module' }); }"],[loader.getStart(source),loader.end,'']].sort((a,b)=>b[0]-a[0]))adapted=adapted.slice(0,start)+replacement+adapted.slice(end);
await writeFile('packages/media-core/.generated/aac-encoder.mjs',adapted);
await writeFile('packages/media-core/.generated/aac-encoder.d.mts','export function registerAacEncoder(): void;\n');
console.log('Pinned AAC encoder prepared as a local MV3 worker; no runtime code fetch or Blob worker.');
