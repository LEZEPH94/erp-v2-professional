import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- ECRAN DE LOGIN ---
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("admin@erp.com");
  const [password, setPassword] = useState("");
  
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) onLogin(data.token);
      else alert("Erreur identifiants");
    } catch (err) { alert("Erreur serveur"); }
  }

  return (
    <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#ecf0f1'}}>
      <form onSubmit={handleLogin} style={{background:'white', padding:'40px', borderRadius:'10px', width:'300px', boxShadow:'0 4px 10px rgba(0,0,0,0.1)'}}>
        <h2 style={{textAlign:'center', color:'#2c3e50'}}>🔐 ERP V2</h2>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={{width:'100%', padding:'10px', marginBottom:'10px', boxSizing:'border-box'}}/>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mot de passe" style={{width:'100%', padding:'10px', marginBottom:'20px', boxSizing:'border-box'}}/>
        <button type="submit" style={{width:'100%', padding:'10px', background:'#2980b9', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Se Connecter</button>
      </form>
    </div>
  )
}

// --- DASHBOARD PRINCIPAL ---
function App() {
  const [token, setToken] = useState(localStorage.getItem('erp_token'));
  if (!token) return <LoginScreen onLogin={(t) => { localStorage.setItem('erp_token', t); setToken(t); }} />;
  return <Dashboard token={token} onLogout={() => { localStorage.removeItem('erp_token'); setToken(null); }} />;
}

function Dashboard({ token, onLogout }) {
  // Navigation : 'finance' ou 'stock'
  const [view, setView] = useState('finance');

  // --- ETAT FINANCE ---
  const [mode, setMode] = useState('vente'); 
  const [formData, setFormData] = useState({ reference: "", description: "", montant_ht: "" })
  const [journal, setJournal] = useState([]);
  const [kpi, setKpi] = useState({ ca_total: 0, depenses_total: 0, benefice_net: 0 });

  // --- ETAT STOCK ---
  const [stock, setStock] = useState([]);
  const [productForm, setProductForm] = useState({ name: "", price: "", quantity: "" });

  useEffect(() => { 
    fetchFinance(); 
    fetchStock();
  }, []);

  // --- API CALLS ---
  const fetchFinance = async () => {
    try {
      const resJournal = await fetch('http://localhost:3000/compta/ecritures');
      setJournal(await resJournal.json());
      const resKpi = await fetch('http://localhost:3000/compta/kpi');
      setKpi(await resKpi.json());
    } catch (e) { console.error(e); }
  }

  const fetchStock = async () => {
    try {
      const res = await fetch('http://localhost:3000/stock'); // Nouvelle route !
      setStock(await res.json());
    } catch (e) { console.error(e); }
  }

  // --- HANDLERS ---
  const handleFinanceSubmit = async (e) => {
    e.preventDefault();
    const url = mode === 'vente' ? 'http://localhost:3000/compta/facture' : 'http://localhost:3000/compta/depense';
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, montant_ht: parseFloat(formData.montant_ht) })
    });
    setFormData({ reference: "", description: "", montant_ht: "" });
    fetchFinance();
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:3000/stock/produit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: productForm.name, 
        price: parseFloat(productForm.price), 
        quantity: parseInt(productForm.quantity) 
      })
    });
    setProductForm({ name: "", price: "", quantity: "" });
    fetchStock(); // Rafraîchir la liste
  }

  const chartData = [{ name: 'Résultat', Recettes: kpi.ca_total, Dépenses: kpi.depenses_total }];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* HEADER & NAVIGATION */}
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '30px', paddingBottom:'20px', borderBottom:'1px solid #eee' }}>
        <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
            <h1 style={{ color: '#2c3e50', margin:0 }}>🚀 ERP V2</h1>
            <nav style={{display:'flex', gap:'10px'}}>
                <button onClick={() => setView('finance')} style={{padding:'10px 20px', border:'none', background: view==='finance'?'#2980b9':'#ecf0f1', color: view==='finance'?'white':'black', borderRadius:'20px', cursor:'pointer', fontWeight:'bold'}}>📊 FINANCE</button>
                <button onClick={() => setView('stock')} style={{padding:'10px 20px', border:'none', background: view==='stock'?'#e67e22':'#ecf0f1', color: view==='stock'?'white':'black', borderRadius:'20px', cursor:'pointer', fontWeight:'bold'}}>📦 STOCK</button>
            </nav>
        </div>
        <button onClick={onLogout} style={{ background:'#c0392b', color:'white', border:'none', padding:'8px 15px', borderRadius:'5px', cursor:'pointer'}}>Déconnexion</button>
      </header>

      {/* VUE : FINANCE */}
      {view === 'finance' && (
        <>
          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: '#27ae60', color: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
              <h3>💰 Ventes</h3> <p style={{ fontSize: '28px', fontWeight:'bold' }}>{kpi.ca_total?.toFixed(2)} €</p>
            </div>
            <div style={{ background: '#e74c3c', color: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
              <h3>💸 Dépenses</h3> <p style={{ fontSize: '28px', fontWeight:'bold' }}>{kpi.depenses_total?.toFixed(2)} €</p>
            </div>
            <div style={{ background: kpi.benefice_net >= 0 ? '#f1c40f' : '#2c3e50', color: kpi.benefice_net >= 0 ? 'black' : 'white', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
              <h3>⚖️ BÉNÉFICE</h3> <p style={{ fontSize: '28px', fontWeight:'bold' }}>{kpi.benefice_net?.toFixed(2)} €</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '40px' }}>
            <div style={{ height: '400px', background:'white', border:'1px solid #ddd', padding:'20px', borderRadius:'10px' }}>
              <h3 style={{marginTop:0}}>Balance Financière</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="name"/>
                  <YAxis/>
                  <Tooltip/>
                  <Legend/>
                  <Bar dataKey="Recettes" fill="#27ae60" />
                  <Bar dataKey="Dépenses" fill="#e74c3c" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: mode === 'vente' ? '#e9f7ef' : '#fdedec', padding: '20px', borderRadius: '10px', border: '1px solid #ccc' }}>
              <div style={{ display:'flex', marginBottom:'15px', background:'white', borderRadius:'5px', overflow:'hidden' }}>
                <button onClick={()=>setMode('vente')} style={{ flex:1, padding:'10px', border:'none', background: mode==='vente'?'#27ae60':'#ecf0f1', color: mode==='vente'?'white':'black', cursor:'pointer', fontWeight:'bold' }}>VENTE</button>
                <button onClick={()=>setMode('depense')} style={{ flex:1, padding:'10px', border:'none', background: mode==='depense'?'#e74c3c':'#ecf0f1', color: mode==='depense'?'white':'black', cursor:'pointer', fontWeight:'bold' }}>DÉPENSE</button>
              </div>
              <form onSubmit={handleFinanceSubmit}>
                <input placeholder="Réf (ex: FACT-01)" value={formData.reference} onChange={e=>setFormData({...formData, reference:e.target.value})} style={{display:'block', width:'100%', marginBottom:'10px', padding:'10px', boxSizing:'border-box'}} />
                <input placeholder="Description" value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} style={{display:'block', width:'100%', marginBottom:'10px', padding:'10px', boxSizing:'border-box'}} />
                <input type="number" placeholder="Montant HT" value={formData.montant_ht} onChange={e=>setFormData({...formData, montant_ht:e.target.value})} style={{display:'block', width:'100%', marginBottom:'10px', padding:'10px', boxSizing:'border-box', fontWeight:'bold'}} />
                <button type="submit" style={{width:'100%', padding:'12px', background: mode==='vente'?'#27ae60':'#c0392b', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontSize:'16px', fontWeight:'bold'}}>
                  {mode === 'vente' ? "VALIDER VENTE" : "VALIDER DÉPENSE"}
                </button>
              </form>
            </div>
          </div>

          <div>
            <h3>📜 Historique des Opérations</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow:'0 2px 5px rgba(0,0,0,0.1)' }}>
              <thead style={{ background: '#34495e', color: 'white' }}>
                <tr><th style={{padding:'10px', textAlign:'left'}}>ID</th><th style={{padding:'10px', textAlign:'left'}}>Réf</th><th style={{padding:'10px', textAlign:'left'}}>Desc</th><th style={{padding:'10px', textAlign:'center'}}>Document</th></tr>
              </thead>
              <tbody>
                {journal.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #eee', background:'white' }}>
                    <td style={{padding:'10px', color:'#7f8c8d'}}>#{row.id}</td>
                    <td style={{padding:'10px', fontWeight:'bold'}}>{row.reference}</td>
                    <td style={{padding:'10px'}}>{row.description}</td>
                    <td style={{padding:'10px', textAlign:'center'}}>
                       <a href={`http://localhost:3000/compta/facture/${row.id}/pdf`} target="_blank" style={{background:'#e74c3c', color:'white', padding:'5px 10px', borderRadius:'4px', textDecoration:'none', fontSize:'12px', fontWeight:'bold', display:'inline-block'}}>
                         📄 PDF
                       </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* VUE : STOCK (NOUVEAU !) */}
      {view === 'stock' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          
          {/* LISTE DES PRODUITS */}
          <div>
            <h2 style={{color:'#e67e22'}}>📦 Inventaire</h2>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'20px'}}>
                {stock.length === 0 && <p style={{color:'#7f8c8d'}}>Aucun produit en stock.</p>}
                
                {stock.map(prod => (
                    <div key={prod.id} style={{background:'white', padding:'20px', borderRadius:'10px', border:'1px solid #ddd', textAlign:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                        <div style={{fontSize:'40px'}}>📦</div>
                        <h3 style={{margin:'10px 0'}}>{prod.name}</h3>
                        <p style={{color:'#27ae60', fontWeight:'bold', fontSize:'18px'}}>{prod.price} €</p>
                        <div style={{background:'#ecf0f1', padding:'5px', borderRadius:'5px', display:'inline-block'}}>
                            Stock : <strong>{prod.quantity}</strong>
                        </div>
                    </div>
                ))}
            </div>
          </div>

          {/* FORMULAIRE AJOUT PRODUIT */}
          <div style={{background:'#fdf2e9', padding:'20px', borderRadius:'10px', border:'1px solid #e67e22', height:'fit-content'}}>
            <h3 style={{marginTop:0, color:'#d35400'}}>➕ Nouveau Produit</h3>
            <form onSubmit={handleProductSubmit}>
                <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Nom du Produit</label>
                <input placeholder="Ex: Ordinateur Dell" value={productForm.name} onChange={e=>setProductForm({...productForm, name:e.target.value})} style={{width:'100%', padding:'10px', marginBottom:'15px', boxSizing:'border-box'}} required />
                
                <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Prix de Vente (€)</label>
                <input type="number" placeholder="0.00" value={productForm.price} onChange={e=>setProductForm({...productForm, price:e.target.value})} style={{width:'100%', padding:'10px', marginBottom:'15px', boxSizing:'border-box'}} required />
                
                <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Quantité Initiale</label>
                <input type="number" placeholder="0" value={productForm.quantity} onChange={e=>setProductForm({...productForm, quantity:e.target.value})} style={{width:'100%', padding:'10px', marginBottom:'20px', boxSizing:'border-box'}} required />

                <button type="submit" style={{width:'100%', padding:'12px', background:'#e67e22', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontSize:'16px', fontWeight:'bold'}}>
                    AJOUTER AU STOCK
                </button>
            </form>
          </div>

        </div>
      )}

    </div>
  )
}

export default App