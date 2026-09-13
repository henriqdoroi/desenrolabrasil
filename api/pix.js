export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    const {
      amount_cents,
      customer = {},
      product_id,
      description,
      external_reference,
      metadata = {},
      utm = {}
    } = req.body || {};

    const amount = Number(amount_cents);

    if (!Number.isInteger(amount) || amount < 500) {
      return res.status(422).json({
        success: false,
        error: 'amount_cents inválido'
      });
    }

    const apiKey = process.env.BRAVOPAY_API_KEY;

    if (!apiKey) {
      console.error('BRAVOPAY_API_KEY não configurada');

      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor ausente'
      });
    }

    const payload = {
      amount_cents: amount,
      method: 'pix',
      customer: {
        email: customer.email || '',
        name: customer.name || '',
        cpf: customer.cpf || '',
        phone: customer.phone || ''
      }
    };

    if (product_id) {
      payload.product_id = product_id;
    }

    if (description) {
      payload.description = String(description).slice(0, 300);
    }

    if (external_reference) {
      payload.external_reference =
        String(external_reference).slice(0, 120);
    }

    if (metadata && typeof metadata === 'object') {
      payload.metadata = metadata;
    }

    if (utm && typeof utm === 'object') {
      payload.utm = {
        source: utm.source || '',
        medium: utm.medium || '',
        campaign: utm.campaign || '',
        content: utm.content || '',
        term: utm.term || '',
        fbclid: utm.fbclid || '',
        gclid: utm.gclid || '',
        ttclid: utm.ttclid || ''
      };
    }

    const idempotencyKey =
      req.headers['x-idempotency-key'] ||
      cryptoRandomId();

    const response = await fetch(
      'https://bravopay.club/api/v1/transactions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error(
        'BravoPay error:',
        response.status,
        data
      );

      return res.status(response.status).json({
        success: false,
        error:
          data?.error?.message ||
          'Não foi possível criar a cobrança'
      });
    }

    return res.status(200).json({
      success: true,
      transaction: {
        id: data.id,
        status: data.status,
        amount_cents: data.amount_cents,
        pix: {
          copy_paste: data.pix?.copy_paste || '',
          expires_at: data.pix?.expires_at || null
        }
      }
    });

  } catch (error) {
    console.error('Erro /api/pix:', error);

    return res.status(500).json({
      success: false,
      error: 'Erro interno ao gerar PIX'
    });
  }
}

function cryptoRandomId() {
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2) +
    '-' +
    Math.random().toString(36).slice(2)
  );
}
