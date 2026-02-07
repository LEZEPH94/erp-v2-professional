from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from datetime import datetime
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from starlette.responses import StreamingResponse

# --- CONFIGURATION BASE DE DONNÉES ---
DATABASE_URL = "postgresql://user:password@database/erp_v2_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODÈLES (TABLES) ---
class JournalEntry(Base):
    __tablename__ = "JournalEntry"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    reference = Column(String, unique=True, index=True)
    description = Column(String)
    status = Column(String, default="DRAFT")
    items = relationship("JournalItem", back_populates="entry")

class JournalItem(Base):
    __tablename__ = "JournalItem"
    id = Column(Integer, primary_key=True, index=True)
    journalEntryId = Column(Integer, ForeignKey("JournalEntry.id"))
    account_id = Column(String)
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)
    entry = relationship("JournalEntry", back_populates="items")
class Product(Base):
    __tablename__ = "Product"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    price = Column(Float)
    quantity = Column(Integer, default=0)

Base.metadata.create_all(bind=engine)

# --- API FASTAPI ---
app = FastAPI()

# Dépendance pour avoir la DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Modèle de données reçu du Frontend
class FactureRequest(BaseModel):
    reference: str      # <--- "str" en minuscules (Python standard)
    description: str    # <--- "str" en minuscules
    montant_ht: float

# --- ROUTE 1 : CRÉER FACTURE (VENTE) ---
@app.post("/compta/facture")
def creer_facture(facture: FactureRequest, db: Session = Depends(get_db)):
    # 1. Création de l'écriture comptable
    entry = JournalEntry(reference=facture.reference, description=facture.description, status="VALIDATED")
    db.add(entry)
    
    # 2. Gestion automatique du STOCK (Nouveau !)
    # On cherche si un produit porte le même nom que la description
    produit = db.query(Product).filter(Product.name == facture.description).first()
    if produit:
        produit.quantity -= 1  # On vend, donc on retire 1 du stock
    
    db.commit() # On sauvegarde tout (Compta + Stock)

    # 3. Écritures comptables
    tva = facture.montant_ht * 0.20
    ttc = facture.montant_ht + tva
    ligne_client = JournalItem(journalEntryId=entry.id, account_id="411", debit=ttc, credit=0)
    ligne_vente = JournalItem(journalEntryId=entry.id, account_id="701", debit=0, credit=facture.montant_ht)
    ligne_tva = JournalItem(journalEntryId=entry.id, account_id="445", debit=0, credit=tva)

    db.add_all([ligne_client, ligne_vente, ligne_tva])
    db.commit()
    
    return {"message": "Vente validée et Stock mis à jour", "entry_id": entry.id}

# --- ROUTE 2 : CRÉER DÉPENSE (ACHAT) ---
@app.post("/compta/depense")
def creer_depense(facture: FactureRequest, db: Session = Depends(get_db)):
    # 1. Création de l'écriture
    entry = JournalEntry(reference=facture.reference, description=facture.description, status="VALIDATED")
    db.add(entry)

    # 2. Gestion automatique du STOCK (Nouveau !)
    produit = db.query(Product).filter(Product.name == facture.description).first()
    if produit:
        produit.quantity += 1  # On achète, donc on ajoute 1 au stock

    db.commit()

    # 3. Écritures comptables
    ligne_charge = JournalItem(journalEntryId=entry.id, account_id="601", debit=facture.montant_ht, credit=0)
    ligne_fournisseur = JournalItem(journalEntryId=entry.id, account_id="401", debit=0, credit=facture.montant_ht)

    db.add_all([ligne_charge, ligne_fournisseur])
    db.commit()

    return {"message": "Dépense enregistrée et Stock mis à jour", "entry_id": entry.id}

# --- ROUTE 3 : LECTURE JOURNAL ---
@app.get("/compta/ecritures")
def lire_journal(db: Session = Depends(get_db)):
    return db.query(JournalEntry).order_by(JournalEntry.id.desc()).limit(20).all()

# --- ROUTE 4 : KPI & BÉNÉFICE ---
@app.get("/compta/kpi")
def get_kpi(db: Session = Depends(get_db)):
    # Ventes (701 Crédit)
    total_ventes = db.query(func.sum(JournalItem.credit)).filter(JournalItem.account_id == "701").scalar() or 0
    # Dépenses (601 Débit)
    total_depenses = db.query(func.sum(JournalItem.debit)).filter(JournalItem.account_id == "601").scalar() or 0
    # TVA (445 Crédit)
    total_tva = db.query(func.sum(JournalItem.credit)).filter(JournalItem.account_id == "445").scalar() or 0
    
    benefice = total_ventes - total_depenses

    return {
        "ca_total": total_ventes,
        "depenses_total": total_depenses,
        "benefice_net": benefice,
        "tva_total": total_tva
    }

# --- ROUTE STOCK : AJOUTER PRODUIT ---
class ProductRequest(BaseModel):
    name: str
    price: float
    quantity: int

@app.post("/stock/produit")
def creer_produit(produit: ProductRequest, db: Session = Depends(get_db)):
    # Vérifie si le produit existe déjà
    existing = db.query(Product).filter(Product.name == produit.name).first()
    if existing:
        # Si oui, on met à jour la quantité et le prix
        existing.quantity += produit.quantity
        existing.price = produit.price # Mise à jour du prix
        db.commit()
        return {"message": "Stock mis à jour", "id": existing.id, "new_quantity": existing.quantity}
    else:
        # Sinon, on crée le produit
        new_product = Product(name=produit.name, price=produit.price, quantity=produit.quantity)
        db.add(new_product)
        db.commit()
        return {"message": "Produit créé", "id": new_product.id}

# --- ROUTE STOCK : LIRE STOCK ---
@app.get("/stock")
def lire_stock(db: Session = Depends(get_db)):
    return db.query(Product).all()
# --- ROUTE 5 : GÉNÉRER PDF ---
@app.get("/compta/facture/{id}/pdf")
def generer_pdf(id: int, db: Session = Depends(get_db)):
    facture = db.query(JournalEntry).filter(JournalEntry.id == id).first()
    if not facture: raise HTTPException(status_code=404, detail="Facture introuvable")

    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    
    p.setFont("Helvetica-Bold", 20)
    p.drawString(50, 800, "ERP V2 PROFESSIONAL")
    p.setFont("Helvetica", 12)
    p.drawString(50, 750, f"Réf : {facture.reference}")
    p.drawString(50, 730, f"Desc : {facture.description}")
    p.line(50, 690, 500, 690)
    
    y = 650
    for ligne in facture.items:
        montant = ligne.debit if ligne.debit > 0 else ligne.credit
        sens = "Débit" if ligne.debit > 0 else "Crédit"
        p.drawString(50, y, f"Compte {ligne.account_id} : {montant} € ({sens})")
        y -= 20

    p.showPage()
    p.save()
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={facture.reference}.pdf"})
