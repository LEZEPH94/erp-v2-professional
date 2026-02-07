# src/Engine_Python/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# --- 1. LE PLAN COMPTABLE (Chart of Accounts) ---
class Account(Base):
    __tablename__ = "accounting_accounts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True) # Ex: "411000"
    name = Column(String)                          # Ex: "Clients Divers"
    type = Column(String)                          # Ex: "ACTIF", "PASSIF", "CHARGE", "PRODUIT"
    
    # Relation : Un compte a plusieurs lignes d'écritures
    items = relationship("JournalItem", back_populates="account")

# --- 2. L'ÉCRITURE COMPTABLE (Journal Entry - En-tête) ---
class JournalEntry(Base):
    __tablename__ = "accounting_entries"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    reference = Column(String, index=True) # Ex: "FACT-2026-001"
    description = Column(String)           # Ex: "Vente de services informatiques"
    status = Column(String, default="DRAFT") # DRAFT (Brouillon) ou POSTED (Validé)

    # Relation : Une écriture a plusieurs lignes (Débit/Crédit)
    items = relationship("JournalItem", back_populates="entry")

# --- 3. LA LIGNE D'ÉCRITURE (Journal Item - Détail) ---
class JournalItem(Base):
    __tablename__ = "accounting_items"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("accounting_entries.id"))
    account_id = Column(Integer, ForeignKey("accounting_accounts.id"))
    
    description = Column(String) # Libellé de la ligne
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)

    # Relations inverses
    entry = relationship("JournalEntry", back_populates="items")
    account = relationship("Account", back_populates="items")