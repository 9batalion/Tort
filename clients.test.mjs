import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,migrateState,blankOrder} from './data.js';
import {validateClient,validateState} from './engine.js';

const client=()=>({id:'c1',name:'Anna Kowalska',phone:'500600700',email:'anna@example.com',address:'Wrocław',preferences:'Maliny i jasne dekoracje',notes:'Kontakt SMS',createdAt:'2026-09-14T12:00:00Z',updatedAt:'2026-09-14T12:00:00Z'});
const sale=()=>({id:'s1',number:'ZT-2026-0001',clientId:'c1',title:'Tort urodzinowy',customer:'Anna Kowalska',phone:'500600700',email:'anna@example.com',dueDate:'2026-09-20',dueTime:'14:00',status:'confirmed',fulfillment:'pickup',address:'',occasion:'Urodziny',portions:16,flavor:'Malina',inscription:'',colors:'',description:'',allergies:'',notes:'',price:300,deposit:100,paid:0,photos:[],quote:null,createdAt:'2026-09-14T12:00:00Z',updatedAt:'2026-09-14T12:00:00Z'});

test('Client records validate and can be linked to orders',()=>{const s=initialState();s.clients=[client()];s.sales=[sale()];assert.equal(validateState(s),s);});
test('Order cannot point to a missing client',()=>{const s=initialState();s.sales=[sale()];assert.throws(()=>validateState(s),/nieistniejącego klienta/);});
test('Legacy backup receives empty client list and nullable client links',()=>{const s=initialState();delete s.clients;s.sales=[{...sale()}];delete s.sales[0].clientId;const migrated=migrateState(s);assert.deepEqual(migrated.state.clients,[]);assert.equal(migrated.state.sales[0].clientId,null);assert.equal(migrated.changed,true);});
test('Client validation rejects missing names and oversized notes',()=>{const c=client();c.name='';assert.throws(()=>validateClient(c));const c2=client();c2.notes='x'.repeat(12001);assert.throws(()=>validateClient(c2));});
test('Blank calculator starts fresh without touching recipe definitions',()=>{const s=initialState();const before=structuredClone(s.recipes);const order=blankOrder(s.recipes);assert.equal(order.name,'Nowy tort');assert.equal(order.count,1);assert.equal(order.reserve,0);assert.equal(order.hours,0);assert.equal(order.rate,0);assert.equal(order.sale,null);assert.equal(order.tiers.length,1);assert.equal(order.tiers[0].recipeId,s.recipes[0].id);assert.deepEqual(s.recipes,before);});
