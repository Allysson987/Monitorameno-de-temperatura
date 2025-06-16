# 🌦️ Estação Meteorológica Escolar

Este projeto consiste em uma **Estação Meteorológica com sensores físicos** desenvolvida para **monitorar os índices de chuva, temperatura e umidade do ar** em uma região escolar.

## 📌 Objetivo

Promover o uso da tecnologia no ambiente escolar por meio do **monitoramento em tempo real de variáveis climáticas locais**, incentivando a educação ambiental, científica e tecnológica.

## 🛠️ Tecnologias Utilizadas

- **Node.js** – Backend responsável pela comunicação com os sensores e pela API que serve os dados.
- **HTML** – Estrutura da interface web.
- **CSS** – Estilização da interface gráfica.
- **JavaScript** – Interações no frontend com os dados.
- **SQLite3** – Banco de dados local usado para armazenar os registros meteorológicos.
- **Sensores físicos** – Conectados via microcontroladores (ex: Arduino ou ESP8266/ESP32), responsáveis pela medição dos dados climáticos.

## 📊 Funcionalidades

- Coleta de dados meteorológicos com sensores reais:
  - 🌧️ Índice de chuva
  - 🌡️ Temperatura
  - 💧 Umidade relativa do ar
- Interface web para visualização dos dados em tempo real.
- Histórico de medições armazenado no banco de dados.
- Comunicação entre sensores e servidor via serial ou rede local.
- Visualização clara e acessível para uso educacional.

## 🔌 Componentes Físicos (Exemplo)

- Sensor de chuva (analógico ou digital)
- Sensor de temperatura e umidade (como o DHT11 ou DHT22)
- Microcontrolador (como Arduino Uno ou ESP8266)
- Cabos, resistores, protoboard etc.

## 🖥️ Interface

A aplicação conta com um painel acessível via navegador com:

- Dados atuais exibidos dinamicamente
- Tabela de registros históricos
- Estilo amigável para fácil entendimento por estudantes

## 🧪 Expansões Futuras

- Geração de gráficos estatísticos com bibliotecas como Chart.js ou Matplotlib
- Exportação de dados em CSV ou PDF
- Envio de alertas automáticos por e-mail ou notificação
- Dashboard com mapa de localização das medições

## 📚 Público-Alvo

- Estudantes e professores
- Escolas e instituições de ensino
- Projetos educacionais com foco em tecnologia e meio ambiente

---

**Desenvolvido por Estudantes ETelE Gil**  
Licença: [MIT ou outra, se aplicável]
