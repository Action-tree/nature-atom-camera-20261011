#pragma once
#include "Board.h"
#include <Preferences.h>
extern SemaphoreHandle_t stateLock;
extern JsonDocument taskDoc,outbox;
extern QueueHandle_t actions;
extern Preferences prefs;
extern String serverUrl,deviceCode,wifiSsid,wifiPassword;
struct Action {char action[16];char run[80];};
void networkTask(void*);
void showReader();
