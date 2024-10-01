import { } from './firebase_config.js';
import { mostrarNotificacao, confirmNotificacao } from './alerts.js';

function getEmail() {
    return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                const userEmail = user.email;
                resolve(userEmail);
            } else {
                reject("Nenhum usuário autenticado.");
            }
        });
    });
}

function formatarWhasapp(whatsapp) {
    return whatsapp.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 ($2) $3-$4');
}

function formatarCPF(cpf) {
    let moradorCpf = cpf.replace(/\D/g, '');
    return moradorCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

async function exibirElementos(novosMoradores) {
    moradorLista.innerHTML = '';

    for (const morador of novosMoradores) {
        const moradorItem = document.createElement('li');
        moradorItem.setAttribute('id', 'moradorItem');
        moradorItem.setAttribute('class', 'item-list');

        const moradorNome = document.createElement('p');
        moradorNome.setAttribute('class', 'item');
        moradorNome.textContent = morador.nome;

        const moradorCasa = document.createElement('p');
        moradorCasa.setAttribute('class', 'item');
        moradorCasa.textContent = morador.casa;

        const moradorCPF = document.createElement('p');
        moradorCPF.setAttribute('class', 'item');
        moradorCPF.textContent = morador.cpf;

        const moradorWhasapp = document.createElement('p');
        moradorWhasapp.setAttribute('class', 'item');
        moradorWhasapp.textContent = morador.whatsapp;

        const moradorFotoDiv = document.createElement('div');
        moradorFotoDiv.setAttribute('class', 'img-div-morador');

        const moradorFoto = document.createElement('img');
        moradorFoto.className = 'item foto_pendente'; // Usando className para definir várias classes
        moradorFoto.src = '';

        let url;
        try {
            url = await baixarFoto(morador.email);
            moradorFoto.src = url;
            moradorFotoDiv.appendChild(moradorFoto);
        } catch (error) {
            console.error('Erro ao carregar a foto:', error);
            moradorFoto.alt = 'Imagem não disponível';
        }

        const imgDiv = document.createElement('div');
        imgDiv.setAttribute('class', 'img-div');

        const deleteImg = document.createElement('img');
        deleteImg.setAttribute('class', 'icon');
        deleteImg.setAttribute('id', 'btn_deletar');
        deleteImg.setAttribute('src', '../img/remover.svg');
        deleteImg.setAttribute('onclick', `deleteClient('${morador.ids}')`); // Alterando para usar aspas simples
        deleteImg.setAttribute('style', 'cursor: pointer;');

        deleteImg.addEventListener('click', function() {
            deleteClient(morador.cpf);
        });

        const aprovarImg = document.createElement('img');
        aprovarImg.setAttribute('class', 'icon');
        aprovarImg.setAttribute('id', 'btn_editar');
        aprovarImg.setAttribute('src', '../img/check.png');
        aprovarImg.setAttribute('style', 'cursor: pointer;');

        aprovarImg.addEventListener('click', function() {
            aprovar(morador, url);
        });

        imgDiv.appendChild(aprovarImg);
        imgDiv.appendChild(deleteImg);

        moradorItem.appendChild(moradorNome);
        moradorItem.appendChild(moradorCasa);
        moradorItem.appendChild(moradorCPF);
        moradorItem.appendChild(moradorWhasapp);
        moradorItem.appendChild(moradorFotoDiv);
        moradorItem.appendChild(imgDiv);
        moradorLista.appendChild(moradorItem);
    }
}

async function cod_sindico() {
    const userEmail = await getEmail();
    const userDb = await firebase.firestore().collection('condominio');
    const sindico = await userDb.where('email', '==', userEmail).get();
    const sindicoData = sindico.docs[0].data();
    const codigoSindico = sindicoData.cod_Condominio;

    return codigoSindico;
}

let todosMoradores = [];
let cod_cond = await cod_sindico();
firebase.firestore().collection("moradores").onSnapshot(async (snapshot) => {
    const novosMoradores = [];
    snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && change.doc.data().status === 'pendente' && change.doc.data().tipo === 'Com chat' && change.doc.data().condominio === cod_cond) {
            const morador = {
                nome: change.doc.data().nome,
                casa: change.doc.data().casa,
                cpf: formatarCPF(change.doc.data().cpf),
                whatsapp: formatarWhasapp(change.doc.data().whatsapp),
                tipo: change.doc.data().tipo,
                email: change.doc.data().email,
                ids: change.doc.id
            };
            todosMoradores.push(morador);
        }
        if (change.type === "modified") {
            console.log("Documento modificado: ", change.doc.data());
        }
        if (change.type === "removed") {
            console.log("Documento removido: ", change.doc.data());
        }
    });

    await exibirElementos(todosMoradores);
});

async function baixarFoto(email) {
    try {
        const storage = await firebase.storage();
        const path = `${cod_cond}/${email}`;
        const photoRef = storage.ref(path);
        const url = await photoRef.getDownloadURL();
        console.log(url);
        return url;
    } catch (error) {
        console.error("Erro ao baixar a foto, sem url:", error);
    }
}

async function aprovar(morador, foto) {
    const popup = document.querySelector('.popup');
    popup.style.display = 'block';

    const checkbox_ul = document.getElementById('checkbox_group');
    checkbox_ul.innerHTML = '';

    const db_cond = await firebase.firestore().collection('condominio')
        .where('cod_Condominio', '==', cod_cond).get();

    db_cond.forEach(doc => {
        const data = doc.data();

        if (data.ips) {
            data.ips.forEach(ip => {
                const listItem = document.createElement('li');
                const index_ip = data.ips.indexOf(ip);

                const checkbox = document.createElement('input');
                checkbox.setAttribute('id', ip);
                checkbox.type = 'checkbox';
                checkbox.value = ip;
                checkbox.classList.add('ip-checkbox');

                const label = document.createElement('label');
                label.htmlFor = ip;
                label.textContent = `Leitor: ${data.nomes_leitor[index_ip]}`;

                listItem.appendChild(checkbox);
                listItem.appendChild(label);

                checkbox_ul.appendChild(listItem);
            });
        }
    });

    document.getElementById('btn_confirmar').addEventListener('click', async (event) => {
        event.preventDefault();
        const checkboxes = document.querySelectorAll('.ip-checkbox');
        const selectedIps = Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
    
        if (selectedIps.length === 0) {
            mostrarNotificacao('error', 'Please select at least one reader.', 'Error');
        } else {
            console.log('Confirmation completed successfully.');
            await enviarCadastroPy(selectedIps, morador);
        }
    });

    async function enviarCadastroPy(ips, morador) {
        try {
            const foto = await baixarFoto(morador.email);
            for (const ip of ips) {
                const response = await fetch(`http://localhost:8080/cadastrar`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ip: ip,
                        morador_nome: morador.nome,
                        foto: foto
                    }),
                });

                if (response.ok) {
                    console.log(`Cadastro enviado com sucesso para o leitor: ${ip}`);
                } else {
                    const errorContent = await response.text();
                    console.error(`Falha ao enviar cadastro para o leitor: ${ip}. Status: ${response.status}. Resposta: ${errorContent}`);
                }
                if (response.status === 200) {
                    mostrarNotificacao("success", "Cadastro realizado com sucesso!", "Cadastro");
                } else {
                    mostrarNotificacao("error", "Erro ao realizar o cadastro. Tente novamente.", "Cadastro");
                }
            }
        } catch (error) {
            console.error('Erro ao enviar cadastro:', error);
        }
    }

    document.getElementById('btn_cancelar').addEventListener('click', () => {
        popup.style.display = 'none';
    });
}

export { todosMoradores };
