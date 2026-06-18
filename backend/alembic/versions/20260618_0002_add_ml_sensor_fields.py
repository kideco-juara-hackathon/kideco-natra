"""add ML sensor fields to telemetry_records

Revision ID: 20260618_0002
Revises: 20260607_0001
Create Date: 2026-06-18
"""
from alembic import op
import sqlalchemy as sa


revision = "20260618_0002"
down_revision = "20260607_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("telemetry_records", sa.Column("lub_oil_temp_c", sa.Float(), nullable=True))
    op.add_column("telemetry_records", sa.Column("fuel_pressure_bar", sa.Float(), nullable=True))
    op.add_column("telemetry_records", sa.Column("coolant_pressure_bar", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("telemetry_records", "coolant_pressure_bar")
    op.drop_column("telemetry_records", "fuel_pressure_bar")
    op.drop_column("telemetry_records", "lub_oil_temp_c")
