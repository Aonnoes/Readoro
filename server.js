/** Minimal zero-dependency local development server (ES module compatible). */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, relative, isAbsolute } from 'node:path';

const ROOT=resolve('.');
const CONTENT={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8',
  '.png':'image/png','.csv':'text/csv; charset=utf-8'};
const port=Number(process.env.PORT || 3000);
createServer(async (req,res)=>{
  try {
    const path=new URL(req.url,'http://localhost').pathname;
    const file=resolve(ROOT,'.'+(path==='/'?'/web/index.html':decodeURIComponent(path)));
    const rel=relative(ROOT,file);
    if(rel.startsWith('..')||isAbsolute(rel)|| !['/web/','/simulation/','/results/'].some(p=>path.startsWith(p)) && path!=='/'){
      res.writeHead(403);res.end('Forbidden');return;
    }
    if(!CONTENT[extname(file)]){res.writeHead(415);res.end('Unsupported');return;}
    const s=await stat(file);
    if(!s.isFile())throw new Error('Not a file');
    const bytes=await readFile(file);
    res.writeHead(200,{'Content-Type':CONTENT[extname(file)],'Cache-Control':'no-cache'});
    res.end(bytes);
  } catch(e){res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
}).listen(port,()=>console.log(`Readoro Simulation Lab: http://localhost:${port}`));
