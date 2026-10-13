import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, deleteUser } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, where, addDoc, writeBatch, serverTimestamp, Timestamp, increment } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

/* 각 메뉴의 실제 페이지 주소가 정해지면 아래에 넣으면 됩니다. 비어 있으면 안내 토스트만 표시됩니다. */
var ROUTES = { combo: "", league: "", channel: "" };

var ICONS = {
  combo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8M8 12h2M12 12h2M8 16h2M12 16h4"/></svg>',
  league: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4"/></svg>',
  channel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13M13 4l4 4-4 4M20 16H7M11 12l-4 4 4 4"/></svg>',
  go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>'
};

/* ---------- 메인 화면 문구 ---------- */
var T = {
  ko: {
    sub: "불릿에코 정보 공유 사이트",
    banner: "조합 계산기, 리그/대회, 서버 이동을 한곳에서 확인하세요. 메뉴를 선택하면 오른쪽에서 미리보기를 볼 수 있습니다.",
    menuTitle: "바로가기", infoTitle: "사이트 정보", prevTitle: "미리보기", tipTitle: "팁",
    lbl1: "제공 메뉴", val1: "3개", lbl2: "기준 시간", val2: "한국 시간 (KST)",
    open: "페이지 열기", soon: "아직 연결된 페이지가 없습니다. 주소가 정해지면 열립니다.",
    sample: "예시 데이터입니다. 실제 값은 각 페이지에서 확인하세요.",
    foot: [
      "최적 잠재 계산기에서 사용된 모든 불릿에코 리소스의 저작권은 ZeptoLab UK에 있습니다.",
      "GGO PLAY는 ZeptoLab UK의 제휴, 후원 또는 승인을 받지 않은 콘텐츠입니다.",
      "기타 문의는 카카오톡 오픈채팅으로 보내주시길 바랍니다."
    ],
    menus: {
      combo: { name: "조합 계산기", desc: "장비·무기 조합의 전투력 효율을 비교합니다." },
      league: { name: "리그/대회", desc: "길드 대회 일정과 순위를 확인합니다." },
      channel: { name: "서버 이동", desc: "접속할 서버를 고르고 이동합니다." }
    },
    data: {
      combo: {
        cols: ["순위", "무기", "장비", "모듈", "효율"], top: 0,
        rows: [["1위", "A", "2", "3", "100.00%"], ["2위", "A", "1", "4", "99.32%"], ["3위", "B", "2", "3", "99.18%"], ["4위", "A", "3", "2", "99.03%"], ["5위", "B", "1", "4", "98.83%"]],
        tips: ["효율은 1위 조합을 100%로 놓고 비교합니다.", "설정을 모두 끝낸 뒤 결과를 확인하세요.", "결과는 참고용이며 실제 게임과 차이가 있을 수 있습니다."]
      },
      league: {
        cols: ["대회", "일시", "상태"],
        rows: [["GGO LEAGUE", "매주 토요일 22:00", ["진행 중", "good"]], ["GGO MASTERS", "2027년 예정", ["예정", "warn"]], ["GGO ALL STAR", "2027년 예정", ["예정", "warn"]], ["GGO CHAMPIONS", "2027년 예정", ["예정", "warn"]]],
        tips: ["현재는 GGO LEAGUE만 진행 중이며 매주 토요일 22:00에 열립니다.", "GGO MASTERS, GGO ALL STAR, GGO CHAMPIONS는 2027년에 진행될 예정입니다.", "일정은 한국 시간(KST) 기준입니다."]
      },
      channel: {
        cols: ["서버", "혼잡도", "이동 신청"],
        rows: [["꼬리아1", ["혼잡", "bad"], "go"], ["꼬리아2", ["혼잡", "bad"], "go"], ["꼬리별", ["여유", "good"], "go"]],
        conds: {
          "꼬리아1": "1만 트로피 이상, 일일 금고 필수, 7일 미접시 추방",
          "꼬리아2": "1만 트로피 이상, 일일 금고 필수, 14일 미접시 추방",
          "꼬리별": "트로피 제한 없음, 일일 금고 선택, 20일 미접시 추방"
        },
        goLabel: "이동 신청"
      }
    }
  },
  en: {
    sub: "Bullet Echo info hub",
    banner: "Check the combo calculator, leagues and tournaments, and server switching in one place. Pick a menu to see a preview on the right.",
    menuTitle: "Quick links", infoTitle: "About this site", prevTitle: "Preview", tipTitle: "Tips",
    lbl1: "Menus", val1: "3", lbl2: "Time zone", val2: "Korea Time (KST)",
    open: "Open page", soon: "This page is not linked yet. It will open once an address is set.",
    sample: "Sample data. See each page for real values.",
    foot: [
      "All Bullet Echo resources used in the Optimal Potential Calculator are copyrighted by ZeptoLab UK.",
      "GGO PLAY is not affiliated with, sponsored by, or endorsed by ZeptoLab UK.",
      "For other inquiries, please contact us via KakaoTalk Open Chat."
    ],
    menus: {
      combo: { name: "Combo Calculator", desc: "Compare combat efficiency of gear and weapon combos." },
      league: { name: "Leagues & Tournaments", desc: "See guild tournament schedules and rankings." },
      channel: { name: "Server Switch", desc: "Pick a server and move to it." }
    },
    data: {
      combo: {
        cols: ["Rank", "Weapon", "Gear", "Module", "Efficiency"], top: 0,
        rows: [["1st", "A", "2", "3", "100.00%"], ["2nd", "A", "1", "4", "99.32%"], ["3rd", "B", "2", "3", "99.18%"], ["4th", "A", "3", "2", "99.03%"], ["5th", "B", "1", "4", "98.83%"]],
        tips: ["Efficiency is measured against the top combo at 100%.", "Finish all settings, then check the results.", "Results are for reference and may differ from the game."]
      },
      league: {
        cols: ["Event", "When", "Status"],
        rows: [["GGO LEAGUE", "Every Saturday 22:00", ["Live", "good"]], ["GGO MASTERS", "Planned for 2027", ["Upcoming", "warn"]], ["GGO ALL STAR", "Planned for 2027", ["Upcoming", "warn"]], ["GGO CHAMPIONS", "Planned for 2027", ["Upcoming", "warn"]]],
        tips: ["Only GGO LEAGUE is running now, every Saturday at 22:00.", "GGO MASTERS, GGO ALL STAR and GGO CHAMPIONS are planned for 2027.", "Times are in Korea Time (KST)."]
      },
      channel: {
        cols: ["Server", "Load", "Request"],
        rows: [["꼬리아1", ["Busy", "bad"], "go"], ["꼬리아2", ["Busy", "bad"], "go"], ["꼬리별", ["Low", "good"], "go"]],
        conds: {
          "꼬리아1": "10,000+ trophies, daily vault required, removed after 7 days of inactivity",
          "꼬리아2": "10,000+ trophies, daily vault required, removed after 14 days of inactivity",
          "꼬리별": "No trophy limit, daily vault optional, removed after 20 days of inactivity"
        },
        goLabel: "Request move"
      }
    }
  }
};

/* ---------- 로그인·가입·승인 화면 문구 ---------- */
var S = {
  ko: {
    loginTitle: "로그인", loginSub: "GGO PLAY는 길드원만 이용할 수 있습니다.",
    userId: "아이디", password: "비밀번호", loginBtn: "로그인", forgot: "비밀번호를 잊으셨나요?",
    noAccount: "아직 계정이 없나요?", goSignup: "회원가입", haveAccount: "이미 계정이 있나요?", goLogin: "로그인",
    errId: "아이디를 입력하세요.", errIdFormat: "아이디는 영문 소문자와 숫자 4~16자로 입력하세요.", idHint: "영문 소문자와 숫자 4~16자", errPw: "비밀번호를 입력하세요.",
    resetInfo: "비밀번호 재설정은 길드 운영진에게 문의해 주세요.",
    show: "표시", hide: "숨김",
    stepInvite: "1. 초대 코드", stepInfo: "2. 정보 입력", stepWait: "3. 승인 대기",
    inviteTitle: "초대 코드 입력", inviteSub: "길드 운영진에게 받은 초대 코드를 입력하세요.",
    inviteLabel: "초대 코드", inviteBtn: "코드 확인", inviteHelp: "코드가 없다면 길드 운영진에게 문의하세요.",
    errInvite: "초대 코드는 영문 대문자, 숫자, 하이픈으로 4~20자입니다.", codeOk: "초대 코드가 확인되었습니다.",
    infoTitle: "회원 정보 입력", infoSub: "게임 닉네임은 운영진이 길드 명단과 대조하는 데 쓰입니다.",
    nick: "게임 닉네임", pw2: "비밀번호 확인", agree: "길드원이며, 운영진이 길드 명단과 확인하는 것에 동의합니다.",
    submitBtn: "가입 신청", back: "이전",
    errNick: "닉네임은 2~12자로 입력하세요.", errPwShort: "비밀번호는 6자 이상이어야 합니다.", errPw2: "비밀번호가 일치하지 않습니다.", errAgree: "동의가 필요합니다.",
    pendTitle: "운영진 승인을 기다리고 있습니다", pendDesc: "길드원 확인이 끝나면 모든 메뉴를 이용할 수 있습니다. 승인 전에는 이용할 수 없습니다.",
    kvNick: "게임 닉네임", kvId: "아이디", kvCode: "초대 코드", kvTime: "신청 시각",
    tl1: "가입 신청 접수", tl1d: "신청이 접수되었습니다.", tl2: "운영진 확인", tl2d: "길드 명단과 닉네임을 대조하는 중입니다.",
    tl3: "이용 시작", tl3d: "승인되면 로그인해서 바로 이용할 수 있습니다.",
    refresh: "승인 상태 확인", stillPending: "아직 승인 대기 중입니다.", contact: "문의는 카카오톡 오픈채팅으로 보내주세요.",
    logout: "로그아웃", loggedOut: "로그아웃했습니다.", adminNav: "승인 관리", homeNav: "메인으로",
    roleAdmin: "운영진", roleMember: "길드원", statusPending: "승인 대기",
    adminTitle: "승인 관리", adminSub: "가입 신청 승인, 회원 관리, 초대 코드 발급을 할 수 있습니다.",
    tabReq: "가입 신청", tabMem: "회원", tabCode: "초대 코드",
    thNick: "닉네임", thId: "아이디", thTime: "신청 시각", thCode: "초대 코드", thRole: "권한", thJoined: "가입일", thStatus: "상태", thAction: "관리", thExpire: "만료일",
    approve: "승인", reject: "거절", emptyReq: "대기 중인 가입 신청이 없습니다.",
    approved: "{n}님을 승인했습니다.", rejected: "{n}님의 신청을 거절했습니다.",
    statusActive: "활성", statusOff: "비활성", deactivate: "비활성화", activate: "활성화",
    deactivated: "{n}님을 비활성화했습니다.", activated: "{n}님을 활성화했습니다.",
    newCode: "새 코드 발급", newCodeDone: "새 초대 코드를 발급했습니다.",
    useAvail: "사용 가능", useUsed: "사용됨", useExpired: "만료",
    copy: "복사", copied: "복사했습니다.", copyFail: "복사하지 못했습니다. 코드를 직접 선택해 복사하세요.",
    sampleAdmin: "예시 데이터입니다.", codeNote: "사용 횟수를 다 쓰거나 만료되면 자동으로 막히고, 중지하면 바로 쓸 수 없게 됩니다."
  },
  en: {
    loginTitle: "Log in", loginSub: "GGO PLAY is for guild members only.",
    userId: "ID", password: "Password", loginBtn: "Log in", forgot: "Forgot your password?",
    noAccount: "No account yet?", goSignup: "Sign up", haveAccount: "Already have an account?", goLogin: "Log in",
    errId: "Enter your ID.", errIdFormat: "ID must be 4 to 16 lowercase letters or numbers.", idHint: "Lowercase letters and numbers, 4 to 16 characters", errPw: "Enter your password.",
    resetInfo: "To reset your password, please ask a guild officer.",
    show: "Show", hide: "Hide",
    stepInvite: "1. Invite code", stepInfo: "2. Your info", stepWait: "3. Approval",
    inviteTitle: "Enter invite code", inviteSub: "Enter the invite code you got from a guild officer.",
    inviteLabel: "Invite code", inviteBtn: "Check code", inviteHelp: "No code? Ask a guild officer.",
    errInvite: "Invite codes use 4 to 20 uppercase letters, numbers, or hyphens.", codeOk: "Invite code confirmed.",
    infoTitle: "Your information", infoSub: "Officers use your in-game nickname to check the guild roster.",
    nick: "In-game nickname", pw2: "Confirm password", agree: "I am a guild member and agree to officers checking the guild roster.",
    submitBtn: "Request access", back: "Back",
    errNick: "Nickname must be 2 to 12 characters.", errPwShort: "Password must be at least 6 characters.", errPw2: "Passwords do not match.", errAgree: "Please agree to continue.",
    pendTitle: "Waiting for officer approval", pendDesc: "Once your guild membership is confirmed you can use every menu. You cannot use the site before approval.",
    kvNick: "Nickname", kvId: "ID", kvCode: "Invite code", kvTime: "Requested at",
    tl1: "Request received", tl1d: "Your request has been received.", tl2: "Officer check", tl2d: "An officer is matching your nickname to the guild roster.",
    tl3: "Start using", tl3d: "After approval, log in and start using the site.",
    refresh: "Check approval status", stillPending: "Still waiting for approval.", contact: "For questions, message us on KakaoTalk Open Chat.",
    logout: "Log out", loggedOut: "You are logged out.", adminNav: "Approvals", homeNav: "Back to home",
    roleAdmin: "Officer", roleMember: "Member", statusPending: "Pending",
    adminTitle: "Approvals", adminSub: "Approve sign-ups, manage members, and issue invite codes.",
    tabReq: "Requests", tabMem: "Members", tabCode: "Invite codes",
    thNick: "Nickname", thId: "ID", thTime: "Requested", thCode: "Invite code", thRole: "Role", thJoined: "Joined", thStatus: "Status", thAction: "Actions", thExpire: "Expires",
    approve: "Approve", reject: "Reject", emptyReq: "No pending requests.",
    approved: "Approved {n}.", rejected: "Rejected the request from {n}.",
    statusActive: "Active", statusOff: "Inactive", deactivate: "Deactivate", activate: "Activate",
    deactivated: "Deactivated {n}.", activated: "Activated {n}.",
    newCode: "Issue new code", newCodeDone: "A new invite code was issued.",
    useAvail: "Available", useUsed: "Used", useExpired: "Expired",
    copy: "Copy", copied: "Copied.", copyFail: "Could not copy. Select the code and copy it by hand.",
    sampleAdmin: "Sample data.", codeNote: "A code stops working when its uses run out or it expires, and right away when you pause it."
  }
};

/* ---------- Firebase ---------- */
/* 로그인 아이디는 내부적으로 "아이디@ggo-play.local" 형태의 이메일로 바꿔서 Firebase Authentication에 보냅니다. */
var app = initializeApp(firebaseConfig);
var auth = getAuth(app);
var db = getFirestore(app);
var ID_DOMAIN = "@ggo-play.local";

Object.assign(S.ko, {
  errLogin: "아이디 또는 비밀번호가 올바르지 않습니다.",
  errTooMany: "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  errNetwork: "네트워크 연결을 확인해 주세요.",
  errIdTaken: "이미 사용 중인 아이디입니다.",
  errInviteNone: "존재하지 않는 초대 코드입니다.",
  errInviteUsed: "사용할 수 없는 초대 코드입니다. 코드를 다시 확인해 주세요.",
  errInviteExpired: "만료된 초대 코드입니다.",
  errOff: "이용할 수 없는 계정입니다. 운영진에게 문의해 주세요.",
  errNoProfile: "가입 정보를 찾을 수 없습니다. 운영진에게 문의해 주세요.",
  errGeneric: "문제가 생겼습니다. 잠시 후 다시 시도해 주세요.",
  errPerm: "권한이 없거나 Firebase 설정이 아직 끝나지 않았습니다.",
  errAuthOff: "Firebase Authentication에서 이메일/비밀번호 로그인이 꺼져 있습니다.",
  loading: "불러오는 중...",
  loadFail: "목록을 불러오지 못했습니다. 새로고침해 주세요.",
  approvedNow: "승인되었습니다. 메인으로 이동합니다.",
  actionFail: "처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  errInviteFull: "사용 가능 횟수가 모두 소진된 초대 코드입니다.",
  thUses: "사용 현황", unlimited: "무제한", noExpiry: "없음",
  useOff: "중지됨", useFull: "소진", pause: "중지", resume: "재개",
  emptyCodes: "만든 초대 코드가 없습니다. 위에서 새로 만들어 주세요.",
  acCodeLabel: "초대 코드 (비우면 자동 생성)", acMaxLabel: "사용 가능 횟수", acExpLabel: "만료",
  exp7: "7일 후", exp30: "30일 후", exp90: "90일 후", expNone: "만료 없음",
  createBtn: "코드 만들기",
  errCodeFmt: "코드는 영문 대문자, 숫자, 하이픈 4~20자로 입력하세요.",
  errCodeExists: "이미 있는 코드입니다.",
  errMax: "사용 횟수는 1 이상의 숫자로 입력하세요.",
  codePaused: "초대 코드를 중지했습니다.", codeResumed: "초대 코드를 다시 쓸 수 있게 했습니다.",
  condTitle: "조건", moveOpen: "이동 신청하기",
  moveTitle: "서버 이동 신청", moveSub: "서버 혼잡도와 관계없이 신청할 수 있습니다. 운영진이 조건을 확인한 뒤 승인하면 이동합니다.",
  mvTarget: "희망 서버", mvFrom: "현재 서버", mvOther: "그 외 / 없음", mvTrophy: "현재 트로피", mvNote: "메모 (선택, 100자 이내)",
  mvSubmit: "이동 신청하기", myMoves: "내 신청 내역", noMoves: "신청 내역이 없습니다.", moveBack: "메인으로",
  errTrophy: "트로피는 0 이상의 숫자로 입력하세요.", errMoveSame: "현재 서버와 같은 서버로는 신청할 수 없습니다.",
  movePendingExists: "처리 중인 신청이 있습니다. 결과가 나온 뒤 다시 신청해 주세요.", moveSent: "이동 신청을 보냈습니다.",
  mvStPending: "대기 중", mvStApproved: "승인", mvStRejected: "거절",
  tabMove: "서버 이동", thTarget: "희망 서버", thFrom: "현재 서버", thTrophy: "트로피", thMemo: "메모", thResult: "결과", thDecided: "처리 시각",
  emptyMoves: "대기 중인 서버 이동 신청이 없습니다.", historyTitle: "처리 내역",
  moveApproved: "{n}님의 서버 이동을 승인했습니다.", moveRejected: "{n}님의 서버 이동을 거절했습니다."
});
Object.assign(S.en, {
  errLogin: "The ID or password is not correct.",
  errTooMany: "Too many attempts. Please try again in a moment.",
  errNetwork: "Check your network connection.",
  errIdTaken: "That ID is already taken.",
  errInviteNone: "That invite code does not exist.",
  errInviteUsed: "That invite code cannot be used. Please check the code again.",
  errInviteExpired: "That invite code has expired.",
  errOff: "This account cannot be used. Please ask a guild officer.",
  errNoProfile: "Sign-up details were not found. Please ask a guild officer.",
  errGeneric: "Something went wrong. Please try again in a moment.",
  errPerm: "You do not have permission, or the Firebase setup is not finished.",
  errAuthOff: "Email/password sign-in is turned off in Firebase Authentication.",
  loading: "Loading...",
  loadFail: "Could not load the list. Please refresh.",
  approvedNow: "You are approved. Going to the home page.",
  actionFail: "Could not complete that. Please try again in a moment.",
  errInviteFull: "That invite code has no uses left.",
  thUses: "Uses", unlimited: "Unlimited", noExpiry: "None",
  useOff: "Paused", useFull: "Used up", pause: "Pause", resume: "Resume",
  emptyCodes: "No invite codes yet. Create one above.",
  acCodeLabel: "Invite code (leave blank to generate)", acMaxLabel: "Allowed uses", acExpLabel: "Expires",
  exp7: "In 7 days", exp30: "In 30 days", exp90: "In 90 days", expNone: "Never",
  createBtn: "Create code",
  errCodeFmt: "Use 4 to 20 uppercase letters, numbers, or hyphens.",
  errCodeExists: "That code already exists.",
  errMax: "Enter a number of 1 or more.",
  codePaused: "Invite code paused.", codeResumed: "Invite code is active again.",
  condTitle: "Conditions", moveOpen: "Request a move",
  moveTitle: "Server move request", moveSub: "You can request a move whatever the server load is. An officer checks the conditions and approves it.",
  mvTarget: "Server to move to", mvFrom: "Current server", mvOther: "Other / none", mvTrophy: "Current trophies", mvNote: "Note (optional, up to 100 characters)",
  mvSubmit: "Request move", myMoves: "My requests", noMoves: "No requests yet.", moveBack: "Back to home",
  errTrophy: "Enter trophies as a number of 0 or more.", errMoveSame: "You cannot request the server you are already on.",
  movePendingExists: "You already have a request in progress. Please wait for the result.", moveSent: "Your move request was sent.",
  mvStPending: "Pending", mvStApproved: "Approved", mvStRejected: "Rejected",
  tabMove: "Server moves", thTarget: "To", thFrom: "From", thTrophy: "Trophies", thMemo: "Note", thResult: "Result", thDecided: "Decided",
  emptyMoves: "No pending server move requests.", historyTitle: "History",
  moveApproved: "Approved the server move for {n}.", moveRejected: "Rejected the server move for {n}."
});

var order = ["combo", "league", "channel"];
var VIEWS = ["loading", "login", "signup", "pending", "admin", "home", "move"];
var SERVERS = ["꼬리아1", "꼬리아2", "꼬리별"];
var state = { lang: "ko", menu: "combo", view: "loading", tab: "req", signup: { step: 1, code: "" }, user: null, busy: false, moveTarget: "꼬리아1", moveFrom: "기타" };
var myMoves = { loaded: false, failed: false, items: [] };
var admin = { loaded: false, loading: false, failed: false, requests: [], members: [], codes: [], moves: [] };

/* ---------- 공통 도우미 ---------- */
function $(id) { return document.getElementById(id); }
function s(k) { return S[state.lang][k]; }
function esc(v) {
  return String(v).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function fmtTime(d) { return (d.getMonth() + 1) + "/" + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
function fmtDay(d) { return (d.getMonth() + 1) + "/" + d.getDate(); }
function fmtFull(d) { return d.getFullYear() + "." + pad(d.getMonth() + 1) + "." + pad(d.getDate()); }
function tsMs(x) { return x && x.toMillis ? x.toMillis() : 0; }
function tsDate(x) { return x && x.toDate ? x.toDate() : null; }
function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

function setErr(inputId, msgId, text) {
  var el = $(inputId);
  el.classList.toggle("err", !!text);
  el.setAttribute("aria-invalid", text ? "true" : "false");
  $(msgId).textContent = text || "";
  return !text;
}
function setBusy(formId, on) {
  var btns = $(formId).querySelectorAll("button[type=submit]");
  for (var i = 0; i < btns.length; i++) btns[i].disabled = on;
}
function toast(msg) {
  var el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(function () { el.classList.remove("show"); }, 2800);
}
function errKey(e) {
  var c = e && e.code ? e.code : "";
  if (c === "auth/invalid-credential" || c === "auth/user-not-found" || c === "auth/wrong-password" || c === "auth/invalid-email") return "errLogin";
  if (c === "auth/email-already-in-use") return "errIdTaken";
  if (c === "auth/too-many-requests") return "errTooMany";
  if (c === "auth/network-request-failed") return "errNetwork";
  if (c === "auth/weak-password") return "errPwShort";
  if (c === "auth/operation-not-allowed") return "errAuthOff";
  if (c === "permission-denied") return "errPerm";
  return "errGeneric";
}
var CODE_RE = /^[A-Z0-9][A-Z0-9-]{3,19}$/;
function normalizeCode(v) { return v.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20); }
/* 초대 코드 상태: ok(사용 가능), off(중지), expired(만료), full(횟수 소진) */
function codeStatus(c) {
  if (c.active !== true) return "off";
  if (c.expiresAt && tsMs(c.expiresAt) < Date.now()) return "expired";
  if (c.maxUses > 0 && (c.uses || 0) >= c.maxUses) return "full";
  return "ok";
}
function genCode() {
  var alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  var code = "";
  for (var i = 0; i < 8; i++) code += alpha.charAt(bytes[i] % 32);
  return code.slice(0, 4) + "-" + code.slice(4);
}

/* ---------- 화면 전환 ---------- */
function show(view) {
  var u = state.user;
  var active = !!u && u.status === "active";
  if (view === "admin" && !(active && u.role === "admin")) view = active ? "home" : (u ? "pending" : "login");
  if (view === "home" && !active) view = u ? "pending" : "login";
  if (view === "move" && !active) view = u ? "pending" : "login";
  if (view === "pending" && !(u && u.status === "pending")) view = active ? "home" : "login";
  if ((view === "login" || view === "signup") && u) view = active ? "home" : "pending";
  state.view = view;
  VIEWS.forEach(function (v) { $("v-" + v).hidden = v !== view; });
  renderAll();
  if (view === "admin") fetchAdmin();
  if (view === "move") fetchMyMoves();
  window.scrollTo(0, 0);
}

function toUser(uid, p) {
  var d = tsDate(p.createdAt);
  return { uid: uid, role: p.role, status: p.status, nickname: p.nickname, loginId: p.loginId, code: p.inviteCode, at: d ? fmtTime(d) : "-" };
}
async function loadProfile(uid) {
  var snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

/* 로그인 상태가 바뀔 때마다 users/{uid} 문서를 읽어 어느 화면으로 보낼지 정합니다. */
async function handleAuth(fbUser) {
  if (!fbUser) {
    state.user = null;
    admin.loaded = false;
    if (state.view !== "signup") show("login");
    return;
  }
  var p;
  try {
    p = await loadProfile(fbUser.uid);
  } catch (err) {
    console.error(err);
    await rejectLogin(errKey(err) === "errPerm" ? "errPerm" : "errGeneric");
    return;
  }
  if (!p) { await rejectLogin("errNoProfile"); return; }
  if (p.status === "off" || p.status === "rejected") { await rejectLogin("errOff"); return; }
  state.user = toUser(fbUser.uid, p);
  show(p.status === "pending" ? "pending" : "home");
}
async function rejectLogin(key) {
  state.busy = true;
  try { await signOut(auth); } catch (e) {}
  state.busy = false;
  state.user = null;
  admin.loaded = false;
  show("login");
  setErr("liPw", "liPwErr", s(key));
}

/* ---------- 렌더링 ---------- */
function applyI18n() {
  var nodes = document.querySelectorAll("[data-i18n]");
  for (var i = 0; i < nodes.length; i++) nodes[i].textContent = s(nodes[i].getAttribute("data-i18n"));
  var toggles = document.querySelectorAll(".pw-toggle");
  for (var j = 0; j < toggles.length; j++) {
    var inp = $(toggles[j].getAttribute("data-pw"));
    toggles[j].textContent = inp.type === "password" ? s("show") : s("hide");
  }
}

function renderHeader() {
  var u = state.user;
  var active = !!u && u.status === "active";
  $("userChip").hidden = !u;
  if (u) {
    var role = u.status === "pending" ? s("statusPending") : (u.role === "admin" ? s("roleAdmin") : s("roleMember"));
    $("userChip").textContent = u.nickname + " · " + role;
  }
  $("logoutBtn").hidden = !u;
  $("logoutBtn").textContent = s("logout");
  var showNav = active && u.role === "admin";
  $("navBtn").hidden = !showNav;
  $("navBtn").textContent = state.view === "admin" ? s("homeNav") : s("adminNav");
}

function renderSteps() {
  var items = document.querySelectorAll("#steps .step");
  for (var i = 0; i < items.length; i++) {
    var n = parseInt(items[i].getAttribute("data-step"), 10);
    items[i].className = "step" + (n === state.signup.step ? " on" : (n < state.signup.step ? " done" : ""));
  }
  $("su1").hidden = state.signup.step !== 1;
  $("su2").hidden = state.signup.step !== 2;
  $("codeTag").textContent = state.signup.code;
}

function renderPending() {
  var u = state.user;
  if (!u || u.status !== "pending") return;
  $("pNick").textContent = u.nickname;
  $("pId").textContent = u.loginId;
  $("pCode").textContent = u.code ? u.code.slice(0, 4) + "-••••" : "-";
  $("pTime").textContent = u.at || "-";
}

function tag(cls, text) { return '<span class="tag ' + cls + '">' + esc(text) + "</span>"; }

function renderAdmin() {
  var pendMoves = admin.moves.filter(function (x) { return x.status === "pending"; });
  var tabs = [["req", s("tabReq"), admin.requests.length], ["move", s("tabMove"), pendMoves.length], ["mem", s("tabMem"), 0], ["code", s("tabCode"), 0]];
  $("adminTabs").innerHTML = tabs.map(function (t) {
    return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (state.tab === t[0]) + '">' + esc(t[1]) +
      (t[2] > 0 ? ' <span class="cnt">' + t[2] + "</span>" : "") + "</button>";
  }).join("");

  var html = "";
  var note = "";
  if (!admin.loaded) {
    html = '<p class="empty">' + esc(admin.failed ? s("loadFail") : s("loading")) + "</p>";
  } else if (state.tab === "req") {
    if (!admin.requests.length) {
      html = '<p class="empty">' + esc(s("emptyReq")) + "</p>";
    } else {
      html = '<div class="tbl-wrap"><table><thead><tr><th>' + [s("thNick"), s("thId"), s("thTime"), s("thCode"), s("thAction")].join("</th><th>") + "</th></tr></thead><tbody>" +
        admin.requests.map(function (r) {
          var d = tsDate(r.createdAt);
          return "<tr><td>" + esc(r.nickname) + "</td><td>" + esc(r.loginId) + "</td><td>" + esc(d ? fmtTime(d) : "-") + '</td><td class="code">' + esc(r.inviteCode) + '</td><td><span class="act">' +
            '<button class="mini-btn danger" type="button" data-act="reject" data-id="' + esc(r.id) + '">' + esc(s("reject")) + "</button>" +
            '<button class="mini-btn ok" type="button" data-act="approve" data-id="' + esc(r.id) + '">' + esc(s("approve")) + "</button></span></td></tr>";
        }).join("") + "</tbody></table></div>";
    }
  } else if (state.tab === "move") {
    var pend = pendMoves.slice().sort(function (a, b) { return tsMs(b.createdAt) - tsMs(a.createdAt); });
    var done = admin.moves.filter(function (x) { return x.status !== "pending"; })
      .sort(function (a, b) { return tsMs(b.decidedAt) - tsMs(a.decidedAt); }).slice(0, 20);
    function srvName(v) { return v === "기타" ? s("mvOther") : v; }
    if (!pend.length) {
      html = '<p class="empty">' + esc(s("emptyMoves")) + "</p>";
    } else {
      html = '<div class="tbl-wrap"><table><thead><tr><th>' + [s("thNick"), s("thId"), s("thTarget"), s("thFrom"), s("thTrophy"), s("thMemo"), s("thTime"), s("thAction")].join("</th><th>") + "</th></tr></thead><tbody>" +
        pend.map(function (r) {
          var d = tsDate(r.createdAt);
          return "<tr><td>" + esc(r.nickname) + "</td><td>" + esc(r.loginId) + "</td><td>" + esc(r.toServer) + "</td><td>" + esc(srvName(r.fromServer)) + "</td><td>" +
            esc(Number(r.trophies).toLocaleString()) + '</td><td class="wrap">' + esc(r.note || "-") + "</td><td>" + esc(d ? fmtTime(d) : "-") + '</td><td><span class="act">' +
            '<button class="mini-btn danger" type="button" data-act="moveReject" data-id="' + esc(r.id) + '">' + esc(s("reject")) + "</button>" +
            '<button class="mini-btn ok" type="button" data-act="moveApprove" data-id="' + esc(r.id) + '">' + esc(s("approve")) + "</button></span></td></tr>";
        }).join("") + "</tbody></table></div>";
    }
    if (done.length) {
      html += '<h3 class="sub-title hist">' + esc(s("historyTitle")) + '</h3><div class="tbl-wrap"><table><thead><tr><th>' + [s("thNick"), s("thTarget"), s("thTime"), s("thResult")].join("</th><th>") + "</th></tr></thead><tbody>" +
        done.map(function (r) {
          var d = tsDate(r.decidedAt);
          return "<tr><td>" + esc(r.nickname) + "</td><td>" + esc(r.toServer) + "</td><td>" + esc(d ? fmtTime(d) : "-") + "</td><td>" +
            (r.status === "approved" ? tag("good", s("mvStApproved")) : tag("bad", s("mvStRejected"))) + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    }
  } else if (state.tab === "mem") {
    html = '<div class="tbl-wrap"><table><thead><tr><th>' + [s("thNick"), s("thId"), s("thRole"), s("thJoined"), s("thStatus"), s("thAction")].join("</th><th>") + "</th></tr></thead><tbody>" +
      admin.members.map(function (m) {
        var on = m.status === "active";
        var action = m.role === "admin" ? '<span class="muted">-</span>' :
          '<button class="mini-btn' + (on ? " danger" : "") + '" type="button" data-act="toggle" data-id="' + esc(m.id) + '">' + esc(on ? s("deactivate") : s("activate")) + "</button>";
        var d = tsDate(m.createdAt);
        return "<tr><td>" + esc(m.nickname) + "</td><td>" + esc(m.loginId) + "</td><td>" + tag(m.role === "admin" ? "acc" : "mute", m.role === "admin" ? s("roleAdmin") : s("roleMember")) +
          "</td><td>" + esc(d ? fmtFull(d) : "-") + "</td><td>" + tag(on ? "good" : "mute", on ? s("statusActive") : s("statusOff")) + "</td><td>" + action + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  } else {
    if (!admin.codes.length) {
      html = '<p class="empty">' + esc(s("emptyCodes")) + "</p>";
    } else {
      html = '<div class="tbl-wrap"><table><thead><tr><th>' + [s("thCode"), s("thUses"), s("thExpire"), s("thStatus"), s("thAction")].join("</th><th>") + "</th></tr></thead><tbody>" +
        admin.codes.map(function (c) {
          var st = codeStatus(c);
          var stTag = st === "ok" ? tag("good", s("useAvail")) : (st === "expired" ? tag("bad", s("useExpired")) : (st === "full" ? tag("warn", s("useFull")) : tag("mute", s("useOff"))));
          var uses = (c.uses || 0) + " / " + (c.maxUses > 0 ? c.maxUses : s("unlimited"));
          var d = tsDate(c.expiresAt);
          var acts = '<span class="act">' +
            (st === "ok" ? '<button class="mini-btn" type="button" data-act="copy" data-id="' + esc(c.id) + '">' + esc(s("copy")) + "</button>" : "") +
            '<button class="mini-btn' + (c.active === true ? " danger" : "") + '" type="button" data-act="codeToggle" data-id="' + esc(c.id) + '">' + esc(c.active === true ? s("pause") : s("resume")) + "</button></span>";
          return '<tr><td class="code">' + esc(c.id) + "</td><td>" + esc(uses) + "</td><td>" + esc(d ? fmtDay(d) : s("noExpiry")) + "</td><td>" + stTag + "</td><td>" + acts + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    }
    note = s("codeNote");
  }
  $("codeForm").hidden = !(admin.loaded && state.tab === "code");
  $("adminBody").innerHTML = html;
  $("adminNote").textContent = note;
  $("adminNote").hidden = !note;
}

function renderMenu() {
  var t = T[state.lang];
  $("menu").innerHTML = order.map(function (id) {
    var m = t.menus[id];
    return '<button class="row" type="button" role="tab" data-id="' + id + '" aria-selected="' + (id === state.menu) + '">' +
      '<span class="ico">' + ICONS[id] + "</span>" +
      '<span class="txt"><span class="name">' + m.name + '</span><span class="desc">' + m.desc + "</span></span>" +
      '<span class="go">' + ICONS.go + "</span></button>";
  }).join("");
}

function renderPreview() {
  var t = T[state.lang];
  var d = t.data[state.menu];
  $("thead").innerHTML = "<tr>" + d.cols.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr>";
  $("tbody").innerHTML = d.rows.map(function (r, i) {
    var cells = r.map(function (cell) {
      if (cell === "go") return '<td><button class="mini-btn" type="button" data-move="' + esc(r[0]) + '">' + d.goLabel + "</button></td>";
      if (Array.isArray(cell)) return '<td><span class="tag ' + cell[1] + '">' + cell[0] + "</span></td>";
      return "<td>" + cell + "</td>";
    }).join("");
    var top = (i === (d.top === undefined ? -1 : d.top)) ? ' class="top"' : "";
    return "<tr" + top + ">" + cells + "</tr>";
  }).join("");
  var tipItems = d.conds ? SERVERS.map(function (k) { return "<strong>" + k + "</strong> - " + d.conds[k]; }) : d.tips;
  $("tips").innerHTML = tipItems.map(function (x) { return "<li>" + x + "</li>"; }).join("");
  $("tipTitle").textContent = d.conds ? s("condTitle") : t.tipTitle;
  $("openBtn").textContent = state.menu === "channel" ? s("moveOpen") : t.open;
  $("sampleNote").hidden = state.menu !== "combo";
}

function renderHomeText() {
  var t = T[state.lang];
  $("siteSub").textContent = t.sub;
  $("banner").textContent = t.banner;
  $("menuTitle").textContent = t.menuTitle;
  $("infoTitle").textContent = t.infoTitle;
  $("prevTitle").textContent = t.prevTitle;
  $("tipTitle").textContent = t.tipTitle;
  $("lbl1").textContent = t.lbl1; $("val1").textContent = t.val1;
  $("lbl2").textContent = t.lbl2; $("val2").textContent = t.val2;
  $("openBtn").textContent = t.open;
  $("sampleNote").textContent = t.sample;
  $("foot").innerHTML = t.foot.map(function (l) { return "<p>" + l + "</p>"; }).join("");
  renderMenu();
  renderPreview();
}

function renderAll() {
  document.documentElement.lang = state.lang;
  $("langKo").setAttribute("aria-pressed", state.lang === "ko");
  $("langEn").setAttribute("aria-pressed", state.lang === "en");
  renderHomeText();
  applyI18n();
  renderHeader();
  renderSteps();
  renderPending();
  renderAdmin();
  renderMove();
}

/* ---------- 서버 이동 신청 ---------- */
function renderMove() {
  var tgt = $("mvTarget");
  var frm = $("mvFrom");
  tgt.innerHTML = SERVERS.map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + "</option>"; }).join("");
  frm.innerHTML = SERVERS.map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + "</option>"; }).join("") +
    '<option value="기타">' + esc(s("mvOther")) + "</option>";
  tgt.value = state.moveTarget;
  frm.value = state.moveFrom;
  $("mvCond").textContent = T[state.lang].data.channel.conds[state.moveTarget] || "";
  renderMoveList();
}
function renderMoveList() {
  var box = $("myMoves");
  if (!myMoves.loaded) {
    box.innerHTML = '<p class="note">' + esc(myMoves.failed ? s("loadFail") : s("loading")) + "</p>";
    return;
  }
  if (!myMoves.items.length) {
    box.innerHTML = '<p class="note">' + esc(s("noMoves")) + "</p>";
    return;
  }
  box.innerHTML = '<ul class="mlist">' + myMoves.items.map(function (m) {
    var d = tsDate(m.createdAt);
    var st = m.status === "approved" ? tag("good", s("mvStApproved")) : (m.status === "rejected" ? tag("bad", s("mvStRejected")) : tag("warn", s("mvStPending")));
    var from = m.fromServer === "기타" ? s("mvOther") : m.fromServer;
    return "<li><div><strong>" + esc(m.toServer) + '</strong><span class="d">' + esc(from) + " → " + esc(m.toServer) + " · " +
      esc(Number(m.trophies).toLocaleString()) + " · " + esc(d ? fmtTime(d) : "-") + "</span></div>" + st + "</li>";
  }).join("") + "</ul>";
}
async function fetchMyMoves() {
  if (!state.user) return;
  try {
    var qs = await getDocs(query(collection(db, "moveRequests"), where("uid", "==", state.user.uid)));
    var items = [];
    qs.forEach(function (d) { var x = d.data(); x.id = d.id; items.push(x); });
    items.sort(function (a, b) { return tsMs(b.createdAt) - tsMs(a.createdAt); });
    myMoves.items = items;
    myMoves.loaded = true;
    myMoves.failed = false;
  } catch (err) {
    console.error(err);
    myMoves.failed = true;
  }
  renderMoveList();
}

/* ---------- 운영진 데이터 (Firestore) ---------- */
async function fetchAdmin() {
  if (!admin.loaded) admin.loading = true;
  admin.failed = false;
  renderAdmin();
  try {
    var us = await getDocs(collection(db, "users"));
    var cs = await getDocs(query(collection(db, "inviteCodes"), orderBy("createdAt", "desc")));
    var all = [];
    us.forEach(function (d) { var x = d.data(); x.id = d.id; all.push(x); });
    admin.requests = all.filter(function (x) { return x.status === "pending"; })
      .sort(function (a, b) { return tsMs(b.createdAt) - tsMs(a.createdAt); });
    admin.members = all.filter(function (x) { return x.status === "active" || x.status === "off"; })
      .sort(function (a, b) { return tsMs(a.createdAt) - tsMs(b.createdAt); });
    admin.codes = [];
    cs.forEach(function (d) { var x = d.data(); x.id = d.id; admin.codes.push(x); });
    var ms = await getDocs(collection(db, "moveRequests"));
    admin.moves = [];
    ms.forEach(function (d) { var x = d.data(); x.id = d.id; admin.moves.push(x); });
    admin.loaded = true;
  } catch (err) {
    console.error(err);
    admin.failed = true;
  }
  admin.loading = false;
  renderAdmin();
}

/* ---------- 이벤트 ---------- */
function openMove(target) {
  if (target) state.moveTarget = target;
  show("move");
}
function go() {
  if (state.menu === "channel") { openMove(""); return; }
  var url = ROUTES[state.menu];
  if (url) { window.location.href = url; } else { toast(T[state.lang].soon); }
}

$("menu").addEventListener("click", function (e) {
  var btn = e.target.closest(".row");
  if (!btn) return;
  state.menu = btn.getAttribute("data-id");
  renderMenu();
  renderPreview();
});
$("tbody").addEventListener("click", function (e) {
  var mb = e.target.closest("[data-move]");
  if (mb) openMove(mb.getAttribute("data-move"));
});
$("openBtn").addEventListener("click", go);

$("langKo").addEventListener("click", function () { state.lang = "ko"; safeSet("ggo-lang", "ko"); renderAll(); });
$("langEn").addEventListener("click", function () { state.lang = "en"; safeSet("ggo-lang", "en"); renderAll(); });
$("themeBtn").addEventListener("click", function () {
  var root = document.documentElement;
  var cur = root.getAttribute("data-theme");
  if (!cur) cur = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  var next = cur === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  safeSet("ggo-theme", next);
});

$("brand").addEventListener("click", function (e) {
  e.preventDefault();
  if (state.view === "loading") return;
  show(state.user ? (state.user.status === "active" ? "home" : "pending") : "login");
});
$("navBtn").addEventListener("click", function () { show(state.view === "admin" ? "home" : "admin"); });
$("logoutBtn").addEventListener("click", async function () {
  try { await signOut(auth); } catch (e) {}
  state.user = null;
  state.signup = { step: 1, code: "" };
  admin.loaded = false;
  myMoves.items = [];
  myMoves.loaded = false;
  toast(s("loggedOut"));
  show("login");
});

document.addEventListener("click", function (e) {
  var g = e.target.closest("[data-go]");
  if (g) {
    var to = g.getAttribute("data-go");
    if (to === "signup") state.signup = { step: 1, code: "" };
    show(to);
    return;
  }
  var pw = e.target.closest(".pw-toggle");
  if (pw) {
    var inp = $(pw.getAttribute("data-pw"));
    inp.type = inp.type === "password" ? "text" : "password";
    pw.textContent = inp.type === "password" ? s("show") : s("hide");
  }
});

/* 로그인 */
$("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  var id = $("liId").value.trim().toLowerCase();
  var pw = $("liPw").value;
  var ok1 = setErr("liId", "liIdErr", id ? "" : s("errId"));
  var ok2 = setErr("liPw", "liPwErr", pw ? "" : s("errPw"));
  if (!ok1 || !ok2) return;
  setBusy("loginForm", true);
  state.busy = true;
  try {
    await signInWithEmailAndPassword(auth, id + ID_DOMAIN, pw);
    $("liPw").value = "";
    await handleAuth(auth.currentUser);
  } catch (err) {
    setErr("liPw", "liPwErr", s(errKey(err)));
  } finally {
    state.busy = false;
    setBusy("loginForm", false);
  }
});
$("forgotBtn").addEventListener("click", function () {
  /* 아이디 방식에서는 재설정 메일을 보낼 수 없어 운영진이 Firebase 콘솔에서 직접 처리합니다. */
  toast(s("resetInfo"));
});

/* 회원가입 1단계: 초대 코드 */
$("suCode").addEventListener("input", function () {
  this.value = normalizeCode(this.value);
});
$("inviteForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  var v = $("suCode").value.trim();
  if (!CODE_RE.test(v)) { setErr("suCode", "suCodeErr", s("errInvite")); return; }
  setBusy("inviteForm", true);
  try {
    var snap = await getDoc(doc(db, "inviteCodes", v));
    if (!snap.exists()) { setErr("suCode", "suCodeErr", s("errInviteNone")); return; }
    var d = snap.data();
    var stc = codeStatus(d);
    if (stc === "off") { setErr("suCode", "suCodeErr", s("errInviteUsed")); return; }
    if (stc === "expired") { setErr("suCode", "suCodeErr", s("errInviteExpired")); return; }
    if (stc === "full") { setErr("suCode", "suCodeErr", s("errInviteFull")); return; }
    setErr("suCode", "suCodeErr", "");
    state.signup = { step: 2, code: v };
    renderSteps();
    toast(s("codeOk"));
  } catch (err) {
    console.error(err);
    setErr("suCode", "suCodeErr", s(errKey(err)));
  } finally {
    setBusy("inviteForm", false);
  }
});

/* 회원가입 2단계: 정보 입력 */
$("suBack").addEventListener("click", function () { state.signup.step = 1; renderSteps(); });
$("infoForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  var nick = $("suNick").value.trim();
  var id = $("suId").value.trim().toLowerCase();
  var pw = $("suPw").value;
  var pw2 = $("suPw2").value;
  var r = [
    setErr("suNick", "suNickErr", (nick.length >= 2 && nick.length <= 12) ? "" : s("errNick")),
    setErr("suId", "suIdErr", /^[a-z0-9]{4,16}$/.test(id) ? "" : s("errIdFormat")),
    setErr("suPw", "suPwErr", pw.length >= 6 ? "" : s("errPwShort")),
    setErr("suPw2", "suPw2Err", (pw2 === pw && pw2) ? "" : s("errPw2")),
    setErr("suAgree", "suAgreeErr", $("suAgree").checked ? "" : s("errAgree"))
  ];
  if (r.indexOf(false) !== -1) return;

  var code = state.signup.code;
  var cred = null;
  setBusy("infoForm", true);
  state.busy = true;
  try {
    cred = await createUserWithEmailAndPassword(auth, id + ID_DOMAIN, pw);
    /* 회원 문서 생성과 초대 코드 사용 횟수 증가를 한 번에 저장합니다. 둘 중 하나라도 규칙에 막히면 둘 다 취소됩니다. */
    var batch = writeBatch(db);
    batch.set(doc(db, "users", cred.user.uid), {
      loginId: id, nickname: nick, role: "member", status: "pending", inviteCode: code, createdAt: serverTimestamp()
    });
    batch.update(doc(db, "inviteCodes", code), { uses: increment(1) });
    await batch.commit();
    ["suCode", "suNick", "suId", "suPw", "suPw2"].forEach(function (x) { $(x).value = ""; });
    $("suAgree").checked = false;
    state.signup = { step: 1, code: "" };
    state.busy = false;
    await handleAuth(auth.currentUser);
  } catch (err) {
    console.error(err);
    if (cred) { try { await deleteUser(cred.user); } catch (e2) {} }
    if (err.code === "auth/email-already-in-use") {
      setErr("suId", "suIdErr", s("errIdTaken"));
    } else if (err.code === "auth/weak-password") {
      setErr("suPw", "suPwErr", s("errPwShort"));
    } else if (err.code === "permission-denied") {
      state.signup.step = 1;
      renderSteps();
      setErr("suCode", "suCodeErr", s("errInviteUsed"));
    } else {
      toast(s(errKey(err)));
    }
  } finally {
    state.busy = false;
    setBusy("infoForm", false);
  }
});

/* 승인 대기: 상태를 다시 읽어 승인되었으면 메인으로 보냅니다. */
$("refreshBtn").addEventListener("click", async function () {
  if (!auth.currentUser) return;
  try {
    var p = await loadProfile(auth.currentUser.uid);
    if (p && p.status === "active") {
      state.user = toUser(auth.currentUser.uid, p);
      toast(s("approvedNow"));
      show("home");
    } else if (p && (p.status === "off" || p.status === "rejected")) {
      await rejectLogin("errOff");
    } else {
      toast(s("stillPending"));
    }
  } catch (err) {
    console.error(err);
    toast(s(errKey(err)));
  }
});

/* 운영진 승인 관리 */
$("adminTabs").addEventListener("click", function (e) {
  var b = e.target.closest("[data-tab]");
  if (!b) return;
  state.tab = b.getAttribute("data-tab");
  renderAdmin();
});
$("adminBody").addEventListener("click", async function (e) {
  var b = e.target.closest("[data-act]");
  if (!b || b.disabled) return;
  var act = b.getAttribute("data-act");
  var id = b.getAttribute("data-id");
  b.disabled = true;
  try {
    if (act === "approve" || act === "reject") {
      var target = admin.requests.filter(function (x) { return x.id === id; })[0];
      await updateDoc(doc(db, "users", id), { status: act === "approve" ? "active" : "rejected" });
      toast(s(act === "approve" ? "approved" : "rejected").replace("{n}", target ? target.nickname : ""));
      await fetchAdmin();
    } else if (act === "moveApprove" || act === "moveReject") {
      var mv = admin.moves.filter(function (x) { return x.id === id; })[0];
      var ok = act === "moveApprove";
      await updateDoc(doc(db, "moveRequests", id), { status: ok ? "approved" : "rejected", decidedBy: state.user.uid, decidedAt: serverTimestamp() });
      toast(s(ok ? "moveApproved" : "moveRejected").replace("{n}", mv ? mv.nickname : ""));
      await fetchAdmin();
    } else if (act === "toggle") {
      var m = admin.members.filter(function (x) { return x.id === id; })[0];
      var next = m.status === "active" ? "off" : "active";
      await updateDoc(doc(db, "users", id), { status: next });
      toast(s(next === "active" ? "activated" : "deactivated").replace("{n}", m.nickname));
      await fetchAdmin();
    } else if (act === "codeToggle") {
      var cd = admin.codes.filter(function (x) { return x.id === id; })[0];
      var wasOn = !!cd && cd.active === true;
      await updateDoc(doc(db, "inviteCodes", id), { active: !wasOn });
      toast(s(wasOn ? "codePaused" : "codeResumed"));
      await fetchAdmin();
    } else if (act === "copy") {
      try {
        await navigator.clipboard.writeText(id);
        toast(s("copied"));
      } catch (err) {
        toast(s("copyFail") + " " + id);
      }
    }
  } catch (err) {
    console.error(err);
    toast(s("actionFail"));
  } finally {
    b.disabled = false;
  }
});

/* 서버 이동 신청 */
$("mvTarget").addEventListener("change", function () {
  state.moveTarget = this.value;
  $("mvCond").textContent = T[state.lang].data.channel.conds[state.moveTarget] || "";
  setErr("mvTarget", "mvTargetErr", "");
});
$("mvFrom").addEventListener("change", function () { state.moveFrom = this.value; });
$("moveForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  var toSrv = $("mvTarget").value;
  var fromSrv = $("mvFrom").value;
  var trophyStr = $("mvTrophy").value.trim();
  var note = $("mvNote").value.trim();
  var okT = setErr("mvTarget", "mvTargetErr", toSrv !== fromSrv ? "" : s("errMoveSame"));
  var okR = setErr("mvTrophy", "mvTrophyErr", (/^\d{1,7}$/.test(trophyStr) && parseInt(trophyStr, 10) <= 1000000) ? "" : s("errTrophy"));
  if (!okT || !okR) return;
  if (myMoves.items.some(function (x) { return x.status === "pending"; })) { toast(s("movePendingExists")); return; }
  setBusy("moveForm", true);
  try {
    await addDoc(collection(db, "moveRequests"), {
      uid: state.user.uid,
      loginId: state.user.loginId,
      nickname: state.user.nickname,
      toServer: toSrv,
      fromServer: fromSrv,
      trophies: parseInt(trophyStr, 10),
      note: note,
      status: "pending",
      createdAt: serverTimestamp()
    });
    $("mvTrophy").value = "";
    $("mvNote").value = "";
    toast(s("moveSent"));
    await fetchMyMoves();
  } catch (err) {
    console.error(err);
    toast(s(errKey(err) === "errPerm" ? "errPerm" : "actionFail"));
  } finally {
    setBusy("moveForm", false);
  }
});

/* 초대 코드 만들기 (운영진) */
$("acCode").addEventListener("input", function () { this.value = normalizeCode(this.value); });
$("acUnl").addEventListener("change", function () {
  $("acMax").disabled = this.checked;
  if (this.checked) setErr("acMax", "acMaxErr", "");
});
$("codeForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  var code = $("acCode").value.trim();
  if (!code) code = genCode();
  var okCode = setErr("acCode", "acCodeErr", CODE_RE.test(code) ? "" : s("errCodeFmt"));
  var unl = $("acUnl").checked;
  var max = unl ? 0 : parseInt($("acMax").value, 10);
  var okMax = setErr("acMax", "acMaxErr", (unl || (max >= 1 && max <= 100000)) ? "" : s("errMax"));
  if (!okCode || !okMax) return;
  var days = parseInt($("acExp").value, 10);
  setBusy("codeForm", true);
  try {
    var ref = doc(db, "inviteCodes", code);
    var exist = await getDoc(ref);
    if (exist.exists()) { setErr("acCode", "acCodeErr", s("errCodeExists")); return; }
    await setDoc(ref, {
      createdBy: state.user.uid,
      createdAt: serverTimestamp(),
      expiresAt: days > 0 ? Timestamp.fromMillis(Date.now() + days * 24 * 60 * 60 * 1000) : null,
      maxUses: max,
      uses: 0,
      active: true
    });
    $("acCode").value = "";
    toast(s("newCodeDone") + " " + code);
    await fetchAdmin();
  } catch (err) {
    console.error(err);
    toast(s(errKey(err) === "errPerm" ? "errPerm" : "actionFail"));
  } finally {
    setBusy("codeForm", false);
  }
});

/* ---------- 시작 ---------- */
var savedLang = safeGet("ggo-lang");
if (savedLang === "ko" || savedLang === "en") state.lang = savedLang;
var savedTheme = safeGet("ggo-theme");
if (savedTheme === "dark" || savedTheme === "light") document.documentElement.setAttribute("data-theme", savedTheme);
var h = (location.hash || "").replace("#", "");
if (order.indexOf(h) !== -1) state.menu = h;
show("loading");
onAuthStateChanged(auth, function (u) {
  if (state.busy) return;
  handleAuth(u);
});
