const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let produtos = [];
let cadastros = [];
let historicoCompras = [];

// Função para carregar dados do sistema
function carregarDados() {
    try {
        if (fs.existsSync('produtos.txt')) {
            produtos = fs.readFileSync('produtos.txt', 'utf8').trim().split('\n').map(line => {
                const [nome, preco] = line.split(' - ');
                return { nome, preco: parseFloat(preco) };
            });
        }
        if (fs.existsSync('cadastros.txt')) {
            cadastros = fs.readFileSync('cadastros.txt', 'utf8').trim().split('\n').map(line => {
                const [nome, email] = line.split(' - ');
                return { nome, email };
            });
        }
        if (fs.existsSync('historicoCompras.txt')) {
            historicoCompras = fs.readFileSync('historicoCompras.txt', 'utf8').trim().split('\n').map(line => {
                return line;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// Função para salvar dados no sistema
function salvarDados() {
    const produtosData = produtos.map(produto => `${produto.nome} - ${produto.preco.toFixed(2)}`).join('\n');
    fs.writeFileSync('produtos.txt', produtosData);

    const cadastrosData = cadastros.map(cadastro => `${cadastro.nome} - ${cadastro.email}`).join('\n');
    fs.writeFileSync('cadastros.txt', cadastrosData);

    const historicoData = historicoCompras.join('\n');
    fs.writeFileSync('historicoCompras.txt', historicoData);
}

// Função para cadastrar um novo cliente
function cadastrarCliente() {
    rl.question('Nome: ', (nome) => {
        rl.question('Email: ', (email) => {
            cadastros.push({ nome, email });
            salvarDados();
            console.log('Cliente cadastrado com sucesso!');
            menu();
        });
    });
}

// Função para realizar o login de um cliente
function loginCliente(callback) {
    rl.question('Email: ', (email) => {
        const cliente = cadastros.find(c => c.email === email);
        if (cliente) {
            console.log(`Bem-vindo, ${cliente.nome}!`);
            callback(cliente);
        } else {
            console.log('Cliente não encontrado.');
            menu();
        }
    });
}

// Função para adicionar um novo produto
function adicionarProduto() {
    rl.question('Nome do produto: ', (nome) => {
        rl.question('Preço: ', (preco) => {
            const precoNumerico = parseFloat(preco);
            if (isNaN(precoNumerico)) {
                console.log('Preço inválido. Tente novamente.');
                adicionarProduto(); // Repete a pergunta
                return;
            }
            produtos.push({ nome, preco: precoNumerico });
            salvarDados();
            console.log('Produto adicionado com sucesso!');
            menu();
        });
    });
}

// Função para exibir a lista de produtos disponíveis
function exibirProdutos() {
    console.log('Produtos disponíveis:');
    produtos.forEach((produto, index) => {
        console.log(`${index + 1}. ${produto.nome} - R$${produto.preco.toFixed(2)}`);
    });
}

// Função para comprar produtos
function comprarProdutos() {
    let carrinho = [];
    exibirProdutos(); // Exibe a lista de produtos disponíveis
    function adicionarAoCarrinho() {
        rl.question('Escolha o número do produto (ou digite "fim" para finalizar): ', (resposta) => {
            if (resposta.toLowerCase() === 'fim') {
                finalizarCompra(null, carrinho); // Passa null como cliente
            } else {
                const indice = parseInt(resposta) - 1; // Converte para índice
                const produto = produtos[indice];
                if (produto) {
                    rl.question('Quantidade: ', (quantidade) => {
                        const qtdNumerica = parseInt(quantidade);
                        if (isNaN(qtdNumerica) || qtdNumerica <= 0) {
                            console.log('Quantidade inválida. Tente novamente.');
                            adicionarAoCarrinho(); // Repete a pergunta
                            return;
                        }
                        for (let i = 0; i < qtdNumerica; i++) {
                            carrinho.push(produto);
                        }
                        console.log(`${qtdNumerica} ${produto.nome}(s) adicionado(s) ao carrinho.`);
                        adicionarAoCarrinho(); // Pergunta por mais produtos
                    });
                } else {
                    console.log('Produto não encontrado.');
                    adicionarAoCarrinho(); // Pergunta por mais produtos
                }
            }
        });
    }
    adicionarAoCarrinho();
}

// Função para finalizar a compra e gerar a nota fiscal
function finalizarCompra(cliente, carrinho) {
    const total = carrinho.reduce((sum, produto) => sum + produto.preco, 0);

    // Agrupando os produtos por nome e contando as quantidades
    const produtosContagem = {};
    carrinho.forEach(produto => {
        produtosContagem[produto.nome] = (produtosContagem[produto.nome] || 0) + 1;
    });

    // Criando a descrição da compra
    const produtosComprados = Object.entries(produtosContagem)
        .map(([nome, quantidade]) => `${quantidade} ${nome}(s)`)
        .join(', ');

    const data = new Date();
    const dataFormatada = `${data.getDate()}/${data.getMonth() + 1}/${data.getFullYear()} ${data.getHours()}:${data.getMinutes().toString().padStart(2, '0')}`; // Formato: DD/MM/AAAA HH:MM
    const tipoPagamento = 'dinheiro'; // Tipo de pagamento fixo
    const compraDetalhes = `${dataFormatada}, ${total.toFixed(2)}, ${tipoPagamento}`;
    
    // Adicionando os detalhes dos produtos na próxima linha
    historicoCompras.push(compraDetalhes);
    historicoCompras.push(produtosComprados);
    
    salvarDados();
    
    console.log('Compra finalizada!');
    console.log('Nota Fiscal:');
    console.log(`Cliente: ${cliente ? cliente.nome : 'Ghost'}`);
    console.log(`Total: R$${total.toFixed(2)}`);
    console.log(`Produtos: ${produtosComprados}`);

    // Se não houver cliente logado, perguntar se deseja fazer o cadastro novamente
    if (!cliente) {
        rl.question('Deseja fazer o cadastro agora? (s/n): ', (resposta) => {
            if (resposta.toLowerCase() === 's') {
                cadastrarCliente();
            } else {
                console.log('Obrigado pela compra! Volte sempre.');
                rl.close();
            }
        });
    } else {
        menu(); // Voltar para o menu principal
    }
}

// Função que exibe o menu principal
function menu() {
    console.log('\nMenu:');
    console.log('1. Adicionar Produto');
    console.log('2. Comprar Produtos');
    console.log('3. Sair');
    rl.question('Escolha uma opção: ', (opcao) => {
        switch (opcao) {
            case '1':
                adicionarProduto();
                break;
            case '2':
                comprarProdutos();
                break;
            case '3':
                rl.close();
                break;
            default:
                console.log('Opção inválida.');
                menu();
                break;
        }
    });
}

// Pergunta inicial sobre cadastro
function iniciarSistema() {
    rl.question('Já possui cadastro? (s/n): ', (resposta) => {
        if (resposta.toLowerCase() === 's') {
            loginCliente(() => menu());
        } else {
            rl.question('Deseja fazer o cadastro agora? (s/n): ', (respostaCadastro) => {
                if (respostaCadastro.toLowerCase() === 's') {
                    cadastrarCliente();
                } else {
                    console.log('Bem-vindo ao Mercado! Faça suas compras.');
                    rl.question('Pressione Enter para continuar...', () => {
                        menu();
                    });
                }
            });
        }
    });
}

// Carregar dados no início do programa
carregarDados();
iniciarSistema();
