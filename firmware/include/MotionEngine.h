#pragma once
#include <cmath>
#include <cstdint>
#include <algorithm>
// Portable C++11. Inputs: gyroscope deg/s, accelerometer magnitude in g.
// Counts angular-motion pulses, NOT steps; maps cadence to virtual game units.
class MotionEngine {
public:
 enum Phase { IDLE, CALIBRATING, READY, RUNNING, FINISHED, ERROR };
 struct Snapshot { Phase phase=IDLE; uint32_t strokes=0; float cadence=0,speed=0,progress=0; };
 void calibrate(){ s=Snapshot{};s.phase=CALIBRATING;n=0;sumX=sumY=sumZ=0;filtered=0;axis=-1;polarity=0;lastSample=lastPulse=0; }
 bool start(){if(s.phase!=READY&&s.phase!=FINISHED)return false;s=Snapshot{};s.phase=RUNNING;filtered=0;axis=-1;polarity=0;lastPulse=lastSample=0;return true;}
 void stop(){if(s.phase==RUNNING){s.phase=READY;s.speed=0;s.cadence=0;}}
 void fault(){s.phase=ERROR;s.speed=0;s.cadence=0;}
 void sample(float x,float y,float z,float g,uint32_t ms){
  if(!std::isfinite(x)||!std::isfinite(y)||!std::isfinite(z)||!std::isfinite(g)){fault();return;}
  if(s.phase==CALIBRATING){
   // Continuous stillness required; an interrupted calibration starts again.
   if(std::sqrt(x*x+y*y+z*z)>8||g<.9f||g>1.1f){n=0;sumX=sumY=sumZ=0;return;}
   sumX+=x;sumY+=y;sumZ+=z;if(++n>=100){bx=sumX/n;by=sumY/n;bz=sumZ/n;s.phase=READY;}return;
  }
  if(s.phase!=RUNNING)return;
  const float dt=lastSample?std::min(uint32_t(ms-lastSample),uint32_t(50))/1000.f:0;lastSample=ms;
  x-=bx;y-=by;z-=bz;
  const float values[]={x,y,z};
  if(axis<0&&std::sqrt(x*x+y*y+z*z)>45){axis=0;for(int i=1;i<3;i++)if(std::fabs(values[i])>std::fabs(values[axis]))axis=i;}
  if(axis>=0)filtered=.4f*values[axis]+.6f*filtered;
  const int direction=filtered>45?1:filtered<-45?-1:0;
  // Alternating signed crossings survive smooth sine-wave arm swings, unlike
  // magnitude-only valley detection. Keep the board grip/orientation consistent.
  if(direction&&direction!=polarity&&(!lastPulse||uint32_t(ms-lastPulse)>=220)){
   const uint32_t interval=lastPulse?ms-lastPulse:1000;
   s.cadence=std::min(240.f,60000.f/std::max(uint32_t(220),interval));
   s.strokes++;lastPulse=ms;polarity=direction;
  }
  s.speed=lastPulse&&uint32_t(ms-lastPulse)<=1100?std::min(10.f,s.cadence/20.f):0;
  if(!s.speed)s.cadence=0;
  s.progress=std::min(100.f,s.progress+s.speed*dt);
  if(s.progress>=100){s.phase=FINISHED;s.speed=0;}
 }
 Snapshot snapshot(uint32_t ms) const {auto v=s;if(v.phase==RUNNING&&lastSample&&uint32_t(ms-lastSample)>150){v.speed=0;v.cadence=0;}return v;}
 static const char* phaseName(Phase p){static const char* names[]={"idle","calibrating","ready","running","finished","error"};return names[p];}
private:
 Snapshot s;uint32_t n=0,lastSample=0,lastPulse=0;float bx=0,by=0,bz=0,sumX=0,sumY=0,sumZ=0,filtered=0;int axis=-1,polarity=0;
};
