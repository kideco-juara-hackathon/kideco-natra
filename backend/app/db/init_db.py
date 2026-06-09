from sqlalchemy.orm import Session

from app.db.models import Base
from app.db.seed import seed_demo_data
from app.db.session import engine


def init_db(db: Session) -> None:
    Base.metadata.create_all(bind=engine)
    seed_demo_data(db)
