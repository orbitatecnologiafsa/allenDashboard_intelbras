
import { } from './firebase_config.js';
import { mostrarNotificacao,confirmNotificacao } from './alerts.js';
//Consumir firebase

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
//Preencher dados

function exibirElementos(doc) {
    
    const morador = doc;
    if(morador.status == 'ativo'){
        const moradorItem = document.createElement('li');
        moradorItem.setAttribute('id','moradorItem');
        moradorItem.setAttribute('class','item-list');

        const moradorNome = document.createElement('p');
        moradorNome.setAttribute('class','item');
        moradorNome.textContent = morador.nome;

        const moradorCasa = document.createElement('p');
        moradorCasa.setAttribute('class','item');
        moradorCasa.textContent = morador.casa;
        
        const moradorEstabelecimento = document.createElement('p');
        moradorEstabelecimento.setAttribute('class','item');
        moradorEstabelecimento.textContent = morador.estabelecimento;

        const moradorCodigo = document.createElement('p');
        moradorCodigo.setAttribute('class','item');
        moradorCodigo.textContent = morador.cod_delivery;

        const img_div = document.createElement('div');
        img_div.setAttribute('class','img_div');

        const moradorChegou = document.createElement('img');
        moradorChegou.setAttribute('class','icon');
        moradorChegou.setAttribute('id','moradorChegou' + morador.cod_delivery);
        moradorChegou.style.cursor = 'pointer';
        moradorChegou.src = '../img/accept.png';

        moradorChegou.addEventListener('click',() => {
            mudarStatus(morador.cod_delivery);
        });

        img_div.appendChild(moradorChegou);

        moradorItem.appendChild(moradorNome);
        moradorItem.appendChild(moradorCasa);
        moradorItem.appendChild(moradorEstabelecimento);
        moradorItem.appendChild(moradorCodigo);
        moradorItem.appendChild(img_div);
        moradorLista.appendChild(moradorItem);
    }          

}

const cod_cond = await getCondominio();
firebase.firestore().collection("delivery").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && change.doc.data().status == 'ativo' && change.doc.data().cod_cond == cod_cond) {
            exibirElementos(change.doc.data());
        }
        if (change.type === "modified") {
            console.log("Documento modificado: ", change.doc.data());
            exibirElementos(null);
        }
        if (change.type === "removed") {
            console.log("Documento removido: ", change.doc.data());
            exibirElementos(null);
        }
    });
});

//Pesquisa
document.getElementById('search_form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const input = document.getElementById('search');
    const value = input.value.trim().toLowerCase();
    
    const moradorLista = document.getElementById('moradorLista');
    moradorLista.innerHTML = ''; // Limpar a lista antes de exibir os resultados
    
    firebase.firestore().collection("delivery").onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && change.doc.data().status == 'ativo' && change.doc.data().cod_cond == cod_cond) {
          if (change.doc.data().cod_delivery.toString().includes(value)) {
            exibirElementos(change.doc.data());
          }
        }
      });
    });
  });


//API

async function mudarStatus(cod_pedido){

    console.log(cod_pedido);
    const confirmado = await confirmNotificacao(
        'O pedido chegou?',
        'Entrega Delivery',
        'Entrega concluída',
        'Entrega não está concluída'
    );
    if(confirmado){ {
        console.log("FOI APROVADO");
        const imagem_gif = document.getElementById('moradorChegou' + cod_pedido);
        imagem_gif.src = '../img/chegou.gif'
    
        const delivery = firebase.firestore().collection('delivery');
    
        const deliveryData = delivery.where('cod_delivery', '==', cod_pedido);
    
        const informacoes = await deliveryData.get();

        console.log(informacoes);
    
        console.log("codigo do pedido chegou:",cod_pedido);
        $.ajax({
            url: 'http://localhost:4000/execute',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ parameter: cod_pedido }),
            success: function(response) {
                informacoes.forEach(doc => {
                    console.log(doc.id);
                    delivery.doc(doc.id).update({
                        status: 'entregue',
                        data_entrega: new Date()
                    });
                });
        
                setTimeout(() => {
                    preencherDadosExistentes();
                }, 3000);
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
            }
        });

    }
    }
}