const submitBtn = document.querySelector('.submit__btn')

submitBtn.addEventListener('click', async (event) => {
   event.preventDefault()

   const form = document.querySelector('form')

   const database = await fetch(window.location.href + 'collaborators')
   .then(response => response.json())

   let cpf = document.querySelector('input[name="cpf"]').value
   if(cpf.length > 11){
      cpf = cpf.replace('.', '')
      cpf = cpf.replace('.', '')
      cpf = cpf.replace('-', '')
   }
   const register = document.querySelector('input[name="register"]').value

   let cont = 0
   database.forEach((item) => {
      if(cpf == item.CPF && register == item.Matricula) {
         form.submit()
         cont++
      } else if((cpf.length == 0 || register.length == 0) && item.ID == database.length - 1 && cont == 0) {
         renderError('Preencha os campos')
      } else if((cpf != item.CPF || register != item.Matricula) && item.ID == database.length - 1 && cont == 0) {
         renderError('Dados incorretos')

      }
   })

})

function renderError(text){
   const loginError = document.querySelector('.login__error')
   loginError.innerHTML = ''

   const error = document.createElement('p')
   error.classList.add('error__login')
   const erroTxt = document.createTextNode(text)
   error.appendChild(erroTxt)

   loginError.appendChild(error)
}