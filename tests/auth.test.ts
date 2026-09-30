import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {safeNextPath,isAdminRole} from '../lib/auth.ts';

test('safe return paths cannot leave CASECLAN',()=>{
  assert.equal(safeNextPath('/checkout/?from=cart'),'/checkout/?from=cart');
  for(const value of ['https://evil.example','//evil.example','/\\evil.example','javascript:alert(1)'])assert.equal(safeNextPath(value),'/account/');
});

test('only database roles grant admin access',()=>{
  assert.equal(isAdminRole('owner'),true);
  assert.equal(isAdminRole('admin'),true);
  assert.equal(isAdminRole('staff'),true);
  assert.equal(isAdminRole('customer'),false);
});

test('auth routes and database-enforced checkout are present',()=>{
  for(const route of ['login','signup','forgot-password','reset-password','account','checkout','admin/login'])assert.equal(fs.existsSync(`app/${route}/page.tsx`),true,route);
  const admin=fs.readFileSync('components/AdminApp.tsx','utf8');
  assert.doesNotMatch(admin,/caseclan-admin-pin|caseclan-admin-session/);
  const sql=fs.readFileSync('supabase/migrations/20260930000100_auth_and_secure_orders.sql','utf8');
  assert.match(sql,/create or replace function public\.place_order/);
  assert.match(sql,/revoke insert, update on public\.customers from authenticated/);
  assert.match(sql,/role in \('customer', 'owner', 'admin', 'staff'\)/);
  assert.match(sql,/revoke all on function public\.place_order\(jsonb\) from public, anon/);
  const guard=fs.readFileSync('components/AuthGuard.tsx','utf8');
  assert.match(guard,/router\.replace\(loginHref\(next\)\)/);
  const checkout=fs.readFileSync('components/Account.tsx','utf8');
  assert.match(checkout,/if\(!auth\.user\).*loginHref\('\/checkout\/'\)/s);
  const oauth=fs.readFileSync('components/AuthProvider.tsx','utf8');
  assert.match(oauth,/signInWithOAuth\(\{provider:'google'/);
  const pages=fs.readFileSync('components/AuthPages.tsx','utf8');
  assert.match(pages,/CONTINUE WITH GOOGLE/);
  assert.match(pages,/GoogleIcon/);
  assert.doesNotMatch(pages,/Email or phone/i);
  assert.ok(pages.indexOf('<form onSubmit={submit}>') < pages.indexOf('CONTINUE WITH GOOGLE'));
  assert.match(pages,/safeNextPath\(params\.get\('next'\)/);
});
