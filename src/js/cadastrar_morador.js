
import { } from './firebase_config.js';


const button = document.getElementById('tipoSelecionado');
const voltarButton = document.getElementById('btn_voltar');

button.addEventListener('click', function(){
    const select = document.getElementById('select_morador');
    const selectedValue = select.options[select.selectedIndex].value;

    if(selectedValue === 'Com chat') {
        
        document.getElementById('zap').style.display = 'block';
        document.getElementById('cpf').style.display = 'block';
        document.getElementById('tipo_morador').style.display = 'none';
        document.getElementById('section-container').style.display = 'flex';
        document.getElementById('enviarBotao').addEventListener('click', function(){
            comChat();
        });
        
        
    }else if(selectedValue === 'Sem chat') {
        document.getElementById('tipo_morador').style.display = 'none';
        document.getElementById('section-container').style.display = 'flex';
        document.getElementById('zap').style.display = 'none';
        document.getElementById('cpf').style.display = 'none';
        document.getElementById('email_senha').style.display = 'none';
        document.getElementById('section').style.height = '60vh';
        document.getElementById('enviarBotao').addEventListener('click', function(){
            semChat();
        });
    }
});

voltarButton.addEventListener('click', function(){
    document.getElementById('section-container').style.display = 'none';
    document.getElementById('section').style.height = '90vh';
    document.getElementById('tipo_morador').style.display = 'flex';
});

async function semChat() {
    
   
    const cod_condominio = await getCondominio();

    const morador = {
        nome : document.getElementById("nome").value.toUpperCase(),
        casa : document.getElementById("casa").value,
        tipo : document.getElementById("select_morador").value,
        condominio : cod_condominio,
        status: "ativo",
        fotos: "Não"
    };

    if(morador.nome == "" || morador.casa == "" || document.getElementById('inputImagem').files.length == 0) {
        alert('Preencha todos os campos');
        document.getElementById('enviarBotao').style.display = 'block';
        return;
    }

    await cadastrarMorador(morador);
}
async function comChat() {
    const cod_condominio = await getCondominio();
    
    const morador = {
        nome: document.getElementById("nome").value.toUpperCase(),
        cpf: document.getElementById("cpf_morador").value,
        whatsapp: document.getElementById("whatsapp").value,
        casa: document.getElementById("casa").value,
        tipo: document.getElementById("select_morador").value,
        email: document.getElementById("email").value,
        condominio: cod_condominio,
        status: "ativo",
        foto: "Não"
    };
    console.log(morador);
    if (morador.nome === "" || morador.cpf === "" || morador.whatsapp === "" || morador.casa === "" || morador.condominio === "" || morador.tipo === "" || document.getElementById('inputImagem').files.length === 0) {
        alert('Preencha todos os campos');
        document.getElementById('enviarBotao').style.display = 'block';
        return;
    }

    let valid = true;

    if (!validarCPF(morador.cpf)) {
        document.getElementById('cpf-erro').style.display = 'block';
        document.getElementById('cpf-erro').innerHTML = 'CPF inválido';
        valid = false;
    } else {
        document.getElementById('cpf-erro').style.display = 'none';
    }

    if (!validarNumeroWhatsapp(morador.whatsapp)) {
        document.getElementById('numero-erro').style.display = 'block';
        document.getElementById('numero-erro').innerHTML = 'Número inválido';
        valid = false;
    } else {
        document.getElementById('numero-erro').style.display = 'none';
    }

    if (!valid) {
        document.getElementById('enviarBotao').style.display = 'block';
        return;
    }

    try {
        const cpfExistente = await cpfJaCadastrado(morador.cpf);
        if (cpfExistente) {
            document.getElementById('cpf-erro').style.display = 'block';
            document.getElementById('cpf-erro').innerHTML = 'CPF já cadastrado';
            document.getElementById('enviarBotao').style.display = 'block';
            return;
        } else {
            document.getElementById('cpf-erro').style.display = 'none';
        }

        await cadastrarMorador(morador);
        alert("Morador cadastrado com sucesso!");
    } catch (error) {
        alert("Erro ao Cadastrar Morador");
        document.getElementById('enviarBotao').style.display = 'block';
    }
}


async function cpfJaCadastrado(cpf) {
    try {
        console.log(cpf);
        const moradorDb = firebase.firestore().collection('moradores');
        const morador = await moradorDb.where('cpf', '==', cpf).get();
        const condominio = await getCondominio();

        console.log(morador.docs[0].data().condominio);
        console.log(condominio);


        if(morador.docs[0].data().condominio == condominio){
            return true;
        }
        return false;
    } catch (error) {
        return false; 
    }
}


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
mostrarLeitores();
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


async function cadastrarMorador(morador) {
    document.getElementById('enviarBotao').style.display = 'none';

    try {
        // Adicionar o morador ao Firestore
        const moradorDb = firebase.firestore().collection('moradores');
        await moradorDb.add(morador);
        // Recuperar o ID do morador
        const ultimoMorador = await moradorDb.where('nome', '==', morador.nome).get();
        if (ultimoMorador.empty) {
            throw new Error('Morador não encontrado após adicionar');
        }
        const moradorId = ultimoMorador.docs[0].id;

        const selectedIps = await getIp();
        console.log('Selected IPs:', selectedIps);

        for (const ip of selectedIps) {
            const session = await conectarFaceID(ip); // Conectar ao leitor

            if (session) {
                await createUser(moradorId, ip, session);  // Cadastrar no leitor
            } else {
                alert(`Erro ao conectar ao leitor ${ip}`);
            }
        }

        alert('Morador criado com sucesso!');

        document.getElementById('nome').value = '';
        document.getElementById('cpf').value = '';
        document.getElementById('casa').value = '';
        document.getElementById('whatsapp').value = '';
        //document.getElementById('inputImagem').value = '';
        document.getElementById('tipo_morador').value = 'C';
        document.getElementById('enviarBotao').style.display = 'block';     

    } catch (error) {
        console.error('Erro ao cadastrar morador:', error);
        alert('Erro ao cadastrar morador. Por favor, tente novamente.');
    } finally {
        document.getElementById('enviarBotao').style.display = 'block';
    }
}



function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }

    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;

    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;

    if (remainder !== parseInt(cpf.charAt(10))) return false;

    return true;
}
function validarNumeroWhatsapp(numero) {
    
    const regex = /^(\d{2})(\d{9})$/;

    return true;
}
async function mostrarLeitores() {
    const db = firebase.firestore().collection('condominio');
    const email = await getEmail();
    const leitores = await db.where('email', '==', email).get();
    const leitoresData = leitores.docs[0];
    const leitoresDb = leitoresData.data().nomes_leitor;

    const checkboxGroup = document.getElementById('checkbox_group');
    checkboxGroup.innerHTML = ''; 
    for (let i = 0; i < leitoresDb.length; i++) {
        const div = document.createElement('div');
        div.classList.add('checkbox-wrapper');

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = i; 

        console.log(input.value);

        input.id = `leitor_${i}`;
        const label = document.createElement('label');
        label.setAttribute('for', input.id); 
        label.textContent = leitoresDb[i];

        div.appendChild(input);
        div.appendChild(label);

        checkboxGroup.appendChild(div);
    }
}



//ID FACE

document.getElementById('section').style.display = 'flex';
                document.getElementById('loading').style.display = 'none';

async function getIp() {
    const db = firebase.firestore().collection('condominio');
    const email = await getEmail();
    const leitores = await db.where('email', '==', email).get();
    const leitoresData = leitores.docs[0];
    const ips = leitoresData.data().ips;

    const checkboxGroup = document.getElementById('checkbox_group');
    const checkboxes = checkboxGroup.querySelectorAll('input[type="checkbox"]');
    const checkedIndices = [];

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            checkedIndices.push(parseInt(checkbox.value, 10)); 
        }
    });

    const selectedIps = checkedIndices.map(index => ips[index]);

    return selectedIps;
}

async function conectarFaceID(ip) {
    
    return new Promise((resolve, reject) => {

        $.ajax({
            url: "http://" + ip + "/login.fcgi",
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                login: 'admin',
                password: 'admin'
            }),
            success: function(data) {
                console.log(data.session);
                resolve(data.session); 
            },
            error: function(xhr, status, error) {
                reject(error); 
            }
        });
    });
}


async function createUser(id_morador, ip, session) {

    console.log("Morador id:", id_morador);
    
    const nome = document.getElementById('nome').value;
    console.log("Nome:", nome);
    const morador = await firebase.firestore().collection('moradores').doc(id_morador);
    console.log("Morador:", morador);
    $.ajax({
        url: "http://" + ip + "/create_objects.fcgi?session=" + session,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          object: "users",
          values: [{registration: 'morador', name: nome}]
        }),
        success: async function(data) {
          const id = data.ids[0];
          await morador.update({
            ids: firebase.firestore.FieldValue.arrayUnion(id)
          });
          userToGroup(id,ip,id_morador,session);
        },
        error: function(xhr, status, error) {
          console.log(error);
        }});
}

async function userToGroup(id,ip,id_morador,session){

    $.ajax({
        url: "http://" + ip + "/create_objects.fcgi?session=" + session,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          object: "user_groups",
          values: [{user_id: id, group_id: 1}]
        }),
        success: function(data) {
          console.log('Morador adicionado ao grupo');
          enviarImagem(id,ip,id_morador,session);
        },
        error: function(xhr, status, error) {
          console.log(error);
        }
        }
    );
}

function enviarImagem(id,ip,id_morador,session){

    var input = document.getElementById('inputImagem');
    const morador = firebase.firestore().collection('moradores').doc(id_morador);
    
    // Verifica se um arquivo foi selecionado
    if (input.files && input.files[0]) {
        var file = input.files[0];
        var reader = new FileReader();

        reader.onload = async function(e) {
            var bytesDaImagem = new Uint8Array(e.target.result);
            $.ajax({
                url: "http://" + ip + "/user_set_image.fcgi?user_id=" + id + "&timestamp=1691586816&match=0&session=" + session,
                type: 'POST',
                contentType: 'application/octet-stream',
                processData: false, // Evitar que o jQuery converta os dados
                data: bytesDaImagem.buffer,
                success: function(data) {
                    console.log(data);
                    console.log('Imagem enviada com sucesso');
                    morador.update({foto: 'Sim'});
                },
                error: function(xhr, status, error){
                    console.log(error);
                    alert('Erro ao enviar imagem');
                    morador.update({foto: 'Não'});
                    document.getElementById('imagem-erro').style.display = 'block';
                } // Use o buffer do array de bytes
            });
        }
        reader.readAsArrayBuffer(file);
        
    }
    else {
        alert('Por favor, selecione uma imagem.');
    }
       
}

// Verificar se existe leitor cadastrado, e se ta conectado

async function verificarLeitoresCadastrados() {
    try {
        const email = await getEmail();
        const sindicoDb = firebase.firestore().collection('condominio');
        const sindicoQuery = await sindicoDb.where('email', '==', email).get();
       
        if (sindicoQuery.empty) {
            console.log('Nenhum documento encontrado para o email fornecido.');
            return;
        }

        sindicoQuery.forEach(doc => {
           
            if (doc.data().hasOwnProperty('ips')) {
                console.log('O campo "ips" existe:', doc.data().ips);
                verificarConexao(doc.data().ips)
            } else {
                console.log('O campo "ips" não existe.');
                return false;
            }
        });
    } catch (error) {
        console.error('Erro ao verificar leitores cadastrados:', error);
    }
}

//TERMINAR ISSO AQ
async function verificarConexao(ips) {
    
    console.log("Chegou em verificar")
    for (const ip of ips) {
        console.log(ip);
        const session = await conectarFaceID(ip);
        alert(`Erro ao conectar ao leitor ${ip}`);
    }
    
}
if(!verificarLeitoresCadastrados() != false){
    alert('Crie o leitor antes de cadastrar o morador');
    window.location.href = 'configuracao.html';
}
