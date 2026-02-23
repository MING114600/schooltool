import { 
  Trees, Library, Tent, MonitorPlay, Waves, 
  BookOpen, Moon, Utensils, Droplet, Home, UserX,
  LogIn, LogOut, Coffee, MapPin
} from 'lucide-react';

export const DEFAULT_SCHEDULE = {
  1: { p1: '國語', p2: '數學', p3: '自然', p4: '自然', p5: '有品麗山幸福悅讀', p6: '英語', p7: '體育' },
  2: { p1: '綜合', p2: '綜合', p3: 'STEAM手創館', p4: '英語', p5: '國語', p6: '數學', p7: '音樂' },
  3: { p1: '國語', p2: '數學', p3: '社會', p4: '社會', p5: '', p6: '', p7: '' },
  4: { p1: '自然', p2: '國語', p3: '數學', p4: '本土語', p5: '視覺藝術', p6: '視覺藝術', p7: '體育' },
  5: { p1: 'Reading Fun', p2: '國語', p3: '理財悠遊趣', p4: '社會', p5: '綜合', p6: '有品麗山幸福悅讀', p7: '健康' },
};

export const DEFAULT_DAY_TYPES = {
  1: 'full', 2: 'full', 3: 'half', 4: 'full', 5: 'full', 6: 'full', 0: 'full'
};

export const DEFAULT_SUBJECT_HINTS = {
  '晨光時間': '抄寫聯絡簿以及準備交作業',
  '全天打掃': '請拿起掃具，認真打掃環境，保持整潔', 
  '打掃時間': '請拿起掃具，認真打掃環境，保持整潔', 
  '準備午餐': '請洗手，拿出餐具，準備用餐',
  '午餐時間': '請細嚼慢嚥，保持桌面整潔，安靜用餐',
  '午休時間': '請趴下休息，保持安靜，不隨意走動',
  '準備上課': '午休結束，請起床洗臉，準備上課',
  '晨間閱讀': '請安靜閱讀，享受書本的樂趣',
  '國語': '準備國語課本、習作、鉛筆盒',
  '數學': '準備數學課本、附件、圓規、直尺',
  '自然': '準備自然課本、習作、觀察紀錄本',
  '社會': '準備社會課本、習作',
  '英語': '準備英語課本、習作、點讀筆',
  '本土語': '準備本土語課本、相關教材',
  '生活': '準備生活課本、習作',
  '生活(視覺)': '攜帶彩色筆、水彩、圍裙，保持整潔', 
  '生活(音樂)': '攜帶直笛/樂器、課本，至音樂教室', 
  '視覺藝術': '攜帶水彩、畫筆、調色盤，至美勞教室', 
  '音樂': '攜帶直笛/樂器、課本，至音樂教室', 
  '視覺/音樂': '攜帶相關藝文用具(畫具或樂器)',
  '體育': '穿著運動服，攜帶水壺、毛巾，至操場集合',
  '健康': '準備健康課本、習作',
  '游泳': '攜帶泳衣、泳帽、蛙鏡、浴巾，至游泳池集合',
  '綜合': '準備綜合活動課本或小組討論資料',
  'STEAM手創館': '請至電腦教室集合，攜帶筆記本',
  'Reading Fun': '準備英語讀本，保持愉快心情',
  '有品麗山幸福悅讀': '準備喜歡的書，靜心閱讀',
  '理財悠遊趣': '準備理財學習單或相關教具',
  '閱讀': '攜帶借閱證，安靜排隊至圖書館',
  '放學': '請收拾好書包，拿好餐袋及個人物品到走廊排隊',
  'default': '準備下節課本，喝水上廁所'
};

export const SYSTEM_BUTTONS_CONFIG = {
  groups: [
    {
      id: 'move',
      label: '移動/集合',
      icon: MapPin,
      color: 'bg-emerald-600',
      items: [
        { id: 'playground', label: '操場', message: '全班在操場', sub: '請攜帶水壺/毛巾，體育課/戶外活動', icon: Trees, color: 'from-green-500 to-emerald-400' },
        { id: 'library', label: '圖書館', message: '全班在圖書館', sub: '請攜帶學生證借閱，保持安靜', icon: Library, color: 'from-blue-500 to-cyan-400' },
        { id: 'activity_center', label: '活動中心', message: '全班在活動中心', sub: '週會/宣導活動，請盡速集合', icon: Tent, color: 'from-purple-500 to-violet-400' },
        { id: 'computer_lab', label: '電腦教室', message: '全班在電腦教室', sub: '資訊課程', icon: MonitorPlay, color: 'from-indigo-500 to-blue-500' },
        { id: 'swimming_pool', label: '游泳池', message: '全班在游泳池', sub: '請攜帶泳具、毛巾', icon: Waves, color: 'from-cyan-500 to-blue-600' },
        { id: 'av_room', label: '視聽教室', message: '全班在視聽教室', sub: '觀賞影片/講座，請保持安靜', icon: MonitorPlay, color: 'from-rose-400 to-red-500' }, 
      ]
    },
    {
      id: 'status',
      label: '作息/狀態',
      icon: Coffee,
      color: 'bg-indigo-600',
      items: [
        { id: 'morning_read', label: '晨間閱讀', message: '晨間閱讀', sub: '請安靜閱讀，享受書本樂趣', type: 'dark', icon: BookOpen, color: 'from-amber-900 to-orange-950' },
        { id: 'nap', label: '午休', message: '午休時間', sub: '請趴下休息，保持安靜', type: 'dark', icon: Moon, color: 'from-indigo-950 to-slate-900' },
        { id: 'lunch', label: '午餐', message: '午餐時間', sub: '請細嚼慢嚥，保持桌面整潔', icon: Utensils, color: 'from-orange-400 to-amber-500' },
        { id: 'cleaning', label: '打掃', message: '打掃時間', sub: '請拿起掃具，認真打掃環境', icon: Droplet, color: 'from-cyan-400 to-blue-500' },
        { id: 'after_school', label: '放學', message: '放學時間', sub: '請收拾書包，座位淨空', icon: Home, color: 'from-green-500 to-emerald-600' },
        { id: 'teacher_meeting', label: '老師開會', message: '老師處理公務中', sub: '請安靜進行班級活動', type: 'dark', icon: UserX, color: 'from-slate-700 to-slate-900' },
      ]
    }
  ],
  singles: [
    { id: 'back_classroom', label: '回教室', message: '下課直接回教室', sub: '不要在外逗留', icon: LogIn, color: 'bg-blue-600' },
    { id: 'corridor', label: '走廊排隊', message: '到走廊排隊', sub: '靠上椅子，在走廊安靜排隊', icon: LogOut, color: 'bg-orange-500' },
  ]
};

// 台灣行政區經緯度資料 (可擴充)
export const TAIWAN_LOCATIONS = {
  '臺北市': [
    { name: '內湖區', lat: 25.0689, lon: 121.5909 },
    { name: '大安區', lat: 25.0263, lon: 121.5438 },
    { name: '信義區', lat: 25.0297, lon: 121.5687 },
    { name: '士林區', lat: 25.1345, lon: 121.5262 },
    { name: '北投區', lat: 25.1319, lon: 121.5036 },
    { name: '文山區', lat: 24.9982, lon: 121.5543 },
    { name: '中正區', lat: 25.0321, lon: 121.5173 },
    { name: '萬華區', lat: 25.0289, lon: 121.4984 },
    { name: '中山區', lat: 25.0645, lon: 121.5332 },
    { name: '松山區', lat: 25.0594, lon: 121.5583 },
    { name: '南港區', lat: 25.0353, lon: 121.6070 },
    { name: '大同區', lat: 25.0637, lon: 121.5126 },
  ],
  '新北市': [
    { name: '板橋區', lat: 25.0118, lon: 121.4593 },
    { name: '三重區', lat: 25.0615, lon: 121.4947 },
    { name: '中和區', lat: 24.9926, lon: 121.5028 },
    { name: '永和區', lat: 25.0084, lon: 121.5159 },
    { name: '新莊區', lat: 25.0360, lon: 121.4504 },
    { name: '新店區', lat: 24.9680, lon: 121.5414 },
    { name: '淡水區', lat: 25.1764, lon: 121.4428 },
    { name: '汐止區', lat: 25.0673, lon: 121.6496 },
    { name: '土城區', lat: 24.9722, lon: 121.4443 },
    { name: '蘆洲區', lat: 25.0864, lon: 121.4828 },
  ],
  '桃園市': [
    { name: '桃園區', lat: 24.9937, lon: 121.3013 },
    { name: '中壢區', lat: 24.9654, lon: 121.2248 },
    { name: '平鎮區', lat: 24.9317, lon: 121.2003 },
    { name: '八德區', lat: 24.9394, lon: 121.2939 },
  ],
  '臺中市': [
    { name: '西屯區', lat: 24.1818, lon: 120.6276 },
    { name: '北屯區', lat: 24.1895, lon: 120.7077 },
    { name: '南屯區', lat: 24.1275, lon: 120.6265 },
    { name: '西區', lat: 24.1408, lon: 120.6659 },
  ],
  '臺南市': [
    { name: '東區', lat: 22.9866, lon: 120.2227 },
    { name: '永康區', lat: 23.0132, lon: 120.2625 },
    { name: '安平區', lat: 22.9937, lon: 120.1704 },
  ],
  '高雄市': [
    { name: '三民區', lat: 22.6482, lon: 120.3175 },
    { name: '左營區', lat: 22.6845, lon: 120.2985 },
    { name: '鳳山區', lat: 22.6258, lon: 120.3550 },
    { name: '鼓山區', lat: 22.6429, lon: 120.2764 },
    { name: '小港區', lat: 22.5653, lon: 120.3379 },
  ]
  // ... 其他縣市可依照此格式擴充
};

// 預設天氣設定 (內湖)
export const DEFAULT_WEATHER_CONFIG = {
  enabled: true,
  city: '臺北市',
  district: '內湖區',
  lat: 25.0689, 
  lon: 121.5909
};

export const DEFAULT_CUSTOM_BROADCASTS = [
  { 
    id: 1, 
    name: '自訂 1', 
    title: '準備下課', 
    sub: '收拾物品，走廊排隊', 
    mode: 'fullscreen', // 預設全螢幕
    color: 'from-pink-500 to-rose-500', 
    icon: 'Megaphone' 
  },
  { 
    id: 2, 
    name: '自訂 2', 
    title: '分組討論', 
    sub: '請降低音量，專注討論', 
    mode: 'marquee', // 預設跑馬燈
    color: 'from-blue-500 to-cyan-500', 
    icon: 'Users' 
  },
  { 
    id: 3, 
    name: '自訂 3', 
    title: '實驗中', 
    sub: '遵守實驗規則，注意安全', 
    mode: 'fullscreen', 
    color: 'from-purple-500 to-violet-500', 
    icon: 'BookOpen' 
  },
  { 
    id: 4, 
    name: '自訂 4', 
    title: '眼球運動', 
    sub: '請看遠方綠色植物', 
    mode: 'marquee', 
    color: 'from-green-500 to-emerald-500', 
    icon: 'Eye' 
  },
  { 
    id: 5, 
    name: '自訂 5', 
    title: '空白廣播', 
    sub: '', 
    mode: 'fullscreen', 
    color: 'from-orange-500 to-amber-500', 
    icon: 'Bell' 
  },
  { 
    id: 6, 
    name: '自訂 6', 
    title: '空白跑馬燈', 
    sub: '', 
    mode: 'marquee', 
    color: 'from-slate-500 to-slate-700', 
    icon: 'MessageSquare' 
  }
];
