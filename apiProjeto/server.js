// server.js

// Importando as dependências necessárias
const express = require('express'); // Framework para criar APIs
const bodyParser = require('body-parser'); // Middleware para parsear requisições JSON
const cors = require('cors'); // Middleware para habilitar CORS
const sqlite3 = require('sqlite3').verbose(); // Biblioteca para interação com o SQLite
const path = require('path'); // Módulo para manipulação de caminhos de arquivos

// Inicializa o aplicativo Express
const app = express();

// Define a porta onde o servidor vai rodar
const PORT = 3000;

// Middleware para habilitar CORS
app.use(cors()); // Isso permite que a API seja acessada de qualquer origem

// Middleware para que o Express entenda requisições com corpo JSON
app.use(bodyParser.json());

// Define o caminho do banco de dados SQLite
const dbPath = path.join(__dirname, 'banco.db'); // Nome do banco de dados

// Cria ou abre o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de dados:", err.message);
    } else {
        console.log("Banco de dados conectado com sucesso!");

        // Adicionar a coluna pluviosidade, se não existir
        db.run(`
            ALTER TABLE unidade ADD COLUMN pluviosidade REAL NOT NULL DEFAULT 0;
        `, (err) => {
            if (err) {
                console.log("Coluna pluviosidade já existe ou erro ao adicionar:", err.message);
            } else {
                console.log("Coluna pluviosidade adicionada com sucesso.");
            }
        });

        // Cria a tabela de unidades, caso ainda não exista
        db.run(`CREATE TABLE IF NOT EXISTS unidade (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            temperatura REAL NOT NULL,
            alerta_temperatura INTEGER NOT NULL DEFAULT 0,
            umidade REAL NOT NULL, 
            alerta_umidade INTEGER NOT NULL DEFAULT 0,
            luminosidade REAL NOT NULL,
            alerta_luminosidade INTEGER NOT NULL DEFAULT 0,
            pluviosidade REAL NOT NULL DEFAULT 0,
            alerta_pluviosidade INTEGER NOT NULL DEFAULT 0,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL
        );`, (err) => {
            if (err) {
                console.error("Erro ao criar a tabela de unidades:", err.message);
            }
        });
    }
});

// Definindo os limites para gerar alertas
const LIMITE_SUPERIOR_TEMP = 32; // Limite superior da temperatura
const LIMITE_INFERIOR_TEMP = 18;  // Limite inferior da temperatura
const LIMITE_SUPERIOR_UMIDADE = 70; // Limite superior da umidade
const LIMITE_INFERIOR_UMIDADE = 40; // Limite inferior da umidade
const LIMITE_SUPERIOR_LUMINOSIDADE = 60000; // Limite superior de luminosidade
const LIMITE_INFERIOR_LUMINOSIDADE = 0; // Limite inferior de luminosidade
const LIMITE_INFERIOR_PLUVIOSIDADE = 30; // Limite inferior de pluviosidade
const LIMITE_SUPERIOR_PLUVIOSIDADE = 90; // Limite superior de pluviosidade

// Função para calcular se há alertas
function calcularAlertas(temperatura, umidade, luminosidade, pluviosidade) {
    const alertaTemperatura = (temperatura > LIMITE_SUPERIOR_TEMP || temperatura < LIMITE_INFERIOR_TEMP) ? 1 : 0;
    const alertaUmidade = (umidade > LIMITE_SUPERIOR_UMIDADE || umidade < LIMITE_INFERIOR_UMIDADE) ? 1 : 0;
    const alertaLuminosidade = (luminosidade > LIMITE_SUPERIOR_LUMINOSIDADE || luminosidade < LIMITE_INFERIOR_LUMINOSIDADE) ? 1 : 0;
    const alertaPluviosidade = (pluviosidade > LIMITE_SUPERIOR_PLUVIOSIDADE || pluviosidade < LIMITE_INFERIOR_PLUVIOSIDADE) ? 1 : 0;
    return { alertaTemperatura, alertaUmidade, alertaLuminosidade, alertaPluviosidade };
}

// Rota para cadastrar uma nova unidade
app.post('/unidades', (req, res) => {
    const { nome, temperatura, umidade, luminosidade, latitude, longitude } = req.body;

    // Verifica se todos os campos necessários foram preenchidos
    if (!nome || temperatura === undefined || umidade === undefined || luminosidade === undefined  || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: "Todos os campos devem ser preenchidos." });
    }

    const { alertaTemperatura, alertaUmidade, alertaLuminosidade, alertaPluviosidade } = calcularAlertas(temperatura, umidade, luminosidade, pluviosidade);

    // Insere a unidade no banco de dados
    db.run(`INSERT INTO unidade (nome, temperatura, alerta_temperatura, umidade, alerta_umidade, luminosidade, alerta_luminosidade, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nome, temperatura, alertaTemperatura, umidade, alertaUmidade, luminosidade, alertaLuminosidade, latitude, longitude],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                id: this.lastID,
                nome,
                temperatura,
                alerta_temperatura: alertaTemperatura,
                umidade,
                alerta_umidade: alertaUmidade,
                luminosidade,
                alerta_luminosidade: alertaLuminosidade,
                pluviosidade,
                alerta_pluviosidade: alertaPluviosidade,
                latitude,
                longitude
            });
        });
});


// Rota para atualizar umidade, luminosidade e temperatura de uma unidade
app.put('/unidades/:id/dados', (req, res) => {
    const { id } = req.params;
    const { temperatura, umidade, luminosidade } = req.body;

    // Verifica se os valores foram fornecidos
    if (temperatura === undefined || umidade === undefined || luminosidade === undefined) {
        return res.status(400).json({ error: "Todos os campos (temperatura, umidade, luminosidade) devem ser fornecidos." });
    }

    // Calcula os alertas com base nos novos valores
    const { alertaTemperatura, alertaUmidade, alertaLuminosidade } = calcularAlertas(temperatura, umidade, luminosidade, 0);

    // Atualiza os valores no banco de dados
    db.run(
        `UPDATE unidade 
         SET temperatura = ?, alerta_temperatura = ?, 
             umidade = ?, alerta_umidade = ?, 
             luminosidade = ?, alerta_luminosidade = ? 
         WHERE id = ?`,
        [temperatura, alertaTemperatura, umidade, alertaUmidade, luminosidade, alertaLuminosidade, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: "Unidade não encontrada." });
            }
            res.status(200).json({ message: "Valores atualizados com sucesso." });
        }
    );
});

// Rota para atualizar a pluviosidade de uma unidade
app.put('/unidades/:id/pluviosidade', (req, res) => {
    const id = req.params.id;
    const { pluviosidade } = req.body;

    if (pluviosidade === undefined) {
        return res.status(400).json({ error: "Pluviosidade deve ser fornecida." });
    }

    // Atualiza a pluviosidade da unidade no banco de dados
    db.run(`UPDATE unidade SET pluviosidade = ? WHERE id = ?`,
        [pluviosidade, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: "Unidade não encontrada." });
            }
            res.status(200).json({ message: "Pluviosidade atualizada com sucesso." });
        });
});

// Rota para consultar todas as unidades
app.get('/unidades', (req, res) => {
    db.all(`SELECT * FROM unidade`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Rota para consultar uma unidade específica pelo ID
app.get('/unidades/:id', (req, res) => {
    const { id } = req.params;
    db.get(`SELECT * FROM unidade WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Unidade não encontrada." });
        }
        res.json(row);
    });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
