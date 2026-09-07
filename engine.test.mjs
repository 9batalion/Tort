import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,migrateState} from './data.js';
import {geometry,scale,convert,calculate,validateState} from './engine.js';
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
const base={shape:'round',diameter:20,width:20,length:30,height:10,layers:2};
function fixture(){const s=initialState();s.ingredients=[{id:'one',name:'Mąka',pack:1,unit:'kg',price:10,loss:0,stock:0,allergens:'pszenica',supplier:''}];s.recipes=[{id:'r',name:'Test',base,notes:'',rows:[{ingredientId:'one',qty:100,unit:'g',mode:'volume',group:'Ciasto'}]}];s.order={...s.order,tiers:[{...base,recipeId:'r'}],count:1,reserve:0,hours:0,rate:0,packaging:0,decoration:0,delivery:0,energyKwh:0,energyPrice:0,overhead:0,margin:0,roundTo:.01,sale:null,portionVolume:100};return s;}
const calc=s=>calculate(s.ingredients,s.recipes,s.order);
test('Round area and volume use radius, not diameter',()=>{near(geometry(base).area,Math.PI*100);near(geometry(base).volume,Math.PI*1000);});
test('Diameter 20 to 24 at same height: 1.44',()=>near(scale('volume',base,{...base,diameter:24}),1.44));
test('Round to rectangular, changed height',()=>near(scale('volume',base,{...base,shape:'rect',width:20,length:30,height:15}),9000/(1000*Math.PI)));
test('Cream scales by area and filling layers, not overall height again',()=>near(scale('filling',base,{...base,diameter:24,height:20,layers:3}),2.16));
test('Coating uses top plus sides without underside',()=>near(scale('coating',base,{...base,diameter:30,height:20}),(225*Math.PI+600*Math.PI)/(100*Math.PI+200*Math.PI)));
test('Perimeter and fixed decorations have independent scaling',()=>{near(scale('perimeter',base,{...base,diameter:30}),1.5);near(scale('fixed',base,{...base,diameter:30}),1);});
test('Mass and volume units convert only within dimension',()=>{near(convert(1,'kg','g'),1000);near(convert(250,'ml','l'),.25);assert.throws(()=>convert(100,'g','ml'));});
test('Loss uses gross-up and reserve is applied once',()=>{const s=fixture();s.ingredients[0].loss=10;s.order.reserve=10;const r=calc(s);near(r.rows[0].net,110);near(r.rows[0].gross,110/.9);near(r.total,110/.9/1000*10);});
test('Shopping aggregates before rounding packages, inventory reduces purchase not cost',()=>{const s=fixture();s.recipes[0].rows[0].qty=600;s.order.tiers.push({...base,recipeId:'r'});s.ingredients[0].stock=.5;const r=calc(s);near(r.total,12);assert.equal(r.shopping.length,1);assert.equal(r.shopping[0].packs,1);near(r.shopping[0].missing,700);near(r.shopping[0].leftover,300);near(r.shoppingCost,10);});
test('Exact package quantity has no spurious additional package',()=>{const s=fixture();s.recipes[0].rows[0].qty=1000;assert.equal(calc(s).shopping[0].packs,1);});
test('Margin 30 percent is cost / 0.7, not markup',()=>{const s=fixture();s.order.overhead=69;s.order.margin=30;const r=calc(s);near(r.total,70);near(r.suggested,100);near(r.profit,30);near(r.actualMargin,30);});
test('Multiple cakes multiply time/materials, delivery applies once',()=>{const s=fixture();s.order.count=3;s.order.hours=2;s.order.rate=10;s.order.packaging=5;s.order.energyKwh=2;s.order.energyPrice=1;s.order.decoration=3;s.order.overhead=4;s.order.delivery=15;const r=calc(s);near(r.costs.ingredients,3);near(r.costs.labor,60);near(r.costs.packaging,15);near(r.costs.delivery,15);near(r.total,120);});
test('Manual price zero and loss-making price are respected',()=>{const s=fixture();s.order.sale=0;const r=calc(s);near(r.sale,0);near(r.profit,-1);assert.equal(r.actualMargin,null);});
test('Price rounds upward to selected increment',()=>{const s=fixture();s.order.overhead=101;s.order.roundTo=5;near(calc(s).suggested,105);});
test('Portion size does not affect recipe cost',()=>{const s=fixture(),a=calc(s);s.order.portionVolume=200;const b=calc(s);near(a.total,b.total);assert.ok(a.portions>b.portions);});
test('Snapshots retain old ingredient prices',()=>{const s=fixture();const snapshot=structuredClone(s);s.quotes.push({id:'q',name:'Test',date:new Date().toISOString(),snapshot});s.ingredients[0].price=30;near(calc(s).total,3);near(calc(s.quotes[0].snapshot).total,1);validateState(s);});
test('Reject zero dimensions, fractional layers, unknown ingredients and invalid margins',()=>{for(const mutate of [s=>s.order.tiers[0].diameter=0,s=>s.order.tiers[0].layers=1.5,s=>s.order.margin=100,s=>s.recipes[0].rows[0].ingredientId='missing',s=>s.ingredients[0].pack=0,s=>s.order.count=1.2,s=>s.order.hours=NaN]){const s=fixture();mutate(s);assert.throws(()=>calc(s));}});
test('Backup validation rejects duplicate ids and incompatible units',()=>{const s=fixture();s.ingredients.push({...s.ingredients[0]});assert.throws(()=>validateState(s));const t=fixture();t.recipes[0].rows[0].unit='ml';assert.throws(()=>validateState(t));});
test('Demonstration data are valid and calculable',()=>{const s=initialState();validateState(s);const r=calc(s);assert.ok(r.sale>r.total);assert.ok(r.shoppingCost>0);assert.ok(r.portions>0);});

test('Piece ingredients round upward and fixed pieces ignore reserve',()=>{
  const s=fixture();
  s.ingredients[0]={...s.ingredients[0],unit:'szt',pack:10,stock:0};
  s.recipes[0].rows=[{ingredientId:'one',qty:3,unit:'szt',mode:'volume',group:'Ciasto'}];
  s.order.tiers[0].diameter=21;s.order.reserve=50;
  const scaled=calc(s);
  assert.equal(scaled.rows[0].net,4);assert.equal(scaled.rows[0].gross,4);assert.equal(scaled.shopping[0].gross,4);
  s.recipes[0].rows[0].qty=1;s.recipes[0].rows[0].mode='fixed';
  const fixed=calc(s);assert.equal(fixed.rows[0].net,1);
});
test('Piece packages, stock and base recipes require whole numbers',()=>{
  for(const mutate of [s=>s.ingredients[0].pack=10.5,s=>s.ingredients[0].stock=.5,s=>s.recipes[0].rows[0].qty=1.5]){
    const s=fixture();s.ingredients[0]={...s.ingredients[0],unit:'szt',pack:10,stock:0};s.recipes[0].rows=[{ingredientId:'one',qty:2,unit:'szt',mode:'volume',group:'Ciasto'}];mutate(s);assert.throws(()=>calc(s),/całkowit/);
  }
});
test('Fresh demonstration recipes use eggs in pieces',()=>{
  const s=initialState(),egg=s.ingredients.find(i=>i.id==='egg');assert.equal(egg.unit,'szt');assert.equal(egg.pack,10);
  for(const r of s.recipes){const row=r.rows.find(x=>x.ingredientId==='egg');assert.equal(row.unit,'szt');assert.equal(row.qty,6);}
});
test('Untouched legacy demonstration eggs migrate once, custom eggs stay unchanged',()=>{
  const s=initialState(),egg=s.ingredients.find(i=>i.id==='egg');egg.name='Jaja — masa bez skorupki';egg.unit='g';egg.pack=500;for(const r of s.recipes){const row=r.rows.find(x=>x.ingredientId==='egg');row.qty=300;row.unit='g';}
  const first=migrateState(s);assert.equal(first.changed,true);assert.equal(egg.unit,'szt');assert.equal(egg.pack,10);assert.equal(migrateState(s).changed,false);
  const custom=initialState();custom.ingredients.find(i=>i.id==='egg').price=20;assert.equal(migrateState(custom).changed,false);
});
