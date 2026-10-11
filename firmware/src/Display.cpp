#include "Board.h"
#include <Adafruit_GFX.h>
#include <U8g2_for_Adafruit_GFX.h>
#include "EPD_3in97.h"
struct Frame {char title[240],body[1600],footer[240];};
static QueueHandle_t frames;
extern bool natureDisplayFault;
class Paper:public Adafruit_GFX {
public:GFXcanvas1 canvas{800,480};Paper():Adafruit_GFX(400,240){}
 void drawPixel(int16_t x,int16_t y,uint16_t c) override {canvas.fillRect(x*2,y*2,2,2,c);}
};
// Simple line pictograms for rocker selection; native 1-bit drawing, no bitmap model.
static void cueIcon(Paper& p,const String& label){
 const int x=330,y=144;
 if(label.indexOf("声音")>=0){p.fillCircle(x-22,y,3,0);for(int r:{12,23,34})p.drawCircle(x-22,y,r,0);p.fillRect(x-59,y-36,36,73,1);}
 else if(label.indexOf("飞行")>=0||label.indexOf("落脚")>=0){
  p.drawLine(x-34,y-10,x-12,y-20,0);p.drawLine(x-12,y-20,x,y-8,0);p.drawLine(x,y-8,x+12,y-20,0);p.drawLine(x+12,y-20,x+34,y-10,0);
  p.drawLine(x,y-8,x-5,y+4,0);p.drawLine(x,y-8,x+5,y+4,0);
  if(label.indexOf("落脚")>=0){p.drawLine(x-36,y+24,x+36,y+24,0);p.drawLine(x,y+4,x,y+23,0);}
 }else if(label.indexOf("取食")>=0){p.drawCircle(x,y-10,15,0);p.fillCircle(x+6,y-13,2,0);p.drawTriangle(x+14,y-5,x+28,y+3,x+11,y+3,0);p.drawLine(x-25,y+31,x+34,y+31,0);p.fillCircle(x+26,y+24,3,0);p.fillCircle(x+13,y+26,2,0);}
 else if(label.indexOf("暂没")>=0){p.drawLine(x-25,y+26,x+23,y-25,0);p.drawLine(x-25,y+26,x-23,y-8,0);p.drawLine(x-23,y-8,x+23,y-25,0);p.drawLine(x+23,y-25,x+27,y+12,0);p.drawLine(x+27,y+12,x-25,y+26,0);}
 else{p.drawLine(x-32,y-15,x+25,y-15,0);p.fillTriangle(x+32,y-15,x+20,y-23,x+20,y-7,0);p.drawLine(x+32,y+18,x-25,y+18,0);p.fillTriangle(x-32,y+18,x-20,y+10,x-20,y+26,0);}
}
static void displayTask(void*){
 Paper paper;U8G2_FOR_ADAFRUIT_GFX font;font.begin(paper);font.setFont(u8g2_font_wqy16_t_gb2312);font.setForegroundColor(0);font.setBackgroundColor(1);
 if(!paper.canvas.getBuffer()){Serial.println("DISPLAY framebuffer allocation failed");vTaskDelete(nullptr);return;}
 DEV_Module_Init();EPD_3IN97_Init();bool first=true;Frame f;
 while(true){
  if(xQueueReceive(frames,&f,portMAX_DELAY)!=pdTRUE)continue;
  if(natureDisplayFault){Serial.println("DISPLAY busy timeout; sensor/network still running");continue;}
  paper.canvas.fillScreen(1);paper.drawRoundRect(2,2,396,236,8,0);font.setCursor(14,25);font.print("自然原子 / 户外走起！");paper.drawFastHLine(14,34,372,0);
  auto wrap=[&](const char* text,int y,int end){int x=14;const char* p=text;while(*p&&y<=end){int n=(*p&0x80)==0?1:(*p&0xE0)==0xC0?2:(*p&0xF0)==0xE0?3:4;if(strlen(p)<size_t(n))break;char ch[5]={};for(int i=0;i<n&&p[i];i++)ch[i]=p[i];int w=font.getUTF8Width(ch);if(*p=='\n'||x+w>382){x=14;y+=22;if(*p=='\n'){p++;continue;}}if(y>end)break;font.setCursor(x,y);font.print(ch);x+=w;p+=n;}return *p!=0;};
  wrap(f.title,58,80);bool clipped=wrap(f.body,105,192);if(String(f.title)=="这次留下哪一种线索？")cueIcon(paper,String(f.body));paper.drawFastHLine(14,207,372,0);wrap(clipped?"内容较长，请在手机看完整记录":f.footer,229,229);
  // Refresh only on page/phase changes. No continuous refresh while swinging.
  if(first){EPD_3IN97_Display_Base(paper.canvas.getBuffer());first=false;}
  else {EPD_3IN97_Init_Fast();EPD_3IN97_Display_Fast_Base(paper.canvas.getBuffer());}
  vTaskDelay(pdMS_TO_TICKS(500));
 }
}
void initDisplay(){frames=xQueueCreate(1,sizeof(Frame));if(frames)xTaskCreatePinnedToCore(displayTask,"paper",8192,nullptr,1,nullptr,0);}
void screen(const String& title,const String& body,const String& footer){Serial.println("SCREEN "+title+" | "+body);if(!frames)return;Frame f{};strlcpy(f.title,title.c_str(),sizeof(f.title));strlcpy(f.body,body.c_str(),sizeof(f.body));strlcpy(f.footer,footer.c_str(),sizeof(f.footer));xQueueOverwrite(frames,&f);}
