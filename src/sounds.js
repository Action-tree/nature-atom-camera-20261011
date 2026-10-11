export const SOUND_BIRDS=[
 {id:'blackbird',name:'欧乌鸫',latin:'Turdus merula',clip:'/birds/blackbird.mp3',shape:'长尾、较细的喙',letter:'A',clue:'试着听较长的乐句，像断断续续的小笛声。再看看细喙和长尾的轮廓。',fact:'这段录音的目标鸟是欧乌鸫，来自芬兰南部森林，与上海常见的乌鸫不能直接混同。插画表现成年雄鸟的黑色羽毛与黄橙色喙；不是对你所在地鸟种的判断。',source:'https://commons.wikimedia.org/wiki/File:Turdus_merula_2.ogg',credit:'Oona Räisänen (Mysid) · Public domain · 原录音前 12 秒，转为 MP3'},
 {id:'sparrow',name:'家麻雀',latin:'Passer domesticus',clip:'/birds/sparrow.mp3',shape:'短粗的喙、圆圆的身体',letter:'B',clue:'试着听短促的啾叫，再看短而粗的喙。它与前一类长乐句有什么不同？',fact:'这段录音的目标鸟是筑巢的家麻雀，来自芬兰南部郊区。家麻雀与上海常见的树麻雀不是同一个物种。插画为简化的成年雄鸟参考。',source:'https://commons.wikimedia.org/wiki/File:Passer_domesticus.ogg',credit:'Oona Räisänen (Mysid) · Public domain · 原录音（约 11 秒），转为 MP3'}
];
export function soundMatch(target,answers,players){return answers.length===players&&answers.some(a=>a.choice===target);}
