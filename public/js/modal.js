import {protocol, renderData} from './main.js'

function Modal() {
	const modalWrapper = document.querySelector('.modal-wrapper-answer')

	const cancelButton = document.querySelector('i.icon-x')

	cancelButton.addEventListener('click', close)

   // Fechar modal pressionando o ESC
   document.addEventListener('keydown', function(event){
      if(event.key === "Escape"){
         close()
      }
   })

	function open() {
		//Funcionalidade de atribuir a classe active para a modal
		modalWrapper.classList.add('active')
	}
	function close() {
		//Funcionalidade de remover a classe active para a modal
		modalWrapper.classList.remove('active')
	}

	return {
		open,
		close,
	}
}

document.addEventListener('keydown', (event) => {
   if(event.key === 'Escape'){
      Modal().close()
   }
})

export default Modal()