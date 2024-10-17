import { } from './firebase_config.js';
import { } from 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';
import { mostrarNotificacao } from './alerts.js';

function getEmail() {
    return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                const userEmail = user.email;
                //console.log("Email do usuário autenticado:", userEmail);
                resolve(userEmail);
            } else {
                //console.log("Nenhum usuário autenticado.");
                reject("Nenhum usuário autenticado.");
            }
        });
    });
}


async function showName(){

    const userEmail = await getEmail();
    const userDb = await firebase.firestore().collection('condominio');
    const sindico = await userDb.where('email', '==', userEmail).get();
    const sindicoData = sindico.docs[0].data();
    const sindicoEmail = sindicoData.email;

    document.getElementById('user-name').innerHTML = " " + sindicoEmail;
    document.getElementById('user-name').style.color = '#FEEFAD';
    document.getElementById('user-name').style.fontWeight = 'bold';
    document.getElementById('user-name').style.textDecoration = 'underline';


}
const listaCompleta = []
const elementosPorPagina = 5;
let paginaAtual = 1;

function formatarWhasapp(whatsapp) {

    return whatsapp.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 ($2) $3-$4');

}
function formatarCPF(cpf) {
    let moradorCpf = cpf.replace(/\D/g, ''); 
    return moradorCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}


async function exibirElementos(morador) {
  

    const moradorLista = document.getElementById('moradorLista');
    moradorLista.innerHTML = ''; 
  
  

    const moradorItem = document.createElement('li');
    moradorItem.setAttribute('id','moradorItem');
    moradorItem.setAttribute('class','item-list');


    const moradorNome = document.createElement('p');
    moradorNome.setAttribute('class','item');
    moradorNome.textContent = morador.nome;

    const moradorCasa = document.createElement('p');
    moradorCasa.setAttribute('class','item');
    moradorCasa.textContent = morador.casa;
        
    const moradorCPF = document.createElement('p');
    moradorCPF.setAttribute('class', 'item');
    moradorCPF.textContent = morador.cpf;

    const moradorWhasapp = document.createElement('p');
    moradorWhasapp.setAttribute('class','item');
    moradorWhasapp.textContent = morador.whatsapp;

    const moradorTipo = document.createElement('p');
    moradorTipo.setAttribute('class','item');
    moradorTipo.textContent = morador.tipo;

    const imgDiv = document.createElement('div');
    imgDiv.setAttribute('class','img-div');

    const deleteImg = document.createElement('img');
    deleteImg.setAttribute('class','icon');
    deleteImg.setAttribute('id','btn_remover');
    deleteImg.addEventListener('click', () => {
        mostrarNotificacao('error',"Porfavor, entre em contato com o sindico","Permissão Insuficiente");
    })
    const editImg = document.createElement('img');
    editImg.setAttribute('class','icon');
    editImg.setAttribute('id','btn_editar');
    editImg.addEventListener('click', () => {
        mostrarNotificacao('error',"Porfavor, entre em contato com o sindico","Permissão Insuficiente");
    })
    imgDiv.appendChild(editImg);
    imgDiv.appendChild(deleteImg);


    const moradorFoto = document.createElement('img');
    moradorFoto.setAttribute('class','moradorFoto')
    const imgDiv2 = document.createElement('div');
    imgDiv2.setAttribute('class','img-div2')

    moradorFoto.src = '';
    let url;
    try {
        url = await baixarFoto(morador.email);
        moradorFoto.src = url;
        
    } catch (error) {
        console.error('Erro ao carregar a foto:', error);
        moradorFoto.alt = 'Imagem não disponível';
    }
    imgDiv2.appendChild(moradorFoto)
    if(morador.status == 'ativo'){
        editImg.setAttribute('src','../img/editar.svg');
        editImg.style.cursor = 'pointer';
        deleteImg.setAttribute('src','../img/remover.svg');
        deleteImg.style.cursor = 'pointer';
        moradorItem.style.backgroundColor = 'white';
    }
    moradorItem.appendChild(moradorNome);
    moradorItem.appendChild(moradorCasa);
    moradorItem.appendChild(moradorCPF);
    moradorItem.appendChild(moradorWhasapp);
    moradorItem.appendChild(moradorTipo);
    moradorItem.appendChild(imgDiv2);
    moradorItem.appendChild(imgDiv);
    moradorLista.appendChild(moradorItem);
}

async function getIp(){

    const db = firebase.firestore().collection('condominio');
    const email = await getEmail();
    const leitores = await db.where('email', '==', email).get();
    const leitoresData = leitores.docs[0];
    const ips = leitoresData.data().ips;

    return ips;
}


function editClient(id) {

    var url = './editar_morador.html?id=' + id;

    var options = 'width=' + screen.width + ',height=' + screen.height + ',top=0,left=0';

    var popup = window.open(url, 'Edição de Usuário', options);
  
    if (!popup || popup.closed || typeof popup.closed == 'undefined') {
        mostrarNotificacao('error',"Porfavor, entre em contato com o sindico","Problemas Tecnicos");
    }
}

async function deleteClient(id) {
    if(confirm('Tem certeza que deseja desativar o morador?')) {
        try {
            const moradorDb = firebase.firestore().collection('moradores');
            const moradorQuery = await moradorDb.where('ids', '==', id).get();

            if (!moradorQuery.empty) {
                const moradorDoc = moradorQuery.docs[0];
                await moradorDb.doc(moradorDoc.id).delete();

                const ips = await getIp();
                for (let i = 0; i < ips.length; i++) {
                    const ip = ips[i];
                    const id_array = Array.isArray(id) ? (id.length === 1 ? id[0] : id[i]) : id;

                    try {
                        const conexao = await axios.post(`http://${ip}/login.fcgi`, {
                            login: 'admin',
                            password: 'admin'
                        });

                        if (conexao.data.session) {
                            const session = conexao.data.session;
                            console.log('Sessão:', session);
                            const response = await axios.post(`http://${ip}/destroy_objects.fcgi?session=${session}`, {
                                object: "users",
                                where: {
                                    users: { id: id_array }
                                }
                            });

                            console.log(response.data);
                            alert('Morador desativado com sucesso!');
                        }
                    } catch (error) {
                        console.log('Erro na conexão ou ao destruir objeto:', error);
                    }
                }
                window.location.href = './main_screen.html';
            } else {
                console.log('Morador não encontrado.');
            }
        } catch (error) {
            console.log('Erro ao desativar morador:', error);
        }
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

const cod_cond = await cod_sindico()
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

showName();
firebase.firestore().collection("moradores").onSnapshot(async (snapshot) => {

    snapshot.docChanges().forEach((change) => {
        const moradorData = change.doc.data();

        if ((change.type === "added" || change.type === "modified") && moradorData.status === 'ativo' && moradorData.condominio === cod_cond) {
            const morador = {
                nome: moradorData.nome,
                casa: moradorData.casa,
                cpf: formatarCPF(moradorData.cpf),
                whatsapp: formatarWhasapp(moradorData.whatsapp),
                tipo: moradorData.tipo,
                email: moradorData.email,
                ids: change.doc.id,
                status: moradorData.status,
                tipo: moradorData.tipo
            };
            exibirElementos(morador)
        }
    });
});

document.getElementById('search_form').addEventListener('submit', function(event) {
    event.preventDefault();
   
    const input = document.getElementById('search');
    const value = input.value.trim().toUpperCase();
    console.log(value);
    mostrarMorador(value);
});

export { getEmail }

