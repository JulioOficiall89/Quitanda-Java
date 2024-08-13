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
            historicoCompras = fs.readFileSync('historicoCompras.txt', 'utf8').trim().split('\n');
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

function loadingAnimation(callback) {
    const frames = ['.', '..', '...', '....'];
    let frameIndex = 0;
    const interval = setInterval(() => {
        process.stdout.write(`Loading${frames[frameIndex]}   \r`);
        frameIndex = (frameIndex + 1) % frames.length;
    }, 500); 

    setTimeout(() => {
        clearInterval(interval);
        process.stdout.write('Loading complete!            \r');
        callback();
    }, 4000); 
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
                            menu(cliente);
                        }
                    });
                } else {
                    console.log('Senha incorreta.');
                    menu(cliente);
                }
            });
        } else {
            console.log('E-mail incorreto.');
            menu(cliente);
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
                    menu(null);
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
                perguntarSimNao('Deseja tentar o login novamente? (s/n): ', (resposta) => {
                    if (resposta === 's') {
                        loginCliente(callback);
                    } else {
                        menu(null); 
                    }
                });
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

function menu(cliente) {
    if (cliente && cliente.email === admin.email) {
        console.log('\nMenu Administrativo:');
        console.log('1. Adicionar Produto');
        console.log('2. Adicionar Promoção');
        console.log('3. Mudar Preço do Item');
        console.log('4. Total de Vendas do Dia');
        console.log('5. Comprar Produtos');
        console.log('6. Sair');
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
                    comprarProdutos(cliente);
                    break;
                case '6':
                    rl.close();
                    break;
                default:
                    console.log('Opção inválida.');
                    menu(cliente);
                    break;
            }
        });
    } else {
        console.log('\nMenu:');
        console.log('1. Comprar Produtos');
        console.log('2. Sair');
        rl.question('Escolha uma opção: ', (opcao) => {
            switch (opcao) {
                case '1':
                    comprarProdutos(cliente);
                    break;
                case '2':
                    rl.close();
                    break;
                default:
                    console.log('Opção inválida.');
                    menu(cliente);
                    break;
            }
        });
    }
}

function comprarProdutos(cliente) {
    exibirProdutos();
    const carrinho = [];
    function adicionarAoCarrinho() {
        rl.question('Escolha um produto (ou digite "sair" para finalizar): ', (opcao) => {
            if (opcao.toLowerCase() === 'sair') {
                selecionarPagamento(carrinho, cliente);
                return;
            }
            const indice = parseInt(opcao) - 1;
            const produto = produtos[indice];
            if (produto) {
                rl.question('Quantidade: ', (quantidade) => {
                    const qtdNumerica = parseInt(quantidade);
                    if (isNaN(qtdNumerica) || qtdNumerica <= 0) {
                        console.log('Quantidade invalida. Favor tente denovo.');
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
        });
    }
    adicionarAoCarrinho();
}

function selecionarPagamento(carrinho, cliente) {
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
                finalizarCompra(cliente, carrinho, 'Dinheiro');
                break;
            case '2':
                finalizarCompra(cliente, carrinho, 'Cartão de Crédito');
                break;
            case '3':
                finalizarCompra(cliente, carrinho, 'Cartão de Débito');
                break;
            case '4':
                rl.question('Digite o dia do pagamento (DD/MM/AAAA): ', (dia) => {
                    rl.question('Digite a hora do pagamento (HH:MM): ', (hora) => {
                        console.log('Endereço: Rua Dr. Creme, 666, Xique-Xique BA.');
                        console.log('Referência: Na Frente do Cemitério de Xique-Xique.');
                        finalizarCompra(cliente, carrinho, `Xerecard - ${dia} ${hora}`);
                    });
                });
                break;
            case '5':
                rl.question('Digite o código do boleto: ', (codigo) => {
                    console.log('O pagamento deve ser realizado no prazo de uma semana!');
                    finalizarCompra(cliente, carrinho, `Boleto Bancário - Código: ${codigo}`);
                });
                break;
            case '6':
                console.log('O pagamento deve ser realizado no prazo de uma semana!');
                rl.question('Qual o dia de pagamento? (DD/MM/AAAA): ', (dia) => {
                    finalizarCompra(cliente, carrinho, `Fiado - Dia de Pagamento: ${dia}`);
                });
                break;
            default:
                console.log('Forma de pagamento invalida. Favor tente denovo.');
                selecionarPagamento(carrinho, cliente);
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
        perguntarSimNao('voce eseja fazer o cadastro agora? (s/n): ', (resposta) => {
            if (resposta === 's') {
                cadastrarCliente();
            } else {
                console.log('brigado pela compra! volte sempre.');
                rl.close();
            }
        });
    } else {
        menu(cliente);
    }
}

function iniciarSistema() {
    perguntarSimNao('ja possui cadastro? (s/n): ', (resposta) => {
        if (resposta === 's') {
            loadingAnimation(() => {
                loginCliente(cliente => {
                    if (cliente.email === admin.email) {
                        autenticarAdmin(() => menu(cliente));
                    } else {
                        menu(cliente);
                    }
                });
            });
        } else {
            perguntarSimNao('deseja fazer o cadastro? (s/n): ', (respostaCadastro) => {
                if (respostaCadastro === 's') {
                    cadastrarCliente();
                } else {
                    console.log('bem- vindo ah quitanda!');
                    rl.question('pressione Enter para continuar...', () => {
                        loadingAnimation(() => {
                            menu(null);
                        });
                    });
                }
            });
        }
    });
}

carregarDados();
iniciarSistema();
