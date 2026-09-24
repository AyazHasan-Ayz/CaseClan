import test from 'node:test';
import assert from 'node:assert/strict';
import {designIdentity} from '../lib/cart.ts';

test('fixed products share an empty design identity',()=>assert.equal(designIdentity(undefined),''));
test('separate custom exports remain separate cart items',()=>assert.notEqual(designIdentity({artifactId:'one'}),designIdentity({artifactId:'two'})));
