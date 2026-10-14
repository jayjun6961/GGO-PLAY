/*
 * 조합 계산기 데이터 파일
 * 아이템을 추가하거나 수치를 고칠 때는 이 파일만 수정하면 됩니다.
 *
 * - 수치는 게임에 표시된 그대로 (부호 포함) 적습니다. 예) 발사 범위 -26%  →  spread: -26
 * - 능력 향상인지 저하인지는 STATS 의 low 값으로 자동 판단합니다.
 *     low: true  → 수치가 낮을수록 좋은 능력치 (발사 범위, 재장전 시간, 반동 등)
 *     low 없음   → 수치가 높을수록 좋은 능력치
 * - 점수 계산: 능력치 하나의 "가장 좋은 단일 수치"가 100점입니다. (STATS 의 w 로 중요도를 조절할 수 있습니다.)
 */

export const WEIGHTS = { atk: 0.5, def: 0.3, util: 0.2 };   // 공격 50%, 방어 30%, 유틸리티 20%
export const POWER_SCALE = 10000;                            // 전투력 표시 배율

export const CHARACTERS = [{ id: "graviel", name: "그라비엘" }];

/* cat: atk(공격) / def(방어) / util(유틸리티), unit: 표시 단위, low: 낮을수록 좋음, w: 중요도 배수(기본 1) */
export const STATS = {
  // 방어
  hpRegen:       { ko: "초당 체력", en: "HP regen /s", cat: "def", unit: "" },
  armorRegen:    { ko: "초당 방어력", en: "Armor regen /s", cat: "def", unit: "" },
  maxHp:         { ko: "최대 체력", en: "Max HP", cat: "def", unit: "%" },
  maxArmor:      { ko: "최대 방어력", en: "Max armor", cat: "def", unit: "%" },
  healTeamRegen: { ko: "팀 치유 시 초당 체력 재생", en: "HP regen /s during team heal", cat: "def", unit: "" },
  healDmgTaken:  { ko: "치유 중 받는 대미지", en: "Damage taken while healing", cat: "def", unit: "%", low: true },
  // 공격
  spread:        { ko: "무기 발사 범위", en: "Weapon spread", cat: "atk", unit: "%", low: true },
  adsSpread:     { ko: "조준 시 발사 범위", en: "Spread when aiming", cat: "atk", unit: "%", low: true },
  moveSpread:    { ko: "이동 중 발사 범위", en: "Spread while moving", cat: "atk", unit: "%", low: true },
  spreadCoef:    { ko: "확산 계수", en: "Spread factor", cat: "atk", unit: "%", low: true },
  recoil:        { ko: "무기 반동", en: "Recoil", cat: "atk", unit: "%", low: true },
  adsRange:      { ko: "조준 시 무기 사거리", en: "Range when aiming", cat: "atk", unit: "" },
  range:         { ko: "발사 거리", en: "Firing range", cat: "atk", unit: "" },
  fireRate:      { ko: "발사 속도", en: "Fire rate", cat: "atk", unit: "%" },
  pen:           { ko: "관통 파워", en: "Penetration power", cat: "atk", unit: "" },
  armorPen:      { ko: "방어력 관통", en: "Armor penetration", cat: "atk", unit: "" },
  armorPenPct:   { ko: "방어력 관통(%)", en: "Armor penetration (%)", cat: "atk", unit: "%" },
  vsArmorDmg:    { ko: "방어력 상대 대미지", en: "Damage vs armor", cat: "atk", unit: "%" },
  vsHpDmg:       { ko: "체력 상대 대미지", en: "Damage vs HP", cat: "atk", unit: "%" },
  skillZoneDmg:  { ko: "스킬 구역 상대 대미지", en: "Damage in skill zone", cat: "atk", unit: "%" },
  // 유틸리티
  view:          { ko: "시야 범위", en: "Vision range", cat: "util", unit: "" },
  moveSpeed:     { ko: "이동 속도", en: "Move speed", cat: "util", unit: "%" },
  adsMove:       { ko: "조준 시 이동 속도", en: "Move speed when aiming", cat: "util", unit: "%" },
  runNoise:      { ko: "달리기 소음", en: "Running noise", cat: "util", unit: "%", low: true },
  adsTime:       { ko: "무기 조준 시간", en: "Aim time", cat: "util", unit: "%", low: true },
  reload:        { ko: "재장전 시간", en: "Reload time", cat: "util", unit: "%", low: true },
  swap:          { ko: "기본 무기 전환 시간", en: "Weapon swap time", cat: "util", unit: "%", low: true },
  ammoPick:      { ko: "탄약 줍기 시간", en: "Ammo pickup time", cat: "util", unit: "%", low: true },
  itemPick:      { ko: "아이템 줍기 시간", en: "Item pickup time", cat: "util", unit: "%", low: true },
  boxOpen:       { ko: "상자 열기 시간", en: "Crate opening time", cat: "util", unit: "%", low: true },
  magazine:      { ko: "탄창", en: "Magazine", cat: "util", unit: "" },
  skillDur:      { ko: "스킬 지속 시간", en: "Skill duration", cat: "util", unit: "" }
};

/* 세트 효과. 아래 목록은 게임 표기대로 "그 단계에서 적용되는 효과 전체"입니다. (낮은 단계 효과가 포함되어 있어 합치지 않고 가장 높은 단계 하나만 적용합니다.) */
export const SETS = {
  g: {
    ko: "중력의 힘", en: "Gravity Force",
    tiers: {
      2: { healTeamRegen: 10, maxArmor: 10 },
      4: { healTeamRegen: 10, maxArmor: 10, boxOpen: -40, skillDur: 1, healDmgTaken: -20 },
      6: { healTeamRegen: 10, maxArmor: 10, boxOpen: -40, skillDur: 1, healDmgTaken: -20, adsRange: 21, skillZoneDmg: 10 }
    }
  },
  b: {
    ko: "바이오 노드", en: "Bio Node",
    tiers: {
      2: { armorPen: 2 },
      4: { armorPen: 2, magazine: 3 },
      6: { armorPen: 2, magazine: 3, runNoise: -11, boxOpen: -15 }
    }
  }
};

/* 장비 (set: g = 중력의 힘, b = 바이오 노드) */
export const EQUIP = [
  { id: "hat", ko: "모자", en: "Hat", items: [
    { name: "중력의 힘 바이저", set: "g", fx: { hpRegen: 19, view: 66 } },
    { name: "바이오 노드 EYE", set: "b", fx: { spread: -26, adsMove: 19 } },
    { name: "보호 안경", fx: { view: 67 } },
    { name: "지휘관의 베레모", fx: { runNoise: -27 } },
    { name: "전투 헤드밴드", fx: { adsRange: 26 } },
    { name: "전술 광학", fx: { spread: -27 } },
    { name: "특수부대 광학", fx: { adsTime: -26 } }
  ] },
  { id: "body", ko: "몸통", en: "Body", items: [
    { name: "중력의 힘 방어구", set: "g", fx: { pen: 11, maxHp: 13 } },
    { name: "보병 조끼", fx: { maxHp: 14 } },
    { name: "바이오 노드 HEART", set: "b", fx: { pen: 11, armorPen: 10 } },
    { name: "일반 몸통 방어구", fx: { maxArmor: 14 } },
    { name: "리플렉스 임플란트", fx: { recoil: -39 } },
    { name: "방어구 임플란트", fx: { armorRegen: 19 } },
    { name: "치유 임플란트", fx: { hpRegen: 19 } }
  ] },
  { id: "glove", ko: "장갑", en: "Gloves", items: [
    { name: "중력의 힘 장갑", set: "g", fx: { armorRegen: 19, armorPen: 11 } },
    { name: "스파이크 어깨", fx: { armorPenPct: 18 } },
    { name: "전술 장갑", fx: { reload: -39, swap: -39 } },
    { name: "일반 어깨 패드", fx: { vsArmorDmg: 14 } },
    { name: "특수부대 장갑", fx: { ammoPick: -39 } },
    { name: "기술 어깨", fx: { itemPick: -39 } },
    { name: "바이오 노드 ARM", set: "b", fx: { reload: -26, itemPick: -37 } }
  ] },
  { id: "shoes", ko: "신발", en: "Boots", items: [
    { name: "중력의 힘 부츠", set: "g", fx: { moveSpeed: 12, reload: -26 } },
    { name: "러너 부츠", fx: { moveSpeed: 14 } },
    { name: "테코 무릎 패드", fx: { fireRate: 14 } },
    { name: "일반 부츠", fx: { moveSpread: -27 } },
    { name: "정교한 임플란트", fx: { adsMove: 32 } },
    { name: "바이오 노드 LEG", set: "b", fx: { adsTime: -26, moveSpread: -26 } },
    { name: "전술 무릎 패드", fx: { adsSpread: -27 } }
  ] },
  { id: "acc1", ko: "악세1", en: "Accessory 1", items: [
    { name: "중력의 힘 밴드", set: "g", fx: { vsArmorDmg: 12, vsHpDmg: 11 } },
    { name: "폭력배 너클", fx: { vsHpDmg: 11 } },
    { name: "결혼 반지", fx: { vsArmorDmg: 11 } },
    { name: "자물쇠 부적", fx: { ammoPick: -19 } },
    { name: "바이오 노드 RING", set: "b", fx: { armorRegen: 19 } },
    { name: "에너지 코일", fx: { armorRegen: 12 } },
    { name: "개인 ID반지", fx: { hpRegen: 12 } }
  ] },
  { id: "acc2", ko: "악세2", en: "Accessory 2", items: [
    { name: "중력의 힘 수류탄", set: "g", fx: { recoil: -38, runNoise: -26 } },
    { name: "에코 레이더", fx: { view: 51 } },
    { name: "스캔 플래시라이트", fx: { maxHp: 11 } },
    { name: "바이오 노드 RAD", set: "b", fx: { adsSpread: -27 } },
    { name: "폭발 장치", fx: { adsRange: 17 } },
    { name: "스파이 구체", fx: { maxArmor: 11 } },
    { name: "가스 수류탄", fx: { armorPenPct: 11 } }
  ] }
];

/* 무기 부품: 능력 향상과 능력 저하를 한 곳에 적습니다. (lv: 등급) */
export const WEAPONS = [
  { id: "muzzle", ko: "총구", en: "Muzzle", items: [
    { name: "스러슬", lv: 4, fx: { fireRate: 9, spread: 9 } },
    { name: "벨로럽트", lv: 4, fx: { pen: 4, magazine: -4 } },
    { name: "제트모", lv: 4, fx: { armorPen: 6, range: -14 } },
    { name: "그래브보어", lv: 5, fx: { fireRate: 10, pen: 5, spread: 10, magazine: -3 } },
    { name: "펄스트라인", lv: 5, fx: { armorPen: 8, pen: 5, magazine: -3, range: -16 } }
  ] },
  { id: "scope", ko: "조준기", en: "Scope", items: [
    { name: "레티날리스", lv: 4, fx: { spread: -14, pen: -4 } },
    { name: "게이전", lv: 4, fx: { moveSpread: -14, reload: 9 } },
    { name: "포큘론", lv: 4, fx: { spreadCoef: -14, magazine: -4 } },
    { name: "패럴랙시스", lv: 5, fx: { spread: -15, moveSpread: -15, reload: 10, pen: -3 } },
    { name: "록리프트", lv: 5, fx: { moveSpread: -15, spreadCoef: -15, reload: 10, magazine: -3 } }
  ] },
  { id: "spring", ko: "스프링", en: "Spring", items: [
    { name: "오실란", lv: 4, fx: { moveSpread: -14, range: -14 } },
    { name: "리코일럭스", lv: 4, fx: { magazine: 4, reload: 9 } },
    { name: "엘라스트릭스", lv: 4, fx: { armorPen: 6, fireRate: -7 } },
    { name: "텐서론", lv: 5, fx: { moveSpread: -15, magazine: 5, reload: 10, range: -16 } },
    { name: "키네트레스", lv: 5, fx: { magazine: 5, armorPen: 8, fireRate: -8, reload: 10 } }
  ] },
  { id: "grip", ko: "그립", en: "Grip", items: [
    { name: "마그힐트", lv: 4, fx: { fireRate: 9, range: -14 } },
    { name: "이너틱스", lv: 4, fx: { spreadCoef: -14, adsRange: -12 } },
    { name: "앵크랙스", lv: 4, fx: { range: 18, fireRate: -7 } },
    { name: "그래브브레이스", lv: 5, fx: { fireRate: 10, spreadCoef: -15, range: -16, adsRange: -15 } },
    { name: "클램프헥스", lv: 5, fx: { spreadCoef: -15, range: 21, fireRate: -8, adsRange: -15 } }
  ] }
];
