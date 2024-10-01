
function getIdUrl() {
    
    const url = window.location.href;
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const id = urlParams.get('id')
    return id;
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
async function preencherDadosExistentes() {
    try {
        const id = getIdUrl();
        const id_array = parseInt(id);
        const moradorDb = firebase.firestore().collection('moradores');
        const moradorSnapshot = await moradorDb.where('ids', 'array-contains', id_array).get();

        if (!moradorSnapshot.empty) {

            mostrarLeitores();
            const moradorData = moradorSnapshot.docs[0].data();
            document.getElementById('nome').value = moradorData.nome;
            document.getElementById('casa').value = moradorData.casa;

            document.getElementById('cpf').style.display = 'none';
            document.getElementById('whatsapp').style.display = 'none';
            
            if (moradorData.tipo === 'Com chat') {

                document.getElementById('cpf').style.display = 'block';
                document.getElementById('whatsapp').style.display = 'block';

                document.getElementById('cpf').value = moradorData.cpf;
                document.getElementById('whatsapp').value = moradorData.whatsapp.replace(/^\+?\d{2}/, '');
            }
        } else {
            console.log('Nenhum morador encontrado com o ID especificado.');
        }
    } catch (error) {
        console.error('Erro ao preencher os dados existentes:', error);
    }
}


async function editarMorador() {

    const id = parseInt(getIdUrl());

    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const casa = document.getElementById('casa').value;
    
    const moradorDb = firebase.firestore().collection('moradores');
    const moradorSnapshot = await moradorDb.where('ids', 'array-contains', id).get();


    if(confirm('Tem certeza que deseja alterar os dados do morador?')) {
        if(cpf == '') {
            await firebase.firestore().collection('moradores').doc(moradorSnapshot.docs[0].id).update({
                nome: nome,
                casa: casa
            });
        } else {
            await firebase.firestore().collection('moradores').doc(moradorSnapshot.docs[0].id).update({
                nome: nome,
                cpf: cpf,
                whatsapp: '55' + whatsapp,
                casa: casa
            });
        }
        const ips = await getIp();

        for (const ip of ips) {
            const session = await conectarFaceID(ip);
            if (session) {
                editarMoradorLeitor(ip,session)
            } else {
                alert(`Erro ao conectar ao leitor ${ip}`);
            }
        }
        
    }
    
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

        input.id = `leitor_${i}`;
        const label = document.createElement('label');
        label.setAttribute('for', input.id); 
        label.textContent = leitoresDb[i];

        div.appendChild(input);
        div.appendChild(label);

        checkboxGroup.appendChild(div);
    }
}

//leitor

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

async function getId(ip) {
    try {
        const db = firebase.firestore().collection('condominio');

        const email = await getEmail();

        const leitoresSnapshot = await db.where('email', '==', email).get();
       
        const leitoresData = leitoresSnapshot.docs[0].data();

        const ips = leitoresData.ips;
    
        const position = ips.indexOf(ip);
        
        const id = parseInt(getIdUrl());
        console.log("ID: " + id);
        const moradorDb = firebase.firestore().collection('moradores');
        const moradorSnapshot = await moradorDb.where('ids', 'array-contains', id).get();
        const idsData = moradorSnapshot.docs[0].data();

        console.log(idsData);

        const ids = idsData.ids;

        return ids[position];

    } catch (error) {
        console.error('Erro ao buscar o ID:', error);
    }
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

async function editarMoradorLeitor(ip,session) {

    const id = await getId(ip);

    const nome = document.getElementById('nome').value;

    const foto = document.getElementById('inputImagem').value;

    console.log("nome" + nome);
    console.log("id" + id);

    $.ajax({
        url: "http://" + ip + "/modify_objects.fcgi?session=" + session,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          object: "users",
          values: {name: nome},
          where: {
            users: { id: id }
          }
        }),
        success: function(data) {
            console.log(data);
            alert('Morador editado com sucesso!');
            if(foto != "") {
                enviarImagem(id,ip,session);
            }
        },
        error: function(xhr, status, error) {
            console.log(error);
        }
      });
}

function enviarImagem(id,ip,session){

    var input = document.getElementById('inputImagem');
    //const morador = firebase.firestore().collection('moradores').doc(id_morador);
    
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
                    alert('Imagem enviada com sucesso');
                    //morador.update({foto: 'Sim'});
                },
                error: function(xhr, status, error){
                    console.log(error);
                    alert('Erro ao enviar imagem');
                } 
            });
        }
        reader.readAsArrayBuffer(file);
        
    }
    else {
        alert('Por favor, selecione uma imagem.');
    }
       
}

preencherDadosExistentes();

document.getElementById('enviarBotao').addEventListener('click', editarMorador);