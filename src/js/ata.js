import { } from './firebase_config.js';
import { mostrarNotificacao,confirmNotificacao } from './alerts.js';

function getEmail() {
    return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                const userEmail = user.email;
                resolve(userEmail);
            } else {
                console.log("Nenhum usuário autenticado.");
                reject("Nenhum usuário autenticado.");
            }
        });
    });
}

async function getCondominio() {
    try {
        const userEmail = await getEmail();
        const userDb = firebase.firestore().collection('condominio');
        const sindico = await userDb.where('email', '==', userEmail).get();
        const sindicoData = sindico.docs[0].data();
        const cod_condominio = sindicoData.cod_Condominio;
        return cod_condominio;
    } catch (error) {
        return null;
    }
}

//Gerar codigo aleatorio:
function gerarCodigoAleatorio(comprimento = 32) {
    
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    
    let codigo = '';
    
    for (let i = 0; i < comprimento; i++) {
        const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
        codigo += caracteres[indiceAleatorio];
    }
    
    return codigo;
}
//COnverter data 
function converterData(data_user) {


    const data = new Date(data_user);

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
    const ano = data.getFullYear();
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');

    const dataFormatada = `${dia}/${mes}/${ano} - ${horas}:${minutos}`;
   
    return dataFormatada;

}

const cod_cond = await getCondominio();
const form = document.querySelector('#ata-form');
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const confirmado = await confirmNotificacao(
        'Tem certeza que deseja registrar esta ocorrencia?',
        'Registrar ocorrencia',
        'Ocorrencia registrada',
        'Ocorrencia cancelada'
    );
    if(confirmado) {
        const enviar_botao = document.querySelector('#enviar_botao');
        enviar_botao.style.display = 'none';
        const ata = {
            porteiro: document.querySelector('#nome_porteiro').value,
            data_ocorrido: document.querySelector('#data_ocorrido').value,
            turno: document.querySelector('#turno').value,
            texto_ata: document.querySelector('#texto_ata').value,
            problema: document.querySelector('#problema').value,
            codigo: gerarCodigoAleatorio(16),
            status : 'Pendente',
            feedback: 'Nenhum',
            codigo_cod: cod_cond
        };
    
        const ataDb = firebase.firestore().collection('ata');
        ataDb.add(ata);
        document.querySelector('#ata-form').reset();
        if(enviar_botao.style.display = 'none') {
            enviar_botao.style.display = 'block';
        }
    }
    
});

//Puxar dados ata

firebase.firestore().collection("ata").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && change.doc.data().codigo_cod == cod_cond) {
            console.log("Novo documento adicionado: ", change.doc.data());
            const ata = change.doc.data();
            adicionarAtaFeedBack(ata);
        }
        if (change.type === "modified"  && change.doc.data().codigo_cod == cod_cond) {
            console.log("Documento modificado: ", change.doc.data());
            const ata = change.doc.data();
            alterarModal(ata);
            alterarAtaFeedBack(ata);
            
        }
        if (change.type === "removed"  && change.doc.data().codigo_cod == cod_cond) {
            console.log("Documento removido: ", change.doc.data());
        }
    });
});

async function adicionarAtaFeedBack(ata){

    const ul = document.querySelector('.feedback-ul');

    const li = document.createElement('li');
    li.setAttribute('class', 'feedback-item');

    const div_feedback_content = document.createElement('div');
    div_feedback_content.setAttribute('class', 'feedback-content');

    const div_user_info = document.createElement('div');
    div_user_info.setAttribute('class', 'user-info');

    const span_user_name = document.createElement('span');
    span_user_name.setAttribute('class', 'user-name');
    span_user_name.textContent = ata.porteiro;

    div_user_info.appendChild(span_user_name);

    const p_data = document.createElement('p');
    p_data.setAttribute('class', 'date');
    p_data.textContent = converterData(ata.data_ocorrido);

    const div_feedback_status = document.createElement('div');
    div_feedback_status.setAttribute('class', 'feedback-status');

    const p_status = document.createElement('p');
    const texto_inicial = document.createTextNode('Status: ');

    const span_status = document.createElement('span');

    if(ata.status == 'Pendente') {
        span_status.textContent = 'Pendente';
        span_status.setAttribute('class', 'pendente');
    }
    else if(ata.status == 'Resolvido') {
        span_status.textContent = 'Resolvido';
        span_status.setAttribute('class', 'resolvido');
    }

    p_status.appendChild(texto_inicial);
    p_status.appendChild(span_status);
    div_feedback_status.appendChild(p_status);

    const button = document.createElement('button');
    button.className = 'reply-button';
    button.id = ata.codigo; 

    const textoBotao = document.createTextNode('Visualizar ');

    const icone = document.createElement('i');
    icone.className = 'far fa-eye'; 

    button.appendChild(textoBotao);
    button.appendChild(icone);
    button.addEventListener('click', () => {
        abrirModal(ata);
    })
    div_feedback_status.appendChild(button);

    div_feedback_content.appendChild(div_user_info);
    div_feedback_content.appendChild(p_data);
   
    li.appendChild(div_feedback_content);
    li.appendChild(div_feedback_status);

    ul.appendChild(li);
}

//Modificar ATA

function alterarAtaFeedBack(ata) {
    
    const button = document.getElementById(ata.codigo);

    if (button) {
        
        const closestDiv = button.closest('div');

        if (closestDiv) {
            const closestSpan = closestDiv.querySelector('span');

            if (closestSpan) {
                closestSpan.innerHTML = ata.status;
                closestSpan.setAttribute('class',ata.status.toLowerCase());
            } 
        } 
    } 
}
//Mostrar ata no modal
//Modal

function abrirModal(param){ 

    console.log(param);
    const popup = document.querySelector('.popup');
    popup.style.display = 'block';

    document.querySelector('#nome_porteiro_popup').innerHTML = param.porteiro;
    document.querySelector('#data_popup').innerHTML = converterData(param.data_ocorrido); 
    document.querySelector('#turno_popup').innerHTML = param.turno;
    document.querySelector('#texto_ata_popup').value = param.texto_ata;
    document.querySelector('#problema_popup').innerHTML = param.problema;
    document.querySelector('#status_popup').innerHTML = param.status;
    document.querySelector('#feedback_popup').innerHTML = param.feedback;
} 
function alterarModal(param){
    document.querySelector('#nome_porteiro_popup').innerHTML = param.porteiro;
    document.querySelector('#data_popup').innerHTML = converterData(param.data_ocorrido); 
    document.querySelector('#turno_popup').innerHTML = param.turno;
    document.querySelector('#texto_ata_popup').value = param.texto_ata;
    document.querySelector('#problema_popup').innerHTML = param.problema;
    document.querySelector('#status_popup').innerHTML = param.status;
    document.querySelector('#feedback_popup').innerHTML = param.feedback;
}
window.addEventListener("click", (event) => {
    const popup = document.querySelector(".popup");
    if (event.target === popup) {
        popup.style.display = "none";
    }
});
document.getElementById("close-icon").addEventListener("click", () => {
    const popups = document.getElementsByClassName("popup");
    for (let i = 0; i < popups.length; i++) {
        popups[i].style.display = "none";
    }
});