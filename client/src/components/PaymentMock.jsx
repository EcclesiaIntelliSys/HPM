import React, { useState } from 'react';
const API_BASE = process.env.REACT_APP_API_URL || '';

export default function PaymentMock({ project, onDone }) {
  const [method, setMethod] = useState('stripe');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const pay = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const payRes = await fetch(`${API_BASE}/api/payments/mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, details: { note: 'mock payment' } })
      });
      if (!payRes.ok) throw new Error(`Payment endpoint returned ${payRes.status}`);
      const payJson = await payRes.json();
      if (!payJson.approved) throw new Error('Payment not approved');

      const projectPayload = {
        ...project,
        paymentInfo: { method, tx: payJson.transactionId || `MOCK-${Date.now()}` }
      };

      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const saveRes = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify(projectPayload)
      });

      if (!saveRes.ok) {
        const errBody = await saveRes.text().catch(() => '');
        throw new Error(`Save project failed ${saveRes.status} ${errBody}`);
      }

      setStatus('success');
      setMessage('Payment approved and project saved.');
      setTimeout(() => onDone && onDone(), 1000);
    } catch (err) {
      console.error('PaymentMock error', err);
      setStatus('error');
      setMessage(err.message || 'Unknown error during payment');
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h3 className="text-lg font-semibold mb-3">Mock Payment</h3>
      <label className="block mb-2">Payment Method</label>
      <select value={method} onChange={e => setMethod(e.target.value)} className="w-full p-2 border rounded mb-4">
        <option value="stripe">Pay by Stripe</option>
        <option value="card">Credit Card</option>
      </select>
      <button
        onClick={pay}
        disabled={status === 'loading'}
        className={`w-full py-2 rounded text-white ${status === 'loading' ? 'bg-gray-400' : 'bg-olive-800 hover:bg-olive-900'}`}
      >
        {status === 'loading' ? 'Processing...' : 'Pay (Mock)'}
      </button>
      {message && (
        <div className={`mt-3 p-2 rounded ${status === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
