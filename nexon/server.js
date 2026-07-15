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

  // 장소+월 기준으로 기존 세션 조회 (inspector 무관) — 중복 세션 방지
  let { data: existing } = await supabase.from('insp_sessions')
    .select('*').eq('location_id', location_id).eq('year', year).eq('month', month)
    .order('id', { ascending: false }).limit(1);
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

  // result를 먼저 펼치고 equipment를 덮어써서 e.id(장비ID)가 보존되도록 함
  const equipment = eqRows?.map(e => ({ ...resultMap[e.id], ...e, result_id: resultMap[e.id]?.id }));
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

  const { error } = await supabase.from('insp_results').upsert({
    session_id, equipment_id,
    power_ok: !!power_ok, screen_ok: !!screen_ok, network_ok: !!network_ok,
    cable_ok: !!cable_ok, content_ok: !!content_ok, no_issues: !!no_issues,
    issue_description: no_issues ? null : (issue_description || null),
    action_taken: action_taken || null,
    action_status: no_issues ? 'normal' : (action_status || 'normal'),
  }, { onConflict: 'session_id,equipment_id', ignoreDuplicates: false });
  if (error) { console.error('results upsert 오류:', error.message); return res.status(500).json({ error: error.message }); }
  res.json({ success: true });
});

app.put('/api/sessions/:id/complete', auth, async (req, res) => {
  await supabase.from('insp_sessions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', req.params.id);
  res.json({ success: true });
});

app.put('/api/sessions/:id/reopen', auth, async (req, res) => {
  await supabase.from('insp_sessions').update({ status: 'in_progress', completed_at: null }).eq('id', req.params.id);
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

  const [
    { data },
    { count: totalLocations },
    { data: sessions },
  ] = await Promise.all([
    supabase.from('insp_results')
      .select('*, insp_sessions!inner(year, month, completed_at, insp_users(name)), insp_equipment(equipment_code, name, type, insp_locations(building, name, sort_order))')
      .eq('insp_sessions.year', year).eq('insp_sessions.month', month),
    supabase.from('insp_locations').select('*', { count: 'exact', head: true }),
    supabase.from('insp_sessions')
      .select('*, insp_locations(building, name, sort_order)')
      .eq('year', year).eq('month', month),
  ]);

  if (!data?.length) return res.status(404).json({ error: '데이터 없음' });

  // 서머리 계산
  const completedSessions = sessions?.filter(s => s.status === 'completed') || [];
  const completionRate = totalLocations > 0 ? Math.round((completedSessions.length / totalLocations) * 100) : 0;
  const issueCount = data.filter(r => !r.no_issues).length;
  const asCount = data.filter(r => r.action_status === 'as_request').length;
  const completedLocationNames = completedSessions
    .sort((a, b) => {
      const ba = a.insp_locations?.building || '', bb = b.insp_locations?.building || '';
      if (ba !== bb) return ba.localeCompare(bb);
      return (a.insp_locations?.sort_order || 0) - (b.insp_locations?.sort_order || 0);
    })
    .map(s => `${s.insp_locations?.building} ${s.insp_locations?.name}`);

  const ACTION = { normal:'해당없음', issue:'확인중', as_request:'AS접수', completed:'조치완료' };
  const detailRows = data.map(r => ({
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

  const detailHeaders = Object.keys(detailRows[0]);
  const q = (v) => `"${(v||'').toString().replace(/"/g,'""')}"`;

  const summaryLines = [
    `넥슨코리아 공용부 점검 결과 - ${year}년 ${month}월`,
    '',
    '[요약]',
    `전체 점검 완료율,${completionRate}%`,
    `이상 발생 건수,${issueCount}건`,
    `AS 접수,${asCount}건`,
    `점검 완료 장소,${completedSessions.length}개소 / 전체 ${totalLocations}개소`,
    `점검 완료 장소 목록,${q(completedLocationNames.join(' · '))}`,
    '',
    '[세부 내역]',
    detailHeaders.join(','),
    ...detailRows.map(r => detailHeaders.map(h => q(r[h])).join(',')),
  ];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="nexon_inspection_${year}${String(month).padStart(2,'0')}.csv"`);
  res.send('﻿' + summaryLines.join('\n'));
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

// ── Migration: 엘리베이터 DID 장소 및 장비 삭제 ──────
async function migrateDeleteElevatorDid() {
  const { data: loc } = await supabase.from('insp_locations')
    .select('id').eq('building', 'NK').eq('name', '엘리베이터 DID (B1F~10F)').limit(1);
  if (!loc?.length) return;

  console.log('엘리베이터 DID (B1F~10F) 삭제 중...');
  const locId = loc[0].id;

  const { data: eqs } = await supabase.from('insp_equipment').select('id').eq('location_id', locId);
  const eqIds = eqs?.map(e => e.id) || [];

  const { data: sessions } = await supabase.from('insp_sessions').select('id').eq('location_id', locId);
  const sessIds = sessions?.map(s => s.id) || [];

  if (sessIds.length) await supabase.from('insp_results').delete().in('session_id', sessIds);
  if (eqIds.length)   await supabase.from('insp_results').delete().in('equipment_id', eqIds);
  if (sessIds.length) await supabase.from('insp_sessions').delete().in('id', sessIds);
  if (eqIds.length)   await supabase.from('insp_equipment').delete().in('id', eqIds);
  await supabase.from('insp_locations').delete().eq('id', locId);

  console.log('엘리베이터 DID (B1F~10F) 장소 및 장비 삭제 완료');
}

// ── Migration: DID SW 장소 및 장비 추가 ─────────────
async function migrateAddDidSwLocations() {
  const { data: check } = await supabase.from('insp_locations')
    .select('id').eq('building', 'NK').eq('name', 'A존 B1층 DID').limit(1);
  if (check?.length) return;

  console.log('DID SW 장소 데이터 추가 중...');

  const locDefs = [
    { building: 'NK', name: 'A존 B1층 DID',  sort_order: 20 },
    { building: 'NK', name: 'A존 1층 DID',   sort_order: 21 },
    { building: 'NK', name: 'A존 2층 DID',   sort_order: 22 },
    { building: 'NK', name: 'A존 3층 DID',   sort_order: 23 },
    { building: 'NK', name: 'A존 4층 DID',   sort_order: 24 },
    { building: 'NK', name: 'A존 5층 DID',   sort_order: 25 },
    { building: 'NK', name: 'A존 6층 DID',   sort_order: 26 },
    { building: 'NK', name: 'A존 7층 DID',   sort_order: 27 },
    { building: 'NK', name: 'A존 8층 DID',   sort_order: 28 },
    { building: 'NK', name: 'A존 9층 DID',   sort_order: 29 },
    { building: 'NK', name: 'A존 10층 DID',  sort_order: 30 },
    { building: 'NK', name: 'G/B구역 DID',   sort_order: 31 },
  ];

  const { data: locRows, error } = await supabase.from('insp_locations').insert(locDefs).select();
  if (error || !locRows) { console.error('DID SW 장소 추가 실패:', error?.message); return; }

  const getLocId = (n) => locRows.find(l => l.name === n)?.id;
  const eqs = [];

  // A존 B1층: G/G, A, M
  const b1Id = getLocId('A존 B1층 DID');
  [['GG','G/G'], ['A','A'], ['M','M']].forEach(([code, label]) => {
    eqs.push({ equipment_code: `NK-DID-AB1-${code}`, name: `DID A존B1-${label}`, type: 'DID', location_id: b1Id, model: 'LG 55UH5F', installed_at: '2022-11-01' });
  });

  // A존 1층: G, A, M, E
  const f1Id = getLocId('A존 1층 DID');
  [['G','G'], ['A','A'], ['M','M'], ['E','E']].forEach(([code, label]) => {
    eqs.push({ equipment_code: `NK-DID-A1F-${code}`, name: `DID A존1F-${label}`, type: 'DID', location_id: f1Id, model: 'LG 55UH5F', installed_at: '2022-11-01' });
  });

  // A존 2층~10층: G, A, M, E
  for (let fl = 2; fl <= 10; fl++) {
    const locId = getLocId(`A존 ${fl}층 DID`);
    [['G','G'], ['A','A'], ['M','M'], ['E','E']].forEach(([code, label]) => {
      eqs.push({ equipment_code: `NK-DID-A${fl}F-${code}`, name: `DID A존${fl}F-${label}`, type: 'DID', location_id: locId, model: 'LG 55UH5F', installed_at: '2022-11-01' });
    });
  }

  // G/B구역
  const gbId = getLocId('G/B구역 DID');
  [
    { equipment_code: 'NK-DID-GB-LEDPC',  name: 'LED PC',       model: 'DID Server PC'  },
    { equipment_code: 'NK-DID-GB-LEDSTP', name: 'LED 셋탑박스', model: 'R4X PRO2'       },
    { equipment_code: 'NK-DID-GB-MONPC',  name: '모니터링 PC',  model: 'DID Monitor PC' },
    { equipment_code: 'NK-DID-GB-STP1',   name: '셋탑박스-1',   model: 'R4X PRO2'       },
  ].forEach(item => {
    eqs.push({ ...item, type: 'DID', location_id: gbId, installed_at: '2022-11-01' });
  });

  await supabase.from('insp_equipment').insert(eqs);
  console.log('DID SW 장소 및 장비 추가 완료');
}

// ── Migration: NK 회의실 2호 장비 재구성 ─────────────────
async function migrateNkRoom2Equipment() {
  const { data: locations } = await supabase.from('insp_locations').select('id, building, name');
  const locId = locations?.find(l => l.building === 'NK' && (l.name === '회의실 2호' || l.name === '메인 회의실'))?.id;
  if (!locId) return;

  const { data: check } = await supabase.from('insp_equipment')
    .select('id').eq('location_id', locId).eq('type', 'VIDEO_CONF').eq('is_active', true).limit(1);
  if (check?.length) return;

  console.log('NK 회의실 2호 장비 재구성 중...');

  await supabase.from('insp_equipment').update({ is_active: false }).eq('location_id', locId);

  const eqs = [
    { equipment_code: 'NK-R02-VCONF', name: '화상회의',     type: 'VIDEO_CONF', location_id: locId, model: 'Logitech Rally Plus', installed_at: '2023-03-15' },
    { equipment_code: 'NK-R02-CAM',   name: '카메라',       type: 'CAMERA',     location_id: locId, model: 'Logitech Brio',        installed_at: '2023-03-15' },
    { equipment_code: 'NK-R02-MIC',   name: '마이크',       type: 'MIC',        location_id: locId, model: 'Shure MX393',          installed_at: '2023-03-15' },
    { equipment_code: 'NK-R02-SPK',   name: '스피커',       type: 'SPEAKER',    location_id: locId, model: 'Bose DS16F',           installed_at: '2023-03-15' },
    { equipment_code: 'NK-R02-DGL',   name: '무선동글',     type: 'DONGLE',     location_id: locId, model: 'ClickShare CX-50',     installed_at: '2023-03-15' },
    { equipment_code: 'NK-R02-TV1',   name: '65인치 1번',   type: 'TV',         location_id: locId, model: 'Samsung QE65Q80B',     installed_at: '2023-03-15' },
    { equipment_code: 'NK-R02-TV2',   name: '65인치 2번',   type: 'TV',         location_id: locId, model: 'Samsung QE65Q80B',     installed_at: '2023-03-15' },
    { equipment_code: 'NK-R02-TV3',   name: '65인치 3번',   type: 'TV',         location_id: locId, model: 'Samsung QE65Q80B',     installed_at: '2023-03-15' },
    { equipment_code: 'NK-R02-LEDW',  name: '메인전광판',   type: 'LED_WALL',   location_id: locId, model: 'LED Wall Panel',       installed_at: '2023-03-15' },
  ];
  const { error: insErr } = await supabase.from('insp_equipment').insert(eqs);
  if (insErr) { console.error('NK 회의실 2호 장비 insert 오류:', insErr.message); return; }
  console.log('NK 회의실 2호 장비 재구성 완료 (총 9개)');
}

// ── Start ────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n넥슨코리아 공용부 점검 플랫폼`);
  console.log(`http://localhost:${PORT}\n`);
  await seedIfEmpty();
  await migrateAddMissingPCs();
  await migrateDeleteElevatorDid();
  await migrateAddDidSwLocations();
  await migrateNkRoom2Equipment();
  await migrateRenameNkRoom2();
  await migrateNkRoom6And8();
  await migrateFixG18FName();
  await migrateCreateNkB1Class();
  await migrateNekbangAddEquipment();
  await migrateSeedMay2026Results();
});

// ── Migration: 넥방 오디오·TV 장비 추가 ──────────────────
async function migrateNekbangAddEquipment() {
  const { data: loc } = await supabase.from('insp_locations')
    .select('id').eq('building', 'GB1').eq('name', '11층 넥방').limit(1);
  if (!loc?.length) return;
  const locId = loc[0].id;

  const { data: existing } = await supabase.from('insp_equipment')
    .select('id').eq('location_id', locId).eq('type', 'AUDIO').eq('is_active', true).limit(1);
  if (existing?.length) return;

  console.log('넥방 오디오·TV 장비 추가 중...');

  const eqs = [];
  for (let i = 1; i <= 6; i++)
    eqs.push({ equipment_code: `GB1-NEK-AUD${i}`, name: `오디오 ${i}번`, type: 'AUDIO', location_id: locId, model: 'Yamaha', installed_at: '2023-03-15' });

  eqs.push({ equipment_code: 'GB1-NEK-MTV',  name: '비디오 메인TV',  type: 'TV', location_id: locId, model: 'Samsung QE75Q80B', installed_at: '2023-03-15' });
  eqs.push({ equipment_code: 'GB1-NEK-STV',  name: '스탠드TV',       type: 'TV', location_id: locId, model: 'Samsung QE55Q80B', installed_at: '2023-03-15' });

  for (let i = 1; i <= 14; i++)
    eqs.push({ equipment_code: `GB1-NEK-CTV${String(i).padStart(2,'0')}`, name: `천장형TV ${i}번`, type: 'TV', location_id: locId, model: 'LG 43UP7750', installed_at: '2023-03-15' });

  const { error } = await supabase.from('insp_equipment').insert(eqs);
  if (error) { console.error('넥방 장비 추가 오류:', error.message); return; }
  console.log(`넥방 장비 추가 완료 (총 ${eqs.length}개)`);
}

// ── Migration: NK B1교실 장소 및 장비 생성 ────────────────
async function migrateCreateNkB1Class() {
  const { data: existing } = await supabase.from('insp_locations')
    .select('id').eq('building', 'NK').eq('name', 'B1교실').limit(1);
  if (existing?.length) return;

  console.log('NK B1교실 생성 중...');

  const { data: loc, error: locErr } = await supabase.from('insp_locations')
    .insert({ building: 'NK', name: 'B1교실', sort_order: 13 }).select().single();
  if (locErr || !loc) { console.error('B1교실 장소 생성 오류:', locErr?.message); return; }

  const eqs = [
    { equipment_code: 'NK-B1CL-PROJ1', name: '빔프로젝터 1번', type: 'PROJECTOR', location_id: loc.id, model: 'Epson EB-2265U', installed_at: '2023-03-15' },
    { equipment_code: 'NK-B1CL-PROJ2', name: '빔프로젝터 2번', type: 'PROJECTOR', location_id: loc.id, model: 'Epson EB-2265U', installed_at: '2023-03-15' },
    { equipment_code: 'NK-B1CL-PROJ3', name: '빔프로젝터 3번', type: 'PROJECTOR', location_id: loc.id, model: 'Epson EB-2265U', installed_at: '2023-03-15' },
    { equipment_code: 'NK-B1CL-MIC',   name: '마이크',         type: 'MIC',       location_id: loc.id, model: 'Shure MX393',   installed_at: '2023-03-15' },
    { equipment_code: 'NK-B1CL-SPK',   name: '스피커',         type: 'SPEAKER',   location_id: loc.id, model: 'Bose DS16F',    installed_at: '2023-03-15' },
  ];
  const { error: eqErr } = await supabase.from('insp_equipment').insert(eqs);
  if (eqErr) { console.error('B1교실 장비 생성 오류:', eqErr.message); return; }
  console.log('NK B1교실 생성 완료 (장비 5개)');
}

// ── Migration: 2026년 5월 점검 결과 데이터 삽입 ─────────────
async function migrateSeedMay2026Results() {
  const { count } = await supabase.from('insp_sessions')
    .select('*', { count: 'exact', head: true }).eq('year', 2026).eq('month', 5);
  if (count > 0) return;

  console.log('2026년 5월 점검 데이터 삽입 중...');

  // 점검자 계정 생성 (없으면)
  const inspList = [
    { username: 'ikwangju',   name: '이광주' },
    { username: 'bakjungho',  name: '박정호' },
    { username: 'gyeyounggn', name: '계영근' },
  ];
  const inspIds = {};
  for (const ins of inspList) {
    const { data: ex } = await supabase.from('insp_users').select('id').eq('username', ins.username).limit(1);
    if (ex?.length) {
      inspIds[ins.name] = ex[0].id;
    } else {
      const { data } = await supabase.from('insp_users')
        .insert({ username: ins.username, password_hash: bcrypt.hashSync('inspect1234', 10), name: ins.name, role: 'inspector' })
        .select().single();
      inspIds[ins.name] = data?.id;
    }
  }

  const { data: locs } = await supabase.from('insp_locations').select('id, building, name');
  const { data: allEq } = await supabase.from('insp_equipment').select('id, equipment_code').eq('is_active', true);
  const locId = (b, n) => locs?.find(l => l.building === b && l.name === n)?.id;
  const eqId  = (code) => allEq?.find(e => e.equipment_code === code)?.id;

  const STARTED   = '2026-05-29T09:00:00+09:00';
  const COMPLETED = '2026-05-29T18:00:00+09:00';

  async function createSess(building, locName, inspName, items, done = true) {
    const lid = locId(building, locName);
    const iid = inspIds[inspName];
    if (!lid || !iid) { console.warn(`Not found: ${building} ${locName} / ${inspName}`); return; }
    const { data: sess, error: se } = await supabase.from('insp_sessions').insert({
      location_id: lid, inspector_id: iid, year: 2026, month: 5,
      status: done ? 'completed' : 'in_progress',
      started_at: STARTED, completed_at: done ? COMPLETED : null,
    }).select().single();
    if (se) { console.error(`세션 오류 ${building} ${locName}:`, se.message); return; }
    const rows = items.map(it => ({
      session_id: sess.id, equipment_id: eqId(it.code),
      power_ok: true, screen_ok: !!it.ok, network_ok: true, cable_ok: true, content_ok: !!it.ok,
      no_issues: !!it.ok,
      issue_description: it.desc || null,
      action_status: it.status || (it.ok ? 'normal' : 'issue'),
    })).filter(r => r.equipment_id);
    if (rows.length) {
      const { error: re } = await supabase.from('insp_results').insert(rows);
      if (re) console.error(`결과 오류 ${building} ${locName}:`, re.message);
    }
    console.log(`  ${building} ${locName}: ${rows.length}건 (${done ? '완료' : '진행중'})`);
  }

  // ── 12개 완료 장소 ──────────────────────────────────────
  await createSess('GB1', '1층 넥다플러스', '이광주', [
    { code:'GB1-STP-001', ok:false, desc:'셋탑 자체 음성 및 채널 변경가능 셋탑 외부에서 입력되는 음성이 출력안됨 - 전체적인 배선 점검이 필요함', status:'completed' },
  ]);

  const nekbang = [];
  nekbang.push({ code:'GB1-NEK-AUD1', ok:false, desc:'마이크 전향성으로 스피커와 거리에 따라 하울링이 있을수 있음 - 헤드셋 마이크변경(개선가능) - 마이크를 키높이 이하로 유지', status:'issue' });
  for (let i=2;i<=6;i++) nekbang.push({ code:`GB1-NEK-AUD${i}`, ok:true });
  for (let i=1;i<=14;i++) nekbang.push({ code:`GB1-NEK-CTV${String(i).padStart(2,'0')}`, ok:true });
  nekbang.push({ code:'GB1-NEK-MTV', ok:true });
  nekbang.push({ code:'GB1-NEK-STV', ok:true });
  for (let i=1;i<=50;i++) nekbang.push({ code:`GB1-PC-11-${String(i).padStart(3,'0')}`, ok:true });
  await createSess('GB1', '11층 넥방', '이광주', nekbang);

  await createSess('GB1', '회의실 1호', '이광주', [
    { code:'GB1-MIC-001', ok:true }, { code:'GB1-SPK-001', ok:true }, { code:'GB1-TV-001', ok:true },
  ]);

  await createSess('NK', '회의실 1호', '이광주', [
    { code:'NK-MIC-001', ok:true }, { code:'NK-SPK-001', ok:true }, { code:'NK-TV-001', ok:true },
  ]);

  await createSess('NK', '메인 회의실', '이광주', [
    { code:'NK-R02-CAM',ok:true },{ code:'NK-R02-DGL',ok:true },{ code:'NK-R02-LEDW',ok:true },
    { code:'NK-R02-MIC',ok:true },{ code:'NK-R02-SPK',ok:true },{ code:'NK-R02-TV1',ok:true },
    { code:'NK-R02-TV2',ok:true },{ code:'NK-R02-TV3',ok:true },{ code:'NK-R02-VCONF',ok:true },
  ]);

  await createSess('NK', 'G1 6F', '이광주', [
    { code:'NK-G16F-CAM',ok:true },{ code:'NK-G16F-DGL',ok:true },{ code:'NK-G16F-MIC',ok:true },
    { code:'NK-G16F-PROJ',ok:true },{ code:'NK-G16F-SPK',ok:true },{ code:'NK-G16F-TV',ok:true },
  ]);

  await createSess('NK', 'G1 8F', '이광주', [
    { code:'NK-G18F-CAM',ok:true },{ code:'NK-G18F-DGL',ok:true },{ code:'NK-G18F-MIC',ok:true },
    { code:'NK-G18F-PROJ',ok:true },{ code:'NK-G18F-SPK',ok:true },{ code:'NK-G18F-TV',ok:true },
  ]);

  await createSess('NK', 'B1교실', '이광주', [
    { code:'NK-B1CL-MIC',ok:true },{ code:'NK-B1CL-PROJ1',ok:true },{ code:'NK-B1CL-PROJ2',ok:true },
    { code:'NK-B1CL-PROJ3',ok:true },{ code:'NK-B1CL-SPK',ok:true },
  ]);

  await createSess('NK', 'A존 6층 DID', '계영근', [
    { code:'NK-DID-A6F-A',ok:true },{ code:'NK-DID-A6F-E',ok:true },
    { code:'NK-DID-A6F-G',ok:true },{ code:'NK-DID-A6F-M',ok:true },
  ]);

  await createSess('NK', 'A존 7층 DID', '계영근', [
    { code:'NK-DID-A7F-A',ok:true },{ code:'NK-DID-A7F-E',ok:true },
    { code:'NK-DID-A7F-G',ok:true },{ code:'NK-DID-A7F-M',ok:true },
  ]);

  await createSess('NK', 'A존 8층 DID', '계영근', [
    { code:'NK-DID-A8F-A',ok:true },{ code:'NK-DID-A8F-E',ok:true },
    { code:'NK-DID-A8F-G',ok:true },{ code:'NK-DID-A8F-M',ok:true },
  ]);

  await createSess('NK', 'A존 9층 DID', '계영근', [
    { code:'NK-DID-A9F-A',ok:true },{ code:'NK-DID-A9F-E',ok:true },
    { code:'NK-DID-A9F-G',ok:true },{ code:'NK-DID-A9F-M',ok:true },
  ]);

  // ── 미완료 장소 (in_progress) ──────────────────────────
  await createSess('NK', '회의실 3호', '박정호', [
    { code:'NK-TV-003', ok:true },
  ], false);

  await createSess('NK', 'A존 10층 DID', '계영근', [
    { code:'NK-DID-A10F-G', ok:true },
  ], false);

  console.log('2026년 5월 점검 데이터 삽입 완료');
}

// ── Migration: NK 회의실 6호→G1 6F, 8호→G1 8F + 장비 재구성 ──
async function migrateNkRoom6And8() {
  const { data: locations } = await supabase.from('insp_locations').select('id, building, name');

  const targets = [
    { oldName: '회의실 6호', newName: 'G1 6F',  prefix: 'NK-G16F'  },
    { oldName: '회의실 8호', newName: 'G1 8F',  prefix: 'NK-G18F'  },
  ];

  for (const t of targets) {
    const loc = locations?.find(l => l.building === 'NK' && (l.name === t.oldName || l.name === t.newName));
    if (!loc) continue;

    const { data: existing } = await supabase.from('insp_equipment')
      .select('id').eq('location_id', loc.id).eq('type', 'PROJECTOR').eq('is_active', true).limit(1);
    if (existing?.length) continue;

    console.log(`NK ${t.oldName} → ${t.newName} 재구성 중...`);

    if (loc.name !== t.newName)
      await supabase.from('insp_locations').update({ name: t.newName }).eq('id', loc.id);

    await supabase.from('insp_equipment').update({ is_active: false }).eq('location_id', loc.id);

    const eqs = [
      { equipment_code: `${t.prefix}-TV`,   name: '75인치 TV',   type: 'TV',        location_id: loc.id, model: 'Samsung QE75Q80B',  installed_at: '2023-03-15' },
      { equipment_code: `${t.prefix}-PROJ`, name: '빔프로젝터',  type: 'PROJECTOR', location_id: loc.id, model: 'Epson EB-2265U',    installed_at: '2023-03-15' },
      { equipment_code: `${t.prefix}-SPK`,  name: '스피커',      type: 'SPEAKER',   location_id: loc.id, model: 'Bose DS16F',         installed_at: '2023-03-15' },
      { equipment_code: `${t.prefix}-CAM`,  name: '카메라',      type: 'CAMERA',    location_id: loc.id, model: 'Logitech Brio',      installed_at: '2023-03-15' },
      { equipment_code: `${t.prefix}-MIC`,  name: '마이크',      type: 'MIC',       location_id: loc.id, model: 'Shure MX393',        installed_at: '2023-03-15' },
      { equipment_code: `${t.prefix}-DGL`,  name: '유선동글',    type: 'DONGLE',    location_id: loc.id, model: 'ClickShare Button',  installed_at: '2023-03-15' },
    ];
    const { error } = await supabase.from('insp_equipment').insert(eqs);
    if (error) { console.error(`${t.newName} 장비 insert 오류:`, error.message); continue; }
    console.log(`${t.newName} 재구성 완료 (총 6개)`);
  }
}

// ── Migration: NK G 18F → G1 8F 이름 오타 수정 ──────────────
async function migrateFixG18FName() {
  const { data: loc } = await supabase.from('insp_locations')
    .select('id').eq('building', 'NK').eq('name', 'G 18F').limit(1);
  if (!loc?.length) return;
  await supabase.from('insp_locations').update({ name: 'G1 8F' }).eq('id', loc[0].id);
  console.log('NK G 18F → G1 8F 이름 수정 완료');
}

// ── Migration: NK 회의실 2호 → 메인 회의실 ────────────────
async function migrateRenameNkRoom2() {
  const { data: loc } = await supabase.from('insp_locations')
    .select('id').eq('building', 'NK').eq('name', '회의실 2호').limit(1);
  if (!loc?.length) return;
  await supabase.from('insp_locations').update({ name: '메인 회의실' }).eq('id', loc[0].id);
  console.log('NK 회의실 2호 → 메인 회의실 이름 변경 완료');
}
