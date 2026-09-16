import assert from 'node:assert/strict';
import test from 'node:test';
import {designIdentity,normalizeName} from '../lib/personalization.ts';
const design={name:'Alex',font:'Modern',textColor:'#eee8dc',style:'Minimal Name'};
test('normalizes name whitespace and bounds printed length',()=>{assert.equal(normalizeName('  Alex   Morgan  '),'Alex Morgan');assert.equal(normalizeName('12345678901234567890').length,18)});
test('same artwork selections merge despite insignificant whitespace',()=>{assert.equal(designIdentity(design),designIdentity({...design,name:' Alex '}))});
test('different names, fonts, colors and styles are separate bag items',()=>{for(const patch of [{name:'Sam'},{font:'Signature'},{textColor:'#d7181f'},{style:'Word Cloud'}])assert.notEqual(designIdentity(design),designIdentity({...design,...patch}))});
test('different uploaded artwork and instructions remain distinct',()=>{assert.notEqual(designIdentity({...design,upload:'one'}),designIdentity({...design,upload:'two'}));assert.notEqual(designIdentity({...design,instructions:'Center'}),designIdentity({...design,instructions:'Bottom'}))});
