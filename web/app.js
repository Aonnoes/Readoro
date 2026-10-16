import { runExperiment, runSensitivity } from '../simulation/experiment.js';
import { buildFigures, fixed, interval, toCsv, trialCsvRows, summaryCsvRows, sensitivityCsvRows, paperReport } from '../simulation/reporting.js';

const $=s=>document.querySelector(s);
const escapeHtml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function settings(){const n=id=>Number($('#'+id).value);return {
  trials:n('trials'),learners:n('learners'),activitiesPerLearner:n('activities'),seed:n('seed'),
  fixedDifficulty:$('#fixedDifficulty').value,learningRate:n('learningRate'),
  slope:n('slope'),initialAbilityMean:n('initialAbilityMean'),initialAbilitySd:n('initialAbilitySd'),
};}
function download(filename,text,type='text/plain'){
  const url=URL.createObjectURL(new Blob([text],{type}));
  const link=document.createElement('a');link.href=url;link.download=filename;
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function downloads(exp,sens,figs){
  const fileMap={
    'Paper results (MD)':['paper-results.md',paperReport(exp,sens)],
    'Trial outcomes (CSV)':['trials.csv',toCsv(trialCsvRows(exp))],
    'Summary (CSV)':['summary.csv',toCsv(summaryCsvRows(exp))],
    'Sensitivity (CSV)':['sensitivity.csv',toCsv(sensitivityCsvRows(sens))],
    'Learner records (CSV)':['learner-records.csv',toCsv(exp.learners)],
    'Experiment (JSON)':['experiment.json',JSON.stringify({config:exp.config,trialResults:exp.trialResults,summary:exp.summary},null,2)],
    'Sensitivity (JSON)':['sensitivity.json',JSON.stringify(sens,null,2)],
    ...Object.fromEntries(Object.entries(figs).map(([name,text])=>[name,[name,text]])),
  };
  const root=$('#download-buttons');root.replaceChildren();
  Object.entries(fileMap).forEach(([label,[name,data]])=>{
    const b=document.createElement('button');b.className='download-btn';b.textContent=label;
    b.type='button';b.addEventListener('click',()=>download(name,data,name.endsWith('.svg')?'image/svg+xml':name.endsWith('.csv')?'text/csv':'text/plain'));
    root.appendChild(b);
  });
}
function table(head,rows){return `<div class="table-scroll"><table><thead><tr>${head.map(x=>`<th>${escapeHtml(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${escapeHtml(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function render(exp,sens){
  const summary=exp.summary,c=summary.comparison,figs=buildFigures(exp,sens);
  const comparison=[['Baseline','baseline',1],['Final assessment','final',1],['Assessment gain','gain',1],['Practice accuracy','practice',1],['Mean ability change','ability',3],['Level advancement','advancement',1]];
  const sensitivity=[sens.base,...sens.cases].map(r=>[r.name,fixed(r.fixed.mean),fixed(r.adaptive.mean),interval(r.difference),`${r.adaptiveWins}/${r.trials}`]);
  const skills=Object.entries(summary.bySkill).map(([skill,v])=>[skill,fixed(v.baseline.fixed.mean),fixed(v.final.fixed.mean),fixed(v.final.adaptive.mean),fixed(v.abilityChange.fixed.mean,3),fixed(v.abilityChange.adaptive.mean,3)]);
  const comparisonRows=comparison.map(([label,key,digits])=>[label,interval(c[key].fixed,digits),interval(c[key].adaptive,digits),interval(c[key].difference,digits)]);
  const view=$('#results');
  view.innerHTML=`<div class="result-header"><div><h2>Simulation outcomes</h2><span>${exp.config.trials} paired trials · ${exp.config.learners} learners per trial · seeds ${exp.config.seed}–${exp.config.seed+exp.config.trials-1}</span></div><span class="pill">Simulation complete</span></div>
    <div class="metric-grid"><div class="panel metric fixed"><div class="caption">FINAL · FIXED</div><div class="number">${fixed(c.final.fixed.mean)}%</div><div class="sub">95% CI ${fixed(c.final.fixed.low)}–${fixed(c.final.fixed.high)}%</div></div>
    <div class="panel metric adaptive"><div class="caption">FINAL · ADAPTIVE</div><div class="number">${fixed(c.final.adaptive.mean)}%</div><div class="sub">95% CI ${fixed(c.final.adaptive.low)}–${fixed(c.final.adaptive.high)}%</div></div>
    <div class="panel metric difference"><div class="caption">ADAPTIVE − FIXED</div><div class="number">${c.final.difference.mean>0?'+':''}${fixed(c.final.difference.mean)}</div><div class="sub">Percentage points · Adaptive won <strong>${summary.adaptiveWins}/${exp.config.trials}</strong> trials</div></div></div>
    <section class="panel content-panel"><h3>Scenario comparison</h3><p class="lead">Mean [95% CI] across trials. Difference CIs are computed from paired trial differences.</p>${table(['Metric','Fixed','Adaptive','Difference B−A'],comparisonRows)}</section>
    <section class="panel visual-panel">${figs['figure-4-7.svg']}</section>
    <section class="panel visual-panel">${figs['figure-4-5.svg']}</section>
    <section class="panel content-panel"><h3>Comprehension skill outcomes</h3><p class="lead">Mean performance at baseline and final assessments, plus the simulated ability change.</p>${table(['Skill','Baseline %','Final fixed %','Final adaptive %','Ability Δ fixed','Ability Δ adaptive'],skills)}</section>
    <section class="panel visual-panel">${figs['figure-4-6.svg']}</section>
    <section class="panel content-panel"><h3>One-at-a-time sensitivity</h3><p class="lead">All other parameters and the seed sequence are kept constant for each experiment.</p>${table(['Parameter','Fixed %','Adaptive %','Difference [95% CI]','Adaptive wins'],sensitivity)}</section>
    <section class="panel visual-panel">${figs['figure-4-8.svg']}</section>
    <section class="panel notes"><strong>Interpretation boundary</strong><p>The score difference reflects the assumed response model and learning rule. Easier practice produces more correct responses and therefore more modeled ability gains. These results do not establish a real educational effect.</p></section>`;
  downloads(exp,sens,figs);
}
// Navigation changes the displayed view without changing the DOM order or
// jumping to an anchor. Repeated clicks keep the sidebar in the same position.
const viewNames = {lab:'Simulation Lab', parameters:'Parameters', results:'Results', exports:'Exports'};
function showView(requested, updateHash = false) {
  const view = Object.hasOwn(viewNames, requested) ? requested : 'lab';
  $('.workspace').dataset.view = view;
  $('#current-view-name').textContent = viewNames[view];
  document.querySelectorAll('.sidebar-nav .sidebar-link').forEach(link => {
    const active = link.dataset.view === view;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (updateHash && location.hash !== `#${view}`) {
    history.replaceState(null, '', `#${view}`);
  }
  window.scrollTo(0, 0);
}
document.querySelectorAll('.sidebar-brand[data-view], .sidebar-nav .sidebar-link[data-view]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    showView(link.dataset.view, true);
  });
});
window.addEventListener('hashchange', () => showView(location.hash.slice(1)));
showView(location.hash.slice(1));

$('#settings').addEventListener('submit',event=>{
  event.preventDefault();
  const button=$('#run');const status=$('#status');button.disabled=true;status.textContent='Running paired trials and sensitivity experiments…';
  // Yield first so the busy state renders before the synchronous simulation work.
  requestAnimationFrame(()=>setTimeout(()=>{
    try {const config=settings();const exp=runExperiment(config,{includeLearners:true});const sens=runSensitivity(config);
      render(exp,sens);status.textContent=`Completed ${config.trials} trials, ${sens.cases.length} sensitivity cases. Outputs are ready to export.`;showView('results',true);
    } catch(err){status.textContent=`Error: ${err.message}`;console.error(err);}
    finally {button.disabled=false;}
  },20));
});
