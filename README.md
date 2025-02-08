# TCC

Repositorio para armazenar arquivos do TCC.

- monitor-temperatura: Aplicação para monitoramento de temperaturas em estações de metro.
- Gerador_de_Temperaturas: Sripts para gerar as capacidades e recursos dentro da plataforma interscity.

#Pré-Requisitos

- Plataforma InterScity;
- yarn;
- node;

# Funcionamento

Para utilizar e executar a aplicação, é necessario seguir os seguintes passos.

- Inicialmente baixe o repositorio do trabalho;
- Caso for a primeiro vez, acesse o diretorio do Gerador_de_Temperaturas e execute o comando "npm run script2". Esse comando executa o script de criação das capacidades e recursos dentro da plataforma interscity e só necessita ser executado uma vez.
- No diretorio do Gerador_de_Temperaturas, agora executamos o scipt de geração de dados "npm run script1", onde ele vai ser responsavel por fornecer dados para os recursos criados.
- Agora acessamos o diretorio do monitor-temperatura, nele executamos o comando "yarn start" para executar a aplicação de monitoramente. A aplicação será aberta o navegador padrão em localhost:3000.