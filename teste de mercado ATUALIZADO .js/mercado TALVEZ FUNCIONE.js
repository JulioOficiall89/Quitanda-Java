const fs = require('fs');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let produtos = [];
let cadastros = [];
let historicoCompras = [];
const admin = { nome: 'Jurandir', email: 'Jurandir@jurandir', senha: 'radiohead', cpf: '11921045600' };

const MAX_NOME_LENGTH = 50;
const MAX_SENHA_LENGTH = 20;
const MAX_TENTATIVAS_LOGIN = 3;
let tentativasFalhas = 0;
let codigoRecuperacao = '';

function gerarCodigoRecuperacao() {
    return crypto.randomInt(100000, 999999).toString();
}

function carregarDados() {
    try {
        if (fs.existsSync('produtos.txt')) {
            produtos = fs.readFileSync('produtos.txt', 'utf8').trim().split('\n').map(line => {
                const [nome, preco, categoria] = line.split(' - ');
                return { nome, preco: parseFloat(preco), categoria };
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
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

function salvarDados() {
    const produtosData = produtos.map(produto => `${produto.nome} - ${produto.preco.toFixed(2)} - ${produto.categoria}`).join('\n');
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
                            console.log('Bem-vindo, Jurandir!');
                            callback();
                        } else {
                            console.log('CPF incorreto.');
                            menu(null);
                        }
                    });
                } else {
                    console.log('Senha incorreta.');
                    menu(null);
                }
            });
        } else {
            console.log('E-mail incorreto.');
            menu(null);
        }
    });
}

function validarEmail(callback) {
    rl.question('Email/hotmail: ', (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(email)) {
            callback(email);
        } else {
            console.log('O e-mail/hotemail deve ser um formato válido (exemplo: exemplo@dominio.com).');
            validarEmail(callback);
        }
    });
}

function validarCPF(callback) {
    rl.question('CPF (somente números): ', (cpf) => {
        if (/^\d{11}$/.test(cpf)) {
            callback(cpf);
        } else {
            console.log('O CPF deve conter exatamente 11 números.');
            validarCPF(callback);
        }
    });
}

function validarNome(callback) {
    rl.question('Nome: ', (nome) => {
        if (nome.length > MAX_NOME_LENGTH) {
            console.log(`O nome deve ter no máximo ${MAX_NOME_LENGTH} caracteres.`);
            validarNome(callback);
        } else {
            callback(nome);
        }
    });
}

function validarSenha(callback) {
    rl.question('Senha: ', (senha) => {
        if (senha.length > MAX_SENHA_LENGTH) {
            console.log(`A senha deve ter no máximo ${MAX_SENHA_LENGTH} caracteres.`);
            validarSenha(callback);
        } else {
            callback(senha);
        }
    });
}

function cadastrarCliente() {
    validarNome((nome) => {
        validarEmail((email) => {
            validarSenha((senha) => {
                validarCPF((cpf) => {
                    cadastros.push({ nome, email, senha, cpf });
                    salvarDados();
                    console.log('Cliente cadastrado com sucesso!');
                    menu(null);
                });
            });
        });
    });
}

function recuperarSenha(callback) {
    codigoRecuperacao = gerarCodigoRecuperacao();
    console.log(`Código de recuperação gerado: ${codigoRecuperacao}`);

    rl.question('Digite o código de recuperação: ', (codigo) => {
        if (codigo === codigoRecuperacao) {
            console.log('Código correto.');
            validarEmail((email) => {
                const cliente = cadastros.find(c => c.email === email);
                if (cliente) {
                    validarSenha((novaSenha) => {
                        cliente.senha = novaSenha;
                        salvarDados();
                        console.log('Senha alterada com sucesso!');
                        menu(null);
                    });
                } else {
                    console.log('Email não encontrado.');
                    menu(null);
                }
            });
        } else {
            console.log('Código incorreto. Tente novamente.');
            recuperarSenha(callback);
        }
    });
}

function loginCliente(callback) {
    rl.question('Email: ', (email) => {
        rl.question('Senha: ', (senha) => {
            const cliente = cadastros.find(c => c.email === email && c.senha === senha);
            if (cliente) {
                tentativasFalhas = 0;
                console.log(`Bem-vindo, ${cliente.nome}!`);
                if (email === admin.email) {
                    autenticarAdmin(() => menuAdmin());
                } else {
                    callback(cliente);
                }
            } else {
                tentativasFalhas++;
                if (tentativasFalhas >= MAX_TENTATIVAS_LOGIN) {
                    console.log('Número máximo de tentativas de login falhadas atingido.');
                    perguntarSimNao('Você esqueceu a senha? (s/n): ', (resposta) => {
                        if (resposta === 's') {
                            recuperarSenha(callback);
                        } else {
                            menu(null);
                        }
                    });
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
            rl.question('Categoria: ', (categoria) => {
                produtos.push({ nome, preco: precoNumerico, categoria });
                salvarDados();
                console.log('Produto adicionado com sucesso!');
                menuAdmin();
            });
        });
    });
}

function exibirProdutos() {
    console.log('Produtos disponíveis:');
    produtos.forEach((produto, index) => {
        console.log(`${index + 1}. ${produto.nome} - R$${produto.preco.toFixed(2)} - Categoria: ${produto.categoria}`);
    });
}

function filtrarProdutosPorCategoria(categoria, callback) {
    const produtosFiltrados = produtos.filter(produto => produto.categoria.toLowerCase() === categoria.toLowerCase());
    callback(produtosFiltrados);
}

function adicionarPromocao() {
    rl.question('Nome do produto para adicionar promoção: ', (nome) => {
        const produto = produtos.find(p => p.nome.toLowerCase() === nome.toLowerCase());
        if (produto) {
            rl.question('Desconto em %: ', (desconto) => {
                const descontoNumerico = parseFloat(desconto);
                if (isNaN(descontoNumerico) || descontoNumerico < 0 || descontoNumerico > 100) {
                    console.log('Desconto inválido. Deve estar entre 0 e 100.');
                    adicionarPromocao();
                    return;
                }
                produto.preco = produto.preco * (1 - descontoNumerico / 100);
                salvarDados();
                console.log('Promoção adicionada com sucesso!');
                menuAdmin();
            });
        } else {
            console.log('Produto não encontrado.');
            menuAdmin();
        }
    });
}

function menuAdmin() {
    console.log('\nMenu do Administrador:');
    console.log('1. Exibir produtos por categoria');
    console.log('2. Adicionar produto');
    console.log('3. Adicionar promoção');
    console.log('4. Sair');

    rl.question('Escolha uma opção: ', (opcao) => {
        switch (opcao) {
            case '1':
                rl.question('Digite a categoria dos produtos a serem exibidos: ', (categoria) => {
                    filtrarProdutosPorCategoria(categoria, (produtosFiltrados) => {
                        if (produtosFiltrados.length > 0) {
                            produtosFiltrados.forEach(produto => {
                                console.log(`${produto.nome} - R$${produto.preco.toFixed(2)} - Categoria: ${produto.categoria}`);
                            });
                        } else {
                            console.log('Nenhum produto encontrado nesta categoria.');
                        }
                        menuAdmin();
                    });
                });
                break;
            case '2':
                adicionarProduto();
                break;
            case '3':
                adicionarPromocao();
                break;
            case '4':
                console.log('Saindo...');
                rl.close();
                break;
            default:
                console.log('Opção inválida.');
                menuAdmin();
                break;
        }
    });
}

function menuCliente(cliente) {
    console.log('\nMenu do Cliente:');
    console.log('1. Ver produtos');
    console.log('2. Sair');

    rl.question('Escolha uma opção: ', (opcao) => {
        switch (opcao) {
            case '1':
                exibirProdutos();
                menuCliente(cliente);
                break;
            case '2':
                console.log('Saindo...');
                rl.close();
                break;
            default:
                console.log('Opção inválida.');
                menuCliente(cliente);
                break;
        }
    });
}

function menu() {
    console.log('\nMenu Principal:');
    console.log('1. Login');
    console.log('2. Cadastro');
    console.log('3. Sair');

    rl.question('Escolha uma opção: ', (opcao) => {
        switch (opcao) {
            case '1':
                loadingAnimation(() => {
                    loginCliente((cliente) => {
                        menuCliente(cliente);
                    });
                });
                break;
            case '2':
                cadastrarCliente();
                break;
            case '3':
                console.log('Saindo...');
                rl.close();
                break;
            default:
                console.log('Opção inválida.');
                menu();
                break;
        }
    });
}

carregarDados();
menu();
