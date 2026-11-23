'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Math.max(1, Number(process.argv[process.argv.indexOf('--port') + 1]) || Number(process.env.PORT) || 8080);
const routes = new Map([
  ['/',['index.html','text/html; charset=utf-8']],
  ['/job-stories.js',['job-stories.js','text/javascript; charset=utf-8']],
  ['/careers.js',['careers.js','text/javascript; charset=utf-8']],
  ['/institutions.js',['institutions.js','text/javascript; charset=utf-8']],
  ['/agencies.js',['agencies.js','text/javascript; charset=utf-8']],
  ['/random-events.js',['random-events.js','text/javascript; charset=utf-8']],
  ['/underworld.js',['underworld.js','text/javascript; charset=utf-8']],
  ['/politics.js',['politics.js','text/javascript; charset=utf-8']],
  ['/work-incidents.js',['work-incidents.js','text/javascript; charset=utf-8']],
  ['/work-agreements.js',['work-agreements.js','text/javascript; charset=utf-8']],
  ['/work-projects.js',['work-projects.js','text/javascript; charset=utf-8']],
  ['/career-echoes.js',['career-echoes.js','text/javascript; charset=utf-8']],
  ['/chronicles.js',['chronicles.js','text/javascript; charset=utf-8']],
  ['/society.js',['society.js','text/javascript; charset=utf-8']],
  ['/succession.js',['succession.js','text/javascript; charset=utf-8']],
  ['/family.js',['family.js','text/javascript; charset=utf-8']],
  ['/life.js',['life.js','text/javascript; charset=utf-8']],
  ['/council.js',['council.js','text/javascript; charset=utf-8']],
  ['/pacts.js',['pacts.js','text/javascript; charset=utf-8']],
  ['/parties.js',['parties.js','text/javascript; charset=utf-8']],
  ['/starts.js',['starts.js','text/javascript; charset=utf-8']],
  ['/campaign.js',['campaign.js','text/javascript; charset=utf-8']],
  ['/game.js',['game.js','text/javascript; charset=utf-8']],
  ['/style.css',['style.css','text/css; charset=utf-8']],
]);
for (const scene of ['opening-farm', 'opening-clerk', 'opening-factory', 'opening-police', 'storm-safe', 'storm-partial', 'storm-flood', 'election-win', 'election-loss', 'hearing']) {
  routes.set(`/assets/events/${scene}.webp`, [`assets/events/${scene}.webp`, 'image/webp']);
}
http.createServer((req,res)=>{
  const url = new URL(req.url,'http://localhost');
  if (url.pathname === '/healthz') {
    res.writeHead(200, {'content-type':'application/json'});
    res.end(JSON.stringify({status:'ok', game:'civitas'}));
    return;
  }
  const route = routes.get(url.pathname);
  if(req.method!=='GET'||!route){res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});res.end('Not found');return;}
  const [file,type] = route;
  const body = fs.readFileSync(path.join(root,file));
  res.writeHead(200,{'content-type':type,'content-length':body.length,'cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(body);
}).listen(port,'0.0.0.0',()=>console.log(`CIVITAS가 ${port} 포트에서 실행 중`));
