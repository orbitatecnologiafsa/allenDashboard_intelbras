from flask import Flask, request
from flask_cors import CORS
import requests
import json
import base64
from PIL import Image
import io
import os

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

    if data and all(k in data for k in ('ip', 'morador_nome', 'foto')):
        ip_address = data['ip']
        morador_nome = data['morador_nome']
        foto_url = data['foto']

        # Obter o próximo ID
        novo_id, data_id = obter_proximo_id()
        data_id.append({"id": novo_id, "nome": morador_nome})

        with open(json_path, 'w') as file:
            json.dump(data_id, file, indent=4)

        print(f'Novo ID: {novo_id}, Morador: {morador_nome}, IP: {ip_address}, Foto: {foto_url}')
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
        
        status_code, response_content = send_user(url, json_data, username, password)

        print(f"Cadastro enviado para o leitor: {ip_address}")
        print("Status Code:", status_code)
        print("Response Content:", response_content)

        # Processar a imagem
        try:
            print("Baixando a imagem de:", foto_url)
            response = requests.get(foto_url)
            response.raise_for_status()  # Lança um erro se a requisição falhar
            
            img_data = response.content
            print("Imagem baixada com sucesso, tamanho:", len(img_data), "bytes")

            # Abrir a imagem com PIL e redimensionar
            img = Image.open(io.BytesIO(img_data)).convert("RGB")
            max_size = (600, 800)
            img.thumbnail(max_size, Image.LANCZOS)

            # Salva a imagem em memória
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=85)
            img_data = buffer.getvalue()
            
            if len(img_data) > 100 * 1024:  # 100KB
                return "Tamanho da imagem ainda excede 100KB", 400
            
            # Converter para Base64
            image_base64 = base64.b64encode(img_data).decode('utf-8')
            print(f"Imagem convertida para Base64 com sucesso, tamanho: {len(image_base64)} caracteres")

        except requests.RequestException as e:
            print(f"Erro ao baixar a imagem: {str(e)}")
            return f"Erro ao baixar a imagem: {str(e)}", 400
        except Exception as e:
            print(f"Erro ao processar a imagem: {str(e)}")
            return f"Erro ao processar a imagem: {str(e)}", 400

        # Enviar a imagem para o leitor
        url = f"http://{ip_address}/cgi-bin/AccessFace.cgi?action=insertMulti"
        digest_auth = requests.auth.HTTPDigestAuth(username, password)

        payload = json.dumps({
            "FaceList": [
                {
                    "UserID": str(novo_id),
                    "PhotoData": [image_base64]
                }
            ]
        })

        headers = {'Content-Type': 'application/json'}
        print(f"Enviando imagem para: {url}")
        
        response = requests.post(url, auth=digest_auth, headers=headers, data=payload)

        if response.status_code == 200 and response.text.strip() == "OK":
            print("Cadastro da face realizado com sucesso.")
            return "Cadastro processado com sucesso", 200
        else:
            print(f"Erro ao cadastrar a face: {response.status_code} - {response.text}")
            return f"Erro ao cadastrar a face: {response.status_code} - {response.text}", 500

    return "Dados inválidos", 400

def send_user(url, json_data, username, password):
    response = requests.post(url, auth=requests.auth.HTTPDigestAuth(username, password), json=json_data)
    return response.status_code, response.content

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
