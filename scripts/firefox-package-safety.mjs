import{posix}from'node:path';
import ts from'typescript';

// A conservative gate for common string-execution forms and packaged module
// references. This complements Mozilla's linter, not a general JS security proof.
// Analysis fails closed beyond 1M AST visits, 250k resolutions or 64 alias links.
const executable=/\.(?:[cm]?js)$/i;
const globals=new Set(['globalThis','window','self']);
const forbidden=new Set(['eval','Function']);
const unwrap=node=>{while(node&&ts.isParenthesizedExpression(node))node=node.expression;return node;};

export function assertFirefoxPackageSafety(files){
 const decoder=new TextDecoder(),manifest=JSON.parse(decoder.decode(files['manifest.json']));
 if(Object.hasOwn(manifest.browser_specific_settings??{},'gecko_android'))throw Error('Firefox package must remain desktop-only');
 const csp=manifest.content_security_policy;
 for(const policy of typeof csp==='string'?[csp]:Object.values(csp??{}))if(typeof policy==='string'&&policy.toLowerCase().split(/[\s;]+/).includes("'unsafe-eval'"))throw Error('JavaScript unsafe-eval CSP is forbidden');

 for(const[file,bytes]of Object.entries(files)){
  if(!executable.test(file))continue;
  if(posix.isAbsolute(file)||file.startsWith('../')||file.includes('\\')||posix.normalize(file)!==file)throw Error(`Invalid packaged module path: ${file}`);
  const source=ts.createSourceFile(file,decoder.decode(bytes),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  if(source.parseDiagnostics.length)throw Error(`Cannot parse packaged JavaScript: ${file}`);
  const scopes=new Map();let visits=0,resolutions=0;
  const resolveStep=()=>{if(++resolutions>250000)throw Error(`Package safety resolution budget exceeded: ${file}`);};
  const each=(node,visit)=>{if(++visits>1000000)throw Error(`Package safety AST budget exceeded: ${file}`);visit(node);ts.forEachChild(node,child=>each(child,visit));};
  function scope(node,hoisted=false){while(node&&!ts.isSourceFile(node)&&!ts.isFunctionLike(node)&&(hoisted||!ts.isBlock(node)&&!ts.isCatchClause(node)))node=node.parent;return node??source;}
  function bind(owner,name,value){const names=scopes.get(owner)??new Map(),entries=names.get(name)??[];entries.push(value);names.set(name,entries);scopes.set(owner,names);}
  function lookup(node){for(let owner=node.parent;owner;owner=owner.parent){const entries=scopes.get(owner)?.get(node.text);if(entries)return entries;}}
  // Retain all simple assignments conservatively: a later safe assignment
  // must not hide an earlier call through an eval/Function alias.
  each(source,node=>{
   if(ts.isVariableDeclaration(node)){
    const hoisted=ts.isVariableDeclarationList(node.parent)&&!(node.parent.flags&ts.NodeFlags.BlockScoped),owner=scope(node.parent,hoisted);
    if(ts.isIdentifier(node.name))bind(owner,node.name.text,node.initializer);
    else if(node.initializer&&ts.isObjectBindingPattern(node.name))for(const element of node.name.elements)if(ts.isIdentifier(element.name)&&!element.dotDotDotToken){
     const key=element.propertyName??element.name;
     const property=ts.isIdentifier(key)?ts.factory.createStringLiteral(key.text):ts.isComputedPropertyName(key)?key.expression:key;
     bind(owner,element.name.text,ts.factory.createElementAccessExpression(node.initializer,property));
    }
   }
   if(ts.isParameter(node)&&ts.isIdentifier(node.name))bind(scope(node.parent),node.name.text,node.initializer);
   if((ts.isFunctionDeclaration(node)||ts.isClassDeclaration(node))&&node.name)bind(scope(node.parent),node.name.text,node);
  });
  each(source,node=>{if(ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.EqualsToken&&ts.isIdentifier(node.left)){const entries=lookup(node.left);if(entries)entries.push(node.right);else bind(source,node.left.text,node.right);}});
  function aliases(node,seen,read){
   const entries=lookup(node);if(!entries||seen.has(entries))return[];
   if(seen.size>=64)throw Error(`Package safety alias depth exceeded: ${file}`);
   const next=new Set(seen);next.add(entries);return entries.flatMap(value=>read(value,next));
  }
  function strings(value,seen=new Set()){
   resolveStep();
   const node=unwrap(value);if(!node)return[];
   if(ts.isStringLiteralLike(node))return[node.text];
   if(ts.isIdentifier(node))return aliases(node,seen,strings);
   if(ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.PlusToken)return strings(node.left,seen).flatMap(left=>strings(node.right,seen).map(right=>left+right)).slice(0,16);
   return[];
  }
  function member(value){
   const node=unwrap(value);
   if(ts.isPropertyAccessExpression(node))return{base:node.expression,names:[node.name.text]};
   if(ts.isElementAccessExpression(node))return{base:node.expression,names:strings(node.argumentExpression)};
  }
  function globalObject(value,seen=new Set()){
   resolveStep();
   const node=unwrap(value);if(!node)return false;
   if(node.kind===ts.SyntaxKind.ThisKeyword)return true;
   if(ts.isIdentifier(node))return!lookup(node)&&globals.has(node.text)||aliases(node,seen,(value,next)=>[globalObject(value,next)]).some(Boolean);
   const part=member(node);return!!part&&part.names.some(name=>globals.has(name))&&globalObject(part.base,seen);
  }
  function functionValue(value,seen=new Set()){
   resolveStep();
   const node=unwrap(value);if(!node)return false;
   if(ts.isFunctionExpression(node)||ts.isArrowFunction(node)||ts.isFunctionDeclaration(node)||ts.isClassExpression(node)||ts.isClassDeclaration(node))return true;
   if(ts.isIdentifier(node))return!lookup(node)&&forbidden.has(node.text)||aliases(node,seen,(value,next)=>[functionValue(value,next)]).some(Boolean);
   const part=member(node);return!!part&&(part.names.includes('constructor')||part.names.includes('prototype')&&dangerous(part.base,seen));
  }
  function dangerous(value,seen=new Set()){
   resolveStep();
   const node=unwrap(value);if(!node)return false;
   if(ts.isIdentifier(node))return!lookup(node)&&forbidden.has(node.text)||aliases(node,seen,(value,next)=>[dangerous(value,next)]).some(Boolean);
   if(ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.CommaToken)return dangerous(node.right,seen);
   const part=member(node);
   if(part)return part.names.some(name=>forbidden.has(name)&&globalObject(part.base,seen)||['call','apply','bind'].includes(name)&&dangerous(part.base,seen)||name==='constructor'&&functionValue(part.base,seen));
   if(ts.isCallExpression(node)){const called=member(node.expression);return!!called&&called.names.includes('bind')&&dangerous(called.base,seen);}
   return false;
  }
  function packagedModule(value){
   const node=unwrap(value);
   if(!node||!ts.isStringLiteralLike(node))throw Error(`Nonconstant module reference: ${file}`);
   const specifier=node.text;
   if(!/^(?:\.\/|\.\.\/)/.test(specifier)||/[\\%?#\0]/.test(specifier))throw Error(`Unsafe module reference: ${file}`);
   const target=posix.normalize(posix.join(posix.dirname(file),specifier));
   if(target.startsWith('../')||posix.isAbsolute(target)||!executable.test(target)||!Object.hasOwn(files,target))throw Error(`Unresolved packaged module reference: ${file}`);
  }
  each(source,node=>{
   if(ts.isImportDeclaration(node)||ts.isExportDeclaration(node)){if(node.moduleSpecifier)packagedModule(node.moduleSpecifier);return;}
   if(!ts.isCallExpression(node)&&!ts.isNewExpression(node))return;
   if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword){packagedModule(node.arguments[0]);return;}
   const part=member(node.expression);
   const reflected=part&&ts.isIdentifier(unwrap(part.base))&&unwrap(part.base).text==='Reflect'&&part.names.some(name=>['apply','construct'].includes(name))&&dangerous(node.arguments?.[0]);
   if(dangerous(node.expression)||reflected)throw Error(`Dynamic JavaScript execution in ${file} at ${node.getStart(source)}`);
  });
 }
}
