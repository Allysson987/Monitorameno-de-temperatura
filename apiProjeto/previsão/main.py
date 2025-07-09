from fastapi import FastAPI
from pydantic import BaseModel
import sqlite3
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, AdaBoostRegressor
from sklearn.neighbors import KNeighborsRegressor
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from joblib import load     

import numpy as np
import joblib

app = FastAPI()

modelos = []

class Modelos(BaseModel):
    Id: int
    Temperatura: float
    umidade: float
    luminosidade: float
    pluviosidade: float 

def banco():
    conn = sqlite3.connect("modelos.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS modelos (
            id INTEGER PRIMARY KEY,
            temperatura REAL,
            umidade REAL,
            luminosidade REAL
            pluvioisidade REAL
        )
    """)
    conn.commit()
    conn.close()

banco()

@app.get("/") 
def exibir():
    return {"mensagem": "API de Monitoramento de Temperatura"}

@app.post("/modelos")
def adicionar_modelo(modelo: Modelos):
    modelos.append(modelo.dict())

    conn = sqlite3.connect("modelos.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO modelos (id, pluviosidade,temperatura, umidade, luminosidade)
        VALUES (?, ?, ?, ?)
    """, (modelo.Id,modelo.pluviosidade, modelo.Temperatura, modelo.umidade, modelo.luminosidade))
    conn.commit()
    conn.close()

    return {"mensagem": "Modelo salvo na memória e no banco", "dados": modelo}

@app.get("/modelos")
def listar_modelos():
    return {"modelos": modelos} 
@app.get("/treinar/{id}")
def treinarModelosbanco(id: int):
    conn = sqlite3.connect("modelos.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM modelos WHERE id = ?", (id,))
    modelo = cursor.fetchall()
    if modelo:
        base=pd.DataFrame(modelo, columns=["id","pluviosidade", "temperatura", "umidade", "luminosidade"])
        X = base[["temperatura", "umidade", "luminosidade"]]
        y = base["pluviosidade"]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        modelos=RandomForestRegressor( random_state=42)
        modelos.fit(X_train, y_train)
        y_pred = modelos.predict(X_test)
        mae  = mean_absolute_error(y_test, y_pred)
        mse  = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        r2   = r2_score(y_test, y_pred)
        print(f"MAE:  {mae:.3f}")
        print(f"MSE:  {mse:.3f}")
        print(f"RMSE: {rmse:.3f}")
        print(f"R²:   {r2:.3f}")
        nome=base["id"].iloc[0]
        filename = f"{nome.replace(' ', '_')}.joblib"
        joblib.dump(modelos, filename)
        print(f"Modelo salvo como: {filename}")
    conn.close()

    if modelo:
        return {"modelo": modelo}
    else:
        return {"mensagem": "Modelo não encontrado"}

if __name__ == "__main__":
    import uvicorn
    port = 8000
    print(f"Servidor rodando na porta {port}")
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)
