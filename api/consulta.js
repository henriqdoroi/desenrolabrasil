export default async function handler(req, res) {
  // Aceitar somente POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    const { cpf } = req.body || {};

    // Normaliza CPF
    const rawCpf = String(cpf || '').replace(/\D/g, '');

    // Validação básica
    if (rawCpf.length !== 11) {
      return res.status(400).json({
        success: false,
        error: 'CPF inválido'
      });
    }

    // A chave fica SOMENTE no servidor
    const apiKey = process.env.CPFHUB_API_KEY;

    if (!apiKey) {
      console.error('CPFHUB_API_KEY não configurada');

      return res.status(500).json({
        success: false,
        error: 'Erro interno'
      });
    }

    // Consulta CPFHub
    const response = await fetch(
      `https://api.cpfhub.io/cpf/${rawCpf}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-api-key': apiKey
        },
        cache: 'no-store'
      }
    );

    const data = await response.json();

    // Não vaza a API Key nem detalhes internos
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data?.error || 'Não foi possível consultar o CPF'
      });
    }

    // Retorna somente o necessário
    if (!data.success || !data.data) {
      return res.status(404).json({
        success: false,
        error: 'CPF não encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        name: data.data.name || '',
        birthDate: data.data.birthDate || '',
        gender: data.data.gender || ''
      }
    });

  } catch (error) {
    console.error('Erro CPF:', error);

    return res.status(500).json({
      success: false,
      error: 'Erro ao consultar CPF'
    });
  }
}
