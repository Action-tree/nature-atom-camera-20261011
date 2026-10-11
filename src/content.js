export const SOURCES = [
 {id:'motion',label:'摆臂速度换算',note:'每次交替摆臂假设对应一步，步长固定为0.8米。估算速度(km/h)=摆臂次数/分钟 × 0.8 × 60 ÷ 1000。原地摆臂也会产生数字，不是实测跑速或距离；100米时间按当前估算匀速外推。进度为游戏完成度。'},
 {id:'tracking',label:'迁徙研究 · Egevang 等，PNAS 2010',url:'https://www.pnas.org/doi/10.1073/pnas.0909493107',note:'11 只格陵兰／冰岛繁殖鸟的追踪；路线和距离不代表所有北极燕鸥。'},
 {id:'author',label:'研究作者的追踪解读',url:'https://www.carstenegevang.com/single-post/the-arctic-tern-extreme-migration-from-pole-to-pole',note:'样本年均往返 70,900 km；北大西洋平均停留约 25 天；北返 S 形路线与盛行风相应。'},
 {id:'cornell',label:'康奈尔鸟类实验室 · 北极燕鸥',url:'https://www.allaboutbirds.org/guide/Arctic_Tern/lifehistory',note:'食物包括小鱼和其他水生动物；不能用本游戏识别现场鸟种。'},
 {id:'greenland',label:'UNESCO · 格陵兰 Kujataa',url:'https://whc.unesco.org/en/list/1536/',note:'格陵兰南部诺斯人与因纽特农业文化景观；地理延伸，不是追踪样本的着陆点。'},
 {id:'clock',label:'英国皇家格林尼治博物馆 · 航海钟',url:'https://www.rmg.co.uk/royal-observatory/attractions/john-harrisons-marine-timekeepers',note:'海上准确计时帮助航海者确定经度；这是人类航海史，不能当作鸟类导航的解释。'},
 {id:'ocean',label:'NASA Earthdata · 本格拉上升流',url:'https://www.earthdata.nasa.gov/data/instruments/czcs/classic-scenes/benguela-upwelling-zone',note:'风驱动沿岸上升流，深层海水带来营养物质，支持海洋食物网。'},
 {id:'cape',label:'Cape Point · 灯塔历史',url:'https://capepoint.co.za/about/',note:'灯塔帮助海上航行；海雾影响旧灯塔的可见度。地区故事，不宣称燕鸥在灯塔停留。'},
 {id:'endurance',label:'剑桥极地博物馆 · 坚忍号远征',url:'https://www.spri.cam.ac.uk/museum/shackleton/expeditions/endurance/',note:'坚忍号 1915 年在威德尔海被浮冰困住并沉没，28 名队员最终生还。'},
 {id:'bolt',label:'世界田联 · 博尔特 9.58 秒',url:'https://worldathletics.org/news/news/bolt-again-958-world-record-in-berlin-updat',note:'2009 年柏林男子 100 米 9.58 秒；平均速度，不是瞬时峰值。'},
 {id:'shanghai',label:'Shanghai Birding · 上海城市观鸟',url:'https://www.shanghaibirding.com/sites/urban-shanghai/',note:'区域鸟类参考；具体公园、季节与当天是否出现仍需实地观察。'},
 {id:'book',label:'《何以为鸟》· 用户提供的局部书页',url:null,note:'David Allen Sibley 著。已读封面、迁徙图与竞速页照片；未获得全文及页码，不能声称已遍历全书。书页给出走鹃约 32、郊狼约 64、鸵鸟最高约 97 km/h。'}
];

export const STOPS = [
 {id:'north',num:'01',title:'从一个漫长的白天出发',place:'格陵兰 · 北方繁殖地',short:'北方出发',coord:[-30,71],season:'北半球夏末',dimension:'bird',stamp:'鸟的发现',icon:'feather',fact:'北极燕鸥在北极及亚北极地区繁殖，再飞向南半球。它在一年里遇见两个夏天，却不是一直不休息地飞。',detail:'2010 年研究追踪了 11 只在格陵兰和冰岛繁殖的燕鸥，记录到平均约 70,900 公里的年度往返。每只鸟的路线和距离都不完全一样。',humanTitle:'冰缘上的人，也在读季节',human:'格陵兰南部的 Kujataa 留下了诺斯人与因纽特人适应冰缘环境、耕作和放牧的历史。这里是地区文化延伸，不是这只游戏燕鸥的停靠记录。',sources:['tracking','author','greenland'],prompt:'如果你是一只要远行的鸟，你最想先了解什么？',choices:['沿途吃什么','哪里可以歇脚','风从哪边来'],hint:'也可以告诉我，你对这只鸟最好奇的一件事。',motif:'羽翼',echo:'远行不只有翅膀，还要找到食物和歇脚处。我们把你的问题带到海上。'},
 {id:'atlantic',num:'02',title:'大海中间，也有补给站',place:'北大西洋 · 海上停歇区',short:'海上补给',coord:[-34,47],season:'南迁途中',dimension:'nature',stamp:'自然的联系',icon:'wind',fact:'研究中的燕鸥会在北大西洋的一片海域停留，平均约 25 天。这里的海洋环境能支持丰富的食物，不必一路拼命向南。',detail:'追踪样本在北大西洋中脊西侧海域停歇。部分鸟随后沿非洲西岸南下，部分沿南美东岸。本局以非洲一侧作教学串联。',humanTitle:'人类曾把“时间”装上船',human:'在没有卫星导航时，海上定位是难题。约翰·哈里森研制的航海钟能在船上准确计时，帮助航海者确定经度。鸟怎样导航则是另一个科学问题。',sources:['author','clock'],prompt:'旅途很长，你会给这片海上补给站起什么名字？',choices:['鱼群食堂','风的休息站','蓝色补给站'],hint:'说说为什么取这个名字，它会留下在你的路牌上。',motif:'海浪',echo:'你给大海留下了一个名字。补给与休息也是远行的一部分。'},
 {id:'benguela',num:'03',title:'一阵风，养活一片海',place:'非洲西南岸 · 本格拉海域',short:'风与食物',coord:[11,-25],season:'向南方的夏天飞',dimension:'human',stamp:'人与自然',icon:'waves',fact:'风能让沿岸表层海水移开，深处富含营养物质的海水补上来。微小生物、鱼和海鸟，由食物网联系起来。',detail:'这是本格拉上升流的简化解释。海鸟和人类渔业都与这片海的生产力有关，不能把“水冷”直接等同于“任何时候鱼都很多”。',humanTitle:'为什么灯塔不是越高越好？',human:'附近开普角的旧灯塔曾因位置高而受云雾遮挡。人类调整灯塔的位置来应对环境。这个地区故事提醒我们：看起来更高，不一定看得更清楚。',sources:['ocean','cape'],prompt:'如果鸟和人都需要海里的鱼，你想留下一条什么约定？',choices:['给鸟留一点食物','让海面少一点垃圾','先观察，再靠近'],hint:'没有标准答案。说一条你愿意做到的小事。',motif:'灯塔',echo:'你的约定让路牌不只指向远方，也提醒我们怎样与别的生命相处。'},
 {id:'south',num:'04',title:'抵达另一边的夏天',place:'南极 · 威德尔海一带',short:'南方夏日',coord:[-35,-65],season:'南半球夏季',dimension:'feeling',stamp:'我的感想',icon:'sun',fact:'北方进入冬季时，南方迎来夏季。追踪研究中的燕鸥在南大洋威德尔海一带度过北方的冬天，享受南方较长的白昼。',detail:'它们是寻找适合生存的海洋环境，不是飞到南极点打卡。本图展示大致海域，不是某只鸟的实时位置。',humanTitle:'一艘船停下，一群人继续',human:'1915 年，沙克尔顿远征队的坚忍号在威德尔海被浮冰困住，后来沉没。探险变成求生，28 名队员最终生还。燕鸥与这段史实没有已知的直接相遇。',sources:['author','endurance'],prompt:'想到这么远的旅程，你会用什么词形容它？为什么？',choices:['想家，也想看看世界','原来休息也很勇敢','像追着阳光写一封信'],hint:'可以惊奇、担心、没感觉，也可以有完全不同的想法。',motif:'日光',echo:'这份感受属于你。我们不替它打分，把它原样留在路牌上。'},
 {id:'return',num:'05',title:'把远方，带回你身边',place:'沿大西洋北返 · 回到日常',short:'带着问题回来',coord:[-30,71],season:'北半球春季',dimension:'question',stamp:'下一次出发',icon:'compass',fact:'北返的追踪路线在大西洋上形成巨大的 S 形，与盛行风系统相应。对飞鸟来说，最短的直线未必是最合适的路。',detail:'路线是研究启发的示意，不是 GPS 轨迹。上海并不在本局路线里；接下来的本地观察是你的延伸任务，不是寻找北极燕鸥。',humanTitle:'从科学家的记录，到你的观察',human:'研究人员曾让小型光照记录器随鸟远行，回收后估计位置。你也可以只记下时间、环境和动作，留下能够再次比较的发现。',sources:['author','tracking'],prompt:'下一次走到户外，你想带着哪一个问题？',choices:['附近的鸟在哪里歇脚','鸟和周围的树有什么关系','安静站着，会听到什么'],hint:'选一个真正愿意去看看、去听听的问题。',motif:'方向',echo:'这不是旅程的句号。你的下一块刻印，要从窗外的真实世界开始。'}
];

export const DIMENSIONS = [
 {id:'bird',label:'鸟的发现',symbol:'羽'}, {id:'nature',label:'自然的联系',symbol:'海'},
 {id:'human',label:'人与自然',symbol:'约'}, {id:'feeling',label:'我的感想',symbol:'心'}
];

export const HABITATS = {
 park:{label:'城市公园',task:'和同行大人站在步道上，先不说话，听一会儿。找一只鸟，记录它停、跳、飞或取食的动作。没有遇见也可以记录。',clue:'留意树冠、灌木和草地之间的活动。上海可参考麻雀、白头鹎、乌鸫；这里只是候选，不代表现场一定出现。'},
 water:{label:'水边 / 湿地',task:'和同行大人留在安全步道，远离水边。远看鸟在水上、岸边还是空中；说说它与水的关系，不追赶也不投喂。',clue:'先分清游水、涉水、飞行等行为，不凭远处轮廓确定物种。'},
 balcony:{label:'阳台 / 窗边',task:'在安全的窗内或阳台内侧，听一会儿。声音从哪个方向来？看不到鸟时，只记录你听到的，不猜成已经认出的鸟。',clue:'不翻越、不探身、不用鸟叫吸引野鸟。城市里的鸟也与树、屋檐和人类活动有关。'}
};
