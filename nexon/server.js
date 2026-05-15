'use strict';
require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Middleware ───────────────────────────────────────
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'nexon-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

const auth = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: '로그인 필요' });
  next();
};
const adminOnly = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin')
    return res.status(403).json({ error: '관리자 권한 필요' });
  next();
};

// ── 초기 데이터 세팅 ────────────────────────────────
async function seedIfEmpty() {
  const { count, error: countErr } = await supabase.from('insp_users').select('*', { count: 'exact', head: true });
  if (countErr) { console.error('DB 연결 오류 (테이블 미존재 가능):', countErr.message); return; }
  if (count > 0) return;

  console.log('초기 데이터 생성 중...');

  await supabase.from('insp_users').insert([
    { username: 'admin',      password_hash: bcrypt.hashSync('admin1234', 10),    name: '넥슨자산관리팀', role: 'admin' },
    { username: 'inspector1', password_hash: bcrypt.hashSync('inspect1234', 10),  name: '김영근',       role: 'inspector' },
  ]);

  const locs = [
    { building:'NK',  name:'회의실 1호',             sort_order:1  },
    { building:'NK',  name:'회의실 2호',             sort_order:2  },
    { building:'NK',  name:'회의실 3호',             sort_order:3  },
    { building:'NK',  name:'회의실 4호',             sort_order:4  },
    { building:'NK',  name:'회의실 5호',             sort_order:5  },
    { building:'NK',  name:'회의실 6호',             sort_order:6  },
    { building:'NK',  name:'회의실 7호',             sort_order:7  },
    { building:'NK',  name:'회의실 8호',             sort_order:8  },
    { building:'NK',  name:'회의실 9호',             sort_order:9  },
    { building:'NK',  name:'회의실 10호',            sort_order:10 },
    { building:'NK',  name:'B1 컴퓨터교실',          sort_order:11 },
    { building:'NK',  name:'엘리베이터 DID (B1F~10F)', sort_order:12 },
    { building:'GB1', name:'회의실 1호',             sort_order:1  },
    { building:'GB1', name:'회의실 2호',             sort_order:2  },
    { building:'GB1', name:'회의실 3호',             sort_order:3  },
    { building:'GB1', name:'회의실 4호',             sort_order:4  },
    { building:'GB1', name:'회의실 5호',             sort_order:5  },
    { building:'GB1', name:'1층 넥다플러스',         sort_order:6  },
    { building:'GB1', name:'11층 넥방',              sort_order:7  },
    { building:'GB2', name:'회의실 1호',             sort_order:1  },
    { building:'GB2', name:'회의실 2호',             sort_order:2  },
    { building:'GB2', name:'회의실 3호',             sort_order:3  },
    { building:'GB2', name:'회의실 4호',             sort_order:4  },
    { building:'GB2', name:'회의실 5호',             sort_order:5  },
  ];
  const { data: locRows, error: locErr } = await supabase.from('insp_locations').insert(locs).select();
  if (locErr || !locRows) { console.error('장소 데이터 생성 실패:', locErr?.message); return; }

  const getLocId = (b, n) => locRows.find(l => l.building === b && l.name === n)?.id;

  const eqs = [];
  for (let i = 1; i <= 10; i++) {
    const id = getLocId('NK', `회의실 ${i}호`);
    eqs.push({ equipment_code:`NK-TV-${String(i).padStart(3,'0')}`,  name:'TV 65인치',    type:'TV',      location_id:id, model:'Samsung QE65Q80B', installed_at:'2023-03-15' });
    eqs.push({ equipment_code:`NK-MIC-${String(i).padStart(3,'0')}`, name:'마이크 (유선)', type:'MIC',     location_id:id, model:'Shure MX393',      installed_at:'2023-03-15' });
    eqs.push({ equipment_code:`NK-SPK-${String(i).padStart(3,'0')}`, name:'스피커',       type:'SPEAKER', location_id:id, model:'Bose DS16F',        installed_at:'2023-03-15' });
    if (i % 3 === 0) eqs.push({ equipment_code:`NK-CAM-${String(Math.ceil(i/3)).padStart(3,'0')}`, name:'화상 카메라', type:'CAMERA', location_id:id, model:'Logitech Brio', installed_at:'2023-03-15' });
  }
  const nkPcId = getLocId('NK', 'B1 컴퓨터교실');
  for (let i = 1; i <= 50; i++)
    eqs.push({ equipment_code:`NK-PC-B1-${String(i).padStart(3,'0')}`, name:`노하드PC ${i}번`, type:'PC', location_id:nkPcId, model:'NComputing', installed_at:'2021-06-10' });

  const nkDidId = getLocId('NK', '엘리베이터 DID (B1F~10F)');
  for (let i = 1; i <= 10; i++) {
    eqs.push({ equipment_code:`NK-DID-${String(i).padStart(3,'0')}`, name:`DID TV ${i}층`, type:'DID', location_id:nkDidId, model:'LG 55UH5F', installed_at:'2022-11-01' });
    eqs.push({ equipment_code:`NK-STP-${String(i).padStart(3,'0')}`, name:`셋탑박스 ${i}층`, type:'SETTOP', location_id:nkDidId, model:'R4X PRO2', installed_at:'2022-11-01' });
  }
  for (let i = 1; i <= 5; i++) {
    const id = getLocId('GB1', `회의실 ${i}호`);
    eqs.push({ equipment_code:`GB1-TV-${String(i).padStart(3,'0')}`,  name:'TV 55인치', type:'TV',      location_id:id, model:'LG 55UP7750', installed_at:'2022-06-01' });
    eqs.push({ equipment_code:`GB1-MIC-${String(i).padStart(3,'0')}`, name:'마이크',    type:'MIC',     location_id:id, model:'Shure MX393', installed_at:'2022-06-01' });
    eqs.push({ equipment_code:`GB1-SPK-${String(i).padStart(3,'0')}`, name:'스피커',    type:'SPEAKER', location_id:id, model:'Bose DS16F',  installed_at:'2022-06-01' });
  }
  const nexdaId = getLocId('GB1', '1층 넥다플러스');
  for (let i = 1; i <= 4; i++) {
    eqs.push({ equipment_code:`GB1-DID-${String(i).padStart(3,'0')}`, name:`DID TV ${i}`,   type:'DID',    location_id:nexdaId, model:'LG 55UH5F', installed_at:'2022-08-20' });
    eqs.push({ equipment_code:`GB1-STP-${String(i).padStart(3,'0')}`, name:`셋탑박스 ${i}`, type:'SETTOP', location_id:nexdaId, model:'EZ Canvas', installed_at:'2022-08-20' });
  }
  const nekId = getLocId('GB1', '11층 넥방');
  for (let i = 1; i <= 105; i++)
    eqs.push({ equipment_code:`GB1-PC-11-${String(i).padStart(3,'0')}`, name:`노하드PC ${i}번`, type:'PC', location_id:nekId, model:'NComputing', installed_at:'2021-06-10' });
  for (let i = 1; i <= 5; i++) {
    const id = getLocId('GB2', `회의실 ${i}호`);
    eqs.push({ equipment_code:`GB2-TV-${String(i).padStart(3,'0')}`,  name:'TV 55인치', type:'TV',      location_id:id, model:'LG 55UP7750', installed_at:'2022-06-01' });
    eqs.push({ equipment_code:`GB2-MIC-${String(i).padStart(3,'0')}`, name:'마이크',    type:'MIC',     location_id:id, model:'Shure MX393', installed_at:'2022-06-01' });
    eqs.push({ equipment_code:`GB2-SPK-${String(i).padStart(3,'0')}`, name:'스피커',    type:'SPEAKER', location_id:id, model:'Bose DS16F',  installed_at:'2022-06-01' });
  }
  await supabase.from('insp_equipment').insert(eqs);
  console.log('초기 데이터 생성 완료');
}

// ── Auth ─────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const { data: users } = await supabase.from('insp_users').select('*').eq('username', username).limit(1);
  const user = users?.[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다' });
  req.session.user = { id: user.id, username: user.username, name: user.name, role: user.role };
  res.json({ success: true, user: req.session.user });
});

app.post('/api/auth/logout', (req, res) => { req.session.destroy(); res.json({ success: true }); });
app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: '미로그인' });
  res.json(req.session.user);
});

// ── Locations ────────────────────────────────────────
app.get('/api/locations', auth, async (req, res) => {
  const { data: locations } = await supabase.from('insp_locations').select('*').order('building').order('sort_order');
  const grouped = {};
  locations?.forEach(l => { (grouped[l.building] = grouped[l.building] || []).push(l); });
  res.json({ locations, grouped });
});

// ── Equipment ────────────────────────────────────────
app.get('/api/equipment', auth, async (req, res) => {
  const { location_id, type } = req.query;
  let q = supabase.from('insp_equipment')
    .select('*, insp_locations(building, name)')
    .eq('is_active', true)
    .order('equipment_code');
  if (location_id) q = q.eq('location_id', location_id);
  if (type) q = q.eq('type', type);
  const { data } = await q;
  const rows = data?.map(e => ({
    ...e,
    building: e.insp_locations?.building,
    location_name: e.insp_locations?.name,
  }));
  res.json(rows || []);
});

app.post('/api/equipment', adminOnly, async (req, res) => {
  const { equipment_code, name, type, location_id, model, installed_at } = req.body;
  const { data, error } = await supabase.from('insp_equipment')
    .insert({ equipment_code, name, type, location_id, model, installed_at }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, id: data.id });
});

app.put('/api/equipment/:id', adminOnly, async (req, res) => {
  await supabase.from('insp_equipment').update(req.body).eq('id', req.params.id);
  res.json({ success: true });
});

app.delete('/api/equipment/:id', adminOnly, async (req, res) => {
  await supabase.from('insp_equipment').update({ is_active: false }).eq('id', req.params.id);
  res.json({ success: true });
});

// ── Dashboard ────────────────────────────────────────
app.get('/api/dashboard', auth, async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year) || now.getFullYear();
  const month = parseInt(req.query.month) || now.getMonth() + 1;

  const [
    { count: totalLocations },
    { count: totalEquipment },
    { data: sessions },
    { data: locations },
  ] = await Promise.all([
    supabase.from('insp_locations').select('*', { count: 'exact', head: true }),
    supabase.from('insp_equipment').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('insp_sessions').select('*, insp_users(name), insp_locations(building, name, sort_order)')
      .eq('year', year).eq('month', month),
    supabase.from('insp_locations').select('*').order('building').order('sort_order'),
  ]);

  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
  const inProgressSessions = sessions?.filter(s => s.status === 'in_progress').length || 0;
  const sessIds = sessions?.map(s => s.id) || [];

  let issueCount = 0, asCount = 0;
  if (sessIds.length > 0) {
    const { count: ic } = await supabase.from('insp_results').select('*', { count: 'exact', head: true })
      .in('session_id', sessIds).eq('no_issues', false);
    const { count: ac } = await supabase.from('insp_results').select('*', { count: 'exact', head: true })
      .in('session_id', sessIds).eq('action_status', 'as_request');
    issueCount = ic || 0;
    asCount = ac || 0;
  }

  const completionRate = totalLocations > 0 ? Math.round((completedSessions / totalLocations) * 100) : 0;

  // 장소별 현황
  const sessMap = {};
  sessions?.forEach(s => { sessMap[s.location_id] = s; });

  // 장소별 점검 결과 수
  let resultCountMap = {};
  if (sessIds.length > 0) {
    const { data: rCounts } = await supabase.from('insp_results').select('session_id').in('session_id', sessIds);
    rCounts?.forEach(r => { resultCountMap[r.session_id] = (resultCountMap[r.session_id] || 0) + 1; });
  }

  // 장소별 장비 수
  const { data: eqCounts } = await supabase.from('insp_equipment').select('location_id').eq('is_active', true);
  const eqCountMap = {};
  eqCounts?.forEach(e => { eqCountMap[e.location_id] = (eqCountMap[e.location_id] || 0) + 1; });

  const locationStatus = locations?.map(loc => {
    const sess = sessMap[loc.id];
    return {
      ...loc,
      total_equipment: eqCountMap[loc.id] || 0,
      session_id: sess?.id,
      session_status: sess?.status,
      inspector_name: sess?.insp_users?.name,
      completed_at: sess?.completed_at,
      inspected_count: sess ? (resultCountMap[sess.id] || 0) : 0,
    };
  });

  // 최근 이상 내역
  const { data: recentIssues } = await supabase.from('insp_results')
    .select('*, insp_sessions(*, insp_users(name)), insp_equipment(*, insp_locations(building, name))')
    .eq('no_issues', false)
    .order('created_at', { ascending: false })
    .limit(10);

  const issues = recentIssues?.map(r => ({
    ...r,
    equipment_name: r.insp_equipment?.name,
    equipment_code: r.insp_equipment?.equipment_code,
    location_name: r.insp_equipment?.insp_locations?.name,
    building: r.insp_equipment?.insp_locations?.building,
    inspector_name: r.insp_sessions?.insp_users?.name,
  }));

  res.json({
    year, month,
    stats: { totalLocations, totalEquipment, completedSessions, inProgressSessions,
             issueCount, asCount, completionRate,
             uninspected: totalLocations - completedSessions - inProgressSessions },
    locationStatus,
    recentIssues: issues || [],
  });
});

// ── Inspection Sessions ──────────────────────────────
app.post('/api/sessions', auth, async (req, res) => {
  const { location_id } = req.body;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const inspector_id = req.session.user.id;

  let { data: existing } = await supabase.from('insp_sessions')
    .select('*').eq('location_id', location_id).eq('year', year).eq('month', month)
    .eq('inspector_id', inspector_id).limit(1);
  let sess = existing?.[0];

  if (!sess) {
    const { data } = await supabase.from('insp_sessions')
      .insert({ year, month, location_id, inspector_id, status: 'in_progress', started_at: new Date().toISOString() })
      .select().single();
    sess = data;
  } else if (sess.status === 'pending') {
    await supabase.from('insp_sessions').update({ status: 'in_progress', started_at: new Date().toISOString() }).eq('id', sess.id);
    sess.status = 'in_progress';
  }

  const { data: eqRows } = await supabase.from('insp_equipment').select('*').eq('location_id', location_id).eq('is_active', true).order('equipment_code');
  const { data: resultRows } = await supabase.from('insp_results').select('*').eq('session_id', sess.id);
  const resultMap = {};
  resultRows?.forEach(r => { resultMap[r.equipment_id] = r; });

  const equipment = eqRows?.map(e => ({ ...e, ...resultMap[e.id], result_id: resultMap[e.id]?.id }));
  res.json({ session: sess, equipment });
});

app.get('/api/sessions', auth, async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year) || now.getFullYear();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  let q = supabase.from('insp_sessions').select('*, insp_locations(building, name), insp_users(name)').eq('year', year).eq('month', month);
  if (req.query.location_id) q = q.eq('location_id', req.query.location_id);
  const { data } = await q;
  res.json(data?.map(s => ({ ...s, building: s.insp_locations?.building, location_name: s.insp_locations?.name, inspector_name: s.insp_users?.name })) || []);
});

app.post('/api/sessions/:sessionId/results', auth, async (req, res) => {
  const { equipment_id, power_ok, screen_ok, network_ok, cable_ok, content_ok,
          no_issues, issue_description, action_taken, action_status } = req.body;
  const session_id = parseInt(req.params.sessionId);

  await supabase.from('insp_results').upsert({
    session_id, equipment_id,
    power_ok: !!power_ok, screen_ok: !!screen_ok, network_ok: !!network_ok,
    cable_ok: !!cable_ok, content_ok: !!content_ok, no_issues: !!no_issues,
    issue_description: issue_description || null,
    action_taken: action_taken || null,
    action_status: action_status || 'normal',
  }, { onConflict: 'session_id,equipment_id', ignoreDuplicates: false });
  res.json({ success: true });
});

app.put('/api/sessions/:id/complete', auth, async (req, res) => {
  await supabase.from('insp_sessions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', req.params.id);
  res.json({ success: true });
});

app.delete('/api/sessions', auth, adminOnly, async (req, res) => {
  const year = parseInt(req.query.year);
  const month = parseInt(req.query.month);
  if (!year || !month) return res.status(400).json({ error: 'year, month 파라미터 필요' });

  const { data: sessions } = await supabase.from('insp_sessions').select('id').eq('year', year).eq('month', month);
  if (sessions?.length) {
    const ids = sessions.map(s => s.id);
    await supabase.from('insp_results').delete().in('session_id', ids);
    await supabase.from('insp_sessions').delete().in('id', ids);
  }
  res.json({ success: true, deleted: sessions?.length || 0 });
});

// ── Report ───────────────────────────────────────────
app.get('/api/report', auth, async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year) || now.getFullYear();
  const month = parseInt(req.query.month) || now.getMonth() + 1;

  let q = supabase.from('insp_results')
    .select('*, insp_sessions!inner(year, month, completed_at, insp_users(name)), insp_equipment(equipment_code, name, type, model, insp_locations(building, name, sort_order))')
    .eq('insp_sessions.year', year).eq('insp_sessions.month', month);
  if (req.query.location_id) q = q.eq('insp_equipment.location_id', req.query.location_id);

  const { data } = await q;
  const results = data?.map(r => ({
    ...r,
    equipment_code: r.insp_equipment?.equipment_code,
    equipment_name: r.insp_equipment?.name,
    type: r.insp_equipment?.type,
    model: r.insp_equipment?.model,
    building: r.insp_equipment?.insp_locations?.building,
    location_name: r.insp_equipment?.insp_locations?.name,
    inspector_name: r.insp_sessions?.insp_users?.name,
    completed_at: r.insp_sessions?.completed_at,
  }));
  res.json({ year, month, results: results || [] });
});

app.get('/api/report/csv', auth, async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year) || now.getFullYear();
  const month = parseInt(req.query.month) || now.getMonth() + 1;

  const { data } = await supabase.from('insp_results')
    .select('*, insp_sessions!inner(year, month, completed_at, insp_users(name)), insp_equipment(equipment_code, name, type, insp_locations(building, name))')
    .eq('insp_sessions.year', year).eq('insp_sessions.month', month);

  if (!data?.length) return res.status(404).json({ error: '데이터 없음' });

  const ACTION = { normal:'해당없음', issue:'확인중', as_request:'AS접수', completed:'조치완료' };
  const rows = data.map(r => ({
    '장비ID': r.insp_equipment?.equipment_code || '',
    '장비명': r.insp_equipment?.name || '',
    '구분': r.insp_equipment?.type || '',
    '위치': `${r.insp_equipment?.insp_locations?.building} ${r.insp_equipment?.insp_locations?.name}`,
    '점검자': r.insp_sessions?.insp_users?.name || '',
    '점검일': (r.insp_sessions?.completed_at || r.created_at || '').slice(0, 10),
    '점검결과': r.no_issues ? '정상' : '이상',
    '이상내용': r.issue_description || '-',
    '조치상태': ACTION[r.action_status] || '-',
  }));

  const headers = Object.keys(rows[0]);
  const csv = [
    `넥슨코리아 공용부 점검 결과 - ${year}년 ${month}월`,
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${(r[h]||'').replace(/"/g,'""')}"`).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="nexon_inspection_${year}${String(month).padStart(2,'0')}.csv"`);
  res.send('﻿' + csv);
});

// ── Users ────────────────────────────────────────────
app.get('/api/users', adminOnly, async (req, res) => {
  const { data } = await supabase.from('insp_users').select('id,username,name,role,created_at').order('id');
  res.json(data || []);
});

app.post('/api/users', adminOnly, async (req, res) => {
  const { username, password, name, role } = req.body;
  const { data, error } = await supabase.from('insp_users')
    .insert({ username, password_hash: bcrypt.hashSync(password, 10), name, role: role || 'inspector' }).select().single();
  if (error) return res.status(400).json({ error: '아이디 중복 또는 오류' });
  res.json({ success: true, id: data.id });
});

app.put('/api/users/:id', adminOnly, async (req, res) => {
  const { name, role, password } = req.body;
  const update = { name, role };
  if (password) update.password_hash = bcrypt.hashSync(password, 10);
  const { error } = await supabase.from('insp_users').update(update).eq('id', req.params.id);
  if (error) return res.status(400).json({ error: '수정 실패' });
  res.json({ success: true });
});

app.delete('/api/users/:id', adminOnly, async (req, res) => {
  const myId = req.session.userId;
  if (String(myId) === String(req.params.id)) return res.status(400).json({ error: '본인 계정은 삭제할 수 없습니다' });
  const { error } = await supabase.from('insp_users').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: '삭제 실패' });
  res.json({ success: true });
});

// ── Migration: PC 대수 증설 ──────────────────────────
async function migrateAddMissingPCs() {
  const { data: locations } = await supabase.from('insp_locations').select('id, building, name');
  if (!locations?.length) return;

  const getLocId = (b, n) => locations.find(l => l.building === b && l.name === n)?.id;

  // NK B1 컴퓨터교실: 50대 (기존 20대 → +30대)
  const nkPcId = getLocId('NK', 'B1 컴퓨터교실');
  if (nkPcId) {
    const { data: existing } = await supabase.from('insp_equipment')
      .select('equipment_code').eq('location_id', nkPcId).like('equipment_code', 'NK-PC-B1-%');
    const existingCodes = new Set(existing?.map(e => e.equipment_code) || []);
    const toAdd = [];
    for (let i = 1; i <= 50; i++) {
      const code = `NK-PC-B1-${String(i).padStart(3,'0')}`;
      if (!existingCodes.has(code))
        toAdd.push({ equipment_code:code, name:`노하드PC ${i}번`, type:'PC', location_id:nkPcId, model:'NComputing', installed_at:'2021-06-10' });
    }
    if (toAdd.length > 0) {
      await supabase.from('insp_equipment').insert(toAdd);
      console.log(`NK B1 컴퓨터교실 PC ${toAdd.length}대 추가 완료 (총 50대)`);
    }
  }

  // GB1 11층 넥방: 105대 (기존 10대 → +95대)
  const nekId = getLocId('GB1', '11층 넥방');
  if (nekId) {
    const { data: existing } = await supabase.from('insp_equipment')
      .select('equipment_code').eq('location_id', nekId).like('equipment_code', 'GB1-PC-11-%');
    const existingCodes = new Set(existing?.map(e => e.equipment_code) || []);
    const toAdd = [];
    for (let i = 1; i <= 105; i++) {
      const code = `GB1-PC-11-${String(i).padStart(3,'0')}`;
      if (!existingCodes.has(code))
        toAdd.push({ equipment_code:code, name:`노하드PC ${i}번`, type:'PC', location_id:nekId, model:'NComputing', installed_at:'2021-06-10' });
    }
    if (toAdd.length > 0) {
      await supabase.from('insp_equipment').insert(toAdd);
      console.log(`GB1 11층 넥방 노하드PC ${toAdd.length}대 추가 완료 (총 105대)`);
    }
  }
}

// ── Start ────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n넥슨코리아 공용부 점검 플랫폼`);
  console.log(`http://localhost:${PORT}\n`);
  await seedIfEmpty();
  await migrateAddMissingPCs();
});
