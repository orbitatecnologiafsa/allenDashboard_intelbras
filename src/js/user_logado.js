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

async function mostrarMorador(value) {

    const userEmail = await getEmail();
    const userDb = await firebase.firestore().collection('condominio');
    const sindico = await userDb.where('email', '==', userEmail).get();
    const sindicoData = sindico.docs[0].data();
    const codigoSindico = sindicoData.cod_Condominio;
    const moradorRef = await firebase.firestore().collection('moradores');
    const moradorCond = await moradorRef.where('condominio', '==', codigoSindico).get();

    try {

        if(value != null){
            const pesquisa_inicial = value;
            const pesquisa_final = pesquisa_inicial + '\uf8ff';

            const moradores = await moradorRef.where('condominio', '==', codigoSindico).where('nome', '>=', pesquisa_inicial).where('nome', '<=', pesquisa_final).get();
            listaCompleta.length = 0;
         
            moradores.forEach(doc => {
                console.log(doc.id, '=>', doc.data());
                const moradorData = doc.data();
                listaCompleta.push(moradorData);
                });
            exibirElementos(listaCompleta, paginaAtual);
            exibirPaginacao(listaCompleta);
        } else {
            listaCompleta.length = 0;
            moradorCond.forEach(doc => {
                
                if(doc.data().status == 'ativo') {
                    if(doc.data().tipo == 'Com chat'){
                        const morador = {
                            nome: doc.data().nome,
                            cpf: formatarCPF(doc.data().cpf),
                            casa: doc.data().casa,
                            tipo: doc.data().tipo,
                            whatsapp: formatarWhasapp(doc.data().whatsapp),
                            condominio: doc.data().condominio,
                            foto: doc.data().foto,
                            ids: doc.data().ids,
                            status: doc.data().status
                        };
                        listaCompleta.push(morador); 
                    } else {
                        const morador = {
                            nome: doc.data().nome,
                            casa: doc.data().casa,
                            tipo: doc.data().tipo,
                            foto: doc.data().foto,
                            ids: doc.data().ids,
                            condominio : doc.data().condominio,
                            status: doc.data().status
                        }
                        listaCompleta.push(morador); 
                    }
                    exibirElementos(listaCompleta, paginaAtual);
                    exibirPaginacao(listaCompleta);
               
        }        });
        
        }
   
    } catch(error) {
        console.log("A lista está vazia, erro: " + error);
    }
}

function exibirElementos(lista, pagina) {
  
    const startIndex = (pagina - 1) * elementosPorPagina;
    const endIndex = startIndex + elementosPorPagina;
  
    //console.log("Lista:", lista);
    //.log("startIndex:", startIndex);
    //console.log("endIndex:", endIndex);
    const elementosDaPagina = lista.slice(startIndex, endIndex);
  
    //console.log("elementos da pagina: ", elementosDaPagina);
  
    const moradorLista = document.getElementById('moradorLista');
    moradorLista.innerHTML = ''; 
  
    elementosDaPagina.forEach(morador => {
  
      //console.log(morador);

        
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
        const imgDiv2 = document.createElement('div');
        baixarFoto(morador.ids).then(url => {
           
            moradorFoto.setAttribute('src', url);
            moradorFoto.setAttribute('class', 'foto-morador');
            imgDiv2.setAttribute('class','img-div2');
            imgDiv2.appendChild(moradorFoto);
        });

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
    });
  }

function exibirPaginacao(lista) {
    const numeroDePaginas = Math.ceil(lista.length / elementosPorPagina);
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; 

    for (let i = 1; i <= numeroDePaginas; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        if (i === 1) { 
            button.setAttribute('class', 'botao-paginacao ativo');
        }
        button.classList.add('botao-paginacao');
        button.addEventListener('click', () => irParaPagina(i));
        paginationContainer.appendChild(button);
    }
}

function irParaPagina(pagina) {
   
    //console.log("Pagina:", pagina);
    paginaAtual = pagina;
    exibirElementos(listaCompleta, pagina);
    atualizarPaginacao();
}

function atualizarPaginacao() {
  const botoesPaginacao = document.querySelectorAll('#pagination button');
  botoesPaginacao.forEach((botao, indice) => {
      if (indice + 1 === paginaAtual) {
          botao.classList.add('ativo');
      } else {
          botao.classList.remove('ativo');
      }
  });
}

async function getIp(){

    const db = firebase.firestore().collection('condominio');
    const email = await getEmail();
    const leitores = await db.where('email', '==', email).get();
    const leitoresData = leitores.docs[0];
    const ips = leitoresData.data().ips;

    //console.log(ips);
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
async function baixarFoto(user_id) {

    //console.log("DAD:" + user_id);
    try {
        const ips = await getIp();

        for (let i = 0; i < ips.length; i++) {
            const ip = ips[i];
            const id_array = user_id[i];
            //console.log("id_array:" + id_array);
               
                try {

                        const conexao = await axios.post(`http://${ip}/login.fcgi`, {
                            login: 'admin',
                            password: 'admin'
                        });
                    
                        if (conexao.data.session) {
                           
                            const session = conexao.data.session;
                            console.log('Sessão Foto:', session);
                            const response = await fetch(`http://${ip}/user_get_image.fcgi?user_id=${id_array}&session=${session}`, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'image/jpeg'
                                }
                            });
                            const blob = await response.blob();
                            const url = URL.createObjectURL(blob);
                
                            return url;
                        }
                    }
                catch (error) {
                    console.error(error);
                }
        }
    } catch (error) {
        console.error('Erro ao baixar a foto:', error);
    }
}

showName();
mostrarMorador(null);

document.getElementById('search_form').addEventListener('submit', function(event) {
    event.preventDefault();
   
    const input = document.getElementById('search');
    const value = input.value.trim().toUpperCase();
    console.log(value);
    mostrarMorador(value);
});

export { getEmail }

