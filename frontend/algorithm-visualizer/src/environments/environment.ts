export const environment = {
    production: false,
    baseUrl: 'http://localhost:8080',
    apiUserLogin: '/users/login',
    apiUserRegister: '/users/register',
    apiGetUserGraphIdsData: '/users/graphs/id',
    apiGetGraphById: '/graphs/',
    apiGetUserMatrixData: '/users/matrices',
    apiGetSupportedAlgorithmsByDataStructure: '/algorithms/getStructureSupportedAlgorithms/',
    apiCreateDirectedUnweightedGraph: '/graphs/createGraph/directed/unweighted',
    apiCreateDirectedWeightedGraph: '/graphs/createGraph/directed/weighted',
    apiCreateUndirectedUnweightedGraph: '/graphs/createGraph/undirected/unweighted',
    apiCreateUndirectedWeightedGraph: '/graphs/createGraph/undirected/weighted',
};