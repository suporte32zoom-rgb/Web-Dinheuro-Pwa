// Busca qualquer conjunto de ativos, índices ou moedas dinamicamente
export const fetchEconomyData = async (query = 'all') => {
  try {
    const baseUrl =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AWESOME_ECONOMY_URL) ||
      'https://economia.awesomeapi.com.br';
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = query === 'all' 
      ? `${cleanBase}/json/all`
      : `${cleanBase}/last/${query}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao obter dados econômicos');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Falha no serviço de economia geral:', error?.message || error);
    return null;
  }
};
