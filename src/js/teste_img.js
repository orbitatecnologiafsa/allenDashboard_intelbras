import { } from './firebase_config.js';
async function baixarFoto() {
  try {
    // Obtém o serviço de storage (compat)
    const storage = firebase.storage();

    // Define o caminho da foto
    const path = '0000/aislanmota0@gmail.com.jpg';

    // Cria uma referência ao arquivo no storage
    const photoRef = storage.ref(path);

    // Obtém a URL de download da foto
    const url = await photoRef.getDownloadURL();
    console.log(url);

    // Define a URL da imagem no elemento HTML
    const img = document.querySelector('#user-photo');
    if (img) {
      img.src = url;
    } else {
      console.error("Elemento de imagem não encontrado.");
    }
  } catch (error) {
    console.error("Erro ao baixar a foto:", error);
  }
}

// Chama a função para baixar a foto
baixarFoto();
