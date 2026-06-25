// Character image info
export type PipelineMode = 'standard' | 'omni'

export interface ImageInfo {
  filename: string
  orig_name: string
  added_at: string
  url?: string
}

export type KnowledgeSourceStatus = 'indexing' | 'ready' | 'failed'

export interface KnowledgeSource {
  id: string
  title: string
  filename: string
  mime_type: string
  relative_path?: string
  stored_path?: string
  indexable: boolean
  status: KnowledgeSourceStatus
  chunk_count: number
  error?: string
  created_at: string
  updated_at: string
  indexed_at?: string
}

export interface KnowledgeUploadSkippedFile {
  filename: string
  reason: string
}

// Character data model
export type AvatarBackend = 'local_image' | 'baidu_xiling'

export interface BaiduXilingCharacterConfig {
  figure_id: string
  figure_name?: string
  camera_id?: string
  thumbnail_url?: string
  preview_video_url?: string
  source_image_url?: string
  status?: string
  width?: number
  height?: number
}

export interface OfflineVideoTTSConfig {
  provider: string
  model?: string
  voice: string
}

export interface Character {
  id: string
  name: string
  description: string
  avatar_image: string
  avatar_backend: AvatarBackend
  baidu_xiling?: BaiduXilingCharacterConfig | null
  offline_video_tts?: OfflineVideoTTSConfig | null
  idle_video_url?: string
  idle_video_urls?: string[]
  use_face_crop: boolean
  mode: PipelineMode
  voice_provider: string
  voice_type: string
  components: CharacterComponents
  speaking_style: string
  personality: string
  welcome_message: string
  system_prompt: string
  tags: string[]
  images: ImageInfo[]
  active_image: string
  image_mode: string
  created_at: string
  updated_at: string
}

export type CharacterForm = Omit<Character, 'id' | 'created_at' | 'updated_at' | 'images' | 'active_image'>

export interface CharacterComponents {
  llm: string
  asr: string
  tts: string
  tts_model?: string
}

export interface ComponentOption {
  id: string
  name: string
  model: string
  default: boolean
  available: boolean
}

export interface ComponentsResponse {
  llm: ComponentOption[]
  asr: ComponentOption[]
  tts: ComponentOption[]
}

export type OfflineVideoStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface OfflineVideoJob {
  id: string
  character_id: string
  title: string
  provider?: string
  input_type: 'text' | 'audio'
  text?: string
  status: OfflineVideoStatus
  stage?: string
  message?: string
  progress: number
  error?: string
  audio_filename?: string
  video_filename?: string
  video_url?: string
  remote_video_url?: string
  baidu_task_id?: string
  duration_ms?: number
  width?: number
  height?: number
  fps?: number
  frame_count?: number
  audio_sample_rate?: number
  created_at: string
  updated_at: string
  finished_at?: string
}

// Settings
export interface DoubaoSettings {
  access_token: string
  app_id: string
}

export interface LiveKitSettings {
  url: string
  api_key: string
  api_secret: string
}

export interface ModelProviderSettings {
  dashscope_api_key: string
  openai_api_key: string
}

export interface InferenceSettings {
  grpc_addr: string
}

export interface Settings {
  doubao: DoubaoSettings
  livekit: LiveKitSettings
  model_providers: ModelProviderSettings
  inference: InferenceSettings
}

// Launch config
export interface ConfigParam {
  name: string
  path: string
  value: string | number
  readonly: boolean
  requires_restart: boolean
  options?: string[]
}

export interface ConfigSection {
  key: 'avatar' | 'video_output' | 'gpu' | string
  title: string
  badge: 'restart' | 'configurable'
  params: ConfigParam[]
  collapsed?: boolean
}

export interface LaunchConfig {
  active_model: string
  configured_default_model: string
  avatar_enabled: boolean
  config_status: AvatarModelConfigStatus
  sections: ConfigSection[]
}

export interface LaunchConfigUpdate {
  model: string
  params: Array<{ path: string; value: string | number }>
}

export interface AvatarModelConfigStatus {
  has_infer_params: boolean
  config_sections_available: string[]
}

export interface AvatarModelDescriptor {
  name: string
  display_name: string
  is_active: boolean
  is_configured_default: boolean
  config_status: AvatarModelConfigStatus
}

export interface AvatarModelInfo {
  active_model: string
  configured_default_model: string
  avatar_enabled: boolean
  models: AvatarModelDescriptor[]
  config_status: AvatarModelConfigStatus
}

// Voice types
export interface VoiceOption {
  label: string
  value: string
}

export const QWEN_TTS_MODEL_OPTIONS: VoiceOption[] = [
  { label: 'qwen3-tts-flash-realtime', value: 'qwen3-tts-flash-realtime' },
  { label: 'cosyvoice-v3-plus', value: 'cosyvoice-v3-plus' },
  { label: 'cosyvoice-v3-flash', value: 'cosyvoice-v3-flash' },
  { label: 'cosyvoice-v3.5-plus', value: 'cosyvoice-v3.5-plus' },
  { label: 'cosyvoice-v3.5-flash', value: 'cosyvoice-v3.5-flash' },
]

export const COSYVOICE_V3_FLASH_VOICE_OPTIONS: VoiceOption[] = [
  { label: '龙安洋 (longanyang)', value: 'longanyang' },
  { label: '龙安欢（V3） (longanhuan_v3)', value: 'longanhuan_v3' },
  { label: '龙安欢 (longanhuan)', value: 'longanhuan' },
  { label: '龙呼呼 (longhuhu_v3)', value: 'longhuhu_v3' },
  { label: '龙泡泡 (longpaopao_v3)', value: 'longpaopao_v3' },
  { label: '龙杰力豆 (longjielidou_v3)', value: 'longjielidou_v3' },
  { label: '龙仙 (longxian_v3)', value: 'longxian_v3' },
  { label: '龙铃 (longling_v3)', value: 'longling_v3' },
  { label: '龙闪闪 (longshanshan_v3)', value: 'longshanshan_v3' },
  { label: '龙牛牛 (longniuniu_v3)', value: 'longniuniu_v3' },
  { label: '龙嘉欣 (longjiaxin_v3)', value: 'longjiaxin_v3' },
  { label: '龙嘉怡 (longjiayi_v3)', value: 'longjiayi_v3' },
  { label: '龙安粤 (longanyue_v3)', value: 'longanyue_v3' },
  { label: '龙老铁 (longlaotie_v3)', value: 'longlaotie_v3' },
  { label: '龙陕哥 (longshange_v3)', value: 'longshange_v3' },
  { label: '龙安闽 (longanmin_v3)', value: 'longanmin_v3' },
  { label: 'loongkyong (loongkyong_v3)', value: 'loongkyong_v3' },
  { label: 'Riko (loongriko_v3)', value: 'loongriko_v3' },
  { label: 'loongtomoka (loongtomoka_v3)', value: 'loongtomoka_v3' },
  { label: 'loongabby (loongabby_v3)', value: 'loongabby_v3' },
  { label: 'loongandy (loongandy_v3)', value: 'loongandy_v3' },
  { label: 'loongannie (loongannie_v3)', value: 'loongannie_v3' },
  { label: 'loongava (loongava_v3)', value: 'loongava_v3' },
  { label: 'loongbeth (loongbeth_v3)', value: 'loongbeth_v3' },
  { label: 'loongbetty (loongbetty_v3)', value: 'loongbetty_v3' },
  { label: 'loongcally (loongcally_v3)', value: 'loongcally_v3' },
  { label: 'loongcindy (loongcindy_v3)', value: 'loongcindy_v3' },
  { label: 'loongdavid (loongdavid_v3)', value: 'loongdavid_v3' },
  { label: 'loongdonna (loongdonna_v3)', value: 'loongdonna_v3' },
  { label: 'loongemily (loongemily_v3)', value: 'loongemily_v3' },
  { label: 'loongeric (loongeric_v3)', value: 'loongeric_v3' },
  { label: 'loongluna (loongluna_v3)', value: 'loongluna_v3' },
  { label: 'loongluca (loongluca_v3)', value: 'loongluca_v3' },
  { label: 'loongtomoya (loongtomoya_v3)', value: 'loongtomoya_v3' },
  { label: 'Yuuna (loongyuuna_v3)', value: 'loongyuuna_v3' },
  { label: 'Yuuma (loongyuuma_v3)', value: 'loongyuuma_v3' },
  { label: 'Jihun (loongjihun_v3)', value: 'loongjihun_v3' },
  { label: 'loongindah (loongindah_v3)', value: 'loongindah_v3' },
  { label: '龙飞 (longfei_v3)', value: 'longfei_v3' },
  { label: '龙应笑 (longyingxiao_v3)', value: 'longyingxiao_v3' },
  { label: '龙应询 (longyingxun_v3)', value: 'longyingxun_v3' },
  { label: '龙应静 (longyingjing_v3)', value: 'longyingjing_v3' },
  { label: '龙应聆 (longyingling_v3)', value: 'longyingling_v3' },
  { label: '龙应桃 (longyingtao_v3)', value: 'longyingtao_v3' },
  { label: '龙小淳 (longxiaochun_v3)', value: 'longxiaochun_v3' },
  { label: '龙小夏 (longxiaoxia_v3)', value: 'longxiaoxia_v3' },
  { label: 'YUMI (longyumi_v3)', value: 'longyumi_v3' },
  { label: '龙安昀 (longanyun_v3)', value: 'longanyun_v3' },
  { label: '龙安温 (longanwen_v3)', value: 'longanwen_v3' },
  { label: '龙安莉 (longanli_v3)', value: 'longanli_v3' },
  { label: '龙安朗 (longanlang_v3)', value: 'longanlang_v3' },
  { label: '龙应沐 (longyingmu_v3)', value: 'longyingmu_v3' },
  { label: '龙安台 (longantai_v3)', value: 'longantai_v3' },
  { label: '龙华 (longhua_v3)', value: 'longhua_v3' },
  { label: '龙橙 (longcheng_v3)', value: 'longcheng_v3' },
  { label: '龙泽 (longze_v3)', value: 'longze_v3' },
  { label: '龙哲 (longzhe_v3)', value: 'longzhe_v3' },
  { label: '龙颜 (longyan_v3)', value: 'longyan_v3' },
  { label: '龙星 (longxing_v3)', value: 'longxing_v3' },
  { label: '龙天 (longtian_v3)', value: 'longtian_v3' },
  { label: '龙婉 (longwan_v3)', value: 'longwan_v3' },
  { label: '龙嫱 (longqiang_v3)', value: 'longqiang_v3' },
  { label: '龙菲菲 (longfeifei_v3)', value: 'longfeifei_v3' },
  { label: '龙浩 (longhao_v3)', value: 'longhao_v3' },
  { label: '龙安柔 (longanrou_v3)', value: 'longanrou_v3' },
  { label: '龙寒 (longhan_v3)', value: 'longhan_v3' },
  { label: '龙安智 (longanzhi_v3)', value: 'longanzhi_v3' },
  { label: '龙安灵 (longanling_v3)', value: 'longanling_v3' },
  { label: '龙安雅 (longanya_v3)', value: 'longanya_v3' },
  { label: '龙安亲 (longanqin_v3)', value: 'longanqin_v3' },
  { label: '龙妙 (longmiao_v3)', value: 'longmiao_v3' },
  { label: '龙三叔 (longsanshu_v3)', value: 'longsanshu_v3' },
  { label: '龙媛 (longyuan_v3)', value: 'longyuan_v3' },
  { label: '龙悦 (longyue_v3)', value: 'longyue_v3' },
  { label: '龙修 (longxiu_v3)', value: 'longxiu_v3' },
  { label: '龙楠 (longnan_v3)', value: 'longnan_v3' },
  { label: '龙安燃 (longanran_v3)', value: 'longanran_v3' },
  { label: '龙婉君 (longwanjun_v3)', value: 'longwanjun_v3' },
  { label: '龙逸尘 (longyichen_v3)', value: 'longyichen_v3' },
  { label: '龙老伯 (longlaobo_v3)', value: 'longlaobo_v3' },
  { label: '龙老姨 (longlaoyi_v3)', value: 'longlaoyi_v3' },
  { label: '龙机器 (longjiqi_v3)', value: 'longjiqi_v3' },
  { label: '龙猴哥 (longhouge_v3)', value: 'longhouge_v3' },
  { label: '龙黛玉 (longdaiyu_v3)', value: 'longdaiyu_v3' },
  { label: '龙安宣 (longanxuan_v3)', value: 'longanxuan_v3' },
  { label: '龙硕 (longshuo_v3)', value: 'longshuo_v3' },
  { label: '龙书 (longshu_v3)', value: 'longshu_v3' },
  { label: 'Bella3.0 (loongbella_v3)', value: 'loongbella_v3' },
]

export const COSYVOICE_V3_PLUS_VOICE_OPTIONS: VoiceOption[] = [
  { label: '龙安洋 (longanyang)', value: 'longanyang' },
  { label: '龙安欢 (longanhuan)', value: 'longanhuan' },
]

// Aliyun Qwen TTS system voices — values match the voice request parameter.
export const QWEN_TTS_VOICE_OPTIONS: VoiceOption[] = [
  { label: '芊悦 (Cherry)', value: 'Cherry' },
  { label: '苏瑶 (Serena)', value: 'Serena' },
  { label: '晨煦 (Ethan)', value: 'Ethan' },
  { label: '千雪 (Chelsie)', value: 'Chelsie' },
  { label: '茉兔 (Momo)', value: 'Momo' },
  { label: '十三 (Vivian)', value: 'Vivian' },
  { label: '月白 (Moon)', value: 'Moon' },
  { label: '四月 (Maia)', value: 'Maia' },
  { label: '凯 (Kai)', value: 'Kai' },
  { label: '不吃鱼 (Nofish)', value: 'Nofish' },
  { label: '萌宝 (Bella)', value: 'Bella' },
  { label: '詹妮弗 (Jennifer)', value: 'Jennifer' },
  { label: '甜茶 (Ryan)', value: 'Ryan' },
  { label: '卡捷琳娜 (Katerina)', value: 'Katerina' },
  { label: '艾登 (Aiden)', value: 'Aiden' },
  { label: '沧明子 (Eldric Sage)', value: 'Eldric Sage' },
  { label: '乖小妹 (Mia)', value: 'Mia' },
  { label: '沙小弥 (Mochi)', value: 'Mochi' },
  { label: '燕铮莺 (Bellona)', value: 'Bellona' },
  { label: '田叔 (Vincent)', value: 'Vincent' },
  { label: '萌小姬 (Bunny)', value: 'Bunny' },
  { label: '阿闻 (Neil)', value: 'Neil' },
  { label: '墨讲师 (Elias)', value: 'Elias' },
  { label: '徐大爷 (Arthur)', value: 'Arthur' },
  { label: '邻家妹妹 (Nini)', value: 'Nini' },
  { label: '小婉 (Seren)', value: 'Seren' },
  { label: '顽屁小孩 (Pip)', value: 'Pip' },
  { label: '少女阿月 (Stella)', value: 'Stella' },
  { label: '博德加 (Bodega)', value: 'Bodega' },
  { label: '索尼莎 (Sonrisa)', value: 'Sonrisa' },
  { label: '阿列克 (Alek)', value: 'Alek' },
  { label: '多尔切 (Dolce)', value: 'Dolce' },
  { label: '素熙 (Sohee)', value: 'Sohee' },
  { label: '小野杏 (Ono Anna)', value: 'Ono Anna' },
  { label: '莱恩 (Lenn)', value: 'Lenn' },
  { label: '埃米尔安 (Emilien)', value: 'Emilien' },
  { label: '安德雷 (Andre)', value: 'Andre' },
  { label: '拉迪奥·戈尔 (Radio Gol)', value: 'Radio Gol' },
  { label: '上海-阿珍 (Jada)', value: 'Jada' },
  { label: '北京-晓东 (Dylan)', value: 'Dylan' },
  { label: '南京-老李 (Li)', value: 'Li' },
  { label: '陕西-秦川 (Marcus)', value: 'Marcus' },
  { label: '闽南-阿杰 (Roy)', value: 'Roy' },
  { label: '天津-李彼得 (Peter)', value: 'Peter' },
  { label: '四川-晴儿 (Sunny)', value: 'Sunny' },
  { label: '四川-程川 (Eric)', value: 'Eric' },
  { label: '粤语-阿强 (Rocky)', value: 'Rocky' },
  { label: '粤语-阿清 (Kiki)', value: 'Kiki' },
]

// Aliyun Qwen3.5 Omni realtime voices — values match the voice request parameter.
export const QWEN_OMNI_VOICE_OPTIONS: VoiceOption[] = [
  { label: '甜甜 (Tina)', value: 'Tina' },
  { label: '林欣宜 (Cindy)', value: 'Cindy' },
  { label: '清欢 (Liora Mira)', value: 'Liora Mira' },
  { label: '知芝 (Sunnybobi)', value: 'Sunnybobi' },
  { label: '林川野 (Raymond)', value: 'Raymond' },
  { label: '晨煦 (Ethan)', value: 'Ethan' },
  { label: '予安 (Theo Calm)', value: 'Theo Calm' },
  { label: '苏瑶 (Serena)', value: 'Serena' },
  { label: '厚 (Harvey)', value: 'Harvey' },
  { label: '四月 (Maia)', value: 'Maia' },
  { label: '江晨 (Evan)', value: 'Evan' },
  { label: '小乔妹 (Qiao)', value: 'Qiao' },
  { label: '茉兔 (Momo)', value: 'Momo' },
  { label: '伟伦 (Wil)', value: 'Wil' },
  { label: '台普 - 安琪 (Angel)', value: 'Angel' },
  { label: '东厂 - 李公公 (Li Cassian)', value: 'Li Cassian' },
  { label: '温柔生活博主 - 舒然 (Mia)', value: 'Mia' },
  { label: '喜剧担当 - 阿逗 (Joyner)', value: 'Joyner' },
  { label: '金爷 (Gold)', value: 'Gold' },
  { label: '卡捷琳娜 (Katerina)', value: 'Katerina' },
  { label: '甜茶 (Ryan)', value: 'Ryan' },
  { label: '詹妮弗 (Jennifer)', value: 'Jennifer' },
  { label: '艾登 (Aiden)', value: 'Aiden' },
  { label: '敏儿 (Mione)', value: 'Mione' },
  { label: '四川 - 晴儿 (Sunny)', value: 'Sunny' },
  { label: '北京 - 晓东 (Dylan)', value: 'Dylan' },
  { label: '四川 - 程川 (Eric)', value: 'Eric' },
  { label: '天津 - 李彼得 (Peter)', value: 'Peter' },
  { label: '阿樸伯 (Joseph Chen)', value: 'Joseph Chen' },
  { label: '陕西 - 秦川 (Marcus)', value: 'Marcus' },
  { label: '南京 - 老李 (Li)', value: 'Li' },
  { label: '粤语 - 阿强 (Rocky)', value: 'Rocky' },
  { label: '素熙 (Sohee)', value: 'Sohee' },
  { label: '莱恩 (Lenn)', value: 'Lenn' },
  { label: '小野杏 (Ono Anna)', value: 'Ono Anna' },
  { label: '索尼莎 (Sonrisa)', value: 'Sonrisa' },
  { label: '博德加 (Bodega)', value: 'Bodega' },
  { label: '埃米尔安 (Emilien)', value: 'Emilien' },
  { label: '安德雷 (Andre)', value: 'Andre' },
  { label: '拉迪奥·戈尔 (Radio Gol)', value: 'Radio Gol' },
  { label: '阿列克 (Alek)', value: 'Alek' },
  { label: '阿力 (Rizky)', value: 'Rizky' },
  { label: '萝雅 (Roya)', value: 'Roya' },
  { label: '阿尔达 (Arda)', value: 'Arda' },
  { label: '阿幸 (Hana)', value: 'Hana' },
  { label: '多尔切 (Dolce)', value: 'Dolce' },
  { label: '雅克 (Jakub)', value: 'Jakub' },
  { label: '海娜 (Griet)', value: 'Griet' },
  { label: '艾莉卡 (Eliška)', value: 'Eliška' },
  { label: '玛丽娜 (Marina)', value: 'Marina' },
  { label: '西芮 (Siiri)', value: 'Siiri' },
  { label: '林恩 (Ingrid)', value: 'Ingrid' },
  { label: '海娜 (Sigga)', value: 'Sigga' },
  { label: '雅娜 (Bea)', value: 'Bea' },
  { label: '思怡 (Chloe)', value: 'Chloe' },
]

// SC2.0 official voices — values match SC20_VOICES keys in doubao_config.py
export const VOICE_OPTIONS: VoiceOption[] = [
  // Female
  { label: '傲娇女友', value: '傲娇女友' },
  { label: '冰娇姐姐', value: '冰娇姐姐' },
  { label: '成熟姐姐', value: '成熟姐姐' },
  { label: '可爱女生', value: '可爱女生' },
  { label: '暖心学姐', value: '暖心学姐' },
  { label: '贴心女友', value: '贴心女友' },
  { label: '温柔文雅', value: '温柔文雅' },
  { label: '妩媚御姐', value: '妩媚御姐' },
  { label: '性感御姐', value: '性感御姐' },
  // Male
  { label: '爱气凌人', value: '爱气凌人' },
  { label: '傲娇公子', value: '傲娇公子' },
  { label: '傲娇精英', value: '傲娇精英' },
  { label: '傲慢少爷', value: '傲慢少爷' },
  { label: '霸道少爷', value: '霸道少爷' },
  { label: '冰娇白莲', value: '冰娇白莲' },
  { label: '不羁青年', value: '不羁青年' },
  { label: '成熟总裁', value: '成熟总裁' },
  { label: '磁性男嗓', value: '磁性男嗓' },
  { label: '醋精男友', value: '醋精男友' },
  { label: '风发少年', value: '风发少年' },
  { label: '腹黑公子', value: '腹黑公子' },
]

export const OPENAI_VOICE_OPTIONS: VoiceOption[] = [
  { label: 'alloy', value: 'alloy' },
  { label: 'ash', value: 'ash' },
  { label: 'ballad', value: 'ballad' },
  { label: 'coral', value: 'coral' },
  { label: 'echo', value: 'echo' },
  { label: 'fable', value: 'fable' },
  { label: 'nova', value: 'nova' },
  { label: 'onyx', value: 'onyx' },
  { label: 'sage', value: 'sage' },
  { label: 'shimmer', value: 'shimmer' },
]
