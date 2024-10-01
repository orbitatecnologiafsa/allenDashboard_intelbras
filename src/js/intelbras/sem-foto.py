from flask import Flask, request
from flask_cors import CORS
import json
import requests

app = Flask(__name__)
CORS(app, resources={r"/cadastrar": {"origins": "*"}})

username = 'admin'
password = 'vagalume1'
json_path = 'moradores.json'

def obter_proximo_id():
    try:
        with open(json_path, 'r') as file:
            data_id = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        data_id = []

    novo_id = data_id[-1]["id"] + 1 if data_id else 0
    return novo_id, data_id

@app.route('/cadastrar', methods=['POST'])
def receive_ip():
    data = request.get_json()

    # Verifica se as chaves essenciais estão presentes nos dados recebidos
    if data and all(k in data for k in ('ip', 'morador_nome')):
        ip_address = data['ip']
        morador_nome = data['morador_nome']

        # Obter o próximo ID
        novo_id, data_id = obter_proximo_id()
        data_id.append({"id": novo_id, "nome": morador_nome})

        # Salva os dados no arquivo JSON
        with open(json_path, 'w') as file:
            json.dump(data_id, file, indent=4)

        print(f'Novo ID: {novo_id}, Morador: {morador_nome}, IP: {ip_address}')
        
        # Enviar os dados para o leitor
        url = f"http://{ip_address}/cgi-bin/AccessUser.cgi?action=insertMulti"
        
        json_data = {
            "UserList": [
                {
                    "UserID": str(novo_id),
                    "UserName": str(morador_nome),
                    "UserType": 0,
                    "Authority": 2,
                    "ValidFrom": "2019-01-02 00:00:00",
                    "ValidTo": "2037-01-02 01:00:00"
                }
            ]
        }
        
        # Enviar os dados para o leitor
        status_code, response_content = send_user(url, json_data, username, password)

        print(f"Cadastro enviado para o leitor: {ip_address}")
        print("Status Code:", status_code)
        print("Response Content:", response_content)

        return "Cadastro realizado com sucesso", 200
    
    return "Dados inválidos", 400

def send_user(url, json_data, username, password):
    response = requests.post(url, auth=requests.auth.HTTPDigestAuth(username, password), json=json_data)
    return response.status_code, response.content

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
