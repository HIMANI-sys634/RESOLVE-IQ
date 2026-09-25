from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

import sys

STUDENT2_PATH = r"C:\Users\mohit\Downloads\Backend\student2_intelligence\student2-intelligence"

if STUDENT2_PATH not in sys.path:
    sys.path.insert(0, STUDENT2_PATH)

from main import analyze_complaints


router = APIRouter(prefix="/intelligence", tags=["intelligence"])


@router.get("/analyze")
def analyze_all_complaints(db: Session = Depends(get_db)):
    complaints = db.query(models.Complaint).all()

    complaint_data = [
        {
            "complaint_id": complaint.complaint_id,
            "text": complaint.text,
            "customer_id": complaint.customer_id,
            "order_id": complaint.order_id,
            "created_at": complaint.timestamp.isoformat(),
        }
        for complaint in complaints
    ]

    return analyze_complaints(complaint_data)
