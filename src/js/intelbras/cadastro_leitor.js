
import { } from '../firebase_config.js';
import { } from 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';


Swal.fire({
    title: 'Digite sua senha',
    input: 'password',  // Define o tipo do input como senha
    inputLabel: 'Senha',
    inputPlaceholder: 'Digite sua senha aqui',
    inputAttributes: {
        autocapitalize: 'off'
    },
    confirmButtonText: 'OK',
    showCancelButton: true,  // Adiciona um botão de cancelar
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
        if (!value) {
            return 'Você deve inserir uma senha!';
        }
        if (value !== 'orbitatecnologia') {
            return 'Senha incorreta!'; // Mensagem de erro se a senha estiver errada
        }
    }
}).then((result) => {
    if (result.isConfirmed) {
        Swal.fire({
            title: 'Senha correta',
            text: 'Você inseriu a senha correta.',
            icon: 'success'
        });
    } else if (result.isDismissed) {
        Swal.fire({
            title: 'Cancelado',
            text: 'Você cancelou a operação.',
            icon: 'error'
        });
        window.location.href = "./main_screen.html";
    }
});

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


const form = document.querySelector('#aparelhos-text');
form.addEventListener('submit', (event) => {
    event.preventDefault();
    const quantidade_aparelhos = document.getElementById('aparelhos_qnt').value;
    console.log(quantidade_aparelhos);
    document.getElementById('aparelhos-text').style.display = 'none';
    document.getElementById('aparelhos-cadastrar-ip').style.display = 'block';
    cadastrarIps(quantidade_aparelhos);
});

const btn_voltar = document.querySelector('#btn_voltar');
btn_voltar.addEventListener('click', () => {
    document.getElementById('aparelhos-ip').innerHTML = '';
    document.getElementById('aparelhos-text').style.display = 'block';
    document.getElementById('aparelhos-cadastrar-ip').style.display = 'none';
});

function cadastrarIps(quantidade_aparelhos){

    console.log(quantidade_aparelhos);
    const ul = document.getElementById('aparelhos-ip');

    for (let i = 0; i < quantidade_aparelhos; i++) {
        const li = document.createElement('li');
        li.setAttribute('class', 'ip_leitor_li');
        const label = document.createElement('label');
        label.textContent = `IP do leitor facial ${i + 1}:`;
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'IP do leitor facial';
        input.required = true;
        input.setAttribute('class', 'ip_leitor_input');

        const label_nome = document.createElement('label');
        label_nome.textContent = `Nome do leitor facial ${i + 1}:`;
        const input_nome = document.createElement('input');
        input_nome.type = 'text';
        input_nome.placeholder = 'Nome do leitor facial';
        input_nome.required = true;
        input_nome.setAttribute('class', 'ip_leitor_nome_input');

        li.appendChild(label);
        li.appendChild(input);
        li.appendChild(label_nome);
        li.appendChild(input_nome);

        ul.appendChild(li);
    }
}

const btn_confirmar_ip = document.querySelector('#btn_confirmar_ip');
btn_confirmar_ip.addEventListener('click', () => {
    if(confirm('Tem certeza que deseja salvar as configurações?')) {
        salvarIpsEnomes();  
        
        document.getElementById('aparelhos-cadastrar-ip').style.display = 'none';
        document.getElementById('aparelhos-text').style.display = 'block';
    }
});
async function salvarIpsEnomes() {
    const ul = document.getElementById('aparelhos-ip');
    const novosIps = [];
    const novosNomes = [];

    for (let i = 0; i < ul.children.length; i++) {
        const inputIp = ul.children[i].querySelector('.ip_leitor_input');
        const inputNome = ul.children[i].querySelector('.ip_leitor_nome_input');
        novosIps.push(inputIp.value);
        novosNomes.push(inputNome.value);
    }

    const email = await getEmail();

    const db = firebase.firestore().collection('condominio');
    const sindico = await db.where('email', '==', email).get();
    const sindicoDoc = sindico.docs[0];
    const id = sindicoDoc.id;

    try {
        const sindicoData = sindicoDoc.data();
        const ipsExistentes = sindicoData.ips || [];
        const nomesExistentes = sindicoData.nomes_leitor || [];

        const ipsAtualizados = [...ipsExistentes, ...novosIps];
        const nomesAtualizados = [...nomesExistentes, ...novosNomes];

        await firebase.firestore().collection('condominio').doc(id).set({
            ips: ipsAtualizados,
            nomes_leitor: nomesAtualizados
        }, { merge: true });

        alert('Configurações salvas com sucesso!');
        verificarIps();

        window.location.reload();
    } catch (error) {
        console.error('Erro ao salvar as configurações:', error);
    }
}



async function preencherIps(){

    const db = firebase.firestore().collection('condominio');
    const email = await getEmail();

    const sindico = await db.where('email', '==', email).get();
    const sindicoDoc = sindico.docs[0];
    
    const nomes_leitor = sindicoDoc.data().nomes_leitor;

    const ips = sindicoDoc.data().ips;
    const ul = document.getElementById('ips_leitor');

    for (let i = 0; i < ips.length; i++) {
        const li = document.createElement('li');
        li.setAttribute('class', 'ip_leitor');

        const label = document.createElement('label');
        label.textContent = `IP do leitor facial ${nomes_leitor[i]}:`;

        const div = document.createElement('div');
        div.setAttribute('class', 'ip_leitor_div');

        const input = document.createElement('input');
        input.setAttribute('id', `ip_leitor_${i}`)
        input.type = 'text';
        input.value = ips[i];
        input.readOnly = true;

        const button = document.createElement('button');
        button.innerHTML = '<i class="fa-solid fa-wifi" id="i_conexao"></i>';
        button.addEventListener('click', () => {
            testarConexao(i);
        });
        button.setAttribute('id', `btn_testar_${i}`);
        button.setAttribute('class', 'btn_testar');
        div.appendChild(input);
        div.appendChild(button);

        li.appendChild(label);
        li.appendChild(div);

        ul.appendChild(li);
    }
}

function modo_vizualizacao(){
    btn_confirm_alterar.classList.remove('active');
    const btn_editar = document.getElementById('btn_alterar');
    btn_editar.style.display = 'none';
    const ul = document.getElementById('ips_leitor');
    for (let i = 0; i < ul.children.length; i++) {
        const input = ul.children[i].querySelector('input');
        input.readOnly = true;
    }
    const title = document.getElementById('title_l');
    title.textContent = 'Configurações Leitor';
}
function modo_edicao() {

    const ul = document.getElementById('ips_leitor');
    for (let i = 0; i < ul.children.length; i++) {
        const input = ul.children[i].querySelector('input');
        input.readOnly = false;
    }
    const title = document.getElementById('title_l');
    title.textContent = 'Modo de Edição';
    const btn_editar = document.getElementById('btn_alterar');
    btn_editar.style.display = 'block';

    const btn_confirm_alterar = document.getElementById('btn_confirm_alterar');
    btn_confirm_alterar.setAttribute('class','active');
    
}
const btn_confirm_alterar = document.getElementById('btn_confirm_alterar');
btn_confirm_alterar.addEventListener('click', () => {
   if(btn_confirm_alterar.classList.contains('active')) {
       modo_vizualizacao();
   }
   else{
       modo_edicao();
   }
})
async function editarIps() {

    const db = firebase.firestore().collection('condominio');
    const email = await getEmail();

    const sindico = await db.where('email', '==', email).get();
    const sindicoDoc = sindico.docs[0];
    const id = sindicoDoc.id;

    const ips_ul = document.getElementById('ips_leitor');

    const ips = [];
    for (let i = 0; i < ips_ul.children.length; i++) {
        const input = ips_ul.children[i].querySelector('input');
        const ip = input.value;
        ips.push(ip);
    }

    if(confirm('Tem certeza que deseja salvar as configurações?')) {
        try {
            await firebase.firestore().collection('condominio').doc(id).update({
                ips: ips
            });
            alert('Configurações salvas com sucesso!');
            modo_vizualizacao();
            
        } catch (error) {
            console.error('Erro ao salvar as configurações:', error);
        } 
    }
    else{
        modo_edicao();
    }   
}

document.getElementById('btn_alterar').addEventListener('click', () => {
    editarIps();
})
async function verificarIps() {
    const db = firebase.firestore().collection('condominio');
    const email = await getEmail(); 
    const sindico = await db.where('email', '==', email).get();
    const sindicoDoc = sindico.docs[0];
    
    if (sindicoDoc) {
        const sindicoData = sindicoDoc.data();
        document.getElementById('content').style.display = 'flex';
        if (sindicoData.ips == null) {
            document.getElementById('aparelhos').style.display = 'flex';
            document.getElementById('aparelhos-cadastrados').style.display = 'none';
        } else {
            document.getElementById('aparelhos').style.display = 'none';
            document.getElementById('content-container').style.display = 'block';
            preencherIps();
        }
    } else {
        return false;
    }
}

document.getElementById('content').style.display = 'none';
verificarIps();


function adicionarLeitores(){

    document.getElementById('aparelhos').style.display = 'flex';
    document.getElementById('content-container').style.display = 'none';
    document.getElementById('aparelhos-cadastrados').style.display = 'none';

}
btn_adicionar.addEventListener('click', () => {
    adicionarLeitores();
})

