import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';

const read = name => readFileSync(new URL('../'+name, import.meta.url),'utf8');
const html=read('index.html');
const script=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
new Function(script); // Full browser JavaScript syntax.
for(const file of ['api/youtube.js','api/gemini.js']) {
  execFileSync(process.execPath,['--check',new URL('../'+file,import.meta.url).pathname]);
}
assert(!/AIza[0-9A-Za-z_-]{20,}/.test(html),'A Google API key was embedded in HTML');
assert(!/getGemKey|buildFallbackRecs|radarScores/.test(html),'Obsolete fake scoring or frontend key code remains');
assert(html.includes('id="cmpOverlay"'),'Compare dialog markup is required');
assert(html.includes('id="cmpRadar1"')&&html.includes('id="cmpRadar2"'),'Compare chart canvases required');
assert(html.includes("fetch('/api/gemini'"),'Gemini must use the server endpoint');
assert(html.includes("const YT = '/api/youtube'"),'YouTube must use the server endpoint');

const cats=script.slice(script.indexOf('const CAT_LABEL ='),script.indexOf('// ── App State ──'));
const analytics=script.slice(script.indexOf('function numberOrNull('),script.indexOf('/* ════════════════════════════════\n   MAIN DATA BUILDER'));
const funcs=vm.runInNewContext(cats+'\n'+analytics+'\n;({numberOrNull,calcAvgEngagement,buildMonthlyChart,detectNiche,buildSampleMetrics,buildContentMix,buildContentInsights})');
assert.equal(funcs.numberOrNull(undefined),null);
assert.equal(funcs.numberOrNull(''),null);
assert.equal(funcs.numberOrNull('100'),100);
const missing=[{snippet:{categoryId:'10',publishedAt:new Date().toISOString(),title:'Music'},statistics:{viewCount:'100'}}];
assert.equal(funcs.calcAvgEngagement(missing),null,'Missing likes cannot become zero likes');
assert.equal(funcs.buildMonthlyChart(missing).engagementData.filter(v=>v!==null).length,0);
assert.equal(funcs.buildSampleMetrics(missing).rateSampleCount,0);
assert.equal(funcs.detectNiche([]).confidence,null,'Unknown category cannot be a fake percentage');
const measured=[{snippet:{categoryId:'10',publishedAt:new Date().toISOString(),title:'Video'},statistics:{viewCount:'100',likeCount:'5',commentCount:'2'}}];
assert.equal(funcs.calcAvgEngagement(measured),5);
assert.equal(funcs.detectNiche(measured).confidence,100,'Category share must equal observed fraction');
assert.equal(funcs.buildContentMix(measured).Music,1);
assert.equal(funcs.buildSampleMetrics(measured).avgLikes,5);
assert(funcs.buildContentInsights([])[0].summary.includes('No recent'),'No fake pattern on empty channels');
console.log('TubeIQ checks passed: frontend/backend syntax, server API isolation, UI markup, and factual metric edge cases.');
