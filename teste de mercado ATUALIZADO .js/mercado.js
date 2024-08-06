const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let produtos = [];
let cadastros = [];
let historicoCompras = [];
let admin = {};

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
                const [nome, email, senha, cpf] = line.split(' - ');
                return { nome, email, senha, cpf };
            });
        }
        if (fs.existsSync('historicoCompras.txt')) {
            historicoCompras = fs.readFileSync('historicoCompras.txt', 'utf8').trim().split('\n').map(line => {
                return line;
            });
        }
        if (fs.existsSync('admin.txt')) {
            const [nome, email, senha, cpf] = fs.readFileSync('admin.txt', 'utf8').trim().split(' - ');
            admin = { nome, email, senha, cpf };
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

function salvarDados() {
    const produtosData = produtos.map(produto => `${produto.nome} - ${produto.preco.toFixed(2)}`).join('\n');
    fs.writeFileSync('produtos.txt', produtosData);

    const cadastrosData = cadastros.map(cadastro => `${cadastro.nome} - ${cadastro.email} - ${cadastro.senha} - ${cadastro.cpf}`).join('\n');
    fs.writeFileSync('cadastros.txt', cadastrosData);

    const historicoData = historicoCompras.join('\n');
    fs.writeFileSync('historicoCompras.txt', historicoData);
}

function perguntarSimNao(pergunta, callback) {
    rl.question(pergunta, (resposta) => {
        if (resposta.toLowerCase() === 's' || resposta.toLowerCase() === 'n') {
            callback(resposta.toLowerCase());
        } else {
            console.log('Resposta inválida. Por favor, responda com "s" ou "n".');
            perguntarSimNao(pergunta, callback);
        }
    });
}

function autenticarAdmin(callback) {
    rl.question('Digite o e-mail do administrador: ', (email) => {
        if (email === admin.email) {
            rl.question('Digite a senha: ', (senha) => {
                if (senha === admin.senha) {
                    rl.question('Digite o CPF: ', (cpf) => {
                        if (cpf === admin.cpf) {
                            console.log('Autenticação bem-sucedida.');
                            callback();
                        } else {
                            console.log('CPF incorreto.');
                            menu();
                        }
                    });
                } else {
                    console.log('Senha incorreta.');
                    menu();
                }
            });
        } else {
            console.log('E-mail incorreto.');
            menu();
        }
    });
}

function cadastrarCliente() {
    rl.question('Nome: ', (nome) => {
        rl.question('Email: ', (email) => {
            rl.question('Senha: ', (senha) => {
                rl.question('CPF (somente números): ', (cpf) => {
                    cadastros.push({ nome, email, senha, cpf });
                    salvarDados();
                    console.log('Cliente cadastrado com sucesso!');
                    menu();
                });
            });
        });
    });
}

function loginCliente(callback) {
    rl.question('Email: ', (email) => {
        rl.question('Senha: ', (senha) => {
            const cliente = cadastros.find(c => c.email === email && c.senha === senha);
            if (cliente) {
                console.log(`Bem-vindo, ${cliente.nome}!`);
                callback(cliente);
            } else {
                console.log('Email ou senha incorretos.');
                menu();
            }
        });
    });
}

function adicionarProduto() {
    rl.question('Nome do produto: ', (nome) => {
        rl.question('Preço: ', (preco) => {
            const precoNumerico = parseFloat(preco);
            if (isNaN(precoNumerico)) {
                console.log('Preço inválido. Tente novamente.');
                adicionarProduto();
                return;
            }
            produtos.push({ nome, preco: precoNumerico });
            salvarDados();
            console.log('Produto adicionado com sucesso!');
            menuAdmin();
        });
    });
}

function exibirProdutos() {
    console.log('Produtos disponíveis:');
    produtos.forEach((produto, index) => {
        console.log(`${index + 1}. ${produto.nome} - R$${produto.preco.toFixed(2)}`);
    });
}

function adicionarPromocao() {
    rl.question('Nome do produto para adicionar promoção: ', (nome) => {
        const produto = produtos.find(p => p.nome === nome);
        if (produto) {
            rl.question('Novo preço com promoção: ', (preco) => {
                const precoNumerico = parseFloat(preco);
                if (isNaN(precoNumerico)) {
                    console.log('Preço inválido. Tente novamente.');
                    adicionarPromocao();
                    return;
                }
                produto.preco = precoNumerico;
                salvarDados();
                console.log('Promoção aplicada com sucesso!');
                menuAdmin();
            });
        } else {
            console.log('Produto não encontrado.');
            menuAdmin();
        }
    });
}

function mudarPrecoProduto() {
    rl.question('Nome do produto para mudar o preço: ', (nome) => {
        const produto = produtos.find(p => p.nome === nome);
        if (produto) {
            rl.question('Novo preço: ', (preco) => {
                const precoNumerico = parseFloat(preco);
                if (isNaN(precoNumerico)) {
                    console.log('Preço inválido. Tente novamente.');
                    mudarPrecoProduto();
                    return;
                }
                produto.preco = precoNumerico;
                salvarDados();
                console.log('Preço alterado com sucesso!');
                menuAdmin();
            });
        } else {
            console.log('Produto não encontrado.');
            menuAdmin();
        }
    });
}

function totalVendasDia() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const total = historicoCompras.reduce((acc, linha) => {
        const [data, valor] = linha.split(', ');
        if (data.startsWith(hoje)) {
            acc += parseFloat(valor);
        }
        return acc;
    }, 0);
    console.log(`Total de vendas do dia (${hoje}): R$${total.toFixed(2)}`);
    menuAdmin();
}

function menuAdmin() {
    console.log('\nMenu Administrativo:');
    console.log('1. Adicionar Produto');
    console.log('2. Adicionar Promoção');
    console.log('3. Mudar Preço do Item');
    console.log('4. Total de Vendas do Dia');
    console.log('5. Voltar ao Menu Principal');
    rl.question('Escolha uma opção: ', (opcao) => {
        switch (opcao) {
            case '1':
                adicionarProduto();
                break;
            case '2':
                adicionarPromocao();
                break;
            case '3':
                mudarPrecoProduto();
                break;
            case '4':
                totalVendasDia();
                break;
            case '5':
                menu();
                break;
            default:
                console.log('Opção inválida.');
                menuAdmin();
                break;
        }
    });
}

function comprarProdutos() {
    let carrinho = [];
    exibirProdutos();
    function adicionarAoCarrinho() {
        rl.question('Escolha o número do produto (ou digite "fim" para finalizar): ', (resposta) => {
            if (resposta.toLowerCase() === 'fim') {
                selecionarPagamento(carrinho);
            } else {
                const indice = parseInt(resposta) - 1;
                const produto = produtos[indice];
                if (produto) {
                    rl.question('Quantidade: ', (quantidade) => {
                        const qtdNumerica = parseInt(quantidade);
                        if (isNaN(qtdNumerica) || qtdNumerica <= 0) {
                            console.log('Quantidade inválida. Tente novamente.');
                            adicionarAoCarrinho();
                            return;
                        }
                        for (let i = 0; i < qtdNumerica; i++) {
                            carrinho.push(produto);
                        }
                        console.log(`${qtdNumerica} ${produto.nome}(s) adicionado(s) ao carrinho.`);
                        adicionarAoCarrinho();
                    });
                } else {
                    console.log('Produto não encontrado.');
                    adicionarAoCarrinho();
                }
            }
        });
    }
    adicionarAoCarrinho();
}

function selecionarPagamento(carrinho) {
    console.log('\nFormas de Pagamento:');
    console.log('1. Dinheiro');
    console.log('2. Cartão de Crédito');
    console.log('3. Cartão de Débito');
    console.log('4. Xerecard');
    console.log('5. Boleto Bancário');
    console.log('6. Fiado');
    rl.question('Escolha uma forma de pagamento: ', (escolha) => {
        switch (escolha) {
            case '1':
                finalizarCompra(null, carrinho, 'Dinheiro');
                break;
            case '2':
                finalizarCompra(null, carrinho, 'Cartão de Crédito');
                break;
            case '3':
                finalizarCompra(null, carrinho, 'Cartão de Débito');
                break;
            case '4':
                rl.question('Digite o dia do pagamento (DD/MM/AAAA): ', (dia) => {
                    rl.question('Digite a hora do pagamento (HH:MM): ', (hora) => {
                        console.log('Endereço: Rua Dr. Creme, 666, Xique-Xique BA.');
                        console.log('Referência: Na Frente do Cemitério de Xique-Xique.');
                        finalizarCompra(null, carrinho, `Xerecard - ${dia} ${hora}`);
                    });
                });
                break;
            case '5':
                rl.question('Digite o código do boleto: ', (codigo) => {
                    console.log('O pagamento deve ser realizado no prazo de uma semana!');
                    finalizarCompra(null, carrinho, `Boleto Bancário - Código: ${codigo}`);
                });
                break;
            case '6':
                console.log('O pagamento deve ser realizado no prazo de uma semana!');
                rl.question('Qual o dia de pagamento? (DD/MM/AAAA): ', (dia) => {
                    finalizarCompra(null, carrinho, `Fiado - Dia de Pagamento: ${dia}`);
                });
                break;
            default:
                console.log('Forma de pagamento inválida. Tente novamente.');
                selecionarPagamento(carrinho);
                break;
        }
    });
}

function finalizarCompra(cliente, carrinho, tipoPagamento) {
    const total = carrinho.reduce((sum, produto) => sum + produto.preco, 0);

    const produtosContagem = {};
    carrinho.forEach(produto => {
        produtosContagem[produto.nome] = (produtosContagem[produto.nome] || 0) + 1;
    });

    const produtosComprados = Object.entries(produtosContagem)
        .map(([nome, quantidade]) => `${quantidade} ${nome}(s)`)
        .join(', ');

    const data = new Date();
    const dataFormatada = `${data.getDate()}/${data.getMonth() + 1}/${data.getFullYear()} ${data.getHours()}:${data.getMinutes().toString().padStart(2, '0')}`;
    const compraDetalhes = `${dataFormatada}, ${total.toFixed(2)}, ${tipoPagamento}`;

    historicoCompras.push(compraDetalhes);
    historicoCompras.push(produtosComprados);

    salvarDados();

    console.log('Compra finalizada!');
    console.log('Nota Fiscal:');
    console.log(`Cliente: ${cliente ? cliente.nome : 'Ghost'}`);
    console.log(`Total: R$${total.toFixed(2)}`);
    console.log(`Produtos: ${produtosComprados}`);

    if (!cliente) {
        perguntarSimNao('Deseja fazer o cadastro agora? (s/n): ', (resposta) => {
            if (resposta === 's') {
                cadastrarCliente();
            } else {
                console.log('Obrigado pela compra! Volte sempre.');
                rl.close();
            }
        });
    } else {
        menu();
    }
}

function menu() {
    console.log('\nMenu:');
    console.log('1. Comprar Produtos');
    console.log('2. Acesso Administrativo (se você for o ADM)');
    console.log('3. Sair');
    rl.question('Escolha uma opção: ', (opcao) => {
        switch (opcao) {
            case '1':
                comprarProdutos();
                break;
            case '2':
                autenticarAdmin(menuAdmin);
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

function iniciarSistema() {
    perguntarSimNao('Já possui cadastro? (s/n): ', (resposta) => {
        if (resposta === 's') {
            loginCliente(() => menu());
        } else {
            perguntarSimNao('Deseja fazer o cadastro agora? (s/n): ', (respostaCadastro) => {
                if (respostaCadastro === 's') {
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

carregarDados();
iniciarSistema();
