'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname,'..');
const port = 18761;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));

async function ready(){
  for(let i=0;i<100;i++){
    try { if((await fetch(base)).ok)return; } catch {}
    if(server.exitCode!==null)throw Error('CIVITAS 서버가 시작되지 않았습니다.');
    await sleep(50);
  }
  throw Error('CIVITAS 서버 응답 시간 초과');
}

async function main(){
  let browser;
  try{
    await ready();
    const html = await (await fetch(base)).text();
    assert.match(html,/<title>CIVITAS/);
    assert.doesNotMatch(html,/free-village|프리빌리지/i);
    const script = await fetch(base+'/game.js');
    assert.equal(script.status,200);
    browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
    const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base);
    await page.getByRole('heading',{name:'곡물 값이 하룻밤 새 두 배가 됐다'}).waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'390px 화면 가로 넘침 없음');
    await page.locator('[data-district="market"]').click();
    await page.getByRole('button',{name:/남은 돈으로 공동 솥을 연다/}).click();
    await page.getByRole('heading',{name:'세입자 한 가족이 거리로 쫓겨날 처지다'}).waitFor();
    await page.reload();
    await page.getByRole('heading',{name:'세입자 한 가족이 거리로 쫓겨날 처지다'}).waitFor();

    const runPath = async(goal,choices,expected)=>{
      await page.evaluate(()=>localStorage.removeItem('civitas-save-v1'));
      await page.reload();
      if(goal!=='civic'){
        await page.locator('.mobile-nav [data-tab="ambition"]').click();
        await page.locator(`[data-goal="${goal}"]`).click();
        await page.locator('.mobile-nav [data-tab="city"]').click();
      }
      for(const index of choices)await page.locator(`[data-choice="${index}"]`).click();
      await page.locator('.result h2').waitFor();
      assert.equal((await page.locator('.result h2').textContent()).trim(),expected,`${goal} 경로 결말`);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${goal} 결말 화면 가로 넘침 없음`);
    };
    await runPath('civic',[0,0,0,0,0,0],'주민 대표');
    await runPath('crown',[1,1,1,1,1,1],'왕');
    await runPath('shadow',[2,2,2,2,2,2],'정보국 책임자');
    assert.deepEqual(errors,[]);
    console.log('독립 실행·모바일 레이아웃·저장 복원·주민 대표/왕/정보국 책임자 결말 통과');
  }finally{
    await browser?.close();
    if(server.exitCode===null){server.kill('SIGTERM');await new Promise(resolve=>server.once('exit',resolve));}
  }
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
