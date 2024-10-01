import { } from './firebase_config.js';

function getEmail() {
    return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                const userEmail = user.email;
                console.log("Email do usuário autenticado:", userEmail);
                resolve(userEmail);
            } else {
                console.log("Nenhum usuário autenticado.");
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
showName();