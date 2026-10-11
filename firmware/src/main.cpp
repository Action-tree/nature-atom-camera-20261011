#include "Runtime.h"
#include <Wire.h>
#include <esp_system.h>
Preferences prefs;SemaphoreHandle_t stateLock;JsonDocument taskDoc,outbox;QueueHandle_t actions;
String bootId,runId,serverUrl,deviceCode,wifiSsid,wifiPassword;
static const char* clueIds[]={"sound","flight","landing","food","none","change"};
static const char* clueLabels[]={"听见了声音","看见飞行动作","看见落脚","看见取食","暂没遇见鸟","其他发现"};
static const char* nextTitles[]={"同一位置，再听一次","看翅膀，寻找落脚点","落脚前，翅膀怎样变化","食物旁边，还有谁","换一种感官试试看","刚才与现在有什么不同"};
static const char* nextBodies[]={"留在安全位置，听声音的方向和节奏。再抬头看看，没有看见也可以。不播放鸟声引鸟。","留在原处用目光跟随，比较拍翅与滑行。离开视线就停下，不追赶。","远离电力设施，在原处观察。落脚前翅膀展开还是收拢？尾巴变了吗？没有重现，就记下印象。","保持距离，不投喂。看看取食地点附近的树、草或水。说一个确实看见的联系。","在同一个安全位置看看叶子、影子或天空。没有遇见鸟也是真实记录，可以下次再来。","轮流说一句：刚才……现在……。一样也可以，不需要为了过关制造发现。"};
enum View{READER,MENU,CLUES,MOVEMENT,REVIEW};static View view=READER;static int selected=0,page=0,part=0,reviewPart=0;static String localTitle,localBody,pendingId,reviewId,reviewQuote;static MotionEngine::Phase lastPhase=MotionEngine::IDLE;
static String piece(const String& text,int index){int at=0,count=0,start=-1,end=text.length();while(at<(int)text.length()){if(count==index*80)start=at;if(count==(index+1)*80){end=at;break;}uint8_t c=text[at];at+=(c<128?1:(c&0xe0)==0xc0?2:(c&0xf0)==0xe0?3:4);count++;}return start<0?String():text.substring(start,end);}
static void showMenu(){screen("我现在想……",selected==0?"> 户外走起！\n  一起跑一场\n  确认我的原话":selected==1?"  户外走起！\n> 一起跑一场\n  确认我的原话":"  户外走起！\n  一起跑一场\n> 确认我的原话","上下选择  中键打开");}
void showReader(){view=READER;String title,body;xSemaphoreTake(stateLock,portMAX_DELAY);if(!localBody.isEmpty()){title=localTitle;body=localBody;}else if(taskDoc["pages"].size()){title=taskDoc["pages"][page]["title"].as<String>();body=taskDoc["pages"][page]["body"].as<String>();}else{title="把屏幕放下，听一会儿";body="和同行人在安全位置站定。先用耳朵找一个方向，再抬头看看。没有遇见鸟也可以。BOOT录下你的发现；中键选择线索。";}xSemaphoreGive(stateLock);String segment=piece(body,part);if(segment.isEmpty()){part=0;segment=piece(body,0);}screen(title,segment,"上下翻页 中键线索 长按中键菜单");}
static void showClue(){screen("这次留下哪一种线索？",String(selected+1)+" / 6\n"+clueLabels[selected],"上下选择  中键确认  不必猜鸟名");}
static void review(){
 xSemaphoreTake(stateLock,portMAX_DELAY);reviewId="";for(JsonObject item:outbox.as<JsonArray>())if(item["status"]=="review"){reviewId=item["eventId"].as<String>();reviewQuote=item["quote"].as<String>();break;}xSemaphoreGive(stateLock);
 if(reviewId.isEmpty()){screen("原话还在路上","离线录音已留在板子。联网后转写；没有转写服务时，请同行大人在网页听录音、补文字。","中键返回  不把待转写声音当成文字");view=REVIEW;return;}
 view=REVIEW;String text=piece(reviewQuote,reviewPart);if(text.isEmpty()){reviewPart=0;text=piece(reviewQuote,0);}bool last=piece(reviewQuote,reviewPart+1).isEmpty();screen("这是我想留下的话吗？",text,last?"中键确认  BOOT退回修改  上翻回看":"下翻读完原话后再确认");
}
static void confirmReview(){
 if(reviewId.isEmpty()){showReader();return;}if(!piece(reviewQuote,reviewPart+1).isEmpty()){reviewPart++;review();return;}
 bool ok=false;xSemaphoreTake(stateLock,portMAX_DELAY);
 for(JsonObject item:outbox.as<JsonArray>())if(item["eventId"]==reviewId){
  JsonDocument old;old=outbox;item["status"]="confirmed";
  JsonDocument journal;loadJson("/journal.json",journal);if(!journal.is<JsonArray>())journal.to<JsonArray>();
  bool exists=false;for(JsonObject row:journal.as<JsonArray>())if(row["eventId"]==reviewId)exists=true;
  if(!exists){if(journal.size()>=100)journal.remove(0);journal.as<JsonArray>().add(item);}
  ok=saveJson("/journal.json",journal)&&saveJson("/outbox.json",outbox);if(!ok)outbox=old;break;
 }
 xSemaphoreGive(stateLock);if(ok){screen("原话已确认","这句话已经保存。联网后同步到我的路牌；下一问从你选择的观察线索继续。","中键返回户外手账");reviewId="";}else screen("暂未保存成功","存储空间可能不足。请保留设备资料，由同行大人检查。","中键返回");
}
static void record(){
 if(readMotion().phase==MotionEngine::RUNNING){screen("先停下来，再说发现","请先停止摆臂游戏，站稳后再录音。","长按中键打开菜单");return;}
 xSemaphoreTake(stateLock,portMAX_DELAY);bool full=outbox.size()>=8;bool hasTask=taskDoc["id"].is<String>();xSemaphoreGive(stateLock);
 if(!storageReady||!audioReady||full||!hasTask){screen("暂时还不能录音",!storageReady?"存储尚未初始化。请同行大人在串口检查。":!audioReady?"麦克风初始化失败。请由 Qoder 检查音频驱动。":full?"已有8段声音待同步，请先处理这些发现。":"先联网装入任务，再带着板子离线出发。","中键返回");return;}
 pendingId=bootId+"-"+String(millis());String path="/voice-"+pendingId+".wav";
 screen("声音采集即将开始","请稍等2秒，屏幕稳定后说话。接下来收录8秒；只在按键后录音。","8秒后自动结束");delay(2000);
 if(!captureWav(path.c_str(),8)){screen("这段声音没有存好","请检查存储空间或麦克风，原有记录仍保留。","中键返回");pendingId="";return;}
 xSemaphoreTake(stateLock,portMAX_DELAY);JsonObject item=outbox.add<JsonObject>();item["eventId"]=pendingId;item["taskId"]=taskDoc["id"];item["status"]="recorded";item["path"]=path;item["clue"]="change";bool ok=saveJson("/outbox.json",outbox);if(!ok)outbox.remove(outbox.size()-1);xSemaphoreGive(stateLock);
 if(!ok){screen("声音已录下，索引未保存","请保留文件，由同行大人检查存储；暂不继续录音。","中键返回");return;}view=CLUES;selected=0;showClue();
}
static void chooseClue(){
 localTitle=nextTitles[selected];localBody=nextBodies[selected];
 xSemaphoreTake(stateLock,portMAX_DELAY);for(JsonObject entry:taskDoc["localLoop"].as<JsonArray>())if(entry["id"]==clueIds[selected]){localTitle=entry["title"].as<String>();localBody=entry["body"].as<String>();break;}
 for(JsonObject item:outbox.as<JsonArray>())if(item["eventId"]==pendingId){item["clue"]=clueIds[selected];saveJson("/outbox.json",outbox);}
 JsonDocument local;local["title"]=localTitle;local["body"]=localBody;saveJson("/local.json",local);xSemaphoreGive(stateLock);part=0;pendingId="";showReader();
}
static void motionAction(const String& action,const String& id=""){
 xSemaphoreTake(motionLock,portMAX_DELAY);if(action=="calibrate")motion.calibrate();if(action=="start"){if(motion.start())runId=id.isEmpty()?bootId+"-"+String(millis()):id;}if(action=="stop")motion.stop();xSemaphoreGive(motionLock);view=MOVEMENT;
}
static void click(int pin,bool longPress){
 if(pin==PIN_OK&&longPress){xSemaphoreTake(motionLock,portMAX_DELAY);motion.stop();xSemaphoreGive(motionLock);view=MENU;selected=0;showMenu();return;}
 if(pin==PIN_BOOT){if(view==REVIEW&&!reviewId.isEmpty()){
   // Reject candidate on device; adult can edit transcript on web, then it returns.
   xSemaphoreTake(stateLock,portMAX_DELAY);for(JsonObject item:outbox.as<JsonArray>())if(item["eventId"]==reviewId){item["status"]="needs_edit";saveJson("/outbox.json",outbox);}xSemaphoreGive(stateLock);screen("请同行大人改一改","打开网页的阅读器工具，听录音并改文字。改好后再回到板子确认。","中键返回");reviewId="";return;}
   record();return;
 }
 int direction=pin==PIN_UP?-1:1;
 if(view==MENU){if(pin==PIN_OK){if(selected==0){localBody="";part=page=0;showReader();}else if(selected==1){motionAction("calibrate");}else{reviewPart=0;review();}}else{selected=(selected+direction+3)%3;showMenu();}return;}
 if(view==CLUES){if(pin==PIN_OK)chooseClue();else{selected=(selected+direction+6)%6;showClue();}return;}
 if(view==REVIEW){if(pin==PIN_OK)confirmReview();else{reviewPart=std::max(0,reviewPart+direction);review();}return;}
 if(view==MOVEMENT){if(pin==PIN_OK){auto m=readMotion();motionAction(m.phase==MotionEngine::RUNNING?"stop":m.phase==MotionEngine::READY||m.phase==MotionEngine::FINISHED?"start":"calibrate");}return;}
 if(pin==PIN_OK){view=CLUES;selected=0;showClue();return;}
 if(direction<0){if(part>0)part--;else if(page>0)page--;}else{
   String body;xSemaphoreTake(stateLock,portMAX_DELAY);body=localBody.isEmpty()?taskDoc["pages"][page]["body"].as<String>():localBody;xSemaphoreGive(stateLock);
   if(!piece(body,part+1).isEmpty())part++;else if(localBody.isEmpty()){page=(page+1)%3;part=0;}else part=0;
 }showReader();
}
static void buttons(){
 struct Button{int pin;bool raw=false,down=false,held=false;uint32_t changed=0,started=0;};static Button bs[]={{PIN_UP},{PIN_OK},{PIN_DOWN},{PIN_BOOT}};
 for(auto& b:bs){bool down=digitalRead(b.pin)==LOW;if(down!=b.raw){b.raw=down;b.changed=millis();}if(millis()-b.changed<35)continue;if(b.down!=down){b.down=down;if(down){b.started=millis();b.held=false;}else if(!b.held)click(b.pin,false);}if(b.down&&!b.held&&b.pin==PIN_OK&&millis()-b.started>900){b.held=true;click(b.pin,true);}}
}
static void serialConfig(){
 static String line;while(Serial.available()){char c=Serial.read();if(c=='\n'){
  if(line=="FORMAT_FIRST_USE"){if(storageReady){Serial.println("Storage already mounted; format refused to preserve data");}else{Serial.println(LittleFS.format()?"Formatted; reboot now":"Format failed");}line="";return;}
  JsonDocument d;if(!deserializeJson(d,line)&&d["ssid"].is<String>()&&d["server"].is<String>()&&d["code"].is<String>()&&d["code"].as<String>().length()==32){
   String url=d["server"].as<String>();while(url.endsWith("/"))url.remove(url.length()-1);if(url.startsWith("https://")||url.startsWith("http://")){prefs.putString("ssid",d["ssid"].as<String>());prefs.putString("password",d["password"]|"");prefs.putString("server",url);prefs.putString("code",d["code"].as<String>());Serial.println("Configuration saved; restarting. Credentials not echoed.");delay(200);ESP.restart();}
  }else if(line=="EXPORT_TASK"){xSemaphoreTake(stateLock,portMAX_DELAY);serializeJson(taskDoc,Serial);Serial.println();xSemaphoreGive(stateLock);}else if(line=="EXPORT_JOURNAL"){xSemaphoreTake(stateLock,portMAX_DELAY);JsonDocument journal;loadJson("/journal.json",journal);serializeJson(journal,Serial);Serial.println();xSemaphoreGive(stateLock);}else Serial.println("Use JSON {ssid,password,server,code}; or EXPORT_JOURNAL");line="";
 }else if(c!='\r'){if(line.length()<1024)line+=c;else line="";}}
}
void setup(){
 Serial.begin(115200);delay(500);bootId=String(esp_random(),HEX)+String(esp_random(),HEX);runId="";prefs.begin("nature-atom",false);wifiSsid=prefs.getString("ssid");wifiPassword=prefs.getString("password");serverUrl=prefs.getString("server");deviceCode=prefs.getString("code");stateLock=xSemaphoreCreateMutex();actions=xQueueCreate(8,sizeof(Action));storageReady=LittleFS.begin(false);
 if(storageReady){loadJson("/task.json",taskDoc);loadJson("/outbox.json",outbox);JsonDocument local;if(loadJson("/local.json",local)){localTitle=local["title"].as<String>();localBody=local["body"].as<String>();}}if(!outbox.is<JsonArray>())outbox.to<JsonArray>();
 for(int pin:{PIN_UP,PIN_OK,PIN_DOWN,PIN_BOOT})pinMode(pin,INPUT_PULLUP);
 Wire.begin(41,42);Wire.setClock(400000);Wire.setTimeOut(50);initSensors();audioReady=initAudio();initDisplay();
 xTaskCreatePinnedToCore(sensorTask,"imu",4096,nullptr,3,nullptr,1);xTaskCreatePinnedToCore(networkTask,"network",14336,nullptr,1,nullptr,0);showReader();
 Serial.printf("READY imu=%d audio=%d storage=%d; no physical validation implied\n",imuReady,audioReady,storageReady);
}
void loop(){
 buttons();serialConfig();Action a;if(xQueueReceive(actions,&a,0)==pdTRUE){String action=a.action;if(action=="read"){xSemaphoreTake(motionLock,portMAX_DELAY);motion.stop();xSemaphoreGive(motionLock);localBody="";part=page=0;showReader();}else if(action=="review"){if(view!=MOVEMENT&&view!=CLUES){reviewPart=0;review();}}else motionAction(action,a.run);}
 auto m=readMotion();if(m.phase!=lastPhase){lastPhase=m.phase;if(view==MOVEMENT){switch(m.phase){case MotionEngine::CALIBRATING:screen("放稳两秒，准备出发","把板子放平，保持静止。移动时会重新计时。","校准好后中键开始");break;case MotionEngine::READY:screen("准备好，轻轻摆臂","站在空旷处，握稳板子。每一次摆动让虚拟小径向前。","中键开始 长按中键菜单");break;case MotionEngine::RUNNING:screen("身体动，小径向前","握稳板子，轻轻摆臂。手机同步估算速度和书中动物对比。结束后在这里看结果。","中键停止 不是实际测速");break;case MotionEngine::FINISHED:screen("这一程，走到了！",String("摆臂 ")+m.strokes+" 次\n峰值估算 "+String(m.peakKmh,1)+" km/h\n假设步长0.8米，非实测跑速。","中键再来 长按中键回到户外");break;case MotionEngine::ERROR:screen("动作暂时没有读到","传感器连接异常，请检查 QMI8658。手机可以先用点按演示。","中键重新校准");break;default:break;}}}delay(10);
}
