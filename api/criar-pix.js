export default async function handler(req, res) {
  // Permite apenas requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Repassa os dados do front-end para a BravoPay
    const response = await fetch('https://bravopay.club/api/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Puxa a chave oculta configurada nas variáveis de ambiente da Vercel
        'Authorization': `Bearer ${process.env.BRAVOPAY_API_KEY}` 
      },
      body: JSON.stringify(req.body) // O payload enviado pelo front-end
    });

    const data = await response.json();
    
    // Devolve o resultado da BravoPay de volta para o seu front-end
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro na Vercel (criar-pix):', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
