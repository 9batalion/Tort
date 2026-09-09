import {calculate} from './engine.js';
export function recipeSteps(recipe){
  if(recipe.steps?.length)return recipe.steps;
  return [{title:'Przygotuj według zapisanej instrukcji',groups:[...new Set(recipe.rows.map(r=>r.group))],text:recipe.notes.trim()||'Brak instrukcji przygotowania. Otwórz edycję receptury i zapisz kolejne kroki.',minutes:null,temperature:null}];
}
export function cookingPlan(snapshot){
  const result=calculate(snapshot.ingredients,snapshot.recipes,snapshot.order);
  const steps=[];
  snapshot.order.tiers.forEach((tier,index)=>{
    const recipe=snapshot.recipes.find(r=>r.id===tier.recipeId),rows=result.rows.filter(r=>r.tier===index+1).map(({ingredientId,name,group,net,unit,tier})=>({ingredientId,name,group,net,unit,tier}));
    steps.push({title:'Odmierz składniki',text:'Przygotuj osobne naczynia dla poszczególnych sekcji. Ilości poniżej są już przeliczone dla tego piętra i całej zamówionej liczby tortów. Nie dodawaj ponownie zapasu.',minutes:null,temperature:null,rows,tier:index+1,recipe:recipe.name,kind:'preparation'});
    for(const step of recipeSteps(recipe))steps.push({...step,text:step.text.replace(/\{(przelozenia|blaty|forma|wysokosc|liczba_tortow)\}/g,(_,key)=>({przelozenia:tier.layers,blaty:tier.layers+1,forma:tier.shape==='round'?('Ø '+tier.diameter+' cm'):(tier.width+' × '+tier.length+' cm'),wysokosc:tier.height,liczba_tortow:snapshot.order.count})[key]),rows:rows.filter(r=>step.groups.includes(r.group)),tier:index+1,recipe:recipe.name,kind:'instruction'});
    const unlinked=[...new Set(rows.map(r=>r.group))].filter(group=>!recipeSteps(recipe).some(step=>step.groups.includes(group)));
    if(unlinked.length)steps.push({title:'Sprawdź pozostałe składniki',text:'Te sekcje nie zostały przypisane do żadnej instrukcji: '+unlinked.join(', ')+'. Uzupełnij kroki receptury przed użyciem tych składników.',minutes:null,temperature:null,rows:rows.filter(r=>unlinked.includes(r.group)),tier:index+1,recipe:recipe.name,kind:'missing'});
  });
  const dimensions=snapshot.order.tiers.map(t=>t.shape==='round'?`Ø ${t.diameter} cm, wys. ${t.height} cm`:`${t.width} × ${t.length} cm, wys. ${t.height} cm`);
  return {name:snapshot.order.name||'Twój tort',count:snapshot.order.count,dimensions,steps};
}
export function createCookingUI(api){
  const dialog=document.querySelector('#cooking-dialog');let plan=null,signature='',done=[],current=0,busy=false;
  const esc=api.esc;
  function ingredients(rows){return rows.length?`<div class="cook-ingredients">${rows.map(r=>`<div><span>${esc(r.name)}<small>${esc(r.group)}</small></span><strong>${api.fmt(r.net,r.unit==='szt'?0:2)} ${r.unit}</strong></div>`).join('')}</div>`:'<p class="help">Ten krok nie wymaga dodania kolejnych składników.</p>';}
  function paint(){const step=plan.steps[current],finished=done.filter(Boolean).length;
    dialog.innerHTML=`<div class="cardheader"><div><span class="muted">${esc(plan.name)} · ${plan.count} ${plan.count===1?'tort':'tortów'}</span><h2>Zrób krok po kroku</h2></div><button class="icon" data-cook="close" aria-label="Zamknij">×</button></div><div class="body"><div class="cook-progress"><span>Ukończono ${finished} z ${plan.steps.length} kroków</span><button class="small" data-cook="reset">Zacznij od początku</button></div><progress max="${plan.steps.length}" value="${finished}" aria-label="Postęp przygotowania"></progress>${finished===plan.steps.length?'<div class="note spaced"><strong>Wszystkie kroki odhaczone.</strong> Tort jest przygotowany według zapisanej listy.</div>':''}<div class="cook-layout spaced"><nav class="cook-nav" aria-label="Etapy przygotowania">${plan.steps.map((s,i)=>`<button data-cook="go" data-index="${i}" class="${current===i?'active':''}" ${current===i?'aria-current="step"':''}><span>${done[i]?'✓':i+1}</span><span>${esc(s.title)}<small>Piętro ${s.tier}</small></span></button>`).join('')}</nav><section><span class="pill">Krok ${current+1} · piętro ${step.tier} · ${esc(plan.dimensions[step.tier-1])}</span><h1 class="cook-title">${esc(step.title)}</h1><p class="help">${esc(step.recipe)} · Czasy i temperatury są zapisane w przepisie, nie skalujemy ich wraz z rozmiarem formy.</p><div class="actions">${step.minutes!==null?`<span class="pill">Czas zapisany: ${api.fmt(step.minutes)} min</span>`:''}${step.temperature!==null?`<span class="pill">Temperatura: ${api.fmt(step.temperature)}°C</span>`:''}</div><p class="cook-text">${esc(step.text)}</p>${step.kind==='missing'?'<div class="note warn">Instrukcja wymaga uzupełnienia w edytorze receptury.</div>':''}<h3 class="spaced">Składniki na tym etapie</h3>${ingredients(step.rows)}<p class="help">Ilości dla tego piętra we wszystkich ${plan.count} tortach. Jeśli ta sama sekcja występuje w kilku krokach, tabela przypomina jej łączną ilość — nie odmierzaj jej ponownie. Instrukcja określa moment dodania.</p><details><summary>Cała receptura i wszystkie kroki</summary>${plan.steps.filter(s=>s.tier===step.tier).map(s=>`<h3 class="spaced">${esc(s.title)}</h3><p class="prewrap">${esc(s.text)}</p>${s.minutes!==null||s.temperature!==null?`<p class="help">${s.minutes!==null?api.fmt(s.minutes)+' min':''} ${s.temperature!==null?api.fmt(s.temperature)+'°C':''}</p>`:''}`).join('')}</details></section></div><div id="cook-error" role="alert"></div></div><footer><button data-cook="previous" ${current===0?'disabled':''}>Wstecz</button><button data-cook="toggle">${done[current]?'Cofnij odhaczenie':'Odhacz wykonany'}</button><button class="primary" data-cook="next">${done[current]?(current===plan.steps.length-1?'Zakończ':'Następny krok'):'Gotowe — dalej'}</button></footer>`;
  }
  async function persist(){const next=structuredClone(api.getState());next.cookingProgress={signature,done:[...done],current};await api.commit(next);}
  async function open(snapshot){const nextPlan=cookingPlan(snapshot),key=JSON.stringify(nextPlan),saved=api.getState().cookingProgress;
    if(saved&&saved.signature!==key&&saved.done.some(Boolean)&&!window.confirm('Ten tort ma inny rozmiar lub przepis. Rozpocząć nową listę kroków zamiast poprzedniego postępu?'))return;
    plan=nextPlan;signature=key;done=saved?.signature===key&&saved.done.length===plan.steps.length?[...saved.done]:plan.steps.map(()=>false);current=saved?.signature===key?Math.min(saved.current,plan.steps.length-1):0;paint();if(!dialog.open)dialog.showModal();
  }
  dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
  dialog.addEventListener('click',async e=>{const button=e.target.closest('[data-cook]');if(!button||busy)return;const action=button.dataset.cook;
    if(action==='close'){dialog.close();return;}
    const prev={done:[...done],current};let closeAfter=false;
    if(action==='go')current=Number(button.dataset.index);
    else if(action==='previous')current=Math.max(0,current-1);
    else if(action==='toggle')done[current]=!done[current];
    else if(action==='next'){done[current]=true;if(current<plan.steps.length-1)current++;else closeAfter=true;}
    else if(action==='reset'){if(!window.confirm('Wyzerować odhaczone kroki tego tortu?'))return;done=plan.steps.map(()=>false);current=0;}
    else return;
    busy=true;dialog.querySelectorAll('button').forEach(b=>b.disabled=true);
    try{await persist();paint();if(closeAfter)dialog.close();}catch(err){done=prev.done;current=prev.current;paint();dialog.querySelector('#cook-error').textContent='Nie zapisano postępu: '+err.message;}finally{busy=false;}
  });
  return {open};
}
