import { } from './firebase_config.js';

function verificarLogin(){
       
  firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        console.log("Usuário está autenticado.");
        window.location.href = "./src/pages/main_screen.html";
      } else {
        console.log("Usuário não está autenticado.");
      }
  });
}

verificarLogin();

