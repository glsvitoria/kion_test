import Modal from './modal.js'

import { horizontalScroll } from './horizontalScroll.js'

var currentQuestion = 1
let protocol
renderProtocols()

const divQuestions = document.querySelector('.questions')

async function renderProtocols() {
   const url = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[1] + window.location.href.split('/')[2] + '/' + window.location.href.split('/')[3]
   const protocolId = await fetch(url + '/protocolid')
   .then(response => response.json()) 
   const protocolAndDepartaments = await fetch(url + '/proto&departament')
   .then(response => response.json())

   const userName = document.querySelector('.user__details p').textContent

   const url2 = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[1] + window.location.href.split('/')[2] + '/'
   const database = await fetch(url2 + 'collaborators')
   .then(response => response.json())

   let userItem
   database.forEach((item) => {
      if(item.Nome == userName) {
         userItem = item
      }
   })

   let protocolsIDUsed = []
   protocolAndDepartaments.forEach((item) => {
      if(item.Departamento == userItem.Departamento){
         protocolsIDUsed.push(item.Protocolo)
      }
   })

   let protocolsUsed = []
   protocolId.forEach((item) => {
      protocolsIDUsed.forEach((itemID) => {
         if(item.ID == itemID){
            protocolsUsed.push({
               Protocolo: item.Protocolo,
               ID: item.ID
            })
         }
      })
   })

   const divHeaderFilter = document.querySelector('.header__filter')

   const select = document.createElement('select')
   select.setAttribute('name', 'protocol')
   select.setAttribute('id', 'protocol')

   let cont = 1

   protocolsUsed.forEach((item) => {
      const option = document.createElement('option')
      option.setAttribute('value', `protocol-${item.ID}`)

      if(cont == 1){
         protocol = item.ID
      }
      cont++

      const optionTxt = document.createTextNode(`${item.Protocolo}`)
      option.appendChild(optionTxt)

      select.appendChild(option)
   })

   divHeaderFilter.appendChild(select)

   select.addEventListener('change', () => {
      protocol = select.options[select.selectedIndex].value
      protocol = protocol.split('-')[1]
      currentQuestion = 1
      renderData(protocol, protocolId)
   })

   renderData(protocol)
}

async function renderData(protocol, protocolId){
   const url = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[1] + window.location.href.split('/')[2] + '/' + window.location.href.split('/')[3]
   const question = await fetch(url + '/question')
   .then(response => response.json())

   const alternative = await fetch(url + '/alternative')
   .then(response => response.json())
   
   await questionForEach(question, alternative, protocol, protocolId)
}

async function questionForEach(question, alternative, protocol, protocolId){
   let questionsForThisProtocol = []
   let questionsRender = []
   // ADICIONANDO AS PERGUNTAS DINÂMICAMENTE E NOS SEUS LUGARES CORRETOS
   divQuestions.innerHTML = ''
   question.forEach((item) => {
      if (`${item.Protocolo}` == protocol) {
         const divQuestion = document.createElement('div')
         divQuestion.classList.add('question')

         const h2 = document.createElement('h2')
         h2.classList.add('questions__text')
         h2.textContent = `${item.Pergunta}`
         
         const title = document.createElement('div')
         title.classList.add('questions__title')
         title.appendChild(h2)

         const divOptions = document.createElement('div')
         divOptions.classList.add('questions__options', `question_${item.Ordem}`)

         alternative.forEach((alternative) => {
            if (alternative.IdDaPergunta == item.ID) {
               const btn = document.createElement('button')
               btn.setAttribute('type', 'button')
               const btnTxt = document.createTextNode(`${alternative.Alternativa}`)
               btn.appendChild(btnTxt)
               btn.setAttribute('id', `${alternative.ID}`)
               btn.setAttribute('data-color', `${alternative.CorDeSelecao}`)
               if(currentQuestion !== verifyQuestionOrder(alternative, question)){
                  btn.setAttribute('disabled', 'true')
               }

               divOptions.appendChild(btn)
            }
         })

         divQuestion.appendChild(title)
         divQuestion.appendChild(divOptions)
         divQuestions.appendChild(divQuestion)
         questionsRender.push(item)

         if(title.clientHeight > 64) {
            title.childNodes[0].style.fontSize = '1.5rem'
            title.childNodes[0].style.padding = '.25rem 0'
         }
      }
      if(`${item.Protocolo}` == protocol){
         questionsForThisProtocol.push(item)
      }
   })

   const title = document.querySelector('.question__area .question__title')
   if(title.childNodes[1]){
      title.removeChild(title.childNodes[1])
   }
   title.innerHTML += `<span class="question__title__span">(total de perguntas: ${questionsForThisProtocol.length})</span>`

   // LÓGICA PARA SELECIONAR AS PERGUNTAS
   const questionOptions = document.querySelectorAll('.questions__options')

   questionOptions.forEach((question) => {
      const btns = document.querySelectorAll(`.${question.classList[1]} button`)
      btns.forEach((btn) => {
         btn.addEventListener('click', () => {
            addActive(btn, btns, protocol, questionsForThisProtocol, questionsRender, alternative)
            setCurrentQuestion(question, alternative, protocol)
         })
      })
   })

   setInterval(horizontalScroll, 100)
   
}

// VERIFICAR ORDEM DA PERGUNTA
function verifyQuestionOrder(alternative, question){
   let order
   question.forEach((item) => {
      if(alternative.IdDaPergunta == item.ID){
         order =  item.Ordem
      }
   })

   return order
}

// ADICIONAR ACTIVE AO ELEMENTOS ESCOLHIDOS
async function addActive(element, array, protocol, questionsForThisProtocol, questionsRender, alternative) {
   if(element.classList[0] !== 'disabled'){
      array.forEach((item) => {
         if (item.classList[0] == 'active') {
            // Lógica para quando questões anteriores forem alteradas
            changeBeforeQuestion(item)  
            item.classList.remove('active')
         }
      })
      element.classList.add('active')
      let alternativeChoosed
      alternative.forEach((item) => {
         if(item.ID == element.id){
            alternativeChoosed = item
         }
      })
   }

   const url = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[1] + window.location.href.split('/')[2] + '/' + window.location.href.split('/')[3]
   const wayToAnswer = await fetch(url + '/waytoanswer')
   .then(response => response.json())
   verifyWay(wayToAnswer, protocol, questionsForThisProtocol, questionsRender)
}

// REMOVER DISABLED A MEDIDA QUE AVANÇA NAS PERGUNTAS
async function setCurrentQuestion(question, alternative, protocol) {  
   const url = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[1] + window.location.href.split('/')[2] + '/' + window.location.href.split('/')[3]
   const wayToAnswer = await fetch(url + '/waytoanswer')
      .then(response => response.json())

   const questionOptionsNow = document.querySelector(`.question_${currentQuestion} .active`)

   // Aumentar de questão apenas quando a questão atual for selecionada
   if(questionOptionsNow !== null && verifyNextQuestion(currentQuestion)) {
      currentQuestion = Number(question.classList[1].split('_')[1]) + 1
   }

   const questionOptions = document.querySelectorAll('.questions__options')
   questionOptions.forEach((question) => {
      if(question.classList[1] === `question_${currentQuestion}`){
         question.childNodes.forEach((children) => {
            if(verifyLastQuestion(questionOptionsNow, children, alternative) == true && haveAWay(questionOptionsNow, children, protocol, wayToAnswer)){
               children.removeAttribute('disabled')
            } else {
               children.setAttribute('disabled', 'true')
            }
         })
      } 
   })

}


// LIBERAR APENAS AS PERMITIDAS USAR
function verifyLastQuestion(optionChoosed, children, alternative){
   var childrenUsed
   alternative.forEach((item) => {
      if(item.ID == children.id){
         childrenUsed = item
      }
   })
   var verify = false
   childrenUsed.IDsAnteriores.forEach((lastIDs) => {
      if(lastIDs === optionChoosed.id){
         verify = true
      }
   })
   return verify
}

function haveAWay(questionOptionsNow, children, protocol, wayToAnswer){
   const sequenceChoose = document.querySelectorAll('button.active')
   let sequenceChooseID = []
   sequenceChoose.forEach((item) => sequenceChooseID.push(item.id))

   const onlyWayToAnswerInThisProtocol = wayToAnswer.filter((item) => `${item.Protocolo}` == protocol ? true : false)

   let usedReturn = false

   onlyWayToAnswerInThisProtocol.forEach((item) => {
      let isCorrectWay = false
      for(let i = 0; i < sequenceChooseID.length; i++){
         if(item.Caminho[i] == sequenceChooseID[i]){
            isCorrectWay = true
         } else {
            isCorrectWay = false
            break
         }
      }

      if(isCorrectWay && item.Caminho[currentQuestion - 1] == children.id){
         usedReturn = true
      }
   })

   return usedReturn
}


function verifyNextQuestion(questionNow){
   const questionOptionsNow = document.querySelectorAll(`.question_${questionNow} button`)
   let returnFunction = false
   questionOptionsNow.forEach((item) => {
      if(item.classList[0] == 'active'){
         returnFunction = true
      }
   })

   return returnFunction
}

// CASO UMA ALTERNATIVA ANTERIOR SEJA ALTERADA O FORM É LIMPADO
function changeBeforeQuestion(element){
   const questionChanged = element.parentNode.classList[1].split('_')[1]
   currentQuestion = questionChanged
   clearForm(questionChanged)
}

// LIMPAR O FORM QUANDO FOR TROCADA A OPÇÃO DA PERGUNTA ANTERIOR
function clearForm(currentQuestion){
   const question = document.querySelectorAll('.questions__options')

   question.forEach((item) => {
      if(item.classList[1].split('_')[1] > currentQuestion){
         item.childNodes.forEach((children) => {
            children.classList.remove('active')
            children.setAttribute('disabled', 'true')
         })
      }
   })
}

// VERIFICAR CAMINHO DA RESPOSTA
async function verifyWay(wayToAnswer, protocol, questionsForThisProtocol, questionsRender) {
   const elementsChoosed = document.querySelectorAll('.active')
   let optionsChoosed = []

   let numberOfAnswer = 0
   // Mudar lógica para perguntar que necessitem mais de 3 questões
   if(elementsChoosed.length >= 2){
      for(let i = 0; i < 10; i++){
         if(elementsChoosed[i]){
            optionsChoosed.push(elementsChoosed[i].id)
            numberOfAnswer++
         } else {
            optionsChoosed.push('')
         }
      }

      verifyAnswer(wayToAnswer, protocol, optionsChoosed, numberOfAnswer, questionsForThisProtocol)
   }
}

function verifyAnswer(wayToAnswer, protocol, optionsChoosed, numberOfAnswer, questionsForThisProtocol) {
   let idFromAnswer = []

   wayToAnswer.forEach((item) => {
      let isCorrect = true
      let correctAnswer = 0
      for(let i = 0; i < 10; i++){
         if(optionsChoosed[i] !== '' && optionsChoosed[i] == item.Caminho[i] && `${item.Protocolo}` == protocol){
            correctAnswer++
         }

         if(optionsChoosed[i] != null){
         }

         if(optionsChoosed[i] != item.Caminho[i] && optionsChoosed[i] == '' && item.Caminho[i] != null){
            isCorrect = false
         }
      }

      if(correctAnswer == numberOfAnswer && isCorrect){
         idFromAnswer.push(item.IDdaResposta)
      }
   })

   let optionsCheckeds = 0

   optionsChoosed.forEach((item) => {
      if(item != '') optionsCheckeds++
   })


   if(idFromAnswer.length !== 0){
      renderAnswer(idFromAnswer, questionsForThisProtocol)
   } else if(optionsCheckeds == questionsForThisProtocol.length) {
      renderErrorInAnswer('Nenhuma resposta encontrada')
   }
   
}

async function renderAnswer(idFromAnswer, questionsForThisProtocol){
   const url = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[1] + window.location.href.split('/')[2] + '/' + window.location.href.split('/')[3]
   const answers = await fetch(url + '/answerlist')
   .then(response => response.json())

   let answerFound = []
   answers.forEach((item) => {
      idFromAnswer.forEach((idAnswer) =>{
         if(item.ID === idAnswer){
            answerFound.push(item)
         }
      })
   })


   renderAnswerOneByOne(answerFound, answerFound[0], answerFound.length, 0,  answerFound.length - 0, questionsForThisProtocol)
}

async function renderAnswerOneByOne(allAnswer, answerFound, answers, number, last, questionsForThisProtocol){
   const modalAnswer = document.querySelector('.answer__content')
   modalAnswer.innerHTML = ''

   const url = window.location.href.split('/')[0] + '//' + window.location.href.split('/')[1] + window.location.href.split('/')[2] + '/' + window.location.href.split('/')[3]
   const answersFiles = await fetch(url + '/answerfiles')
   .then(response => response.json())

   let answerFoundImage = null
   let answerFoundDocs = null

   answersFiles.forEach((item) => {
      if(item.IDdaResposta == answerFound.ID && item.TipoDeArquivo == 'Imagem'){
         answerFoundImage = item
      }

      if(item.IDdaResposta == answerFound.ID && item.TipoDeArquivo == 'Documentos') {
         answerFoundDocs = item
      }
   })

   const h3 = document.createElement('h3')
   h3.classList.add('answer__title')
   const h3Txt = document.createTextNode(`${answerFound.Resposta}`)
   h3.appendChild(h3Txt)
   modalAnswer.appendChild(h3)

   if(answerFound.Descricao && answerFound.Descricao != 'null'){
      const h4 = document.createElement('h4')
      h4.classList.add('answer__title__description')
      const h4Txt = document.createTextNode('Descrição')
      h4.appendChild(h4Txt)
   
      const pDesc = document.createElement('p')
      pDesc.classList.add('answer__description')
      const pDescTxt = document.createTextNode(`${answerFound.Descricao}`)
      pDesc.appendChild(pDescTxt)
      modalAnswer.appendChild(h4)
      modalAnswer.appendChild(pDesc)
   }

   let img
   img = document.createElement('img')
   if(answerFoundImage != null && answerFoundImage.Base64 != null && answerFoundImage.Base64.length > 10){
      img.setAttribute('src', `${answerFoundImage.Base64.split('"')[1]}`)
      img.setAttribute('alt', 'Foto do resultado')
      img.classList.add("result__photo")
      modalAnswer.appendChild(img)
   } else {
      img.setAttribute('src', '../images/no_image_found.png')
      img.setAttribute('alt', 'Nenhuma foto encontrada')
      img.classList.add("result__photo")
      modalAnswer.appendChild(img)
   }

   const divAnswerLinks = document.createElement('div')
   divAnswerLinks.classList.add('answer__links')
   const linksH2 = document.createElement('h2')
   const linksH2Txt = document.createTextNode('Anexos')
   linksH2.appendChild(linksH2Txt)
   linksH2.classList.add('links__title')
   divAnswerLinks.appendChild(linksH2)

   let haveAttachment = false

   if(answerFound.Video != null) {
      const divVideo = document.createElement('div')
      divVideo.classList.add('button__link')
      const iVideo = document.createElement('i')
      iVideo.classList.add('icon-play-circle')
      const linkVideo = document.createElement('a')
      linkVideo.classList.add('link__url')
      const linkVideoTxt = document.createTextNode('Vídeo')
      linkVideo.setAttribute('href', `${answerFound.Video.Url}`)
      linkVideo.setAttribute('target', '_blank')
      linkVideo.appendChild(iVideo)
      linkVideo.appendChild(linkVideoTxt)
      divVideo.appendChild(linkVideo)
      divAnswerLinks.appendChild(divVideo)

      haveAttachment = true
   }

   if(answerFoundDocs != null && answerFoundDocs.Base64 != null && answerFoundDocs.Base64.length > 10){
      const divDocuments = document.createElement('div')
      divDocuments.classList.add('button__link')
      const iDocuments = document.createElement('i')
      iDocuments.classList.add('icon-file-text')
      const linkDocuments = document.createElement('a')
      linkDocuments.classList.add('link__url')
      linkDocuments.setAttribute('href', `${answerFoundDocs.Base64.split('"')[1]}`)
      linkDocuments.setAttribute('download', `${answerFoundDocs.Filename}`)
      const linkDocsTxt = document.createTextNode('Documentos')
      linkDocuments.appendChild(iDocuments)
      linkDocuments.appendChild(linkDocsTxt)
      divDocuments.appendChild(linkDocuments)
      divAnswerLinks.appendChild(divDocuments)

      haveAttachment = true
   }

   modalAnswer.appendChild(divAnswerLinks)

   if(!haveAttachment){
      document.querySelector('.answer__links').innerHTML = ''
   }

   if(last > 1){
      const divButtons = document.createElement('div')
      divButtons.classList.add('div__buttons__right')

      const buttonRight = document.createElement('p')
      const buttonRightTxt = document.createTextNode('Próxima resposta >')
      buttonRight.appendChild(buttonRightTxt)
      buttonRight.classList.add('right')
      buttonRight.classList.add('change__answer')

      divButtons.appendChild(buttonRight)

      modalAnswer.appendChild(divButtons)

      buttonRight.addEventListener('click', () => {
         renderAnswerOneByOne(allAnswer, allAnswer[number + 1], allAnswer.length, number + 1, allAnswer.length - (number + 1), questionsForThisProtocol)
      })
   }

   if(last <= 1 && answers != 1){
      const divButtons = document.createElement('div')
      divButtons.classList.add('div__buttons')

      const buttonLeft = document.createElement('p')
      const buttonLeftTxt = document.createTextNode('< Resposta anterior')
      buttonLeft.appendChild(buttonLeftTxt)
      buttonLeft.classList.add('left')
      buttonLeft.classList.add('change__answer')

      divButtons.appendChild(buttonLeft)

      const buttonRight = document.createElement('p')
      const buttonRightTxt = document.createTextNode('Continuar pesquisa >')
      buttonRight.appendChild(buttonRightTxt)
      buttonRight.classList.add('right')
      buttonRight.classList.add('change__answer')

      buttonRight.addEventListener('click', () => {
         Modal.close()
      })

      divButtons.appendChild(buttonRight)

      modalAnswer.appendChild(divButtons)

      buttonLeft.addEventListener('click', () => {
         renderAnswerOneByOne(allAnswer, allAnswer[number - 1], allAnswer.length, number - 1, allAnswer.length - (number - 1), questionsForThisProtocol)
      })
   }

   Modal.open()
}

function renderErrorInAnswer(text){
   const modalAnswer = document.querySelector('.answer__content')
   modalAnswer.innerHTML = ''

   const p = document.createElement('p')
   const pTxt = document.createTextNode(text)
   p.appendChild(pTxt)
   p.classList.add('error')

   modalAnswer.appendChild(p)

   Modal.open()

   currentQuestion = 1
}

export {protocol, renderData}