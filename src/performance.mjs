// Opt-in diagnostic UI. Counts actual render submissions; gl.finish in this mode
// also waits for GPU completion. The blocking diagnostic never runs normally.
export function createRenderDiagnostics(renderer,camera,invalidate){
 if(!new URLSearchParams(location.search).has('diagnostics'))return {beforeFrame(){},afterFrame(){},active:()=>false};
 const box=document.createElement('section');box.className='render-diagnostics';box.innerHTML='<button>Run 6-second motion check</button><output aria-live="polite">Ready · GPU completion measured during check</output>';document.body.appendChild(box);
 const output=box.querySelector('output');let run=null,count=0;
 box.querySelector('button').onclick=()=>{if(run)return;run={start:performance.now(),previous:null,intervals:[],cpu:[],original:camera.position.clone(),frames:0};box.querySelector('button').disabled=true;invalidate();};
 const percentile=(a,p)=>a.sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*p))]||0;
 setInterval(()=>{if(!run){box.dataset.totalRenders=String(count);}},1000);
 return {active:()=>Boolean(run),beforeFrame(now){if(!run)return;const t=(now-run.start)/1000;camera.position.copy(run.original).applyAxisAngle({x:0,y:1,z:0},Math.sin(t)*.3);camera.position.setLength(run.original.length()*(1-.12*Math.sin(t*1.8)));},afterFrame(now,cpuStart){count++;if(!run)return;renderer.getContext().finish();const end=performance.now();run.frames++;run.cpu.push(end-cpuStart);if(run.previous!==null)run.intervals.push(end-run.previous);run.previous=end;if(end-run.start<6000){output.textContent=`Measuring orbit + zoom… ${run.frames} completed renders`;invalidate();return;}const duration=(end-run.start)/1000;output.textContent=`${(run.frames/duration).toFixed(1)} completed fps · frame p95 ${percentile(run.intervals,.95).toFixed(1)} ms · CPU+GPU p95 ${percentile(run.cpu,.95).toFixed(1)} ms · ${run.frames} renders / ${duration.toFixed(2)} s`;camera.position.copy(run.original);run=null;box.querySelector('button').disabled=false;invalidate();}};
}
