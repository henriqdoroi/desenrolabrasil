export default async function handler(req, res) {
  const { id } = req.query; // Pega o ID da URL (?id=tx_xxx)

  if (!id) {
    return res.status(400).json({ error: 'ID da transação não fornecido' });
  }

  try {
    // Consulta o status direto na BravoPay
    const response = await fetch(`https://bravopay.club/api/v1/transactions/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        // Puxa a chave oculta
        'Authorization': `Bearer ${process.env.BRAVOPAY_API_KEY}` 
      }
    });

    const data = await response.json();
    
    // Devolve o status para o front-end
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro na Vercel (status-pix):', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
