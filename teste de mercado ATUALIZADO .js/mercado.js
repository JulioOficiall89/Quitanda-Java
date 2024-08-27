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
        validarEntrada('Nome (máx 50 caracteres): ', /^.{1,50}$/, nome => {
            validarEntrada('Email/hotmail: ', /^[^\s@]+@[^\s@]+\.[^\s@]+$/, email => {
                validarEntrada('Senha (máx 20 caracteres): ', /^.{1,20}$/, senha => {
                    validarEntrada('CPF (somente números, 11 dígitos): ', /^\d{11}$/, cpf => {
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

function catalogoProdutos() {
    console.log('\nCatálogo de Produtos:');
    exibirProdutos();
    menu(null); // Volta ao menu principal após exibir o catálogo
}

function comprarProdutos(cliente) {
    tratarErro(() => {
        if (!cliente) return console.log('Cliente não autenticado.'), menu(null);
        exibirProdutos();
        const carrinho = [];
        const adicionarAoCarrinho = () => {
            rl.question('Escolha um produto (ou digite "sair" para finalizar): ', opcao => {
                if (opcao.toLowerCase() === 'sair') {
                    selecionarPagamento(carrinho, cliente);
                    return;
                }
                const indice = parseInt(opcao) - 1;
                const produto = produtos[indice];
                if (!produto) return console.log('Produto não encontrado.'), adicionarAoCarrinho();
                rl.question('Quantidade: ', quantidade => {
                    const qtdNumerica = parseInt(quantidade);
                    if (isNaN(qtdNumerica) || qtdNumerica <= 0) return console.log('Quantidade inválida.'), adicionarAoCarrinho();
                    for (let i = 0; i < qtdNumerica; i++) carrinho.push(produto);
                    console.log(`${qtdNumerica} ${produto.nome}(s) adicionado(s) ao carrinho.`);
                    adicionarAoCarrinho();
                });
            });
        };
        adicionarAoCarrinho();
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
                        if (isNaN(numParcelas) || numParcelas < 1 || numParcelas > 12) {
                            console.log('Número de parcelas inválido.');
                            selecionarPagamento(carrinho, cliente);
                        } else {
                            const total = carrinho.reduce((acc, produto) => acc + produto.preco, 0);
                            const valorParcela = numParcelas > 4 ? total * 1.02 / numParcelas : total / numParcelas; // 2% de juros a partir de 5 parcelas
                            finalizarCompra(cliente, carrinho, `Cartão de Crédito - ${numParcelas} parcela(s) de R$${valorParcela.toFixed(2)}`);
                        }
                    });
                },
                '3': 'Cartão de Débito',
                '4': () => {
                    rl.question('Digite o dia do pagamento (DD/MM/AAAA): ', dia => {
                        const data = new Date(dia);
                        if (isNaN(data.getTime())) return console.log('Data inválida.'), selecionarPagamento(carrinho, cliente);
                        finalizarCompra(cliente, carrinho, `Xerecard - Data de pagamento: ${data.toLocaleDateString()}`);
                    });
                },
                '5': () => {
                    rl.question('Digite o código de barras do boleto: ', codigo => {
                        finalizarCompra(cliente, carrinho, `Boleto Bancário - Código: ${codigo}`);
                    });
                },
                '6': 'Fiado'
            };
            if (formasPagamento[escolha]) {
                typeof formasPagamento[escolha] === 'string' ? finalizarCompra(cliente, carrinho, formasPagamento[escolha]) : formasPagamento[escolha]();
            } else {
                console.log('Opção inválida.');
                selecionarPagamento(carrinho, cliente);
            }
        });
    });
}

function finalizarCompra(cliente, carrinho, tipoPagamento) {
    tratarErro(() => {
        if (!cliente) return console.log('Cliente não autenticado.'), menu(null);
        const total = carrinho.reduce((acc, produto) => acc + produto.preco, 0);
        const data = new Date();
        const dataFormatada = `${data.getDate()}/${data.getMonth() + 1}/${data.getFullYear()} ${data.getHours()}:${data.getMinutes().toString().padStart(2, '0')}`;
        const produtosContagem = carrinho.reduce((acc, produto) => {
            acc[produto.nome] = (acc[produto.nome] || 0) + 1;
            return acc;
        }, {});
        const produtosComprados = Object.entries(produtosContagem)
            .map(([nome, quantidade]) => `${quantidade} ${nome}(s)`)
            .join(', ');
        const compraDetalhes = `${dataFormatada}, ${total.toFixed(2)}, ${tipoPagamento}, CPF: ${cliente.cpf}`;
        historicoCompras.push(compraDetalhes);
        historicoCompras.push(produtosComprados);
        salvarDados();
        console.log('Compra finalizada!');
        console.log('Nota Fiscal:');
        console.log(`Cliente: ${cliente.nome}`);
        console.log(`Total: R$${total.toFixed(2)}`);
        console.log(`Produtos: ${produtosComprados}`);
        menu(cliente);
    });
}

function menuAdmin() {
    console.log('\n--- Menu Administrativo ---');
    console.log('1. Adicionar Produto');
    console.log('2. Adicionar Promoção');
    console.log('3. Mudar Preço do Item');
    console.log('4. Total de Vendas do Dia');
    console.log('5. Voltar ao Menu Principal');
    rl.question('Escolha uma opção: ', opcao => {
        const opcoesAdmin = {
            '1': adicionarProduto,
            '2': () => {
                tratarErro(() => {
                    rl.question('Nome do produto para adicionar promoção: ', nome => {
                        const produto = produtos.find(p => p.nome === nome);
                        if (!produto) return console.log('Produto não encontrado.'), menuAdmin();
                        rl.question('Novo preço com promoção: ', preco => {
                            const precoNumerico = parseFloat(preco);
                            isNaN(precoNumerico) ? (console.log('Preço inválido.'), menuAdmin()) : (produto.preco = precoNumerico, salvarDados(), console.log('Promoção aplicada com sucesso!'), menuAdmin());
                        });
                    });
                });
            },
            '3': alterarPrecoProduto,
            '4': totalVendasDia,
            '5': () => menu(null)
        };
        (opcoesAdmin[opcao] || (() => console.log('Opção inválida.'), menuAdmin()))();
    });
}

function menu(cliente) {
    console.log('\n--- Menu Principal ---');
    console.log('1. Comprar Produtos');
    console.log('2. Exibir Catálogo de Produtos');
    console.log('3. Sair');
    rl.question('Escolha uma opção: ', opcao => {
        const opcoesCliente = {
            '1': () => comprarProdutos(cliente),
            '2': catalogoProdutos,
            '3': () => (console.log('Obrigado pela visita!'), rl.close())
        };
        (opcoesCliente[opcao] || (() => console.log('Opção inválida.'), menu(cliente)))();
    });
}

function iniciarSistema() {
    tratarErro(() => {
        perguntarSimNao('Já possui cadastro? (s/n): ', resposta => {
            resposta === 's' ? loadingAnimation(() => loginCliente(cliente => cliente.email === admin.email ? autenticarAdmin(menuAdmin) : menu(cliente))) : (console.log('Bem-vindo à quitanda!'), perguntarSimNao('Deseja fazer o cadastro? (s/n): ', respostaCadastro => respostaCadastro === 's' ? cadastrarCliente() : rl.close()));
        });
    });
}

carregarDados();
iniciarSistema();
