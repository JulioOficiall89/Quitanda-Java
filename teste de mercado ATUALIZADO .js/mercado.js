const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let produtos = [];
let cadastros = [];
let historicoCompras = [];
const admin = { nome: 'Jurandir', email: 'Jurandir@jurandir', senha: 'radiohead', cpf: '11921045600' };

function carregarDados() {
    const lerArquivo = (arquivo, transformador) => {
        try {
            if (fs.existsSync(arquivo)) {
                return fs.readFileSync(arquivo, 'utf8').trim().split('\n').map(transformador);
            }
        } catch (error) {
            console.error(`Erro ao ler o arquivo ${arquivo}: ${error.message}`);
        }
        return [];
    };

    produtos = lerArquivo('produtos.txt', line => {
        const [nome, preco] = line.split(' - ');
        return { nome, preco: parseFloat(preco) };
    });

    cadastros = lerArquivo('cadastros.txt', line => {
        const [nome, email, senha, cpf] = line.split(' - ');
        return { nome, email, senha, cpf };
    });

    historicoCompras = lerArquivo('historicoCompras.txt', linha => linha);
}

function salvarDados() {
    const salvarArquivo = (arquivo, dados, transformador) => {
        try {
            fs.writeFileSync(arquivo, dados.map(transformador).join('\n'));
        } catch (error) {
            console.error(`Erro ao salvar o arquivo ${arquivo}: ${error.message}`);
        }
    };

    salvarArquivo('produtos.txt', produtos, p => `${p.nome} - ${p.preco.toFixed(2)}`);
    salvarArquivo('cadastros.txt', cadastros, c => `${c.nome} - ${c.email} - ${c.senha} - ${c.cpf}`);
    salvarArquivo('historicoCompras.txt', historicoCompras, h => h);
}

function tratarErro(funcao) {
    try {
        funcao();
    } catch (error) {
        console.error(`Ocorreu um erro: ${error.message}`);
        menu(null);
    }
}

function perguntarSimNao(pergunta, callback) {
    rl.question(pergunta, resposta => {
        resposta.toLowerCase() === 's' || resposta.toLowerCase() === 'n' 
            ? callback(resposta.toLowerCase()) 
            : (console.log('Resposta inválida. Responda com "s" ou "n".'), perguntarSimNao(pergunta, callback));
    });
}

function loadingAnimation(callback) {
    const frames = ['.', '..', '...', '....'];
    let frameIndex = 0;
    const interval = setInterval(() => process.stdout.write(`Loading${frames[frameIndex]}   \r`), 500);
    setTimeout(() => {
        clearInterval(interval);
        process.stdout.write('Loading complete!            \r');
        callback();
    }, 4000);
}

function autenticarAdmin(callback) {
    rl.question('Digite o e-mail do administrador: ', email => {
        if (email !== admin.email) return console.log('E-mail incorreto.'), menu(null);
        rl.question('Digite a senha: ', senha => {
            if (senha !== admin.senha) return console.log('Senha incorreta.'), menu(null);
            rl.question('Digite o CPF: ', cpf => {
                if (cpf !== admin.cpf) return console.log('CPF incorreto.'), menu(null);
                console.log('Bem-vindo, Jurandir!');
                callback();
            });
        });
    });
}

function validarEntrada(mensagem, regex, callback) {
    rl.question(mensagem, entrada => {
        regex.test(entrada) ? callback(entrada) : (console.log('Entrada inválida.'), validarEntrada(mensagem, regex, callback));
    });
}

function cadastrarCliente() {
    tratarErro(() => {
        validarEntrada('Nome: ', /^.{1,50}$/, nome => {
            validarEntrada('Email/hotmail: ', /^[^\s@]+@[^\s@]+\.[^\s@]+$/, email => {
                validarEntrada('Senha: ', /^.{1,20}$/, senha => {
                    validarEntrada('CPF (somente números): ', /^\d{11}$/, cpf => {
                        cadastros.push({ nome, email, senha, cpf });
                        salvarDados();
                        console.log('Cliente cadastrado com sucesso!');
                        menu(null);
                    });
                });
            });
        });
    });
}

function loginCliente(callback) {
    tratarErro(() => {
        rl.question('Email: ', email => {
            rl.question('Senha: ', senha => {
                const cliente = cadastros.find(c => c.email === email && c.senha === senha);
                if (!cliente) return (console.log('Email ou senha incorretos.'), perguntarSimNao('Deseja tentar o login novamente? (s/n): ', resposta => resposta === 's' ? loginCliente(callback) : menu(null)));
                cliente.email === admin.email ? autenticarAdmin(menuAdmin) : callback(cliente);
            });
        });
    });
}

function adicionarProduto() {
    tratarErro(() => {
        rl.question('Nome do produto: ', nome => {
            rl.question('Preço: ', preco => {
                const precoNumerico = parseFloat(preco);
                isNaN(precoNumerico) ? (console.log('Preço inválido. Tente novamente.'), adicionarProduto()) : (produtos.push({ nome, preco: precoNumerico }), salvarDados(), console.log('Produto adicionado com sucesso!'), menuAdmin());
            });
        });
    });
}

function alterarPrecoProduto() {
    tratarErro(() => {
        rl.question('Nome do produto: ', nome => {
            const produto = produtos.find(p => p.nome === nome);
            if (!produto) return console.log('Produto não encontrado.'), menuAdmin();
            rl.question('Novo preço: ', preco => {
                const precoNumerico = parseFloat(preco);
                isNaN(precoNumerico) ? (console.log('Preço inválido.'), alterarPrecoProduto()) : (produto.preco = precoNumerico, salvarDados(), console.log('Preço alterado com sucesso!'), menuAdmin());
            });
        });
    });
}

function totalVendasDia() {
    tratarErro(() => {
        const hoje = new Date().toLocaleDateString('pt-BR');
        const total = historicoCompras.reduce((acc, linha) => linha.startsWith(hoje) ? acc + parseFloat(linha.split(', ')[1]) : acc, 0);
        console.log(`Total de vendas do dia (${hoje}): R$${total.toFixed(2)}`);
        menuAdmin();
    });
}

function exibirProdutos() {
    console.log('Produtos disponíveis:');
    produtos.forEach((produto, index) => console.log(`${index + 1}. ${produto.nome} - R$${produto.preco.toFixed(2)}`));
}

function exibirCatalogo() {
    console.log('\nCatálogo de Produtos:');
    exibirProdutos();
    console.log('1. Voltar ao Menu Principal');
    rl.question('Escolha uma opção: ', opcao => {
        if (opcao === '1') {
            menu(null); // Volta ao menu principal
        } else {
            console.log('Opção inválida.');
            exibirCatalogo(); // Repete a exibição do catálogo
        }
    });
}

function selecionarPagamento(carrinho, cliente) {
    tratarErro(() => {
        if (!cliente) return console.log('Cliente não autenticado.'), menu(null);
        console.log('\nFormas de Pagamento:');
        console.log('1. Dinheiro');
        console.log('2. Cartão de Crédito');
        console.log('3. Cartão de Débito');
        console.log('4. Xerecard');
        console.log('5. Boleto Bancário');
        console.log('6. Fiado');
        rl.question('Escolha uma forma de pagamento: ', escolha => {
            const formasPagamento = {
                '1': 'Dinheiro',
                '2': () => {
                    rl.question('Número de parcelas (1 a 12): ', parcelas => {
                        const numParcelas = parseInt(parcelas);
                        if (isNaN(numParcelas) || numParcelas < 1 || numParcelas > 12) return console.log('Número de parcelas inválido.'), selecionarPagamento(carrinho, cliente);
                        const juros = numParcelas > 4 ? 0.02 * (numParcelas - 4) : 0; // Juros de 2% por parcela além da 4ª
                        const total = carrinho.reduce((acc, produto) => acc + produto.preco, 0);
                        const valorParcela = total / numParcelas * (1 + juros);
                        console.log(`Total com juros: R$${total.toFixed(2)}`);
                        console.log(`Valor de cada parcela: R$${valorParcela.toFixed(2)}`);
                        finalizarCompra(cliente, carrinho, `Cartão de Crédito - ${numParcelas} parcela(s)`);
                    });
                },
                '3': 'Cartão de Débito',
                '4': () => {
                    rl.question('Digite o dia do pagamento (DD/MM/AAAA): ', dia => {
                        const data = new Date(dia);
                        if (isNaN(data.getTime())) return console.log('Data inválida.'), selecionarPagamento(carrinho, cliente);
                        finalizarCompra(cliente, carrinho, `Xerecard - ${dia}`);
                    });
                },
                '5': 'Boleto Bancário',
                '6': 'Fiado'
            };

            const pagamentoSelecionado = formasPagamento[escolha];
            if (typeof pagamentoSelecionado === 'string') {
                console.log(`Forma de pagamento selecionada: ${pagamentoSelecionado}`);
                finalizarCompra(cliente, carrinho, pagamentoSelecionado);
            } else if (typeof pagamentoSelecionado === 'function') {
                pagamentoSelecionado();
            } else {
                console.log('Opção inválida.');
                selecionarPagamento(carrinho, cliente);
            }
        });
    });
}

function finalizarCompra(cliente, carrinho, formaPagamento) {
    tratarErro(() => {
        const total = carrinho.reduce((acc, produto) => acc + produto.preco, 0);
        const hoje = new Date().toLocaleDateString('pt-BR');
        historicoCompras.push(`${hoje}, R$${total.toFixed(2)}, ${cliente.email}, ${formaPagamento}`);
        salvarDados();
        console.log('Compra finalizada com sucesso!');
        menu(null);
    });
}

function menu(cliente) {
    console.log('\n--- Menu Principal ---');
    console.log('1. Comprar Produtos');
    console.log('2. Exibir Catálogo de Produtos');
    console.log('3. Sair');
    rl.question('Escolha uma opção: ', opcao => {
        switch (opcao) {
            case '1':
                tratarErro(() => {
                    exibirProdutos();
                    rl.question('Digite o nome ou número do produto para comprar: ', input => {
                        const index = parseInt(input) - 1;
                        if (!isNaN(index) && index >= 0 && index < produtos.length) {
                            selecionarPagamento([produtos[index]], cliente);
                        } else {
                            const produto = produtos.find(p => p.nome.toLowerCase() === input.toLowerCase());
                            if (!produto) return console.log('Produto não encontrado.'), menu(cliente);
                            selecionarPagamento([produto], cliente);
                        }
                    });
                });
                break;
            case '2':
                exibirCatalogo();
                break;
            case '3':
                console.log('Saindo...');
                rl.close();
                break;
            default:
                console.log('Opção inválida.');
                menu(cliente);
                break;
        }
    });
}

function menuAdmin() {
    console.log('\n--- Menu do Administrador ---');
    console.log('1. Adicionar Produto');
    console.log('2. Alterar Preço de Produto');
    console.log('3. Total de Vendas do Dia');
    console.log('4. Sair');
    rl.question('Escolha uma opção: ', opcao => {
        switch (opcao) {
            case '1':
                adicionarProduto();
                break;
            case '2':
                alterarPrecoProduto();
                break;
            case '3':
                totalVendasDia();
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

function iniciar() {
    carregarDados();
    rl.question('Você já é um cliente cadastrado? (s/n): ', resposta => {
        if (resposta.toLowerCase() === 's') {
            loginCliente(cliente => menu(cliente));
        } else if (resposta.toLowerCase() === 'n') {
            cadastrarCliente();
        } else {
            console.log('Resposta inválida.');
            iniciar();
        }
    });
}

iniciar();
