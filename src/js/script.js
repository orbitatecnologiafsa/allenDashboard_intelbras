
function showPassword(){

    const img_eye = document.getElementById('olhinhos-azuis');
    const password = document.getElementById('password_login');

    if(password.type === 'password'){
        password.type = 'text';
        img_eye.src = './assets/img/open_eye.png';
    }
    else{
        password.type = 'password';
        img_eye.src = './assets/img/closed_eye.png';
    }
}

document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault(); 
    login();
});

function login(){
    
    const email = document.getElementById('email_login').value;
    const password = document.getElementById('password_login').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => { 
        alert('Login efetuado com sucesso!');
        window.location.href = "./src/pages/main_screen.html";
    })
    .catch((error) => {
        console.error('Erro ao autenticar usuário:', error);
        console.error('Código de erro:', error.code);
        alert('Erro ao autenticar usuário: ' + error.message);
    });
}



