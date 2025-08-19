const axios = require('axios');

async function testCreateQuotation() {
  try {
    // Datos de prueba para crear una cotización
    const quotationData = {
      request_id: "550e8400-e29b-41d4-a716-446655440005", // ID de una orden médica existente
      delivery_time_days: 7,
      delivery_terms: "Entrega en 7 días hábiles",
      payment_terms: "Pago a 30 días",
      warranty_terms: "Garantía de 1 año",
      observations: "Cotización de prueba",
      valid_until: "2025-08-30",
      items: [
        {
          request_item_id: "550e8400-e29b-41d4-a716-446655440011",
          unit_price: 5000.00,
          quantity: 2,
          delivery_time_days: 5,
          observations: "Item de prueba"
        }
      ]
    };

    console.log('Creando cotización de prueba...');
    console.log('Datos:', JSON.stringify(quotationData, null, 2));

    const response = await axios.post('http://localhost:3000/api/provider-quotations', quotationData, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Cotización creada exitosamente:');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    // Verificar que la cotización aparezca en el endpoint de auditoría
    console.log('\nVerificando que la cotización aparezca en auditoría...');
    
    const auditResponse = await axios.get('http://localhost:3000/api/auditor/pending-quotations', {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Cotizaciones en auditoría:');
    console.log('Total:', auditResponse.data.data.total);
    console.log('Cotizaciones:', auditResponse.data.data.data.length);

    if (auditResponse.data.data.data.length > 0) {
      console.log('Primera cotización:');
      console.log('- ID:', auditResponse.data.data.data[0].quotation_id);
      console.log('- Status:', auditResponse.data.data.data[0].status);
      console.log('- Provider:', auditResponse.data.data.data[0].provider_name);
      console.log('- Patient:', auditResponse.data.data.data[0].patient_name);
      console.log('- Total Cost:', auditResponse.data.data.data[0].total_cost);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCreateQuotation(); 