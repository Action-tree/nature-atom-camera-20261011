#include "Board.h"
#include <ESP_I2S.h>
#include "es8311.h"
static I2SClass audio;
bool storageReady=false,audioReady=false;
bool saveJson(const char* path,const JsonDocument& doc){if(!storageReady)return false;String tmp=String(path)+".tmp";File f=LittleFS.open(tmp,"w");if(!f)return false;size_t n=serializeJson(doc,f);f.flush();f.close();if(n!=measureJson(doc)){LittleFS.remove(tmp);return false;}return LittleFS.rename(tmp,path);}
bool loadJson(const char* path,JsonDocument& doc){if(!storageReady)return false;File f=LittleFS.open(path,"r");if(!f)return false;return !deserializeJson(doc,f);}
bool initAudio(){
 pinMode(39,OUTPUT);digitalWrite(39,LOW); // speaker muted, capture only
 auto codec=es8311_create(I2C_NUM_0,ES8311_ADDRRES_0);if(!codec)return false;
 es8311_clock_config_t clock={false,false,true,16000*256,16000};
 if(es8311_init(codec,&clock,ES8311_RESOLUTION_16,ES8311_RESOLUTION_16)!=ESP_OK||es8311_microphone_config(codec,false)!=ESP_OK||es8311_microphone_gain_set(codec,ES8311_MIC_GAIN_24DB)!=ESP_OK)return false;
 audio.setPins(14,47,48,21,13);
 return audio.begin(I2S_MODE_STD,16000,I2S_DATA_BIT_WIDTH_16BIT,I2S_SLOT_MODE_MONO,I2S_STD_SLOT_LEFT);
}
bool captureWav(const char* path,unsigned seconds){
 if(!audioReady||!storageReady||seconds>10||LittleFS.totalBytes()-LittleFS.usedBytes()<seconds*32000+4096)return false;
 // Read bounded chunks; keep the sensor task alive. Canonical PCM WAV header.
 File f=LittleFS.open(String(path)+".tmp","w");if(!f)return false;
 uint8_t h[44]={};memcpy(h,"RIFF",4);memcpy(h+8,"WAVEfmt ",8);memcpy(h+36,"data",4);
 auto le16=[&](int o,uint16_t v){h[o]=v;h[o+1]=v>>8;};auto le32=[&](int o,uint32_t v){for(int i=0;i<4;i++)h[o+i]=v>>(i*8);};
 const uint32_t bytes=seconds*32000;le32(4,bytes+36);le32(16,16);le16(20,1);le16(22,1);le32(24,16000);le32(28,32000);le16(32,2);le16(34,16);le32(40,bytes);bool ok=f.write(h,44)==44;
 char buffer[1024];uint32_t written=0;while(ok&&written<bytes){size_t want=std::min(uint32_t(sizeof(buffer)),bytes-written);size_t n=audio.readBytes(buffer,want);if(n!=want||f.write((uint8_t*)buffer,n)!=n){ok=false;break;}written+=n;vTaskDelay(1);}f.flush();f.close();
 if(!ok){LittleFS.remove(String(path)+".tmp");return false;}return LittleFS.rename(String(path)+".tmp",path);
}
