#include "Board.h"
#include <Wire.h>
#include <SensorQMI8658.hpp>
static SensorQMI8658 qmi;
MotionEngine motion;SemaphoreHandle_t motionLock;bool imuReady=false;
MotionEngine::Snapshot readMotion(){xSemaphoreTake(motionLock,portMAX_DELAY);auto s=motion.snapshot(millis());xSemaphoreGive(motionLock);return s;}
bool initSensors(){
 motionLock=xSemaphoreCreateMutex();
 if(!qmi.begin(Wire,QMI8658_H_SLAVE_ADDRESS,41,42)&&!qmi.begin(Wire,QMI8658_L_SLAVE_ADDRESS,41,42))return false;
 qmi.configAccelerometer(SensorQMI8658::ACC_RANGE_4G,SensorQMI8658::ACC_ODR_125Hz,SensorQMI8658::LPF_MODE_3);
 qmi.configGyroscope(SensorQMI8658::GYR_RANGE_512DPS,SensorQMI8658::GYR_ODR_112_1Hz,SensorQMI8658::LPF_MODE_3);
 qmi.enableGyroscope();qmi.enableAccelerometer();imuReady=true;return true;
}
void sensorTask(void*){IMUdata a,g;TickType_t tick=xTaskGetTickCount();uint32_t last=millis();while(true){if(imuReady&&qmi.getDataReady()&&qmi.getAccelerometer(a.x,a.y,a.z)&&qmi.getGyroscope(g.x,g.y,g.z)){last=millis();xSemaphoreTake(motionLock,portMAX_DELAY);motion.sample(g.x,g.y,g.z,sqrtf(a.x*a.x+a.y*a.y+a.z*a.z),last);xSemaphoreGive(motionLock);}else if(millis()-last>2000){xSemaphoreTake(motionLock,portMAX_DELAY);motion.fault();xSemaphoreGive(motionLock);}vTaskDelayUntil(&tick,pdMS_TO_TICKS(20));}}
