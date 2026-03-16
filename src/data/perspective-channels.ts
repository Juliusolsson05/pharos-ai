import type { Perspective, PerspectiveChannel } from '@/types/domain';

type PerspectiveMeta = {
  label: string;
  color: string;
};

export const PERSPECTIVE_META: Record<Perspective, PerspectiveMeta> = {
  WESTERN: { label: 'WESTERN', color: 'var(--blue)' },
  US_GOV: { label: 'US / ALLIED', color: 'var(--blue-l)' },
  ISRAELI: { label: 'ISRAELI', color: 'var(--cyber)' },
  IRANIAN: { label: 'IRANIAN', color: 'var(--danger)' },
  ARAB: { label: 'REGIONAL', color: 'var(--warning)' },
  RUSSIAN: { label: 'RUSSIAN', color: 'var(--warning)' },
  CHINESE: { label: 'CHINESE', color: 'var(--danger)' },
  INDEPENDENT: { label: 'INDEPENDENT', color: 'var(--success)' },
  INTL_ORG: { label: 'INTL ORG', color: 'var(--teal)' },
  AFRICAN: { label: 'AFRICAN', color: 'var(--success)' },
  LATAM: { label: 'LATAM', color: 'var(--gold)' },
  LIVECAM: { label: 'LIVECAM', color: 'var(--teal)' },
};

export const PERSPECTIVE_CHANNELS: PerspectiveChannel[] = [
  { id: 'abc-news-australia', name: 'ABC News Australia', handle: '@ABCNewsAustralia', channelId: 'UCVgO39Bk5sMo66-6o6Spn6Q', perspective: 'WESTERN', country: 'Australia', language: 'English', priority: 1, logo: null, notes: 'Australia public broadcaster.' },
  { id: 'associated-press', name: 'Associated Press', handle: '@AssociatedPress', channelId: 'UC52X5wxOL_s5yw0dQk7NtgA', perspective: 'WESTERN', country: 'Global', language: 'English', priority: 2, logo: '/logos/feeds/ap.png', notes: 'Wire baseline.' },
  { id: 'dw-news', name: 'DW News', handle: '@DWNews', channelId: 'UCknLrEdhRCp1aegoMqRaCZg', perspective: 'WESTERN', country: 'Germany', language: 'English', priority: 3, logo: '/logos/feeds/dw.png', notes: 'European public broadcaster.' },
  { id: 'euronews', name: 'Euronews', handle: '@euronews', channelId: 'UCSrZ3UV4jOidv8ppoVuvW9Q', perspective: 'WESTERN', country: 'France', language: 'English', priority: 4, logo: null, notes: 'Pan-European newsroom.' },
  { id: 'france-24-english', name: 'France 24 English', handle: '@France24_en', channelId: 'UCQfwfsi5VrQ8yKZ-UWmAEFg', perspective: 'WESTERN', country: 'France', language: 'English', priority: 5, logo: null, notes: 'International desk.' },
  { id: 'gb-news', name: 'GB News', handle: '@GBNewsOnline', channelId: 'UC0vn8ISa4LKMunLbzaXLnOQ', perspective: 'WESTERN', country: 'UK', language: 'English', priority: 6, logo: null, notes: 'UK rolling desk.' },
  { id: 'sky-news', name: 'Sky News', handle: '@SkyNews', channelId: 'UCoMdktPbSTixAyNGwb-UYkQ', perspective: 'WESTERN', country: 'UK', language: 'English', priority: 7, logo: null, notes: 'UK live desk.' },
  { id: 'abc-news', name: 'ABC News', handle: '@ABCNews', channelId: 'UCBi2mrWuNuyYy4gbM6fU18Q', perspective: 'US_GOV', country: 'US', language: 'English', priority: 8, logo: null, notes: 'US network desk.' },
  { id: 'cbs-news', name: 'CBS News', handle: '@CBSNews', channelId: 'UC8p1vwvWtl6T73JiExfWs1g', perspective: 'US_GOV', country: 'US', language: 'English', priority: 9, logo: null, notes: 'US network desk.' },
  { id: 'livenow-from-fox', name: 'LiveNOW from FOX', handle: '@LiveNOWFOX', channelId: 'UCJg9wBPyKMNA5sRDnvzmkdg', perspective: 'US_GOV', country: 'US', language: 'English', priority: 10, logo: '/logos/feeds/fox.png', notes: 'FOX live desk.' },
  { id: 'nbc-news', name: 'NBC News', handle: '@NBCNews', channelId: 'UCeY0bbntWzzVIaj2z3QigXg', perspective: 'US_GOV', country: 'US', language: 'English', priority: 11, logo: null, notes: 'US rolling desk.' },
  { id: 'newsnation', name: 'NewsNation', handle: '@NewsNation', channelId: 'UCCjG8NtOig0USdrT5D1FpxQ', perspective: 'US_GOV', country: 'US', language: 'English', priority: 12, logo: null, notes: 'US cable desk.' },
  { id: 'al-arabiya-arabic', name: 'Al Arabiya Arabic', handle: '@AlArabiya', channelId: 'UCahpxixMCwoANAftn6IxkTg', perspective: 'ARAB', country: 'Saudi Arabia', language: 'Arabic', priority: 13, logo: null, notes: 'Saudi Arabic desk.' },
  { id: 'al-arabiya-english', name: 'Al Arabiya English', handle: '@AlArabiyaEnglish', channelId: 'UCIZJ9a6P_nxCFJTmL0gh_IQ', perspective: 'ARAB', country: 'Saudi Arabia', language: 'English', priority: 14, logo: null, notes: 'Saudi English desk.' },
  { id: 'al-hadath', name: 'Al Hadath', handle: '@AlHadath', channelId: 'UCrj5BGAhtWxDfqbza9T9hqA', perspective: 'ARAB', country: 'Saudi Arabia', language: 'Arabic', priority: 15, logo: null, notes: 'Saudi rolling desk.' },
  { id: 'al-jazeera-arabic', name: 'Al Jazeera Arabic', handle: '@AlJazeera', channelId: 'UCfiwzLy-8yKzIbsmZTzxDgw', perspective: 'ARAB', country: 'Qatar', language: 'Arabic', priority: 16, logo: '/logos/feeds/aljazeera.png', notes: 'Qatari Arabic desk.' },
  { id: 'al-jazeera-english', name: 'Al Jazeera English', handle: '@aljazeeraenglish', channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg', perspective: 'ARAB', country: 'Qatar', language: 'English', priority: 17, logo: '/logos/feeds/aljazeera.png', notes: 'Qatari English desk.' },
  { id: 'trt-world', name: 'TRT World', handle: '@trtworld', channelId: 'UC7fWeaHhqgM4Ry-RMpM2YYw', perspective: 'ARAB', country: 'Turkey', language: 'English', priority: 18, logo: null, notes: 'Turkish regional desk.' },
  { id: 'cna', name: 'CNA', handle: '@channelnewsasia', channelId: 'UC83jt4dlz1Gjl58fzQrrKZg', perspective: 'INDEPENDENT', country: 'Singapore', language: 'English', priority: 19, logo: null, notes: 'Singapore desk.' },
  { id: 'cnn-news18', name: 'CNN-News18', handle: '@cnnnews18', channelId: 'UCef1-8eOpJgud7szVPlZQAQ', perspective: 'INDEPENDENT', country: 'India', language: 'English', priority: 20, logo: null, notes: 'India desk.' },
  { id: 'dd-india', name: 'DD India', handle: '@DDIndia', channelId: 'UCGDQNvybfDDeGTf4GtigXaw', perspective: 'INDEPENDENT', country: 'India', language: 'English', priority: 21, logo: null, notes: 'India desk.' },
  { id: 'firstpost', name: 'Firstpost', handle: '@Firstpost', channelId: 'UCz8QaiQxApLq8sLNcszYyJw', perspective: 'INDEPENDENT', country: 'India', language: 'English', priority: 22, logo: null, notes: 'India desk.' },
  { id: 'geo-news', name: 'Geo News', handle: '@GeoNews', channelId: 'UC_vt34wimdCzdkrzVejwX9g', perspective: 'INDEPENDENT', country: 'Pakistan', language: 'English', priority: 23, logo: null, notes: 'Pakistan desk.' },
  { id: 'india-today', name: 'India Today', handle: '@IndiaToday', channelId: 'UCYPvAwZP8pZhSMW8qs7cVCw', perspective: 'INDEPENDENT', country: 'India', language: 'English', priority: 24, logo: null, notes: 'India geopolitical desk.' },
  { id: 'mirror-now', name: 'Mirror Now', handle: '@MirrorNow', channelId: 'UCWCEYVwSqr7Epo6sSCfUgiw', perspective: 'INDEPENDENT', country: 'India', language: 'English', priority: 25, logo: null, notes: 'India breaking desk.' },
  { id: 'ndtv', name: 'NDTV', handle: '@NDTV', channelId: 'UCZFMm1mMw0F81Z37aaEzTUA', perspective: 'INDEPENDENT', country: 'India', language: 'English', priority: 26, logo: null, notes: 'India live desk.' },
  { id: 'nhk-world', name: 'NHK World', handle: '@NHKWorldJapan', channelId: 'UCSPEjw8F2nQDtmUKPFNF7_A', perspective: 'INDEPENDENT', country: 'Japan', language: 'English', priority: 27, logo: null, notes: 'Japan public broadcaster.' },
  { id: 'news9-live', name: 'News9 Live', handle: '@News9live', channelId: 'UCRK4FDIkUyslEAUdyRDdCtQ', perspective: 'INDEPENDENT', country: 'India', language: 'English', priority: 28, logo: null, notes: 'India rolling desk.' },
  { id: 'republic-world', name: 'Republic World', handle: '@RepublicWorld', channelId: 'UCwqusr8YDwM-3mEYTDeJHzw', perspective: 'INDEPENDENT', country: 'India', language: 'English', priority: 29, logo: null, notes: 'India debate desk.' },
  { id: 'the-print', name: 'The Print', handle: '@ThePrintIndia', channelId: 'UCuyRsHZILrU7ZDIAbGASHdA', perspective: 'INDEPENDENT', country: 'India', language: 'English', priority: 30, logo: null, notes: 'India analysis desk.' },
  { id: 'times-now', name: 'Times Now', handle: '@TimesNow', channelId: 'UC6RJ7-PaXg6TIH2BzZfTV7w', perspective: 'INDEPENDENT', country: 'India', language: 'English', priority: 31, logo: null, notes: 'India headline desk.' },
  { id: 'cgtn-europe', name: 'CGTN Europe', handle: '@CGTNEurope', channelId: 'UCj0TppyxzQWm9JbMg3CP8Rg', perspective: 'CHINESE', country: 'China', language: 'English', priority: 32, logo: null, notes: 'Chinese state-linked desk.' },
  { id: 'africanews', name: 'Africanews', handle: '@AfricaNews', channelId: 'UC1_E8NeF5QHY2dtdLRBCCLA', perspective: 'AFRICAN', country: 'Global', language: 'English', priority: 33, logo: null, notes: 'Pan-African desk.' },
  { id: 'channels-tv', name: 'Channels TV', handle: '@ChannelsTelevision', channelId: 'UCEXGDNclvmg6RW0vipJYsTQ', perspective: 'AFRICAN', country: 'Nigeria', language: 'English', priority: 34, logo: null, notes: 'Nigeria desk.' },
  { id: 'sabc-news', name: 'SABC News', handle: '@SABCDigitalNews', channelId: 'UC8yH-uI81UUtEMDsowQyx1g', perspective: 'AFRICAN', country: 'South Africa', language: 'English', priority: 35, logo: null, notes: 'South Africa broadcaster.' },
  { id: 'telesur-english', name: 'teleSUR English', handle: '@teleSUREnglish', channelId: 'UCmuTmpLY35O3csvhyA6vrkg', perspective: 'LATAM', country: 'Venezuela', language: 'English', priority: 36, logo: null, notes: 'LatAm desk.' },
  { id: 'earthcam', name: 'EarthCam', handle: '@EarthCam', channelId: 'UC6qrG3W8SMK0jior2olka3g', perspective: 'LIVECAM', country: 'Global', language: 'English', priority: 37, logo: null, notes: 'Ambient livecam feed.' },
  { id: 'inquizex-osint', name: 'InquizeX OSINT', handle: '@Inquizex', channelId: 'UCuyLmOJb7PVCvx8zbRT9_GQ', perspective: 'LIVECAM', country: 'Global', language: 'English', priority: 38, logo: null, notes: 'Conflict multi-cam feed.' },
  { id: 'multicam-live-tv', name: 'MultiCam Live TV', handle: '@MultiCamLiveTV', channelId: 'UC3MymMNNRn8T4FgfhdAXolQ', perspective: 'LIVECAM', country: 'Global', language: 'English', priority: 39, logo: null, notes: 'OSINT multi-cam wall.' },
  { id: 'skyline-webcams', name: 'Skyline Webcams', handle: '@SkylineWebcams', channelId: 'UC2WMV4vCYurHdHPd9pCqYSg', perspective: 'LIVECAM', country: 'Global', language: 'English', priority: 40, logo: null, notes: 'Urban livecam feed.' },
  { id: 'world-cam-live', name: 'World Cam Live', handle: '@WorldCamLive', channelId: 'UCNrGOnduIS9BXIRmDcHasZA', perspective: 'LIVECAM', country: 'Global', language: 'English', priority: 41, logo: null, notes: 'Regional skycam feed.' },
  { id: 'bbc-news', name: 'BBC News', handle: '@BBCNews', channelId: 'UC16niRr50-MSBwiO3YDb3RA', perspective: 'WESTERN', country: 'UK', language: 'English', priority: 42, logo: null, notes: 'UK broadcaster.' },
  { id: 'bloomberg-television', name: 'Bloomberg Television', handle: '@BloombergTelevision', channelId: 'UCyxnPZfofoutjmyvaV0GGeQ', perspective: 'WESTERN', country: 'US', language: 'English', priority: 43, logo: null, notes: 'Markets desk.' },
  { id: 'reuters', name: 'Reuters', handle: '@Reuters', channelId: 'UChqUTb7kYRX8-EiaN3XFrSQ', perspective: 'WESTERN', country: 'Global', language: 'English', priority: 44, logo: '/logos/feeds/reuters.png', notes: 'Wire channel.' },
  { id: 'c-span', name: 'C-SPAN', handle: '@CSPAN', channelId: 'UCb--64Gl51jIEVE-GLDAVTg', perspective: 'US_GOV', country: 'US', language: 'English', priority: 45, logo: null, notes: 'US government coverage.' },
  { id: 'cnn', name: 'CNN', handle: '@CNN', channelId: 'UCupvZG-5ko_eiXAupbDfxWw', perspective: 'US_GOV', country: 'US', language: 'English', priority: 46, logo: '/logos/feeds/cnn.png', notes: 'US cable desk.' },
  { id: 'fox-news', name: 'Fox News', handle: '@FoxNews', channelId: 'UCXIJgqnII2ZOINSWNOGFThA', perspective: 'US_GOV', country: 'US', language: 'English', priority: 47, logo: '/logos/feeds/fox.png', notes: 'US cable desk.' },
  { id: 'al-mayadeen', name: 'Al Mayadeen', handle: '@AlMayadeenNews', channelId: 'UC9YbjpvsFZytS0DnO1FnTKw', perspective: 'ARAB', country: 'Lebanon', language: 'Arabic', priority: 48, logo: null, notes: 'Lebanese desk.' },
  { id: 'al-mayadeen-english', name: 'Al Mayadeen English', handle: '@AlMayadeenEnglish', channelId: 'UCZCFHCU-2eGF7V5ciMkoPHw', perspective: 'ARAB', country: 'Lebanon', language: 'English', priority: 49, logo: null, notes: 'Lebanese English desk.' },
  { id: 'abp-news', name: 'ABP News', handle: '@ABPNEWSOfficial', channelId: 'UCXY9ihW1jfi53HQjeSQjUBw', perspective: 'INDEPENDENT', country: 'India', language: 'English', priority: 50, logo: null, notes: 'India desk.' },
  { id: 'arirang-tv', name: 'Arirang TV', handle: '@arirangtv', channelId: 'UCCW7Z4RTTQoFix1dvn0D3LA', perspective: 'INDEPENDENT', country: 'South Korea', language: 'English', priority: 51, logo: null, notes: 'Korea broadcaster.' },
  { id: 'global-news', name: 'Global News', handle: '@GlobalNews', channelId: 'UChLtXXpo4Ge1ReTEboVvTDg', perspective: 'INDEPENDENT', country: 'Canada', language: 'English', priority: 52, logo: null, notes: 'Canada desk.' },
  { id: 'ptv-world', name: 'PTV World', handle: '@PTVWorld', channelId: 'UCndoah1aAtLsaybZvMyQYrQ', perspective: 'INDEPENDENT', country: 'Pakistan', language: 'English', priority: 53, logo: null, notes: 'Pakistan desk.' },
  { id: 'wion', name: 'WION', handle: '@WIONews', channelId: 'UCWEIPvoxRwn6llPOIn555rQ', perspective: 'INDEPENDENT', country: 'India', language: 'English', priority: 54, logo: null, notes: 'India desk.' },
  { id: 'idf-official', name: 'IDF Official', handle: '@IDFofficial', channelId: 'UCoecQ94wHSnt-DloBnnL1_g', perspective: 'ISRAELI', country: 'Israel', language: 'English', priority: 55, logo: null, notes: 'Official military channel.' },
  { id: 'israeli-pm-office', name: 'Israeli PM Office', handle: '@IsraeliPM', channelId: 'UC4XJnRPZjXhgvVMhXKNSJvQ', perspective: 'ISRAELI', country: 'Israel', language: 'English', priority: 56, logo: null, notes: 'PM office channel.' },
  { id: 'kan-11', name: 'KAN 11', handle: '@kann11', channelId: 'UCUXqSTmp6hkUyXTuG-fIr5g', perspective: 'ISRAELI', country: 'Israel', language: 'Hebrew', priority: 57, logo: null, notes: 'Israeli public broadcaster.' },
  { id: 'i24news-english', name: 'i24NEWS English', handle: '@i24NEWS_EN', channelId: 'UCvHDpsWKADrDia0c99X37vg', perspective: 'ISRAELI', country: 'Israel', language: 'English', priority: 58, logo: null, notes: 'Israeli English desk.' },
  { id: 'press-tv', name: 'Press TV', handle: '@PressTV', channelId: 'UC0OO19kc2jt8ZtOWZMVa3Vw', perspective: 'IRANIAN', country: 'Iran', language: 'English', priority: 59, logo: null, notes: 'Iranian state outlet.' },
  { id: 'rt', name: 'RT', handle: '@RT', channelId: 'UCPyFaUSmf_KPlzb4n85rXDg', perspective: 'RUSSIAN', country: 'Russia', language: 'English', priority: 60, logo: null, notes: 'Russian state outlet.' },
  { id: 'cgtn-america', name: 'CGTN America', handle: '@CGTNAmerica', channelId: 'UCj7wKsOBhRD9Jy4yahkMRMw', perspective: 'CHINESE', country: 'China', language: 'English', priority: 61, logo: null, notes: 'Chinese Americas feed.' },
  { id: 'explore-org', name: 'Explore.org', handle: '@Explore', channelId: 'UC-zurjw5Z2hYYtBR1cO4FHA', perspective: 'LIVECAM', country: 'Global', language: 'English', priority: 62, logo: null, notes: 'Nature livecam network.' },
  { id: 'intel-cams', name: 'Intel Cams', handle: '@IntelCams', channelId: 'UCacpwmc6sUg9D8mulkE7Jzg', perspective: 'LIVECAM', country: 'Global', language: 'English', priority: 63, logo: null, notes: 'OSINT livecam channel.' },
  { id: 'war-cams-live', name: 'War Cams Live', handle: '@WarCamsLive', channelId: 'UCvzQz7Ot1P4g6zFwKrwo-Rw', perspective: 'LIVECAM', country: 'Global', language: 'English', priority: 64, logo: null, notes: 'Conflict livecam channel.' },
];

export type Preset = {
  id: string;
  label: string;
  description: string;
  color: string;
  channelIds: string[];
};

export const PRESETS: Preset[] = [
  {
    id: 'default',
    label: 'DEFAULT',
    description: 'Balanced live wall across Western, US, regional, and Asian desks.',
    color: 'var(--blue)',
    channelIds: ['france-24-english', 'sky-news', 'abc-news', 'cbs-news', 'al-jazeera-english', 'trt-world', 'cna', 'india-today', 'cgtn-europe'],
  },
  {
    id: 'iran-conflict',
    label: 'IRAN CONFLICT',
    description: 'Desk mix for the Iran theater across Western, Gulf, and South Asian coverage.',
    color: 'var(--danger)',
    channelIds: ['sky-news', 'abc-news', 'cbs-news', 'al-jazeera-english', 'al-arabiya-english', 'al-hadath', 'trt-world', 'firstpost', 'india-today'],
  },
  {
    id: 'global-south',
    label: 'GLOBAL SOUTH',
    description: 'Asia-heavy and regional coverage with independent desks.',
    color: 'var(--success)',
    channelIds: ['cna', 'dd-india', 'firstpost', 'geo-news', 'india-today', 'mirror-now', 'ndtv', 'news9-live', 'times-now'],
  },
  {
    id: 'live-cams',
    label: 'LIVE CAMS',
    description: 'Camera-heavy monitoring with OSINT-style feeds and regional visuals.',
    color: 'var(--teal)',
    channelIds: ['inquizex-osint', 'multicam-live-tv', 'skyline-webcams', 'world-cam-live', 'earthcam', 'africanews', 'channels-tv', 'telesur-english', 'cgtn-europe'],
  },
];

export function getEmbedUrl(channelId: string, isMuted = true) {
  return `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=${isMuted ? '1' : '0'}`;
}

export function getLiveUrl(handle: string) {
  return `https://www.youtube.com/${handle}/live`;
}
