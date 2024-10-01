function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // Função para obter os três dígitos do CPF a partir de um valor fornecido
  function getCPFDigits(cpf) {
    return [
      parseInt(cpf.charAt(0)),
      parseInt(cpf.charAt(1)),
      parseInt(cpf.charAt(2))
    ];
  }
  

  // Função para gerar o código hexadecimal
  async function generateCode(cpf_user) {
    const cpf = cpf_user
    const cpfDigits = getCPFDigits(cpf);
    
    const currentDate = new Date();
    
    const day = currentDate.getDate();
    
    const randomNumbers = [
      getRandomNumber(0, 9),
      getRandomNumber(0, 9),
      getRandomNumber(0, 9),
      day,
      ...cpfDigits
    ];
    
    const code = randomNumbers.reduce((result, number) => {
      return result + number;
    }, '');
    
    const hexCode = parseInt(code).toString(16);
    
    return hexCode;
  }


  export { generateCode };
