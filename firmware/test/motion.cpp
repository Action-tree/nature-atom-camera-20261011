#include "MotionEngine.h"
#include <cassert>
#include <iostream>
int main(){
 MotionEngine e;assert(!e.start());e.calibrate();uint32_t t=20;
 for(int i=0;i<60;i++,t+=20)e.sample(1,2,1,1,t);
 e.sample(90,0,0,1,t);t+=20;
 for(int i=0;i<99;i++,t+=20)e.sample(1,2,1,1,t);
 assert(e.snapshot(t).phase==MotionEngine::CALIBRATING);
 e.sample(1,2,1,1,t);t+=20;assert(e.start());
 for(int i=0;i<100;i++,t+=20)e.sample(1,2,1,1,t);
 assert(e.snapshot(t).strokes==0&&e.snapshot(t).progress==0);
 for(int i=0;i<300;i++,t+=20)e.sample(1+150*std::sin(i*.02*2*3.141592653589793),2,1,1,t);
 auto s=e.snapshot(t);assert(s.strokes>=10&&s.strokes<=13);assert(s.progress>10&&s.progress<100);
 assert(e.snapshot(t+200).speed==0);
 for(int i=0;i<75;i++,t+=20)e.sample(1,2,1,1,t);
 auto stopped=e.snapshot(t);assert(stopped.speed==0);
 for(int i=0;i<100;i++,t+=20)e.sample(1,2,1,1,t);
 assert(e.snapshot(t).progress==stopped.progress);
 for(int i=0;i<2000;i++,t+=20)e.sample(1+150*std::sin(i*.02*2*3.141592653589793),2,1,1,t);
 assert(e.snapshot(t).phase==MotionEngine::FINISHED&&e.snapshot(t).progress==100);
 for(float frequency:{.5f,1.f,1.5f,2.f}){MotionEngine sinus;sinus.calibrate();uint32_t ms=20;for(int i=0;i<100;i++,ms+=20)sinus.sample(0,0,0,1,ms);assert(sinus.start());for(int i=0;i<250;i++,ms+=20)sinus.sample(0,150*std::sin(i*.02*2*3.141592653589793*frequency),0,1,ms);assert(sinus.snapshot(ms).strokes>=frequency*8);}
 e.calibrate();assert(!e.start());e.sample(NAN,0,0,1,t);assert(e.snapshot(t).phase==MotionEngine::ERROR);
 std::cout<<"Motion: stillness, bias, peak gating, stale input, stop and finish passed\n";
}
