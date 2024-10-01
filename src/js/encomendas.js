import { } from './firebase_config.js';
import { generateCode } from './gerarNumero.js';
import { mostrarNotificacao,confirmNotificacao } from './alerts.js';

//Receber codigo condominio 

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

//Alterar telas
// NAO SEI SE E A MELHOR FORMA DE FAZER MAS FUNCIONA D:

function telaInicial(){

    const tela_entregas = document.querySelector('.encomendas-body-pendentes');
    const tela_pendentes = document.querySelector('.encomendas-body-entregues');
    const header_left = document.querySelector('.header-left');
    const header_right = document.querySelector('.header-right');

    header_left.setAttribute('class', 'header-left active');
    if(header_left.hasAttribute('class', 'active')) {
        tela_entregas.style.display = 'block';
        header_right.setAttribute('class', 'header-right');
        tela_pendentes.display = 'none';
    }
}

const header_right_click = document.querySelector('.header-right');
header_right_click.addEventListener('click', () => {
    const tela_entregas = document.querySelector('.encomendas-body-pendentes');
    const tela_pendentes = document.querySelector('.encomendas-body-entregues');
    const header_left = document.querySelector('.header-left');
    const header_right = document.querySelector('.header-right');
    
    header_right.setAttribute('class', 'header-right active');
    if(header_right.hasAttribute('class', 'active')) {
        tela_entregas.style.display = 'none';
        header_left.setAttribute('class', 'header-left');
        tela_pendentes.style.display = 'block';
    }
});

const header_left_click = document.querySelector('.header-left');
header_left_click.addEventListener('click', () => {
    const tela_entregas = document.querySelector('.encomendas-body-pendentes');
    const tela_pendentes = document.querySelector('.encomendas-body-entregues');
    const header_left = document.querySelector('.header-left');
    const header_right = document.querySelector('.header-right');

    header_left.setAttribute('class', 'header-left active');
    if(header_left.hasAttribute('class', 'active')) {
        tela_pendentes.style.display = 'none';
        header_right.setAttribute('class', 'header-right');
        tela_entregas.style.display = 'block';
    }
});

telaInicial();

//Preencher dados encomendas

function converterData(timestampFirebase) {
    const data = timestampFirebase.toDate(); // Converte o Timestamp para Date

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
    const ano = data.getFullYear();

    const dataFormatada = `${dia}/${mes}/${ano}`;
   
    return dataFormatada;
}

function preencherDadosEncomendas(encomenda) {
    
    try {
       
        if(encomenda.status == 'pendente') {
            const pendentes_ul = document.querySelector('.pendentes-ul');

            const pendentes_li = document.createElement('li');
            pendentes_li.setAttribute('class', 'pendentes-li');

            const destinatario_p = document.createElement('p');
            destinatario_p.textContent = encomenda.destinatario;
            pendentes_li.appendChild(destinatario_p);

            const casa_p = document.createElement('p');
            casa_p.textContent = encomenda.casa;
            pendentes_li.appendChild(casa_p);

            const discriminacao_p = document.createElement('p');
            discriminacao_p.textContent = encomenda.discriminacao;
            if(discriminacao_p.textContent.length > 60) {
                discriminacao_p.setAttribute('class', 'discriminacao justify');
            }
            else{
                discriminacao_p.setAttribute('class', 'discriminacao');
            }
            pendentes_li.appendChild(discriminacao_p);

            const recebido_p = document.createElement('p');
            recebido_p.textContent = encomenda.recebido;
            pendentes_li.appendChild(recebido_p);

            const button_div = document.createElement('div');
            button_div.setAttribute('class', 'gerarQrCode');

            const button_gerarQrcode = document.createElement('button');
            button_gerarQrcode.setAttribute('id',encomenda.qr_code);
            button_gerarQrcode.setAttribute('class', 'gerarQrCode-btn');
            button_gerarQrcode.textContent = 'Gerar QrCode';

            button_gerarQrcode.addEventListener('click',  () => {
                document.querySelector('#qrCode').src =  "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encomenda.qr_code;
                document.querySelector('.popup-qrcode').style.display = 'block';  
               
            });

            button_div.appendChild(button_gerarQrcode);
            pendentes_li.appendChild(button_div);
            pendentes_ul.appendChild(pendentes_li);
        }
        else if(encomenda.status == 'entregue') {

            console.log('entrega entregue')
            const entregues_ul = document.querySelector('.entregues-ul');
            const entregues_li = document.createElement('li');
            entregues_li.setAttribute('class', 'entregues-li');

            const destinatario_p = document.createElement('p');
            destinatario_p.textContent = encomenda.destinatario;
            entregues_li.appendChild(destinatario_p);

            const casa_p = document.createElement('p');
            casa_p.textContent = encomenda.casa;
            entregues_li.appendChild(casa_p);

            const discriminacao_p = document.createElement('p');
            discriminacao_p.textContent = encomenda.discriminacao;
            if(discriminacao_p.textContent.length > 60) {
                discriminacao_p.setAttribute('class', 'discriminacao justify');
            }
            else{
                discriminacao_p.setAttribute('class', 'discriminacao');
            }
            entregues_li.appendChild(discriminacao_p);

            const recebido_p = document.createElement('p');
            recebido_p.textContent = encomenda.recebido;
            entregues_li.appendChild(recebido_p);

            const entregue_p = document.createElement('p');
           
            entregue_p.textContent = encomenda.entregue;
            entregues_li.appendChild(entregue_p);

            entregues_ul.appendChild(entregues_li);
        }
    }catch(error) {
        console.log(error);
    }    
}

//ver se algum documento foi adicionado, modificado ou removido do DB
firebase.firestore().collection("encomendas").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            if(change.doc.data().status == 'pendente' && change.doc.data().condominio == cod_cond) {
                const encomenda = {
                    destinatario: change.doc.data().destinatario,
                    casa: change.doc.data().casa,
                    discriminacao: change.doc.data().discriminacao,
                    recebido: converterData(change.doc.data().recebido),
                    status: change.doc.data().status,
                    qr_code: change.doc.data().qr_code
                }
                preencherDadosEncomendas(encomenda);
            }
            else if(change.doc.data().status == 'entregue' && change.doc.data().condominio == cod_cond) {
                const encomenda = {
                    destinatario: change.doc.data().destinatario, 
                    casa: change.doc.data().casa,
                    discriminacao: change.doc.data().discriminacao,
                    recebido: converterData(change.doc.data().recebido),
                    entregue: converterData(change.doc.data().entregue),
                    status: change.doc.data().status,
                    qr_code: change.doc.data().qr_code
                };
                preencherDadosEncomendas(encomenda);
            }
        }
        if (change.type === "modified") {
            if (change.doc.data().status == 'entregue' && change.doc.data().condominio == cod_cond) {
                const encomenda = {
                    destinatario: change.doc.data().destinatario, 
                    casa: change.doc.data().casa,
                    discriminacao: change.doc.data().discriminacao,
                    recebido: converterData(change.doc.data().recebido),
                    entregue: converterData(change.doc.data().entregue),
                    status: change.doc.data().status,
                    qr_code: change.doc.data().qr_code
                };
            
                const codigo_qr = change.doc.data().qr_code;
                const botao = document.getElementById(codigo_qr); // Encontra o botão pelo ID
            
                if (botao) {
                    const li = botao.closest('li'); // Encontra o 'li' pai do botão
                    if (li) {
                        li.remove(); // Remove o 'li' correspondente
                    }
                }
                preencherDadosEncomendas(encomenda);
            }            
        }
    });
});

//Modal

const button_add_encomenda = document.querySelector('#btn_adicionar_encomenda');
button_add_encomenda.addEventListener('click', () => {
    const modal = document.querySelector('.popup');
    modal.style.display = 'block';
});

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

//modal morador

const button_selecionar_morador = document.querySelector('#destinatario_input');
button_selecionar_morador.addEventListener('click', () => {
    const modal = document.querySelector('.popup-morador');
    modal.style.display = 'block';
    receberDadosMorador();
});

window.addEventListener("click", (event) => {
    const popup = document.querySelector(".popup-morador");
    if (event.target === popup) {
        popup.style.display = "none";
    }
});
document.getElementById("close-icon-morador").addEventListener("click", () => {
    const popups = document.getElementsByClassName("popup-morador");
    for (let i = 0; i < popups.length; i++) {
        popups[i].style.display = "none";
    }
});

//Modal qrcode

window.addEventListener("click", (event) => {
    const popup = document.querySelector(".popup-qrcode");
    if (event.target === popup) {
        popup.style.display = "none";
    }
});

document.getElementById("close-icon-qrcode").addEventListener("click", () => {
    const popups = document.getElementsByClassName("popup-qrcode");
    for (let i = 0; i < popups.length; i++) {
        popups[i].style.display = "none";
    }
})

// modal morador puxar do banco

async function receberDadosMorador(value) {

    const moradorDb = firebase.firestore().collection('moradores');
    const condominio = await getCondominio();
    const moradores = await moradorDb.where('condominio', '==', condominio).where('tipo', '==', 'Com chat').get();

    const morador_ul = document.querySelector('.morador-ul');
    morador_ul.innerHTML = '';
    document.getElementById('search_morador').value = '';
    
    if(value != null){
        const pesquisa_inicial = value;
        const pesquisa_final = pesquisa_inicial + '\uf8ff';

        const moradores = await moradorDb.where('condominio', '==', condominio).where('tipo', '==', 'Com chat').where('nome', '>=', pesquisa_inicial).where('nome', '<=', pesquisa_final).get();

        moradores.forEach(doc => {
            const morador = {
                nome: doc.data().nome,
                casa: doc.data().casa,
                cpf: doc.data().cpf
            };
            preencherDadosMorador(morador);
        });
        if(moradores.docs.length == 0){
            mostrarNotificacao('error','Morador não encontrado','Erro');
            value = null;
            receberDadosMorador(value);
        }
    }
    else{
        moradores.forEach(doc => {
            const morador = {
                nome: doc.data().nome,
                casa: doc.data().casa,
                cpf: doc.data().cpf
            };
            preencherDadosMorador(morador);
        });
    }
    
}

function preencherDadosMorador(morador) {

    const morador_ul = document.querySelector('.morador-ul');
    const morador_li = document.createElement('li');
    morador_li.setAttribute('class', 'morador-li');

    const nome_p = document.createElement('p');
    nome_p.textContent = morador.nome;
    nome_p.setAttribute('class', 'morador-li-p');
    
    morador_li.appendChild(nome_p);

    const casa_p = document.createElement('p');
    casa_p.textContent = morador.casa;
    casa_p.setAttribute('class', 'morador-li-p');
   
    morador_li.appendChild(casa_p);

    const button_select = document.createElement('button');
    button_select.setAttribute('class','morador-li-btn');
    button_select.textContent = 'Selecionar';
    button_select.addEventListener('click', () => {
        selecionarMorador(morador);
    })

    morador_li.appendChild(button_select);
    morador_ul.appendChild(morador_li);
}

let morador_para_salvar = {
    cpf: '',
    telefone: '',
}
async function selecionarMorador(morador_param) {

    const moradorDb = firebase.firestore().collection('moradores');
    const condominio = await getCondominio();
    const morador = await moradorDb.where('condominio', '==', condominio).where('cpf', '==', morador_param.cpf).get();

    const modal_morador = document.querySelector('.popup-morador');
    modal_morador.style.display = 'none';

    const input_morador = document.querySelector('#destinatario_input');
    input_morador.value = morador.docs[0].data().nome;

    const input_morador_casa = document.querySelector('#casa_input');
    input_morador_casa.value = morador.docs[0].data().casa;

    const morador_ul = document.querySelector('.morador-ul');

    morador_para_salvar = {
        cpf: morador.docs[0].data().cpf,
        telefone: morador.docs[0].data().whatsapp
    }
    morador_ul.innerHTML = '';
    document.getElementById('search_morador').value = '';
}

//Pesquisar morador

document.getElementById('search_morador').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); 
        receberDadosMorador(this.value.toUpperCase());
    }
});

//Salvar encomenda
document.querySelector('#form_encomenda').addEventListener('submit', async function(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const confirmado = await confirmNotificacao(
        'Tem certeza que deseja salvar a encomenda?',
        'Encomenda',
        'Encomenda salva!',
        'Encomenda cancelada!'
    );
    if(confirmado) {
        const input_casa = document.querySelector('#casa_input').value;
        const input_discriminacao = document.querySelector('#discriminacao_input').value;
        const input_recebido = document.querySelector('#recebido_input').value;
        const recebido_date = new Date(input_recebido);
        const input_destinatario = document.querySelector('#destinatario_input').value;
        const morador_cpf = morador_para_salvar.cpf;

        const encomenda = {
            casa: input_casa,
            discriminacao: input_discriminacao,
            recebido: recebido_date,
            entregue: '',
            telefone: morador_para_salvar.telefone,
            destinatario: input_destinatario,
            cpf: morador_cpf
        };

        await salvarEncomenda(encomenda);
    }
});

async function salvarEncomenda(encomenda) {
    try {
        const encomendaDb = firebase.firestore().collection('encomendas');
        const condominio = await getCondominio();
        const qr_code = await generateCode(encomenda.cpf);
        await encomendaDb.add({
            ...encomenda,
            condominio: condominio,
            status: 'pendente',
            qr_code: qr_code
        });
        document.querySelector('.popup').style.display = 'none';
        document.querySelector('.popup-morador').style.display = 'none';
        document.querySelector('#form_encomenda').reset();
       
    } catch (error) {
        console.error('Erro ao salvar a encomenda:', error);
        document.querySelector('#form_encomenda').reset();
        mostrarNotificacao('error','Houve um erro ao salvar a encomenda. Tente novamente.','Erro');
    }
}

//gerar qrCode

