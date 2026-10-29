'use strict';

/* =========================================================
   胃安 · 交互与规则引擎
   纯前端、无网络请求、无数据持久化。
   ========================================================= */

/* ---------- 1. 急诊分诊红线 ---------- */

const TRIAGE_FLAGS = [
  {
    id: 'severe_pain',
    icon: 'i-bolt',
    title: '突然剧烈腹痛，或疼痛持续加重',
    desc: '刀割样、撕裂样、整个肚子都痛，或痛到直不起腰'
  },
  {
    id: 'bleeding',
    icon: 'i-drop',
    title: '呕血 / 咖啡渣样呕吐物，或黑便',
    desc: '呕吐物带血或呈咖啡色；大便发黑、发亮、像柏油'
  },
  {
    id: 'chest',
    icon: 'i-heart',
    title: '胸痛 / 胸闷 / 压迫感，伴大汗或气短',
    desc: '尤其疼痛放射到左肩、下颌、左臂，或活动后加重'
  },
  {
    id: 'rigid',
    icon: 'i-shield',
    title: '腹部板硬、拒按，或外伤后腹痛',
    desc: '肚子摸起来像木板一样硬，一按就剧痛，或近期受过撞击'
  },
  {
    id: 'fever_jaundice',
    icon: 'i-temp',
    title: '高热寒战伴腹痛，或皮肤眼白发黄',
    desc: '发热打寒战，同时右上腹/上腹痛，或出现黄疸'
  },
  {
    id: 'dehydration',
    icon: 'i-water',
    title: '持续呕吐无法进水，尿量明显减少',
    desc: '喝什么都吐、口干、头晕、尿少或超过 8 小时没有小便'
  },
  {
    id: 'syncope',
    icon: 'i-pulse',
    title: '晕厥、意识模糊、面色苍白、冷汗',
    desc: '眼前发黑、站不住、叫不醒，或突然出很多冷汗'
  },
  {
    id: 'pregnancy',
    icon: 'i-mother',
    title: '怀孕 / 可能怀孕，伴腹痛或阴道出血',
    desc: '育龄女性出现下腹痛、停经后出血，需要排除妇科急症'
  }
];

/* ---------- 2. 人体部位与六组问诊 ---------- */

const BODY_LOCATIONS = [
  { value: 'epigastric', label: '上腹正中 · 心窝', short: '心窝', marker: '1' },
  { value: 'right_upper', label: '右上腹（你的右侧）', short: '右上腹', marker: '2' },
  { value: 'left_upper', label: '左上腹（你的左侧）', short: '左上腹', marker: '3' },
  { value: 'periumbilical', label: '脐周', short: '脐周', marker: '4' },
  { value: 'lower', label: '下腹 / 小腹', short: '下腹', marker: '5' },
  { value: 'diffuse', label: '整个肚子', short: '整个肚子', marker: '6' },
  { value: 'unsure', label: '说不清具体位置', short: '说不清', marker: '?' }
];

const QUIZ_STEPS = [
  {
    id: 'step-main',
    navTitle: '身体哪里不适',
    navSub: '感觉 · 部位 · 时间',
    kicker: 'STEP 01 · 身体哪里不适',
    title: '身体哪里不适？',
    desc: '最主要的感觉可以多选，再点人体图选择最不舒服的部位。',
    fields: [
      {
        key: 'chief',
        label: '最主要的感觉',
        type: 'multi',
        required: true,
        hint: '可多选',
        options: [
          { value: 'bloating', title: '胀满 / 撑胀', hint: '像有气顶着、鼓鼓的' },
          { value: 'pain', title: '隐痛 / 钝痛', hint: '说不上尖锐，但一直不舒服' },
          { value: 'burning', title: '灼痛 / 烧灼感', hint: '像有火在烧' },
          { value: 'cramp', title: '绞痛 / 阵发痛', hint: '一阵一阵拧着痛' },
          { value: 'fullness', title: '堵闷 / 早饱', hint: '吃一点就堵、就饱' },
          { value: 'nausea', title: '恶心 / 想吐', hint: '反胃、干呕' },
          { value: 'other', title: '说不清 / 其他', hint: '位置或感觉很难描述' }
        ]
      },
      {
        key: 'location',
        label: '最不舒服的位置',
        type: 'single',
        required: true,
        hint: '可点图选择',
        bodyMap: true,
        options: [
          { value: 'epigastric', title: '上腹正中（心窝）', hint: '胸骨下端与肚脐之间' },
          { value: 'left_upper', title: '左上腹', hint: '胃所在的一侧' },
          { value: 'right_upper', title: '右上腹', hint: '右侧肋骨下' },
          { value: 'periumbilical', title: '脐周', hint: '肚脐周围' },
          { value: 'diffuse', title: '整个肚子', hint: '范围很大、说不清边界' },
          { value: 'lower', title: '下腹 / 小腹', hint: '肚脐以下' },
          { value: 'unsure', title: '说不清', hint: '指不出明确位置' }
        ]
      },
      {
        key: 'duration',
        label: '不舒服多久了？',
        type: 'single',
        required: true,
        hint: '单选',
        columns: 3,
        options: [
          { value: 'today', title: '今天刚开始', hint: '数小时内' },
          { value: 'days', title: '2–3 天', hint: '近期出现' },
          { value: 'weeks', title: '1–2 周', hint: '持续一段时间' },
          { value: 'month', title: '1 个月以上', hint: '迁延不愈' },
          { value: 'recurrent', title: '反复 3 个月以上', hint: '时好时坏' }
        ]
      },
      {
        key: 'radiation',
        label: '疼痛会牵连到其他部位吗？',
        type: 'multi',
        hint: '可多选',
        options: [
          { value: 'none', title: '不会，固定在一处' },
          { value: 'back', title: '会牵连到后背', hint: '需要留意胰腺、胆囊等' },
          { value: 'right_shoulder', title: '会牵连到右肩 / 右背', hint: '胆囊问题较常见' },
          { value: 'left_arm', title: '会牵连到左肩 / 下颌 / 左臂', hint: '需要特别留意心脏问题' },
          { value: 'unsure', title: '说不清' }
        ]
      },
      {
        key: 'severity',
        label: '现在的不适有多重？',
        type: 'scale',
        required: true,
        hint: '0–10，拖动选择'
      }
    ]
  },
  {
    id: 'step-food',
    navTitle: '问题总结',
    navSub: '一句话 · 饮食 · 反流',
    kicker: 'STEP 03 · 问题总结与饮食',
    title: '用一句话，总结这次最困扰你的问题',
    desc: '先写下最困扰你的问题，再补充饮食、反流和诱发因素；这些线索会一起进入分析。',
    fields: [
      {
        key: 'summary',
        label: '一句话总结',
        type: 'textarea',
        hint: '可选 · 例如：一吃油腻就右上腹胀痛，还会反酸',
        placeholder: '例如：最近一个月饭后上腹胀，晚上躺下会反酸',
        maxlength: 200
      },
      {
        key: 'mealRelation',
        label: '和吃饭的关系',
        type: 'single',
        required: true,
        hint: '单选',
        options: [
          { value: 'before', title: '空腹 / 饭前更明显', hint: '吃点东西可能缓解' },
          { value: 'after', title: '饭后更明显', hint: '吃完半小时到两小时加重' },
          { value: 'night', title: '夜间会痛醒', hint: '睡着后被痛醒' },
          { value: 'none', title: '和吃饭关系不大', hint: '什么时候都可能不舒服' },
          { value: 'unsure', title: '说不清' }
        ]
      },
      {
        key: 'warmRelief',
        label: '喝热水或热敷后',
        type: 'single',
        hint: '单选',
        options: [
          { value: 'better', title: '会缓解', hint: '暖和一点就舒服' },
          { value: 'worse', title: '反而加重', hint: '越热越难受' },
          { value: 'same', title: '没什么变化' },
          { value: 'notried', title: '没试过' }
        ]
      },
      {
        key: 'appetite',
        label: '最近胃口怎么样？',
        type: 'single',
        hint: '单选',
        options: [
          { value: 'normal', title: '正常' },
          { value: 'low', title: '变差 / 吃得少' },
          { value: 'high', title: '容易饿 / 吃得多' },
          { value: 'none', title: '完全不想吃' }
        ]
      },
      {
        key: 'symptoms',
        label: '同时还有哪些感觉？',
        type: 'multi',
        hint: '可多选',
        options: [
          { value: 'reflux', title: '反酸 / 烧心' },
          { value: 'bitter', title: '口苦' },
          { value: 'dry_mouth', title: '口干' },
          { value: 'sticky', title: '口黏' },
          { value: 'sweet', title: '口甜' },
          { value: 'belch', title: '嗳气 / 打嗝' },
          { value: 'nausea', title: '恶心' },
          { value: 'vomit', title: '呕吐' },
          { value: 'early_satiety', title: '早饱', hint: '吃一点就饱' },
          { value: 'bad_breath', title: '口气重' },
          { value: 'none', title: '没有以上' }
        ]
      },
      {
        key: 'triggers',
        label: '什么会让它加重？',
        type: 'multi',
        hint: '可多选',
        options: [
          { value: 'spicy', title: '辛辣' },
          { value: 'cold', title: '生冷 / 冰饮' },
          { value: 'fatty', title: '油腻' },
          { value: 'alcohol', title: '饮酒' },
          { value: 'caffeine', title: '咖啡 / 浓茶' },
          { value: 'overeat', title: '暴饮暴食' },
          { value: 'fasting', title: '空腹太久' },
          { value: 'stress', title: '压力 / 情绪' },
          { value: 'nsaid', title: '止痛药 / 阿司匹林' },
          { value: 'bad_food', title: '不洁 / 隔夜食物' },
          { value: 'activity', title: '活动后加重' },
          { value: 'none', title: '无明显诱因' }
        ]
      }
    ]
  },
  {
    id: 'step-body',
    navTitle: '二便与全身',
    navSub: '大便 · 寒热 · 出汗',
    kicker: 'STEP 03 · 二便与寒热',
    title: '身体整体，处在什么状态？',
    desc: '中医看胃，不只看胃。大便、寒热、饮水偏好和出汗，能帮助判断寒热虚实。',
    fields: [
      {
        key: 'stool',
        label: '大便的性状',
        type: 'single',
        required: true,
        hint: '单选',
        options: [
          { value: 'normal', title: '正常成形' },
          { value: 'dry', title: '偏干 / 便秘' },
          { value: 'loose', title: '溏稀 / 不成形' },
          { value: 'sticky', title: '黏滞 / 排不净' },
          { value: 'alternating', title: '便秘腹泻交替' },
          { value: 'black', title: '黑便 / 柏油样便', hint: '危险信号，建议立即就医' },
          { value: 'blood', title: '带血 / 带黏液', hint: '需要医生评估' }
        ]
      },
      {
        key: 'frequency',
        label: '大便频率',
        type: 'single',
        hint: '单选',
        options: [
          { value: 'once', title: '每天 1 次' },
          { value: 'multiple', title: '每天多次' },
          { value: 'every2', title: '2–3 天 1 次' },
          { value: 'less', title: '一周少于 3 次' },
          { value: 'irregular', title: '不规律' }
        ]
      },
      {
        key: 'coldHeat',
        label: '你更怕冷还是怕热？',
        type: 'single',
        hint: '单选',
        options: [
          { value: 'cold', title: '怕冷 / 手脚凉', hint: '喜欢暖和、热饮' },
          { value: 'hot', title: '怕热 / 容易上火', hint: '容易口干、长痘' },
          { value: 'mixed', title: '忽冷忽热' },
          { value: 'normal', title: '都还好' }
        ]
      },
      {
        key: 'drink',
        label: '喝水偏好',
        type: 'single',
        hint: '单选',
        options: [
          { value: 'warm', title: '喜欢热饮' },
          { value: 'cold', title: '喜欢冷饮' },
          { value: 'either', title: '都可以' },
          { value: 'dry_no_thirst', title: '口干但不想喝' }
        ]
      },
      {
        key: 'sweat',
        label: '出汗情况',
        type: 'single',
        hint: '单选',
        options: [
          { value: 'normal', title: '正常' },
          { value: 'easy', title: '容易出汗' },
          { value: 'night', title: '夜间盗汗' },
          { value: 'little', title: '很少出汗' }
        ]
      },
      {
        key: 'general',
        label: '有没有以下全身表现？',
        type: 'multi',
        hint: '可多选',
        options: [
          { value: 'fatigue', title: '乏力' },
          { value: 'dizzy', title: '头晕 / 心慌' },
          { value: 'weight_loss', title: '体重下降' },
          { value: 'fever', title: '发热' },
          { value: 'jaundice', title: '皮肤 / 眼白发黄' },
          { value: 'chest', title: '胸闷 / 气短' },
          { value: 'cold_sweat', title: '冷汗' },
          { value: 'dysphagia', title: '吞咽困难 / 进食哽噎' },
          { value: 'none', title: '没有以上' }
        ]
      }
    ]
  },
  {
    id: 'step-look',
    navTitle: '舌面手诊',
    navSub: '舌象 · 面色 · 手象',
    kicker: 'STEP 05 · 舌面手诊',
    title: '如果愿意，拍一张舌象、面部和手掌照片',
    desc: '自然光下、不化妆、不用滤镜。照片只保存在当前页面，供你自己对照观察，不会上传，也不做自动诊断。',
    layout: 'look',
    fields: [
      {
        key: 'tongueBody',
        group: 'tongue',
        label: '舌质颜色',
        type: 'single',
        hint: '可选 · 不会看可跳过',
        options: [
          { value: 'normal', title: '淡红', swatch: '#E7A99F' },
          { value: 'pale', title: '淡白', swatch: '#F0D7CC' },
          { value: 'red', title: '偏红', swatch: '#D66C60' },
          { value: 'purple', title: '紫暗 / 有瘀点', swatch: '#8E5C69' },
          { value: 'unknown', title: '不会看 / 跳过' }
        ]
      },
      {
        key: 'tongueShape',
        group: 'tongue',
        label: '舌体形态',
        type: 'single',
        hint: '可选 · 不会看可跳过',
        options: [
          { value: 'normal', title: '正常' },
          { value: 'swollen', title: '胖大', hint: '舌头显得胖、充满口腔' },
          { value: 'teeth', title: '齿痕', hint: '舌边有牙齿压痕' },
          { value: 'thin', title: '瘦薄' },
          { value: 'cracks', title: '裂纹', hint: '舌面有裂纹' },
          { value: 'unknown', title: '不会看 / 跳过' }
        ]
      },
      {
        key: 'tongueCoat',
        group: 'tongue',
        label: '舌苔情况',
        type: 'single',
        hint: '可选 · 不会看可跳过',
        options: [
          { value: 'thin_white', title: '薄白', swatch: '#F6F0E2' },
          { value: 'white_thick', title: '白厚 / 白腻', swatch: '#E5DBC4' },
          { value: 'yellow', title: '黄 / 黄腻', swatch: '#D6B25B' },
          { value: 'none', title: '少苔 / 无苔', swatch: '#E9C7BC' },
          { value: 'peeled', title: '剥落 / 地图舌', swatch: '#E3B7AA' },
          { value: 'unknown', title: '不会看 / 跳过' }
        ]
      },
      {
        key: 'sublingual',
        group: 'tongue',
        label: '舌下络脉',
        type: 'single',
        hint: '可选 · 舌头向上卷起观察',
        options: [
          { value: 'normal', title: '正常 / 不明显' },
          { value: 'purple', title: '青紫 / 怒张', hint: '舌下血管明显发紫、变粗' },
          { value: 'unknown', title: '不会看 / 跳过' }
        ]
      },
      {
        key: 'faceColor',
        group: 'face',
        label: '面色',
        type: 'single',
        hint: '可选 · 自然光下观察',
        options: [
          { value: 'normal', title: '红润', swatch: '#E7B3A3' },
          { value: 'pale', title: '苍白', swatch: '#F2DED5' },
          { value: 'sallow', title: '萎黄', swatch: '#D9C08A' },
          { value: 'flushed', title: '潮红', swatch: '#D98274' },
          { value: 'dark', title: '晦暗', swatch: '#A58B7A' },
          { value: 'unknown', title: '不会看 / 跳过' }
        ]
      },
      {
        key: 'faceShine',
        group: 'face',
        label: '面部光泽 / 油脂',
        type: 'single',
        hint: '可选',
        options: [
          { value: 'normal', title: '有光泽' },
          { value: 'dull', title: '少华 / 发暗' },
          { value: 'oily', title: '容易出油' },
          { value: 'unknown', title: '不会看 / 跳过' }
        ]
      },
      {
        key: 'eyes',
        group: 'face',
        label: '眼周状态',
        type: 'single',
        hint: '可选',
        options: [
          { value: 'normal', title: '正常' },
          { value: 'dark_circles', title: '黑眼圈明显' },
          { value: 'puffy', title: '眼睑浮肿' },
          { value: 'unknown', title: '不会看 / 跳过' }
        ]
      },
      {
        key: 'lips',
        group: 'face',
        label: '口唇颜色',
        type: 'single',
        hint: '可选',
        options: [
          { value: 'normal', title: '淡红', swatch: '#D98C7E' },
          { value: 'pale', title: '淡白', swatch: '#EDCFC5' },
          { value: 'red', title: '红赤', swatch: '#C85C50' },
          { value: 'purple', title: '紫暗', swatch: '#87535D' },
          { value: 'unknown', title: '不会看 / 跳过' }
        ]
      },
      {
        key: 'handColor',
        group: 'hand',
        label: '手掌颜色',
        type: 'single',
        hint: '自然光下看掌心',
        options: [
          { value: 'normal', title: '淡红 / 粉红、有光泽', swatch: '#E6B0A2' },
          { value: 'pale', title: '偏白 / 无光泽', swatch: '#EFD9D0' },
          { value: 'red', title: '偏红 / 鲜红', swatch: '#D77568' },
          { value: 'yellow', title: '偏黄 / 暗黄', swatch: '#D8BF85' },
          { value: 'cyan', title: '偏青 / 青紫', swatch: '#8DA8A0' },
          { value: 'dark', title: '晦暗 / 黑褐', swatch: '#92796E' },
          { value: 'unknown', title: '不会看 / 跳过' }
        ]
      },
      {
        key: 'handThenar',
        group: 'hand',
        label: '大鱼际（拇指根隆起处）',
        type: 'single',
        hint: '看形态、颜色和青筋',
        options: [
          { value: 'normal', title: '丰满有力、颜色正常' },
          { value: 'flat', title: '扁平 / 松软' },
          { value: 'thick', title: '过于肥厚' },
          { value: 'cyan', title: '发青 / 青紫' },
          { value: 'red', title: '发红' },
          { value: 'veins', title: '青筋明显' },
          { value: 'grid', title: '皮肤粗糙 / 格子纹' },
          { value: 'unknown', title: '不会看 / 跳过' }
        ]
      },
      {
        key: 'handTemperature',
        group: 'hand',
        label: '手心温度与手汗',
        type: 'single',
        hint: '摸一摸手心、手背',
        options: [
          { value: 'normal', title: '温度正常、干湿适中' },
          { value: 'palm_hot', title: '只有手心热' },
          { value: 'back_hot', title: '只有手背热' },
          { value: 'cold', title: '手总是凉' },
          { value: 'wet', title: '手心湿黏 / 汗多' },
          { value: 'dry', title: '手心干燥' },
          { value: 'unknown', title: '说不清 / 跳过' }
        ]
      },
      {
        key: 'handVeins',
        group: 'hand',
        label: '手上青筋位置',
        type: 'single',
        hint: '看手背和掌心静脉',
        options: [
          { value: 'none', title: '不明显' },
          { value: 'thumb', title: '拇指根部明显' },
          { value: 'palm', title: '掌心明显' },
          { value: 'back', title: '手背明显' },
          { value: 'unknown', title: '不会看 / 跳过' }
        ]
      },
      {
        key: 'handRedFlags',
        group: 'hand',
        label: '手部需要留意的征象',
        type: 'multi',
        hint: '可多选 · 不确定可跳过',
        options: [
          { value: 'liver_palm', title: '大小鱼际朱砂色斑，按压变白', hint: '肝掌样表现' },
          { value: 'dark_spot', title: '手掌黑褐色 / 深咖啡色斑' },
          { value: 'nail_color', title: '指甲发紫 / 发黄 / 发蓝' },
          { value: 'nail_shape', title: '甲面凹凸 / 内扣 / 灰黑竖纹' },
          { value: 'thenar_chest', title: '拇指根青筋 + 胸闷胸痛' },
          { value: 'none', title: '没有以上' }
        ]
      }
    ]
  },
  {
    id: 'step-mind',
    navTitle: '发甲与情绪',
    navSub: '发质 · 指甲 · 牙龈 · 眼底',
    kicker: 'STEP 05 · 发甲、牙龈与眼底',
    title: '头发、指甲和牙龈，也在透露身体的信号',
    desc: '中医望诊也看发质、指甲和牙龈的荣枯。眼底需要眼科检查，没有检查结果可以跳过；没有标准答案。',
    fields: [
      {
        key: 'hair',
        label: '发质与头发状态',
        type: 'single',
        hint: '可选',
        options: [
          { value: 'normal', title: '正常' },
          { value: 'dry', title: '干枯 / 易断', hint: '缺乏光泽、毛躁' },
          { value: 'oily', title: '容易油腻', hint: '洗后很快出油' },
          { value: 'loss', title: '脱发增多' },
          { value: 'gray', title: '早白' },
          { value: 'other', title: '其他 / 说不清' }
        ]
      },
      {
        key: 'nails',
        label: '指甲状态',
        type: 'single',
        hint: '可选',
        options: [
          { value: 'normal', title: '红润坚韧' },
          { value: 'pale', title: '苍白', hint: '甲床颜色偏淡' },
          { value: 'brittle', title: '脆薄易断' },
          { value: 'ridges', title: '纵纹明显' },
          { value: 'purple', title: '紫暗' },
          { value: 'other', title: '其他 / 说不清' }
        ]
      },
      {
        key: 'gums',
        label: '牙龈状态',
        type: 'single',
        hint: '可选 · 刷牙或咬硬物时是否出血',
        options: [
          { value: 'normal', title: '正常' },
          { value: 'bleed', title: '容易出血', hint: '刷牙、咬苹果等容易见血' },
          { value: 'swollen', title: '红肿 / 疼痛' },
          { value: 'receding', title: '萎缩 / 牙根暴露' },
          { value: 'pale', title: '牙龈苍白' },
          { value: 'unknown', title: '不会看 / 跳过' }
        ]
      },
      {
        key: 'fundus',
        label: '眼底状态',
        type: 'single',
        hint: '需眼科检查 · 没有结果可跳过',
        options: [
          { value: 'unknown', title: '未检查 / 不清楚' },
          { value: 'normal', title: '检查正常' },
          { value: 'hemorrhage', title: '出血', hint: '眼底检查发现出血' },
          { value: 'exudate', title: '渗出 / 水肿' },
          { value: 'vessel', title: '血管变细 / 动脉硬化' },
          { value: 'other', title: '其他异常' }
        ]
      },
      {
        key: 'mood',
        label: '最近的情绪状态',
        type: 'single',
        hint: '单选',
        options: [
          { value: 'stable', title: '比较平稳' },
          { value: 'stress', title: '压力大 / 紧张' },
          { value: 'irritable', title: '易怒 / 烦躁' },
          { value: 'low', title: '低落 / 思虑多' }
        ]
      },
      {
        key: 'sleep',
        label: '睡眠质量',
        type: 'single',
        hint: '单选',
        options: [
          { value: 'good', title: '睡得好' },
          { value: 'hard', title: '入睡困难' },
          { value: 'dream', title: '多梦易醒' },
          { value: 'early', title: '早醒' },
          { value: 'sleepy', title: '白天嗜睡' }
        ]
      }
    ]
  },
  {
    id: 'step-history',
    navTitle: '基本信息与病史',
    navSub: '性别 · 年龄 · 体型 · 用药 · 家族史',
    kicker: 'STEP 01 · 基本信息与病史',
    title: '先填基本信息，帮助判断风险高低',
    desc: '性别、具体年龄、既往胃病、用药和家族史会影响就医优先级。信息只在当前页面使用。',
    fields: [
      {
        key: 'sex',
        label: '生理性别',
        type: 'single',
        required: true,
        hint: '单选',
        options: [
          { value: 'male', title: '男' },
          { value: 'female', title: '女' }
        ]
      },
      {
        key: 'age',
        label: '你的年龄',
        type: 'number',
        required: true,
        hint: '填写具体岁数',
        min: 0,
        max: 120,
        unit: '岁'
      },
      {
        key: 'bodyType',
        label: '你的体型',
        type: 'single',
        required: false,
        hint: '单选 · 可按最近半年的状态',
        options: [
          { value: 'thin', title: '偏瘦', hint: '肌肉偏少、容易觉得单薄' },
          { value: 'normal', title: '中等', hint: '不胖不瘦' },
          { value: 'overweight', title: '偏胖', hint: '腹部或全身肉感较明显' },
          { value: 'obese', title: '肥胖', hint: '体重明显超标' },
          { value: 'unsure', title: '不确定' }
        ]
      },
      {
        key: 'history',
        label: '既往胃部 / 胆胰问题',
        type: 'multi',
        hint: '可多选',
        options: [
          { value: 'gastritis', title: '慢性胃炎' },
          { value: 'ulcer', title: '胃 / 十二指肠溃疡' },
          { value: 'reflux', title: '胃食管反流' },
          { value: 'hp', title: '幽门螺杆菌阳性' },
          { value: 'gallstone', title: '胆结石 / 胆囊炎' },
          { value: 'pancreatitis', title: '胰腺炎' },
          { value: 'none', title: '从未检查 / 没有' },
          { value: 'other', title: '其他' }
        ]
      },
      {
        key: 'meds',
        label: '正在服用哪些药物？',
        type: 'multi',
        hint: '可多选',
        options: [
          { value: 'nsaid', title: '止痛药 / 阿司匹林' },
          { value: 'steroid', title: '激素' },
          { value: 'acid', title: '胃药（抑酸 / 抗酸）' },
          { value: 'tcm', title: '中药 / 中成药' },
          { value: 'supplement', title: '保健品' },
          { value: 'none', title: '都没有' }
        ]
      },
      {
        key: 'family',
        label: '胃癌 / 食管癌家族史',
        type: 'single',
        hint: '单选',
        options: [
          { value: 'no', title: '没有' },
          { value: 'yes', title: '有直系亲属患病' },
          { value: 'unknown', title: '不清楚' }
        ]
      },
      {
        key: 'pregnancy',
        label: '怀孕 / 备孕 / 哺乳情况',
        type: 'single',
        hint: '可选 · 女性填写，男性选不适用',
        options: [
          { value: 'na', title: '不适用' },
          { value: 'no', title: '未怀孕' },
          { value: 'yes', title: '怀孕 / 备孕 / 可能怀孕' },
          { value: 'lactation', title: '哺乳期' }
        ]
      }
    ]
  }
];

// 把“病史与特殊情况”移到最前，编号随新顺序重新生成。
const historyStepIndex = QUIZ_STEPS.findIndex((step) => step.id === 'step-history');
if (historyStepIndex >= 0) {
  const [historyStep] = QUIZ_STEPS.splice(historyStepIndex, 1);
  QUIZ_STEPS.unshift(historyStep);
}
QUIZ_STEPS.forEach((step, index) => {
  step.kicker = step.kicker.replace(/^STEP \d+/, `STEP ${String(index + 1).padStart(2, '0')}`);
});

const CAMERA_STEP_INDEX = QUIZ_STEPS.findIndex((step) => step.layout === 'look');

/* ---------- 3. 常见情况说明 ---------- */

const CONDITIONS = {
  reflux: {
    name: '胃食管反流病',
    kicker: '常见消化系统问题',
    desc: '胃内容物反流至食管，典型表现是烧心、反酸、胸骨后灼热感；饭后、弯腰或躺下时更明显。',
    department: '消化内科',
    watch: '吞咽困难、黑便、不明原因体重下降',
    care: [
      '饭后 2–3 小时内避免躺下，睡前 3 小时不再进食。',
      '把床头整体抬高 10–15 厘米，而不是只垫高枕头。',
      '暂时减少酒精、咖啡、浓茶、油腻和过甜食物，少量多餐。'
    ]
  },
  fd: {
    name: '功能性消化不良',
    kicker: '功能性胃肠问题',
    desc: '胃镜等检查无明显器质性病变，但反复出现餐后饱胀、早饱、上腹胀痛或嗳气，常与进食节律和压力有关。',
    department: '消化内科',
    watch: '夜间痛醒、黑便、体重下降、吞咽困难',
    care: [
      '三餐定时，七分饱，细嚼慢咽，避免一边工作一边匆匆进食。',
      '记录 3 天“症状—饮食—情绪”日记，找出反复加重的时间点。',
      '饭后散步 10–15 分钟，避免立刻躺下或剧烈运动。'
    ]
  },
  gastritis: {
    name: '慢性胃炎 / 幽门螺杆菌相关',
    kicker: '胃黏膜慢性炎症',
    desc: '胃黏膜慢性炎症，常表现为上腹隐痛、胀满、嗳气、口臭或反酸；幽门螺杆菌感染是常见原因之一。',
    department: '消化内科',
    watch: '黑便、呕血、贫血、体重下降、40 岁后新发症状',
    care: [
      '减少辛辣、酒精、浓茶和长期空腹，规律三餐。',
      '不要自行长期服用止痛药 / 阿司匹林；如需要，先和医生讨论胃保护方案。',
      '若从未检测过幽门螺杆菌，可在消化内科评估是否需要呼气试验。'
    ]
  },
  ulcer: {
    name: '消化性溃疡',
    kicker: '需要排查的器质性问题',
    desc: '胃或十二指肠黏膜出现溃疡。十二指肠溃疡常表现为空腹痛、夜间痛，进食后缓解；胃溃疡则可能饭后加重。',
    department: '消化内科',
    watch: '黑便、呕血、突发剧烈腹痛、面色苍白',
    care: [
      '规律进食，避免空腹太久；暂时戒烟酒、浓茶和辛辣。',
      '停用不必要的止痛药 / 阿司匹林前先咨询医生，不要自行停药。',
      '尽快消化内科就诊，医生可能安排幽门螺杆菌检测和胃镜。'
    ]
  },
  gastroenteritis: {
    name: '急性胃肠炎',
    kicker: '急性感染 / 饮食相关',
    desc: '多由病毒或细菌感染引起，表现为急性恶心、呕吐、腹泻、腹痛，常有不洁饮食史。',
    department: '消化内科 / 急诊',
    watch: '血便、持续高热、尿量明显减少、意识模糊',
    care: [
      '少量多次补充口服补液盐或淡盐水，重点是防脱水。',
      '暂时吃清淡、易消化的食物；不要自行使用强力止泻药。',
      '观察尿量、口干、头晕等脱水信号；婴幼儿、老人和孕妇更早就医。'
    ]
  },
  gallstone: {
    name: '胆结石 / 胆囊炎',
    kicker: '胆道相关问题',
    desc: '胆结石或胆囊炎可引起右上腹绞痛，常在油腻餐后发作，可能放射到右肩背，伴恶心、呕吐或发热。',
    department: '消化内科 / 肝胆外科',
    watch: '发热寒战、黄疸、持续剧痛、呕吐不止',
    care: [
      '急性发作时停止进食，尽快就医；不要自行大量喝水或吃“排石”偏方。',
      '缓解期减少油腻、油炸食物和暴饮暴食。',
      '医生通常会安排腹部超声和肝功能检查。'
    ]
  },
  pancreatitis: {
    name: '急性胰腺炎',
    kicker: '需要急诊排除',
    desc: '胰腺急性炎症，典型为持续剧烈的上腹痛，常放射到后背，伴恶心呕吐，酒后或暴饮暴食后多见。',
    department: '急诊',
    watch: '持续剧痛、呼吸急促、发热、意识改变',
    care: [
      '不要在家观察，也不要进食进水，尽快前往急诊。',
      '不要自行服用止痛药，以免掩盖病情。',
      '如有胆结石或高甘油三酯病史，就诊时主动告知医生。'
    ]
  },
  ibs: {
    name: '肠易激综合征',
    kicker: '功能性肠道问题',
    desc: '以腹痛伴排便习惯改变为特征的功能性肠病，排便后腹痛常缓解，可能与压力、饮食和肠道敏感有关。',
    department: '消化内科',
    watch: '便血、体重下降、夜间痛醒、贫血、40 岁后新发',
    care: [
      '记录排便日记，观察腹痛与排便、饮食、压力的关系。',
      '规律作息，尝试缓慢腹式呼吸或轻量运动来降低压力。',
      '避免自行长期忌口；必要时在医生 / 营养师指导下调整膳食纤维。'
    ]
  },
  cardiac: {
    name: '心源性上腹不适',
    kicker: '必须优先排除的急症',
    desc: '心肌缺血有时不表现为典型胸痛，而是上腹闷胀、恶心、出汗，容易被误认为“胃不舒服”，尤其在中老年人或糖尿病患者中。',
    department: '急诊 / 心内科',
    watch: '胸痛、大汗、气短、晕厥、放射到左臂 / 下颌',
    care: [
      '立即拨打 120，不要自行驾车或等待。',
      '停止活动，保持安静，解开衣领；不要自行服药。',
      '告知急救人员：胸闷 / 上腹不适、出汗、放射痛和既往心脏病史。'
    ]
  }
};

/* ---------- 4. 中医证型 ---------- */

const PATTERNS = {
  cold: {
    name: '寒邪客胃',
    desc: '寒主收引，胃气被遏。常见胃痛暴作、遇寒加重、得温则减，喜热饮，舌淡苔白。',
    advice: [
      '注意腹部保暖，暂避生冷和冰饮。',
      '可少量多次喝温热水，吃温热易消化的粥面；不要靠烫敷或烈酒止痛。',
      '若疼痛剧烈、持续或伴黑便，立即就医。'
    ]
  },
  food: {
    name: '饮食积滞',
    desc: '暴饮暴食或食积不化，胃气壅滞。常见脘腹胀满、嗳腐吞酸、恶心，舌苔厚腻。',
    advice: [
      '下一餐减量，选择清淡、温热、易消化的食物。',
      '暂停油腻、甜食、酒精和夜宵，不要自行催吐。',
      '不要用力按压腹部；若胀痛持续或呕吐不止，及时就医。'
    ]
  },
  liver: {
    name: '肝气犯胃',
    desc: '情绪紧张或郁怒使肝气横逆犯胃。常见胃脘胀痛、嗳气、胸闷叹息，症状随情绪波动。',
    advice: [
      '尝试缓慢腹式呼吸，饭后散步 10–15 分钟。',
      '把压力事件和症状时间记下来，观察情绪与胃部不适的关系。',
      '规律作息；若焦虑持续影响生活，可寻求心理 / 精神科支持。'
    ]
  },
  dampheat: {
    name: '湿热中阻',
    desc: '湿热蕴结中焦。常见胃脘灼痛、口苦口黏、大便黏滞、舌红苔黄腻。',
    advice: [
      '减少辛辣、油炸、酒精和含糖饮料。',
      '饮食清淡，适量蔬菜和全谷物，避免暴饮暴食。',
      '不要自行服用“清热祛湿”类中药，需由中医师辨证。'
    ]
  },
  blood: {
    name: '瘀血停胃',
    desc: '久病入络或出血后瘀阻。常见胃痛固定如刺、拒按，舌紫暗或有瘀点；黑便属于危险信号。',
    advice: [
      '固定刺痛、黑便或呕血都需要医生评估，不要自行活血化瘀。',
      '就诊时告知医生疼痛固定位置、黑便和用药史。',
      '避免自行服用止痛药 / 阿司匹林。'
    ]
  },
  yin: {
    name: '胃阴不足',
    desc: '胃阴亏虚、失于濡润。常见胃脘隐痛或灼痛、口干、饥不欲食、大便干、舌红少苔。',
    advice: [
      '少量多次喝温水，选择温和、易消化的食物。',
      '避免辛辣、烧烤、酒精和熬夜。',
      '口干明显、体重下降或吞咽困难时及时就医。'
    ]
  },
  spleen_cold: {
    name: '脾胃虚寒',
    desc: '中阳不足、寒从内生。常见胃脘隐痛喜按、空腹痛甚、得食缓解、畏寒肢冷、大便溏。',
    advice: [
      '三餐规律，吃温热、易消化的食物，少食多餐。',
      '注意腹部和足部保暖，避免空腹太久。',
      '若大便溏稀、乏力持续，建议中医 / 消化科评估。'
    ]
  },
  qi: {
    name: '脾胃气虚',
    desc: '脾胃运化无力。常见食少腹胀、饭后加重、乏力、大便溏、舌淡。',
    advice: [
      '规律进食，细嚼慢咽，保证主食和蛋白质。',
      '避免过度劳累和长时间空腹，饭后适当休息。',
      '若体重下降、贫血或症状加重，及时就医。'
    ]
  },
  blood_def: {
    name: '气血两虚',
    desc: '气血不足、失于濡养。常见面色苍白或萎黄、口唇与指甲色淡、发质干枯、头晕乏力、舌淡。',
    advice: [
      '规律三餐，保证主食、优质蛋白和深色蔬菜；不要长期过度节食。',
      '注意休息，避免突然起身；头晕明显时先坐下，防止跌倒。',
      '若乏力、心悸、面色苍白持续，建议查血常规，排除贫血等原因。'
    ]
  },
  balanced: {
    name: '线索不足 / 相对平和',
    desc: '目前填写的信息不足以形成明显证型偏颇。可以从规律饮食、情绪和睡眠入手继续观察。',
    advice: [
      '规律三餐，七分饱，减少酒精、浓咖啡和夜宵。',
      '记录 3 天症状日记，观察与饮食、情绪、睡眠的关系。',
      '若症状持续 2 周以上或出现警示信号，就医评估。'
    ]
  }
};

/* ---------- 5. 状态 ---------- */

const DEFAULT_ANSWERS = {
  summary: '',
  chief: [],
  location: null,
  duration: null,
  radiation: [],
  severity: 5,
  mealRelation: null,
  warmRelief: null,
  appetite: null,
  symptoms: [],
  triggers: [],
  stool: null,
  frequency: null,
  coldHeat: null,
  drink: null,
  sweat: null,
  general: [],
  mood: null,
  sleep: null,
  tongueBody: null,
  tongueShape: null,
  tongueCoat: null,
  sublingual: null,
  faceColor: null,
  faceShine: null,
  eyes: null,
  lips: null,
  hair: null,
  nails: null,
  gums: null,
  fundus: null,
  handColor: null,
  handThenar: null,
  handTemperature: null,
  handVeins: null,
  handRedFlags: [],
  sex: null,
  age: null,
  bodyType: null,
  history: [],
  meds: [],
  family: null,
  pregnancy: null
};

const state = {
  answers: clone(DEFAULT_ANSWERS),
  currentStep: 0,
  media: {
    tongue: null,
    face: null,
    hand: null
  }
};

let analysisTimer = null;
let toastTimer = null;
let cameraStream = null;
let cameraTarget = null;

/* ---------- 6. DOM ---------- */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const dom = {
  header: $('.site-header'),
  screens: $$('.screen'),
  triageFlags: $('#triage-flags'),
  triageCount: $('.triage-count'),
  triageCountText: $('#triage-count-text'),
  triageUrgent: $('#triage-urgent'),
  triageNone: $('#triage-none'),
  stepList: $('#step-list'),
  quizSteps: $('#quiz-steps'),
  quizForm: $('#quiz-form'),
  quizKicker: $('#quiz-kicker'),
  quizTitle: $('#quiz-title'),
  quizDesc: $('#quiz-desc'),
  quizCounter: $('#quiz-counter'),
  quizPrev: $('#quiz-prev'),
  quizNext: $('#quiz-next'),
  mobileStepLabel: $('#mobile-step-label'),
  mobileStepCount: $('#mobile-step-count'),
  mobileProgressBar: $('#mobile-progress-bar'),
  resultDate: $('#result-date'),
  resultCount: $('#result-count'),
  urgencyBanner: $('#urgency-banner'),
  topCard: $('#top-card'),
  topMatchLabel: $('#top-match-label'),
  topKicker: $('#top-kicker'),
  topCondition: $('#top-condition'),
  topDesc: $('#top-desc'),
  topMatchBar: $('#top-match-bar'),
  topMatchPct: $('#top-match-pct'),
  topReasons: $('#top-reasons'),
  topWhy: $('#top-why'),
  topCare: $('#top-care'),
  topDepartment: $('#top-department'),
  topWatch: $('#top-watch'),
  otherConditions: $('#other-conditions'),
  patternName: $('#pattern-name'),
  patternBadge: $('#pattern-badge'),
  patternDesc: $('#pattern-desc'),
  patternSigns: $('#pattern-signs'),
  patternAdvice: $('#pattern-advice'),
  planGrid: $('#plan-grid'),
  safetyList: $('#safety-list'),
  toast: $('#toast')
};

/* ---------- 7. 工具函数 ---------- */

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function has(list, value) {
  return Array.isArray(list) && list.includes(value);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function showToast(message, isError = false) {
  if (!dom.toast) return;
  dom.toast.textContent = message;
  dom.toast.classList.toggle('is-error', Boolean(isError));
  dom.toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    dom.toast.classList.remove('is-visible');
  }, 3000);
}

function formatNow() {
  const now = new Date();
  const date = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const time = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return `${date} ${time}`;
}

function matchLabel(pct) {
  if (pct >= 70) return '高度相符';
  if (pct >= 48) return '中度相符';
  if (pct >= 26) return '低度相符';
  return '线索较少';
}

/* ---------- 8. 页面切换 ---------- */

function showScreen(name) {
  const target = document.getElementById(`screen-${name}`);
  if (!target) return;

  dom.screens.forEach((screen) => {
    screen.classList.toggle('is-active', screen === target);
  });

  if (name !== 'quiz') stopCamera();

  document.body.classList.toggle('has-started', name !== 'intro');
  window.scrollTo(0, 0);

  const heading = target.querySelector('h1');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    window.setTimeout(() => {
      heading.focus({ preventScroll: true });
    }, 70);
  }
}

/* ---------- 9. 分诊 ---------- */

function renderTriage() {
  if (!dom.triageFlags) return;

  dom.triageFlags.innerHTML = TRIAGE_FLAGS.map((flag) => `
    <label class="flag">
      <input type="checkbox" name="triage" value="${flag.id}">
      <span class="flag-icon">
        <svg class="icon" aria-hidden="true"><use href="#${flag.icon}"></use></svg>
      </span>
      <span class="flag-copy">
        <strong>${flag.title}</strong>
        <small>${flag.desc}</small>
      </span>
      <span class="flag-check" aria-hidden="true">
        <svg class="icon"><use href="#i-check"></use></svg>
      </span>
    </label>
  `).join('');

  updateTriageUI();
}

function updateTriageUI() {
  if (!dom.triageFlags) return;
  const count = dom.triageFlags.querySelectorAll('input:checked').length;

  dom.triageUrgent.disabled = count === 0;
  dom.triageCount.classList.toggle('has-count', count > 0);
  dom.triageCountText.textContent = count > 0
    ? `已勾选 ${count} 项危险信号`
    : '尚未勾选任何一项';
}

function showEmergency() {
  if (analysisTimer) {
    window.clearTimeout(analysisTimer);
    analysisTimer = null;
  }
  showScreen('emergency');
}

/* ---------- 10. 问卷渲染 ---------- */

function renderQuiz() {
  if (!dom.stepList || !dom.quizSteps) return;

  dom.stepList.innerHTML = QUIZ_STEPS.map((step, index) => `
    <li class="step-item" data-step-item="${index}">
      <span class="step-dot">${String(index + 1).padStart(2, '0')}</span>
      <span class="step-label">
        <strong>${step.navTitle}</strong>
        <small>${step.navSub}</small>
      </span>
    </li>
  `).join('');

  dom.quizSteps.innerHTML = QUIZ_STEPS.map((step, index) => renderQuizStep(step, index)).join('');

  const range = $('#severity');
  if (range) {
    range.value = String(state.answers.severity ?? 5);
    updateSeverityUI();
  }

  updateStoolWarning();
  showQuizStep(state.currentStep);
}

function renderField(field) {
  if (field.type === 'scale') {
    return renderScaleField(field);
  }
  if (field.type === 'number') {
    return renderNumberField(field);
  }
  if (field.type === 'textarea') {
    return renderTextareaField(field);
  }

  const isMulti = field.type === 'multi';
  const optionsClass = [
    'options',
    field.columns === 3 ? 'cols-3' : '',
    isMulti ? 'chips' : ''
  ].filter(Boolean).join(' ');

  const labelId = `label-${field.key}`;
  const requiredMark = field.required ? '<span class="required">必选</span>' : '';
  const role = isMulti ? 'group' : 'radiogroup';

  return `
    <div class="field${field.bodyMap ? ' has-body-map' : ''}" data-field="${field.key}" data-type="${field.type}">
      <div class="field-head">
        <div class="field-label" id="${labelId}">${field.label}${requiredMark}</div>
        <span class="field-hint">${field.hint || ''}</span>
      </div>
      ${field.bodyMap ? renderBodyMap() : ''}
      <div class="${optionsClass}" role="${role}" aria-labelledby="${labelId}" ${field.required ? 'aria-required="true"' : ''}>
        ${field.options.map((option) => renderOption(field, option)).join('')}
      </div>
      <p class="field-error">请先完成这一项，再继续。</p>
    </div>
  `;
}

function renderQuizStep(step, index) {
  if (step.layout === 'look') {
    return renderLookStep(step, index);
  }

  return `
    <section class="quiz-step" data-step="${index}" aria-label="${step.navTitle}">
      ${step.fields.map((field) => renderField(field)).join('')}
    </section>
  `;
}

function renderLookStep(step, index) {
  const tongueFields = step.fields.filter((field) => field.group === 'tongue');
  const faceFields = step.fields.filter((field) => field.group === 'face');
  const handFields = step.fields.filter((field) => field.group === 'hand');

  return `
    <section class="quiz-step" data-step="${index}" aria-label="${step.navTitle}">
      <div class="look-grid">
        <section class="look-panel" data-look-panel="tongue">
          <div class="look-panel-head">
            <span class="look-panel-num">01</span>
            <div>
              <h3>舌诊</h3>
              <p>自然光下、舌尖自然伸出，不卷舌、不用滤镜。拍前 30 分钟避免咖啡、浓茶、火龙果等染色食物。</p>
            </div>
          </div>
          ${renderCameraCard('tongue', '舌象')}
          ${tongueFields.map((field) => renderField(field)).join('')}
        </section>

        <section class="look-panel" data-look-panel="face">
          <div class="look-panel-head">
            <span class="look-panel-num">02</span>
            <div>
              <h3>面诊</h3>
              <p>素颜、自然光、不背光。重点看面色、光泽、眼周和口唇，不需要美颜。</p>
            </div>
          </div>
          ${renderCameraCard('face', '面部')}
          ${faceFields.map((field) => renderField(field)).join('')}
        </section>
      </div>

      <section class="look-panel hand-panel" data-look-panel="hand">
        <div class="look-panel-head">
          <span class="look-panel-num">03</span>
          <div>
            <h3>手诊</h3>
            <p>手掌朝上、自然平伸、五指分开，手掌与心脏同高；固定光源、白纸背景，先拍手心再拍手背。</p>
          </div>
        </div>
        <div class="hand-panel-grid">
          <div class="hand-camera">
            ${renderCameraCard('hand', '手掌')}
            ${renderHandMap()}
          </div>
          <div class="hand-fields">
            ${handFields.map((field) => renderField(field)).join('')}
          </div>
        </div>
      </section>

      <p class="look-disclaimer">
        照片只保存在当前页面，不会上传服务器，也不做自动识别或诊断。若不方便拍照，可直接跳过，仅填写你能观察到的选项。
      </p>
    </section>
  `;
}

function renderCameraCard(target, label) {
  const hasShot = Boolean(state.media[target]);
  const guide = target === 'tongue'
    ? `<svg viewBox="0 0 200 150" aria-hidden="true">
         <path d="M66 44c16-18 50-20 69-2 19 18 14 53-2 70-16 17-47 16-61-2-14-18-20-48-6-66Z" />
         <path d="M77 51c11-11 34-12 47-2" />
       </svg>`
    : target === 'hand'
      ? `<svg viewBox="0 0 200 150" aria-hidden="true">
           <path d="M56 126c-10-22-13-44-9-66 2-10 12-11 15-2l7 21 2-39c1-11 14-12 16-1l2 31 5-39c2-10 15-10 16 1l2 40 7-31c2-9 14-7 13 3l-3 42 9-20c4-9 16-4 13 7l-15 47c-4 13-15 22-29 22H78c-10 0-18-5-22-16Z" />
           <path d="M78 112c10 6 28 7 40 1" />
         </svg>`
      : `<svg viewBox="0 0 200 150" aria-hidden="true">
           <ellipse cx="100" cy="76" rx="45" ry="57" />
           <path d="M82 67c4-4 9-4 13 0M105 67c4-4 9-4 13 0" />
           <path d="M92 98c5 5 11 5 16 0" />
         </svg>`;

  return `
    <div class="camera-card${hasShot ? ' has-shot' : ''}" data-camera="${target}">
      <div class="camera-stage">
        <video class="camera-video" playsinline muted autoplay aria-label="${label}摄像头预览"></video>
        <img class="camera-shot" ${hasShot ? `src="${state.media[target]}"` : ''} alt="${label}照片预览" ${hasShot ? '' : 'hidden'}>
        <div class="camera-empty" ${hasShot ? 'hidden' : ''}>
          <svg class="icon" aria-hidden="true"><use href="#i-camera"></use></svg>
          <strong>${hasShot ? '已拍摄' : '开启摄像头，或上传照片'}</strong>
          <small>照片只在本页显示</small>
        </div>
        <div class="camera-guide ${target}" ${hasShot ? 'hidden' : ''}>${guide}</div>
        <span class="camera-badge">本地处理 · 不上传</span>
      </div>
      <div class="camera-actions">
        <button class="btn btn-small btn-primary" type="button" data-camera-start="${target}" ${hasShot ? 'hidden' : ''}>
          开启摄像头
        </button>
        <button class="btn btn-small btn-primary" type="button" data-camera-capture="${target}" hidden>
          拍照
        </button>
        <button class="btn btn-small btn-ghost" type="button" data-camera-reset="${target}" ${hasShot ? '' : 'hidden'}>
          重拍 / 删除
        </button>
        <label class="camera-upload">
          <span class="camera-upload-text">${hasShot ? '重新上传' : '上传照片'}</span>
          <input type="file" accept="image/*" data-camera-file="${target}">
        </label>
      </div>
      <p class="camera-status" data-camera-status="${target}" aria-live="polite">
        摄像头需要浏览器授权；不方便时可上传照片或直接跳过。
      </p>
    </div>
  `;
}

function renderHandMap() {
  return `
    <div class="hand-map" aria-hidden="true">
      <div class="hand-map-head">
        <span>手掌分区参考</span>
        <span>拇指侧 · 大鱼际</span>
      </div>
      <svg class="hand-map-svg" viewBox="0 0 240 300">
        <defs>
          <linearGradient id="handFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FBF5E9" />
            <stop offset="100%" stop-color="#EADAC4" />
          </linearGradient>
        </defs>
        <path class="hand-outline" style="fill:url(#handFill)" d="M88 252c-13-13-21-32-22-55-1-15-3-34 0-48 2-10 14-11 16-1l7 27 2-58c0-11 15-12 16-1l3 54 4-78c1-12 17-12 18 0l2 73 6-58c1-11 16-10 15 1l-4 65 7-36c2-10 16-8 14 4l-12 91c-2 14-13 24-27 24H103c-6 0-11-2-15-6Z" />
        <path class="hand-crease" d="M62 204c35 12 80 12 120 0M68 226c35 8 75 8 110 0M94 128c8 14 8 30 0 44" />
        <ellipse class="hand-zone thenar" cx="72" cy="179" rx="22" ry="42" />
        <ellipse class="hand-zone center" cx="122" cy="174" rx="25" ry="31" />
        <ellipse class="hand-zone hypothenar" cx="169" cy="190" rx="19" ry="35" />
        <path class="hand-leader" d="M49 179h10" />
        <text class="hand-label" x="6" y="176">大鱼际</text>
        <text class="hand-label" x="98" y="171">脾胃区</text>
        <text class="hand-label" x="190" y="187">小鱼际</text>
      </svg>
      <div class="hand-map-legend">
        <span><i></i>大鱼际：脾胃 / 心肺</span>
        <span><i></i>掌心：脾胃</span>
        <span><i></i>小鱼际：肝肾</span>
      </div>
    </div>
  `;
}

function renderBodyMap() {
  const selected = state.answers.location;

  const zones = [
    { value: 'epigastric', shape: '<ellipse cx="130" cy="164" rx="31" ry="23" />', marker: [130, 164, '1'] },
    { value: 'right_upper', shape: '<ellipse cx="101" cy="181" rx="21" ry="19" />', marker: [101, 181, '2'] },
    { value: 'left_upper', shape: '<ellipse cx="159" cy="181" rx="21" ry="19" />', marker: [159, 181, '3'] },
    { value: 'periumbilical', shape: '<circle cx="130" cy="220" r="18" />', marker: [130, 220, '4'] },
    { value: 'lower', shape: '<ellipse cx="130" cy="263" rx="30" ry="22" />', marker: [130, 263, '5'] }
  ];

  return `
    <div class="body-map" data-body-map>
      <div class="body-map-top">
        <span>点击图中区域选择</span>
        <span class="body-map-orientation">正面观 · 图左为你的右侧</span>
      </div>
      <div class="body-map-body">
        <svg class="body-figure" viewBox="0 0 260 430" aria-hidden="true">
          <defs>
            <linearGradient id="bodyFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#FBF5E9" />
              <stop offset="58%" stop-color="#F4EADB" />
              <stop offset="100%" stop-color="#E8D8C1" />
            </linearGradient>
            <radialGradient id="bodyGlow" cx="50%" cy="46%" r="58%">
              <stop offset="0%" stop-color="#FFFDF7" stop-opacity=".9" />
              <stop offset="70%" stop-color="#F0E6D5" stop-opacity=".38" />
              <stop offset="100%" stop-color="#F0E6D5" stop-opacity="0" />
            </radialGradient>
            <filter id="bodySoft" x="-25%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#705A42" flood-opacity=".16" />
            </filter>
          </defs>
          <ellipse class="body-halo" cx="130" cy="218" rx="118" ry="198" fill="url(#bodyGlow)" />
          <ellipse class="body-ground" cx="130" cy="414" rx="58" ry="7" />
          <path class="body-silhouette" style="fill:url(#bodyFill)" filter="url(#bodySoft)" d="M130 18c-16 0-27 12-27 29 0 13 7 24 17 28v14c-13 2-22 5-31 11-9 6-14 16-16 28l-10 65c-1 8 6 14 13 13 6-1 10-5 11-11l12-50 2 75-5 95c-1 9 6 16 15 16 8 0 14-6 14-14l5-92h10l5 92c0 8 6 14 14 14 9 0 16-7 15-16l-5-95 2-75 12 50c1 6 5 10 11 11 7 1 14-5 13-13l-10-65c-2-12-7-22-16-28-9-6-18-9-31-11v-14c10-4 17-15 17-28 0-17-11-29-27-29Z" />
          <path class="body-line" d="M105 116c15 10 35 10 50 0M100 290c12 6 48 6 60 0" />
          <path class="body-contour" d="M112 126c12 8 24 8 36 0M102 145c17 11 39 11 56 0M108 300c13 5 31 5 44 0" />
          <path class="body-contour faint" d="M108 96c9-5 35-5 44 0M98 177c-7 18-6 47 1 67M162 177c7 18 6 47-1 67" />
          <circle class="body-navel" cx="130" cy="220" r="2.5" />

          <g class="body-zone${selected === 'diffuse' ? ' is-selected' : ''}" data-location="diffuse">
            <ellipse class="zone-shape zone-diffuse" cx="130" cy="216" rx="48" ry="68" />
            <circle class="zone-ring" cx="205" cy="146" r="14" />
            <circle class="zone-marker" cx="205" cy="146" r="11" />
            <text class="zone-marker-text" x="205" y="150">6</text>
          </g>

          ${zones.map((zone) => `
            <g class="body-zone${selected === zone.value ? ' is-selected' : ''}" data-location="${zone.value}">
              ${zone.shape.replace('<ellipse', '<ellipse class="zone-shape"').replace('<circle', '<circle class="zone-shape"')}
              <circle class="zone-ring" cx="${zone.marker[0]}" cy="${zone.marker[1]}" r="13" />
              <circle class="zone-marker" cx="${zone.marker[0]}" cy="${zone.marker[1]}" r="10" />
              <text class="zone-marker-text" x="${zone.marker[0]}" y="${zone.marker[1] + 3.5}">${zone.marker[2]}</text>
            </g>
          `).join('')}

          <text class="body-side" x="52" y="98">R</text>
          <text class="body-side" x="208" y="98">L</text>
        </svg>
      </div>
      <div class="body-legend" role="group" aria-label="疼痛位置快速选择">
        ${BODY_LOCATIONS.map((location) => `
          <button class="body-legend-item${selected === location.value ? ' is-selected' : ''}" type="button" data-location="${location.value}" aria-pressed="${selected === location.value}">
            <span>${location.marker}</span>${location.short}
          </button>
        `).join('')}
      </div>
      <p class="body-map-note">图中数字与下方选项对应；如果范围很大或指不清，可选“整个肚子”或“说不清”。</p>
    </div>
  `;
}

function renderOption(field, option) {
  const value = state.answers[field.key];
  const checked = field.type === 'single'
    ? value === option.value
    : has(value, option.value);

  const inputType = field.type === 'single' ? 'radio' : 'checkbox';
  const hasSwatch = Boolean(option.swatch);

  return `
    <label class="option${hasSwatch ? ' has-swatch' : ''}">
      <input
        type="${inputType}"
        name="q-${field.key}"
        value="${option.value}"
        ${checked ? 'checked' : ''}
      >
      ${hasSwatch
        ? `<span class="option-swatch" style="--swatch:${option.swatch}" aria-hidden="true"></span>`
        : '<span class="option-mark" aria-hidden="true"></span>'}
      <span class="option-copy">
        <span class="option-title">${option.title}</span>
        ${option.hint ? `<span class="option-hint">${option.hint}</span>` : ''}
      </span>
    </label>
  `;
}

function renderScaleField(field) {
  const value = Number(state.answers.severity ?? 5);
  const progress = value * 10;

  return `
    <div class="field" data-field="${field.key}" data-type="scale">
      <div class="field-head">
        <div class="field-label" id="label-${field.key}">${field.label}<span class="required">必选</span></div>
        <span class="field-hint">${field.hint || ''}</span>
      </div>
      <div class="scale-wrap">
        <div class="scale-value">
          <span id="severity-value">${value}</span>
          <small>/ 10</small>
          <em id="severity-word">${severityWord(value)}</em>
        </div>
        <input
          type="range"
          id="severity"
          name="severity"
          min="0"
          max="10"
          step="1"
          value="${value}"
          style="--range-progress:${progress}%"
          aria-labelledby="label-${field.key}"
          aria-valuetext="${value} 分，${severityWord(value)}"
        >
        <div class="scale-labels">
          <span>0 几乎不影响</span>
          <span>5 明显不适</span>
          <span>10 难以忍受</span>
        </div>
        <p class="scale-warning" id="severity-warning" ${value >= 8 ? '' : 'hidden'}>
          疼痛达到 8 分以上时，若为突发或持续加重，请立即就医，不要只在家观察。
        </p>
      </div>
      <p class="field-error">请先完成这一项，再继续。</p>
    </div>
  `;
}

function renderNumberField(field) {
  const value = state.answers[field.key];
  const inputId = `${field.key}-input`;
  const labelId = `label-${field.key}`;
  const requiredMark = field.required ? '<span class="required">必选</span>' : '';

  return `
    <div class="field" data-field="${field.key}" data-type="number">
      <div class="field-head">
        <div class="field-label" id="${labelId}">${field.label}${requiredMark}</div>
        <span class="field-hint">${field.hint || ''}</span>
      </div>
      <div class="number-wrap">
        <input
          class="number-input"
          id="${inputId}"
          name="${field.key}"
          type="number"
          inputmode="numeric"
          min="${field.min ?? 0}"
          max="${field.max ?? 120}"
          step="1"
          value="${value ?? ''}"
          placeholder="例如 35"
          aria-labelledby="${labelId}"
        >
        <span class="number-unit">${field.unit || '岁'}</span>
      </div>
      <p class="field-error">请填写 0–120 之间的具体岁数。</p>
    </div>
  `;
}

function renderTextareaField(field) {
  const value = state.answers[field.key] || '';
  const inputId = `${field.key}-input`;
  const labelId = `label-${field.key}`;

  return `
    <div class="field" data-field="${field.key}" data-type="textarea">
      <div class="field-head">
        <div class="field-label" id="${labelId}">${field.label}</div>
        <span class="field-hint">${field.hint || ''}</span>
      </div>
      <div class="textarea-wrap">
        <textarea
          id="${inputId}"
          name="${field.key}"
          rows="3"
          maxlength="${field.maxlength || 200}"
          placeholder="${field.placeholder || ''}"
          aria-labelledby="${labelId}"
        >${value}</textarea>
      </div>
      <p class="field-error">请检查这一项。</p>
    </div>
  `;
}

function severityWord(value) {
  if (value <= 2) return '轻微，可忍受';
  if (value <= 4) return '轻度不适';
  if (value <= 6) return '明显不适';
  if (value <= 8) return '较重，影响活动';
  return '剧烈，难以忍受';
}

function updateSeverityUI() {
  const range = $('#severity');
  if (!range) return;

  const value = Number(range.value);
  const word = severityWord(value);
  const valueEl = $('#severity-value');
  const wordEl = $('#severity-word');
  const warning = $('#severity-warning');

  state.answers.severity = value;

  if (valueEl) valueEl.textContent = String(value);
  if (wordEl) wordEl.textContent = word;
  if (warning) warning.hidden = value < 8;

  range.style.setProperty('--range-progress', `${value * 10}%`);
  range.setAttribute('aria-valuetext', `${value} 分，${word}`);
}

function updateStoolWarning() {
  const field = dom.quizSteps
    ? dom.quizSteps.querySelector('.field[data-field="stool"]')
    : null;
  if (!field) return;

  const old = field.querySelector('.field-warning');
  if (old) old.remove();

  const value = state.answers.stool;
  if (value !== 'black' && value !== 'blood') return;

  const isBlack = value === 'black';
  const warning = document.createElement('div');
  warning.className = 'field-warning';
  warning.innerHTML = `
    <svg class="icon" aria-hidden="true"><use href="#i-alert"></use></svg>
    <div>
      <strong>${isBlack ? '黑便属于需要尽快就医的信号' : '便血 / 黏液便需要医生评估'}</strong>
      <p>${isBlack
        ? '黑便或柏油样便可能提示上消化道出血。建议停止填写，尽快前往急诊或消化内科；不要自行服用止痛药或胃药。'
        : '大便带血或黏液的原因很多，但需要医生结合年龄、病史和检查判断。建议尽快就医，不要自行用药。'}</p>
      <button class="inline-emergency" type="button" data-go="emergency">查看紧急处理</button>
    </div>
  `;
  field.appendChild(warning);
}

function showQuizStep(index, options = {}) {
  const nextIndex = clamp(index, 0, QUIZ_STEPS.length - 1);
  const step = QUIZ_STEPS[nextIndex];
  const previousStep = state.currentStep;
  state.currentStep = nextIndex;

  if (previousStep === CAMERA_STEP_INDEX && nextIndex !== CAMERA_STEP_INDEX) {
    stopCamera();
  }

  $$('.quiz-step', dom.quizSteps).forEach((el) => {
    el.classList.toggle('is-active', Number(el.dataset.step) === nextIndex);
  });

  $$('.step-item', dom.stepList).forEach((el, i) => {
    el.classList.toggle('is-active', i === nextIndex);
    el.classList.toggle('is-done', i < nextIndex);
  });

  dom.quizKicker.textContent = step.kicker;
  dom.quizTitle.textContent = step.title;
  dom.quizDesc.textContent = step.desc;
  dom.quizCounter.textContent = `${String(nextIndex + 1).padStart(2, '0')} / ${String(QUIZ_STEPS.length).padStart(2, '0')}`;
  dom.mobileStepLabel.textContent = `第 ${nextIndex + 1} 组 · ${step.navTitle}`;
  dom.mobileStepCount.textContent = `${nextIndex + 1} / ${QUIZ_STEPS.length}`;
  dom.mobileProgressBar.style.width = `${((nextIndex + 1) / QUIZ_STEPS.length) * 100}%`;

  dom.quizPrev.disabled = false;
  dom.quizPrev.innerHTML = nextIndex === 0
    ? '<svg class="icon" aria-hidden="true"><use href="#i-back"></use></svg> 返回分诊'
    : '<svg class="icon" aria-hidden="true"><use href="#i-back"></use></svg> 上一步';

  if (nextIndex === QUIZ_STEPS.length - 1) {
    dom.quizNext.innerHTML = '查看分析结果 <svg class="icon" aria-hidden="true"><use href="#i-pulse"></use></svg>';
  } else {
    dom.quizNext.innerHTML = '下一组 <svg class="icon" aria-hidden="true"><use href="#i-arrow"></use></svg>';
  }

  if (nextIndex === CAMERA_STEP_INDEX) {
    updateCameraUI('tongue');
    updateCameraUI('face');
  }

  if (options.scroll) {
    const mobileHead = document.querySelector('.quiz-mobile-head');
    const anchor = window.innerWidth <= 960 && mobileHead ? mobileHead : dom.quizCard;
    const offset = window.innerWidth <= 960 ? 76 : 92;
    const top = anchor.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }
}

/* ---------- 11. 问卷交互 ---------- */

function handleQuizChange(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  if (input.type !== 'radio' && input.type !== 'checkbox') return;

  const field = input.closest('.field');
  if (!field) return;

  const key = field.dataset.field;
  const type = field.dataset.type;
  if (!key) return;

  if (type === 'single') {
    state.answers[key] = input.value;
  } else if (type === 'multi') {
    if (input.value === 'none' && input.checked) {
      field.querySelectorAll('input[type="checkbox"]').forEach((box) => {
        if (box !== input) box.checked = false;
      });
      state.answers[key] = ['none'];
    } else {
      const noneBox = field.querySelector('input[value="none"]');
      if (noneBox) noneBox.checked = false;

      state.answers[key] = Array.from(field.querySelectorAll('input[type="checkbox"]:checked'))
        .map((box) => box.value)
        .filter((value) => value !== 'none');
    }
  }

  field.classList.remove('has-error');

  if (key === 'location') {
    syncBodyMap();
  }

  if (key === 'stool') {
    updateStoolWarning();
    if (input.value === 'black' || input.value === 'blood') {
      showToast('你选择了需要尽快就医的大便信号，请留意页面提示。', true);
    }
  }
}

function handleQuizInput(event) {
  if (event.target && event.target.id === 'severity') {
    updateSeverityUI();
  }

  if (event.target && event.target.id === 'age-input') {
    const input = event.target;
    const value = input.value.trim();
    const age = value === '' ? null : Number(value);
    state.answers.age = Number.isFinite(age) ? age : null;

    const field = input.closest('.field');
    if (field && state.answers.age !== null && state.answers.age >= 0 && state.answers.age <= 120) {
      field.classList.remove('has-error');
    }
  }

  if (event.target && event.target.id === 'summary-input') {
    state.answers.summary = event.target.value;
  }
}

/* ---------- 11.1 人体部位图 ---------- */

function syncBodyMap() {
  const map = dom.quizSteps ? dom.quizSteps.querySelector('.body-map') : null;
  if (!map) return;

  const selected = state.answers.location;
  map.querySelectorAll('[data-location]').forEach((element) => {
    const isSelected = element.getAttribute('data-location') === selected;
    element.classList.toggle('is-selected', isSelected);
    element.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });
}

function selectLocation(value) {
  const input = dom.quizSteps.querySelector(
    `.field[data-field="location"] input[value="${value}"]`
  );
  if (!input) return;

  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/* ---------- 11.2 摄像头舌诊 / 面诊 ---------- */

function setCameraStatus(target, message, isError = false) {
  const status = document.querySelector(`[data-camera-status="${target}"]`);
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('is-error', Boolean(isError));
}

function updateCameraUI(target) {
  const card = document.querySelector(`[data-camera="${target}"]`);
  if (!card) return;

  const hasShot = Boolean(state.media[target]);
  const isLive = Boolean(cameraStream && cameraTarget === target);
  const video = card.querySelector('.camera-video');
  const shot = card.querySelector('.camera-shot');
  const empty = card.querySelector('.camera-empty');
  const guide = card.querySelector('.camera-guide');
  const start = card.querySelector('[data-camera-start]');
  const capture = card.querySelector('[data-camera-capture]');
  const reset = card.querySelector('[data-camera-reset]');
  const uploadText = card.querySelector('.camera-upload-text');

  card.classList.toggle('has-shot', hasShot);
  card.classList.toggle('is-live', isLive);

  if (shot) {
    shot.hidden = !hasShot;
    if (hasShot) shot.src = state.media[target];
    else shot.removeAttribute('src');
  }

  if (video) {
    video.hidden = !isLive;
  }

  if (empty) empty.hidden = hasShot || isLive;
  if (guide) guide.hidden = hasShot;
  if (start) start.hidden = hasShot || isLive;
  if (capture) capture.hidden = !isLive;
  if (reset) reset.hidden = !hasShot;
  if (uploadText) uploadText.textContent = hasShot ? '重新上传' : '上传照片';
}

function updateAllCameraUI() {
  updateCameraUI('tongue');
  updateCameraUI('face');
  updateCameraUI('hand');
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => {
      try { track.stop(); } catch (error) { /* noop */ }
    });
  }

  cameraStream = null;
  cameraTarget = null;

  document.querySelectorAll('.camera-card video').forEach((video) => {
    video.srcObject = null;
  });

  updateAllCameraUI();
}

async function startCamera(target) {
  const card = document.querySelector(`[data-camera="${target}"]`);
  if (!card) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setCameraStatus(target, '当前浏览器不支持摄像头，请改用“上传照片”或直接跳过。', true);
    return;
  }

  stopCamera();
  setCameraStatus(target, '正在请求摄像头权限…');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 960 }
      },
      audio: false
    });

    cameraStream = stream;
    cameraTarget = target;

    const video = card.querySelector('video');
    if (video) {
      video.srcObject = stream;
      try {
        await video.play();
      } catch (error) {
        // 某些浏览器需要用户再次点击播放；拍照按钮仍可用。
      }
    }

    updateAllCameraUI();
    setCameraStatus(target, '摄像头已开启。把舌头 / 面部放入虚线框，光线均匀后点“拍照”。');
  } catch (error) {
    stopCamera();
    const name = error && error.name;
    const message = name === 'NotAllowedError' || name === 'SecurityError'
      ? '摄像头权限被拒绝。可以改用“上传照片”，或直接跳过。'
      : '无法开启摄像头。可以改用“上传照片”，或直接跳过。';
    setCameraStatus(target, message, true);
    showToast('无法开启摄像头，可改用上传照片或直接跳过。', true);
  }
}

function captureCamera(target) {
  if (!cameraStream || cameraTarget !== target) {
    setCameraStatus(target, '请先点“开启摄像头”，再拍照。', true);
    return;
  }

  const card = document.querySelector(`[data-camera="${target}"]`);
  const video = card ? card.querySelector('video') : null;
  if (!video || !video.videoWidth || !video.videoHeight) {
    setCameraStatus(target, '画面还没准备好，请稍等一下再拍。', true);
    return;
  }

  const max = 900;
  const ratio = Math.min(1, max / video.videoWidth);
  const width = Math.round(video.videoWidth * ratio);
  const height = Math.round(video.videoHeight * ratio);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(video, 0, 0, width, height);
    state.media[target] = canvas.toDataURL('image/jpeg', 0.86);
  } catch (error) {
    setCameraStatus(target, '照片保存失败，请重试或改用“上传照片”。', true);
    return;
  }

  stopCamera();
  updateCameraUI(target);
  setCameraStatus(target, '照片已保存在当前页面，可对照下方选项观察，或重拍。');
}

function resetCamera(target) {
  state.media[target] = null;
  stopCamera();
  updateCameraUI(target);
  setCameraStatus(target, '照片已删除。可重新拍照、上传，或直接跳过。');
}

function loadPhotoData(dataUrl, target) {
  const image = new Image();

  image.onload = () => {
    if (!image.width || !image.height) {
      setCameraStatus(target, '这张图片尺寸异常，请换一张重试。', true);
      return;
    }

    try {
      const max = 900;
      const ratio = Math.min(1, max / image.width);
      const width = Math.round(image.width * ratio);
      const height = Math.round(image.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);

      state.media[target] = canvas.toDataURL('image/jpeg', 0.86);
    } catch (error) {
      setCameraStatus(target, '这张图片无法处理，请换一张 JPG / PNG 图片。', true);
      return;
    }

    stopCamera();
    updateCameraUI(target);
    setCameraStatus(target, '照片已载入并保存在当前页面，可对照下方选项观察。');
  };

  image.onerror = () => {
    setCameraStatus(target, '这张图片无法读取，请换一张 JPG / PNG 图片。', true);
  };

  image.src = dataUrl;
}

function handleCameraFile(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  if (!input.matches('[data-camera-file]')) return;

  const target = input.getAttribute('data-camera-file');
  const file = input.files && input.files[0];
  if (!target || !file) return;

  if (!file.type.startsWith('image/')) {
    setCameraStatus(target, '请选择图片文件（JPG / PNG 等）。', true);
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => loadPhotoData(String(reader.result), target);
  reader.onerror = () => setCameraStatus(target, '图片读取失败，请重试。', true);
  reader.readAsDataURL(file);
  input.value = '';
}

function handleQuizClick(event) {
  const start = event.target.closest('[data-camera-start]');
  if (start) {
    startCamera(start.getAttribute('data-camera-start'));
    return;
  }

  const capture = event.target.closest('[data-camera-capture]');
  if (capture) {
    captureCamera(capture.getAttribute('data-camera-capture'));
    return;
  }

  const reset = event.target.closest('[data-camera-reset]');
  if (reset) {
    resetCamera(reset.getAttribute('data-camera-reset'));
    return;
  }

  const location = event.target.closest('.body-map [data-location]');
  if (location) {
    event.preventDefault();
    selectLocation(location.getAttribute('data-location'));
  }
}

function handleQuizKeydown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const location = event.target.closest('.body-map [data-location]');
  if (!location || location.tagName === 'BUTTON') return;

  event.preventDefault();
  selectLocation(location.getAttribute('data-location'));
}

function validateStep(index, options = {}) {
  const step = QUIZ_STEPS[index];
  if (!step) return true;

  let firstInvalid = null;
  let firstLabel = '';

  step.fields.forEach((field) => {
    if (!field.required) return;

    const fieldEl = dom.quizSteps.querySelector(
      `.quiz-step[data-step="${index}"] .field[data-field="${field.key}"]`
    );
    if (!fieldEl) return;

    const value = state.answers[field.key];
    let valid;
    if (field.type === 'number') {
      valid = typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 120;
    } else if (field.type === 'multi') {
      valid = Array.isArray(value) && value.length > 0;
    } else {
      valid = Boolean(value);
    }

    fieldEl.classList.toggle('has-error', !valid);

    if (!valid && !firstInvalid) {
      firstInvalid = fieldEl;
      firstLabel = field.label;
    }
  });

  if (!firstInvalid) return true;

  if (!options.silent) {
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const firstInput = firstInvalid.querySelector('input');
    if (firstInput) firstInput.focus({ preventScroll: true });
    showToast(`请先选择「${firstLabel}」`, true);
  }

  return false;
}

function validateAll() {
  for (let i = 0; i < QUIZ_STEPS.length; i += 1) {
    if (!validateStep(i, { silent: true })) {
      showQuizStep(i);
      validateStep(i);
      return false;
    }
  }
  return true;
}

function startQuiz() {
  if (!dom.quizSteps.children.length) renderQuiz();
  showQuizStep(state.currentStep);
  showScreen('quiz');
}

/* ---------- 12. 评分 ---------- */

function newScore() {
  let score = 0;
  const hits = [];

  return {
    add(points, label) {
      score += points;
      hits.push({ points, label });
    },
    done(id) {
      return {
        id,
        score,
        hits: hits.slice().sort((a, b) => b.points - a.points)
      };
    }
  };
}

function scoreReflux(a) {
  const s = newScore();

  if (has(a.chief, 'burning')) s.add(24, '以烧灼感为主');
  if (has(a.chief, 'bloating')) s.add(8, '餐后胀满');
  if (has(a.chief, 'fullness')) s.add(6, '堵闷 / 早饱');
  if (a.location === 'epigastric') s.add(8, '不适位于心窝 / 上腹正中');
  if (a.mealRelation === 'after') s.add(14, '饭后加重');
  if (a.mealRelation === 'night') s.add(12, '夜间症状明显');
  if (has(a.symptoms, 'reflux')) s.add(24, '有反酸 / 烧心');
  if (has(a.symptoms, 'bitter')) s.add(9, '口苦');
  if (has(a.symptoms, 'belch')) s.add(7, '嗳气');
  if (has(a.symptoms, 'bad_breath')) s.add(5, '口气重');
  if (has(a.symptoms, 'early_satiety')) s.add(3, '早饱');
  if (has(a.triggers, 'fatty')) s.add(10, '油腻食物诱发');
  if (has(a.triggers, 'spicy')) s.add(8, '辛辣食物诱发');
  if (has(a.triggers, 'alcohol')) s.add(7, '饮酒诱发');
  if (has(a.triggers, 'caffeine')) s.add(7, '咖啡 / 浓茶诱发');
  if (has(a.triggers, 'overeat')) s.add(5, '暴饮暴食诱发');
  if (a.duration === 'weeks') s.add(3, '病程 1–2 周');
  if (a.duration === 'month') s.add(4, '病程 1 个月以上');
  if (a.duration === 'recurrent') s.add(5, '反复发作 3 个月以上');
  if (a.age >= 40) s.add(3, '年龄 40 岁以上');
  if (a.pregnancy === 'yes') s.add(2, '孕期反流较常见');

  return s.done('reflux');
}

function scoreFD(a) {
  const s = newScore();

  if (has(a.chief, 'fullness')) s.add(24, '以堵闷 / 早饱为主');
  if (has(a.chief, 'bloating')) s.add(22, '以胀满为主');
  if (has(a.chief, 'nausea')) s.add(8, '伴恶心');
  if (has(a.chief, 'pain')) s.add(6, '上腹隐痛');
  if (has(a.chief, 'burning')) s.add(2, '偶有灼热感');
  if (a.location === 'epigastric') s.add(12, '不适位于上腹正中');
  if (a.location === 'periumbilical') s.add(4, '脐周不适');
  if (a.mealRelation === 'after') s.add(16, '饭后加重');
  if (a.mealRelation === 'before') s.add(3, '空腹时也有不适');
  if (a.mealRelation === 'none') s.add(4, '与进食关系不固定');
  if (a.appetite === 'low') s.add(8, '胃口变差');
  if (has(a.symptoms, 'belch')) s.add(12, '嗳气');
  if (has(a.symptoms, 'nausea')) s.add(8, '恶心');
  if (has(a.symptoms, 'early_satiety')) s.add(14, '吃一点就饱');
  if (has(a.symptoms, 'reflux')) s.add(4, '轻度反酸');
  if (has(a.triggers, 'stress')) s.add(10, '压力 / 情绪诱发');
  if (has(a.triggers, 'overeat')) s.add(8, '暴饮暴食诱发');
  if (has(a.triggers, 'fatty')) s.add(6, '油腻食物诱发');
  if (has(a.triggers, 'spicy')) s.add(4, '辛辣食物诱发');
  if (has(a.triggers, 'fasting')) s.add(4, '空腹太久诱发');
  if (a.mood === 'stress') s.add(8, '近期压力大');
  if (a.mood === 'irritable') s.add(6, '易怒 / 烦躁');
  if (a.mood === 'low') s.add(4, '情绪低落 / 思虑多');
  if (a.sleep === 'hard' || a.sleep === 'dream') s.add(3, '睡眠不佳');
  if (a.duration === 'recurrent') s.add(6, '反复 3 个月以上');
  if (a.duration === 'month') s.add(4, '病程 1 个月以上');
  if (a.stool === 'normal') s.add(2, '大便基本正常');
  if (a.stool === 'loose') s.add(2, '大便偏溏');
  if (a.age >= 18 && a.age <= 39) s.add(2, '中青年常见');

  return s.done('fd');
}

function scoreGastritis(a) {
  const s = newScore();

  if (has(a.chief, 'pain')) s.add(18, '上腹隐痛');
  if (has(a.chief, 'bloating')) s.add(14, '上腹胀满');
  if (has(a.chief, 'burning')) s.add(6, '胃脘灼热');
  if (a.location === 'epigastric') s.add(12, '不适位于上腹正中');
  if (a.mealRelation === 'after') s.add(8, '饭后加重');
  if (a.mealRelation === 'before') s.add(8, '空腹时明显');
  if (has(a.symptoms, 'bad_breath')) s.add(14, '口气重');
  if (has(a.symptoms, 'reflux')) s.add(8, '反酸');
  if (has(a.symptoms, 'belch')) s.add(8, '嗳气');
  if (has(a.symptoms, 'nausea')) s.add(6, '恶心');
  if (has(a.symptoms, 'early_satiety')) s.add(4, '早饱');
  if (a.appetite === 'low') s.add(6, '胃口变差');
  if (has(a.triggers, 'spicy')) s.add(10, '辛辣食物诱发');
  if (has(a.triggers, 'alcohol')) s.add(8, '饮酒诱发');
  if (has(a.triggers, 'nsaid')) s.add(8, '止痛药 / 阿司匹林');
  if (has(a.triggers, 'fasting')) s.add(4, '空腹太久');
  if (has(a.triggers, 'overeat')) s.add(4, '暴饮暴食');
  if (has(a.history, 'gastritis')) s.add(20, '既往慢性胃炎');
  if (has(a.history, 'hp')) s.add(24, '既往幽门螺杆菌阳性');
  if (a.duration === 'weeks') s.add(6, '病程 1–2 周');
  if (a.duration === 'month') s.add(12, '病程 1 个月以上');
  if (a.duration === 'recurrent') s.add(14, '反复 3 个月以上');
  if (a.age >= 40) s.add(4, '年龄 40 岁以上');

  return s.done('gastritis');
}

function scoreUlcer(a) {
  const s = newScore();

  if (has(a.chief, 'pain')) s.add(24, '规律性上腹痛');
  if (has(a.chief, 'burning')) s.add(10, '烧灼样痛');
  if (a.location === 'epigastric') s.add(12, '疼痛位于上腹正中');
  if (a.mealRelation === 'before') s.add(20, '空腹 / 饭前痛');
  if (a.mealRelation === 'after') s.add(14, '饭后痛');
  if (a.mealRelation === 'night') s.add(18, '夜间痛醒');
  if (has(a.symptoms, 'belch')) s.add(6, '嗳气');
  if (has(a.symptoms, 'nausea')) s.add(6, '恶心');
  if (has(a.symptoms, 'reflux')) s.add(4, '反酸');
  if (has(a.triggers, 'nsaid')) s.add(14, '服用止痛药 / 阿司匹林');
  if (has(a.triggers, 'spicy')) s.add(6, '辛辣食物诱发');
  if (has(a.triggers, 'alcohol')) s.add(6, '饮酒诱发');
  if (has(a.triggers, 'stress')) s.add(4, '压力 / 情绪诱发');
  if (has(a.history, 'ulcer')) s.add(26, '既往消化性溃疡');
  if (a.stool === 'black') s.add(30, '黑便 / 柏油样便');
  if (a.duration === 'weeks') s.add(6, '病程 1–2 周');
  if (a.duration === 'month') s.add(6, '病程 1 个月以上');
  if (a.duration === 'recurrent') s.add(4, '反复发作');
  if (a.age >= 40) s.add(4, '年龄 40 岁以上');
  if (a.severity >= 7) s.add(4, '疼痛程度较重');

  return s.done('ulcer');
}

function scoreGastroenteritis(a) {
  const s = newScore();

  if (a.duration === 'today') s.add(24, '今天急性起病');
  if (a.duration === 'days') s.add(20, '近 2–3 天急性起病');
  if (has(a.chief, 'cramp')) s.add(20, '阵发性绞痛');
  if (has(a.chief, 'nausea')) s.add(14, '恶心明显');
  if (has(a.chief, 'pain')) s.add(6, '腹痛');
  if (a.location === 'periumbilical') s.add(12, '脐周痛');
  if (a.location === 'diffuse') s.add(8, '全腹不适');
  if (a.location === 'epigastric') s.add(4, '上腹不适');
  if (has(a.symptoms, 'nausea')) s.add(18, '恶心');
  if (has(a.symptoms, 'vomit')) s.add(16, '呕吐');
  if (a.stool === 'loose') s.add(20, '大便溏稀');
  if (a.frequency === 'multiple') s.add(10, '大便次数增多');
  if (has(a.general, 'fever')) s.add(18, '发热');
  if (has(a.general, 'fatigue')) s.add(4, '乏力');
  if (has(a.triggers, 'bad_food')) s.add(14, '不洁 / 隔夜食物史');
  if (a.appetite === 'low') s.add(4, '胃口变差');

  return s.done('gastroenteritis');
}

function scoreGallstone(a) {
  const s = newScore();

  if (a.location === 'right_upper') s.add(30, '右上腹疼痛');
  if (has(a.chief, 'cramp')) s.add(14, '阵发性绞痛');
  if (has(a.chief, 'pain')) s.add(10, '持续性腹痛');
  if (a.mealRelation === 'after') s.add(12, '饭后加重');
  if (has(a.triggers, 'fatty')) s.add(20, '油腻餐后诱发');
  if (has(a.triggers, 'overeat')) s.add(6, '暴饮暴食诱发');
  if (has(a.symptoms, 'nausea')) s.add(10, '恶心');
  if (has(a.symptoms, 'vomit')) s.add(10, '呕吐');
  if (has(a.symptoms, 'bitter')) s.add(4, '口苦');
  if (has(a.general, 'fever')) s.add(12, '发热');
  if (has(a.history, 'gallstone')) s.add(25, '既往胆结石 / 胆囊炎');
  if (has(a.radiation, 'right_shoulder')) s.add(18, '疼痛放射到右肩 / 右背');
  if (has(a.radiation, 'back')) s.add(6, '疼痛牵连后背');
  if (a.age >= 40) s.add(4, '年龄 40 岁以上');
  if (a.duration === 'today') s.add(6, '今天急性发作');
  if (a.duration === 'days') s.add(4, '近几天发作');

  return s.done('gallstone');
}

function scorePancreatitis(a) {
  const s = newScore();

  if (has(a.chief, 'pain')) s.add(22, '持续性上腹痛');
  if (has(a.chief, 'cramp')) s.add(8, '阵发性加重');
  if (a.location === 'epigastric') s.add(12, '上腹正中痛');
  if (a.location === 'left_upper') s.add(8, '左上腹痛');
  if (has(a.radiation, 'back')) s.add(22, '疼痛放射到后背');
  if (has(a.triggers, 'alcohol')) s.add(20, '饮酒后发作');
  if (has(a.triggers, 'fatty')) s.add(12, '油腻餐后发作');
  if (has(a.triggers, 'overeat')) s.add(10, '暴饮暴食后发作');
  if (has(a.symptoms, 'vomit')) s.add(16, '呕吐');
  if (has(a.symptoms, 'nausea')) s.add(10, '恶心');
  if (a.severity >= 8) s.add(20, '疼痛评分 8 分以上');
  else if (a.severity >= 6) s.add(8, '疼痛明显');
  if (has(a.history, 'pancreatitis')) s.add(24, '既往胰腺炎');
  if (has(a.history, 'gallstone')) s.add(8, '既往胆结石');
  if (a.duration === 'today') s.add(8, '今天急性起病');
  if (a.duration === 'days') s.add(4, '近几天起病');
  if (has(a.general, 'fever')) s.add(6, '发热');
  if (a.age >= 40) s.add(3, '年龄 40 岁以上');

  return s.done('pancreatitis');
}

function scoreIBS(a) {
  const s = newScore();

  if (has(a.chief, 'cramp')) s.add(14, '阵发性腹痛');
  if (has(a.chief, 'bloating')) s.add(10, '腹胀');
  if (has(a.chief, 'pain')) s.add(6, '腹痛');
  if (a.location === 'periumbilical') s.add(8, '脐周痛');
  if (a.location === 'lower') s.add(8, '下腹痛');
  if (a.location === 'diffuse') s.add(5, '全腹不适');
  if (a.stool === 'alternating') s.add(24, '便秘腹泻交替');
  if (a.stool === 'loose') s.add(12, '大便偏溏');
  if (a.stool === 'dry') s.add(6, '大便偏干');
  if (a.stool === 'sticky') s.add(6, '大便黏滞');
  if (a.frequency === 'irregular') s.add(6, '排便不规律');
  if (a.mealRelation === 'after') s.add(6, '饭后加重');
  if (a.mealRelation === 'none') s.add(4, '与进食关系不固定');
  if (a.mood === 'stress') s.add(12, '压力大');
  if (a.mood === 'irritable') s.add(6, '易怒 / 烦躁');
  if (a.mood === 'low') s.add(4, '情绪低落');
  if (a.duration === 'recurrent') s.add(14, '反复 3 个月以上');
  if (a.duration === 'month') s.add(8, '病程 1 个月以上');
  if (has(a.symptoms, 'belch')) s.add(4, '嗳气');
  if (has(a.symptoms, 'nausea')) s.add(4, '恶心');
  if (has(a.triggers, 'stress')) s.add(6, '压力诱发');
  if (a.age >= 18 && a.age <= 39) s.add(2, '中青年常见');

  return s.done('ibs');
}

function scoreCardiac(a) {
  const s = newScore();

  if (has(a.general, 'chest')) s.add(30, '胸闷 / 气短');
  if (has(a.radiation, 'left_arm')) s.add(30, '疼痛放射到左肩 / 下颌 / 左臂');
  if (has(a.general, 'cold_sweat')) s.add(18, '冷汗');
  if (has(a.general, 'dizzy')) s.add(6, '头晕 / 心慌');
  if (a.severity >= 8) s.add(6, '症状较重');
  if (a.age >= 60) s.add(12, '年龄 60 岁以上');
  if (a.age >= 40 && a.age < 60) s.add(5, '年龄 40 岁以上');
  if (has(a.triggers, 'activity')) s.add(15, '活动后加重');
  if (has(a.chief, 'pain')) s.add(4, '上腹痛');
  if (has(a.chief, 'burning')) s.add(2, '上腹灼热');
  if (has(a.symptoms, 'nausea')) s.add(2, '恶心');
  if (a.location === 'epigastric') s.add(2, '上腹正中不适');

  return s.done('cardiac');
}

function scoreAlarm(a) {
  const s = newScore();

  if (has(a.general, 'weight_loss')) s.add(30, '不明原因体重下降');
  if (has(a.general, 'dysphagia')) s.add(32, '吞咽困难 / 进食哽噎');
  if (a.stool === 'black') s.add(30, '黑便 / 柏油样便');
  if (a.family === 'yes') s.add(24, '胃癌 / 食管癌家族史');
  if (a.age >= 40 && a.age < 60) s.add(8, '年龄 40–59 岁');
  if (a.age >= 60) s.add(12, '年龄 60 岁以上');
  if (a.duration === 'month') s.add(8, '症状持续 1 个月以上');
  if (a.duration === 'recurrent') s.add(6, '症状反复 3 个月以上');
  if (a.appetite === 'low') s.add(8, '胃口持续变差');
  if (has(a.symptoms, 'early_satiety')) s.add(8, '早饱');
  if (has(a.general, 'fatigue')) s.add(3, '乏力');
  if (has(a.general, 'dizzy')) s.add(3, '头晕 / 心慌');

  return s.done('alarm');
}

function scoreCold(a) {
  const s = newScore();
  if (has(a.chief, 'pain')) s.add(8, '胃痛');
  if (a.duration === 'today') s.add(8, '突然起病');
  if (has(a.triggers, 'cold')) s.add(14, '生冷 / 冰饮诱发');
  if (a.coldHeat === 'cold') s.add(14, '怕冷 / 手脚凉');
  if (a.drink === 'warm') s.add(12, '喜欢热饮');
  if (a.warmRelief === 'better') s.add(18, '得温则舒');
  if (a.tongueBody === 'pale') s.add(8, '舌质淡白');
  if (a.tongueCoat === 'thin_white') s.add(5, '苔薄白');
  if (a.stool === 'loose') s.add(4, '大便偏溏');
  if (a.faceColor === 'pale') s.add(6, '面色苍白');
  if (a.lips === 'pale') s.add(4, '口唇色淡');
  return s.done('cold');
}

function scoreFood(a) {
  const s = newScore();
  if (has(a.triggers, 'overeat')) s.add(20, '暴饮暴食');
  if (has(a.symptoms, 'belch')) s.add(10, '嗳气');
  if (has(a.symptoms, 'nausea')) s.add(6, '恶心');
  if (has(a.symptoms, 'bad_breath')) s.add(8, '口气重');
  if (a.stool === 'sticky') s.add(8, '大便黏滞');
  if (a.tongueCoat === 'white_thick') s.add(12, '苔白厚腻');
  if (has(a.chief, 'fullness')) s.add(10, '堵闷 / 早饱');
  if (has(a.chief, 'bloating')) s.add(8, '胀满');
  if (a.appetite === 'low') s.add(4, '胃口变差');
  if (a.tongueShape === 'swollen') s.add(4, '舌体胖大');
  if (a.faceShine === 'oily') s.add(4, '面部容易出油');
  return s.done('food');
}

function scoreLiver(a) {
  const s = newScore();
  if (a.mood === 'stress') s.add(16, '压力大 / 紧张');
  if (a.mood === 'irritable') s.add(18, '易怒 / 烦躁');
  if (has(a.symptoms, 'belch')) s.add(10, '嗳气');
  if (has(a.chief, 'fullness')) s.add(8, '堵闷');
  if (has(a.chief, 'bloating')) s.add(6, '胀满');
  if (a.mealRelation === 'none') s.add(6, '与进食关系不固定');
  if (a.sleep === 'hard') s.add(4, '入睡困难');
  if (has(a.symptoms, 'dry_mouth')) s.add(2, '口干');
  if (has(a.triggers, 'stress')) s.add(6, '情绪诱发');
  if (a.eyes === 'dark_circles') s.add(4, '黑眼圈明显');
  return s.done('liver');
}

function scoreDampheat(a) {
  const s = newScore();
  if (has(a.symptoms, 'bitter')) s.add(12, '口苦');
  if (has(a.symptoms, 'sticky')) s.add(10, '口黏');
  if (has(a.symptoms, 'bad_breath')) s.add(6, '口气重');
  if (a.stool === 'sticky') s.add(14, '大便黏滞');
  if (a.coldHeat === 'hot') s.add(10, '怕热 / 易上火');
  if (a.drink === 'cold') s.add(8, '喜欢冷饮');
  if (a.tongueBody === 'red') s.add(8, '舌质偏红');
  if (a.tongueCoat === 'yellow') s.add(18, '苔黄 / 黄腻');
  if (has(a.symptoms, 'reflux')) s.add(4, '反酸烧心');
  if (has(a.triggers, 'spicy')) s.add(4, '辛辣诱发');
  if (has(a.triggers, 'alcohol')) s.add(4, '饮酒诱发');
  if (a.tongueShape === 'swollen') s.add(4, '舌体胖大');
  if (a.faceShine === 'oily') s.add(8, '面部油腻');
  if (a.lips === 'red') s.add(4, '口唇红赤');
  if (a.gums === 'bleed' || a.gums === 'swollen') s.add(4, '牙龈红肿 / 出血');
  if (a.bodyType === 'overweight' || a.bodyType === 'obese') s.add(4, '体型偏胖');
  if (a.handColor === 'yellow') s.add(6, '手掌偏黄');
  if (a.handThenar === 'red' || a.handThenar === 'thick') s.add(4, '大鱼际发红 / 肥厚');
  if (a.handTemperature === 'wet') s.add(4, '手心湿黏 / 汗多');
  return s.done('dampheat');
}

function scoreBlood(a) {
  const s = newScore();
  if (a.stool === 'black') s.add(30, '黑便 / 柏油样便');
  if (a.tongueBody === 'purple') s.add(24, '舌质紫暗 / 有瘀点');
  if (a.severity >= 8) s.add(8, '疼痛剧烈');
  if (a.duration === 'month') s.add(8, '病程 1 个月以上');
  if (has(a.chief, 'pain')) s.add(6, '胃痛');
  if (a.location === 'epigastric') s.add(4, '痛处固定于上腹');
  if (a.sublingual === 'purple') s.add(18, '舌下络脉青紫 / 怒张');
  if (a.lips === 'purple') s.add(10, '口唇紫暗');
  if (a.nails === 'purple') s.add(10, '指甲紫暗');
  if (a.faceColor === 'dark') s.add(8, '面色晦暗');
  if (a.handColor === 'cyan' || a.handColor === 'dark') s.add(6, '手掌青紫 / 晦暗');
  if (a.handVeins === 'palm' || a.handVeins === 'back') s.add(4, '手上青筋明显');
  return s.done('blood');
}

function scoreYin(a) {
  const s = newScore();
  if (has(a.symptoms, 'dry_mouth')) s.add(12, '口干');
  if (a.stool === 'dry') s.add(12, '大便偏干');
  if (a.coldHeat === 'hot') s.add(6, '怕热');
  if (a.tongueBody === 'red') s.add(8, '舌质偏红');
  if (a.tongueCoat === 'none') s.add(16, '少苔 / 无苔');
  if (a.sleep === 'hard') s.add(4, '入睡困难');
  if (a.appetite === 'low') s.add(4, '胃口变差');
  if (has(a.chief, 'burning')) s.add(4, '胃脘灼热');
  if (a.tongueShape === 'cracks') s.add(8, '舌面裂纹');
  if (a.faceColor === 'flushed') s.add(6, '面色潮红');
  if (a.lips === 'red') s.add(4, '口唇红赤');
  if (a.hair === 'dry') s.add(4, '发质干枯');
  if (a.nails === 'brittle') s.add(4, '指甲脆薄');
  if (a.gums === 'bleed') s.add(3, '牙龈容易出血');
  if (a.handTemperature === 'palm_hot' || a.handTemperature === 'dry') s.add(4, '手心热 / 手干');
  if (a.handColor === 'red') s.add(2, '手掌偏红');
  return s.done('yin');
}

function scoreSpleenCold(a) {
  const s = newScore();
  if (a.coldHeat === 'cold') s.add(14, '怕冷 / 手脚凉');
  if (a.drink === 'warm') s.add(10, '喜欢热饮');
  if (a.stool === 'loose') s.add(12, '大便溏稀');
  if (has(a.general, 'fatigue')) s.add(10, '乏力');
  if (a.warmRelief === 'better') s.add(12, '得温则舒');
  if (a.tongueBody === 'pale') s.add(10, '舌质淡白');
  if (a.tongueCoat === 'thin_white') s.add(6, '苔薄白');
  if (has(a.chief, 'pain')) s.add(4, '胃痛');
  if (a.appetite === 'low') s.add(4, '胃口变差');
  if (a.tongueShape === 'teeth' || a.tongueShape === 'swollen') s.add(8, '舌体胖大 / 齿痕');
  if (a.eyes === 'puffy') s.add(4, '眼睑浮肿');
  if (a.faceColor === 'pale' || a.faceColor === 'sallow') s.add(4, '面色偏淡');
  if (a.handColor === 'pale') s.add(4, '手掌偏白');
  if (a.handThenar === 'cyan' || a.handThenar === 'flat') s.add(4, '大鱼际发青 / 扁平');
  if (a.handTemperature === 'cold') s.add(4, '手总是凉');
  return s.done('spleen_cold');
}

function scoreQi(a) {
  const s = newScore();
  if (has(a.general, 'fatigue')) s.add(16, '乏力');
  if (a.appetite === 'low') s.add(10, '胃口变差');
  if (a.stool === 'loose') s.add(8, '大便溏稀');
  if (has(a.chief, 'fullness')) s.add(8, '堵闷 / 早饱');
  if (a.duration === 'recurrent') s.add(6, '反复 3 个月以上');
  if (a.tongueBody === 'pale') s.add(6, '舌质淡白');
  if (has(a.general, 'dizzy')) s.add(4, '头晕 / 心慌');
  if (a.mood === 'low') s.add(3, '情绪低落');
  if (a.tongueShape === 'teeth') s.add(6, '舌边齿痕');
  if (a.faceColor === 'pale' || a.faceColor === 'sallow') s.add(10, '面色苍白 / 萎黄');
  if (a.lips === 'pale') s.add(6, '口唇色淡');
  if (a.nails === 'pale') s.add(6, '指甲苍白');
  if (a.hair === 'dry') s.add(4, '发质干枯');
  if (a.bodyType === 'thin') s.add(3, '体型偏瘦');
  if (a.handThenar === 'flat') s.add(5, '大鱼际扁平');
  if (a.handColor === 'pale') s.add(4, '手掌偏白');
  return s.done('qi');
}

function scoreBloodDef(a) {
  const s = newScore();
  if (a.faceColor === 'pale' || a.faceColor === 'sallow') s.add(12, '面色苍白 / 萎黄');
  if (a.lips === 'pale') s.add(10, '口唇色淡');
  if (a.nails === 'pale') s.add(8, '指甲苍白');
  if (a.hair === 'dry') s.add(6, '发质干枯');
  if (a.tongueBody === 'pale') s.add(8, '舌质淡白');
  if (a.nails === 'brittle') s.add(5, '指甲脆薄');
  if (a.gums === 'pale') s.add(4, '牙龈苍白');
  if (a.bodyType === 'thin') s.add(3, '体型偏瘦');
  if (a.handColor === 'pale') s.add(5, '手掌偏白');
  if (a.handThenar === 'flat') s.add(3, '大鱼际扁平');
  if (has(a.general, 'fatigue')) s.add(10, '乏力');
  if (has(a.general, 'dizzy')) s.add(6, '头晕 / 心慌');
  if (a.appetite === 'low') s.add(4, '胃口变差');
  if (a.sleep === 'dream' || a.sleep === 'hard') s.add(2, '睡眠不佳');
  return s.done('blood_def');
}

function pickPattern(a) {
  const candidates = [
    scoreCold(a),
    scoreFood(a),
    scoreLiver(a),
    scoreDampheat(a),
    scoreBlood(a),
    scoreYin(a),
    scoreSpleenCold(a),
    scoreQi(a),
    scoreBloodDef(a)
  ].sort((x, y) => y.score - x.score);

  const top = candidates[0];
  if (!top || top.score < 22) {
    return { ...PATTERNS.balanced, score: top ? top.score : 0, hits: [] };
  }

  return { ...PATTERNS[top.id], ...top };
}

/* ---------- 13. 就医优先级 ---------- */

function evaluateUrgency(a, ranked, alarm) {
  const immediate = [];
  const urgent = [];
  const soon = [];

  const add = (bucket, label) => {
    if (!bucket.includes(label)) bucket.push(label);
  };

  if (has(a.general, 'chest')) add(immediate, '胸闷 / 气短');
  if (has(a.radiation, 'left_arm')) add(immediate, '疼痛放射到左肩 / 下颌 / 左臂');
  if (has(a.general, 'cold_sweat') && (has(a.general, 'chest') || has(a.radiation, 'left_arm'))) {
    add(immediate, '冷汗伴胸闷 / 放射痛');
  }
  if (a.pregnancy === 'yes' && (has(a.chief, 'cramp') || a.location === 'lower' || a.location === 'diffuse')) {
    add(immediate, '孕期腹痛');
  }
  if (a.duration === 'today' && a.severity >= 9) add(immediate, '突发且剧烈的腹痛');
  if (ranked.some((item) => item.id === 'pancreatitis' && item.score >= 85)) {
    add(immediate, '胰腺炎相关线索较集中');
  }
  if (ranked.some((item) => item.id === 'cardiac' && item.score >= 45)) {
    add(immediate, '需要排除心脏问题');
  }
  if (a.stool === 'black' && (has(a.general, 'dizzy') || has(a.general, 'cold_sweat'))) {
    add(immediate, '黑便伴头晕 / 冷汗');
  }

  if (a.severity >= 8) add(urgent, '疼痛评分达到 8 分以上');
  if (a.stool === 'black') add(urgent, '黑便 / 柏油样便');
  if (a.stool === 'blood') add(urgent, '大便带血或黏液');
  if (has(a.general, 'jaundice')) add(urgent, '皮肤或眼白发黄');
  if (has(a.general, 'fever') && (
    has(a.chief, 'pain') || has(a.chief, 'cramp') || has(a.chief, 'burning') || a.location === 'right_upper'
  )) {
    add(urgent, '发热伴腹部症状');
  }
  if (has(a.general, 'dysphagia')) add(urgent, '吞咽困难 / 进食哽噎');
  if (has(a.radiation, 'back') && a.severity >= 7) add(urgent, '剧烈腹痛放射到后背');
  if (has(a.chief, 'cramp') && a.duration === 'today' && a.severity >= 7) add(urgent, '急性阵发性剧痛');
  if (a.age >= 60 && a.severity >= 7) add(urgent, '高龄且疼痛明显');
  if (has(a.general, 'cold_sweat')) add(urgent, '冷汗');
  if (ranked.some((item) => item.id === 'pancreatitis' && item.score >= 80)) {
    add(urgent, '胰腺炎相关线索需要医生评估');
  }
  if (a.location === 'right_upper' && has(a.triggers, 'fatty') && a.severity >= 7) {
    add(urgent, '右上腹剧痛伴油腻餐后发作');
  }
  if (a.pregnancy === 'yes') add(soon, '孕期用药与检查需医生评估');

  if (has(a.general, 'weight_loss')) add(soon, '不明原因体重下降');
  if (a.family === 'yes') add(soon, '胃癌 / 食管癌家族史');
  if (a.age >= 40 && ['weeks', 'month', 'recurrent'].includes(a.duration)) {
    add(soon, '40 岁后持续或反复的胃部症状');
  }
  if (a.duration === 'month') add(soon, '症状已持续 1 个月以上');
  if (a.duration === 'recurrent') add(soon, '症状反复 3 个月以上');
  if (a.location === 'right_upper' && has(a.triggers, 'fatty')) add(soon, '右上腹疼痛伴油腻餐后发作');
  if (
    (a.faceColor === 'pale' || a.lips === 'pale' || a.nails === 'pale' || a.gums === 'pale') &&
    (has(a.general, 'fatigue') || has(a.general, 'dizzy'))
  ) {
    add(soon, '面色 / 唇甲 / 牙龈苍白伴乏力，建议查血常规');
  }
  if (a.fundus && !['unknown', 'normal'].includes(a.fundus)) {
    add(soon, '眼底检查异常，建议眼科评估');
  }
  const handFlags = Array.isArray(a.handRedFlags) ? a.handRedFlags : [];
  if (handFlags.some((flag) => ['liver_palm', 'dark_spot', 'nail_color', 'nail_shape'].includes(flag))) {
    add(soon, '手诊出现需要就医排查的征象');
  }
  if (handFlags.includes('thenar_chest')) {
    add(urgent, '手部青筋伴胸闷胸痛');
  }
  if (alarm.score >= 30) add(soon, '存在需要进一步排查的警示信号');
  if (has(a.general, 'fatigue') && has(a.symptoms, 'early_satiety')) add(soon, '早饱伴乏力');

  if (immediate.length > 0) {
    return {
      level: 'emergency',
      icon: 'i-alert',
      title: '建议立即急诊，必要时拨打 120',
      text: '你填写的信息中出现需要立即评估的警示信号。不要自行驾车、进食进水或服药；若正在独自一人，先拨打 120 并保持通讯畅通。',
      reasons: immediate
    };
  }

  if (urgent.length > 0) {
    return {
      level: 'urgent',
      icon: 'i-alert',
      title: '建议今天或 24 小时内就医',
      text: '这些信号不适合继续在家观察。请今天前往急诊或消化内科；如果出现呕血、晕厥、疼痛明显加重或呼吸困难，立即拨打 120。',
      reasons: urgent
    };
  }

  if (soon.length > 0) {
    return {
      level: 'soon',
      icon: 'i-clock',
      title: '建议 1–2 周内到消化内科就诊',
      text: '目前没有必须立即急诊的表现，但建议尽快安排医生评估，明确原因，而不是长期自行吃药。',
      reasons: soon
    };
  }

  return {
    level: 'routine',
    icon: 'i-shield',
    title: '暂未发现需要急诊的信号',
    text: '可以先按下面的方向观察调理 3–5 天，并记录症状变化。若没有改善、加重，或出现新的警示信号，请及时就医。',
    reasons: []
  };
}

function buildWhy(top) {
  const labels = top.hits.slice(0, 3).map((hit) => hit.label);
  if (labels.length === 0) {
    return '你填写的信息较少，暂时无法形成明显倾向。可以补充问卷，或直接由医生面诊评估。';
  }
  return `你提到的「${labels.join('、')}」与${top.name}的常见表现比较接近。仅凭症状不能确诊，医生还会结合病程、查体和必要检查来判断。`;
}

function countClues(a) {
  let count = 0;
  Object.entries(a).forEach(([key, value]) => {
    if (key === 'severity') {
      count += 1;
      return;
    }
    if (Array.isArray(value)) {
      count += value.filter((item) => item !== 'none').length;
      return;
    }
    if (value) count += 1;
  });
  return count;
}

function buildAnalysis(a) {
  const raw = [
    scoreReflux(a),
    scoreFD(a),
    scoreGastritis(a),
    scoreUlcer(a),
    scoreGastroenteritis(a),
    scoreGallstone(a),
    scorePancreatitis(a),
    scoreIBS(a),
    scoreCardiac(a)
  ].map((item) => ({ ...item, ...CONDITIONS[item.id] }));

  raw.forEach((item) => {
    let boost = 0;
    if (item.id === 'cardiac' && (has(a.general, 'chest') || has(a.radiation, 'left_arm'))) boost += 20;
    if (item.id === 'pancreatitis' && a.severity >= 8 && has(a.radiation, 'back')) boost += 12;
    if (item.id === 'gallstone' && a.location === 'right_upper' && has(a.general, 'fever')) boost += 12;
    if (item.id === 'ulcer' && a.stool === 'black') boost += 15;
    if (item.id === 'gastroenteritis' && a.stool === 'loose' && has(a.general, 'fever')) boost += 8;

    item.boost = boost;
    item.score += boost;
    item.pct = clamp(Math.round(item.score), 8, 96);
  });

  const sorted = raw.slice().sort((x, y) => y.score - x.score);
  const topThree = sorted.filter((item) => item.score >= 12).slice(0, 3);

  sorted.forEach((item) => {
    if (topThree.length >= 3) return;
    if (!topThree.includes(item)) topThree.push(item);
  });

  const alarm = scoreAlarm(a);
  const pattern = pickPattern(a);
  const urgency = evaluateUrgency(a, sorted, alarm);

  return {
    top: topThree[0],
    others: topThree.slice(1),
    sorted,
    alarm,
    pattern,
    urgency,
    count: countClues(a),
    date: formatNow()
  };
}

/* ---------- 14. 结果渲染 ---------- */

function renderResult(result) {
  const { top, others, pattern, urgency, alarm, count, date } = result;

  dom.resultDate.textContent = date;
  dom.resultCount.textContent = String(count);

  dom.topMatchLabel.textContent = matchLabel(top.pct);
  dom.topKicker.textContent = top.kicker;
  dom.topCondition.textContent = top.name;
  dom.topDesc.textContent = top.desc;
  dom.topMatchPct.textContent = `${top.pct} / 100`;
  dom.topMatchBar.style.width = '0%';
  dom.topWhy.textContent = buildWhy(top);
  dom.topReasons.innerHTML = top.hits.slice(0, 4).map((hit) => `
    <span class="reason-chip">${hit.label}</span>
  `).join('');
  dom.topCare.innerHTML = top.care.slice(0, 3).map((item) => `<li>${item}</li>`).join('');
  dom.topDepartment.textContent = top.department;
  dom.topWatch.textContent = top.watch;

  dom.otherConditions.innerHTML = others.map((item, index) => renderOtherCard(item, index)).join('');
  renderUrgencyBanner(urgency);
  renderAlarmCard(alarm, urgency);
  renderPattern(pattern);
  renderLookSummary();
  renderPlan(top, urgency);
  renderSafety(top);

  showScreen('result');

  window.setTimeout(() => {
    dom.topMatchBar.style.width = `${top.pct}%`;
  }, 90);
}

function renderOtherCard(item, index) {
  const reasons = item.hits.slice(0, 3).map((hit) => hit.label);
  const reasonText = reasons.length > 0
    ? reasons.join(' · ')
    : '填写线索较少';

  return `
    <article class="other-card">
      <div class="other-topline">
        <span class="other-rank">0${index + 2}</span>
        <span class="other-match">${matchLabel(item.pct)}</span>
      </div>
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <div class="other-reasons">线索：${reasonText}</div>
      <p class="other-care">建议：${item.care[0]}</p>
    </article>
  `;
}

function renderUrgencyBanner(urgency) {
  const reasons = urgency.reasons.length > 0
    ? `<ul>${urgency.reasons.map((reason) => `<li>${reason}</li>`).join('')}</ul>`
    : '';

  dom.urgencyBanner.className = `urgency-banner is-visible level-${urgency.level}`;
  dom.urgencyBanner.innerHTML = `
    <div class="urgency-icon">
      <svg class="icon" aria-hidden="true"><use href="#${urgency.icon}"></use></svg>
    </div>
    <div class="urgency-copy">
      <strong>${urgency.title}</strong>
      <p>${urgency.text}</p>
      ${reasons}
    </div>
  `;
}

function renderAlarmCard(alarm, urgency) {
  let card = document.getElementById('alarm-card');

  if (!card) {
    card = document.createElement('div');
    card.id = 'alarm-card';
    dom.topCard.insertAdjacentElement('afterend', card);
  }

  if (alarm.score < 30) {
    card.className = '';
    card.innerHTML = '';
    return;
  }

  const reasons = alarm.hits.slice(0, 3).map((hit) => hit.label);
  let action = '建议 1–2 周内到消化内科就诊；若出现黑便、呕血、吞咽困难或体重快速下降，请尽快就医。';

  if (urgency.level === 'emergency') {
    action = '请立即急诊或拨打 120，不要等待；带上用药清单和既往检查结果。';
  } else if (urgency.level === 'urgent') {
    action = '建议今天或 24 小时内就医；若出现呕血、晕厥或疼痛明显加重，立即拨打 120。';
  } else if (urgency.level === 'soon') {
    action = '建议 1–2 周内到消化内科就诊；若出现黑便、呕血、吞咽困难或体重快速下降，请尽快就医。';
  }

  card.className = 'alarm-card';
  card.innerHTML = `
    <div class="alarm-head">
      <span class="alarm-mark">!</span>
      <div>
        <p class="eyebrow">RULE OUT · 需要排除</p>
        <h3>有些信号，不能只当普通胃病看</h3>
      </div>
    </div>
    <p>你填写了「${reasons.join('、')}」。这不代表一定是严重疾病，但医生通常会比普通胃痛更积极地安排检查，目的是排除风险。</p>
    <div class="alarm-foot">
      <span>${action}</span>
      <span>可能需要：胃镜、幽门螺杆菌检测、血常规或腹部超声。</span>
    </div>
  `;
}

function renderPattern(pattern) {
  dom.patternName.textContent = pattern.name;
  dom.patternBadge.textContent = pattern.score >= 55
    ? '较明显'
    : pattern.score >= 30
      ? '有一些'
      : '线索较少';
  dom.patternDesc.textContent = pattern.desc;

  const signs = pattern.hits && pattern.hits.length > 0
    ? pattern.hits.slice(0, 3).map((hit) => `<li>${hit.label}</li>`).join('')
    : '<li>填写的信息较少，暂未形成明显寒热虚实偏颇</li>';

  dom.patternSigns.innerHTML = signs;
  dom.patternAdvice.innerHTML = pattern.advice.map((item) => `<li>${item}</li>`).join('');
}

function optionLabel(key, value) {
  for (const step of QUIZ_STEPS) {
    const field = step.fields.find((item) => item.key === key);
    if (!field || !field.options) continue;
    const values = Array.isArray(value) ? value : [value];
    const labels = values
      .map((item) => field.options.find((option) => option.value === item)?.title)
      .filter(Boolean);
    if (labels.length > 0) return labels.join('、');
  }
  return '';
}

function renderLookSummary() {
  const tcmCard = document.getElementById('tcm-card');
  if (!tcmCard) return;

  let card = document.getElementById('look-result');
  if (!card) {
    card = document.createElement('section');
    card.id = 'look-result';
    tcmCard.insertAdjacentElement('afterend', card);
  }

  const tongueTags = [
    ['tongueBody', '舌质'],
    ['tongueShape', '舌体'],
    ['tongueCoat', '舌苔'],
    ['sublingual', '舌下']
  ]
    .map(([key, prefix]) => [prefix, optionLabel(key, state.answers[key])])
    .filter(([, label]) => label && label !== '不会看 / 跳过');

  const faceTags = [
    ['faceColor', '面色'],
    ['faceShine', '光泽'],
    ['eyes', '眼周'],
    ['lips', '口唇']
  ]
    .map(([key, prefix]) => [prefix, optionLabel(key, state.answers[key])])
    .filter(([, label]) => label && label !== '不会看 / 跳过');

  const bodyTags = [
    ['hair', '发质'],
    ['nails', '指甲'],
    ['gums', '牙龈'],
    ['fundus', '眼底']
  ]
    .map(([key, prefix]) => [prefix, optionLabel(key, state.answers[key])])
    .filter(([, label]) => label && !['其他 / 说不清', '未检查 / 不清楚'].includes(label));

  const handTags = [
    ['handColor', '掌色'],
    ['handThenar', '大鱼际'],
    ['handTemperature', '手温'],
    ['handVeins', '青筋'],
    ['handRedFlags', '手部警示']
  ]
    .map(([key, prefix]) => [prefix, optionLabel(key, state.answers[key])])
    .filter(([, label]) => label && !['不会看 / 跳过', '没有以上', '不明显'].includes(label));

  const tags = [...tongueTags, ...faceTags, ...bodyTags, ...handTags];
  const tonguePhoto = state.media.tongue;
  const facePhoto = state.media.face;
  const handPhoto = state.media.hand;

  if (tags.length === 0 && !tonguePhoto && !facePhoto && !handPhoto) {
    card.className = '';
    card.innerHTML = '';
    return;
  }

  const photos = [];
  if (tonguePhoto) {
    photos.push(`
      <figure class="look-photo">
        <img src="${tonguePhoto}" alt="本次舌象照片预览">
        <figcaption>舌象 · 仅本页</figcaption>
      </figure>
    `);
  }
  if (facePhoto) {
    photos.push(`
      <figure class="look-photo">
        <img src="${facePhoto}" alt="本次面部照片预览">
        <figcaption>面部 · 仅本页</figcaption>
      </figure>
    `);
  }
  if (handPhoto) {
    photos.push(`
      <figure class="look-photo">
        <img src="${handPhoto}" alt="本次手掌照片预览">
        <figcaption>手掌 · 仅本页</figcaption>
      </figure>
    `);
  }

  card.className = 'look-result';
  card.innerHTML = `
    <div class="look-result-head">
      <div>
        <p class="eyebrow">OBSERVATION · 望诊记录</p>
        <h2>你拍下 / 观察到的线索</h2>
      </div>
      <span class="look-result-badge">仅本页保存</span>
    </div>
    <div class="look-result-body">
      ${photos.length > 0 ? `<div class="look-photos">${photos.join('')}</div>` : ''}
      <div class="look-tags">
        ${tags.length > 0
          ? tags.map(([prefix, label]) => `<span class="look-tag"><small>${prefix}</small>${label}</span>`).join('')
          : '<p class="look-tags-empty">没有填写舌面 / 发甲观察项，只保存了照片。</p>'}
      </div>
    </div>
    <p class="look-result-note">这些照片和观察仅供你自己对照，不会上传服务器，也不会自动生成诊断。中医望诊还需要医生结合脉诊、问诊和整体情况判断。</p>
  `;
}

function renderPlan(top, urgency) {
  let plans = [];

  if (urgency.level === 'emergency') {
    plans = [
      {
        time: '现在',
        title: '立即急诊或拨打 120',
        text: '不要自行驾车、进食进水或服药；带上身份证、医保卡和正在服用的药物清单。',
        cls: 'is-urgent'
      },
      {
        time: '今天',
        title: '让医生决定检查顺序',
        text: `${top.name}相关线索需要医生结合查体、血液检查、腹部超声或胃镜来判断，不要自行猜测。`,
        cls: 'is-urgent'
      },
      {
        time: '之后',
        title: '等诊断明确再用药',
        text: '不要自行购买胃药、止痛药或中成药，以免掩盖病情或增加出血风险。',
        cls: ''
      }
    ];
  } else if (urgency.level === 'urgent') {
    plans = [
      {
        time: '今天 / 24 小时内',
        title: '前往急诊或消化内科',
        text: '不要继续在家观察；如果疼痛加重、呕血 / 黑便、晕厥，立即拨打 120。',
        cls: 'is-urgent'
      },
      {
        time: '就诊时',
        title: '带上症状时间线',
        text: '告诉医生：什么时候开始、哪里痛、与进食的关系、大便颜色、正在服用的药物。',
        cls: ''
      },
      {
        time: '之后',
        title: '按医嘱检查',
        text: `可能需要胃镜、幽门螺杆菌检测、腹部超声或血液检查；建议科室：${top.department}。`,
        cls: ''
      }
    ];
  } else if (urgency.level === 'soon') {
    plans = [
      {
        time: '1–2 周内',
        title: '预约消化内科',
        text: `建议科室：${top.department}。把症状日记和用药清单带给医生。`,
        cls: 'is-caution'
      },
      {
        time: '这几天',
        title: '先做症状记录',
        text: '记录疼痛 / 胀满时间、与进食关系、大便性状、情绪压力；不要自行长期吃止痛药。',
        cls: ''
      },
      {
        time: '日常',
        title: '日常调整',
        text: `${top.care[0]} ${top.care[1] || '规律饮食，避免酒精、浓咖啡和夜宵。'}`,
        cls: ''
      }
    ];
  } else {
    plans = [
      {
        time: '今天',
        title: '先观察 3–5 天',
        text: top.care[0],
        cls: ''
      },
      {
        time: '这 3 天',
        title: '记录症状日记',
        text: '记录疼痛 / 胀满时间、与进食关系、大便性状和情绪压力；这份记录对就诊很有帮助。',
        cls: ''
      },
      {
        time: '如果没改善',
        title: '预约消化内科',
        text: `若 3–5 天无改善、反复发作或出现新的警示信号，建议就诊：${top.department}。`,
        cls: 'is-caution'
      }
    ];
  }

  dom.planGrid.innerHTML = plans.map((plan) => `
    <article class="plan-card ${plan.cls}">
      <span class="plan-time">${plan.time}</span>
      <h3>${plan.title}</h3>
      <p>${plan.text}</p>
    </article>
  `).join('');
}

function renderSafety(top) {
  const base = [
    '突然剧烈腹痛，或腹痛持续不缓解、越来越重',
    '呕血或咖啡渣样呕吐物，黑便 / 柏油样便',
    '胸痛、胸闷、大汗、气短，或疼痛放射到左肩 / 下颌',
    '腹部板硬、拒按，或外伤后腹痛',
    '持续呕吐无法进水，尿量明显减少',
    '高热寒战伴腹痛，或皮肤 / 眼白发黄',
    '晕厥、意识模糊、面色苍白、冷汗',
    '怀孕 / 可能怀孕伴腹痛或阴道出血'
  ];

  const extra = [];

  if (top.id === 'reflux') extra.push('吞咽困难、进行性体重下降或贫血');
  if (top.id === 'ulcer') extra.push('突发刀割样腹痛，或呕吐咖啡色液体');
  if (top.id === 'gallstone') extra.push('发热寒战伴右上腹痛或黄疸');
  if (top.id === 'pancreatitis') extra.push('持续剧痛伴呼吸急促、发热或意识改变');
  if (top.id === 'gastroenteritis') extra.push('血便、持续高热或明显脱水');
  if (top.id === 'cardiac') extra.push('任何新发或加重的胸闷、气短');

  const all = Array.from(new Set([...base, ...extra]));
  dom.safetyList.innerHTML = all.map((item) => `<li>${item}</li>`).join('');
}

/* ---------- 15. 分析流程 ---------- */

function beginAnalysis() {
  if (analysisTimer) {
    window.clearTimeout(analysisTimer);
    analysisTimer = null;
  }

  const items = $$('.analyzing-item');
  items.forEach((item) => item.classList.remove('is-done'));

  showScreen('analyzing');

  items.forEach((item, index) => {
    window.setTimeout(() => item.classList.add('is-done'), 160 + index * 170);
  });

  analysisTimer = window.setTimeout(() => {
    analysisTimer = null;
    try {
      const result = buildAnalysis(state.answers);
      renderResult(result);
    } catch (error) {
      console.error(error);
      showToast('分析时出了点问题，请返回重试。', true);
      showScreen('quiz');
    }
  }, 1850);
}

/* ---------- 16. 重置 ---------- */

function hasProgress() {
  const answered = Object.entries(state.answers).some(([key, value]) => {
    if (key === 'severity') return value !== 5;
    return Array.isArray(value) ? value.length > 0 : value !== null;
  });

  const triageChecked = dom.triageFlags
    ? dom.triageFlags.querySelectorAll('input:checked').length > 0
    : false;

  const hasPhotos = Boolean(state.media.tongue || state.media.face);

  return answered || state.currentStep > 0 || triageChecked || hasPhotos;
}

function resetAll() {
  if (analysisTimer) {
    window.clearTimeout(analysisTimer);
    analysisTimer = null;
  }

  stopCamera();
  state.answers = clone(DEFAULT_ANSWERS);
  state.currentStep = 0;
  state.media = { tongue: null, face: null, hand: null };

  renderTriage();
  renderQuiz();
  updateTriageUI();

  const alarmCard = document.getElementById('alarm-card');
  if (alarmCard) {
    alarmCard.className = '';
    alarmCard.innerHTML = '';
  }

  const lookCard = document.getElementById('look-result');
  if (lookCard) {
    lookCard.className = '';
    lookCard.innerHTML = '';
  }

  dom.urgencyBanner.className = 'urgency-banner';
  dom.urgencyBanner.innerHTML = '';

  showScreen('intro');
}

function restart() {
  if (hasProgress() && !window.confirm('重新开始会清除当前填写的内容，确定吗？')) {
    return;
  }
  resetAll();
  showToast('已重新开始');
}

/* ---------- 17. 事件绑定 ---------- */

function bindEvents() {
  $('#start-btn').addEventListener('click', () => showScreen('triage'));

  dom.triageFlags.addEventListener('change', updateTriageUI);

  dom.triageUrgent.addEventListener('click', () => {
    if (dom.triageUrgent.disabled) return;
    showEmergency();
  });

  dom.triageNone.addEventListener('click', () => {
    const checked = dom.triageFlags.querySelectorAll('input:checked').length;
    if (checked > 0) {
      showToast('你已勾选危险信号。请先取消勾选，或点击“查看紧急处理”。', true);
      return;
    }
    startQuiz();
  });

  $('#emergency-to-quiz').addEventListener('click', () => {
    dom.triageFlags.querySelectorAll('input[type="checkbox"]').forEach((box) => {
      box.checked = false;
    });
    updateTriageUI();
    startQuiz();
  });

  dom.quizForm.addEventListener('change', handleQuizChange);
  dom.quizForm.addEventListener('change', handleCameraFile);
  dom.quizForm.addEventListener('input', handleQuizInput);
  dom.quizForm.addEventListener('click', handleQuizClick);
  dom.quizForm.addEventListener('keydown', handleQuizKeydown);

  dom.quizPrev.addEventListener('click', () => {
    if (state.currentStep === 0) {
      showScreen('triage');
      return;
    }
    showQuizStep(state.currentStep - 1, { scroll: true });
  });

  dom.quizNext.addEventListener('click', () => {
    if (!validateStep(state.currentStep)) return;

    if (state.currentStep === QUIZ_STEPS.length - 1) {
      if (!validateAll()) return;
      beginAnalysis();
      return;
    }

    showQuizStep(state.currentStep + 1, { scroll: true });
  });

  $('#print-result').addEventListener('click', () => window.print());
  $('#print-result-bottom').addEventListener('click', () => window.print());

  document.querySelectorAll('[data-restart]').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      restart();
    });
  });

  document.addEventListener('click', (event) => {
    const go = event.target.closest('[data-go]');
    if (!go) return;

    event.preventDefault();
    const destination = go.getAttribute('data-go');

    if (destination === 'emergency') showEmergency();
    if (destination === 'triage') showScreen('triage');
    if (destination === 'intro') showScreen('intro');
  });

  window.addEventListener('scroll', () => {
    dom.header.classList.toggle('is-scrolled', window.scrollY > 8);
  }, { passive: true });
}

/* ---------- 18. 初始化 ---------- */

function init() {
  renderTriage();
  renderQuiz();
  bindEvents();

  window.addEventListener('beforeunload', () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
  });

  dom.header.classList.toggle('is-scrolled', window.scrollY > 8);
}

init();
