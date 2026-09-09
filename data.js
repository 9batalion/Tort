import {demoSteps} from './demo-steps.js';
const ingredient=(id,name,pack,unit,price,allergens='')=>({id,name,pack,unit,price,allergens,loss:0,stock:0,supplier:'Cena przykładowa — wpisz własną'});
const base={shape:'round',diameter:20,width:20,length:30,height:12,layers:2};
const row=(ingredientId,qty,unit,group,mode)=>({ingredientId,qty,unit,group,mode});
export function initialState(){const state={version:1,sales:[],ingredients:[ingredient('flour','Mąka pszenna',1,'kg',5.2,'pszenica (gluten)'),ingredient('sugar','Cukier drobny',1,'kg',5.9),ingredient('egg','Jaja',10,'szt',12.5,'jaja'),ingredient('cream','Śmietanka 36%',500,'ml',9.9,'mleko'),ingredient('mascarpone','Mascarpone',250,'g',8.5,'mleko'),ingredient('raspberry','Maliny',500,'g',17.9),ingredient('butter','Masło 82%',200,'g',8.9,'mleko'),ingredient('white','Biała czekolada',100,'g',7.9,'mleko, soja'),ingredient('cocoa','Kakao',100,'g',8.9),ingredient('dark','Czekolada deserowa',100,'g',7.5,'soja; sprawdź mleko na etykiecie'),ingredient('vanilla','Ekstrakt waniliowy',50,'ml',19.9),ingredient('topper','Topper',1,'szt',12)],recipes:[{id:'raspberry-cake',name:'Wanilia & malina',base:{...base},notes:'Receptura demonstracyjna, niezweryfikowana wypiekiem. Biszkopt: ubij jaja z cukrem, delikatnie połącz z mąką. Krem: schłodzona śmietanka i mascarpone. Maliny przygotuj jako osobną warstwę. Tynk z masła i białej czekolady. Temperaturę i czas ustal na podstawie własnej sprawdzonej receptury. Wysokość bazowa oznacza cały złożony tort, nie wysokość rantu.',rows:[row('egg',6,'szt','Biszkopt','volume'),row('sugar',180,'g','Biszkopt','volume'),row('flour',180,'g','Biszkopt','volume'),row('vanilla',5,'ml','Biszkopt','volume'),row('cream',500,'ml','Krem','filling'),row('mascarpone',500,'g','Krem','filling'),row('sugar',60,'g','Krem','filling'),row('raspberry',350,'g','Owoce','filling'),row('butter',250,'g','Tynk','coating'),row('white',200,'g','Tynk','coating')]},{id:'chocolate-cake',name:'Podwójna czekolada',base:{...base},notes:'Receptura demonstracyjna do zastąpienia własnym sprawdzonym przepisem. Składniki podzielono na biszkopt, krem i tynk. Zmiana wielkości formy wymaga kontroli wypieku; nie skaluj automatycznie czasu pieczenia.',rows:[row('egg',6,'szt','Biszkopt','volume'),row('sugar',180,'g','Biszkopt','volume'),row('flour',140,'g','Biszkopt','volume'),row('cocoa',40,'g','Biszkopt','volume'),row('cream',600,'ml','Krem','filling'),row('dark',350,'g','Krem','filling'),row('mascarpone',250,'g','Krem','filling'),row('butter',250,'g','Tynk','coating'),row('dark',200,'g','Tynk','coating')]}],order:{name:'Tort urodzinowy',tiers:[{...base,recipeId:'raspberry-cake',diameter:24}],count:1,reserve:5,hours:3,rate:35,packaging:15,decoration:20,delivery:0,energyKwh:2,energyPrice:1.2,overhead:12,margin:30,roundTo:5,portionVolume:180,sale:null},quotes:[]};for(const recipe of state.recipes)recipe.steps=demoSteps(recipe.id);return state;}

// Converts only the untouched demonstration egg entry from releases <= 1.1.
// User-created and edited ingredients are never guessed or converted.
export function migrateState(state){
  let changed=false;
  if(!Array.isArray(state.sales)){state.sales=[];changed=true;}
  const egg=state.ingredients?.find(i=>i.id==='egg');
  const eggRows=(state.recipes??[]).flatMap(r=>r.rows??[]).filter(r=>r.ingredientId==='egg');
  const untouched=egg&&egg.name==='Jaja — masa bez skorupki'&&egg.pack===500&&egg.unit==='g'&&egg.price===12.5&&egg.loss===0&&egg.stock===0&&eggRows.length>0&&eggRows.every(r=>r.qty===300&&r.unit==='g');
  if(untouched){egg.name='Jaja';egg.pack=10;egg.unit='szt';for(const row of eggRows){row.qty=6;row.unit='szt';}changed=true;}
  const seeds=initialState().recipes;
  for(const recipe of state.recipes??[]){
    if(recipe.steps!==undefined)continue;
    const seed=seeds.find(r=>r.id===recipe.id);
    if(seed&&recipe.name===seed.name&&recipe.notes===seed.notes&&JSON.stringify(recipe.rows)===JSON.stringify(seed.rows)){
      recipe.steps=demoSteps(recipe.id);changed=true;
    }
  }
  return {state,changed};
}
