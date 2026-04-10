/**
 * GGO PLAY — 전체 페이지 클라우드 동기화 모듈 (sync.js)
 * Firebase Realtime Database 경로: /ggo_sync/{username}/
 * 모든 페이지에서 로그인 시 자동 저장 & 복원
 */

(function () {
  'use strict';

  // ── Firebase 초기화 (아직 없을 경우) ──
  const FB_CFG = {
    apiKey: "AIzaSyCXJrfH4ZrppPgqoN4zhUPVaRE8Mi3WygA",
    authDomain: "ggo-play.firebaseapp.com",
    databaseURL: "https://ggo-play-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ggo-play",
    storageBucket: "ggo-play.firebasestorage.app",
    messagingSenderId: "645489083721",
    appId: "1:645489083721:web:30a518e5e03238ea8dc698"
  };

  function getDB() {
    if (window._gwDB) return window._gwDB;
    try {
      if (typeof firebase === 'undefined') return null;
      if (!firebase.apps.length) firebase.initializeApp(FB_CFG);
      window._gwDB = firebase.database();
      return window._gwDB;
    } catch (e) { return null; }
  }

  // ── 현재 로그인 유저명 ──
  function getUN() {
    return sessionStorage.getItem('ggo_username')
      || localStorage.getItem('ggo_username')
      || '';
  }

  // ── 동기화 대상 키 패턴 ──
  // 1. 고정 패턴: prefix + username (끝)
  const FIXED_PREFIXES = [
    'ggo_currency_',
    'ggo_items_',
    'ggo_deco_exp_',
    'ggo_bp_claimed_',
    'ggo_tour_claimed_',
    'ggo_used_coupons_',
    'ggo_notifs_',
    'ggo_rank_snap_',
    'ggo_mail_claimed_',
    'ggo_fish_stats_',
    'ggo_fish_storage_',
    'ggo_fish_map_',
    'ggo_fish_dex_claimed_',
    'ggo_fish_fp_',
    'ggo_fish_gear_',
    'ggo_fish_owned_rods_',
    'gwo_save_',
    'gwo_activejob_',
    'gwo_dojo_auto_',
    'gwo_pvp_daily_',
  ];

  // 2. 동적 패턴: username이 어딘가 포함된 키
  const DYNAMIC_PREFIXES = [
    'ggo_fish_quest_',
    'ggo_fish_rank_claimed_',
    'gwo_charsave_',
    'gwo_tower_cleared_',
    'gwo_tower_cur_',
    'gwo_tower_rank_claim_',
    'gwo_wb_',
    'gwo_rdun_daily_',
    'gwo_dun_count_',
    'gwo_legion_daily_',
    'gwo_pvp_reward_',
    'gwo_quest_date_',
    'gwo_quest_week_',
  ];

  // ── localStorage 전체 수집 ──
  function collectAllKeys(un) {
    const keys = {};
    // 고정 패턴
    FIXED_PREFIXES.forEach(p => {
      const v = localStorage.getItem(p + un);
      if (v !== null) keys[p + un] = v;
    });
    // 동적 패턴 (전체 스캔)
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || keys[k] !== undefined) continue;
      if (DYNAMIC_PREFIXES.some(p => k.startsWith(p)) && k.includes(un)) {
        keys[k] = localStorage.getItem(k);
      }
    }
    return keys;
  }

  // ── 클라우드 업로드 ──
  let _uploadTimer = null;
  function scheduleUpload() {
    const un = getUN(); if (!un) return;
    if (_uploadTimer) clearTimeout(_uploadTimer);
    _uploadTimer = setTimeout(() => doUpload(un), 5000);
  }

  function doUpload(un) {
    const db = getDB(); if (!db || !un) return;
    const keys = collectAllKeys(un);
    const payload = { _ts: Date.now(), _un: un, keys };
    db.ref('ggo_sync/' + un).set(payload)
      .then(() => console.log('[Sync] 업로드 완료, 키:', Object.keys(keys).length))
      .catch(e => console.warn('[Sync] 업로드 실패:', e));
  }

  // ── 클라우드 복원 ──
  // force=true: 클라우드 데이터로 무조건 덮어씌움
  async function doRestore(force) {
    const db = getDB();
    const un = getUN();
    if (!db || !un) return false;
    try {
      const snap = await db.ref('ggo_sync/' + un).get();
      if (!snap || !snap.exists()) return false;
      const data = snap.val();
      if (!data || !data.keys) return false;

      // username 변환 (같은 아이디이면 그대로)
      const sourceUN = data._un || un;
      let count = 0;
      Object.entries(data.keys).forEach(([k, v]) => {
        let targetKey = k;
        let targetVal = v;
        // 다른 기기에서 같은 아이디 → 키 그대로
        // 혹시 username이 다를 경우 교체
        if (sourceUN !== un && k.includes(sourceUN)) {
          targetKey = k.split(sourceUN).join(un);
          if (typeof v === 'string' && v.includes(sourceUN))
            targetVal = v.split(sourceUN).join(un);
        }
        // 낚시 통계/보관함/도감은 로컬이 존재하면 절대 덮어쓰지 않음
        const fishProtectedPrefixes = ['ggo_fish_stats_', 'ggo_fish_storage_', 'ggo_fish_dex_'];
        const isFishProtected = fishProtectedPrefixes.some(p => targetKey.startsWith(p));
        if(isFishProtected) {
          const localRaw = localStorage.getItem(targetKey);
          if(localRaw !== null) {
            try {
              const localVal = JSON.parse(localRaw);
              // 로컬에 데이터가 있으면 무조건 유지 (total 0이어도)
              count++;
              return;
            } catch(e) {}
          }
        }
        if (force || localStorage.getItem(targetKey) === null) {
          localStorage.setItem(targetKey, targetVal);
          count++;
        }
      });
      console.log('[Sync] 복원 완료, 키:', count, '개 (force:', force, ')');
      return Object.keys(data.keys).length > 0;
    } catch (e) {
      console.warn('[Sync] 복원 실패:', e);
      return false;
    }
  }

  // ── localStorage 변경 감지 → 자동 업로드 ──
  // 기존 setItem을 래핑
  const _origSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    _origSetItem(key, value);
    const un = getUN();
    if (!un) return;
    // 동기화 대상 키인지 확인
    const isSyncKey =
      FIXED_PREFIXES.some(p => key === p + un) ||
      DYNAMIC_PREFIXES.some(p => key.startsWith(p) && key.includes(un));
    if (isSyncKey) scheduleUpload();
  };

  // ── 페이지 로드 시 자동 복원 ──
  async function onPageLoad() {
    const un = getUN();
    if (!un) return; // 로그인 안 된 상태

    const db = getDB();
    if (!db) return;

    // 로컬 타임스탬프 vs 클라우드 타임스탬프 비교
    const localTs = parseInt(localStorage.getItem('ggo_last_sync_' + un) || '0');
    let cloudTs = 0;
    try {
      const tsSnap = await db.ref('ggo_sync/' + un + '/_ts').get();
      cloudTs = tsSnap && tsSnap.exists() ? (tsSnap.val() || 0) : 0;
    } catch (e) { }

    if (cloudTs === 0) {
      // 클라우드에 데이터 없음 → 로컬 → 클라우드 업로드
      doUpload(un);
    } else if (localTs === 0) {
      // 로컬에 동기화 기록 없음 (새 기기) → 클라우드에서 복원
      console.log('[Sync] 새 기기 감지, 클라우드에서 복원 중...');
      const restored = await doRestore(true);
      if (restored) {
        localStorage.setItem('ggo_last_sync_' + un, String(cloudTs));
        console.log('[Sync] 새 기기 복원 완료');
        // 페이지 새로고침으로 복원된 데이터 적용
        if (!window._syncRestored) {
          window._syncRestored = true;
          location.reload();
        }
      }
    } else if (cloudTs > localTs + 10000) {
      // 클라우드가 10초 이상 최신 (다른 기기에서 최근 플레이)
      console.log('[Sync] 다른 기기의 최신 데이터 감지, 동기화 중...');
      const restored = await doRestore(true);
      if (restored) {
        localStorage.setItem('ggo_last_sync_' + un, String(cloudTs));
        console.log('[Sync] 최신 데이터 동기화 완료');
        if (!window._syncRestored) {
          window._syncRestored = true;
          location.reload();
        }
      }
    } else {
      // 로컬이 최신 → 클라우드에 업로드
      doUpload(un);
    }
  }

  // ── 업로드 성공 시 로컬 타임스탬프 갱신 ──
  const _origDoUpload = doUpload;
  function doUploadWithTs(un) {
    const db = getDB(); if (!db || !un) return;
    const keys = collectAllKeys(un);
    const ts = Date.now();
    const payload = { _ts: ts, _un: un, keys };
    db.ref('ggo_sync/' + un).set(payload)
      .then(() => {
        localStorage.setItem('ggo_last_sync_' + un, String(ts));
        console.log('[Sync] 업로드 완료, 키:', Object.keys(keys).length);
      })
      .catch(e => console.warn('[Sync] 업로드 실패:', e));
  }
  // doUpload를 타임스탬프 버전으로 교체
  window._ggoSyncUpload = doUploadWithTs;
  window._ggoSyncRestore = doRestore;

  // ── 이벤트 바인딩 ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onPageLoad);
  } else {
    // 이미 로드됨 (script defer 등)
    setTimeout(onPageLoad, 500);
  }

  // 페이지 언로드 시 즉시 업로드
  window.addEventListener('beforeunload', () => {
    const un = getUN();
    if (un) doUploadWithTs(un);
  });

  console.log('[Sync] GGO PLAY 클라우드 동기화 모듈 로드됨');
})();
