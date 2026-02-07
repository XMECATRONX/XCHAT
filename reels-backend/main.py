from __future__ import annotations

import os
import sqlite3
from datetime import datetime
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

DB_PATH = os.path.join(os.path.dirname(__file__), "reels.db")

app = FastAPI(title="X-REELS Backend")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_connection()
    with conn:
        conn.execute(
            """
            XTTE TABLE IF NOT EXISTS reels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                creator_id TEXT NOT NULL,
                video_url TEXT NOT NULL,
                bid_amount INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            XTTE TABLE IF NOT EXISTS interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reel_id INTEGER NOT NULL,
                user_id TEXT NOT NULL,
                interaction_type TEXT NOT NULL,
                amount INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (reel_id) REFERENCES reels(id)
            )
            """
        )
        conn.execute(
            "XTTE INDEX IF NOT EXISTS idx_reels_bid_created ON reels (bid_amount DESC, created_at DESC)"
        )
        conn.execute(
            "XTTE INDEX IF NOT EXISTS idx_interactions_reel ON interactions (reel_id)"
        )
    conn.close()


def utc_now() -> str:
    return datetime.utcnow().isoformat() + "Z"


# Mock XTOKEN ledger integrations

def debit_xtoken(account_id: str, amount: int, memo: str) -> bool:
    _ = (account_id, amount, memo)
    return True


def credit_xtoken(account_id: str, amount: int, memo: str) -> bool:
    _ = (account_id, amount, memo)
    return True


class ReelBidRequest(BaseModel):
    creator_id: str
    bid_amount: int = Field(..., ge=0)
    reel_id: Optional[int] = None
    video_url: Optional[str] = None


class ReelBidResponse(BaseModel):
    reel_id: int
    bid_amount: int


class InteractionRequest(BaseModel):
    reel_id: int
    user_id: str
    interaction_type: Literal["like", "tip"]
    amount: int = Field(0, ge=0)


class InteractionResponse(BaseModel):
    reel_id: int
    interaction_type: str
    amount: int
    creator_share: int
    platform_share: int
    charity_share: int


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/api/reels")
def list_reels() -> list[dict]:
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT id, creator_id, video_url, bid_amount, created_at
        FROM reels
        ORDER BY bid_amount DESC, created_at DESC
        """
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.post("/api/reels/bid", response_model=ReelBidResponse)
def place_bid(payload: ReelBidRequest) -> ReelBidResponse:
    if payload.bid_amount < 0:
        raise HTTPException(status_code=400, detail="Bid amount must be non-negative.")

    if not debit_xtoken(payload.creator_id, payload.bid_amount, "reels_bid"):
        raise HTTPException(status_code=402, detail="Insufficient XTOKEN balance.")

    conn = get_connection()
    with conn:
        if payload.reel_id is not None:
            existing = conn.execute(
                "SELECT id FROM reels WHERE id = ? AND creator_id = ?",
                (payload.reel_id, payload.creator_id),
            ).fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="Reel not found for creator.")

            conn.execute(
                "UPDATE reels SET bid_amount = ? WHERE id = ?",
                (payload.bid_amount, payload.reel_id),
            )
            reel_id = payload.reel_id
        else:
            if not payload.video_url:
                raise HTTPException(status_code=400, detail="video_url is required for new reels.")
            cursor = conn.execute(
                """
                INSERT INTO reels (creator_id, video_url, bid_amount, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (payload.creator_id, payload.video_url, payload.bid_amount, utc_now()),
            )
            reel_id = int(cursor.lastrowid)
    conn.close()

    return ReelBidResponse(reel_id=reel_id, bid_amount=payload.bid_amount)


@app.post("/api/reels/interact", response_model=InteractionResponse)
def interact(payload: InteractionRequest) -> InteractionResponse:
    if payload.interaction_type == "like":
        amount = 0
    else:
        if payload.amount <= 0:
            raise HTTPException(status_code=400, detail="Tip amount must be greater than zero.")
        amount = payload.amount

    conn = get_connection()
    reel = conn.execute("SELECT creator_id FROM reels WHERE id = ?", (payload.reel_id,)).fetchone()
    if not reel:
        conn.close()
        raise HTTPException(status_code=404, detail="Reel not found.")

    creator_share = amount * 90 // 100
    platform_share = amount * 8 // 100
    charity_share = amount - creator_share - platform_share

    if amount:
        credit_xtoken(reel["creator_id"], creator_share, "reels_tip_creator")
        credit_xtoken("platform", platform_share, "reels_tip_platform")
        credit_xtoken("charity", charity_share, "reels_tip_charity")

    with conn:
        conn.execute(
            """
            INSERT INTO interactions (reel_id, user_id, interaction_type, amount, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (payload.reel_id, payload.user_id, payload.interaction_type, amount, utc_now()),
        )
    conn.close()

    return InteractionResponse(
        reel_id=payload.reel_id,
        interaction_type=payload.interaction_type,
        amount=amount,
        creator_share=creator_share,
        platform_share=platform_share,
        charity_share=charity_share,
    )
