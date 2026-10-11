#pragma once
#include <Arduino.h>
#include <ArduinoJson.h>
#include <LittleFS.h>
#include "MotionEngine.h"
constexpr int PIN_UP=4,PIN_OK=5,PIN_DOWN=6,PIN_BOOT=0;
extern MotionEngine motion;
extern SemaphoreHandle_t motionLock;
extern bool storageReady,imuReady,audioReady;
extern String bootId,runId;
MotionEngine::Snapshot readMotion();
void screen(const String& title,const String& body,const String& footer="上下翻页  中键确认  BOOT录音");
void initDisplay();
bool initSensors();
void sensorTask(void*);
bool initAudio();
bool captureWav(const char* path,unsigned seconds=8);
bool saveJson(const char* path,const JsonDocument& doc);
bool loadJson(const char* path,JsonDocument& doc);
