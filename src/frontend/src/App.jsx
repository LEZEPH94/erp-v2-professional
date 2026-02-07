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
  const [mode, setMode] = useState('vente'); // 'vente' ou 'depense'
  const [formData, setFormData] = useState({ reference: "", description: "", montant_ht: "" })
  const [journal, setJournal] = useState([]);
  const [kpi, setKpi] = useState({ ca_total: 0, depenses_total: 0, benefice_net: 0 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const resJournal = await fetch('http://localhost:3000/compta/ecritures');
      const dataJournal = await resJournal.json();
      setJournal(dataJournal); // Si erreur ici, le tableau sera vide

      const resKpi = await fetch('http://localhost:3000/compta/kpi');
      const dataKpi = await resKpi.json();
      setKpi(dataKpi);
    } catch (e) {
      console.error("Erreur chargement données", e);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = mode === 'vente' ? 'http://localhost:3000/compta/facture' : 'http://localhost:3000/compta/depense';
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, montant_ht: parseFloat(formData.montant_ht) })
    });
    setFormData({ reference: "", description: "", montant_ht: "" }); // Reset form
    fetchData();
  }

  const chartData = [{ name: 'Résultat', Recettes: kpi.ca_total, Dépenses: kpi.depenses_total }];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '30px', paddingBottom:'20px', borderBottom:'1px solid #eee' }}>
        <h1 style={{ color: '#2c3e50', margin:0 }}>🚀 Pilotage Financier</h1>
        <button onClick={onLogout} style={{ background:'#c0392b', color:'white', border:'none', padding:'8px 15px', borderRadius:'5px', cursor:'pointer'}}>Déconnexion</button>
      </header>

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
        {/* GRAPHIQUE */}
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

        {/* FORMULAIRE */}
        <div style={{ background: mode === 'vente' ? '#e9f7ef' : '#fdedec', padding: '20px', borderRadius: '10px', border: '1px solid #ccc' }}>
          <div style={{ display:'flex', marginBottom:'15px', background:'white', borderRadius:'5px', overflow:'hidden' }}>
            <button onClick={()=>setMode('vente')} style={{ flex:1, padding:'10px', border:'none', background: mode==='vente'?'#27ae60':'#ecf0f1', color: mode==='vente'?'white':'black', cursor:'pointer', fontWeight:'bold' }}>VENTE</button>
            <button onClick={()=>setMode('depense')} style={{ flex:1, padding:'10px', border:'none', background: mode==='depense'?'#e74c3c':'#ecf0f1', color: mode==='depense'?'white':'black', cursor:'pointer', fontWeight:'bold' }}>DÉPENSE</button>
          </div>
          <form onSubmit={handleSubmit}>
            <input placeholder="Réf (ex: FACT-01)" value={formData.reference} onChange={e=>setFormData({...formData, reference:e.target.value})} style={{display:'block', width:'100%', marginBottom:'10px', padding:'10px', boxSizing:'border-box'}} />
            <input placeholder="Description" value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} style={{display:'block', width:'100%', marginBottom:'10px', padding:'10px', boxSizing:'border-box'}} />
            <input type="number" placeholder="Montant HT" value={formData.montant_ht} onChange={e=>setFormData({...formData, montant_ht:e.target.value})} style={{display:'block', width:'100%', marginBottom:'10px', padding:'10px', boxSizing:'border-box', fontWeight:'bold'}} />
            <button type="submit" style={{width:'100%', padding:'12px', background: mode==='vente'?'#27ae60':'#c0392b', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontSize:'16px', fontWeight:'bold'}}>
              {mode === 'vente' ? "VALIDER VENTE" : "VALIDER DÉPENSE"}
            </button>
          </form>
        </div>
      </div>

      {/* TABLEAU */}
      <div>
        <h3>📜 Historique des Opérations</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow:'0 2px 5px rgba(0,0,0,0.1)' }}>
          <thead style={{ background: '#34495e', color: 'white' }}>
            <tr><th style={{padding:'10px', textAlign:'left'}}>ID</th><th style={{padding:'10px', textAlign:'left'}}>Réf</th><th style={{padding:'10px', textAlign:'left'}}>Desc</th><th style={{padding:'10px', textAlign:'center'}}>Document</th></tr>
          </thead>
          
          {/* C'EST ICI QUE C'EST CORRIGÉ */}
          <tbody>
            {journal.map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid #eee', background:'white' }}>
                <td style={{padding:'10px', color:'#7f8c8d'}}>#{row.id}</td>
                <td style={{padding:'10px', fontWeight:'bold'}}>{row.reference}</td>
                <td style={{padding:'10px'}}>{row.description}</td>
                <td style={{padding:'10px', textAlign:'center'}}>
                   {/* BOUTON PDF (FORCE) : S'affiche tout le temps ! */}
                   <a href={`http://localhost:3000/compta/facture/${row.id}/pdf`} target="_blank" style={{background:'#e74c3c', color:'white', padding:'5px 10px', borderRadius:'4px', textDecoration:'none', fontSize:'12px', fontWeight:'bold', display:'inline-block'}}>
                     📄 PDF
                   </a>
                </td>
              </tr>
            ))}
          </tbody>
          
        </table>
      </div>
    </div>
  )
}

export default App