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

    // Remove pontos, traços e qualquer caractere não numérico
    const rawCpf = String(cpf || '').replace(/\D/g, '');

    // Validação básica
    if (rawCpf.length !== 11) {
      return res.status(400).json({
        success: false,
        error: 'CPF inválido'
      });
    }

    // Token da Magma fica somente no servidor
    const apiToken = process.env.MAGMA_DATAHUB_TOKEN;

    if (!apiToken) {
      console.error('MAGMA_DATAHUB_TOKEN não configurado');

      return res.status(500).json({
        success: false,
        error: 'Erro interno'
      });
    }

    // Consulta a Magma DataHub
    const apiUrl =
      `https://magmadatahub.com/api.php` +
      `?token=${encodeURIComponent(apiToken)}` +
      `&cpf=${encodeURIComponent(rawCpf)}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    const data = await response.json();

    console.log('Resposta Magma:', data);

    // Erro retornado pela Magma
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error:
          data?.error ||
          data?.message ||
          'Não foi possível consultar o CPF'
      });
    }

    // Verifica se a API realmente retornou os dados esperados
    if (!data || !data.nome) {
      return res.status(404).json({
        success: false,
        error: 'CPF não encontrado'
      });
    }

    // Converte o formato da Magma para o formato
    // que seu frontend antigo provavelmente já utiliza
    return res.status(200).json({
      success: true,
      data: {
        name: data.nome || '',
        birthDate: data.nascimento || '',
        gender: data.sexo || '',
        motherName: data.nome_mae || '',
        cpf: data.cpf || rawCpf
      }
    });

  } catch (error) {
    console.error('Erro CPF Magma:', error);

    return res.status(500).json({
      success: false,
      error: 'Erro ao consultar CPF'
    });
  }
}
