export const OPPONENTS=[
 {id:'hen',name:'老母鸡',mark:'鸡',gift:'会奔走，也有自己的觅食节奏。',observe:'隔着距离看它自然走动，不追赶、不惊吓。不方便量距离，就只描述步态。'},
 {id:'worm',name:'蚯蚓',mark:'蚓',gift:'没有腿，也能靠身体伸缩在环境中移动。',observe:'只观察地面自然出现的蚯蚓，不挖、不拉伸、不把它放在干燥赛道上。'},
 {id:'ant',name:'蚂蚁',mark:'蚁',gift:'小身体，也值得换一个尺度看。',observe:'观察它自然经过的一小段，不挡路、不加重物、不触碰；不知道种类时就记录“蚂蚁”。'}
];
export function compareMovement({distance,seconds,animalCm,animalSeconds,heightCm,bodyCm}){
 const values=[distance,seconds,animalCm,animalSeconds].map(Number);if(values.some(v=>!Number.isFinite(v)||v<=0))return null;
 const human=values[0]/values[1],animal=values[2]/100/values[3];const h=Number(heightCm),b=Number(bodyCm);return {human,animal,humanLengths:Number.isFinite(h)&&h>0?human/(h/100):null,animalLengths:Number.isFinite(b)&&b>0?animal/(b/100):null};
}
export const CHALLENGE_FACTS={
 ant:{title:'不是所有“多少倍”都在说同一件事',body:'一项关于切叶蚁 Atta cephalotes 的研究估计，其最大负载能力约为自身质量的 8.78 倍。这不能直接套到你在门口遇到的未知蚂蚁，也不是所有蚂蚁的固定本领。',url:'https://par.nsf.gov/biblio/10231559'},
 neck:{title:'承受拉力，不等于搬起重物',body:'“蚂蚁 5,000 倍体重”的研究涉及颈部结构受力测试，不能直接讲成日常搬运能力。本游戏不把它作为举重纪录。',url:'https://news.osu.edu/with-their-amazing-necks-ants-dont-need-high-hopes-to-do-heavy-lifting/'},
 timer:{title:'板子可以计时，距离需要另一个依据',body:'今天建议在大人确认的跑道标线或卷尺标定的短距离上，用按钮开始、停止计时。计时分辨率不等于人的按键反应精度。',url:'https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/system/esp_timer.html'}
};
