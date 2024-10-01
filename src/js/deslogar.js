import { } from 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';
import { mostrarNotificacao,confirmNotificacao } from './alerts.js';


async function logout() {

    const confirmado = await confirmNotificacao(
        'Deseja realmente sair?',
        'Deslogar',
        'Até a proxima!',
        'Saída cancelada'
    );
    if(confirmado) {
        try {
            await firebase.auth().signOut();
            window.open("../../index.html", "_self");
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    }
}

const button = document.getElementById('btn_deslogar');
button.addEventListener('click', logout);