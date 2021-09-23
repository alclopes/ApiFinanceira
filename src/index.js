// 04 =>
// 03 => Passando o cpf pelo header e usando middleware #middleware#
// 02 => Passando o cpf pelo header no insonia
// 01 => Iniciando (passando o cpf pela URL)

const { request, response } = require('express');
const express = require('express');

// v4 => implica que irá gerar um número aleatorio para o id
const { v4: uuidv4 } = require('uuid');

const app = express();

// middleware para trabalhar com JSON nos request API
app.use(express.json());

// como não vamos usar BD, vamos jogar as contas em um array.
const customers = [];

// Middleware -valida existencia do CPF / Se não existe retorna erro
function verifyIfExistsAccountCPF(request, response, next) {
	const { cpf } = request.headers;

	const customer = customers.find((customer) => customer.cpf === cpf);
	// Se não encontrou
	if (!customer) {
		return response.status(400).json({ error: 'Customer not found!' });
	}
	// console.log('******************* customerFound:', customers);
	// Passar o objeto encontrado para quem usa o middleware
	request.customer = customer;
	// seguir o procedimento do chamador do middleware
	return next();
}

// Middleware - / Se não existe retorna erro
function getBalance(statement) {
	const balance = statement.reduce((acc, operation) => {
		if (operation.type === 'credit') {
			return parseInt(acc) + parseInt(operation.amount);
		} else {
			return parseInt(acc) - parseInt(operation.amount);
		}
	}, 0);
	return balance;
}

// criando customer/contaCorrente
app.post('/account', (request, response) => {
	// recuperando do cpf e o name do request.body
	const { cpf, name } = request.body;

	// verificando se o cpf já existe em outra conta3 #existeNoArray#
	// some => retorna true ou false
	const customerAlreadyExists = customers.some(
		(customer) => customer.cpf === cpf
	);

	if (customerAlreadyExists) {
		return response.status(400).json({ error: 'Customer already exists!' });
	}

	// inserindo a conta no array
	customers.push({
		cpf,
		name,
		id: uuidv4(), // obtendo um id aleatório #idRandom#
		statement: [],
	});

	//console.log('************* customersCreated', customers);
	return response.status(201).send();
});

// recuperando a conta do array
app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
	// Se encontrou
	const { customer } = request;
	//console.log('******************* customerContaCorrente:', customer);
	return response.json(customer.statement);
});

// fazendo um deposito
app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
	const { description, amount } = request.body;
	const { customer } = request;
	const statementOperation = {
		description,
		amount,
		created_at: new Date(),
		type: 'credit',
	};
	customer.statement.push(statementOperation);
	//console.log('******************* customerDeposit:', customer);
	return response.status(201).send();
});

// fazendo um saque
app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
	const { amount } = request.body;
	const { customer } = request;

	const balance = getBalance(customer.statement);

	//console.log('balance:', balance);
	//console.log('amount:', parseInt(amount));
	if (balance < parseInt(amount)) {
		return response.status(400).json({ error: 'Insufficient funds!' });
	}

	const statementOperation = {
		amount,
		create_at: new Date(),
		type: 'debit',
	};

	customer.statement.push(statementOperation);

	const balanceFim = balance - parseInt(amount);
	//console.log('balance:', balanceFim);

	return response.status(201).send();
});

// recuperando a conta do array
app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
	// Se encontrou
	const { customer } = request;
	const { date } = request.query;
	console.log('date:', date);

	const dateFormat = new Date(date + ' 00:00');
	console.log('dateFormat:', dateFormat);

	// 10/10/2021
	const statement = customer.statement.filter(
		(statement) =>
			statement.create_at.toDateString() === dateFormat.toDateString()
	);

	// console.log('******************* customerContaCorrente:', customer);
	return response.json(statement);
});

// atualizando os dados da conta (nome do cliente)
app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
	const { name } = request.body;
	const { customer } = request;

	customer.name = name;

	return response.status(201).send();
});

// obtendo todas as contas
app.get('/accounts', (request, response) => {
	return response.json(customers);
});

// obtendo os dados da conta
app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
	const { customer } = request;

	return response.json(customer);
});

// deletando uma conta
app.delete('/account1', verifyIfExistsAccountCPF, (request, response) => {
	const { customer } = request;
	const { cpf } = request.headers;

	const balance = getBalance(customer.statement);

	const customerIndex = customers.findIndex((customer) => customer.cpf === cpf);

	if ((customerIndex = -1)) {
		return response.status(404).json({ error: 'Customer Not found' });
	}

	if (balance !== 0) {
		return response
			.status(400)
			.json({ erro: "To delete an account, it isn't have found" });
	}

	customers.splice(customerIndex, 1);

	return response.status(200).json(customers);
});

// recuperando o saldo
app.get('/balance', verifyIfExistsAccountCPF, (request, response) => {
	const { customer } = request;
	const balance = getBalance(customer.statement);
	return response.json(balance);
});

app.listen(3333, () => {
	console.log('Server is running: http://localhost:3333/');
});
