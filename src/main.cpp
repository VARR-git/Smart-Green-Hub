#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// TokenHelper & RTDBHelper bawaan library Firebase ESP32
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// Konfigurasi Wi-Fi
const char *ssid = "Guru Electrical";
const char *password = "kontaktor2026";

// Konfigurasi Firebase RTDB
#define FIREBASE_URL "https://smart-green-hub-default-rtdb.asia-southeast1.firebasedatabase.app/"
#define FIREBASE_AUTH ""

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

// Task Handles untuk FreeRTOS Multi-core
TaskHandle_t HydroponicTaskHandle = NULL;

// Prototipe Fungsi
void TaskHydroponicLogic(void *pvParameters);
void streamCallback(FirebaseStream data);
void streamTimeoutCallback(bool timeout);

// Variabel ping ke RTDB
unsigned long previousMillis = 0;
const long interval = 5000;

void setup()
{
  Serial.begin(115200);
  delay(1000);

  // 1. Cek Kesiapan PSRAM 8MB
  Serial.printf("Total PSRAM: %d bytes\n", ESP.getPsramSize());
  Serial.printf("Free PSRAM: %d bytes\n", ESP.getFreePsram());

  // 2. Koneksi ke Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Menghubungkan ke Wi-Fi");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi Terkoneksi!");
  Serial.print("IP Address ESP32: ");
  Serial.println(WiFi.localIP());

  // 3. Konfigurasi Client Firebase
  config.database_url = FIREBASE_URL;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.reconnectWiFi(true);
  Firebase.begin(&config, &auth);

  // Set status awal online dan daftarkan Last Will & Testament (LWT) ke Firebase
  if (Firebase.ready()) {
    Firebase.RTDB.setString(&fbdoSet, "/hidroponik/esp_status", "online");
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
  unsigned long currentMillis = millis();

  if (Firebase.ready())
  {
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
    }
    else if (path == "/fan")
    {
      fanStatus = state;
      Serial.printf("Status Kipas diubah via Firebase: %s\n", fanStatus ? "ON" : "OFF");
    }
    else if (path == "/lamp")
    {
      lightStatus = state;
      Serial.printf("Status Lampu diubah via Firebase: %s\n", lightStatus ? "ON" : "OFF");
    }

    newDataAvailable = true;
  }
}

void streamTimeoutCallback(bool timeout)
{
  if (timeout)
  {
    Serial.println("Stream timeout, resuming...");
  }
}