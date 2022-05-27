const express = require('express')
const app = express()
const path = require('path')
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')

const { Web, sp } = require('@pnp/sp')
const { PnpNode } = require('sp-pnp-node')

const PORT = process.env.PORT || 3000

app.use(bodyParser.urlencoded({ extended: false }))

// HANDLE BARS
app.set('view engine', 'handlebars')
const hbs = exphbs.create({ defaultLayout: 'main' })
app.engine('handlebars', hbs.engine)
app.set('views', path.join(__dirname, 'views'))

// STATIC FOLDER
app.use(express.static(path.join(__dirname, 'public')))

var questionUsedApplication,
	alternativeUsedApplication,
	protoDepartUsedApplication,
	answerDetaUsedApplication,
	wayToAnswerUsedApplication,
	answerFilesUsedApplication,
   protocolIDUsedInApplication,
   collaboratorsUsedApplication
    
// GETS das páginas utilizadas na aplicação
app.get('/', async (req, res) => {
   // API SHAREPOINT
   await new PnpNode()
   .init()
   .then(async (settings) => {
      const web = new Web(settings.siteUrl)
      
      async function catchDataInSharepoint() {
            // BANCO DE COLABORADORES DA EMPRESA
            collaboratorsUsedApplication = await sp.web.lists
               .getByTitle('Colaboradores')
               .items.getAll()
               .then(response => convertToStringAndJson(response))
               .then(data => alignCollaborators(data))
            }
            await catchDataInSharepoint()
            
            setInterval(catchDataInSharepoint, 5000);
         })
         .catch(console.log)

   res.render('login')
})

// GETS para os dados trazidos do SHAREPOINT
app.get('/selecionador/question', (req, res) => {
   res.json(questionUsedApplication)
})
app.get('/selecionador/alternative', (req, res) => {
   res.json(alternativeUsedApplication)
})
app.get('/selecionador/proto&departament', (req, res) => {
   res.json(protoDepartUsedApplication)
})
app.get('/selecionador/answerlist', (req, res) => {
   res.json(answerDetaUsedApplication)
})
app.get('/selecionador/waytoanswer', (req, res) => {
	res.json(wayToAnswerUsedApplication)
})
app.get('/selecionador/answerfiles', (req, res) => {
	res.json(answerFilesUsedApplication)
})
app.get('/selecionador/protocolid', (req, res) => {
   res.json(protocolIDUsedInApplication)
})

app.get('/selecionador/:cpf&:register', async (req, res) => {
   const {cpf, register} = req.params

   // API SHAREPOINT
   await new PnpNode()
   .init()
   .then(async (settings) => {
      const web = new Web(settings.siteUrl)
      
      async function catchDataInSharepoint() {           
         // QUESTÕES
         questionUsedApplication = await sp.web.lists
         .getByTitle('Perguntas')
         .items.getAll()
         .then(response => convertToStringAndJson(response))
         .then(data => alignQuestion(data))
         
         // ALTERNATIVAS
         alternativeUsedApplication = await sp.web.lists
         .getByTitle('Alternativas')
         .items.getAll()
         .then(response => convertToStringAndJson(response))
         .then(data => alignAlternatives(data))
         
         // PROTOCOLOS E DEPARTAMENTOS
         protoDepartUsedApplication = await sp.web.lists
         .getByTitle('Protocolos e Departamentos')
         .items.getAll()
         .then(response => convertToStringAndJson(response))
         .then(data => alignProtocolsAndDepartaments(data))
         
         // DETALHES DAS RESPOSTAS
         answerDetaUsedApplication = await sp.web.lists
         .getByTitle('Respostas-Detalhes')
         .items.getAll()
         .then(response => convertToStringAndJson(response))
         .then(data => alignAnswerDetails(data))
         
         // CAMINHO PARA RESPOSTAS
         wayToAnswerUsedApplication = await sp.web.lists
         .getByTitle('Caminho para as Respostas')
         .items.getAll()
         .then(response => convertToStringAndJson(response))
         .then(data => alignWayToAnswer(data))
         
         // ARQUIVOS DAS RESPOSTAS
         const answerFilesListJson = await sp.web.lists
         .getByTitle('Arquivos Resposta')
         .items // Faltou anexos
         .getAll()
         .then(response => convertToStringAndJson(response))
         
         const answerFilesJson = await sp.web.lists
            .getByTitle('Arquivos Resposta')
            .items // Faltou anexos
            .select("AttachmentFiles")
            .expand("AttachmentFiles")
            .getAll()
            .then(response => convertToStringAndJson(response))
            
         answerFilesUsedApplication = alignAnswerFiles(answerFilesListJson, answerFilesJson)
            
         protocolIDUsedInApplication = await sp.web.lists
            .getByTitle('Protocolos_ID')
            .items.getAll()
            .then(response => convertToStringAndJson(response))
            .then(data => alignProtocolID(data))
      }
      await catchDataInSharepoint()
      
      setInterval(catchDataInSharepoint, 5000);
   })
   .catch(console.log)

   let user

   collaboratorsUsedApplication.forEach((item) => {
      if(cpf == item.CPF && register == item.Matricula) {
         user = item
      }
   })

   res.render('index', {
      type: 'sucess',
      data: {
         users: user
      }
   })
})

app.get('/collaborators', (req, res) => {
   res.json(collaboratorsUsedApplication)
})

app.post('/login', (req, res) => {
   const {cpf, register} = req.body

   res.redirect(`/selecionador/${cpf}&${register}`)
})

// GET para deslogar do site
app.get('/exit', (req, res) => {
   res.redirect('/')
})

// FUNÇÕES para tratar dados trazidos do SHAREPOINT
function alignQuestion(data) {
	let dataUsed = []
	data.forEach((item) => {
		dataUsed.push({
			Protocolo: item.Protocolo,
			Ordem: item.Ordem,
			ID: item.ID,
			Pergunta: item.Pergunta,
		})
	})

	return dataUsed
}

function alignAlternatives(data) {
	let dataUsed = []
	data.forEach((item) => {
		dataUsed.push({
			IdDaPergunta: item.ID_x0020_da_x0020_Pergunta,
			Alternativa: item.Alternativa,
			ID: item.ID,
			TipoDeAlternativa: item.Tipo_x0020_de_x0020_Alternativa,
			CorDeSelecao: item.Cor_x0020_de_x0020_Sele_x00e7__x,
			IDsAnteriores: alignAnteriores(item.IDs_x0020_Anteriores),
		})
	})

	return dataUsed
}

function alignAnteriores(string) {
	let newString = []
	if (string !== null) {
		newString = string.split('_')
	}

	for (let i = 0; i < newString.length; i++) {
		if (newString[i] == '') {
			newString.splice(i, 1)
		}
	}

	return newString
}

function alignProtocolsAndDepartaments(data) {
	let dataUsed = []
	data.forEach((item) => {
		dataUsed.push({
			Departamento: item.Departamento,
			Protocolo: item.Protocolo,
		})
	})

	return dataUsed
}

function alignAnswerDetails(data) {
	let dataUsed = []
	data.forEach((item) => {
		dataUsed.push({
			Resposta: item.Resposta,
			ID: item.ID,
			Descricao: item.Descri_x00e7__x00e3_o,
			Imagem: item.Imagem,
			Video: item.V_x00ed_deo,
			Detalhes: item.Detalhes,
		})
	})

	return dataUsed
}

function alignWayToAnswer(data) {
	let dataUsed = []
	data.forEach((item) => {
		dataUsed.push({
			Caminho: [
				item.IDdaAlternativa1,
				item.IDdaAlternativa2,
				item.IDdaAlternativa3,
				item.IDdaAlternativa4,
				item.IDdaAlternativa5,
				item.IDdaAlternativa6,
				item.IDdaAlternativa7,
				item.IDdaAlternativa8,
			],
			IDdaResposta: item.IDdaResposta,
			Protocolo: item.Protocolo,
		})
	})

	return dataUsed
}

function alignAnswerFiles(data, files) {
	let dataUsed = []
   let i = 0
	data.forEach((item) => {
      if(files[i].AttachmentFiles.length == 1){
         dataUsed.push({
            TipoDeArquivo: item.TipodeArquivo,
			   IDdaResposta: item.ID_x0020_da_x0020_Resposta,
            Base64: item.base64,
            Filename: files[i].AttachmentFiles[0].FileName
         })
      } else {
         dataUsed.push({
            TipoDeArquivo: item.TipodeArquivo,
            IDdaResposta: item.ID_x0020_da_x0020_Resposta,
            Base64: item.base64
         })
      }
      i++
	})
   
	return dataUsed
}

function alignCollaborators(data) {
	let dataUsed = []
   let id = 0
	data.forEach((item) => {
		dataUsed.push({
         ID: id,
			Nome: item.Title,
			Matricula: item.Matricula,
			Nascimento: alignBirth(item.Nascimento),
			CPF: item.CPF,
			Email: item.Email,
			Sexo: item.Sexo,
			Setor: item.Centro_x0020_de_x0020_Custo_x002,
			Departamento: item.Departamento,
			Funcao: item.Fun_x00e7__x00e3_o,
		})
      id++
	})

	return dataUsed
}

function alignBirth(data) {
	const newData = data.split('-')
	return `${newData[2].substring(0, 2)}/${newData[1]}/${newData[0]}`
}

function alignProtocolID(data) {
   let dataUsed = []
   data.forEach((item) => {
      dataUsed.push({
         Protocolo: item.Title,
         ID: item.ID
      })
   })

   return dataUsed
}

// CONVERT TO STRING, BEFORE CONVERT TO JSON
function convertToStringAndJson(data) {
	const string = JSON.stringify(data)
	const json = JSON.parse(string)
	return json
}

// OUVIR a porta do servidor
app.listen(PORT, function () {
	console.log('O Express está rodando na porta ' + PORT)
})