from fastapi import APIRouter

from app.repositories.seed_loader import load_seed

router = APIRouter()


@router.get("/nodes")
def get_nodes():
    return load_seed("nodes.json")


@router.get("/edges")
def get_edges():
    return load_seed("edges.json")
