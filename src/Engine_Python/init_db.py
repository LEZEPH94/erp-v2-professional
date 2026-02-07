# src/Engine_Python/init_db.py
from database import SessionLocal, engine
import models

# 1. On s'assure que les tables existent
models.Base.metadata.create_all(bind=engine)

# 2. La liste des comptes essentiels (Plan Comptable Simplifié)
plan_comptable = [
    # CLASSE 1 : Capitaux
    {"code": "101000", "name": "Capital social", "type": "PASSIF"},
    {"code": "120000", "name": "Résultat de l'exercice", "type": "PASSIF"},
    
    # CLASSE 4 : Tiers & État
    {"code": "401000", "name": "Fournisseurs", "type": "PASSIF"},
    {"code": "411000", "name": "Clients", "type": "ACTIF"},
    {"code": "445660", "name": "TVA Déductible (Achats)", "type": "ACTIF"},
    {"code": "445710", "name": "TVA Collectée (Ventes)", "type": "PASSIF"},
    {"code": "445510", "name": "TVA à décaisser", "type": "PASSIF"},

    # CLASSE 5 : Financier (On a déjà créé le 512, on gère le doublon)
    {"code": "512000", "name": "Banque Nationale", "type": "ACTIF"},
    {"code": "530000", "name": "Caisse", "type": "ACTIF"},

    # CLASSE 6 : Charges
    {"code": "606000", "name": "Achats de marchandises", "type": "CHARGE"},
    {"code": "607000", "name": "Achats de matières premières", "type": "CHARGE"},
    {"code": "626000", "name": "Frais postaux et télécoms", "type": "CHARGE"},

    # CLASSE 7 : Produits
    {"code": "701000", "name": "Ventes de produits finis", "type": "PRODUIT"},
    {"code": "706000", "name": "Prestations de services", "type": "PRODUIT"},
]

def init_db():
    db = SessionLocal()
    print("🚀 Démarrage de l'initialisation du Plan Comptable...")
    
    compteur = 0
    for compte in plan_comptable:
        # Vérifier si le compte existe déjà pour ne pas planter
        existant = db.query(models.Account).filter(models.Account.code == compte["code"]).first()
        
        if not existant:
            nouveau = models.Account(
                code=compte["code"],
                name=compte["name"],
                type=compte["type"]
            )
            db.add(nouveau)
            compteur += 1
            print(f"   ✅ Création : {compte['code']} - {compte['name']}")
        else:
            print(f"   ⚠️  Déjà existant : {compte['code']}")

    db.commit()
    db.close()
    print(f"🏁 Terminé ! {compteur} comptes ajoutés.")

if __name__ == "__main__":
    init_db()