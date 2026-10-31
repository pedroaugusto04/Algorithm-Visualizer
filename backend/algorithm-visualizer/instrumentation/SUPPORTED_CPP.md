# Subconjunto C++ instrumentado

O visualizador executa o código original com `g++` e coleta snapshots das
estruturas reconhecidas. O AST é analisado por Clang LibTooling, configurado
com o mesmo padrão GNU C++ (17, 20 ou 23) da compilação.

## Suportado nesta versão

- Um arquivo-fonte com função `main`.
- Variáveis globais com nome qualificado e variáveis locais declaradas
  diretamente em um bloco:
<!-- generated-supported-types-start -->
- `std::vector`, `std::deque`, `std::list`, `std::forward_list`, `std::array`, `std::set`, `std::multiset`, `std::unordered_set`, `std::unordered_multiset`, `std::stack`, `std::queue`, `std::priority_queue`, `std::bitset`, `std::pair`, `std::tuple`, `std::map`, `std::multimap`, `std::unordered_map`, `std::unordered_multimap`, `std::string mutável`, `arrays C de tamanho fixo`.
<!-- generated-supported-types-end -->
- `std::pair` e `std::tuple` declarados diretamente também são acompanhados e
  emitidos como arrays.
- Variáveis escalares e tipos aritméticos (`int`, `long`, `double`, `float`, `char`, `bool` e enums)
  declarados diretamente em blocos ou em escopo global são acompanhados e
  emitidos com tipo `scalar` para inspeção na aba de variáveis (Variables).
- Structs definidos antes de `main`, em escopo global ou namespace, podem ser
  usados dentro de contêineres observados. Seus campos públicos podem combinar
  tipos escalares, enums, `std::string`, arrays, `pair`, `tuple`, contêineres
  suportados e outras structs elegíveis. São emitidos como objetos JSON usando
  os nomes dos campos.
- Elementos serializáveis aritméticos, `bool`, `char`, `std::string`, pares,
  tuplas e
  combinações aninhadas dos contêineres serializados pelo runtime.
- `std::tuple` vira sequência na ordem dos elementos. `std::bitset<N>` vira um
  array de booleanos do índice `0` a `N - 1`.
- Contêineres com comparadores, hash, igualdade ou alocadores personalizados,
  desde que seus elementos e chaves possam ser serializados; `vector<bool>` é
  emitido como sequência de booleanos.
- Mutação feita na própria instrução, incluindo chamadas a funções auxiliares
  que recebem a variável observada e algoritmos STL chamados com iteradores
  derivados dela. Cada instrução gera no máximo um snapshot por variável.
- Condições de controle podem consultar estruturas observadas por operações
  reconhecidas como leitura (`size`, `empty`, `find`, entre outras). Efeitos
  colaterais detectáveis no cabeçalho são rejeitados em vez de serem atribuídos
  ao corpo do ramo ou do loop.
- Corpos sem chaves de `if`, `else`, `for`, `while`, `do`, `switch` e
  `for` baseado em intervalo: o instrumentador adiciona chaves para posicionar
  o snapshot com segurança.
- Mapas são apresentados como grafo simples de raiz e pares chave/valor;
  `multimap` preserva chaves repetidas como entradas separadas. Sequências e
  arrays são apresentados como arrays.

Um evento `init` registra o primeiro estado observado. Depois dele, só são
emitidos eventos `snapshot` quando o estado serializado muda. O campo `line`
aponta para a linha da instrução original que encerrou o snapshot.
Globais recebem seu evento `init` no início de `main`, antes da primeira
instrução do usuário; nesse evento, `line` aponta para a declaração global.

## Limites conhecidos

- Só são acompanhadas declarações locais diretas em blocos, além de variáveis
  globais com nome qualificado. Contêineres em namespace anônimo, campos de
  classe e contêineres declarados no cabeçalho de `for` são rejeitados
  explicitamente. Contêineres próprios ficam fora do escopo.
- Structs observados com herança, templates, escopo local, campos privados,
  bitfields ou campos ponteiro/referência são rejeitados com erro de
  instrumentação. Tipos de campo fora da lista suportada também são rejeitados.
- Aliases locais detectáveis por referência, ponteiro, iterador armazenado,
  `span`, `string_view` ou captura por referência em lambda são rejeitados com
  erro. Iteradores temporários usados por algoritmos de leitura não são tratados
  como aliases persistentes. Escape indireto para global ou estado oculto de
  função ainda não pode ser detectado em geral.
- O estado é capturado por instrução completa, não por subexpressão ou por
  cada operação interna. As instruções no corpo são observadas a cada iteração
  quando têm referência direta à variável. Inicialização e incremento de loop
  não aparecem como passos separados. Efeitos indiretos escondidos em globais
  ou em funções que não recebem a estrutura observada não podem ser detectados
  em geral.
- Macros que envolvem uma instrução com variável observada são rejeitadas.
  Múltiplos arquivos, templates instanciados fora do arquivo principal,
  exceções durante a execução e estado interno de objetos não são visualizados.
- Pilhas são exibidas do topo para a base; filas da frente para o fim; filas de
  prioridade em ordem de prioridade. Conjuntos sem ordem são ordenados pelo
  valor serializado para que a visualização seja estável.
- Valores de tipos definidos pelo usuário sem serializer específico aparecem
  como marcador opaco. Chaves de mapa são convertidas em texto e podem colidir
  para tipos personalizados.

Esses limites são deliberados para manter a transformação simples e preservar
uma única execução do programa. Não é uma visualização de cada passo da máquina
virtual nem uma prova de equivalência semântica para C++ arbitrário.
