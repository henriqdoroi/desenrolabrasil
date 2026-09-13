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

    // Token da Magma DataHub fica somente no servidor
    const apiToken = process.env.MAGMA_DATAHUB_TOKEN;

    if (!apiToken) {
      console.error('MAGMA_DATAHUB_TOKEN não configurado');

      return res.status(500).json({
        success: false,
        error: 'Erro interno'
      });
    }

    // Consulta Magma DataHub
    const response = await fetch(
      `https://magmadatahub.com/api.php?token=${encodeURIComponent(apiToken)}&cpf=${encodeURIComponent(rawCpf)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-store'
      }
    );

    const data = await response.json();

    console.log('Resposta Magma DataHub:', data);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data?.error || data?.message || 'Não foi possível consultar o CPF'
      });
    }

    // Retorna a resposta da API
    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Erro CPF Magma DataHub:', error);

    return res.status(500).json({
      success: false,
      error: 'Erro ao consultar CPF'
    });
  }
}
