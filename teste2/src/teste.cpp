#include <WiFi.h>
#include <WiFiClient.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <Adafruit_Sensor.h>

// Configuração da rede Wi-Fi
const char *ssid = "inovagil";
const char *password = "1n0vag1l.";

// Inicializa o DHT
DHT dht(13, DHT11);

// Prototipação das funções
void sendSensorData(); // Enviar dados para o servidor
float readDHTTemperature();
float readDHTHumidity();
float calculateLDRResistance(float voltage, float resistorValue);
float calculateLux(float resistanceLDR);
float readPhotoresistorLux();

void setup(void) {
    
    pinMode(12, OUTPUT);
    digitalWrite(12, HIGH);
    Serial.begin(9600);
    dht.begin();
  
    pinMode(34, INPUT); // Pino do fotoresistor

    // Conexão Wi-Fi
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    Serial.println("");

    // Espera pela conexão
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("");
    Serial.print("Connected to ");
    Serial.println(ssid);
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
}

void loop(void) {
    // Envio dos dados para o servidor
    sendSensorData();
    delay(15000); // Aguarda 1 minuto antes da próxima leitura
}

// Função para enviar os dados para o servidor
void sendSensorData() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;

        // Substitua "192.168.1.144" pelo IP correto do seu servidor
        String id = "1";
        String url = "http://192.168.0.139:3000/unidades/" + id + "/dados";
    
        http.begin(url); // Inicia a requisição com a URL
        http.addHeader("Content-Type", "application/json");

        // Leitura de temperatura, umidade e luminosidade
        float temperatura = readDHTTemperature();
        float umidade = readDHTHumidity();
        float luminosidade = readPhotoresistorLux();

        if (isnan(temperatura) || isnan(umidade) || isnan(luminosidade)) {
            Serial.println("Falha na leitura do sensor!");
            return;
        }

        // Criação do payload em JSON
        String payload = "{\"temperatura\":" + String(temperatura) + 
                         ", \"umidade\":" + String(umidade) + 
                         ", \"luminosidade\":" + String(luminosidade) + "}";

        int httpResponseCode = http.PUT(payload); // Faz a requisição PUT

        if (httpResponseCode > 0) {
            String response = http.getString(); // Obter resposta do servidor
            Serial.println(httpResponseCode);
            Serial.println(response);
        } else {
            Serial.print("Erro na requisição: ");
            Serial.println(httpResponseCode); // Exibe o código de erro
        }
        http.end(); // Finaliza a requisição
    }
}

// Função para calcular a resistência do LDR
float calculateLDRResistance(float voltage, float resistorValue) {
    float vSupply = 3.3; // Tensão de alimentação do ESP32
    return resistorValue * (vSupply - voltage) / voltage;
}

// Função para calcular os lux a partir da resistência do LDR
float calculateLux(float resistanceLDR) {
    float K = 1000;  // Constante de ajuste para ambientes internos
    float R_0 = 10000;   // Resistência de referência ajustada para baixa luminosidade
    return K * pow((resistanceLDR / R_0), 0.5);
}

// Função para ler o valor de luminosidade do LDR
float readPhotoresistorLux() {
    int sensorValue = analogRead(34); // Leitura do LDR no pino 34
    float voltage = sensorValue * (3.3 / 4095.0); // Converte para tensão
    float resistorValue = 10000; // Resistor de 10kΩ no divisor
    float resistanceLDR = calculateLDRResistance(voltage, resistorValue); // Calcula a resistência
    return calculateLux(resistanceLDR); // Calcula os lux
}

// Função para ler a temperatura do DHT11
float readDHTTemperature() {
    float t = dht.readTemperature();
    if (isnan(t)) {    
        Serial.println("Failed to read from DHT sensor!");
        return -1;
    } else {
        Serial.println(t);
        return t;
    }
}

// Função para ler a umidade do DHT11
float readDHTHumidity() {
    float h = dht.readHumidity();
    if (isnan(h)) {
        Serial.println("Failed to read from DHT sensor!");
        return -1;
    } else {
        Serial.println(h);
        return h;
    }
}


