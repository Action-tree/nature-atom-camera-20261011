#include "Runtime.h"
#include <WiFi.h>
#include <NetworkClientSecure.h>
#include <HTTPClient.h>
#include "TrustRoots.h"
#include <time.h>
static uint32_t cursor=0,telemetrySeq=0;
static int request(const String& path,const char* method,const String& body,String& response,File* audio=nullptr){
 if(WiFi.status()!=WL_CONNECTED)return -1;
 HTTPClient http;NetworkClientSecure tls;NetworkClient plain;
 // HTTP is available for the family's local LAN demo; public servers use verified TLS.
 if(serverUrl.startsWith("https://")){if(time(nullptr)<1700000000)return -2;tls.setCACert(TRUST_ROOTS);tls.setHandshakeTimeout(4);if(!http.begin(tls,serverUrl+"/api/device/"+deviceCode+path))return -3;}
 else if(serverUrl.startsWith("http://")){if(!http.begin(plain,serverUrl+"/api/device/"+deviceCode+path))return -3;}else return -3;
 http.setConnectTimeout(2000);http.setTimeout(2500);http.setReuse(false);
 http.addHeader("Content-Type",audio?"audio/wav":"application/json");
 int code=audio?http.sendRequest(method,audio,audio->size()):http.sendRequest(method,(uint8_t*)body.c_str(),body.length());
 if(code>0){if(http.getSize()>20000){http.end();return -4;}response=http.getString();}
 http.end();return code;
}
static void fetchTask(){
 String answer;int status=request("/task","GET","",answer);if(status!=200)return;JsonDocument d;
 if(deserializeJson(d,answer)||d["schema"]!="nature-atom.task.v1"||d["pages"].size()!=3||!d["id"].is<String>())return;
 xSemaphoreTake(stateLock,portMAX_DELAY);
 bool same=taskDoc["id"].as<String>()==d["id"].as<String>();
 // Never replace an offline task while there are unsubmitted recordings tied to it.
 bool ok=false;if(same||outbox.size()==0){ok=same||saveJson("/task.json",d);if(ok&&!same)taskDoc=d;}
 xSemaphoreGive(stateLock);
 if(ok){JsonDocument ack;ack["taskId"]=d["id"];ack["stored"]=true;String s;serializeJson(ack,s);request("/ack","POST",s,answer);if(!same){Action a{};strlcpy(a.action,"read",sizeof(a.action));xQueueSend(actions,&a,0);}}
}
static void uploadOutbox(){
 JsonDocument copy;xSemaphoreTake(stateLock,portMAX_DELAY);copy=outbox;xSemaphoreGive(stateLock);
 for(JsonObject item:copy.as<JsonArray>()){
  String id=item["eventId"].as<String>(),phase=item["status"].as<String>(),answer;int status;
  if(phase=="confirmed"){
   JsonDocument payload;payload["taskId"]=item["taskId"];payload["eventId"]=id;payload["quote"]=item["quote"];payload["clue"]=item["clue"];payload["confirmed"]=true;String body;serializeJson(payload,body);
   status=request("/observations","POST",body,answer);JsonDocument receipt;if(status!=200||deserializeJson(receipt,answer)||receipt["ok"]!=true)continue;
   xSemaphoreTake(stateLock,portMAX_DELAY);
   for(size_t i=0;i<outbox.size();i++)if(outbox[i]["eventId"]==id){String audioPath=outbox[i]["path"].as<String>();JsonDocument before;before=outbox;outbox.remove(i);if(saveJson("/outbox.json",outbox))LittleFS.remove(audioPath);else outbox=before;break;}
   xSemaphoreGive(stateLock);continue;
  }
  if(phase=="recorded"){
   File wav=LittleFS.open(item["path"].as<String>(),"r");if(!wav)continue;status=request("/audio/"+id,"POST","",answer,&wav);wav.close();
   if(status!=200&&status!=202)continue;
   xSemaphoreTake(stateLock,portMAX_DELAY);for(JsonObject entry:outbox.as<JsonArray>())if(entry["eventId"]==id){entry["status"]="uploaded";saveJson("/outbox.json",outbox);}xSemaphoreGive(stateLock);
  }
  if(phase=="review")continue;
  status=request("/audio/"+id,"GET","",answer);
  if(status==404){xSemaphoreTake(stateLock,portMAX_DELAY);for(JsonObject entry:outbox.as<JsonArray>())if(entry["eventId"]==id&&entry["status"]!="confirmed"){entry["status"]="recorded";saveJson("/outbox.json",outbox);}xSemaphoreGive(stateLock);continue;}
  if(status!=200)continue;JsonDocument result;if(deserializeJson(result,answer))continue;
  if(result["status"]=="review"&&result["text"].is<String>()&&result["text"].as<String>().length()<=1200){
   bool changed=false;xSemaphoreTake(stateLock,portMAX_DELAY);
   for(JsonObject entry:outbox.as<JsonArray>())if(entry["eventId"]==id&&entry["status"]!="confirmed"){
    if(entry["status"]=="needs_edit"&&entry["quote"]==result["text"])continue;
    entry["quote"]=result["text"];entry["status"]="review";changed=saveJson("/outbox.json",outbox);
   }xSemaphoreGive(stateLock);
   if(changed){Action a{};strlcpy(a.action,"review",sizeof(a.action));xQueueSend(actions,&a,0);}
  }
 }
}
void networkTask(void*){
 if(wifiSsid.isEmpty()||deviceCode.length()!=32){Serial.println("Configure WiFi/server/code using serial JSON; offline reader remains available");vTaskDelete(nullptr);return;}
 cursor=prefs.getString("cmdCode")==deviceCode?prefs.getUInt("cmdSeq",0):0;
 WiFi.mode(WIFI_STA);WiFi.begin(wifiSsid.c_str(),wifiPassword.c_str());configTime(0,0,"time.cloudflare.com","pool.ntp.org");
 bool receivedTask=false;uint32_t retry=0,lastTask=0,lastUpload=0;
 while(true){
  if(WiFi.status()!=WL_CONNECTED){if(millis()-retry>15000){WiFi.reconnect();retry=millis();}vTaskDelay(pdMS_TO_TICKS(500));continue;}
  String answer;if(!receivedTask||millis()-lastTask>30000){fetchTask();receivedTask=true;lastTask=millis();}
  xSemaphoreTake(motionLock,portMAX_DELAY);auto m=motion.snapshot(millis());String currentRun=runId;xSemaphoreGive(motionLock);JsonDocument d;d["bootId"]=bootId;d["seq"]=++telemetrySeq;d["runId"]=currentRun;d["phase"]=MotionEngine::phaseName(m.phase);d["strokes"]=m.strokes;d["cadence"]=m.cadence;d["gameSpeed"]=m.speed;d["progress"]=m.progress;d["peakKmh"]=m.peakKmh;String body;serializeJson(d,body);int st=request("/motion","POST",body,answer);
  if(st==404){Serial.println("PAIR expired or server restarted; offline records retained");vTaskDelay(pdMS_TO_TICKS(5000));continue;}
  if(request("/commands?after="+String(cursor),"GET","",answer)==200){JsonDocument cmds;if(!deserializeJson(cmds,answer)){uint32_t before=cursor;
   bool delivered=true;for(JsonObject c:cmds["commands"].as<JsonArray>()){Action a{};strlcpy(a.action,c["action"]|"",sizeof(a.action));strlcpy(a.run,c["runId"]|"",sizeof(a.run));if(xQueueSend(actions,&a,0)==pdTRUE)cursor=c["seq"];else{delivered=false;break;}}
   if(delivered)cursor=std::max(cursor,cmds["cursor"].as<uint32_t>());if(cursor!=before){prefs.putString("cmdCode",deviceCode);prefs.putUInt("cmdSeq",cursor);}
  }}
  // Upload audio only while not moving: slow uploads must not stall live telemetry.
  if(m.phase!=MotionEngine::RUNNING&&m.phase!=MotionEngine::CALIBRATING&&millis()-lastUpload>5000){uploadOutbox();lastUpload=millis();}
  vTaskDelay(pdMS_TO_TICKS(250));
 }
}
