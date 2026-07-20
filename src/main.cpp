#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPUpdate.h>
#include <ArduinoOTA.h>
#include <Firebase_ESP_Client.h>

// TokenHelper & RTDBHelper bawaan library Firebase ESP32
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

//Kredensial Wi-Fi & Firebase
#include "secrets.h"

// Versi firmware berjalan, naikkan setiap build baru untuk OTA
#define FW_VERSION "1.0.5"

// Firmware diunduh dari GitHub Releases: tag v<versi>, file firmware.bin
#define FW_URL_BASE "https://github.com/VARR-git/Smart-Green-Hub/releases/download/v"

// Objek untuk Handling Firebase
FirebaseData fbdoStream;
FirebaseData fbdoSet;
FirebaseAuth auth;
FirebaseConfig config;

// Variabel Data Hidroponik
float phValue = 6.5;
float tdsValue = 800.0;
float tempValue = 25.0;
float humiValue = 90;
bool pumpStatus = false;
bool fanStatus = false;
bool lightStatus = false;

// Flag penanda jika ada data sensor baru yang siap dikirim ke Firebase
volatile bool newDataAvailable = false;

// Permintaan update OTA (di-set dari stream callback, dieksekusi di loop)
volatile bool otaRequested = false;
String otaTargetVersion = "";

// Task Handles untuk FreeRTOS Multi-core
TaskHandle_t HydroponicTaskHandle = NULL;

// Prototipe Fungsi
void TaskHydroponicLogic(void *pvParameters);
void streamCallback(FirebaseStream data);
void streamTimeoutCallback(bool timeout);
void performOTA();

// Variabel ping ke RTDB
unsigned long previousMillis = 0;
const long interval = 5000;

void setup()
{
  Serial.begin(115200);
  delay(1000);

  Serial.printf("Smart Green Hub firmware %s\n", FW_VERSION);

  // 1. Cek Kesiapan PSRAM 8MB
  Serial.printf("Total PSRAM: %d bytes\n", ESP.getPsramSize());
  Serial.printf("Free PSRAM: %d bytes\n", ESP.getFreePsram());

  // 2. Koneksi ke Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Menghubungkan ke Wi-Fi");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi Terkoneksi!");
  Serial.print("IP Address ESP32: ");
  Serial.println(WiFi.localIP());

  // Upload wireless dari PlatformIO (env:wireless, harus satu jaringan WiFi)
  ArduinoOTA.setHostname("smart-green-hub");
  ArduinoOTA.begin();

  // 3. Konfigurasi Client Firebase (login anonim, provider Anonymous harus aktif)
  config.api_key = FIREBASE_API_KEY;
  config.database_url = FIREBASE_DATABASE_URL;
  config.token_status_callback = tokenStatusCallback; // dari TokenHelper.h

  if (Firebase.signUp(&config, &auth, "", ""))
  {
    Serial.println("Login anonim Firebase berhasil");
  }
  else
  {
    Serial.printf("Gagal login anonim: %s\n", config.signer.signupError.message.c_str());
  }

  Firebase.reconnectWiFi(true);
  Firebase.begin(&config, &auth);

  // Tunggu token auth siap (maksimal 15 detik)
  Serial.print("Menunggu token Firebase");
  unsigned long tokenWaitStart = millis();
  while (!Firebase.ready() && millis() - tokenWaitStart < 15000)
  {
    delay(300);
    Serial.print(".");
  }
  Serial.println();

  if (Firebase.ready())
  {
    Firebase.RTDB.setString(&fbdoSet, "/hidroponik/esp_status", "online");
    Firebase.RTDB.setString(&fbdoSet, "/hidroponik/fw/running", FW_VERSION);

    // Cek update yang diminta saat perangkat offline
    if (Firebase.RTDB.getString(&fbdoSet, "/hidroponik/fw/version"))
    {
      String remoteVer = fbdoSet.to<String>();
      if (remoteVer.length() > 0 && remoteVer != FW_VERSION)
      {
        otaTargetVersion = remoteVer;
        otaRequested = true;
      }
    }
    else
    {
      Firebase.RTDB.setString(&fbdoSet, "/hidroponik/fw/version", FW_VERSION);
    }
  }
  else
  {
    Serial.println("Peringatan: token Firebase belum siap, lanjut tanpa init awal");
  }

  // 4. Mulai Stream Mendengarkan Kontrol Saklar dari Node "/hidroponik"
  if (!Firebase.RTDB.beginStream(&fbdoStream, "/hidroponik"))
  {
    Serial.printf("Gagal memulai Firebase Stream: %s\n", fbdoStream.errorReason().c_str());
  }

  // Set callback agar saat data di Firebase berubah, fungsi streamCallback langsung dieksekusi
  Firebase.RTDB.setStreamCallback(&fbdoStream, streamCallback, streamTimeoutCallback);

  Serial.println("Firebase RTDB Listening & Streaming siap di Core 0");

  // 5. Setup Multi-Core (Menjalankan Logika Hidroponik di Core 1)
  xTaskCreatePinnedToCore(
      TaskHydroponicLogic,   // Fungsi task
      "HydroTask",           // Nama task
      4096,                  // Stack size (bytes)
      NULL,                  // Parameter task
      1,                     // Prioritas task
      &HydroponicTaskHandle, // Task handle
      1                      // PINNED KE CORE 1
  );
}

void loop()
{
  ArduinoOTA.handle();

  unsigned long currentMillis = millis();

  if (Firebase.ready())
  {
    // 0. Eksekusi permintaan update firmware (OTA)
    if (otaRequested)
    {
      otaRequested = false;
      performOTA();
    }

    // 1. Mekanisme Heartbeat Ping (Kirim detak jantung tiap 5 detik)
    if (currentMillis - previousMillis >= interval)
    {
      previousMillis = currentMillis;
      Firebase.RTDB.setInt(&fbdoSet, "/hidroponik/last_ping", currentMillis);
      Firebase.RTDB.setString(&fbdoSet, "/hidroponik/esp_status", "online");
    }

    // 2. Kirim Data Monitoring jika ada perubahan data / sensor baru
    if (newDataAvailable)
    {
      newDataAvailable = false; // Reset flag

      FirebaseJson json;
      json.set("ph", phValue);
      json.set("tds", tdsValue);
      json.set("temperature", tempValue);
      json.set("humidity", humiValue);

      // Mengirim status aktual saklar agar dashboard web tersinkronisasi
      json.set("pump", pumpStatus ? "ON" : "OFF");
      json.set("lamp", lightStatus ? "ON" : "OFF");
      json.set("fan", fanStatus ? "ON" : "OFF");
      json.set("updated_at", "13:48");

      if (Firebase.RTDB.updateNode(&fbdoSet, "/hidroponik", &json))
      {
        Serial.println("Data monitoring berhasil diperbarui di Firebase!");
      }
      else
      {
        Serial.printf("Gagal memperbarui Firebase: %s\n", fbdoSet.errorReason().c_str());
      }
    }
  }

  vTaskDelay(pdMS_TO_TICKS(50));
}

// ================= TASK LOGIKA HIDROPONIK (CORE 1) =================
void TaskHydroponicLogic(void *pvParameters)
{
  Serial.print("Task Hidroponik berjalan pada Core: ");
  Serial.println(xPortGetCoreID());

  for (;;)
  {
    phValue = 6.0 + ((float)random(-50, 50) / 100.0);
    tdsValue = 800 + random(-20, 20);

    newDataAvailable = true;
    vTaskDelay(pdMS_TO_TICKS(2000));
  }
}

// ================= CALLBACK STREAM FIREBASE (Menerima Perintah dari Web) =================
void streamCallback(FirebaseStream data)
{
  String path = data.dataPath();

  if (data.dataType() == "string")
  {
    String val = data.stringData();
    bool state = (val == "ON");

    if (path == "/pump")
    {
      pumpStatus = state;
      Serial.printf("Status Pompa diubah via Firebase: %s\n", pumpStatus ? "ON" : "OFF");
      newDataAvailable = true;
    }
    else if (path == "/fan")
    {
      fanStatus = state;
      Serial.printf("Status Kipas diubah via Firebase: %s\n", fanStatus ? "ON" : "OFF");
      newDataAvailable = true;
    }
    else if (path == "/lamp")
    {
      lightStatus = state;
      Serial.printf("Status Lampu diubah via Firebase: %s\n", lightStatus ? "ON" : "OFF");
      newDataAvailable = true;
    }
    else if (path == "/fw/version")
    {
      // Minta OTA jika versi di RTDB beda dari versi berjalan
      if (val.length() > 0 && val != FW_VERSION)
      {
        otaTargetVersion = val;
        otaRequested = true;
        Serial.printf("Update firmware diminta: %s -> %s\n", FW_VERSION, val.c_str());
      }
    }
  }
}

void streamTimeoutCallback(bool timeout)
{
  if (timeout)
  {
    Serial.println("Stream timeout, resuming...");
  }
}

// ================= OTA VIA GITHUB RELEASES =================
void performOTA()
{
  Serial.printf("Mulai OTA: %s -> %s\n", FW_VERSION, otaTargetVersion.c_str());
  Firebase.RTDB.setString(&fbdoSet, "/hidroponik/fw/status", "updating");

  // Hentikan stream agar tidak ada dua koneksi TLS selama download
  Firebase.RTDB.endStream(&fbdoStream);

  String url = FW_URL_BASE;
  url += otaTargetVersion;
  url += "/firmware.bin";
  Serial.printf("Unduh: %s\n", url.c_str());

  WiFiClientSecure client;
  client.setInsecure(); // ponytail: tanpa verifikasi cert, embed root CA jika butuh anti-MITM
  httpUpdate.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  httpUpdate.rebootOnUpdate(false);
  httpUpdate.onProgress([](int cur, int total)
                        { Serial.printf("Progress unduhan: %d%%\n", total > 0 ? cur * 100 / total : 0); });

  if (httpUpdate.update(client, url) == HTTP_UPDATE_OK)
  {
    Firebase.RTDB.setString(&fbdoSet, "/hidroponik/fw/status", "success");
    Serial.println("OTA sukses, restart ke firmware baru...");
    delay(1000);
    ESP.restart();
  }
  else
  {
    String err = "failed: ";
    err += httpUpdate.getLastErrorString();
    Serial.printf("OTA gagal: %s\n", err.c_str());
    Firebase.RTDB.setString(&fbdoSet, "/hidroponik/fw/status", err);

    // Nyalakan kembali stream untuk operasi normal
    if (!Firebase.RTDB.beginStream(&fbdoStream, "/hidroponik"))
    {
      Serial.printf("Gagal restart stream: %s\n", fbdoStream.errorReason().c_str());
    }
    Firebase.RTDB.setStreamCallback(&fbdoStream, streamCallback, streamTimeoutCallback);
  }
}
