#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>


#define DHT_PIN         4       // DHT11 data
#define DHT_TYPE        DHT11
#define MQ135_PIN       34      // MQ135 analog out (ADC1_CH6)
#define GPS_RX_PIN      16      // ESP32 RX2 ← GPS TX
#define GPS_TX_PIN      17      // ESP32 TX2 → GPS RX
#define LED_RED_PIN     25      // Red  LED  (SPOILED)
#define LED_GREEN_PIN   26      // Green LED (FRESH)
#define BUZZER_PIN      27      // Active buzzer
#define GPS_BAUD        9600
#define SERIAL_BAUD     115200

// ─────────────────────────────────────────
//  LCD CONFIGURATION
//  Common I2C addresses: 0x27 or 0x3F
// ─────────────────────────────────────────
#define LCD_I2C_ADDR    0x27
#define LCD_COLS        16
#define LCD_ROWS        2

// ─────────────────────────────────────────
//  MQ135 THRESHOLDS
//  !! Calibrate these for your environment !!
//  Run in fresh air and note the raw ADC value — that's baseline.
// ─────────────────────────────────────────
#define MQ135_WARMUP_MS       20000  // 20 s warm-up (sensor requirement)
#define MQ135_FRESH_MAX       1500   // Below this → clean air
#define MQ135_WARNING_MAX     2200   // 1500–2200  → elevated gas
#define MQ135_SPOILED_MIN     2200   // Above this → high gas (spoilage gases)

// ─────────────────────────────────────────
//  DHT11 / TEMPERATURE THRESHOLDS
//  Food stored above these risks faster spoilage
// ─────────────────────────────────────────
#define TEMP_SAFE_MAX         8.0f   // °C  — refrigerator range safe
#define TEMP_WARNING_MAX      25.0f  // °C  — room temp, elevated risk
                                     //       above 25°C = high risk
#define HUMIDITY_SAFE_MAX     60.0f  // %   — below 60% is safe
#define HUMIDITY_WARNING_MAX  80.0f  // %   — 60–80% is risky
                                     //       above 80% is high risk

// ─────────────────────────────────────────
//  SPOILAGE SCORE THRESHOLDS  (0 – 100)
// ─────────────────────────────────────────
#define FRESH_SCORE_MAX       35     // ≤ 35  → FRESH  (green LED)
#define SPOILED_SCORE_MIN     65     // ≥ 65  → SPOILED (red LED + buzzer)
                                     // 35–65 → WARNING (both blink)

// ─────────────────────────────────────────
//  BUZZER PATTERN (ms)
// ─────────────────────────────────────────
#define BUZZ_SPOILED_ON_MS    200
#define BUZZ_SPOILED_OFF_MS   200
#define BUZZ_WARNING_ON_MS    100
#define BUZZ_WARNING_OFF_MS   900

// ─────────────────────────────────────────
//  PWM SAFE CURRENT LIMITING (NO RESISTOR)
//  ESP32 GPIO max safe current = 12mA
//  LED forward voltage ~2.0V, GPIO = 3.3V
//  Without resistor: (3.3-2.0)/0 = unlimited!
//  PWM duty 100/255 ≈ 39% → avg ~5mA (safe)
//  Do NOT increase above 140 without a resistor
// ─────────────────────────────────────────
#define LED_PWM_SAFE      100   // safe brightness (~5mA avg)
#define LED_PWM_OFF       0
#define LED_PWM_FREQ      1000  // 1kHz PWM (invisible flicker)
#define LED_PWM_RES       8     // 8-bit resolution (0–255)

// ─────────────────────────────────────────
//  TIMING
// ─────────────────────────────────────────
#define READ_INTERVAL_MS      3000   // sensor read every 3 s
#define LCD_SCROLL_MS         2500   // LCD page rotation period
#define BLINK_PERIOD_MS       500    // warning blink half-period

// ─────────────────────────────────────────
//  SPOILAGE STATUS ENUM
// ─────────────────────────────────────────
enum FoodStatus {
  STATUS_UNKNOWN  = 0,
  STATUS_FRESH    = 1,
  STATUS_WARNING  = 2,
  STATUS_SPOILED  = 3
};

// ─────────────────────────────────────────
//  OBJECT INSTANCES
// ─────────────────────────────────────────
LiquidCrystal_I2C lcd(LCD_I2C_ADDR, LCD_COLS, LCD_ROWS);
DHT               dht(DHT_PIN, DHT_TYPE);
TinyGPSPlus       gps;
HardwareSerial    gpsSerial(2);

// ─────────────────────────────────────────
//  GLOBAL STATE
// ─────────────────────────────────────────
struct SensorData {
  // DHT11
  float    temperature   = NAN;
  float    humidity      = NAN;
  bool     dhtOk         = false;
  // MQ135
  int      mq135Raw      = -1;
  String   gasLabel      = "---";
  // GPS
  double   latitude      = 0.0;
  double   longitude     = 0.0;
  float    gpsAltitude   = 0.0;
  float    gpsSpeed      = 0.0;
  uint32_t gpsSats       = 0;
  bool     gpsValid      = false;
  // LCD
  bool     lcdOk         = false;
  // Spoilage
  int      spoilageScore = 0;
  FoodStatus foodStatus  = STATUS_UNKNOWN;
};

SensorData data;

unsigned long lastReadTime    = 0;
unsigned long lastScrollTime  = 0;
unsigned long lastBlinkTime   = 0;
unsigned long lastBuzzTime    = 0;
unsigned long startTime       = 0;
uint8_t       lcdPage         = 0;  // 0=Status, 1=Temp/Hum, 2=Gas, 3=GPS
bool          mq135WarmUp     = true;
bool          blinkState      = false;
bool          buzzState       = false;

// ─────────────────────────────────────────
//  CUSTOM LCD CHARACTERS
// ─────────────────────────────────────────
byte degreeChar[8] = {
  0b00111, 0b00101, 0b00111,
  0b00000, 0b00000, 0b00000, 0b00000, 0b00000
};
byte bellChar[8] = {
  0b00100, 0b01110, 0b01110,
  0b01110, 0b11111, 0b00000, 0b00100, 0b00000
};
byte checkChar[8] = {
  0b00000, 0b00001, 0b00011,
  0b10110, 0b11100, 0b01000, 0b00000, 0b00000
};
byte crossChar[8] = {
  0b00000, 0b10001, 0b01010,
  0b00100, 0b01010, 0b10001, 0b00000, 0b00000
};

// ═════════════════════════════════════════
//  HELPER: safe float formatter
// ═════════════════════════════════════════
String fmtFloat(float v, int decimals = 1) {
  if (isnan(v)) return "N/A";
  return String(v, decimals);
}

// ═════════════════════════════════════════
//  HELPER: pad string to fixed width
// ═════════════════════════════════════════
String padRight(String s, int width) {
  while ((int)s.length() < width) s += ' ';
  return s.substring(0, width);
}

// ═════════════════════════════════════════
//  LCD INIT (auto-probe I2C address)
// ═════════════════════════════════════════
bool initLCD() {
  Wire.begin(21, 22);
  uint8_t addresses[] = { 0x27, 0x3F };
  bool found = false;

  for (uint8_t addr : addresses) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.printf("[LCD] Device found at 0x%02X\n", addr);
      lcd = LiquidCrystal_I2C(addr, LCD_COLS, LCD_ROWS);
      found = true;
      break;
    }
  }

  if (!found) {
    Serial.println("[LCD] ERROR: No I2C device! Check SDA/SCL wiring.");
    return false;
  }

  lcd.init();
  lcd.backlight();
  lcd.createChar(0, degreeChar);
  lcd.createChar(1, bellChar);
  lcd.createChar(2, checkChar);
  lcd.createChar(3, crossChar);

  lcd.setCursor(0, 0); lcd.print(" Food Spoilage  ");
  lcd.setCursor(0, 1); lcd.print("   Detector!    ");
  return true;
}

// ═════════════════════════════════════════
//  SAFE LED HELPERS  (PWM — no resistor needed)
// ═════════════════════════════════════════
void setRedLED(bool on) {
  ledcWrite(LED_RED_PIN, on ? LED_PWM_SAFE : LED_PWM_OFF);
}
void setGreenLED(bool on) {
  ledcWrite(LED_GREEN_PIN, on ? LED_PWM_SAFE : LED_PWM_OFF);
}

// ═════════════════════════════════════════
//  ALERT PINS INIT
// ═════════════════════════════════════════
void initAlerts() {
  // Attach LEDC PWM to LED pins (ESP32 Arduino core v3.x API)
  ledcAttach(LED_RED_PIN,   LED_PWM_FREQ, LED_PWM_RES);
  ledcAttach(LED_GREEN_PIN, LED_PWM_FREQ, LED_PWM_RES);

  // Buzzer stays as plain digital output
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Startup self-test: flash both LEDs + single beep
  setRedLED(true);
  setGreenLED(true);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(300);
  setRedLED(false);
  setGreenLED(false);
  digitalWrite(BUZZER_PIN, LOW);
  Serial.println("[ALERT] LEDs (PWM safe mode) and Buzzer self-test OK.");
  Serial.printf( "[ALERT] LED PWM duty: %d/255 (~%d%% brightness, ~5mA — no resistor safe)\n",
                 LED_PWM_SAFE, (LED_PWM_SAFE * 100) / 255);
}

// ═════════════════════════════════════════
//  DHT11 READ (retry + sanity check)
// ═════════════════════════════════════════
void readDHT() {
  float t = NAN, h = NAN;
  for (int i = 0; i < 3; i++) {
    t = dht.readTemperature();
    h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) break;
    delay(500);
  }

  if (isnan(t) || isnan(h)) {
    Serial.println("[DHT11] FAILED after 3 retries.");
    data.dhtOk = false;
    return;
  }
  if (t < -10 || t > 60 || h < 0 || h > 100) {
    Serial.printf("[DHT11] Out-of-range T=%.1f H=%.1f — skipped\n", t, h);
    data.dhtOk = false;
    return;
  }
  data.temperature = t;
  data.humidity    = h;
  data.dhtOk       = true;
  Serial.printf("[DHT11] T=%.1f°C  H=%.1f%%\n", t, h);
}

// ═════════════════════════════════════════
//  MQ135 READ (averaged + labeled)
// ═════════════════════════════════════════
String gasLabel(int raw) {
  if (raw < 0)                  return "No Data ";
  if (raw <= MQ135_FRESH_MAX)   return "Clean   ";
  if (raw <= MQ135_WARNING_MAX) return "Elevated";
  return "High Gas";
}

void readMQ135() {
  if (mq135WarmUp) {
    unsigned long elapsed = millis() - startTime;
    if (elapsed < MQ135_WARMUP_MS) {
      uint8_t s = (MQ135_WARMUP_MS - elapsed) / 1000;
      Serial.printf("[MQ135] Warming up... %us left\n", s);
      data.gasLabel  = "Warm-up ";
      data.mq135Raw  = -1;
      return;
    }
    mq135WarmUp = false;
    Serial.println("[MQ135] Warm-up done.");
  }

  long sum = 0;
  for (int i = 0; i < 10; i++) { sum += analogRead(MQ135_PIN); delay(5); }
  data.mq135Raw = (int)(sum / 10);
  data.gasLabel  = gasLabel(data.mq135Raw);
  Serial.printf("[MQ135] Raw=%d  Gas=%s\n", data.mq135Raw, data.gasLabel.c_str());
}

// ═════════════════════════════════════════
//  GPS FEED (non-blocking)
// ═════════════════════════════════════════
void feedGPS() {
  while (gpsSerial.available()) gps.encode(gpsSerial.read());

  if (gps.location.isUpdated() && gps.location.isValid()) {
    data.latitude  = gps.location.lat();
    data.longitude = gps.location.lng();
    data.gpsValid  = true;
  }
  if (gps.altitude.isValid())   data.gpsAltitude = (float)gps.altitude.meters();
  if (gps.speed.isValid())      data.gpsSpeed    = (float)gps.speed.kmph();
  if (gps.satellites.isValid()) data.gpsSats     = gps.satellites.value();

  static unsigned long lastChar = 0;
  if (gpsSerial.available()) lastChar = millis();
  if (lastChar && millis() - lastChar > 10000)
    Serial.println("[GPS] WARNING: No data from GPS module.");
}

// ═════════════════════════════════════════
//  SPOILAGE SCORE ENGINE
//  Returns 0 (perfectly fresh) → 100 (definitely spoiled)
//
//  Weights:
//    Gas level  = 50 pts max  (most reliable spoilage indicator)
//    Temperature = 30 pts max  (accelerates microbial growth)
//    Humidity    = 20 pts max  (moisture promotes bacteria/mould)
// ═════════════════════════════════════════
int computeSpoilageScore() {
  int score = 0;

  // ── Gas contribution (0–50 pts) ──────
  if (data.mq135Raw >= 0 && !mq135WarmUp) {
    if (data.mq135Raw <= MQ135_FRESH_MAX) {
      score += 0;
    } else if (data.mq135Raw <= MQ135_WARNING_MAX) {
      // Linear scale from 0→25 across the warning band
      float frac = (float)(data.mq135Raw - MQ135_FRESH_MAX) /
                   (float)(MQ135_WARNING_MAX - MQ135_FRESH_MAX);
      score += (int)(frac * 25);
    } else {
      // Linear scale from 25→50 above warning threshold, capped at 4095
      float frac = (float)(data.mq135Raw - MQ135_WARNING_MAX) /
                   (float)(4095 - MQ135_WARNING_MAX);
      score += 25 + (int)(min(frac, 1.0f) * 25);
    }
  } else {
    // Sensor not ready / warming up — contribute 0 but flag as unknown
    score += 0;
  }

  // ── Temperature contribution (0–30 pts) ──
  if (data.dhtOk) {
    float t = data.temperature;
    if (t <= TEMP_SAFE_MAX) {
      score += 0;
    } else if (t <= TEMP_WARNING_MAX) {
      float frac = (t - TEMP_SAFE_MAX) / (TEMP_WARNING_MAX - TEMP_SAFE_MAX);
      score += (int)(frac * 15);
    } else {
      float frac = (t - TEMP_WARNING_MAX) / (40.0f - TEMP_WARNING_MAX);
      score += 15 + (int)(min(frac, 1.0f) * 15);
    }
  }

  // ── Humidity contribution (0–20 pts) ──
  if (data.dhtOk) {
    float h = data.humidity;
    if (h <= HUMIDITY_SAFE_MAX) {
      score += 0;
    } else if (h <= HUMIDITY_WARNING_MAX) {
      float frac = (h - HUMIDITY_SAFE_MAX) /
                   (HUMIDITY_WARNING_MAX - HUMIDITY_SAFE_MAX);
      score += (int)(frac * 10);
    } else {
      float frac = (h - HUMIDITY_WARNING_MAX) / (100.0f - HUMIDITY_WARNING_MAX);
      score += 10 + (int)(min(frac, 1.0f) * 10);
    }
  }

  return constrain(score, 0, 100);
}

// ═════════════════════════════════════════
//  EVALUATE FOOD STATUS
// ═════════════════════════════════════════
void evaluateFoodStatus() {
  // If sensors are not ready yet, stay UNKNOWN
  if (mq135WarmUp && !data.dhtOk) {
    data.foodStatus    = STATUS_UNKNOWN;
    data.spoilageScore = 0;
    return;
  }

  data.spoilageScore = computeSpoilageScore();

  if (data.spoilageScore <= FRESH_SCORE_MAX) {
    data.foodStatus = STATUS_FRESH;
  } else if (data.spoilageScore >= SPOILED_SCORE_MIN) {
    data.foodStatus = STATUS_SPOILED;
  } else {
    data.foodStatus = STATUS_WARNING;
  }

  Serial.printf("[FOOD] Score=%d  Status=%s\n",
    data.spoilageScore,
    data.foodStatus == STATUS_FRESH   ? "FRESH"   :
    data.foodStatus == STATUS_WARNING ? "WARNING" :
    data.foodStatus == STATUS_SPOILED ? "SPOILED" : "UNKNOWN");
}

// ═════════════════════════════════════════
//  ALERT OUTPUT (LEDs + Buzzer)
//  Called every loop — handles blinking
//  without blocking via millis()
// ═════════════════════════════════════════
void updateAlerts() {
  unsigned long now = millis();

  switch (data.foodStatus) {

    case STATUS_FRESH:
      // Green ON (PWM safe), Red OFF, Buzzer OFF
      setGreenLED(true);
      setRedLED(false);
      digitalWrite(BUZZER_PIN, LOW);
      break;

    case STATUS_WARNING: {
      // Both LEDs blink alternately (PWM safe), slow buzzer pip
      if (now - lastBlinkTime >= BLINK_PERIOD_MS) {
        lastBlinkTime = now;
        blinkState = !blinkState;
        setGreenLED(blinkState);
        setRedLED(!blinkState);
      }
      if (!buzzState && now - lastBuzzTime >= BUZZ_WARNING_OFF_MS) {
        digitalWrite(BUZZER_PIN, HIGH);
        buzzState    = true;
        lastBuzzTime = now;
      } else if (buzzState && now - lastBuzzTime >= BUZZ_WARNING_ON_MS) {
        digitalWrite(BUZZER_PIN, LOW);
        buzzState    = false;
        lastBuzzTime = now;
      }
      break;
    }

    case STATUS_SPOILED: {
      // Red ON solid (PWM safe), Green OFF, Buzzer rapid beep
      setGreenLED(false);
      setRedLED(true);
      if (!buzzState && now - lastBuzzTime >= BUZZ_SPOILED_OFF_MS) {
        digitalWrite(BUZZER_PIN, HIGH);
        buzzState    = true;
        lastBuzzTime = now;
      } else if (buzzState && now - lastBuzzTime >= BUZZ_SPOILED_ON_MS) {
        digitalWrite(BUZZER_PIN, LOW);
        buzzState    = false;
        lastBuzzTime = now;
      }
      break;
    }

    case STATUS_UNKNOWN:
    default:
      // Both off while warming up
      setGreenLED(false);
      setRedLED(false);
      digitalWrite(BUZZER_PIN, LOW);
      break;
  }
}

// ═════════════════════════════════════════
//  LCD PAGES
// ═════════════════════════════════════════

// Page 0 — Main food status
void lcdPage0_FoodStatus() {
  lcd.setCursor(0, 0);
  switch (data.foodStatus) {
    case STATUS_FRESH:
      lcd.write(2); lcd.print(" FOOD: FRESH   "); break;
    case STATUS_WARNING:
      lcd.write(1); lcd.print(" FOOD: WARNING "); break;
    case STATUS_SPOILED:
      lcd.write(3); lcd.print(" FOOD: SPOILED "); break;
    default:
      lcd.print("  Initializing  "); break;
  }

  lcd.setCursor(0, 1);
  if (data.foodStatus == STATUS_UNKNOWN || mq135WarmUp) {
    lcd.print("Sensor warm-up..");
  } else {
    String scoreLine = "Score: " + String(data.spoilageScore) + "/100     ";
    lcd.print(padRight(scoreLine, 16));
  }
}

// Page 1 — Temperature & Humidity
void lcdPage1_TempHum() {
  lcd.setCursor(0, 0);
  if (data.dhtOk) {
    String tLine = "T:" + fmtFloat(data.temperature);
    lcd.write(0);  // degree symbol in char 0
    // Because write then print split, build whole string:
    lcd.setCursor(0, 0);
    lcd.print(padRight("T:" + fmtFloat(data.temperature) + "\x00" + "C", 16));
    // degree char workaround — print then write
    lcd.setCursor(0, 0);
    lcd.print("T:");
    lcd.print(fmtFloat(data.temperature));
    lcd.write(0);
    lcd.print("C       ");
  } else {
    lcd.print("T: Sensor Error ");
  }

  lcd.setCursor(0, 1);
  if (data.dhtOk) {
    lcd.print(padRight("H:" + fmtFloat(data.humidity, 0) + "%", 16));
  } else {
    lcd.print("H: Check DHT11  ");
  }
}

// Page 2 — Gas / Air Quality
void lcdPage2_Gas() {
  lcd.setCursor(0, 0);
  lcd.print("Gas Level:      ");
  lcd.setCursor(0, 1);
  if (mq135WarmUp) {
    lcd.print("Warming up...   ");
  } else if (data.mq135Raw < 0) {
    lcd.print("Sensor Error    ");
  } else {
    lcd.print(padRight(data.gasLabel + "(" + String(data.mq135Raw) + ")", 16));
  }
}

// Page 3 — GPS
void lcdPage3_GPS() {
  lcd.setCursor(0, 0);
  if (data.gpsValid) {
    lcd.print(padRight("La:" + String(data.latitude,  4), 16));
    lcd.setCursor(0, 1);
    lcd.print(padRight("Lo:" + String(data.longitude, 4), 16));
  } else {
    lcd.print("GPS: No Fix     ");
    lcd.setCursor(0, 1);
    lcd.print(padRight("Sats:" + String(data.gpsSats), 16));
  }
}

void updateLCD() {
  if (!data.lcdOk) return;
  lcd.clear();
  switch (lcdPage) {
    case 0: lcdPage0_FoodStatus(); break;
    case 1: lcdPage1_TempHum();    break;
    case 2: lcdPage2_Gas();        break;
    case 3: lcdPage3_GPS();        break;
  }
}

// ═════════════════════════════════════════
//  SERIAL DASHBOARD
// ═════════════════════════════════════════
void printSerialDashboard() {
  const char* statusStr =
    data.foodStatus == STATUS_FRESH   ? "FRESH  ✓" :
    data.foodStatus == STATUS_WARNING ? "WARNING ⚠" :
    data.foodStatus == STATUS_SPOILED ? "SPOILED ✗" : "UNKNOWN";

  Serial.println("╔══════════════════════════════════════╗");
  Serial.println("║     Food Spoilage Detector — Data    ║");
  Serial.println("╠══════════════════════════════════════╣");
  Serial.printf( "║ FOOD STATUS  : %-22s║\n", statusStr);
  Serial.printf( "║ Spoilage Score: %-3d / 100             ║\n",
                 data.spoilageScore);
  Serial.println("╠══════════════════════════════════════╣");
  if (data.dhtOk) {
    Serial.printf("║ Temperature  : %-6.1f °C              ║\n", data.temperature);
    Serial.printf("║ Humidity     : %-6.1f %%              ║\n", data.humidity);
  } else {
    Serial.println("║ DHT11        : *** READ ERROR ***      ║");
  }
  Serial.println("╠══════════════════════════════════════╣");
  if (mq135WarmUp) {
    Serial.println("║ Gas (MQ135)  : Warming up...           ║");
  } else {
    Serial.printf( "║ Gas (MQ135)  : %-8s (raw: %4d)   ║\n",
                   data.gasLabel.c_str(), data.mq135Raw);
  }
  Serial.println("╠══════════════════════════════════════╣");
  if (data.gpsValid) {
    Serial.printf("║ Latitude     : %+.5f              ║\n", data.latitude);
    Serial.printf("║ Longitude    : %+.5f              ║\n", data.longitude);
    Serial.printf("║ Altitude     : %-7.1f m             ║\n", data.gpsAltitude);
    Serial.printf("║ Speed        : %-7.1f km/h          ║\n", data.gpsSpeed);
    Serial.printf("║ Satellites   : %-2u                    ║\n", data.gpsSats);
  } else {
    Serial.printf("║ GPS          : Searching... Sats:%-2u   ║\n", data.gpsSats);
  }
  Serial.println("╚══════════════════════════════════════╝");
  Serial.println();
}

// ═════════════════════════════════════════
//  SETUP
// ═════════════════════════════════════════
void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(500);
  Serial.println("\n[BOOT] Food Spoilage Detector starting...");

  startTime = millis();

  // ── Alert pins ───────────────────────
  initAlerts();

  // ── LCD ──────────────────────────────
  data.lcdOk = initLCD();
  if (!data.lcdOk)
    Serial.println("[LCD] No display found — running Serial-only mode.");
  delay(1500);

  // ── DHT11 ────────────────────────────
  dht.begin();
  Serial.println("[DHT11] Initialized on GPIO4.");

  // ── MQ135 ────────────────────────────
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  Serial.printf("[MQ135] ADC on GPIO34. Warm-up: %us\n",
                MQ135_WARMUP_MS / 1000);

  // ── GPS ──────────────────────────────
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.printf("[GPS] UART2 — RX=%d TX=%d @ %dbaud\n",
                GPS_RX_PIN, GPS_TX_PIN, GPS_BAUD);

  // ── LCD ready splash ─────────────────
  if (data.lcdOk) {
    delay(1000);
    lcd.clear();
    lcd.setCursor(0, 0); lcd.print("System Ready!   ");
    lcd.setCursor(0, 1); lcd.print("Warming MQ135...");
    delay(2000);
  }

  Serial.println("[BOOT] Setup complete. Starting monitoring loop.\n");
}

// ═════════════════════════════════════════
//  LOOP
// ═════════════════════════════════════════
void loop() {
  unsigned long now = millis();

  // ── Always feed GPS (non-blocking) ───
  feedGPS();

  // ── Always update alerts (non-blocking blink/buzz)
  updateAlerts();

  // ── Periodic sensor read + evaluation ─
  if (now - lastReadTime >= READ_INTERVAL_MS) {
    lastReadTime = now;

    readDHT();
    readMQ135();
    evaluateFoodStatus();
    printSerialDashboard();
  }

  // ── LCD page rotation ─────────────────
  if (data.lcdOk && (now - lastScrollTime >= LCD_SCROLL_MS)) {
    lastScrollTime = now;
    updateLCD();
    lcdPage = (lcdPage + 1) % 4;
  }

  delay(10);
}
